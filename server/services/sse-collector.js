/**
 * SSE Stream Collectors
 *
 * Collects Server-Sent Events (SSE) streams from Dify into complete responses.
 * Extracted from dify-proxy.js to be reusable and independently testable.
 *
 * Two collectors:
 *   1. collectChatSSEStream()     — For Chatflow/Agent apps
 *   2. collectWorkflowSSEStream() — For Workflow apps
 *
 * Also includes extractStructuredDataFromTrace() for extracting useful data
 * from ReAct agent trace arrays when agents exhaust iterations.
 *
 * @module services/sse-collector
 */

/**
 * Collect SSE stream from Dify Chatflow/Agent app into a complete response.
 *
 * SSE event types from Dify Agent app:
 *   - agent_message: text chunks from the LLM (incremental answer)
 *   - agent_thought: reasoning steps, tool calls
 *   - message_end: final event with conversation_id, message_id
 *   - message_file: file attachments
 *   - error: error events
 *
 * @param {ReadableStream} stream - SSE response stream from Dify
 * @returns {Promise<{ fullAnswer: string, conversationId: string|null, messageId: string|null, streamError: object|null }>}
 */
function collectChatSSEStream(stream) {
    return new Promise((resolve, reject) => {
        let fullAnswer = '';
        let conversationId = null;
        let messageId = null;
        let buffer = '';
        let streamError = null;
        const debug = process.env.DIFY_DEBUG === '1';

        stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const jsonStr = line.slice(5).trim();
                if (!jsonStr) continue;

                try {
                    const evt = JSON.parse(jsonStr);

                    if (evt.event === 'agent_message' || evt.event === 'message') {
                        fullAnswer += (evt.answer || '');
                    } else if (evt.event === 'message_end') {
                        conversationId = evt.conversation_id || conversationId;
                        messageId = evt.message_id || messageId;
                    } else if (evt.event === 'error') {
                        // Dify-level error (e.g. tool failure mid-stream).
                        // Capture it but DON'T reject — wait for stream end.
                        // If we already have a partial answer we can still return it.
                        streamError = {
                            code: evt.code || 'DIFY_STREAM_ERROR',
                            message: evt.message || 'Dify stream error',
                            status: evt.status || 500
                        };
                        if (debug) {
                            console.warn(`[SSE] Dify error event: ${evt.code} — ${evt.message}`);
                        }
                    }

                    // Capture IDs from any event that has them
                    if (evt.conversation_id) conversationId = evt.conversation_id;
                    if (evt.message_id) messageId = evt.message_id;
                } catch { /* skip malformed SSE lines */ }
            }
        });

        stream.on('end', () => {
            // Process any remaining buffer
            if (buffer.startsWith('data:')) {
                const jsonStr = buffer.slice(5).trim();
                try {
                    const evt = JSON.parse(jsonStr);
                    if (evt.event === 'agent_message' || evt.event === 'message') {
                        fullAnswer += (evt.answer || '');
                    }
                    if (evt.conversation_id) conversationId = evt.conversation_id;
                    if (evt.message_id) messageId = evt.message_id;
                } catch { /* ignore */ }
            }

            // If we got a Dify error but also have a partial answer, return both.
            // If we got an error with NO answer, still resolve (let caller handle empty answer).
            resolve({ fullAnswer, conversationId, messageId, streamError });
        });

        stream.on('error', (err) => {
            // Network-level error (TCP disconnect, etc.) — truly fatal
            reject(err);
        });
    });
}

/**
 * Collect SSE stream from Dify Workflow run into a complete response.
 *
 * Workflow SSE event types differ from Chat:
 *   - workflow_started: initial event with task_id, workflow_run_id
 *   - node_started / node_finished: per-node progress (optional)
 *   - text_chunk: incremental text from LLM nodes
 *   - workflow_finished: final event with data.outputs, data.status
 *   - error: error events
 *
 * Post-processing (in stream end handler):
 *   - Merges text_chunk content into outputs.result
 *   - Handles ReAct trace arrays: preserves trace, extracts tool observations
 *   - Calls extractStructuredDataFromTrace() when agents exhaust iterations
 *
 * @param {ReadableStream} stream - SSE response stream from Dify
 * @returns {Promise<{ outputs: object, workflowRunId: string|null, taskId: string|null, status: string, streamError: object|null }>}
 */
function collectWorkflowSSEStream(stream) {
    return new Promise((resolve, reject) => {
        let outputs = {};
        let workflowRunId = null;
        let taskId = null;
        let status = 'unknown';
        let buffer = '';
        let streamError = null;
        let textChunks = ''; // Collect text_chunk events for LLM output

        stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const jsonStr = line.slice(5).trim();
                if (!jsonStr) continue;

                try {
                    const evt = JSON.parse(jsonStr);

                    if (evt.event === 'workflow_started') {
                        workflowRunId = evt.workflow_run_id || workflowRunId;
                        taskId = evt.task_id || taskId;
                    } else if (evt.event === 'workflow_finished') {
                        workflowRunId = evt.workflow_run_id || workflowRunId;
                        taskId = evt.task_id || taskId;
                        outputs = evt.data?.outputs || {};
                        status = evt.data?.status || 'succeeded';
                        // Capture workflow-level error (e.g., MCP PluginInvokeError)
                        if (evt.data?.error) {
                            streamError = {
                                code: 'WORKFLOW_EXECUTION_ERROR',
                                message: evt.data.error,
                                status: 500
                            };
                            console.warn(`[WF SSE] Workflow error: ${evt.data.error.substring(0, 200)}`);
                        }
                    } else if (evt.event === 'text_chunk') {
                        textChunks += (evt.data?.text || '');
                    } else if (evt.event === 'node_finished') {
                        // Capture outputs from individual nodes as fallback
                        // (only used if workflow_finished never arrives)
                    } else if (evt.event === 'error') {
                        streamError = {
                            code: evt.code || 'DIFY_WORKFLOW_STREAM_ERROR',
                            message: evt.message || 'Dify workflow stream error',
                            status: evt.status || 500
                        };
                        status = 'failed';
                        console.warn(`[WF SSE] Dify error event: ${evt.code} — ${evt.message}`);
                    }

                    // Capture IDs from any event
                    if (evt.workflow_run_id) workflowRunId = evt.workflow_run_id;
                    if (evt.task_id) taskId = evt.task_id;
                } catch { /* skip malformed SSE lines */ }
            }
        });

        stream.on('end', () => {
            // Process remaining buffer
            if (buffer.startsWith('data:')) {
                const jsonStr = buffer.slice(5).trim();
                try {
                    const evt = JSON.parse(jsonStr);
                    if (evt.event === 'workflow_finished') {
                        outputs = evt.data?.outputs || outputs;
                        status = evt.data?.status || status;
                    }
                    if (evt.workflow_run_id) workflowRunId = evt.workflow_run_id;
                    if (evt.task_id) taskId = evt.task_id;
                } catch { /* ignore */ }
            }

            // Dify workflow Agent Nodes return their internal ReAct traces
            // inside `workflow_finished.data.outputs.result` as an Array.
            // The LLM's actual final answer comes via `text_chunk` SSE events.
            if (textChunks) {
                if (Array.isArray(outputs.result)) {
                    // ReAct trace array — preserve trace but add the text answer as primary
                    outputs._trace = outputs.result;
                    outputs.result = textChunks;
                    console.log(`[WF SSE] ReAct trace (${outputs._trace.length} items) — using textChunks as result`);
                } else {
                    outputs.result = textChunks;
                }
            } else if (Array.isArray(outputs.result)) {
                // No text chunks AND result is a trace array — extract tool observations
                // This happens when agents exhaust iterations before producing final text
                console.log(`[WF SSE] ReAct trace with NO textChunks — extracting tool observations`);
                outputs._trace = outputs.result;
                const extracted = extractStructuredDataFromTrace(outputs.result);
                if (extracted) {
                    outputs.result = JSON.stringify(extracted);
                    console.log(`[WF SSE] Extracted ${Object.keys(extracted).length} keys from trace observations`);
                }
            }

            resolve({ outputs, workflowRunId, taskId, status, streamError });
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}

// ─── Helper: Extract structured data from ReAct agent trace ─────────────────

/**
 * When a Dify ReAct agent exhausts its iteration limit without producing final text,
 * the trace array contains tool call observations with useful structured data.
 * This function extracts and merges that data into a single JSON object.
 *
 * @param {Array} traceArray - ReAct trace array from workflow outputs.result
 * @returns {object|null} Merged structured data or null if no useful data found
 */
function extractStructuredDataFromTrace(traceArray) {
    if (!Array.isArray(traceArray) || traceArray.length === 0) return null;

    const merged = { _fromTrace: true, _traceItems: traceArray.length };
    const toolObservations = [];
    let lastThought = '';

    for (const item of traceArray) {
        const data = item.data || item;

        // Extract tool observations (contain actual structured responses)
        const observation = data.observation || data.tool_output || '';
        if (observation) {
            // Try to extract JSON from "tool response: {...}" patterns
            const toolRx = /tool response:\s*(\{[\s\S]*?\})\s*(?=\n|$)/g;
            let m;
            while ((m = toolRx.exec(typeof observation === 'string' ? observation : JSON.stringify(observation))) !== null) {
                try {
                    const parsed = JSON.parse(m[1]);
                    toolObservations.push(parsed);
                    if (parsed.data) Object.assign(merged, parsed.data);
                    else Object.assign(merged, parsed);
                } catch { /* skip */ }
            }
            // Also try parsing the entire observation as JSON
            if (typeof observation === 'string') {
                try {
                    const obsJson = JSON.parse(observation);
                    if (obsJson.data) Object.assign(merged, obsJson.data);
                    else if (typeof obsJson === 'object' && !Array.isArray(obsJson)) Object.assign(merged, obsJson);
                } catch { /* not JSON */ }
            } else if (typeof observation === 'object') {
                if (observation.data) Object.assign(merged, observation.data);
                else Object.assign(merged, observation);
            }
        }

        // Capture LLM thoughts (the last thought often contains the "answer" it was about to emit)
        const thought = data.thought || '';
        if (thought && thought.length > lastThought.length) {
            lastThought = thought;
        }

        // Extract from action_input (tool call parameters)
        const actionName = data.action_name || data.action || '';
        const actionInput = data.action_input || {};
        if (actionName && typeof actionInput === 'object') {
            merged._lastAction = actionName;
        }
    }

    if (lastThought) {
        merged._agentThought = lastThought.substring(0, 1000);
    }
    merged._toolObservations = toolObservations.length;

    return Object.keys(merged).length > 3 ? merged : null; // >3 because of _fromTrace, _traceItems, _toolObservations
}

module.exports = {
    collectChatSSEStream,
    collectWorkflowSSEStream,
    extractStructuredDataFromTrace
};
