/**
 * SLA Monitor Scheduled Job (GAP-006, GAP-010)
 *
 * Runs every 15 minutes to:
 *   1. Flag npa_signoffs that have breached their SLA deadline
 *   2. Create npa_breach_alerts for newly-breached signoffs
 *   3. Log SLA_BREACHED audit entries
 *
 * Also handles validity expiry monitoring (GAP-010):
 *   - NPAs in LAUNCHED state whose validity_expiry <= NOW() get flagged
 */

const db = require('../db');

/**
 * Generate next breach alert ID using the transaction connection.
 * Queries within the same transaction so INSERTs are visible.
 */
async function generateBreachId(conn) {
    const [rows] = await conn.query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)), 0) AS max_num FROM npa_breach_alerts"
    );
    const nextNum = rows[0].max_num + 1;
    return `BR-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Check and flag SLA-breached signoffs.
 * Finds PENDING signoffs past their deadline that haven't been flagged yet.
 */
async function checkSlaBreaches() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Find signoffs that are past SLA but not yet flagged
        const [breached] = await conn.query(`
            SELECT s.id, s.project_id, s.party, s.department, s.sla_deadline,
                   p.title as npa_title
            FROM npa_signoffs s
            JOIN npa_projects p ON p.id = s.project_id
            WHERE s.status IN ('PENDING', 'UNDER_REVIEW', 'CLARIFICATION_NEEDED')
              AND s.sla_deadline IS NOT NULL
              AND NOW() > s.sla_deadline
              AND s.sla_breached = 0
        `);

        if (breached.length === 0) {
            await conn.commit();
            return { breaches_found: 0 };
        }

        for (const row of breached) {
            // Mark signoff as breached
            await conn.query(
                'UPDATE npa_signoffs SET sla_breached = 1 WHERE id = ?',
                [row.id]
            );

            // Calculate hours overdue
            const deadlineMs = new Date(row.sla_deadline).getTime();
            const hoursOverdue = Math.round((Date.now() - deadlineMs) / (1000 * 60 * 60));

            // Determine severity based on hours overdue
            let severity = 'WARNING';
            if (hoursOverdue >= 48) severity = 'CRITICAL';

            // Create breach alert (pass conn so INSERT is visible within transaction)
            const breachId = await generateBreachId(conn);
            await conn.query(
                `INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, sla_hours, status, triggered_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', NOW())`,
                [
                    breachId,
                    row.project_id,
                    `SLA Breach: ${row.party} signoff overdue`,
                    severity,
                    `${row.party} (${row.department}) has not completed sign-off for "${row.npa_title}". SLA deadline was ${row.sla_deadline}. Now ${hoursOverdue}h overdue.`,
                    row.sla_deadline.toString(),
                    `${hoursOverdue}h overdue`,
                    severity === 'CRITICAL' ? 'GPH' : row.department,
                    hoursOverdue
                ]
            );

            // Audit log
            await conn.query(
                `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
                 VALUES (?, 'SYSTEM', 'SLA_BREACHED', ?, 0)`,
                [
                    row.project_id,
                    JSON.stringify({
                        signoff_id: row.id,
                        party: row.party,
                        department: row.department,
                        sla_deadline: row.sla_deadline,
                        hours_overdue: hoursOverdue,
                        severity,
                        breach_alert_id: breachId
                    })
                ]
            );
        }

        // Update project status to 'Delayed' for any project with breached signoffs
        const projectIds = [...new Set(breached.map(r => r.project_id))];
        for (const pid of projectIds) {
            await conn.query(
                `UPDATE npa_projects SET status = 'Delayed', updated_at = NOW()
                 WHERE id = ? AND status NOT IN ('Blocked', 'Completed')`,
                [pid]
            );
        }

        await conn.commit();
        console.log(`[SLA-MONITOR] ${breached.length} new SLA breach(es) detected across ${projectIds.length} project(s)`);
        return { breaches_found: breached.length, project_ids: projectIds };
    } catch (err) {
        await conn.rollback();
        console.error('[SLA-MONITOR] Error checking SLA breaches:', err.message);
        return { error: err.message };
    } finally {
        conn.release();
    }
}

/**
 * GAP-010: Check validity expiry for launched products.
 * NPAs in LAUNCHED state with validity_expiry <= NOW() should be flagged.
 */
async function checkValidityExpiry() {
    try {
        // Only runs if validity_expiry column exists (D-001 schema fix)
        const [expired] = await db.query(`
            SELECT id, title, validity_expiry
            FROM npa_projects
            WHERE current_stage = 'LAUNCHED'
              AND validity_expiry IS NOT NULL
              AND validity_expiry <= NOW()
              AND current_stage != 'EXPIRED'
        `);

        if (expired.length === 0) return { expired_found: 0 };

        for (const npa of expired) {
            await db.query(
                `UPDATE npa_projects SET current_stage = 'EXPIRED', status = 'Completed', updated_at = NOW() WHERE id = ?`,
                [npa.id]
            );

            await db.query(
                `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
                 VALUES (?, 'SYSTEM', 'NPA_EXPIRED', ?, 0)`,
                [
                    npa.id,
                    JSON.stringify({
                        reason: 'Validity expiry reached',
                        validity_expiry: npa.validity_expiry,
                        from_stage: 'LAUNCHED',
                        to_stage: 'EXPIRED'
                    })
                ]
            );
        }

        console.log(`[SLA-MONITOR] ${expired.length} NPA(s) expired due to validity deadline`);
        return { expired_found: expired.length };
    } catch (err) {
        // If validity_expiry column doesn't exist yet (D-001 pending), silently skip
        if (err.message.includes('Unknown column')) {
            return { expired_found: 0, note: 'validity_expiry column not yet added (D-001)' };
        }
        console.error('[SLA-MONITOR] Error checking validity expiry:', err.message);
        return { error: err.message };
    }
}

/**
 * Sprint 4 (GAP-011): Check for overdue PIR reviews.
 * Marks PIR status as OVERDUE when pir_due_date has passed.
 */
async function checkPirOverdue() {
    try {
        const [overdue] = await db.query(`
            SELECT id, title, pir_due_date
            FROM npa_projects
            WHERE pir_status = 'PENDING'
              AND pir_due_date IS NOT NULL
              AND pir_due_date < NOW()
              AND current_stage = 'LAUNCHED'
        `);

        if (overdue.length === 0) return { overdue_found: 0 };

        for (const npa of overdue) {
            await db.query(
                `UPDATE npa_projects SET pir_status = 'OVERDUE', status = 'At Risk', updated_at = NOW() WHERE id = ?`,
                [npa.id]
            );
            await db.query(
                `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
                 VALUES (?, 'SYSTEM', 'PIR_OVERDUE', ?, 0)`,
                [npa.id, JSON.stringify({ pir_due_date: npa.pir_due_date, title: npa.title })]
            );
        }

        console.log(`[SLA-MONITOR] ${overdue.length} PIR(s) marked as overdue`);
        return { overdue_found: overdue.length };
    } catch (err) {
        console.error('[SLA-MONITOR] Error checking PIR overdue:', err.message);
        return { error: err.message };
    }
}

/**
 * GAP-019: Detect dormant products.
 * A product is dormant if LAUNCHED, not already EXPIRED/WITHDRAWN,
 * and has no npa_performance_metrics entries in the last 12 months.
 */
async function checkDormancy() {
    try {
        const [dormant] = await db.query(`
            SELECT p.id, p.title, p.launched_at,
                   DATEDIFF(NOW(), COALESCE(
                       (SELECT MAX(m.recorded_date) FROM npa_performance_metrics m WHERE m.project_id = p.id),
                       p.launched_at
                   )) AS days_inactive
            FROM npa_projects p
            WHERE p.current_stage = 'LAUNCHED'
              AND p.status NOT IN ('Dormant', 'Completed')
              AND NOT EXISTS (
                  SELECT 1 FROM npa_performance_metrics m
                  WHERE m.project_id = p.id
                    AND m.recorded_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
              )
              AND p.launched_at IS NOT NULL
              AND p.launched_at < DATE_SUB(NOW(), INTERVAL 12 MONTH)
        `);

        if (dormant.length === 0) return { dormant_found: 0 };

        for (const npa of dormant) {
            await db.query(
                `UPDATE npa_projects SET status = 'Dormant', updated_at = NOW() WHERE id = ?`,
                [npa.id]
            );
            await db.query(
                `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
                 VALUES (?, 'SYSTEM', 'DORMANCY_DETECTED', ?, 0)`,
                [npa.id, JSON.stringify({
                    days_inactive: npa.days_inactive,
                    launched_at: npa.launched_at,
                    title: npa.title,
                    rule: 'R34 — no transactions in 12 months'
                })]
            );
        }

        console.log(`[SLA-MONITOR] ${dormant.length} NPA(s) flagged as dormant`);
        return { dormant_found: dormant.length };
    } catch (err) {
        // Graceful degradation if npa_performance_metrics doesn't exist yet
        if (err.message.includes("doesn't exist") || err.message.includes('Unknown column')) {
            return { dormant_found: 0, note: 'npa_performance_metrics table not available' };
        }
        console.error('[SLA-MONITOR] Error checking dormancy:', err.message);
        return { error: err.message };
    }
}

/**
 * Main monitor function — runs SLA, validity, PIR, and dormancy checks.
 */
async function runSlaMonitor() {
    const slaResult = await checkSlaBreaches();
    const expiryResult = await checkValidityExpiry();
    const pirResult = await checkPirOverdue();
    const dormancyResult = await checkDormancy();
    return { sla: slaResult, expiry: expiryResult, pir: pirResult, dormancy: dormancyResult, ran_at: new Date().toISOString() };
}

// Interval handle (set by startMonitor, cleared by stopMonitor)
let intervalHandle = null;

function startMonitor(intervalMs = 15 * 60 * 1000) {
    if (intervalHandle) {
        console.warn('[SLA-MONITOR] Already running');
        return;
    }
    console.log(`[SLA-MONITOR] Starting (interval: ${intervalMs / 1000}s)`);
    // Run once immediately on startup
    runSlaMonitor().catch(err => console.error('[SLA-MONITOR] Startup run failed:', err.message));
    intervalHandle = setInterval(() => {
        runSlaMonitor().catch(err => console.error('[SLA-MONITOR] Interval run failed:', err.message));
    }, intervalMs);
}

function stopMonitor() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        console.log('[SLA-MONITOR] Stopped');
    }
}

module.exports = { runSlaMonitor, checkSlaBreaches, checkValidityExpiry, startMonitor, stopMonitor };
