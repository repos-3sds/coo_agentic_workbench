const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { validatePersistBatch } = require('../validation/autofill-schema');
const { bulkUpsertNpaFormData } = require('../utils/bulk-upsert');

function isUnknownColumnError(err) {
    return !!err && typeof err.message === 'string' && err.message.toLowerCase().includes('unknown column');
}

// ─── Reusable session SELECT SQL (eliminates 4x duplication) ────────────────
const SESSION_SELECT_SQL = `
    SELECT s.id, s.project_id, s.user_id,
           COALESCE(
             (SELECT MAX(m.timestamp) FROM agent_messages m WHERE m.session_id = s.id),
             s.ended_at,
             s.started_at
           ) as updated_at,
           s.started_at,
           s.agent_identity,
           NULL as domain_agent_json,
           s.conversation_state_json,
           s.current_stage,
           s.handoff_from,
           s.ended_at,
           COALESCE(
             (SELECT SUBSTRING(m.content, 1, 80) FROM agent_messages m WHERE m.session_id = s.id AND m.role = 'user' ORDER BY m.timestamp ASC LIMIT 1),
             'New Chat'
           ) as title,
           (SELECT SUBSTRING(m.content, 1, 255) FROM agent_messages m WHERE m.session_id = s.id AND m.role = 'user' ORDER BY m.timestamp ASC LIMIT 1) as preview,
           (SELECT COUNT(*) FROM agent_messages m WHERE m.session_id = s.id) as message_count
    FROM agent_sessions s`;

// ─── Chat Session CRUD ─────────────────────────────────────────────────────

// GET /api/agents/sessions — Get recent chat sessions (optionally filtered by project/user)
router.get('/sessions', async (req, res) => {
    try {
        const { project_id, user_id } = req.query;
        let sql = SESSION_SELECT_SQL;
        const conditions = [];
        const params = [];

        if (project_id) {
            conditions.push('project_id = ?');
            params.push(project_id);
        }
        if (user_id) {
            conditions.push('user_id = ?');
            params.push(user_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY updated_at DESC LIMIT 50';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        if (isUnknownColumnError(err)) {
            console.error('[AGENTS sessions] Schema mismatch:', err.message);
        }
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/sessions/:id — Get a single session with its messages
router.get('/sessions/:id', async (req, res) => {
    try {
        const [sessionRows] = await db.query(
            `${SESSION_SELECT_SQL} WHERE s.id = ?`,
            [req.params.id]
        );
        if (sessionRows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const session = sessionRows[0];

        const [messages] = await db.query(
            'SELECT * FROM agent_messages WHERE session_id = ? ORDER BY timestamp',
            [req.params.id]
        );
        // Parse metadata/citations JSON
        session.messages = messages.map(m => ({
            ...m,
            metadata: m.metadata ? (typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata) : null,
            citations: m.citations ? (typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations) : null
        }));
        session.message_count = messages.length;

        res.json(session);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/sessions — Create a new chat session
router.post('/sessions', async (req, res) => {
    try {
        const { id: clientId, agent_identity, user_id, project_id, current_stage, handoff_from, ended_at, conversation_state_json } = req.body;
        // Use client-provided ID if available, otherwise generate one
        const id = clientId || `cs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const sessionUserId =
            (req.user?.userId ? String(req.user.userId) : null)
            || (user_id && String(user_id).trim() ? String(user_id).trim() : null)
            || `anon:${req.ip || 'unknown'}`;

        await db.query(
            `INSERT INTO agent_sessions (id, agent_identity, user_id, project_id, current_stage, handoff_from, ended_at, conversation_state_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, agent_identity || null, sessionUserId, project_id || null, current_stage || null, handoff_from || null, ended_at || null, conversation_state_json ? JSON.stringify(conversation_state_json) : null]
        );

        const [rows] = await db.query(`${SESSION_SELECT_SQL} WHERE s.id = ?`, [id]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// PUT /api/agents/sessions/:id — Update session metadata (title, agent, stage, etc.)
router.put('/sessions/:id', async (req, res) => {
    try {
        const { agent_identity, current_stage, handoff_from, ended_at, conversation_state_json, project_id } = req.body;
        const updates = [];
        const params = [];

        if (agent_identity !== undefined) { updates.push('agent_identity = ?'); params.push(agent_identity); }
        if (current_stage !== undefined) { updates.push('current_stage = ?'); params.push(current_stage); }
        if (handoff_from !== undefined) { updates.push('handoff_from = ?'); params.push(handoff_from); }
        if (ended_at !== undefined) { updates.push('ended_at = ?'); params.push(ended_at); }
        if (conversation_state_json !== undefined) { updates.push('conversation_state_json = ?'); params.push(conversation_state_json ? JSON.stringify(conversation_state_json) : null); }
        if (project_id !== undefined) { updates.push('project_id = ?'); params.push(project_id || null); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);
        await db.query(`UPDATE agent_sessions SET ${updates.join(', ')} WHERE id = ?`, params);

        const [rows] = await db.query(`${SESSION_SELECT_SQL} WHERE s.id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// DELETE /api/agents/sessions/:id — Delete a session (CASCADE deletes messages)
router.delete('/sessions/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM agent_sessions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ success: true, deleted: req.params.id });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// DELETE /api/agents/sessions — Delete ALL sessions (clear history)
router.delete('/sessions', async (req, res) => {
    try {
        const { user_id } = req.query;
        let sql = 'DELETE FROM agent_sessions';
        const params = [];
        if (user_id) {
            sql += ' WHERE user_id = ?';
            params.push(user_id);
        }
        const [result] = await db.query(sql, params);
        res.json({ success: true, deleted: result.affectedRows });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/sessions/:id/messages — Get messages for a specific session
router.get('/sessions/:id/messages', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM agent_messages WHERE session_id = ? ORDER BY timestamp',
            [req.params.id]
        );
        const messages = rows.map(m => ({
            ...m,
            metadata: m.metadata ? (typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata) : null,
            citations: m.citations ? (typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations) : null
        }));
        res.json(messages);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/sessions/:id/messages — Add a message to a session
router.post('/sessions/:id/messages', async (req, res) => {
    try {
        const { role, content, agent_identity_id, metadata } = req.body;

        if (!role || !content) {
            return res.status(400).json({ error: 'role and content are required' });
        }

        const [result] = await db.query(
            `INSERT INTO agent_messages (session_id, role, content, agent_identity_id, metadata)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, role, content, agent_identity_id || null,
            metadata ? JSON.stringify(metadata) : null]
        );

        const [rows] = await db.query('SELECT * FROM agent_messages WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/sessions/:id/messages/batch — Add multiple messages at once (for session save)
router.post('/sessions/:id/messages/batch', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        // Delete existing messages for this session (full replace)
        await db.query('DELETE FROM agent_messages WHERE session_id = ?', [req.params.id]);

        // Insert all messages (with original timestamps to preserve order)
        const values = messages.map(m => {
            const dateObj = m.timestamp ? new Date(m.timestamp) : new Date();
            const mysqlTimestamp = dateObj.toISOString().slice(0, 19).replace('T', ' ');
            return [
                req.params.id,
                m.role,
                m.content,
                m.agent_identity_id || null,
                mysqlTimestamp,
                m.metadata ? JSON.stringify(m.metadata) : null
            ];
        });

        if (values.length > 0) {
            const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
            const flatValues = values.flat();
            await db.query(
                `INSERT INTO agent_messages (session_id, role, content, agent_identity_id, timestamp, metadata)
                 VALUES ${placeholders}`,
                flatValues
            );
        }

        res.json({ success: true, count: values.length });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/npas/:id/routing — Get agent routing decisions for an NPA
router.get('/npas/:id/routing', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_agent_routing_decisions WHERE project_id = ? ORDER BY decided_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/npas/:id/escalations — Get escalations for an NPA
router.get('/npas/:id/escalations', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_escalations WHERE project_id = ? ORDER BY escalated_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/npas/:id/external-parties — Get external parties for an NPA
router.get('/npas/:id/external-parties', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_external_parties WHERE project_id = ? ORDER BY party_name',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/npas/:id/market-risk-factors — Get market risk factors for an NPA
router.get('/npas/:id/market-risk-factors', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_market_risk_factors WHERE project_id = ? ORDER BY risk_factor',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/npas/:id/monitoring-thresholds — Get monitoring thresholds
router.get('/npas/:id/monitoring-thresholds', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_monitoring_thresholds WHERE project_id = ? ORDER BY metric_name',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/npas/:id/post-launch-conditions — Get post-launch conditions
router.get('/npas/:id/post-launch-conditions', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_post_launch_conditions WHERE project_id = ? ORDER BY due_date',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/npas/:id/documents/requirements — Get document requirements and uploaded documents
router.get('/npas/:id/documents/requirements', async (req, res) => {
    try {
        const [requirements] = await db.query(`
            SELECT * FROM ref_document_requirements
            ORDER BY required_by_stage, order_index
        `);
        const [documents] = await db.query(`
            SELECT * FROM npa_documents
            WHERE project_id = ?
            ORDER BY uploaded_at DESC
        `, [req.params.id]);
        res.json({ requirements, documents });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/agents/notifications — Get aggregated notifications (breaches + SLA warnings + escalations)
router.get('/notifications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 'BREACH' as type, id, project_id, title, severity, triggered_at as created_at, status
            FROM npa_breach_alerts WHERE status != 'RESOLVED'
            UNION ALL
            SELECT 'SLA_WARNING' as type, id, project_id, CONCAT(party, ' SLA Breach') as title, 'WARNING' as severity, created_at, 'OPEN' as status
            FROM npa_signoffs WHERE sla_breached = TRUE AND status NOT IN ('APPROVED','REJECTED')
            UNION ALL
            SELECT 'ESCALATION' as type, id, project_id, trigger_detail as title, escalation_level as severity, escalated_at as created_at, status
            FROM npa_escalations WHERE status != 'RESOLVED'
            ORDER BY created_at DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// ============================================================
// SPRINT 2: Agent Result Persistence Endpoints (Obs 1)
// Each agent type saves its outputs to the appropriate DB tables
// so results survive page navigation/refresh.
// ============================================================

// POST /api/agents/npas/:id/persist/classifier — Save CLASSIFIER results
router.post('/npas/:id/persist/classifier', async (req, res) => {
    const { total_score, calculated_tier, breakdown, override_reason, approval_track, raw_json, workflow_run_id } = req.body;
    try {
        // Upsert classification scorecard (now includes approval_track, raw_json, workflow_run_id)
        await db.query('DELETE FROM npa_classification_scorecards WHERE project_id = ?', [req.params.id]);
        const [result] = await db.query(
            `INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, override_reason, approval_track, raw_json, workflow_run_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, total_score || 0, calculated_tier || 'Variation', JSON.stringify(breakdown || {}), override_reason || null, approval_track || null, raw_json ? JSON.stringify(raw_json) : null, workflow_run_id || null]
        );

        // Also save to unified npa_agent_results table
        await db.query(
            `INSERT INTO npa_agent_results (project_id, agent_type, result_data, workflow_run_id)
             VALUES (?, 'classifier', ?, ?)
             ON DUPLICATE KEY UPDATE result_data = VALUES(result_data), workflow_run_id = VALUES(workflow_run_id), updated_at = NOW()`,
            [req.params.id, JSON.stringify(req.body), workflow_run_id || null]
        );

        // Update project classification fields
        if (calculated_tier || approval_track) {
            await db.query(
                `UPDATE npa_projects SET npa_type = COALESCE(?, npa_type), approval_track = COALESCE(?, approval_track),
                 classification_confidence = ?, updated_at = NOW() WHERE id = ?`,
                [calculated_tier, approval_track, total_score || null, req.params.id]
            );
        }

        // Audit log
        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'CLASSIFIER_AGENT', 'AGENT_CLASSIFIED', ?, 1, 'CLASSIFIER')`,
            [req.params.id, JSON.stringify({ calculated_tier, total_score, approval_track })]
        );

        res.json({ id: result.insertId, status: 'PERSISTED', fields_saved: Object.keys(breakdown || {}).length });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/npas/:id/persist/risk — Save RISK assessment results (v2: 5 layers + 7 domains + new fields)
router.post('/npas/:id/persist/risk', async (req, res) => {
    const {
        layers, domain_assessments, overall_score, overall_rating, hard_stop, hard_stop_reason,
        prerequisites, pir_requirements, notional_flags, mandatory_signoffs, recommendations,
        circuit_breaker, evergreen_limits, validity_risk, npa_lite_risk_profile, sop_bottleneck_risk
    } = req.body;
    try {
        // Clear old risk checks for this project, then insert new ones (5 layers)
        await db.query('DELETE FROM npa_risk_checks WHERE project_id = ? AND checked_by = ?', [req.params.id, 'RISK_AGENT']);
        await db.query('DELETE FROM npa_risk_checks WHERE project_id = ? AND checked_by = ?', [req.params.id, 'RISK_AGENT_DOMAIN']);

        if (Array.isArray(layers)) {
            for (const layer of layers) {
                await db.query(
                    `INSERT INTO npa_risk_checks (project_id, check_layer, result, matched_items, checked_by)
                     VALUES (?, ?, ?, ?, 'RISK_AGENT')`,
                    [req.params.id, layer.layer || layer.check_layer, layer.result || 'PASS', JSON.stringify(layer.matched_items || layer.findings || [])]
                );
            }
        }

        // Persist 7-domain assessments as individual risk check rows
        if (Array.isArray(domain_assessments)) {
            for (const da of domain_assessments) {
                await db.query(
                    `INSERT INTO npa_risk_checks (project_id, check_layer, result, matched_items, checked_by)
                     VALUES (?, ?, ?, ?, 'RISK_AGENT_DOMAIN')`,
                    [
                        req.params.id,
                        `DOMAIN_${da.domain || 'UNKNOWN'}`,
                        da.rating || 'LOW',
                        JSON.stringify({ score: da.score, keyFindings: da.keyFindings || [], mitigants: da.mitigants || [] })
                    ]
                );
            }
        }

        // Upsert intake assessments for RISK domain — now includes full risk envelope
        const riskFindings = {
            layers: layers || [],
            domain_assessments: domain_assessments || [],
            pir_requirements: pir_requirements || null,
            notional_flags: notional_flags || null,
            mandatory_signoffs: mandatory_signoffs || [],
            recommendations: recommendations || [],
            circuit_breaker: circuit_breaker || null,
            evergreen_limits: evergreen_limits || null
        };
        await db.query('DELETE FROM npa_intake_assessments WHERE project_id = ? AND domain = ?', [req.params.id, 'RISK']);
        await db.query(
            `INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings)
             VALUES (?, 'RISK', ?, ?, ?)`,
            [req.params.id, hard_stop ? 'FAIL' : 'PASS', overall_score || 0, JSON.stringify(riskFindings)]
        );

        // Update project risk_level based on overall_rating or score
        const riskLevel = overall_rating || (overall_score >= 70 ? 'HIGH' : overall_score >= 40 ? 'MEDIUM' : 'LOW');
        await db.query('UPDATE npa_projects SET risk_level = ?, updated_at = NOW() WHERE id = ?', [riskLevel, req.params.id]);

        // Save full risk assessment to dedicated summary table
        await db.query(
            `INSERT INTO npa_risk_assessment_summary (project_id, overall_score, overall_rating, hard_stop, hard_stop_reason,
             domain_assessments, pir_requirements, notional_flags, mandatory_signoffs, recommendations,
             circuit_breaker, evergreen_limits, validity_risk, npa_lite_risk_profile, sop_bottleneck_risk, prerequisites, raw_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE overall_score = VALUES(overall_score), overall_rating = VALUES(overall_rating),
             hard_stop = VALUES(hard_stop), hard_stop_reason = VALUES(hard_stop_reason),
             domain_assessments = VALUES(domain_assessments), pir_requirements = VALUES(pir_requirements),
             notional_flags = VALUES(notional_flags), mandatory_signoffs = VALUES(mandatory_signoffs),
             recommendations = VALUES(recommendations), circuit_breaker = VALUES(circuit_breaker),
             evergreen_limits = VALUES(evergreen_limits), validity_risk = VALUES(validity_risk),
             npa_lite_risk_profile = VALUES(npa_lite_risk_profile), sop_bottleneck_risk = VALUES(sop_bottleneck_risk),
             prerequisites = VALUES(prerequisites), raw_json = VALUES(raw_json), updated_at = NOW()`,
            [req.params.id, overall_score || 0, riskLevel, hard_stop ? 1 : 0, hard_stop_reason || null,
             domain_assessments ? JSON.stringify(domain_assessments) : null,
             pir_requirements ? JSON.stringify(pir_requirements) : null,
             notional_flags ? JSON.stringify(notional_flags) : null,
             mandatory_signoffs ? JSON.stringify(mandatory_signoffs) : null,
             recommendations ? JSON.stringify(recommendations) : null,
             circuit_breaker ? JSON.stringify(circuit_breaker) : null,
             evergreen_limits ? JSON.stringify(evergreen_limits) : null,
             validity_risk ? JSON.stringify(validity_risk) : null,
             npa_lite_risk_profile ? JSON.stringify(npa_lite_risk_profile) : null,
             sop_bottleneck_risk ? JSON.stringify(sop_bottleneck_risk) : null,
             prerequisites ? JSON.stringify(prerequisites) : null,
             JSON.stringify(req.body)]
        );

        // Save to unified agent results table
        await db.query(
            `INSERT INTO npa_agent_results (project_id, agent_type, result_data)
             VALUES (?, 'risk', ?)
             ON DUPLICATE KEY UPDATE result_data = VALUES(result_data), updated_at = NOW()`,
            [req.params.id, JSON.stringify(req.body)]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'RISK_AGENT', 'AGENT_RISK_ASSESSED', ?, 1, 'RISK')`,
            [req.params.id, JSON.stringify({
                overall_score, overall_rating: riskLevel, hard_stop,
                layer_count: layers?.length, domain_count: domain_assessments?.length,
                pir_required: pir_requirements?.required, signoff_count: mandatory_signoffs?.length
            })]
        );

        res.json({
            status: 'PERSISTED',
            layers_saved: layers?.length || 0,
            domains_saved: domain_assessments?.length || 0,
            risk_level: riskLevel
        });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/npas/:id/persist/autofill — Save AUTOFILL results to npa_form_data
// P13 fix: Added Zod validation, transaction wrapping, proper lineage handling
router.post('/npas/:id/persist/autofill', async (req, res) => {
    try {
        // Normalize: client sends {fields: [...]} but Zod expects {filled_fields: [...]}
        const payload = req.body.filled_fields ? req.body : { filled_fields: req.body.fields || [] };
        const validation = validatePersistBatch(payload);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation failed', details: validation.errors });
        }

        const fields = validation.data.filled_fields;
        if (fields.length === 0) {
            return res.status(400).json({ error: 'fields array is required and must not be empty' });
        }

        // Use transaction for atomicity
        const conn = db.getConnection ? await db.getConnection() : db;
        const useTransaction = typeof conn.beginTransaction === 'function';
        if (useTransaction) await conn.beginTransaction();

        let saved = 0;
        try {
            const rows = fields.map((field) => {
                const confidence = typeof field.confidence === 'number'
                    ? Math.min(100, Math.max(0, field.confidence))
                    : null;
                return {
                    field_key: field.field_key,
                    value: field.value,
                    lineage: field.lineage || 'AUTO',
                    confidence_score: confidence,
                    metadata: {
                        source: field.source || 'autofill_agent',
                        strategy: field.strategy || 'LLM',
                        document_section: field.document_section,
                        persisted_at: new Date().toISOString()
                    }
                };
            });

            const targetConn = useTransaction ? conn : db;
            const result = await bulkUpsertNpaFormData(targetConn, req.params.id, rows, { batchSize: 400 });
            saved = result.rows;

            if (useTransaction) await conn.commit();
        } catch (innerErr) {
            if (useTransaction) await conn.rollback();
            throw innerErr;
        } finally {
            if (useTransaction && conn.release) conn.release();
        }

        // Audit log
        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'AUTOFILL_AGENT', 'AGENT_AUTOFILLED', ?, 1, 'AUTOFILL')`,
            [req.params.id, JSON.stringify({ fields_saved: saved, source: 'llm_autofill' })]
        );

        res.json({ status: 'PERSISTED', fields_saved: saved });
    } catch (err) {
        console.error('[persist/autofill] Error:', err.message);
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/npas/:id/persist/ml-predict — Save ML_PREDICT results
router.post('/npas/:id/persist/ml-predict', async (req, res) => {
    const { approval_likelihood, timeline_days, bottleneck, risk_score, features, comparison_insights } = req.body;
    try {
        await db.query(
            `UPDATE npa_projects SET predicted_approval_likelihood = ?, predicted_timeline_days = ?,
             predicted_bottleneck = ?, updated_at = NOW() WHERE id = ?`,
            [approval_likelihood || null, timeline_days || null, bottleneck || null, req.params.id]
        );

        // Save to dedicated ml_predictions table
        await db.query(
            `INSERT INTO npa_ml_predictions (project_id, approval_likelihood, timeline_days, bottleneck_dept, risk_score, features, comparison_insights)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE approval_likelihood = VALUES(approval_likelihood), timeline_days = VALUES(timeline_days),
             bottleneck_dept = VALUES(bottleneck_dept), risk_score = VALUES(risk_score), features = VALUES(features),
             comparison_insights = VALUES(comparison_insights)`,
            [req.params.id, approval_likelihood || 0, timeline_days || 0, bottleneck || null, risk_score || 0,
             features ? JSON.stringify(features) : null, comparison_insights ? JSON.stringify(comparison_insights) : null]
        );

        // Save to unified agent results table
        await db.query(
            `INSERT INTO npa_agent_results (project_id, agent_type, result_data)
             VALUES (?, 'ml-predict', ?)
             ON DUPLICATE KEY UPDATE result_data = VALUES(result_data), updated_at = NOW()`,
            [req.params.id, JSON.stringify(req.body)]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'ML_PREDICT_AGENT', 'AGENT_ML_PREDICTED', ?, 1, 'ML_PREDICT')`,
            [req.params.id, JSON.stringify({ approval_likelihood, timeline_days, bottleneck, risk_score })]
        );

        res.json({ status: 'PERSISTED', fields_saved: 6 });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/npas/:id/persist/governance — Save GOVERNANCE sign-off status
router.post('/npas/:id/persist/governance', async (req, res) => {
    const { signoffs, sla_status, loop_back_count, circuit_breaker, escalation } = req.body;
    try {
        // Don't replace signoffs managed by transitions.js — only update metadata
        if (Array.isArray(signoffs)) {
            for (const so of signoffs) {
                const party = so.party || so.department;
                if (!party) continue;
                // Check if signoff row exists
                const [existing] = await db.query(
                    'SELECT id FROM npa_signoffs WHERE project_id = ? AND party = ?',
                    [req.params.id, party]
                );
                if (existing.length > 0) {
                    // Update fields that don't conflict with transition-managed state
                    await db.query(
                        `UPDATE npa_signoffs SET department = COALESCE(?, department),
                         sla_deadline = COALESCE(?, sla_deadline),
                         sla_breached = COALESCE(?, sla_breached)
                         WHERE project_id = ? AND party = ?`,
                        [so.department || null, so.sla_deadline || null, so.sla_breached ? 1 : 0, req.params.id, party]
                    );
                } else {
                    // Insert new signoff from governance agent
                    await db.query(
                        `INSERT INTO npa_signoffs (project_id, party, department, status, sla_deadline, sla_breached)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [req.params.id, party, so.department || party, so.status || 'PENDING',
                         so.sla_deadline || null, so.sla_breached ? 1 : 0]
                    );
                }
            }
        }

        // Save to unified agent results table
        await db.query(
            `INSERT INTO npa_agent_results (project_id, agent_type, result_data)
             VALUES (?, 'governance', ?)
             ON DUPLICATE KEY UPDATE result_data = VALUES(result_data), updated_at = NOW()`,
            [req.params.id, JSON.stringify(req.body)]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'GOVERNANCE_AGENT', 'AGENT_GOVERNANCE_CHECKED', ?, 1, 'GOVERNANCE')`,
            [req.params.id, JSON.stringify({ signoff_count: signoffs?.length, sla_status, loop_back_count })]
        );

        res.json({ status: 'PERSISTED', fields_saved: signoffs?.length || 0 });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/npas/:id/persist/doc-lifecycle — Save DOC_LIFECYCLE results
router.post('/npas/:id/persist/doc-lifecycle', async (req, res) => {
    const { documents, missing_documents, completeness_percent, total_required, total_present, total_valid,
            stage_gate_status, invalid_documents, conditional_rules, expiring_documents } = req.body;
    try {
        if (Array.isArray(documents)) {
            for (const doc of documents) {
                if (!doc.document_name) continue;
                // Check if document already exists
                const [existing] = await db.query(
                    'SELECT id FROM npa_documents WHERE project_id = ? AND document_name = ?',
                    [req.params.id, doc.document_name]
                );
                if (existing.length > 0) {
                    await db.query(
                        `UPDATE npa_documents SET validation_status = ?, validation_notes = ?, updated_at = NOW()
                         WHERE project_id = ? AND document_name = ?`,
                        [doc.status || 'PENDING', doc.notes || null, req.params.id, doc.document_name]
                    );
                } else {
                    await db.query(
                        `INSERT INTO npa_documents (project_id, document_name, document_type, required_by_stage, validation_status, validation_notes)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [req.params.id, doc.document_name, doc.document_type || 'OTHER', doc.required_by_stage || 'INITIATION', doc.status || 'PENDING', doc.notes || null]
                    );
                }
            }
        }

        // Save to doc lifecycle summary table
        await db.query(
            `INSERT INTO npa_doc_lifecycle_summary (project_id, completeness_percent, total_required, total_present, total_valid,
             stage_gate_status, missing_documents, invalid_documents, conditional_rules, expiring_documents)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE completeness_percent = VALUES(completeness_percent), total_required = VALUES(total_required),
             total_present = VALUES(total_present), total_valid = VALUES(total_valid), stage_gate_status = VALUES(stage_gate_status),
             missing_documents = VALUES(missing_documents), invalid_documents = VALUES(invalid_documents),
             conditional_rules = VALUES(conditional_rules), expiring_documents = VALUES(expiring_documents), updated_at = NOW()`,
            [req.params.id, completeness_percent || 0, total_required || 0, total_present || 0, total_valid || 0,
             stage_gate_status || 'BLOCKED',
             missing_documents ? JSON.stringify(missing_documents) : (documents ? JSON.stringify(documents) : null),
             invalid_documents ? JSON.stringify(invalid_documents) : null,
             conditional_rules ? JSON.stringify(conditional_rules) : null,
             expiring_documents ? JSON.stringify(expiring_documents) : null]
        );

        // Save to unified agent results table
        await db.query(
            `INSERT INTO npa_agent_results (project_id, agent_type, result_data)
             VALUES (?, 'doc-lifecycle', ?)
             ON DUPLICATE KEY UPDATE result_data = VALUES(result_data), updated_at = NOW()`,
            [req.params.id, JSON.stringify(req.body)]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'DOC_LIFECYCLE_AGENT', 'AGENT_DOC_CHECKED', ?, 1, 'DOC_LIFECYCLE')`,
            [req.params.id, JSON.stringify({ document_count: (missing_documents || documents)?.length, completeness_percent })]
        );

        res.json({ status: 'PERSISTED', documents_saved: (missing_documents || documents)?.length || 0 });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/agents/npas/:id/persist/monitoring — Save MONITORING results
router.post('/npas/:id/persist/monitoring', async (req, res) => {
    const { metrics, thresholds, product_health, breaches, conditions, pir_status, pir_due_date } = req.body;
    try {
        // Upsert monitoring thresholds
        if (Array.isArray(thresholds)) {
            for (const t of thresholds) {
                if (!t.metric_name) continue;
                const [existing] = await db.query(
                    'SELECT id FROM npa_monitoring_thresholds WHERE project_id = ? AND metric_name = ?',
                    [req.params.id, t.metric_name]
                );
                if (existing.length > 0) {
                    await db.query(
                        `UPDATE npa_monitoring_thresholds SET warning_value = ?, critical_value = ?, comparison = ?
                         WHERE project_id = ? AND metric_name = ?`,
                        [t.warning_value || 0, t.critical_value || 0, t.comparison || 'GT', req.params.id, t.metric_name]
                    );
                } else {
                    await db.query(
                        `INSERT INTO npa_monitoring_thresholds (project_id, metric_name, warning_value, critical_value, comparison)
                         VALUES (?, ?, ?, ?, ?)`,
                        [req.params.id, t.metric_name, t.warning_value || 0, t.critical_value || 0, t.comparison || 'GT']
                    );
                }
            }
        }

        // Save performance metrics if provided
        if (Array.isArray(metrics)) {
            for (const m of metrics) {
                await db.query(
                    `INSERT INTO npa_performance_metrics (project_id, metric_name, metric_value, period_start, period_end)
                     VALUES (?, ?, ?, ?, ?)`,
                    [req.params.id, m.metric_name, m.metric_value || 0, m.period_start || null, m.period_end || null]
                );
            }
        }

        // Save to monitoring results summary table
        await db.query(
            `INSERT INTO npa_monitoring_results (project_id, product_health, metrics, breaches, conditions_data, pir_status, pir_due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE product_health = VALUES(product_health), metrics = VALUES(metrics),
             breaches = VALUES(breaches), conditions_data = VALUES(conditions_data), pir_status = VALUES(pir_status),
             pir_due_date = VALUES(pir_due_date), updated_at = NOW()`,
            [req.params.id, product_health || 'HEALTHY',
             metrics ? JSON.stringify(metrics) : null,
             breaches ? JSON.stringify(breaches) : null,
             conditions ? JSON.stringify(conditions) : null,
             pir_status || 'Not Scheduled', pir_due_date || null]
        );

        // Save to unified agent results table
        await db.query(
            `INSERT INTO npa_agent_results (project_id, agent_type, result_data)
             VALUES (?, 'monitoring', ?)
             ON DUPLICATE KEY UPDATE result_data = VALUES(result_data), updated_at = NOW()`,
            [req.params.id, JSON.stringify(req.body)]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
             VALUES (?, 'MONITORING_AGENT', 'AGENT_MONITORING_SET', ?, 1, 'MONITORING')`,
            [req.params.id, JSON.stringify({ threshold_count: thresholds?.length, metric_count: metrics?.length, product_health })]
        );

        res.json({ status: 'PERSISTED', fields_saved: (thresholds?.length || 0) + (metrics?.length || 0) });
    } catch (err) {
        console.error('[AGENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
