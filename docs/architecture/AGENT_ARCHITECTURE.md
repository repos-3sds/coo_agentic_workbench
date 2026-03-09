# NPA Multi-Agent Architecture
## 13 Agents, 4 Tiers — Complete System Design

---

## System Overview

```
+---------------------+       +---------------------------+       +--------------------+
|   Angular Frontend   | <---> |    Express Orchestrator    | <---> |   Claude API (LLM)  |
|   (User Interface)   |  REST |  (REST + WebSocket Hub)    |       |   via Anthropic SDK  |
+---------------------+  + WS +---------------------------+       +--------------------+
                                           |                                |
                                           v                                v
                                    +------------+                   +------------+
                                    |  MariaDB   |<-----------------| MCP Server |
                                    |  42 tables |   SQL via MCP    | (Unified)  |
                                    +------------+   48 tools       +------------+
```

### Flow Summary
1. **User** interacts with Angular UI (chat, dashboards, forms)
2. **Angular** sends requests to Express (REST for data, WebSocket for chat)
3. **Express** routes to **TIER 1 → TIER 2 → TIER 3** agents via Claude API
4. **TIER 3** agents use MCP tools to read/write MariaDB
5. **TIER 4** shared utilities are called by any tier as cross-cutting concerns
6. **Results** flow back through Express → Angular in real-time via WebSocket

---

## The 4-Tier Agent Hierarchy

```
                    ┌─────────────────────────────┐
         TIER 1     │   Master COO Orchestrator    │  ← Every user message enters here
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
         TIER 2     │   NPA Domain Orchestrator    │  ← NPA-specific routing & lifecycle
                    └──────────────┬──────────────┘
                                   │
         ┌──────┬──────┬──────┬────┴────┬──────┬──────┬──────┬──────┐
         │      │      │      │         │      │      │      │      │
TIER 3   ▼      ▼      ▼      ▼         ▼      ▼      ▼      ▼      ▼
      Ideation Class. AutoFill  ML    Risk   Gov.  Diligence  Doc  Monitor
      Agent   Agent  Agent   Predict Agent  Agent  Agent    Lifecycle Agent
       (#1)   (#2)   (#3)    (#4)   (#5)   (#6)   (#7)     (#8)    (#9)
                                   │
         ┌──────────┬──────────┬───┴───────┬──────────────┐
         │          │          │           │              │
TIER 4   ▼          ▼          ▼           ▼              ▼
      KB Search  Notification  Audit    Jurisdiction
      Agent      Agent         Trail    Adapter
       (#10)      (#11)        Agent     (#13)
                               (#12)
```

---

## TIER 1 — Strategic Command Layer

---

## Agent 1: Master COO Orchestrator

**Identity:** `MASTER_COO` | **Tier:** 1 | **Icon:** 🧠 `brain-circuit`

### Purpose
The supreme commander. Sits at the top of the agent hierarchy. Receives EVERY user message regardless of context — chat, dashboard action, approval click. Determines if the request is NPA-related (→ hand to Tier 2), general query (→ answer directly), or cross-domain (→ coordinate multiple Tier 2 orchestrators in future).

### What It Does
- Parses user intent from natural language
- Routes NPA-related work to **NPA Domain Orchestrator** (Agent 2)
- Handles meta-queries: "How many NPAs are active?", "What's my workload?"
- Manages user identity and role-based access context
- Aggregates final responses from sub-orchestrators into coherent user-facing reply
- Maintains top-level conversation session
- Decides if multiple orchestrators need to coordinate (future: Lending Orchestrator, Trade Orchestrator)

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_session_history` | Resume previous conversation sessions |
| `save_agent_message` | Persist every user↔agent exchange |
| `log_routing_decision` | Record which sub-orchestrator was chosen and why |
| `get_user_profile` | Load current user's role, department, permissions |
| `list_npas` | Quick pipeline overview for general queries |
| `get_dashboard_kpis` | Executive-level KPI summary for COO queries |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `agent_sessions` | R/W | Create/resume top-level conversation sessions |
| `agent_messages` | R/W | Full conversation transcript storage |
| `npa_agent_routing_decisions` | W | Log every routing decision with reasoning chain |
| `users` | R | User identity, role, department for permission-aware routing |
| `npa_projects` | R | Quick NPA lookups for general queries |
| `npa_kpi_snapshots` | R | Executive KPI data for COO-level questions |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `OrchestratorChatComponent` | Main chat — EVERY message enters through this agent |
| `ChatInterfaceComponent` | Template + Agent mode toggle; Agent mode = this agent |
| `LiveAgentPanelComponent` | Real-time: "Master COO routing to NPA Domain..." |
| `NpaDashboardComponent` → Agent Health | Top-level orchestrator status, latency, uptime |
| `NotificationCenterComponent` | Cross-domain aggregated alerts |

### Handoff Rules
| User Intent | Routes To |
|-------------|-----------|
| Anything NPA-related | → **Agent 2: NPA Domain Orchestrator** |
| "Show me KPIs" / "What's pipeline status" | Answers directly via `get_dashboard_kpis` |
| "Who am I?" / "My pending tasks" | Answers directly via `get_user_profile` |
| Unknown/ambiguous | Asks clarifying question |

---

## TIER 2 — Domain Orchestration Layer

---

## Agent 2: NPA Domain Orchestrator

**Identity:** `NPA_ORCHESTRATOR` | **Tier:** 2 | **Icon:** 🎯 `target`

### Purpose
The NPA lifecycle specialist. Receives all NPA-related work from TIER 1 and decomposes it into specific tasks for TIER 3 specialist agents. Understands the full NPA lifecycle (5 stages: Initiation → Review → Sign-Off → Launch → Monitoring) and knows which agents to invoke at each stage.

### What It Does
- Decomposes NPA tasks into ordered sub-agent calls
- Maintains NPA-specific conversation context (which NPA, which stage, what's pending)
- Orchestrates multi-agent workflows (e.g., "Create NPA" = Ideation → Classification → AutoFill)
- Handles stage transitions and gate-keeping logic
- Coordinates between Tier 3 agents when they need each other's output
- Manages NPA-level session state (current_stage, handoff chain)
- Decides agent execution order and parallelism

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_npa_by_id` | Load full NPA context for routing decisions |
| `list_npas` | Pipeline context for multi-NPA operations |
| `get_workflow_state` | Check current stage to determine valid next agents |
| `advance_workflow_state` | Progress NPA through pipeline gates |
| `save_agent_message` | Persist NPA-specific conversation turns |
| `log_routing_decision` | Record sub-agent selection reasoning |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_projects` | R | Full NPA context for routing |
| `npa_workflow_states` | R/W | Current stage determines which agents are valid |
| `agent_sessions` | R/W | NPA-scoped agent sessions with `current_stage` |
| `agent_messages` | R/W | NPA-specific conversation history |
| `npa_agent_routing_decisions` | W | Sub-agent selection audit trail |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `NpaDashboardComponent` → "Appr. Orchestrator" card | Orchestration status (Idle/Orchestrating) |
| `StageProgressComponent` | Visual pipeline — shows which stage the orchestrator is managing |
| `NpaProcessTrackerComponent` | Step-by-step process visualization |
| `LiveAgentPanelComponent` | "NPA Orchestrator delegating to Risk Agent..." |
| `WorkItemListComponent` | Active work items being orchestrated |

### Routing Matrix (Stage → Agent)
| NPA Stage | Primary Agent(s) Invoked | Secondary (if needed) |
|-----------|-------------------------|-----------------------|
| **Initiation** | Ideation (#1), Classification (#2) | KB Search (#10) |
| **Review** | AutoFill (#3), Risk (#5), Doc Lifecycle (#8) | ML Prediction (#4) |
| **Sign-Off** | Governance (#6), Diligence (#7) | Notification (#11) |
| **Launch** | Governance (#6), Monitoring (#9) | Notification (#11) |
| **Monitoring** | Monitoring (#9) | Audit Trail (#12) |

---

## TIER 3 — Specialist Agent Layer (The Workers)

---

## Agent 3: Ideation Agent

**Identity:** `IDEATION` | **Tier:** 3 | **Icon:** 💡 `lightbulb` | **Color:** `bg-indigo-50 text-indigo-600`

### Purpose
Creative product development assistant. Helps makers conceptualize new products, analyze market fit, draft concept papers, and estimate feasibility before formal NPA submission.

### What It Does
- Generates structured product concept papers
- Analyzes competitors in the same asset class
- Estimates market size and revenue potential
- Suggests optimal product structure based on historical NPAs
- Creates initial NPA project record
- Converts prospects into formal NPA submissions
- Searches knowledge base for similar past products

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `search_kb_documents` | RAG search over historical NPAs and policy docs |
| `create_npa_project` | Initialize new NPA record when user confirms concept |
| `list_npas` | Find similar historical products for benchmarking |
| `get_classification_criteria` | Pre-assess likely classification outcome |
| `get_prospects` | Load product opportunity pipeline |
| `convert_prospect_to_npa` | Promote prospect to formal NPA |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_projects` | R/W | Create new NPA, read historical products |
| `kb_documents` | R | Knowledge base for similar product search |
| `npa_prospects` | R/W | Product opportunity pipeline, convert to NPA |
| `npa_market_clusters` | R | Market segment context for positioning |
| `ref_classification_criteria` | R | Pre-assess likely classification |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `ChatInterfaceComponent` → Templates | "Draft New Product Concept", "Competitor Analysis" |
| `OrchestratorChatComponent` | Chat responses for product strategy questions |
| `SubAgentCardComponent` | "Product Ideation" card (Idle/Active) |
| `NpaDashboardComponent` → KB | "Historical NPAs", "Product Classifications" sources |
| `COO Dashboard` → Product Opportunities | Prospect pipeline from this agent's work |
| `COO Dashboard` → Market Clusters | Strategic market segmentation |

---

## Agent 4: Classification Agent

**Identity:** `CLASSIFIER` | **Tier:** 3 | **Icon:** 🔀 `git-branch` | **Color:** `bg-purple-50 text-purple-600`

### Purpose
Regulatory brain. Determines how a product should be classified and what approval track it follows. This is the critical gate — classification result determines the entire downstream workflow.

### What It Does
- Scores product against 7+ classification criteria (novelty, complexity, risk, regulatory impact, etc.)
- Determines product type: **NTG** (New-To-Group), **Variation**, or **Existing**
- Assigns approval track: **Full NPA**, **NPA Lite**, **Evergreen**, or **Prohibited**
- Checks prohibited items list — triggers HARD STOP if match found
- Generates classification scorecard with confidence scores
- Determines sign-off routing matrix based on classification

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_npa_by_id` | Load product details for scoring |
| `get_classification_criteria` | Fetch scoring rubric (7+ criteria) |
| `score_classification` | Execute multi-criteria scoring algorithm |
| `save_classification_scorecard` | Persist final classification result |
| `check_prohibited_items` | Screen against all 4 prohibited layers |
| `get_signoff_routing_rules` | Determine which approvers are needed |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `ref_classification_criteria` | R | 7+ criteria with weights and scoring guides |
| `npa_classification_assessments` | W | Individual criterion scores |
| `npa_classification_scorecards` | W | Overall classification result (type + track) |
| `ref_prohibited_items` | R | 4 layers: INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC |
| `ref_signoff_routing_rules` | R | Routing matrix for downstream |
| `npa_projects` | R/W | Update `classification_type`, `approval_track` |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `ClassificationResultCardComponent` | Scorecard with type, track, confidence bars |
| `HardStopScreenComponent` | Full-screen blocker when prohibited match found |
| `NpaDetailComponent` → Classification Tab | Criterion-by-criterion breakdown |
| `StageProgressComponent` | Classification gate completion |
| `SubAgentCardComponent` | "Class. Router" card (Active during classification) |
| `COO Dashboard` → Classification Mix | Donut chart: NTG/Variation/Existing distribution |

---

## Agent 5: Template AutoFill Agent

**Identity:** `AUTOFILL` | **Tier:** 3 | **Icon:** 📝 `file-edit` | **Color:** `bg-blue-50 text-blue-600`

### Purpose
Form-filling specialist. Scope tightened to ONLY handle the 47-field NPA template auto-fill. Uses RAG over historical NPAs and policy documents to intelligently populate form fields, marking each with lineage metadata (AUTO/ADAPTED/MANUAL).

### What It Does
- Auto-fills NPA template fields using RAG over similar historical NPAs
- Marks every AI-filled value with `lineage: 'AUTO'` and source citation
- Respects field validation rules (type, required, max_length, options)
- Handles section-by-section filling in template order
- Supports "adapt" mode — takes user edits and marks as `lineage: 'ADAPTED'`
- Generates confidence score per field fill
- Skips fields marked as `ai_fillable: false`

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_template_fields` | Load the 47-field NPA template structure |
| `get_form_field_value` | Read current field values (check if already filled) |
| `save_form_field` | Write auto-filled value with lineage + citation |
| `search_kb_documents` | RAG search for field-specific context |
| `get_npa_by_id` | Load NPA context for contextual filling |
| `get_field_options` | Valid dropdown options for select-type fields |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_form_data` | R/W | Read existing, write auto-filled values with lineage |
| `ref_npa_templates` | R | Template structure |
| `ref_npa_sections` | R | Section ordering (10 sections) |
| `ref_npa_fields` | R | Field definitions: type, required, ai_fillable, validation |
| `ref_field_options` | R | Valid options for select-type fields |
| `kb_documents` | R | Historical NPAs for RAG-based filling |
| `npa_projects` | R | NPA context for contextual auto-fill |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `NpaTemplateEditorComponent` | Fields with AI badge (AUTO), edit badge (ADAPTED), manual badge |
| `SubAgentCardComponent` | "Template Auto-Fill" card (Idle/Active) |
| `ChatInterfaceComponent` → "Generate with AI" | Triggers this agent for bulk field fill |
| `NpaDetailComponent` → Form Tab | Lineage indicators per field |

---

## Agent 6: ML Prediction Agent

**Identity:** `ML_PREDICT` | **Tier:** 3 | **Icon:** 📈 `trending-up` | **Color:** `bg-amber-50 text-amber-600`

### Purpose
Predictive analytics engine. Uses historical NPA data to predict approval likelihood, estimated timeline, potential bottlenecks, and revenue potential. Provides data-driven insights to help makers and COOs make better decisions.

### What It Does
- Predicts **approval likelihood** (0-100%) based on similar historical NPAs
- Estimates **timeline** (days) from current stage to approval
- Identifies **predicted bottleneck** department (which approver will likely delay)
- Forecasts **revenue potential** based on product type and market cluster
- Generates **risk score** prediction before formal risk assessment
- Provides **comparison insights** against similar past products

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_npa_by_id` | Load current NPA features for prediction |
| `list_npas` | Fetch historical NPAs for training/comparison |
| `get_performance_metrics` | Historical product performance for revenue prediction |
| `get_classification_criteria` | Feature extraction for ML model |
| `update_npa_predictions` | Save predicted values back to NPA record |
| `search_kb_documents` | Historical context for prediction explanations |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_projects` | R/W | Read features, write `predicted_approval_likelihood`, `predicted_timeline_days`, `predicted_bottleneck` |
| `npa_classification_scorecards` | R | Classification features for prediction model |
| `npa_signoffs` | R | Historical sign-off patterns for bottleneck prediction |
| `npa_performance_metrics` | R | Historical revenue data for forecasting |
| `npa_market_clusters` | R | Market segment features |
| `kb_documents` | R | Historical context for explainability |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `SubAgentCardComponent` | "ML Prediction" card (Idle/Active) |
| `NpaDetailComponent` → Overview | Approval likelihood %, estimated timeline, predicted bottleneck |
| `NpaDashboardComponent` → Agent Health | "92% Prediction Accuracy" stat |
| `NpaPipelineTableComponent` | Prediction columns (likelihood, timeline) per NPA row |
| `COO Dashboard` → Overview KPIs | Aggregated prediction insights |

---

## Agent 7: Risk Agent

**Identity:** `RISK` | **Tier:** 3 | **Icon:** 🛡️ `shield-alert` | **Color:** `bg-red-50 text-red-600`

### Purpose
The guardian. Performs multi-layer risk validation including internal policy checks, regulatory compliance (MAS 656, FAA, SFA), sanctions screening, and dynamic risk assessment. No NPA proceeds to sign-off without this agent's clearance.

### What It Does
- Executes 4-layer risk check cascade:
  1. **Internal Policy** — Company risk framework alignment
  2. **Regulatory** — MAS/HKMA/FCA regulation compliance
  3. **Sanctions** — OFAC/UN/EU sanctions screening
  4. **Dynamic** — ML-based anomaly detection on product structure
- Validates prerequisite completion (operational readiness, compliance sign-off, etc.)
- Assesses market risk factors (IR Delta, FX Vega, Credit Spread, etc.)
- Generates risk score with pass/fail/warning per layer
- Identifies external party risks (counterparties, vendors)

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `run_risk_checks` | Execute all 4 risk validation layers |
| `check_prohibited_items` | Deep sanctions and prohibited screening |
| `get_prerequisite_categories` | Load prerequisite checklist |
| `validate_prerequisites` | Check each prerequisite item against rules |
| `save_risk_check_result` | Persist layer-by-layer results |
| `get_document_requirements` | Verify required docs exist |
| `validate_document` | Check document validity/extraction status |
| `get_market_risk_factors` | Current market exposure data |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_risk_checks` | R/W | 4-layer risk results per NPA |
| `ref_prohibited_items` | R | 4 prohibited layers |
| `ref_prerequisite_categories` | R | Prerequisite categories |
| `ref_prerequisite_checks` | R | Individual check definitions |
| `npa_prerequisite_results` | R/W | Pass/fail per check |
| `ref_document_requirements` | R | Required docs per stage |
| `ref_document_rules` | R | Conditional doc rules |
| `npa_documents` | R | Uploaded doc validation status |
| `npa_external_parties` | R | Counterparty risk profiles |
| `npa_market_risk_factors` | R/W | Market risk exposures |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `RiskCheckPanelComponent` | 4-layer cascade with pass/fail/warning badges |
| `PrerequisiteScorecardComponent` | Prerequisite checklist with progress |
| `HardStopScreenComponent` | Triggered if sanctions check fails |
| `NpaDetailComponent` → Risk Tab | Full risk breakdown |
| `SubAgentCardComponent` | "Prohibited List" card (shields icon) |
| `COO Dashboard` → Overview KPIs | "At Risk" count |

---

## Agent 8: Governance Agent

**Identity:** `GOVERNANCE` | **Tier:** 3 | **Icon:** ⚙️ `workflow` | **Color:** `bg-slate-50 text-slate-600`

### Purpose
The workflow engine. Manages the entire sign-off lifecycle — routing, SLA enforcement, loop-backs, escalations, and the circuit breaker pattern.

### What It Does
- Determines sign-off routing based on classification type + approval track
- Creates sign-off requests for 6-8 departments per NPA
- Monitors SLA deadlines, flags breaches
- Handles loop-backs (rework requests from approvers)
  - Tracks loop-back count per NPA
  - Triggers **circuit breaker** at 3 loop-backs → auto-escalation
- Manages 3-tier approval chain: Checker → GFM COO → PAC
- Records clarification Q&A between approver and maker

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_signoff_routing_rules` | Determine which departments sign off |
| `create_signoff_requests` | Generate sign-off entries per department |
| `update_signoff_status` | Record approve/reject/loop-back |
| `check_sla_status` | Monitor deadline compliance |
| `create_loop_back` | Record rework request |
| `check_circuit_breaker` | Evaluate if loop-back triggers escalation |
| `create_escalation` | Trigger escalation to next authority |
| `get_escalation_rules` | Load escalation authority matrix |
| `save_approval_decision` | Record final Checker/COO/PAC decisions |
| `add_comment` | Post clarification Q&A |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_signoffs` | R/W | Sign-off status per department |
| `npa_loop_backs` | R/W | Loop-back tracking, circuit breaker |
| `npa_approvals` | R/W | Top-level approval decisions |
| `npa_comments` | R/W | Approver ↔ maker Q&A |
| `npa_escalations` | R/W | Escalation events |
| `ref_signoff_routing_rules` | R | Routing matrix |
| `ref_escalation_rules` | R | Escalation authority levels |
| `npa_workflow_states` | R/W | Gate progression |
| `npa_projects` | R/W | Update `pac_approval_status` |
| `users` | R | Approver lookup |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `SignoffRoutingVizComponent` | Visual routing diagram |
| `LoopBackPanelComponent` | Loop-back history, circuit breaker warning |
| `ApprovalDashboardComponent` | Pending approval items for current user |
| `NpaDetailComponent` → Sign-Offs Tab | Department-by-department status |
| `NpaDetailComponent` → Comments | Threaded Q&A |
| `COO Dashboard` → NPA Pool | Status shows blocked/at-risk |
| `COO Dashboard` → Overview | "SLA Breaches" KPI |

---

## Agent 9: Conversational Diligence Agent

**Identity:** `DILIGENCE` | **Tier:** 3 | **Icon:** 💬 `message-square` | **Color:** `bg-cyan-50 text-cyan-600`

### Purpose
The deep-dive Q&A expert. When a user or approver asks a detailed question about any NPA field, regulation, or process, this agent provides authoritative answers with citations. Does NOT fill forms (that's Agent 5's job).

### What It Does
- Answers detailed questions about NPA fields with KB citations
- Supports "explain this field" interactions for approvers reviewing NPAs
- Provides regulatory context ("What does MAS 656 say about this?")
- Generates AI-assisted comments in clarification threads
- Compares current NPA against similar historical submissions
- Provides reasoning chains for its answers (auditable)

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `search_kb_documents` | Semantic search over knowledge base |
| `get_npa_by_id` | Load full NPA context |
| `get_form_field_value` | Read field values for contextual answers |
| `add_comment` | Post AI-generated clarification response |
| `list_npas` | Find similar NPAs for comparison |
| `get_classification_criteria` | Explain classification decisions |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `kb_documents` | R | Knowledge base with embeddings for RAG |
| `npa_projects` | R | NPA context for answers |
| `npa_form_data` | R | Current field values |
| `npa_comments` | R/W | Read questions, post AI answers |
| `npa_documents` | R | Reference uploaded docs for citations |
| `ref_npa_fields` | R | Field definitions for "explain this field" |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `OrchestratorChatComponent` | Domain Q&A with citations |
| `ChatInterfaceComponent` → Templates | "Regulatory Compliance Check" template |
| `SubAgentCardComponent` | "Conv. Diligence" card |
| `NpaDetailComponent` → Comments | AI-generated clarification answers |

---

## Agent 10: Document Lifecycle Agent *(NEW — promoted from utility)*

**Identity:** `DOC_LIFECYCLE` | **Tier:** 3 | **Icon:** 📄 `scan-search` | **Color:** `bg-teal-50 text-teal-600`

### Purpose
End-to-end document management. Handles document upload validation, requirement checking, extraction, expiry tracking, and version control. Previously a "Doc Processing" utility — promoted to full agent because document management is a critical NPA lifecycle concern.

### What It Does
- Validates uploaded documents against requirement rules
- Checks document completeness per NPA stage (which docs are missing)
- Extracts key metadata from uploaded documents (amounts, dates, entities)
- Tracks document expiry dates and triggers renewal alerts
- Manages document versions (superseded docs)
- Enforces conditional document rules (e.g., "If notional > $50M, require Credit Committee memo")
- Reports document readiness status to Risk Agent

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_document_requirements` | Load stage-specific document rules |
| `validate_document` | Check document validity and extraction status |
| `get_document_rules` | Conditional requirement logic |
| `upload_document_metadata` | Record new document upload |
| `check_document_completeness` | Stage gate: are all required docs present? |
| `get_npa_by_id` | NPA context for conditional rules |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_documents` | R/W | Document records with validation status |
| `ref_document_requirements` | R | Which docs required at which stage |
| `ref_document_rules` | R | Conditional rules (notional-based, type-based) |
| `npa_projects` | R | NPA context for conditional evaluation |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `DocumentChecklistComponent` | Required docs with status (Valid/Pending/Missing) |
| `NpaDetailComponent` → Documents Tab | Full document inventory per NPA |
| `NpaDashboardComponent` → Utilities | "Doc Processing" utility card |

---

## Agent 11: Post-Launch Monitoring Agent *(NEW — fills Stage 5 gap)*

**Identity:** `MONITORING` | **Tier:** 3 | **Icon:** 📊 `activity` | **Color:** `bg-emerald-50 text-emerald-600`

### Purpose
The watchdog. After a product launches, this agent continuously monitors performance metrics, detects threshold breaches, triggers alerts, schedules PIRs, and tracks post-launch conditions.

### What It Does
- Monitors real-time performance metrics (volume, P&L, VaR, collateral)
- Detects threshold breaches (CRITICAL, WARNING severity)
- Triggers breach alerts with auto-escalation for CRITICAL
- Tracks post-launch conditions (regulatory commitments, audit items)
- Schedules and tracks PIR (Post-Implementation Review) milestones
- Reports product health to COO dashboard
- Monitors market risk factor changes

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_performance_metrics` | Fetch volume, P&L, VaR, collateral data |
| `check_breach_thresholds` | Compare metrics against thresholds |
| `create_breach_alert` | Generate alert when threshold exceeded |
| `get_monitoring_thresholds` | Load threshold definitions per product |
| `get_post_launch_conditions` | Track condition completion |
| `update_condition_status` | Mark conditions met/overdue |
| `get_market_risk_factors` | Market exposure changes |
| `get_dashboard_kpis` | Aggregate for COO view |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_performance_metrics` | R/W | Product performance data |
| `npa_breach_alerts` | R/W | Breach events |
| `npa_monitoring_thresholds` | R | Threshold definitions |
| `npa_post_launch_conditions` | R/W | Post-launch commitments |
| `npa_market_risk_factors` | R | Market exposure |
| `npa_kpi_snapshots` | R/W | Historical KPI snapshots |
| `npa_projects` | R/W | Update `pir_status`, `pir_due_date` |
| `npa_escalations` | W | Auto-escalate CRITICAL breaches |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `COO Dashboard` → Monitoring Tab | Full monitoring view |
| `COO Dashboard` → Overview | Revenue chart, top products |
| `NpaDetailComponent` → Monitoring Tab | Product-specific breaches + metrics |
| `ExceptionsPanelComponent` | Critical exceptions |
| `AuditLogComponent` | Monitoring events in audit trail |

---

## TIER 4 — Shared Utility Layer (Cross-Cutting)

---

## Agent 12: KB Search Agent

**Identity:** `KB_SEARCH` | **Tier:** 4 | **Icon:** 🔍 `search` | **Color:** `bg-fuchsia-50 text-fuchsia-600`

### Purpose
Dedicated knowledge base retrieval agent. Provides semantic search, hybrid search (keyword + vector), and document-level retrieval. Called by MULTIPLE Tier 3 agents whenever they need knowledge base access, ensuring consistent RAG behavior and search quality.

### What It Does
- Semantic search over embedded documents (historical NPAs, policies, regulations)
- Hybrid search combining keyword matching + vector similarity
- Document-level retrieval with passage extraction
- Caches frequently accessed documents for performance
- Provides citation metadata (source doc, page, confidence score)
- Handles multi-language search (English + Mandarin for APAC context)

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `search_kb_documents` | Primary semantic search |
| `get_kb_document_by_id` | Full document retrieval |
| `list_kb_sources` | Available knowledge base inventory |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `kb_documents` | R | Document embeddings and metadata |

### Called By
| Agent | When |
|-------|------|
| Ideation (#3) | Finding similar historical products |
| AutoFill (#5) | RAG context for field filling |
| Diligence (#9) | Answering regulatory/field questions |
| Classification (#4) | Policy context for scoring |
| Risk (#7) | Regulatory reference lookups |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `SubAgentCardComponent` | "KB Search" card (Idle/Active) |
| `NpaDashboardComponent` → KB | 4 knowledge base sources |
| `NpaDashboardComponent` → Utilities | "RAG Engine" card (queries: 234, hit rate: 94%) |

---

## Agent 13: Notification Agent *(NEW — cross-domain)*

**Identity:** `NOTIFICATION` | **Tier:** 4 | **Icon:** 🔔 `bell` | **Color:** `bg-pink-50 text-pink-600`

### Purpose
Unified notification engine. Aggregates alerts from ALL agents and delivers them through appropriate channels (in-app, email, escalation). Prevents notification spam by deduplicating and prioritizing.

### What It Does
- Aggregates notifications from all Tier 3 agents
- Deduplicates similar alerts (e.g., multiple SLA warnings for same NPA)
- Prioritizes by severity: CRITICAL > WARNING > INFO
- Delivers via multiple channels: in-app push, email (future: Slack/Teams)
- Tracks notification read/acknowledged status
- Generates daily digest summaries for COOs
- Handles escalation notification chains (Level 1 → Level 2 → Level 3)

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_pending_notifications` | Aggregate unread alerts |
| `send_notification` | Create and deliver notification |
| `mark_notification_read` | Track acknowledgment |
| `get_escalation_chain` | Determine notification recipients |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_breach_alerts` | R | Breach notifications from Monitoring |
| `npa_signoffs` | R | SLA breach notifications from Governance |
| `npa_escalations` | R | Escalation notifications |
| `npa_comments` | R | New comment notifications |
| `users` | R | Recipient lookup (email, role) |

### Called By
| Agent | Notification Type |
|-------|-------------------|
| Governance (#8) | SLA breaches, loop-backs, approval decisions |
| Monitoring (#11) | Breach alerts, PIR reminders |
| Risk (#7) | Hard stop alerts, prerequisite failures |
| NPA Orchestrator (#2) | Stage transitions, handoff notifications |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `NotificationCenterComponent` | Bell icon with badge count, notification dropdown |
| `NpaDashboardComponent` → Utilities | "Notification" card (sent: 892, open rate: 68%) |
| `COO Dashboard` → Overview | Alert count badges on KPI cards |

---

## Agent 14: Audit Trail Agent *(ENHANCED from logger)*

**Identity:** `AUDIT_TRAIL` | **Tier:** 4 | **Icon:** 🔒 `shield-check` | **Color:** `bg-red-50 text-red-600`

### Purpose
Immutable audit compliance engine. More than a simple logger — this agent enforces audit policy, detects audit gaps, generates compliance reports, and ensures regulatory audit trail requirements are met. Enhanced from a passive logger to an active compliance guardian.

### What It Does
- Records every agent action with full context (who, what, when, why, which NPA)
- Enforces audit completeness — flags if an expected audit entry is missing
- Detects anomalies (e.g., approval without prior risk check → audit gap)
- Generates compliance reports for regulators (MAS, HKMA)
- Tracks both human actions AND agent actions with clear attribution
- Maintains immutable log (append-only, no deletions)
- Provides audit trail search and filtering

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `log_audit_entry` | Write immutable audit record |
| `get_audit_log` | Read audit trail with filters |
| `check_audit_completeness` | Verify all required audit entries exist |
| `generate_audit_report` | Create compliance summary |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_audit_log` | R/W | Immutable audit trail (append-only) |
| `npa_projects` | R | NPA context for audit entries |
| `users` | R | Actor identity for attribution |
| `agent_sessions` | R | Agent identity for AI action attribution |

### Called By
| Agent | What Gets Audited |
|-------|-------------------|
| ALL Tier 3 agents | Every tool call, every decision, every state change |
| Orchestrators (#1, #2) | Routing decisions, session events |
| Governance (#8) | Approval/rejection decisions (critical for compliance) |
| Risk (#7) | Risk check results (regulatory requirement) |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `AuditLogComponent` | Filterable audit trail table |
| `AuditPreviewPanelComponent` | Quick preview of recent audit entries |
| `NpaDetailComponent` → Audit Tab | NPA-specific audit trail |
| `NpaDashboardComponent` → Utilities | "Audit Logger" card (logs: 3.4k, coverage: 100%) |

---

## Agent 15: Jurisdiction Adapter *(NEW — Phase 1+ implementation)*

**Identity:** `JURISDICTION` | **Tier:** 4 | **Icon:** 🌏 `globe` | **Color:** `bg-sky-50 text-sky-600`

### Purpose
Multi-jurisdiction compliance adapter. Different jurisdictions (Singapore, Hong Kong, London, New York) have different regulatory requirements, document needs, and approval thresholds. This agent adapts the NPA process based on jurisdiction context.

### What It Does
- Loads jurisdiction-specific rules and requirements
- Adapts classification criteria weights by jurisdiction
- Adjusts document requirements (e.g., MAS 656 for SG, SFO for HK)
- Modifies sign-off routing based on local regulatory needs
- Provides jurisdiction-specific regulatory context to other agents
- Handles multi-jurisdiction NPAs (e.g., product launching in SG + HK simultaneously)
- Manages jurisdiction-specific prohibited item lists

### MCP Tools Used
| Tool | Purpose |
|------|---------|
| `get_npa_jurisdictions` | Load jurisdictions for an NPA |
| `get_jurisdiction_rules` | Fetch jurisdiction-specific requirements |
| `adapt_classification_weights` | Modify scoring weights per jurisdiction |
| `get_jurisdiction_documents` | Jurisdiction-specific document requirements |

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| `npa_jurisdictions` | R | Jurisdiction codes per NPA |
| `ref_classification_criteria` | R | Base criteria (adapted by jurisdiction) |
| `ref_document_requirements` | R | Base doc requirements (adapted by jurisdiction) |
| `ref_prohibited_items` | R | Jurisdiction-specific prohibited items |
| `ref_signoff_routing_rules` | R | Jurisdiction-specific routing overrides |

### Called By
| Agent | When |
|-------|------|
| Classification (#4) | Adjust scoring weights for jurisdiction |
| Risk (#7) | Jurisdiction-specific regulatory checks |
| Governance (#8) | Jurisdiction-specific routing overrides |
| Doc Lifecycle (#10) | Jurisdiction-specific doc requirements |

### UI Reflection
| Component | What It Shows |
|-----------|---------------|
| `NpaDetailComponent` → Overview | Jurisdiction badges (SG, HK, LDN, NY) |
| `ClassificationResultCardComponent` | Jurisdiction-adapted scoring |
| `DocumentChecklistComponent` | Jurisdiction-specific doc requirements |

---

## Complete MCP Tool Inventory (48 Tools)

### Category 1: NPA Data Tools (10)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 1 | `get_npa_by_id` | Orchestrators, Classifier, Risk, Diligence, AutoFill, DocLifecycle | `npa_projects` |
| 2 | `list_npas` | Orchestrators, Ideation, ML Predict, Diligence | `npa_projects` |
| 3 | `create_npa_project` | Ideation | `npa_projects` |
| 4 | `update_npa_project` | Classifier, Governance, ML Predict | `npa_projects` |
| 5 | `get_form_field_value` | AutoFill, Diligence | `npa_form_data` |
| 6 | `save_form_field` | AutoFill | `npa_form_data` |
| 7 | `get_template_fields` | AutoFill | `ref_npa_templates`, `ref_npa_sections`, `ref_npa_fields` |
| 8 | `get_field_options` | AutoFill | `ref_field_options` |
| 9 | `get_prospects` | Ideation | `npa_prospects` |
| 10 | `convert_prospect_to_npa` | Ideation | `npa_prospects`, `npa_projects` |

### Category 2: Classification Tools (4)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 11 | `get_classification_criteria` | Classifier, Ideation, Diligence | `ref_classification_criteria` |
| 12 | `score_classification` | Classifier | `npa_classification_assessments` |
| 13 | `save_classification_scorecard` | Classifier | `npa_classification_scorecards` |
| 14 | `check_prohibited_items` | Classifier, Risk | `ref_prohibited_items` |

### Category 3: Risk Engine Tools (8)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 15 | `run_risk_checks` | Risk | `npa_risk_checks` |
| 16 | `get_prerequisite_categories` | Risk | `ref_prerequisite_categories` |
| 17 | `validate_prerequisites` | Risk | `ref_prerequisite_checks`, `npa_prerequisite_results` |
| 18 | `save_risk_check_result` | Risk | `npa_risk_checks` |
| 19 | `get_document_requirements` | Risk, DocLifecycle | `ref_document_requirements` |
| 20 | `validate_document` | Risk, DocLifecycle | `npa_documents` |
| 21 | `get_market_risk_factors` | Risk, Monitoring | `npa_market_risk_factors` |
| 22 | `get_document_rules` | DocLifecycle | `ref_document_rules` |

### Category 4: Governance Engine Tools (10)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 23 | `get_signoff_routing_rules` | Classifier, Governance, Jurisdiction | `ref_signoff_routing_rules` |
| 24 | `create_signoff_requests` | Governance | `npa_signoffs` |
| 25 | `update_signoff_status` | Governance | `npa_signoffs` |
| 26 | `check_sla_status` | Governance | `npa_signoffs` |
| 27 | `create_loop_back` | Governance | `npa_loop_backs` |
| 28 | `check_circuit_breaker` | Governance | `npa_loop_backs` |
| 29 | `create_escalation` | Governance, Monitoring | `npa_escalations` |
| 30 | `get_escalation_rules` | Governance | `ref_escalation_rules` |
| 31 | `save_approval_decision` | Governance | `npa_approvals` |
| 32 | `add_comment` | Governance, Diligence | `npa_comments` |

### Category 5: Monitoring Engine Tools (6)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 33 | `get_performance_metrics` | Monitoring, ML Predict | `npa_performance_metrics` |
| 34 | `check_breach_thresholds` | Monitoring | `npa_monitoring_thresholds`, `npa_breach_alerts` |
| 35 | `create_breach_alert` | Monitoring | `npa_breach_alerts` |
| 36 | `get_monitoring_thresholds` | Monitoring | `npa_monitoring_thresholds` |
| 37 | `get_post_launch_conditions` | Monitoring | `npa_post_launch_conditions` |
| 38 | `update_condition_status` | Monitoring | `npa_post_launch_conditions` |

### Category 6: Document Tools (3)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 39 | `upload_document_metadata` | DocLifecycle | `npa_documents` |
| 40 | `check_document_completeness` | DocLifecycle | `npa_documents`, `ref_document_requirements` |
| 41 | `get_jurisdiction_documents` | Jurisdiction | `ref_document_requirements`, `npa_jurisdictions` |

### Category 7: KB & Search Tools (3)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 42 | `search_kb_documents` | KB Search (called by Ideation, AutoFill, Diligence, Risk) | `kb_documents` |
| 43 | `get_kb_document_by_id` | KB Search | `kb_documents` |
| 44 | `list_kb_sources` | KB Search | `kb_documents` |

### Category 8: Session & Audit Tools (4)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| 45 | `log_audit_entry` | Audit Trail (called by ALL agents) | `npa_audit_log` |
| 46 | `get_audit_log` | Audit Trail | `npa_audit_log` |
| 47 | `check_audit_completeness` | Audit Trail | `npa_audit_log` |
| 48 | `generate_audit_report` | Audit Trail | `npa_audit_log` |

### Session Management (used by Orchestrators)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| S1 | `get_session_history` | Master COO, NPA Orchestrator | `agent_sessions` |
| S2 | `save_agent_message` | Master COO, NPA Orchestrator | `agent_messages` |
| S3 | `log_routing_decision` | Master COO, NPA Orchestrator | `npa_agent_routing_decisions` |
| S4 | `get_user_profile` | Master COO | `users` |
| S5 | `get_workflow_state` | NPA Orchestrator | `npa_workflow_states` |
| S6 | `advance_workflow_state` | NPA Orchestrator | `npa_workflow_states` |
| S7 | `get_dashboard_kpis` | Master COO, Monitoring | `npa_kpi_snapshots` |
| S8 | `update_npa_predictions` | ML Predict | `npa_projects` |

### Jurisdiction Tools (3)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| J1 | `get_npa_jurisdictions` | Jurisdiction | `npa_jurisdictions` |
| J2 | `get_jurisdiction_rules` | Jurisdiction | (derived from multiple ref tables) |
| J3 | `adapt_classification_weights` | Jurisdiction | `ref_classification_criteria` |

### Notification Tools (3)
| # | Tool | Used By Agent(s) | Primary Table(s) |
|---|------|-------------------|-------------------|
| N1 | `get_pending_notifications` | Notification | (aggregation query) |
| N2 | `send_notification` | Notification | (future: notification queue table) |
| N3 | `mark_notification_read` | Notification | (future: notification queue table) |

---

## Database Table → Agent Dependency Matrix (13 Agents × 42 Tables)

### Core NPA Tables
| Table | COO Orch | NPA Orch | Ideation | Classif. | AutoFill | ML Pred | Risk | Gov. | Diligence | DocLife | Monitor | KB | Notif | Audit | Jurisd |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `npa_projects` | R | R | R/W | R/W | R | R | R | R/W | R | R | R/W | — | — | R | — |
| `npa_form_data` | — | — | — | — | R/W | — | — | — | R | — | — | — | — | — | — |
| `npa_workflow_states` | — | R/W | — | — | — | — | — | R/W | — | — | — | — | — | — | — |
| `npa_documents` | — | — | — | — | — | — | R | — | R | R/W | — | — | — | — | — |
| `npa_comments` | — | — | — | — | — | — | — | R/W | R/W | — | — | — | R | — | — |
| `npa_jurisdictions` | — | — | — | R | — | — | R | — | R | — | — | — | — | — | R |

### Classification & Risk Tables
| Table | COO | NPA | Ideat | Class | Auto | ML | Risk | Gov | Dilig | Doc | Mon | KB | Notif | Audit | Jur |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `npa_classification_assessments` | — | — | — | W | — | — | — | — | — | — | — | — | — | — | — |
| `npa_classification_scorecards` | — | — | — | W | — | R | — | — | — | — | — | — | — | — | — |
| `npa_risk_checks` | — | — | — | — | — | — | R/W | — | — | — | — | — | — | — | — |
| `npa_prerequisite_results` | — | — | — | — | — | — | R/W | — | — | — | — | — | — | — | — |
| `npa_external_parties` | — | — | — | — | — | — | R | — | — | — | — | — | — | — | — |
| `npa_market_risk_factors` | — | — | — | — | — | — | R/W | — | — | — | R | — | — | — | — |

### Approval Tables
| Table | COO | NPA | Ideat | Class | Auto | ML | Risk | Gov | Dilig | Doc | Mon | KB | Notif | Audit | Jur |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `npa_signoffs` | — | — | — | — | — | R | — | R/W | — | — | — | — | R | — | — |
| `npa_loop_backs` | — | — | — | — | — | — | — | R/W | — | — | — | — | — | — | — |
| `npa_approvals` | — | — | — | — | — | — | — | R/W | — | — | — | — | — | — | — |
| `npa_escalations` | — | — | — | — | — | — | — | R/W | — | — | W | — | R | — | — |

### Monitoring Tables
| Table | COO | NPA | Ideat | Class | Auto | ML | Risk | Gov | Dilig | Doc | Mon | KB | Notif | Audit | Jur |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `npa_performance_metrics` | — | — | — | — | — | R | — | — | — | — | R/W | — | — | — | — |
| `npa_breach_alerts` | — | — | — | — | — | — | — | — | — | — | R/W | — | R | — | — |
| `npa_monitoring_thresholds` | — | — | — | — | — | — | — | — | — | — | R | — | — | — | — |
| `npa_post_launch_conditions` | — | — | — | — | — | — | — | — | — | — | R/W | — | — | — | — |
| `npa_kpi_snapshots` | R | — | — | — | — | — | — | — | — | — | R/W | — | — | — | — |

### Reference Tables (Read-Only)
| Table | Used By Agents |
|-------|----------------|
| `ref_npa_templates` | AutoFill (#5) |
| `ref_npa_sections` | AutoFill (#5) |
| `ref_npa_fields` | AutoFill (#5), Diligence (#9) |
| `ref_field_options` | AutoFill (#5) |
| `ref_classification_criteria` | Classifier (#4), Ideation (#3), Diligence (#9), Jurisdiction (#15) |
| `ref_prerequisite_categories` | Risk (#7) |
| `ref_prerequisite_checks` | Risk (#7) |
| `ref_document_requirements` | Risk (#7), DocLifecycle (#10), Jurisdiction (#15) |
| `ref_document_rules` | DocLifecycle (#10) |
| `ref_escalation_rules` | Governance (#8) |
| `ref_prohibited_items` | Classifier (#4), Risk (#7), Jurisdiction (#15) |
| `ref_signoff_routing_rules` | Classifier (#4), Governance (#8), Jurisdiction (#15) |

### Agent Infrastructure Tables
| Table | Access | Used By |
|-------|--------|---------|
| `agent_sessions` | R/W | Master COO (#1), NPA Orchestrator (#2), Audit Trail (#14) |
| `agent_messages` | R/W | Master COO (#1), NPA Orchestrator (#2) |
| `npa_agent_routing_decisions` | W | Master COO (#1), NPA Orchestrator (#2) |
| `kb_documents` | R | KB Search (#12) |

### Shared Tables
| Table | Access | Used By |
|-------|--------|---------|
| `users` | R | Master COO (#1), Governance (#8), Notification (#13), Audit Trail (#14) |
| `npa_audit_log` | R/W | Audit Trail (#14) — called by ALL agents |
| `npa_prospects` | R/W | Ideation (#3) |
| `npa_market_clusters` | R | Ideation (#3), ML Predict (#6) |

---

## Agent Interaction Patterns

### Pattern 1: New NPA Creation (Full Happy Path)
```
User: "Create a new Green Bond ETF product"
  │
  ├→ TIER 1: Master COO (#1) → detects NPA intent
  │    └→ TIER 2: NPA Domain Orchestrator (#2) → stage = INITIATION
  │         ├→ TIER 3: Ideation (#3) → generates concept, creates npa_projects record
  │         ├→ TIER 3: Classification (#4) → scores criteria, assigns type=NTG, track=Full NPA
  │         │    └→ TIER 4: Jurisdiction (#15) → adapts weights for SG jurisdiction
  │         ├→ TIER 3: AutoFill (#5) → fills 47 form fields with lineage=AUTO
  │         │    └→ TIER 4: KB Search (#12) → RAG context for field values
  │         ├→ TIER 3: ML Predict (#6) → predicts 78% approval, 45 days, bottleneck=Legal
  │         ├→ TIER 3: Risk (#7) → 4-layer risk check cascade
  │         │    └→ TIER 3: DocLifecycle (#10) → verifies required docs uploaded
  │         ├→ TIER 3: Governance (#8) → creates 7 sign-off requests
  │         │    └→ TIER 4: Notification (#13) → alerts 7 approvers
  │         └→ [Stage: SIGN_OFF — awaiting approvals]
  │              └→ TIER 4: Audit Trail (#14) → logged every step
  │
  └→ Response streamed back to user via WebSocket
```

### Pattern 2: Loop-Back with Circuit Breaker
```
Approver rejects sign-off:
  │
  ├→ Governance (#8) → creates loop_back record (count: 3)
  │    └→ check_circuit_breaker() → count >= 3 → TRIGGERED
  │         ├→ create_escalation() → escalate to VP level
  │         └→ Notification (#13) → alerts VP + COO + maker
  │
  ├→ Diligence (#9) → explains what went wrong, suggests fixes
  ├→ Audit Trail (#14) → records escalation event
  └→ NPA Orchestrator (#2) → updates stage, notifies maker
```

### Pattern 3: Breach Detection (Scheduled)
```
[Cron trigger / Monitoring Agent sweep]
  │
  ├→ Monitoring (#11) → check_breach_thresholds()
  │    ├→ VaR exceeds limit → create_breach_alert(severity=CRITICAL)
  │    └→ Volume below target → create_breach_alert(severity=WARNING)
  │
  ├→ [CRITICAL] → Governance (#8) → create_escalation()
  ├→ Notification (#13) → alerts product owner + risk team + COO
  ├→ Audit Trail (#14) → records breach event
  └→ Master COO (#1) → pushes to UI via WebSocket
```

### Pattern 4: Approver Asks Question
```
Approver: "Why is the collateral requirement 150% for this product?"
  │
  ├→ Master COO (#1) → NPA context detected
  │    └→ NPA Orchestrator (#2) → question about risk
  │         ├→ Diligence (#9) → searches KB for collateral policy
  │         │    └→ KB Search (#12) → finds MAS 656 clause + historical NPA precedent
  │         ├→ Governance (#8) → posts AI answer as comment on NPA
  │         ├→ Notification (#13) → notifies original maker of new comment
  │         └→ Audit Trail (#14) → records AI-assisted answer
  │
  └→ Response: "Based on MAS 656 Section 4.3 and similar NPA #NPA-2024-006..."
```

### Pattern 5: Multi-Jurisdiction Product
```
User: "Launch this FX product in Singapore AND Hong Kong"
  │
  ├→ NPA Orchestrator (#2) → detects multi-jurisdiction
  │    ├→ Jurisdiction (#15) → loads SG rules
  │    │    ├→ adapts classification weights (MAS focus)
  │    │    ├→ adds SG-specific doc requirements
  │    │    └→ adds SG-specific routing (MAS compliance team)
  │    ├→ Jurisdiction (#15) → loads HK rules
  │    │    ├→ adapts classification weights (HKMA/SFO focus)
  │    │    ├→ adds HK-specific doc requirements
  │    │    └→ adds HK-specific routing (SFC compliance team)
  │    ├→ Classification (#4) → scores BOTH jurisdiction contexts
  │    ├→ Risk (#7) → runs checks against BOTH regulatory frameworks
  │    └→ Governance (#8) → creates MERGED sign-off matrix (union of both)
```

---

## Technical Implementation Plan

### MCP Server Architecture
```
/server/mcp-python/
├── rest_server.py                   # FastAPI REST API (port 3002) + OpenAPI
├── mcp_server.py                    # MCP SSE server (port 3001)
├── registry.py                      # ToolRegistry + ToolDefinition
├── db.py                            # aiomysql connection pool
├── tools/
│   ├── __init__.py                  # Auto-imports all tool modules
│   ├── session.py                   # 2 tools: session management
│   ├── ideation.py                  # 5 tools: NPA creation, prohibited list
│   ├── classification.py            # 5 tools: domain assessments, scoring
│   ├── autofill.py                  # 5 tools: form auto-population
│   ├── risk.py                      # 4 tools: risk assessments, market factors
│   ├── governance.py                # 5 tools: signoffs, loopbacks, stages
│   ├── audit.py                     # 4 tools: audit log, completeness, reports
│   ├── npa_data.py                  # 4 tools: NPA CRUD, predictions
│   ├── workflow.py                  # 5 tools: workflow state, routing
│   ├── monitoring.py                # 6 tools: metrics, breaches, conditions
│   ├── documents.py                 # 4 tools: doc metadata, validation
│   ├── governance_ext.py            # 6 tools: SLA, escalations, approvals
│   ├── risk_ext.py                  # 4 tools: prerequisites, risk checks
│   ├── kb_search.py                 # 3 tools: knowledge base search
│   ├── prospects.py                 # 2 tools: prospect conversion
│   ├── dashboard.py                 # 1 tool: KPI dashboard
│   ├── notifications.py             # 3 tools: notification delivery
│   └── jurisdiction.py              # 3 tools: jurisdiction adaptation
└── test_all_tools.sh                # Full test suite (71 tools)
```

### Express Agent Orchestration Layer
```
/server/
├── index.js                         # HTTP + WebSocket server
├── agents/
│   ├── tier1/
│   │   └── master-coo.js            # Agent 1: Master COO Orchestrator
│   ├── tier2/
│   │   └── npa-orchestrator.js      # Agent 2: NPA Domain Orchestrator
│   ├── tier3/
│   │   ├── ideation.js              # Agent 3: Ideation
│   │   ├── classification.js        # Agent 4: Classification
│   │   ├── autofill.js              # Agent 5: Template AutoFill
│   │   ├── ml-prediction.js         # Agent 6: ML Prediction
│   │   ├── risk.js                  # Agent 7: Risk & Compliance
│   │   ├── governance.js            # Agent 8: Governance & Approval
│   │   ├── diligence.js             # Agent 9: Conversational Diligence
│   │   ├── doc-lifecycle.js          # Agent 10: Document Lifecycle
│   │   └── monitoring.js            # Agent 11: Post-Launch Monitoring
│   └── tier4/
│       ├── kb-search.js             # Agent 12: KB Search
│       ├── notification.js          # Agent 13: Notification
│       ├── audit-trail.js           # Agent 14: Audit Trail
│       └── jurisdiction.js          # Agent 15: Jurisdiction Adapter
├── ws/
│   └── chat-handler.js              # WebSocket message routing
└── claude/
    └── client.js                    # Anthropic SDK wrapper with MCP binding
```

### Angular Service Layer (Already Exists ✅)
```
/src/app/services/
├── api.service.ts                   ✅ Base HTTP client
├── npa-api.service.ts               ✅ NPA CRUD
├── approval-api.service.ts          ✅ Approvals
├── dashboard-api.service.ts         ✅ Dashboard KPIs
├── monitoring-api.service.ts        ✅ Monitoring
├── agent-api.service.ts             ✅ Agent sessions
├── classification-api.service.ts    ✅ Classification
├── risk-check-api.service.ts        ✅ Risk checks
├── prerequisite-api.service.ts      ✅ Prerequisites
├── audit-api.service.ts             ✅ Audit log
├── user-api.service.ts              ✅ Users
└── dify/
    ├── dify.service.ts              🔄 Replace with WebSocket to Express
    └── dify-agent.service.ts        🔄 Replace with agent-api.service.ts
```

---

## UI Component → Agent Mapping

### Page: NPA Agent Dashboard (`/agents/npa`)
| Component | Agent(s) Powering It |
|-----------|---------------------|
| Agent Hero + "Chat with Agent" CTA | Master COO (#1) entry point |
| Agent Health Panel | All agents aggregate health |
| Capability Cards (4) | Ideation (#3), Classifier (#4), Risk (#7), Governance (#8) |
| NPA Task Agents Grid (8 cards) | Tier 3 agents: Ideation, Class. Router, AutoFill, ML Predict, KB Search, Conv. Diligence, Appr. Orchestrator, Prohibited List |
| Shared Utility Agents (9 cards) | Tier 4: RAG Engine, Doc Processing, State Manager, Integration, Audit Logger, Notification, Analytics, Loop-Back, Data Retrieval |
| Knowledge Bases (4 items) | KB Search (#12): Historical NPAs, Policy Docs, Templates, Classifications |
| Connected Services (4 items) | External: Bloomberg, Policy Engine, SharePoint, SendGrid |
| Active Work Items | NPA Orchestrator (#2) task delegation |
| NPA Pipeline Table | All agents — each row reflects processing state |

### Page: NPA Detail View (`/agents/npa?mode=detail&npaId=X`)
| Tab | Agent(s) Powering It |
|-----|---------------------|
| Overview | NPA Orchestrator (#2), ML Predict (#6) |
| Form / Template Editor | AutoFill (#5) |
| Classification | Classifier (#4), Jurisdiction (#15) |
| Risk Assessment | Risk (#7), DocLifecycle (#10) |
| Sign-Offs | Governance (#8), Notification (#13) |
| Loop-Backs | Governance (#8) |
| Comments | Governance (#8), Diligence (#9) |
| Monitoring | Monitoring (#11) |
| Documents | DocLifecycle (#10) |
| Audit Log | Audit Trail (#14) |

### Page: COO NPA Dashboard (`/coo-npa`)
| Section | Agent(s) Powering It |
|---------|---------------------|
| Overview → KPIs | Monitoring (#11), Governance (#8) |
| Overview → Classification Donut | Classifier (#4) |
| Overview → Pipeline Health | NPA Orchestrator (#2) |
| Overview → Ageing | Governance (#8) SLA tracking |
| Overview → Market Clusters | Ideation (#3) |
| Overview → Opportunities | Ideation (#3) |
| Overview → Top Revenue | Monitoring (#11) |
| NPA Pool → Table | All Tier 3 agents |
| Monitoring Tab | Monitoring (#11) |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Agents** | **13** (across 4 tiers) |
| Tier 1 (Strategic) | 1 |
| Tier 2 (Domain) | 1 |
| Tier 3 (Specialist) | 9 |
| Tier 4 (Shared Utility) | 4 (includes 2 NEW) |
| **Total MCP Tools** | **48+** (core) + 8 session + 3 jurisdiction + 3 notification |
| **Total Database Tables** | **42** |
| Angular Components (agent-aware) | **30+** |
| Angular API Services | **11** |
| Express Route Files | **11** (existing) |
| Express Agent Handlers (to build) | **13** |
| Knowledge Base Sources | **4** |
| NPA Lifecycle Stages Covered | **5** (Initiation → Review → Sign-Off → Launch → Monitoring) |
