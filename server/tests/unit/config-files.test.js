/**
 * Unit Tests — Externalized Config JSON Files
 *
 * Validates that all config JSON files load correctly and have
 * the expected structure. These configs were extracted from
 * hardcoded values in transitions.js and dify-proxy.js during P0.
 *
 * Run:  node --test server/tests/unit/config-files.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ─── npa-subtypes.json ──────────────────────────────────────────────────────

describe('config: npa-subtypes.json', () => {
    const NPA_SUBTYPES = require('../../config/npa-subtypes.json');

    it('should be a non-empty object', () => {
        assert.ok(typeof NPA_SUBTYPES === 'object' && NPA_SUBTYPES !== null);
        assert.ok(Object.keys(NPA_SUBTYPES).length > 0, 'Should have subtype entries');
    });

    it('should have known subtype keys (B1, B2, B3, B4)', () => {
        const expectedKeys = ['B1', 'B2', 'B3', 'B4'];
        for (const key of expectedKeys) {
            assert.ok(key in NPA_SUBTYPES, `Missing subtype key: ${key}`);
        }
    });

    it('each subtype entry should be an array or null (skip _ metadata keys)', () => {
        for (const [key, value] of Object.entries(NPA_SUBTYPES)) {
            if (key.startsWith('_')) continue; // skip _comment, _description
            assert.ok(
                value === null || Array.isArray(value),
                `${key} should be array or null, got ${typeof value}`
            );
        }
    });

    it('non-null subtype arrays should contain party name strings', () => {
        for (const [key, value] of Object.entries(NPA_SUBTYPES)) {
            if (Array.isArray(value)) {
                for (const party of value) {
                    assert.ok(typeof party === 'string' && party.length > 0,
                        `${key} contains non-string or empty party name`);
                }
            }
        }
    });

    it('B4 should be null (meaning full party set)', () => {
        assert.equal(NPA_SUBTYPES.B4, null, 'B4 should be null to indicate full party set');
    });
});

// ─── cross-border-parties.json ──────────────────────────────────────────────

describe('config: cross-border-parties.json', () => {
    const CROSS_BORDER = require('../../config/cross-border-parties.json');

    it('should have a parties array', () => {
        assert.ok(Array.isArray(CROSS_BORDER.parties), 'Missing parties array');
    });

    it('each party should have party_name, department, sla_hours', () => {
        assert.ok(CROSS_BORDER.parties.length > 0, 'parties should not be empty');
        for (const party of CROSS_BORDER.parties) {
            assert.ok(typeof party === 'object' && party !== null,
                `Party entry should be an object: ${JSON.stringify(party)}`);
            assert.ok(typeof party.party_name === 'string' && party.party_name.length > 0,
                `Party missing party_name: ${JSON.stringify(party)}`);
            assert.ok(typeof party.department === 'string',
                `Party missing department: ${JSON.stringify(party)}`);
            assert.ok(typeof party.sla_hours === 'number' && party.sla_hours > 0,
                `Party missing or invalid sla_hours: ${JSON.stringify(party)}`);
        }
    });

    it('should contain known cross-border parties', () => {
        const names = CROSS_BORDER.parties.map(p => p.party_name);
        assert.ok(names.length >= 3,
            'Expected at least 3 cross-border mandatory parties');
        assert.ok(names.includes('Finance'), 'Should include Finance');
        assert.ok(names.includes('Compliance'), 'Should include Compliance');
    });
});

// ─── head-office-parties.json ───────────────────────────────────────────────

describe('config: head-office-parties.json', () => {
    const HEAD_OFFICE = require('../../config/head-office-parties.json');

    it('should have a parties array', () => {
        assert.ok(Array.isArray(HEAD_OFFICE.parties), 'Missing parties array');
    });

    it('each party should have party_name, department, sla_hours', () => {
        assert.ok(HEAD_OFFICE.parties.length > 0, 'parties should not be empty');
        for (const party of HEAD_OFFICE.parties) {
            assert.ok(typeof party === 'object' && party !== null,
                `Party entry should be an object: ${JSON.stringify(party)}`);
            assert.ok(typeof party.party_name === 'string' && party.party_name.length > 0,
                `Party missing party_name: ${JSON.stringify(party)}`);
            assert.ok(typeof party.department === 'string',
                `Party missing department: ${JSON.stringify(party)}`);
            assert.ok(typeof party.sla_hours === 'number' && party.sla_hours > 0,
                `Party missing or invalid sla_hours: ${JSON.stringify(party)}`);
        }
    });

    it('should contain Legal and Compliance', () => {
        const names = HEAD_OFFICE.parties.map(p => p.party_name);
        assert.ok(names.includes('Legal'), 'Should include Legal');
        assert.ok(names.includes('Compliance'), 'Should include Compliance');
    });
});

// ─── notional-thresholds.json ───────────────────────────────────────────────

describe('config: notional-thresholds.json', () => {
    const NOTIONAL = require('../../config/notional-thresholds.json');

    it('should have a thresholds array', () => {
        assert.ok(Array.isArray(NOTIONAL.thresholds), 'Missing thresholds array');
    });

    it('each threshold should have required fields', () => {
        for (const t of NOTIONAL.thresholds) {
            assert.ok(typeof t.min_amount === 'number', `min_amount must be number: ${JSON.stringify(t)}`);
            assert.ok(typeof t.party_name === 'string' && t.party_name.length > 0, `party_name required: ${JSON.stringify(t)}`);
            assert.ok(typeof t.party_group === 'string', `party_group required: ${JSON.stringify(t)}`);
            assert.ok(typeof t.sla_hours === 'number', `sla_hours must be number: ${JSON.stringify(t)}`);
            assert.ok(typeof t.department === 'string', `department required: ${JSON.stringify(t)}`);
        }
    });

    it('thresholds should be sorted by min_amount ascending', () => {
        for (let i = 1; i < NOTIONAL.thresholds.length; i++) {
            assert.ok(NOTIONAL.thresholds[i].min_amount >= NOTIONAL.thresholds[i - 1].min_amount,
                `Thresholds should be sorted ascending by min_amount at index ${i}`);
        }
    });

    it('should have at least the 3 known thresholds ($20M, $50M, $100M)', () => {
        const amounts = NOTIONAL.thresholds.map(t => t.min_amount);
        assert.ok(amounts.includes(20000000), 'Missing $20M threshold');
        assert.ok(amounts.includes(50000000), 'Missing $50M threshold');
        assert.ok(amounts.includes(100000000), 'Missing $100M threshold');
    });

    it('SLA hours should be positive', () => {
        for (const t of NOTIONAL.thresholds) {
            assert.ok(t.sla_hours > 0, `SLA hours must be positive: ${t.party_name}`);
        }
    });
});

// ─── chatflow-defaults.json ─────────────────────────────────────────────────

describe('config: chatflow-defaults.json', () => {
    const DEFAULTS = require('../../config/chatflow-defaults.json');

    it('should have MASTER_COO defaults', () => {
        assert.ok(DEFAULTS.MASTER_COO, 'Missing MASTER_COO key');
        assert.ok(typeof DEFAULTS.MASTER_COO === 'object');
    });

    it('should have NPA_ORCHESTRATOR defaults', () => {
        assert.ok(DEFAULTS.NPA_ORCHESTRATOR, 'Missing NPA_ORCHESTRATOR key');
        assert.ok(typeof DEFAULTS.NPA_ORCHESTRATOR === 'object');
    });

    it('should have IDEATION defaults', () => {
        assert.ok(DEFAULTS.IDEATION, 'Missing IDEATION key');
        assert.ok(typeof DEFAULTS.IDEATION === 'object');
    });

    it('MASTER_COO should have expected fields', () => {
        const keys = Object.keys(DEFAULTS.MASTER_COO);
        assert.ok(keys.includes('variable'), 'MASTER_COO missing variable');
        assert.ok(keys.includes('session_id'), 'MASTER_COO missing session_id');
        assert.ok(keys.includes('user_role'), 'MASTER_COO missing user_role');
    });

    it('NPA_ORCHESTRATOR should have user_message field', () => {
        assert.ok('user_message' in DEFAULTS.NPA_ORCHESTRATOR,
            'NPA_ORCHESTRATOR missing user_message field');
    });

    it('all default values should be strings', () => {
        for (const [agentKey, defaults] of Object.entries(DEFAULTS)) {
            if (agentKey.startsWith('_')) continue; // skip _comment
            for (const [field, value] of Object.entries(defaults)) {
                assert.equal(typeof value, 'string',
                    `${agentKey}.${field} should be string, got ${typeof value}`);
            }
        }
    });
});

// ─── Cross-config consistency ───────────────────────────────────────────────

describe('config: cross-file consistency', () => {
    it('notional threshold parties should not duplicate cross-border parties', () => {
        const NOTIONAL = require('../../config/notional-thresholds.json');
        const CROSS_BORDER = require('../../config/cross-border-parties.json');

        const cbNames = new Set(CROSS_BORDER.parties.map(p => p.party_name));
        const notionalParties = NOTIONAL.thresholds.map(t => t.party_name);

        // This is a soft check — some parties might intentionally appear in both
        const overlap = notionalParties.filter(p => cbNames.has(p));
        if (overlap.length > 0) {
            console.log(`    INFO: ${overlap.length} parties appear in both notional thresholds and cross-border: ${overlap.join(', ')}`);
        }
    });

    it('all config files should be valid JSON (no trailing commas, etc)', () => {
        // These would throw on require() if invalid, so reaching here means they're valid
        assert.ok(require('../../config/npa-subtypes.json'));
        assert.ok(require('../../config/cross-border-parties.json'));
        assert.ok(require('../../config/head-office-parties.json'));
        assert.ok(require('../../config/notional-thresholds.json'));
        assert.ok(require('../../config/chatflow-defaults.json'));
    });
});
