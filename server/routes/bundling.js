/**
 * Bundling Framework (GAP-008)
 *
 * Implements the 8-condition check from GFM SOP 2024 §3.1 to determine
 * whether a product variation qualifies for BUNDLING track (reduced SOPs).
 *
 * 8 Bundling Conditions:
 *   1. Existing approved parent product
 *   2. Same product category/family
 *   3. No new risk type introduced
 *   4. Within approved notional limits
 *   5. Same booking entity
 *   6. Same jurisdiction set
 *   7. No new counterparty type
 *   8. Within existing operational capacity
 *
 * All 8 must pass for BUNDLING track; otherwise routes to FULL_NPA or NPA_LITE.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/bundling/:id/assess — Run 8-condition bundling assessment
router.get('/:id/assess', async (req, res) => {
    try {
        const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [req.params.id]);
        if (project.length === 0) return res.status(404).json({ error: 'Project not found' });
        const npa = project[0];

        // Look up parent product if specified
        const parentId = req.query.parent_id || null;
        let parent = null;
        if (parentId) {
            const [parentRows] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [parentId]);
            if (parentRows.length > 0) parent = parentRows[0];
        }

        const conditions = [];
        let allPassed = true;

        // Condition 1: Existing approved parent
        const c1 = parent && parent.current_stage === 'LAUNCHED';
        conditions.push({ id: 1, name: 'Existing Approved Parent Product', passed: !!c1, detail: c1 ? `Parent: ${parent.title}` : 'No approved parent product found' });
        if (!c1) allPassed = false;

        // Condition 2: Same product category
        const c2 = parent && npa.product_category === parent.product_category;
        conditions.push({ id: 2, name: 'Same Product Category', passed: !!c2, detail: c2 ? `Category: ${npa.product_category}` : `Category mismatch: ${npa.product_category} vs ${parent?.product_category || 'N/A'}` });
        if (!c2) allPassed = false;

        // Condition 3: No new risk type
        const [npaRisks] = await db.query('SELECT DISTINCT check_layer FROM npa_risk_checks WHERE project_id = ?', [npa.id]);
        const [parentRisks] = parent ? await db.query('SELECT DISTINCT check_layer FROM npa_risk_checks WHERE project_id = ?', [parent.id]) : [[]];
        const parentLayers = new Set(parentRisks.map((r) => r.check_layer));
        const newRisks = npaRisks.filter(r => !parentLayers.has(r.check_layer));
        const c3 = newRisks.length === 0;
        conditions.push({ id: 3, name: 'No New Risk Type', passed: c3, detail: c3 ? 'No new risk layers' : `New risk layers: ${newRisks.map(r => r.check_layer).join(', ')}` });
        if (!c3) allPassed = false;

        // Condition 4: Within approved notional limits
        const parentNotional = parseFloat(parent?.notional_amount) || 0;
        const npaNotional = parseFloat(npa.notional_amount) || 0;
        const c4 = parent && npaNotional <= parentNotional * 1.2; // Allow 20% buffer
        conditions.push({ id: 4, name: 'Within Notional Limits', passed: !!c4, detail: c4 ? `${npaNotional} <= ${parentNotional * 1.2} (120% of parent)` : `Exceeds limit: ${npaNotional} > ${parentNotional * 1.2}` });
        if (!c4) allPassed = false;

        // Condition 5: Same booking entity
        const [npaJurisdictions] = await db.query('SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = ?', [npa.id]);
        const [parentJurisdictions] = parent ? await db.query('SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = ?', [parent.id]) : [[]];
        // Simplified: check if primary booking location matches
        const c5 = parent && npa.currency === parent.currency; // proxy for booking entity
        conditions.push({ id: 5, name: 'Same Booking Entity', passed: !!c5, detail: c5 ? `Currency: ${npa.currency}` : 'Booking entity mismatch' });
        if (!c5) allPassed = false;

        // Condition 6: Same jurisdiction set
        const npaJSet = new Set(npaJurisdictions.map((j) => j.jurisdiction_code));
        const parentJSet = new Set(parentJurisdictions.map((j) => j.jurisdiction_code));
        const newJurisdictions = [...npaJSet].filter(j => !parentJSet.has(j));
        const c6 = newJurisdictions.length === 0;
        conditions.push({ id: 6, name: 'Same Jurisdiction Set', passed: c6, detail: c6 ? 'No new jurisdictions' : `New jurisdictions: ${newJurisdictions.join(', ')}` });
        if (!c6) allPassed = false;

        // Condition 7: No new counterparty type (check via form data)
        const [npaCounterparty] = await db.query("SELECT field_value FROM npa_form_data WHERE project_id = ? AND field_key = 'counterparty_type'", [npa.id]);
        const [parentCounterparty] = parent ? await db.query("SELECT field_value FROM npa_form_data WHERE project_id = ? AND field_key = 'counterparty_type'", [parent.id]) : [[]];
        const c7 = !npaCounterparty.length || (parentCounterparty.length > 0 && npaCounterparty[0]?.field_value === parentCounterparty[0]?.field_value);
        conditions.push({ id: 7, name: 'No New Counterparty Type', passed: c7, detail: c7 ? 'Same counterparty type' : 'New counterparty type detected' });
        if (!c7) allPassed = false;

        // Condition 8: Within operational capacity (simplified: check if ops signoff was approved on parent)
        let c8 = false;
        if (parent) {
            const [opsSignoff] = await db.query(
                "SELECT status FROM npa_signoffs WHERE project_id = ? AND party = 'Operations' AND status = 'APPROVED'",
                [parent.id]
            );
            c8 = opsSignoff.length > 0;
        }
        conditions.push({ id: 8, name: 'Within Operational Capacity', passed: c8, detail: c8 ? 'Operations capacity confirmed via parent' : 'No ops capacity confirmation' });
        if (!c8) allPassed = false;

        // Determine recommended track
        const passCount = conditions.filter(c => c.passed).length;
        let recommendedTrack = 'FULL_NPA';
        if (allPassed) {
            recommendedTrack = 'BUNDLING';
        } else if (passCount >= 6) {
            recommendedTrack = 'NPA_LITE';
        }

        res.json({
            project_id: npa.id,
            parent_id: parentId,
            conditions,
            all_passed: allPassed,
            pass_count: passCount,
            recommended_track: recommendedTrack
        });
    } catch (err) {
        console.error('[BUNDLING ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/bundling/:id/apply — Apply bundling track to NPA
router.post('/:id/apply', async (req, res) => {
    const { actor_name, parent_id } = req.body;
    try {
        await db.query(
            `UPDATE npa_projects SET approval_track = 'BUNDLING', updated_at = NOW() WHERE id = ?`,
            [req.params.id]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'BUNDLING_APPLIED', ?, 0)`,
            [req.params.id, actor_name || 'SYSTEM', JSON.stringify({ parent_id })]
        );

        res.json({ status: 'BUNDLING_APPLIED' });
    } catch (err) {
        console.error('[BUNDLING ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
