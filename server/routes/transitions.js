const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkProhibitedGate, checkPacGate, enforceComplianceGates } = require('./approvals');
const { requireAuth } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');

// ─── Externalized Configs (extracted from hardcoded inline values) ───────────
const NPA_SUBTYPES = require('../config/npa-subtypes.json');
const CROSS_BORDER_PARTIES = require('../config/cross-border-parties.json');
const HEAD_OFFICE_PARTIES = require('../config/head-office-parties.json');
const NOTIONAL_THRESHOLDS = require('../config/notional-thresholds.json');

function getActorName(req, bodyActorName, fallback) {
    if (req.user?.name) return String(req.user.name);
    if (req.user?.email) return String(req.user.email);
    if (req.user?.userId) return String(req.user.userId);
    if (bodyActorName && String(bodyActorName).trim()) return String(bodyActorName).trim();
    return fallback || 'Unknown';
}

// RBAC baseline: transitions are authenticated.
router.use(requireAuth());

// ============================================================
// SPRINT 1: SERVER-SIDE STATE MACHINE (GAP-013)
// Replaces local Angular state mutations with persistent
// DB-backed transitions. Every endpoint:
//   1. Validates current_stage (prevents race conditions)
//   2. Enforces compliance gates (Sprint 0)
//   3. Uses DB transactions (BEGIN...COMMIT)
//   4. Creates audit log entry
//   5. Returns updated NPA object
// ============================================================

// ─── Audit Helper ──────────────────────────────────────────
async function auditLog(conn, projectId, actorName, actionType, details, isAgent = false) {
    await conn.query(
        `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, actorName, actionType, JSON.stringify(details), isAgent ? 1 : 0]
    );
}

// ─── Fetch full NPA (reused by all endpoints for response) ─
async function fetchNpa(projectId) {
    const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [projectId]);
    if (project.length === 0) return null;
    const [signoffs] = await db.query('SELECT * FROM npa_signoffs WHERE project_id = ? ORDER BY created_at', [projectId]);
    const [loopbacks] = await db.query('SELECT * FROM npa_loop_backs WHERE project_id = ? ORDER BY loop_back_number', [projectId]);
    const [escalations] = await db.query('SELECT * FROM npa_escalations WHERE project_id = ? ORDER BY escalated_at DESC', [projectId]);
    return {
        ...project[0],
        signoffs,
        loopbacks,
        escalations
    };
}

// ============================================================
// 1. POST /api/transitions/:id/submit
//    DRAFT → PENDING_CHECKER
//    Guards: title/description required, PAC gate for NTG,
//            prohibited gate
// ============================================================
router.post('/:id/submit', rbac('MAKER', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'Maker');
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // Validate current stage
        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        if (npa.current_stage !== 'DRAFT' && npa.current_stage !== 'INITIATION') {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot submit from stage '${npa.current_stage}'. Expected DRAFT or INITIATION.`,
                current_stage: npa.current_stage
            });
        }

        // Validate required fields
        if (!npa.title || !npa.description) {
            await conn.rollback();
            return res.status(400).json({ error: 'Title and description are required before submission.' });
        }

        // Sprint 0 compliance gates
        const gateResult = await enforceComplianceGates(projectId);
        if (gateResult.blocked) {
            await conn.rollback();
            return res.status(403).json({ error: gateResult.reason, gate: 'COMPLIANCE_BLOCK', details: gateResult });
        }

        // Transition
        await conn.query(
            `UPDATE npa_projects SET current_stage = 'PENDING_CHECKER', status = 'On Track', updated_at = NOW() WHERE id = ?`,
            [projectId]
        );

        await auditLog(conn, projectId, actor_name || npa.submitted_by, 'NPA_SUBMITTED', {
            from_stage: npa.current_stage,
            to_stage: 'PENDING_CHECKER'
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'SUBMITTED', npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION submit]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// 2. POST /api/transitions/:id/checker-approve
//    PENDING_CHECKER → PENDING_SIGN_OFFS
//    Side effect: Dynamically assigns SOP sign-off parties
//    from ref_signoff_routing_rules (GAP-004)
// ============================================================
router.post('/:id/checker-approve', rbac('CHECKER', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'Checker');
    const { comments } = req.body;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        if (npa.current_stage !== 'PENDING_CHECKER') {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot checker-approve from stage '${npa.current_stage}'. Expected PENDING_CHECKER.`,
                current_stage: npa.current_stage
            });
        }

        // Compliance gates
        const gateResult = await enforceComplianceGates(projectId);
        if (gateResult.blocked) {
            await conn.rollback();
            return res.status(403).json({ error: gateResult.reason, gate: 'COMPLIANCE_BLOCK', details: gateResult });
        }

        // ─── GAP-004: Dynamic SOP Assignment ───────────────────
        const assignedParties = await assignSignoffParties(conn, npa);

        // Transition
        await conn.query(
            `UPDATE npa_projects SET current_stage = 'PENDING_SIGN_OFFS', updated_at = NOW() WHERE id = ?`,
            [projectId]
        );

        await auditLog(conn, projectId, actor_name || 'CHECKER', 'CHECKER_APPROVED', {
            from_stage: 'PENDING_CHECKER',
            to_stage: 'PENDING_SIGN_OFFS',
            comments,
            assigned_parties: assignedParties.map(p => p.party_name)
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'CHECKER_APPROVED', assigned_parties: assignedParties.length, npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION checker-approve]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// GAP-004: Dynamic SOP Assignment Function
// Reads ref_signoff_routing_rules, applies cross-border and
// NTG overseas overrides, creates npa_signoffs rows
// ============================================================
async function assignSignoffParties(conn, npa) {
    const track = npa.approval_track || 'FULL_NPA';

    // 1. Get base routing rules for this approval track
    const [rules] = await conn.query(
        `SELECT * FROM ref_signoff_routing_rules WHERE approval_track = ? AND is_mandatory = 1 ORDER BY sequence_order, id`,
        [track]
    );

    // Build party set (use Map to deduplicate by party_name)
    const partyMap = new Map();
    for (const rule of rules) {
        partyMap.set(rule.party_name, rule);
    }

    // 1b. GAP-014: NPA Lite Sub-Type Adjustments (B1-B4)
    //     Config: server/config/npa-subtypes.json
    if (track === 'NPA_LITE' && npa.approval_track_subtype) {
        const subtype = npa.approval_track_subtype;
        const allowedParties = NPA_SUBTYPES[subtype];
        if (allowedParties) {
            // Filter down to only the allowed parties for this sub-type
            for (const [name] of partyMap) {
                if (!allowedParties.includes(name)) {
                    partyMap.delete(name);
                }
            }
            // Ensure mandatory parties exist even if not in base rules
            for (const pName of allowedParties) {
                if (!partyMap.has(pName)) {
                    partyMap.set(pName, {
                        party_name: pName,
                        party_group: `NPA_LITE_${subtype}`,
                        sla_hours: 48,
                        department: pName
                    });
                }
            }
        }
    }

    // 2. Cross-border override: force mandatory SOPs regardless of track
    //    Config: server/config/cross-border-parties.json
    if (npa.is_cross_border) {
        for (const cb of CROSS_BORDER_PARTIES.parties) {
            if (!partyMap.has(cb.party_name)) {
                partyMap.set(cb.party_name, {
                    party_name: cb.party_name,
                    party_group: 'CROSS_BORDER_OVERRIDE',
                    sla_hours: cb.sla_hours,
                    department: cb.department
                });
            }
        }
    }

    // 3. NTG from overseas → force Head Office sign-offs
    if (npa.npa_type === 'New-to-Group') {
        // Check if any non-SG jurisdiction
        const [jurisdictions] = await conn.query(
            'SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = ?',
            [npa.id]
        );
        const hasOverseas = jurisdictions.some(j => j.jurisdiction_code !== 'SG');
        if (hasOverseas) {
            // Ensure Head Office parties are included
            // Config: server/config/head-office-parties.json
            for (const ho of HEAD_OFFICE_PARTIES.parties) {
                if (!partyMap.has(ho.party_name)) {
                    partyMap.set(ho.party_name, {
                        party_name: ho.party_name,
                        party_group: 'HEAD_OFFICE_OVERRIDE',
                        sla_hours: ho.sla_hours,
                        department: ho.department
                    });
                }
            }
        }
    }

    // 4. GAP-012: Notional amount threshold checks
    //    Config: server/config/notional-thresholds.json
    const notional = parseFloat(npa.notional_amount) || 0;
    for (const threshold of NOTIONAL_THRESHOLDS.thresholds) {
        if (notional > threshold.min_amount && !partyMap.has(threshold.party_name)) {
            partyMap.set(threshold.party_name, {
                party_name: threshold.party_name,
                party_group: threshold.party_group,
                sla_hours: threshold.sla_hours,
                department: threshold.department
            });
        }
    }

    // 5. Delete existing signoffs for this project (re-assignment on resubmit)
    await conn.query('DELETE FROM npa_signoffs WHERE project_id = ?', [npa.id]);

    // 6. Insert new signoff rows
    const parties = Array.from(partyMap.values());
    for (const party of parties) {
        const department = party.department || party.party_group || '';
        const slaHours = party.sla_hours || 48;
        await conn.query(
            `INSERT INTO npa_signoffs (project_id, party, department, status, sla_deadline, sla_breached, loop_back_count, created_at)
             VALUES (?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL ? HOUR), 0, 0, NOW())`,
            [npa.id, party.party_name, department, slaHours]
        );
    }

    return parties;
}

// ============================================================
// 3. POST /api/transitions/:id/checker-return
//    PENDING_CHECKER → RETURNED_TO_MAKER
//    Reason required
// ============================================================
router.post('/:id/checker-return', rbac('CHECKER', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'Checker');
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ error: 'Reason is required for returning to maker.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        if (npa.current_stage !== 'PENDING_CHECKER') {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot return from stage '${npa.current_stage}'. Expected PENDING_CHECKER.`,
                current_stage: npa.current_stage
            });
        }

        // Get current max loop_back_number
        const [lbRows] = await conn.query(
            'SELECT COALESCE(MAX(loop_back_number), 0) as max_lb FROM npa_loop_backs WHERE project_id = ?',
            [projectId]
        );
        const nextLb = lbRows[0].max_lb + 1;

        // Insert loop-back record
        await conn.query(
            `INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, requires_npa_changes, routed_to, initiated_at, delay_days)
             VALUES (?, ?, 'CHECKER_REJECTION', 'Checker', ?, ?, 1, 'MAKER', NOW(), 0)`,
            [projectId, nextLb, actor_name || 'CHECKER', reason]
        );

        await conn.query(
            `UPDATE npa_projects SET current_stage = 'RETURNED_TO_MAKER', status = 'At Risk', updated_at = NOW() WHERE id = ?`,
            [projectId]
        );

        await auditLog(conn, projectId, actor_name || 'CHECKER', 'CHECKER_RETURNED', {
            from_stage: 'PENDING_CHECKER',
            to_stage: 'RETURNED_TO_MAKER',
            reason,
            loop_back_number: nextLb
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'RETURNED_TO_MAKER', loop_back_number: nextLb, npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION checker-return]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// 4. POST /api/transitions/:id/resubmit
//    RETURNED_TO_MAKER → PENDING_CHECKER
//    Maker fixes issues and resubmits
// ============================================================
router.post('/:id/resubmit', rbac('MAKER', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'Maker');
    const { changes_made } = req.body;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        if (npa.current_stage !== 'RETURNED_TO_MAKER') {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot resubmit from stage '${npa.current_stage}'. Expected RETURNED_TO_MAKER.`,
                current_stage: npa.current_stage
            });
        }

        // Compliance gates
        const gateResult = await enforceComplianceGates(projectId);
        if (gateResult.blocked) {
            await conn.rollback();
            return res.status(403).json({ error: gateResult.reason, gate: 'COMPLIANCE_BLOCK', details: gateResult });
        }

        // Resolve open loop-backs
        await conn.query(
            `UPDATE npa_loop_backs SET resolved_at = NOW(), resolution_type = 'MAKER_FIXED', resolution_details = ?
             WHERE project_id = ? AND resolved_at IS NULL`,
            [changes_made || 'Changes made by maker', projectId]
        );

        await conn.query(
            `UPDATE npa_projects SET current_stage = 'PENDING_CHECKER', status = 'On Track', updated_at = NOW() WHERE id = ?`,
            [projectId]
        );

        await auditLog(conn, projectId, actor_name || npa.submitted_by, 'NPA_RESUBMITTED', {
            from_stage: 'RETURNED_TO_MAKER',
            to_stage: 'PENDING_CHECKER',
            changes_made
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'RESUBMITTED', npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION resubmit]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// 5. POST /api/transitions/:id/request-rework
//    PENDING_SIGN_OFFS → RETURNED_TO_MAKER
//    SOP party requests changes. Includes circuit breaker
//    (GAP-005): 3 loop-backs → auto-escalate
// ============================================================
router.post('/:id/request-rework', rbac('APPROVER', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'Approver');
    const { party, reason } = req.body;

    if (!party || !reason) {
        return res.status(400).json({ error: 'Party and reason are required for rework request.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        if (npa.current_stage !== 'PENDING_SIGN_OFFS') {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot request rework from stage '${npa.current_stage}'. Expected PENDING_SIGN_OFFS.`,
                current_stage: npa.current_stage
            });
        }

        // Increment loop_back_count on the signoff row for this party
        await conn.query(
            `UPDATE npa_signoffs SET loop_back_count = loop_back_count + 1, status = 'REWORK'
             WHERE project_id = ? AND party = ?`,
            [projectId, party]
        );

        // Get max loop_back_number for new record
        const [lbRows] = await conn.query(
            'SELECT COALESCE(MAX(loop_back_number), 0) as max_lb FROM npa_loop_backs WHERE project_id = ?',
            [projectId]
        );
        const nextLb = lbRows[0].max_lb + 1;

        // Insert loop-back record
        await conn.query(
            `INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, requires_npa_changes, routed_to, initiated_at, delay_days)
             VALUES (?, ?, 'APPROVAL_CLARIFICATION', ?, ?, ?, 1, 'MAKER', NOW(), 0)`,
            [projectId, nextLb, party, actor_name || party, reason]
        );

        // ─── GAP-005: Circuit Breaker Check ────────────────────
        // Get max loop_back_count across all signoff parties for this project
        const [maxLbCount] = await conn.query(
            'SELECT COALESCE(MAX(loop_back_count), 0) as max_count FROM npa_signoffs WHERE project_id = ?',
            [projectId]
        );
        const totalMaxLoopBacks = maxLbCount[0].max_count;

        // Also count total loop_back records as an aggregate measure
        const [totalLbRecords] = await conn.query(
            'SELECT COUNT(*) as total FROM npa_loop_backs WHERE project_id = ?',
            [projectId]
        );

        // Check escalation rules for LOOP_BACK_LIMIT
        const [escRules] = await conn.query(
            `SELECT * FROM ref_escalation_rules
             WHERE trigger_type = 'LOOP_BACK_LIMIT'
             ORDER BY trigger_threshold DESC`,
        );

        let escalated = false;
        let escalationLevel = null;

        for (const rule of escRules) {
            const threshold = parseInt(rule.trigger_threshold, 10);
            if (nextLb >= threshold) {
                // Escalate to the highest matching level
                await conn.query(
                    `INSERT INTO npa_escalations (project_id, escalation_level, trigger_type, trigger_detail, escalated_to, escalated_by, status, escalated_at)
                     VALUES (?, ?, 'LOOP_BACK_LIMIT', ?, ?, 'SYSTEM', 'ACTIVE', NOW())`,
                    [
                        projectId,
                        rule.escalation_level,
                        JSON.stringify({ loop_back_number: nextLb, party, reason, threshold }),
                        rule.authority_name
                    ]
                );
                escalated = true;
                escalationLevel = rule.escalation_level;
                break; // Take highest matching rule (sorted DESC)
            }
        }

        // Determine target stage
        let targetStage = 'RETURNED_TO_MAKER';
        let targetStatus = 'At Risk';
        if (escalated && escalationLevel >= 3) {
            // Level 3+ = GPH circuit breaker — escalate instead of returning to maker
            targetStage = 'ESCALATED';
            targetStatus = 'Blocked';
        }

        await conn.query(
            `UPDATE npa_projects SET current_stage = ?, status = ?, updated_at = NOW() WHERE id = ?`,
            [targetStage, targetStatus, projectId]
        );

        await auditLog(conn, projectId, actor_name || party, escalated ? 'CIRCUIT_BREAKER_TRIGGERED' : 'REWORK_REQUESTED', {
            from_stage: 'PENDING_SIGN_OFFS',
            to_stage: targetStage,
            party,
            reason,
            loop_back_number: nextLb,
            escalated,
            escalation_level: escalationLevel
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({
            status: escalated ? 'ESCALATED' : 'RETURNED_TO_MAKER',
            loop_back_number: nextLb,
            escalated,
            escalation_level: escalationLevel,
            npa: result
        });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION request-rework]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// 6. POST /api/transitions/:id/final-approve
//    PENDING_FINAL_APPROVAL → APPROVED
//    Guard: all mandatory signoffs must be APPROVED or
//           APPROVED_CONDITIONAL
// ============================================================
router.post('/:id/final-approve', rbac('COO', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'COO');
    const { comments } = req.body;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        // Allow from PENDING_FINAL_APPROVAL or PENDING_SIGN_OFFS (if all signed)
        if (npa.current_stage !== 'PENDING_FINAL_APPROVAL' && npa.current_stage !== 'PENDING_SIGN_OFFS') {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot final-approve from stage '${npa.current_stage}'. Expected PENDING_FINAL_APPROVAL or PENDING_SIGN_OFFS.`,
                current_stage: npa.current_stage
            });
        }

        // Verify all signoffs are approved
        const [signoffs] = await conn.query(
            'SELECT party, status FROM npa_signoffs WHERE project_id = ?',
            [projectId]
        );

        const pendingParties = signoffs.filter(
            s => s.status !== 'APPROVED' && s.status !== 'APPROVED_CONDITIONAL'
        );

        if (pendingParties.length > 0) {
            await conn.rollback();
            return res.status(400).json({
                error: 'Cannot final-approve: not all sign-off parties have approved.',
                pending_parties: pendingParties.map(p => ({ party: p.party, status: p.status }))
            });
        }

        // Compliance gates
        const gateResult = await enforceComplianceGates(projectId);
        if (gateResult.blocked) {
            await conn.rollback();
            return res.status(403).json({ error: gateResult.reason, gate: 'COMPLIANCE_BLOCK', details: gateResult });
        }

        // Set validity_expiry = 1 year from now (GAP-010)
        // Gracefully skip if column not yet added (D-001)
        try {
            await conn.query(
                `UPDATE npa_projects SET current_stage = 'APPROVED', status = 'On Track',
                 validity_expiry = DATE_ADD(NOW(), INTERVAL 1 YEAR), updated_at = NOW() WHERE id = ?`,
                [projectId]
            );
        } catch (colErr) {
            if (colErr.code === 'ER_BAD_FIELD_ERROR') {
                // validity_expiry column not yet added — update without it
                await conn.query(
                    `UPDATE npa_projects SET current_stage = 'APPROVED', status = 'On Track', updated_at = NOW() WHERE id = ?`,
                    [projectId]
                );
            } else {
                throw colErr;
            }
        }

        await auditLog(conn, projectId, actor_name || 'COO', 'NPA_FINAL_APPROVED', {
            from_stage: npa.current_stage,
            to_stage: 'APPROVED',
            comments,
            total_signoffs: signoffs.length,
            conditional_count: signoffs.filter(s => s.status === 'APPROVED_CONDITIONAL').length
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'APPROVED', npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION final-approve]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// 7. POST /api/transitions/:id/reject
//    any (except terminal) → REJECTED
//    Reason required
// ============================================================
router.post('/:id/reject', rbac('COO', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'COO');
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ error: 'Reason is required for rejection.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        const terminalStages = ['APPROVED', 'REJECTED', 'WITHDRAWN', 'LAUNCHED', 'EXPIRED'];
        if (terminalStages.includes(npa.current_stage)) {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot reject from terminal stage '${npa.current_stage}'.`,
                current_stage: npa.current_stage
            });
        }

        await conn.query(
            `UPDATE npa_projects SET current_stage = 'REJECTED', status = 'Completed', updated_at = NOW() WHERE id = ?`,
            [projectId]
        );

        await auditLog(conn, projectId, actor_name || 'SYSTEM', 'NPA_REJECTED', {
            from_stage: npa.current_stage,
            to_stage: 'REJECTED',
            reason
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'REJECTED', npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION reject]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// GAP-007: Additional Stage Transitions
// ============================================================

// 8. POST /api/transitions/:id/withdraw
//    DRAFT|RETURNED_TO_MAKER → WITHDRAWN
router.post('/:id/withdraw', rbac('MAKER', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'Maker');
    const { reason } = req.body;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        const allowedStages = ['DRAFT', 'INITIATION', 'RETURNED_TO_MAKER', 'PENDING_CHECKER'];
        if (!allowedStages.includes(npa.current_stage)) {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot withdraw from stage '${npa.current_stage}'. Allowed: ${allowedStages.join(', ')}.`,
                current_stage: npa.current_stage
            });
        }

        await conn.query(
            `UPDATE npa_projects SET current_stage = 'WITHDRAWN', status = 'Completed', updated_at = NOW() WHERE id = ?`,
            [projectId]
        );

        await auditLog(conn, projectId, actor_name || npa.submitted_by, 'NPA_WITHDRAWN', {
            from_stage: npa.current_stage,
            to_stage: 'WITHDRAWN',
            reason: reason || 'Voluntary withdrawal by maker'
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'WITHDRAWN', npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION withdraw]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// 9. POST /api/transitions/:id/launch
//    APPROVED → LAUNCHED
//    Sets launched_at, pir_due_date, pir_status
router.post('/:id/launch', rbac('COO', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'COO');
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Project not found' });
        }
        const npa = rows[0];

        if (npa.current_stage !== 'APPROVED') {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot launch from stage '${npa.current_stage}'. Expected APPROVED.`,
                current_stage: npa.current_stage
            });
        }

        // Determine if PIR is required (mandatory for all NTG, optional for others per GFM SOP)
        const pirRequired = npa.npa_type === 'New-to-Group';
        const pirStatus = pirRequired ? 'PENDING' : 'NOT_REQUIRED';

        await conn.query(
            `UPDATE npa_projects
             SET current_stage = 'LAUNCHED',
                 status = 'On Track',
                 launched_at = NOW(),
                 pir_status = ?,
                 pir_due_date = CASE WHEN ? = 'PENDING' THEN DATE_ADD(NOW(), INTERVAL 6 MONTH) ELSE pir_due_date END,
                 updated_at = NOW()
             WHERE id = ?`,
            [pirStatus, pirStatus, projectId]
        );

        await auditLog(conn, projectId, actor_name || 'SYSTEM', 'NPA_LAUNCHED', {
            from_stage: 'APPROVED',
            to_stage: 'LAUNCHED',
            pir_required: pirRequired,
            pir_status: pirStatus
        });

        await conn.commit();
        const result = await fetchNpa(projectId);
        res.json({ status: 'LAUNCHED', pir_required: pirRequired, npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION launch]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

// ============================================================
// Helper: Check if all signoffs complete → auto-advance to
// PENDING_FINAL_APPROVAL when the last SOP party signs off
// This is called from the sign-off decision endpoint in
// approvals.js (wired in Sprint 1)
// ============================================================
async function checkAllSignoffsComplete(projectId) {
    const [signoffs] = await db.query(
        'SELECT party, status FROM npa_signoffs WHERE project_id = ?',
        [projectId]
    );

    if (signoffs.length === 0) return false;

    const allDone = signoffs.every(
        s => s.status === 'APPROVED' || s.status === 'APPROVED_CONDITIONAL'
    );

    if (allDone) {
        await db.query(
            `UPDATE npa_projects SET current_stage = 'PENDING_FINAL_APPROVAL', updated_at = NOW() WHERE id = ? AND current_stage = 'PENDING_SIGN_OFFS'`,
            [projectId]
        );
    }

    return allDone;
}

// ============================================================
// SPRINT 3 (GAP-010): Validity Extension
//   POST /api/transitions/:id/extend-validity
//   Extends validity_expiry by N months with SOP consent
// ============================================================
router.post('/:id/extend-validity', rbac('COO', 'ADMIN'), async (req, res) => {
    const projectId = req.params.id;
    const actor_name = getActorName(req, req.body?.actor_name, 'COO');
    const { months, reason } = req.body;

    if (!months || months < 1 || months > 24) {
        return res.status(400).json({ error: 'months must be between 1 and 24' });
    }
    if (!reason) {
        return res.status(400).json({ error: 'Reason is required for validity extension' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query('SELECT * FROM npa_projects WHERE id = ? FOR UPDATE', [projectId]);
        if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ error: 'Project not found' }); }
        const npa = rows[0];

        if (npa.current_stage !== 'APPROVED' && npa.current_stage !== 'LAUNCHED') {
            await conn.rollback();
            return res.status(400).json({ error: `Cannot extend validity from stage '${npa.current_stage}'. Must be APPROVED or LAUNCHED.` });
        }

        // Extend validity_expiry. Gracefully handle missing column.
        try {
            await conn.query(
                `UPDATE npa_projects SET validity_expiry = DATE_ADD(COALESCE(validity_expiry, NOW()), INTERVAL ? MONTH),
                 updated_at = NOW() WHERE id = ?`,
                [months, projectId]
            );
        } catch (colErr) {
            if (colErr.code === 'ER_BAD_FIELD_ERROR') {
                await conn.rollback();
                return res.status(501).json({ error: 'validity_expiry column not yet added. Run migration D-001.' });
            }
            throw colErr;
        }

        await auditLog(conn, projectId, actor_name || 'SYSTEM', 'VALIDITY_EXTENDED', { months, reason });
        await conn.commit();

        const result = await fetchNpa(projectId);
        res.json({ status: 'EXTENDED', months, npa: result });
    } catch (err) {
        await conn.rollback();
        console.error('[TRANSITION extend-validity]', err.message);
        console.error('[TRANSITIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    } finally {
        conn.release();
    }
});

module.exports = router;
module.exports.assignSignoffParties = assignSignoffParties;
module.exports.checkAllSignoffsComplete = checkAllSignoffsComplete;
module.exports.auditLog = auditLog;
