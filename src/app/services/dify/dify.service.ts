import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, Subject, BehaviorSubject } from 'rxjs';
import {
    AgentAction,
    AgentActivityUpdate,
    DifyChatResponse,
    DifyWorkflowResponse,
    DifyStreamChunk,
    AGENT_REGISTRY
} from '../../lib/agent-interfaces';

export interface DifyAgentResponse {
    answer: string;
    conversationId?: string;
    messageId?: string;
    metadata?: {
        agent_action?: AgentAction;
        payload?: any;
        agent_id?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DifyService {
    private useMockDify = true; // Toggle: true=mock, false=real Dify
    private conversationId: string | null = null;
    private conversationStep = 0;

    // Observable streams for real-time updates
    private agentActivity$ = new Subject<AgentActivityUpdate>();
    private streaming$ = new Subject<string>();

    constructor(private http: HttpClient) { }

    /** Get agent activity stream (which agents are running/done) */
    getAgentActivity(): Observable<AgentActivityUpdate> {
        return this.agentActivity$.asObservable();
    }

    /** Get streaming text chunks */
    getStreamingText(): Observable<string> {
        return this.streaming$.asObservable();
    }

    /**
     * Send a chat message to a Dify Chatflow agent (Tier 1 or 2)
     * Used for orchestrator conversations
     */
    sendMessage(query: string, userContext: any = {}, agentId: string = 'MASTER_COO'): Observable<DifyAgentResponse> {
        if (this.useMockDify) {
            return this.mockDifyLogic(query);
        }

        return this.http.post<DifyChatResponse>('/api/dify/chat', {
            agent_id: agentId,
            query,
            inputs: userContext,
            conversation_id: this.conversationId,
            user: 'user-123',
            response_mode: 'blocking'
        }).pipe(
            map(res => {
                this.conversationId = res.conversation_id;
                return {
                    answer: res.answer,
                    conversationId: res.conversation_id,
                    messageId: res.message_id,
                    metadata: res.metadata
                } as DifyAgentResponse;
            })
        );
    }

    /**
     * Send a chat message with SSE streaming support
     * Returns immediately, emits chunks via streaming$ observable
     */
    sendMessageStreaming(query: string, userContext: any = {}, agentId: string = 'MASTER_COO'): void {
        if (this.useMockDify) {
            // Mock streaming by emitting words with delay
            const words = 'I am analyzing your request and routing to the appropriate specialist agent...'.split(' ');
            let i = 0;
            const interval = setInterval(() => {
                if (i < words.length) {
                    this.streaming$.next(words[i] + ' ');
                    i++;
                } else {
                    clearInterval(interval);
                    this.streaming$.next('[DONE]');
                }
            }, 100);
            return;
        }

        // Real SSE streaming via fetch
        const body = JSON.stringify({
            agent_id: agentId,
            query,
            inputs: userContext,
            conversation_id: this.conversationId,
            user: 'user-123',
            response_mode: 'streaming'
        });

        fetch('/api/dify/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        }).then(response => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            const read = (): void => {
                reader?.read().then(({ done, value }) => {
                    if (done) {
                        this.streaming$.next('[DONE]');
                        return;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    // Parse SSE data lines
                    const lines = chunk.split('\n').filter(l => l.startsWith('data:'));
                    for (const line of lines) {
                        try {
                            const data: DifyStreamChunk = JSON.parse(line.slice(5).trim());
                            if (data.answer) {
                                this.streaming$.next(data.answer);
                            }
                            if (data.conversation_id) {
                                this.conversationId = data.conversation_id;
                            }
                        } catch { /* skip malformed chunks */ }
                    }
                    read();
                });
            };
            read();
        });
    }

    /**
     * Execute a Dify Workflow agent (Tier 3 or 4)
     * Used for specialist agent calls (classification, risk, etc.)
     */
    runWorkflow(agentId: string, inputs: Record<string, any> = {}): Observable<DifyWorkflowResponse> {
        if (this.useMockDify) {
            return this.mockWorkflow(agentId, inputs);
        }

        // Emit agent activity: running
        this.agentActivity$.next({ agentId, status: 'running' });

        return this.http.post<DifyWorkflowResponse>('/api/dify/workflow', {
            agent_id: agentId,
            inputs,
            user: 'user-123',
            response_mode: 'blocking'
        }).pipe(
            map(res => {
                // Emit agent activity: done
                this.agentActivity$.next({
                    agentId,
                    status: res.data.status === 'succeeded' ? 'done' : 'error'
                });
                return res;
            })
        );
    }

    /** Reset conversation state */
    reset(): void {
        this.conversationStep = 0;
        this.conversationId = null;
    }

    // ─── Mock Logic ──────────────────────────────────────────────

    /**
     * Master COO mock flow:
     *   Step 0: Domain detection (ROUTE_DOMAIN) + NPA greeting
     *   Step 1: Product description → Classification
     *   Step 2: Cross-border → Finalize
     *   Step 3+: Conversation done
     *
     * The Master COO first identifies the domain (NPA, Desk Support, etc.)
     * then hands off to the domain orchestrator. For Phase 0, only NPA is active.
     */
    private mockDifyLogic(query: string): Observable<DifyAgentResponse> {
        const lower = query.toLowerCase();

        // ─── Step 0: Master COO detects domain intent ───────────
        if (this.conversationStep === 0) {
            this.conversationStep++;
            const detectedDomain = this.detectDomain(lower);

            if (detectedDomain === 'NPA') {
                this.emitMockActivity(['MASTER_COO', 'NPA_ORCHESTRATOR']);
                return of({
                    answer: "I've identified this as a **New Product Approval** request. Routing you to the **NPA Domain Orchestrator**.\n\nPlease describe the product structure, underlying asset, and payout logic so I can begin the analysis.",
                    metadata: {
                        agent_action: 'ROUTE_DOMAIN' as const,
                        agent_id: 'MASTER_COO',
                        payload: {
                            domainId: 'NPA',
                            name: 'NPA Domain Orchestrator',
                            description: 'Create, classify, and manage New Product Approvals',
                            icon: 'target',
                            color: 'bg-orange-50 text-orange-600',
                            route: '/agents/npa'
                        }
                    }
                }).pipe(delay(1200));
            }

            if (detectedDomain === 'RISK') {
                this.emitMockActivity(['MASTER_COO', 'RISK']);
                return of({
                    answer: "I've identified this as a **Risk & Compliance** query. The Risk domain is currently in development.\n\nFor now, I can help you with NPA-related risk assessments through the NPA Agent. Would you like me to route you there?",
                    metadata: {
                        agent_action: 'ROUTE_DOMAIN' as const,
                        agent_id: 'MASTER_COO',
                        payload: {
                            domainId: 'RISK',
                            name: 'Risk Control Agent',
                            description: '4-layer risk cascade: Internal, Regulatory, Sanctions, Dynamic',
                            icon: 'shield-alert',
                            color: 'bg-red-50 text-red-600',
                            route: '/functions/orm'
                        }
                    }
                }).pipe(delay(1200));
            }

            if (detectedDomain === 'KB') {
                this.emitMockActivity(['MASTER_COO', 'KB_SEARCH']);
                return of({
                    answer: "I've routed your request to the **Knowledge Base Search Agent**. Let me search our SOPs, policies, and regulatory guidance for you.\n\nSearching...\n\n**Results (3 matches):**\n1. **MAS Notice 656** — Guidelines on Risk Management (92% match)\n2. **NPA SOP v4.2** — Standard Operating Procedure for Product Approvals (87% match)\n3. **T&M Policy Framework** — Trading & Markets Governance Policies (81% match)\n\nWould you like me to drill into any of these documents?",
                    metadata: {
                        agent_action: 'ROUTE_DOMAIN' as const,
                        agent_id: 'KB_SEARCH',
                        payload: {
                            domainId: 'KB',
                            name: 'KB Search Agent',
                            description: 'Semantic search over SOPs, policies, and regulatory guidance',
                            icon: 'search',
                            color: 'bg-fuchsia-50 text-fuchsia-600',
                            route: '/knowledge/base'
                        }
                    }
                }).pipe(delay(1500));
            }

            // Default: still route but explain capabilities
            this.emitMockActivity(['MASTER_COO']);
            return of({
                answer: "I'm the **Master COO Orchestrator**. I manage 7 COO domains:\n\n" +
                    "* **New Product Approval (NPA)** — Active\n" +
                    "* **Desk Support** — Coming Soon\n" +
                    "* **DCE Client Services** — Coming Soon\n" +
                    "* **Operational Risk** — Coming Soon\n" +
                    "* **Strategic PM** — Coming Soon\n" +
                    "* **Business Leads** — Coming Soon\n" +
                    "* **Business Analysis** — Coming Soon\n\n" +
                    "Currently, the **NPA domain** is fully active. Try asking me to create a new product, run a risk check, or search the knowledge base."
            }).pipe(delay(1000));
        }

        // ─── Step 1: Within NPA domain — Product description → Classification ───
        if (this.conversationStep === 1) {
            this.conversationStep++;

            if (lower.includes('crypto') || lower.includes('bitcoin')) {
                this.emitMockActivity(['CLASSIFIER', 'RISK']);
                return of({
                    answer: "**HARD STOP** — Prohibited item detected.\n\nMy analysis classifies this as a **New-to-Group (NTG)** product involving Crypto assets, which is on the **Prohibited List** (Layer: REGULATORY).\n\nYou cannot proceed with an NPA. Contact the Product Approval Committee for exemption review.",
                    metadata: {
                        agent_action: 'STOP_PROCESS' as const,
                        agent_id: 'RISK',
                        payload: {
                            type: 'NTG',
                            track: 'Prohibited',
                            hardStop: true,
                            prohibitedMatch: { matched: true, item: 'Cryptocurrency', layer: 'REGULATORY' }
                        }
                    }
                }).pipe(delay(2000));
            }

            this.emitMockActivity(['CLASSIFIER', 'KB_SEARCH', 'ML_PREDICT']);
            return of({
                answer: "I've analyzed your description and activated specialist agents:\n\n**Classification Agent**: Variation / Existing product\n**KB Search**: Found similar NPA 'TSG1917' (94% match)\n**ML Prediction**: 82% approval likelihood, est. 35 days\n\nOne critical check: **Will this product involve booking across multiple locations (Cross-Border)?**",
                metadata: {
                    agent_action: 'SHOW_CLASSIFICATION' as const,
                    agent_id: 'CLASSIFIER',
                    payload: {
                        type: 'Variation',
                        track: 'NPA Lite',
                        scores: [
                            { criterion: 'Novelty', score: 3, maxScore: 10, reasoning: 'Similar to existing FX products' },
                            { criterion: 'Complexity', score: 5, maxScore: 10, reasoning: 'Standard structured product' },
                            { criterion: 'Risk Impact', score: 4, maxScore: 10, reasoning: 'Within approved risk appetite' },
                            { criterion: 'Regulatory', score: 2, maxScore: 10, reasoning: 'Covered under existing MAS framework' },
                            { criterion: 'Technology', score: 3, maxScore: 10, reasoning: 'Minor booking system changes' },
                            { criterion: 'Market', score: 4, maxScore: 10, reasoning: 'Established market segment' },
                            { criterion: 'Cross-Border', score: 2, maxScore: 10, reasoning: 'Single jurisdiction expected' }
                        ],
                        overallConfidence: 88,
                        prohibitedMatch: { matched: false }
                    }
                }
            }).pipe(delay(2000));
        }

        // ─── Step 2: Cross-border answer → Finalize ───
        if (this.conversationStep === 2) {
            this.conversationStep++;
            const isCrossBorder = lower.includes('yes') || lower.includes('hk') || lower.includes('london') || lower.includes('hong kong');

            this.emitMockActivity(['GOVERNANCE', 'AUTOFILL', 'DOC_LIFECYCLE']);

            let answer = "All specialist agents have completed their analysis:\n\n### Summary\n";
            answer += `* **Track**: NPA Lite (Variation)\n`;
            answer += `* **Cross-Border**: ${isCrossBorder ? 'YES' : 'NO'}\n`;
            answer += `* **AutoFill**: Template 85% pre-populated from TSG1917\n`;

            if (isCrossBorder) {
                answer += "* **Mandatory Sign-Offs**: Finance, Credit, MLR, Tech, Ops\n";
            } else {
                answer += "* **Mandatory Sign-Offs**: Finance, Credit, Ops\n";
            }

            answer += "\nThe NPA draft has been created. Access it from the notification below.";

            return of({
                answer,
                metadata: {
                    agent_action: 'FINALIZE_DRAFT' as const,
                    payload: {
                        track: 'NPA_LITE',
                        isCrossBorder,
                        mandatorySignOffs: isCrossBorder
                            ? ['FINANCE', 'CREDIT', 'MLR', 'TECH', 'OPS']
                            : ['FINANCE', 'CREDIT', 'OPS'],
                        autoFillCoverage: 85,
                        mlPrediction: { approvalLikelihood: 82, timelineDays: 35, bottleneckDept: 'Legal' }
                    }
                }
            }).pipe(delay(2500));
        }

        return of({
            answer: "I've completed this analysis. You can reset the conversation to start a new query, or use the button above to open the full NPA workspace."
        }).pipe(delay(500));
    }

    /** Detect which COO domain the user is asking about */
    private detectDomain(lower: string): 'NPA' | 'RISK' | 'KB' | 'OPS' | 'DESK' | 'GENERAL' {
        const npaKeywords = ['npa', 'new product', 'product approval', 'create a product', 'structured note',
            'structured product', 'derivative', 'etf', 'fx accumulator', 'fx option', 'bond', 'swap',
            'approval', 'classify', 'classification', 'ideation', 'concept paper', 'prohibited'];
        const riskKeywords = ['risk assessment', 'risk check', 'compliance check', 'regulatory', 'sanctions',
            'prohibited list', 'risk cascade', 'operational risk', 'credit risk', 'market risk'];
        const kbKeywords = ['search', 'knowledge', 'sop', 'policy', 'guideline', 'mas notice', 'regulation',
            'documentation', 'procedure', 'framework'];
        const opsKeywords = ['settlement', 'booking', 'murex', 'operations', 'workflow', 'process flow'];
        const deskKeywords = ['desk support', 'trade error', 'booking error', 'system access', 'entitlement'];

        if (npaKeywords.some(k => lower.includes(k))) return 'NPA';
        if (riskKeywords.some(k => lower.includes(k))) return 'RISK';
        if (kbKeywords.some(k => lower.includes(k))) return 'KB';
        if (opsKeywords.some(k => lower.includes(k))) return 'OPS';
        if (deskKeywords.some(k => lower.includes(k))) return 'DESK';
        return 'GENERAL';
    }

    private mockWorkflow(agentId: string, inputs: Record<string, any>): Observable<DifyWorkflowResponse> {
        this.agentActivity$.next({ agentId, status: 'running' });

        const mockOutputs: Record<string, any> = {
            CLASSIFIER: {
                type: 'Variation', track: 'NPA Lite',
                scores: [{ criterion: 'Novelty', score: 3, maxScore: 10 }],
                overallConfidence: 88
            },
            RISK: {
                layers: [
                    { name: 'Internal Policy', status: 'PASS', details: 'Compliant' },
                    { name: 'Regulatory', status: 'PASS', details: 'MAS 656 compliant' },
                    { name: 'Sanctions', status: 'PASS', details: 'No matches' },
                    { name: 'Dynamic', status: 'WARNING', details: 'Elevated market volatility' }
                ],
                overallScore: 72, hardStop: false
            },
            ML_PREDICT: {
                approvalLikelihood: 82, timelineDays: 35,
                bottleneckDept: 'Legal', riskScore: 28
            },
            KB_SEARCH: {
                results: [
                    { docId: 'TSG1917', title: 'FX Structured Note', snippet: 'Similar FX derivative...', similarity: 0.94, source: 'Historical NPAs' },
                    { docId: 'TSG1845', title: 'Interest Rate Swap', snippet: 'IR product with...', similarity: 0.87, source: 'Historical NPAs' }
                ]
            },
            AUTOFILL: {
                fieldsFilled: 36, fieldsAdapted: 5, fieldsManual: 6,
                totalFields: 47, coveragePct: 85, timeSavedMinutes: 42
            },
            GOVERNANCE: {
                signoffs: [
                    { department: 'Finance', status: 'PENDING' },
                    { department: 'Credit', status: 'PENDING' },
                    { department: 'Operations', status: 'PENDING' }
                ],
                slaStatus: 'on_track', loopBackCount: 0, circuitBreaker: false
            }
        };

        return of({
            workflow_run_id: `wf-${Date.now()}`,
            task_id: `task-${Date.now()}`,
            data: {
                outputs: mockOutputs[agentId] || {},
                status: 'succeeded' as const
            }
        }).pipe(
            delay(1500),
            map(res => {
                this.agentActivity$.next({ agentId, status: 'done' });
                return res;
            })
        );
    }

    private emitMockActivity(agents: string[]): void {
        agents.forEach((agentId, i) => {
            setTimeout(() => {
                this.agentActivity$.next({ agentId, status: 'running' });
            }, i * 300);
            setTimeout(() => {
                this.agentActivity$.next({ agentId, status: 'done' });
            }, 1000 + i * 500);
        });
    }
}
