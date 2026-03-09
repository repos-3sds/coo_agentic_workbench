/**
 * Unit Tests — Canonical Envelope Parser
 *
 * Tests parseEnvelope(), parseMarkers(), makeFallback(), makeError(),
 * extractWorkflowMeta(), isValidAction() from services/envelope-parser.js
 *
 * Run:  node --test server/tests/unit/envelope-parser.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    parseEnvelope,
    parseMarkers,
    makeFallback,
    makeError,
    extractWorkflowMeta,
    isValidAction,
    VALID_AGENT_ACTIONS,
    META_REGEX
} = require('../../services/envelope-parser');

// ─── parseEnvelope: @@NPA_META@@ format ─────────────────────────────────────

describe('parseEnvelope — @@NPA_META@@ format', () => {
    it('should parse valid @@NPA_META@@ envelope', () => {
        const meta = {
            agent_action: 'SHOW_CLASSIFICATION',
            agent_id: 'NPA_CLASSIFIER',
            payload: { tier: 'Variation', confidence: 0.92 },
            trace: { session_id: 'sess-123' }
        };
        const raw = `Here is your classification result.\n@@NPA_META@@${JSON.stringify(meta)}`;
        const result = parseEnvelope(raw);

        assert.equal(result.answer, 'Here is your classification result.');
        assert.equal(result.metadata.agent_action, 'SHOW_CLASSIFICATION');
        assert.equal(result.metadata.agent_id, 'NPA_CLASSIFIER');
        assert.equal(result.metadata.payload.tier, 'Variation');
        assert.equal(result.metadata.payload.confidence, 0.92);
        assert.equal(result.metadata.trace.session_id, 'sess-123');
    });

    it('should parse valid @@COO_META@@ envelope (backward compat)', () => {
        const meta = {
            agent_action: 'ROUTE_DOMAIN',
            agent_id: 'MASTER_COO',
            payload: { target_domain: 'ORM' },
            trace: {}
        };
        const raw = `Routing to ORM domain.\n@@COO_META@@${JSON.stringify(meta)}`;
        const result = parseEnvelope(raw);

        assert.equal(result.answer, 'Routing to ORM domain.');
        assert.equal(result.metadata.agent_action, 'ROUTE_DOMAIN');
        assert.equal(result.metadata.agent_id, 'MASTER_COO');
        assert.equal(result.metadata.payload.target_domain, 'ORM');
    });

    it('should strip trailing whitespace from answer before META marker', () => {
        const meta = { agent_action: 'SHOW_RAW_RESPONSE', agent_id: 'TEST' };
        const raw = `Hello world   \n\n@@NPA_META@@${JSON.stringify(meta)}`;
        const result = parseEnvelope(raw);
        assert.equal(result.answer, 'Hello world');
    });

    it('should handle multiline answer before META marker', () => {
        const meta = { agent_action: 'SHOW_RISK', agent_id: 'RISK_AGENT', payload: {} };
        const raw = `Line 1\nLine 2\nLine 3\n@@NPA_META@@${JSON.stringify(meta)}`;
        const result = parseEnvelope(raw);
        assert.equal(result.answer, 'Line 1\nLine 2\nLine 3');
    });

    it('should default agent_action to SHOW_RAW_RESPONSE if missing in META', () => {
        const meta = { agent_id: 'SOME_AGENT', payload: { data: 1 } };
        const raw = `Answer\n@@NPA_META@@${JSON.stringify(meta)}`;
        const result = parseEnvelope(raw);
        assert.equal(result.metadata.agent_action, 'SHOW_RAW_RESPONSE');
    });

    it('should default agent_id to UNKNOWN if missing in META', () => {
        const meta = { agent_action: 'SHOW_RISK', payload: {} };
        const raw = `Answer\n@@NPA_META@@${JSON.stringify(meta)}`;
        const result = parseEnvelope(raw);
        assert.equal(result.metadata.agent_id, 'UNKNOWN');
    });
});

// ─── parseEnvelope: [NPA_ACTION] marker format ──────────────────────────────

describe('parseEnvelope — [NPA_ACTION] marker format', () => {
    it('should parse valid NPA marker block', () => {
        const raw = [
            'Here is the ideation result.',
            '[NPA_ACTION] DELEGATE_AGENT',
            '[NPA_AGENT] NPA_IDEATION',
            '[NPA_TARGET] NPA_CLASSIFIER',
            '[NPA_PROJECT] proj-001',
            '[NPA_INTENT] classify_product',
            '[NPA_DATA] {"key": "value"}',
            '[NPA_SESSION] sess-456'
        ].join('\n');

        const result = parseEnvelope(raw);

        assert.equal(result.answer, 'Here is the ideation result.');
        assert.equal(result.metadata.agent_action, 'DELEGATE_AGENT');
        assert.equal(result.metadata.agent_id, 'NPA_IDEATION');
        assert.equal(result.metadata.payload.target_agent, 'NPA_CLASSIFIER');
        assert.equal(result.metadata.payload.projectId, 'proj-001');
        assert.equal(result.metadata.payload.intent, 'classify_product');
        assert.deepEqual(result.metadata.payload.data, { key: 'value' });
        assert.equal(result.metadata.trace.session_id, 'sess-456');
    });

    it('should handle markers with no answer text', () => {
        const raw = [
            '[NPA_ACTION] ASK_CLARIFICATION',
            '[NPA_AGENT] NPA_ORCH',
            '[NPA_SESSION] sess-789'
        ].join('\n');

        const result = parseEnvelope(raw);
        assert.equal(result.answer, '');
        assert.equal(result.metadata.agent_action, 'ASK_CLARIFICATION');
    });

    it('should handle [NPA_DATA] with invalid JSON gracefully', () => {
        const raw = [
            'Some answer',
            '[NPA_ACTION] SHOW_RAW_RESPONSE',
            '[NPA_AGENT] TEST',
            '[NPA_DATA] not-valid-json',
            '[NPA_SESSION] s1'
        ].join('\n');

        const result = parseEnvelope(raw);
        assert.equal(result.metadata.payload.data.raw_answer, 'not-valid-json');
    });

    it('should handle multiline answer before markers', () => {
        const raw = [
            'Line one.',
            'Line two.',
            '',
            'Line four after blank.',
            '[NPA_ACTION] SHOW_RAW_RESPONSE',
            '[NPA_AGENT] TEST',
            '[NPA_SESSION] s1'
        ].join('\n');

        const result = parseEnvelope(raw);
        assert.equal(result.answer, 'Line one.\nLine two.\n\nLine four after blank.');
    });
});

// ─── parseEnvelope: fallback (no envelope) ──────────────────────────────────

describe('parseEnvelope — fallback (no envelope)', () => {
    it('should return SHOW_RAW_RESPONSE for plain text', () => {
        const result = parseEnvelope('Just a plain answer with no metadata.');
        assert.equal(result.answer, 'Just a plain answer with no metadata.');
        assert.equal(result.metadata.agent_action, 'SHOW_RAW_RESPONSE');
        assert.equal(result.metadata.agent_id, 'UNKNOWN');
    });

    it('should handle empty string', () => {
        const result = parseEnvelope('');
        assert.equal(result.answer, '');
        assert.equal(result.metadata.agent_action, 'SHOW_RAW_RESPONSE');
    });

    it('should handle null input', () => {
        const result = parseEnvelope(null);
        assert.equal(result.answer, '');
        assert.equal(result.metadata.agent_action, 'SHOW_RAW_RESPONSE');
    });

    it('should handle undefined input', () => {
        const result = parseEnvelope(undefined);
        assert.equal(result.answer, '');
        assert.equal(result.metadata.agent_action, 'SHOW_RAW_RESPONSE');
    });

    it('should handle broken META JSON gracefully', () => {
        const raw = 'Some answer\n@@NPA_META@@{broken json!!!';
        const result = parseEnvelope(raw);
        // Should fall through to makeFallback since META JSON parse fails
        assert.equal(result.metadata.trace.error, 'META_PARSE_FAILED');
    });
});

// ─── parseMarkers ───────────────────────────────────────────────────────────

describe('parseMarkers', () => {
    it('should return null if no [NPA_ markers found', () => {
        assert.equal(parseMarkers('Just regular text'), null);
    });

    it('should return null if [NPA_ lines exist but no NPA_ACTION', () => {
        const raw = '[NPA_AGENT] TEST\n[NPA_SESSION] s1';
        assert.equal(parseMarkers(raw), null);
    });

    it('should parse minimal markers', () => {
        const raw = 'Answer\n[NPA_ACTION] SHOW_RAW_RESPONSE';
        const result = parseMarkers(raw);
        assert.ok(result, 'Should not be null');
        assert.equal(result.metadata.agent_action, 'SHOW_RAW_RESPONSE');
        assert.equal(result.answer, 'Answer');
    });
});

// ─── makeFallback ───────────────────────────────────────────────────────────

describe('makeFallback', () => {
    it('should create SHOW_RAW_RESPONSE envelope', () => {
        const fb = makeFallback('test answer');
        assert.equal(fb.agent_action, 'SHOW_RAW_RESPONSE');
        assert.equal(fb.agent_id, 'UNKNOWN');
        assert.equal(fb.payload.raw_answer, 'test answer');
        assert.equal(fb.trace.error, 'META_PARSE_FAILED');
    });

    it('should handle null/empty input', () => {
        const fb = makeFallback(null);
        assert.equal(fb.payload.raw_answer, '');
    });
});

// ─── makeError ──────────────────────────────────────────────────────────────

describe('makeError', () => {
    it('should create SHOW_ERROR envelope with all fields', () => {
        const err = makeError('NPA_RISK', 'TOOL_FAILURE', 'MCP tool failed', 'timeout after 30s');
        assert.equal(err.agent_action, 'SHOW_ERROR');
        assert.equal(err.agent_id, 'NPA_RISK');
        assert.equal(err.payload.error_type, 'TOOL_FAILURE');
        assert.equal(err.payload.message, 'MCP tool failed');
        assert.equal(err.payload.retry_allowed, true);
        assert.equal(err.trace.error_detail, 'timeout after 30s');
    });

    it('should default agent_id to UNKNOWN when null', () => {
        const err = makeError(null, 'ERR', 'msg');
        assert.equal(err.agent_id, 'UNKNOWN');
    });

    it('should default error_detail to empty string when omitted', () => {
        const err = makeError('A', 'E', 'M');
        assert.equal(err.trace.error_detail, '');
    });
});

// ─── extractWorkflowMeta ────────────────────────────────────────────────────

describe('extractWorkflowMeta', () => {
    it('should extract metadata from workflow outputs with agent_action', () => {
        const outputs = {
            agent_action: 'SHOW_PREDICTION',
            agent_id: 'NPA_RISK',
            payload: { risk_level: 'HIGH' },
            trace: { model: 'gpt-4o' }
        };
        const result = extractWorkflowMeta(outputs, 'NPA_RISK');
        assert.equal(result.agent_action, 'SHOW_PREDICTION');
        assert.equal(result.payload.risk_level, 'HIGH');
    });

    it('should wrap raw outputs as SHOW_RAW_RESPONSE when no agent_action', () => {
        const outputs = { result: 'some text', data: [1, 2, 3] };
        const result = extractWorkflowMeta(outputs, 'MY_AGENT');
        assert.equal(result.agent_action, 'SHOW_RAW_RESPONSE');
        assert.equal(result.agent_id, 'MY_AGENT');
        assert.equal(result.payload.result, 'some text');
    });

    it('should return error envelope when outputs is null', () => {
        const result = extractWorkflowMeta(null, 'WF_AGENT');
        assert.equal(result.agent_action, 'SHOW_ERROR');
        assert.equal(result.payload.error_type, 'WORKFLOW_FAILURE');
    });

    it('should use provided agentId when outputs.agent_id missing', () => {
        const outputs = { agent_action: 'SHOW_RAW_RESPONSE' };
        const result = extractWorkflowMeta(outputs, 'FALLBACK_ID');
        assert.equal(result.agent_id, 'FALLBACK_ID');
    });
});

// ─── isValidAction ──────────────────────────────────────────────────────────

describe('isValidAction', () => {
    it('should return true for all known actions', () => {
        const expected = [
            'ROUTE_DOMAIN', 'DELEGATE_AGENT', 'ASK_CLARIFICATION',
            'SHOW_CLASSIFICATION', 'SHOW_RISK', 'SHOW_PREDICTION',
            'SHOW_AUTOFILL', 'SHOW_GOVERNANCE', 'SHOW_DOC_STATUS',
            'SHOW_MONITORING', 'SHOW_KB_RESULTS', 'HARD_STOP',
            'STOP_PROCESS', 'FINALIZE_DRAFT', 'ROUTE_WORK_ITEM',
            'SHOW_RAW_RESPONSE', 'SHOW_ERROR'
        ];
        for (const action of expected) {
            assert.ok(isValidAction(action), `${action} should be valid`);
        }
    });

    it('should return false for unknown actions', () => {
        assert.ok(!isValidAction('INVALID_ACTION'));
        assert.ok(!isValidAction(''));
        assert.ok(!isValidAction('show_risk')); // case-sensitive
    });

    it('VALID_AGENT_ACTIONS set should have exactly 17 entries', () => {
        assert.equal(VALID_AGENT_ACTIONS.size, 17);
    });
});

// ─── META_REGEX ─────────────────────────────────────────────────────────────

describe('META_REGEX', () => {
    it('should match @@NPA_META@@{...}', () => {
        assert.ok(META_REGEX.test('text\n@@NPA_META@@{"a":1}'));
    });

    it('should match @@COO_META@@{...}', () => {
        assert.ok(META_REGEX.test('text\n@@COO_META@@{"a":1}'));
    });

    it('should NOT match @@OTHER_META@@{...}', () => {
        assert.ok(!META_REGEX.test('text\n@@OTHER_META@@{"a":1}'));
    });

    it('should NOT match bare META without JSON', () => {
        assert.ok(!META_REGEX.test('text\n@@NPA_META@@'));
    });

    it('should capture the JSON object', () => {
        const m = '@@NPA_META@@{"action":"test"}'.match(META_REGEX);
        assert.ok(m);
        assert.equal(m[1], '{"action":"test"}');
    });
});
