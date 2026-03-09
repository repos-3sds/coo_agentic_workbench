/**
 * Unit Tests — SSE Stream Collectors
 *
 * Tests collectChatSSEStream(), collectWorkflowSSEStream(),
 * and extractStructuredDataFromTrace() from services/sse-collector.js
 *
 * Uses a mock readable stream (EventEmitter) to simulate Dify SSE responses.
 *
 * Run:  node --test server/tests/unit/sse-collector.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const {
    collectChatSSEStream,
    collectWorkflowSSEStream,
    extractStructuredDataFromTrace
} = require('../../services/sse-collector');

// ─── Helper: create mock SSE stream ─────────────────────────────────────────

function createMockStream() {
    const stream = new EventEmitter();
    stream._chunks = [];

    /**
     * Send an SSE event as a data chunk.
     * @param {object} evt - The event payload (will be JSON-serialized)
     */
    stream.sendEvent = (evt) => {
        const line = `data: ${JSON.stringify(evt)}\n\n`;
        stream.emit('data', Buffer.from(line));
    };

    /**
     * Send raw text chunk (for testing partial buffer handling).
     */
    stream.sendRaw = (text) => {
        stream.emit('data', Buffer.from(text));
    };

    /**
     * End the stream.
     */
    stream.finish = () => {
        stream.emit('end');
    };

    /**
     * Emit an error.
     */
    stream.fail = (err) => {
        stream.emit('error', err);
    };

    return stream;
}

// ─── collectChatSSEStream ───────────────────────────────────────────────────

describe('collectChatSSEStream', () => {
    it('should collect agent_message events into fullAnswer', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        stream.sendEvent({ event: 'agent_message', answer: 'Hello ' });
        stream.sendEvent({ event: 'agent_message', answer: 'world!' });
        stream.sendEvent({
            event: 'message_end',
            conversation_id: 'conv-1',
            message_id: 'msg-1'
        });
        stream.finish();

        const result = await promise;
        assert.equal(result.fullAnswer, 'Hello world!');
        assert.equal(result.conversationId, 'conv-1');
        assert.equal(result.messageId, 'msg-1');
        assert.equal(result.streamError, null);
    });

    it('should collect "message" events (non-agent chatflow)', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        stream.sendEvent({ event: 'message', answer: 'Response from chatflow.' });
        stream.sendEvent({ event: 'message_end', conversation_id: 'c2', message_id: 'm2' });
        stream.finish();

        const result = await promise;
        assert.equal(result.fullAnswer, 'Response from chatflow.');
        assert.equal(result.conversationId, 'c2');
    });

    it('should capture Dify error events without rejecting', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        stream.sendEvent({ event: 'agent_message', answer: 'Partial ' });
        stream.sendEvent({
            event: 'error',
            code: 'TOOL_TIMEOUT',
            message: 'Tool X timed out',
            status: 500
        });
        stream.sendEvent({ event: 'agent_message', answer: 'recovery.' });
        stream.finish();

        const result = await promise;
        assert.equal(result.fullAnswer, 'Partial recovery.');
        assert.ok(result.streamError, 'Should have captured stream error');
        assert.equal(result.streamError.code, 'TOOL_TIMEOUT');
        assert.equal(result.streamError.message, 'Tool X timed out');
        assert.equal(result.streamError.status, 500);
    });

    it('should reject on network-level stream error', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        stream.sendEvent({ event: 'agent_message', answer: 'partial' });
        stream.fail(new Error('ECONNRESET'));

        await assert.rejects(promise, { message: 'ECONNRESET' });
    });

    it('should handle empty stream (no events)', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);
        stream.finish();

        const result = await promise;
        assert.equal(result.fullAnswer, '');
        assert.equal(result.conversationId, null);
        assert.equal(result.messageId, null);
    });

    it('should capture IDs from any event type', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        stream.sendEvent({
            event: 'agent_thought',
            conversation_id: 'conv-from-thought',
            message_id: 'msg-from-thought'
        });
        stream.finish();

        const result = await promise;
        assert.equal(result.conversationId, 'conv-from-thought');
        assert.equal(result.messageId, 'msg-from-thought');
    });

    it('should handle chunked SSE data (split across buffers)', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        // Split a single SSE event across two chunks
        const fullEvent = `data: {"event":"agent_message","answer":"chunked"}\n\n`;
        const half1 = fullEvent.substring(0, 20);
        const half2 = fullEvent.substring(20);

        stream.sendRaw(half1);
        stream.sendRaw(half2);
        stream.finish();

        const result = await promise;
        assert.equal(result.fullAnswer, 'chunked');
    });

    it('should skip malformed SSE lines gracefully', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        stream.sendRaw('data: not-valid-json\n\n');
        stream.sendEvent({ event: 'agent_message', answer: 'Good data.' });
        stream.finish();

        const result = await promise;
        assert.equal(result.fullAnswer, 'Good data.');
    });

    it('should process remaining buffer on stream end', async () => {
        const stream = createMockStream();
        const promise = collectChatSSEStream(stream);

        // Send event WITHOUT trailing newline (so it stays in buffer until end)
        stream.sendRaw('data: {"event":"agent_message","answer":"buffered"}');
        stream.finish();

        const result = await promise;
        assert.equal(result.fullAnswer, 'buffered');
    });
});

// ─── collectWorkflowSSEStream ───────────────────────────────────────────────

describe('collectWorkflowSSEStream', () => {
    it('should collect basic workflow lifecycle', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);

        stream.sendEvent({
            event: 'workflow_started',
            workflow_run_id: 'wf-run-1',
            task_id: 'task-1'
        });
        stream.sendEvent({
            event: 'text_chunk',
            data: { text: 'The risk assessment ' }
        });
        stream.sendEvent({
            event: 'text_chunk',
            data: { text: 'is complete.' }
        });
        stream.sendEvent({
            event: 'workflow_finished',
            workflow_run_id: 'wf-run-1',
            task_id: 'task-1',
            data: {
                status: 'succeeded',
                outputs: { result: 'original result', extra_field: true }
            }
        });
        stream.finish();

        const result = await promise;
        // text_chunks should override outputs.result (since it was a string, not array)
        assert.equal(result.outputs.result, 'The risk assessment is complete.');
        assert.equal(result.workflowRunId, 'wf-run-1');
        assert.equal(result.taskId, 'task-1');
        assert.equal(result.status, 'succeeded');
        assert.equal(result.streamError, null);
    });

    it('should capture workflow_finished error', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);

        stream.sendEvent({
            event: 'workflow_finished',
            data: {
                status: 'failed',
                outputs: {},
                error: 'PluginInvokeError: MCP tool timed out'
            }
        });
        stream.finish();

        const result = await promise;
        assert.ok(result.streamError, 'Should have stream error');
        assert.equal(result.streamError.code, 'WORKFLOW_EXECUTION_ERROR');
        assert.ok(result.streamError.message.includes('PluginInvokeError'));
    });

    it('should capture SSE error event and set status=failed', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);

        stream.sendEvent({
            event: 'error',
            code: 'RATE_LIMIT',
            message: 'Too many requests',
            status: 429
        });
        stream.finish();

        const result = await promise;
        assert.equal(result.status, 'failed');
        assert.equal(result.streamError.code, 'RATE_LIMIT');
    });

    it('should handle ReAct trace array with textChunks', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);

        stream.sendEvent({
            event: 'text_chunk',
            data: { text: 'Final answer from agent.' }
        });
        stream.sendEvent({
            event: 'workflow_finished',
            data: {
                status: 'succeeded',
                outputs: {
                    result: [
                        { data: { thought: 'I need to call tool X', action: 'toolX' } },
                        { data: { observation: 'Tool X returned data' } }
                    ]
                }
            }
        });
        stream.finish();

        const result = await promise;
        // Text chunks should be primary result
        assert.equal(result.outputs.result, 'Final answer from agent.');
        // Trace array should be preserved in _trace
        assert.ok(Array.isArray(result.outputs._trace), '_trace should be preserved');
        assert.equal(result.outputs._trace.length, 2);
    });

    it('should extract from ReAct trace when NO textChunks', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);

        stream.sendEvent({
            event: 'workflow_finished',
            data: {
                status: 'succeeded',
                outputs: {
                    result: [
                        {
                            data: {
                                thought: 'Calling search tool',
                                action: 'kb_search',
                                observation: '{"data": {"results": ["item1", "item2"]}}'
                            }
                        }
                    ]
                }
            }
        });
        stream.finish();

        const result = await promise;
        // Should have extracted structured data from trace
        assert.ok(result.outputs._trace, 'Should preserve trace');
        // result should be JSON string of extracted data
        assert.ok(typeof result.outputs.result === 'string', 'Result should be JSON string');
        const parsed = JSON.parse(result.outputs.result);
        assert.ok(parsed._fromTrace, 'Should have _fromTrace flag');
    });

    it('should reject on network error', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);

        stream.fail(new Error('Connection refused'));
        await assert.rejects(promise, { message: 'Connection refused' });
    });

    it('should handle empty stream', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);
        stream.finish();

        const result = await promise;
        assert.deepEqual(result.outputs, {});
        assert.equal(result.workflowRunId, null);
        assert.equal(result.taskId, null);
        assert.equal(result.status, 'unknown');
    });

    it('should capture IDs from any event type', async () => {
        const stream = createMockStream();
        const promise = collectWorkflowSSEStream(stream);

        stream.sendEvent({
            event: 'node_finished',
            workflow_run_id: 'wf-from-node',
            task_id: 'task-from-node'
        });
        stream.finish();

        const result = await promise;
        assert.equal(result.workflowRunId, 'wf-from-node');
        assert.equal(result.taskId, 'task-from-node');
    });
});

// ─── extractStructuredDataFromTrace ─────────────────────────────────────────

describe('extractStructuredDataFromTrace', () => {
    it('should return null for empty array', () => {
        assert.equal(extractStructuredDataFromTrace([]), null);
    });

    it('should return null for non-array input', () => {
        assert.equal(extractStructuredDataFromTrace('not an array'), null);
        assert.equal(extractStructuredDataFromTrace(null), null);
        assert.equal(extractStructuredDataFromTrace(undefined), null);
    });

    it('should extract JSON from tool response pattern', () => {
        const trace = [
            {
                data: {
                    thought: 'Looking up data',
                    observation: 'tool response: {"status": "found", "count": 5}\nDone.'
                }
            }
        ];
        const result = extractStructuredDataFromTrace(trace);
        assert.ok(result, 'Should extract data');
        assert.equal(result.status, 'found');
        assert.equal(result.count, 5);
        assert.equal(result._fromTrace, true);
    });

    it('should extract from observation parsed as JSON', () => {
        const trace = [
            {
                data: {
                    observation: JSON.stringify({ data: { name: 'Test', value: 42 } })
                }
            }
        ];
        const result = extractStructuredDataFromTrace(trace);
        assert.ok(result);
        assert.equal(result.name, 'Test');
        assert.equal(result.value, 42);
    });

    it('should extract from object observation with data property', () => {
        const trace = [
            {
                data: {
                    observation: { data: { key1: 'a', key2: 'b' } }
                }
            }
        ];
        const result = extractStructuredDataFromTrace(trace);
        assert.ok(result);
        assert.equal(result.key1, 'a');
        assert.equal(result.key2, 'b');
    });

    it('should capture last (longest) agent thought', () => {
        const trace = [
            { data: { thought: 'Short' } },
            { data: { thought: 'A much longer thought process here' } },
            { data: { thought: 'Medium thought' } }
        ];
        const result = extractStructuredDataFromTrace(trace);
        // The longest thought should be captured, even if not the last item
        // NOTE: the code picks by length comparison, not position
        assert.ok(result);
        assert.equal(result._agentThought, 'A much longer thought process here');
    });

    it('should capture _lastAction from action_name', () => {
        const trace = [
            {
                data: {
                    action_name: 'kb_search',
                    action_input: { query: 'test' },
                    observation: '{"results": []}'
                }
            }
        ];
        const result = extractStructuredDataFromTrace(trace);
        assert.ok(result);
        assert.equal(result._lastAction, 'kb_search');
    });

    it('should merge data from multiple trace items', () => {
        const trace = [
            {
                data: {
                    observation: '{"alpha": 1}'
                }
            },
            {
                data: {
                    observation: '{"beta": 2}'
                }
            }
        ];
        const result = extractStructuredDataFromTrace(trace);
        assert.ok(result);
        assert.equal(result.alpha, 1);
        assert.equal(result.beta, 2);
        assert.equal(result._traceItems, 2);
    });

    it('should return null when trace has no useful data (only _fromTrace, _traceItems, _toolObservations)', () => {
        const trace = [
            { data: {} },
            { data: { something_unrelated: true } }
        ];
        const result = extractStructuredDataFromTrace(trace);
        // Should return null because only meta fields are present (<=3 keys)
        assert.equal(result, null);
    });

    it('should truncate _agentThought to 1000 chars', () => {
        const longThought = 'x'.repeat(2000);
        const trace = [
            {
                data: {
                    thought: longThought,
                    observation: '{"marker": true}'
                }
            }
        ];
        const result = extractStructuredDataFromTrace(trace);
        assert.ok(result);
        assert.equal(result._agentThought.length, 1000);
    });

    it('should handle items without .data wrapper', () => {
        // Some trace items have data directly on the item (not nested under .data)
        const trace = [
            {
                observation: '{"direct": true}',
                thought: 'Direct thought'
            }
        ];
        const result = extractStructuredDataFromTrace(trace);
        assert.ok(result);
        assert.equal(result.direct, true);
    });
});
