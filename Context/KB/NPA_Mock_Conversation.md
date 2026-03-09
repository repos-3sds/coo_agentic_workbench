# NPA UI Mock: Complete Conversation Flow & Process

## Overview

This document provides a comprehensive mock conversation between an AI agent and a user creating an NPA (New Product Approval), demonstrating the complete UI flow from initial chat to final NPA workflow visualization. Based on the real TSG2339 Swap Connect example from our analysis.

---

## PART 1: Agent Conversation Flow

### UI Component: [`app-orchestrator-chat`](src/app/components/npa/ideation-chat/ideation-chat.component.ts)

**User Interface Context:**
- Location: [`ChatInterfaceComponent`](src/app/components/npa/chat-interface/chat-interface.component.ts) in Agent Mode
- Real-time conversation with markdown support
- Agent identity switching and typing indicators

---

### Conversation Transcript

**🤖 NPA Agent (09:14 AM)**
> Hello! I'm your **NPA Agent**. I can help you create New Product Approvals quickly and efficiently. I'll guide you through a conversational process to understand your product and automatically generate the required documentation.
>
> What product would you like to create an NPA for today?

---

**👤 User (09:14 AM)**
> I need to create an NPA for CNY Interest Rate Swaps that we want to trade via the Hong Kong-China Swap Connect arrangement

---

**🤖 NPA Agent (09:15 AM)**
> Excellent! I understand you want to trade **CNY Interest Rate Swaps** through **Swap Connect**. This is a sophisticated cross-border derivative product that I'm familiar with.
>
> Let me gather some key details to ensure we structure this NPA correctly:
>
> **1. Product Structure:**
> - What specific CNY IRS benchmarks do you plan to trade? (e.g., FR007, SHIBOR 3M, SHIBOR O/N)
> - What tenors are you targeting? (e.g., 1Y, 2Y, 5Y)

---

**👤 User (09:16 AM)**
> We want to trade CNY IRS with FR007 and SHIBOR 3M benchmarks, primarily focused on 1Y to 5Y tenors for risk management purposes

---

**🤖 NPA Agent (09:16 AM)**
> Perfect! **FR007 and SHIBOR 3M** are both eligible under Swap Connect with **1-5 year tenors** being standard offerings.
>
> **2. Business Context:**
> - Which desk will be booking these trades? (Singapore, Hong Kong, London?)
> - What's the primary use case - client facilitation, proprietary trading, or risk management?
> - Do you have an estimated notional size or trading volume?

---

**👤 User (09:17 AM)**
> Singapore FX desk will book the trades. Primary use case is risk management for our existing CNY bond positions. We expect around RMB 500 million monthly trading volume initially

---

**🤖 NPA Agent (09:17 AM)**
> Got it! **Singapore FX desk**, **risk management** for **CNY bond hedging**, targeting **RMB 500M monthly**.
>
> **🔍 Cross-Border Detection:** I've identified this requires **Swap Connect** framework compliance. This involves:
> - HKEx OTC Clear ↔ SHCH clearing arrangement
> - Triple novation structure
> - Inter-CCP margin requirements
>
> **3. Operational Details:**
> - Will you use Bloomberg/TradeWeb for execution or direct CFETS access?
> - Do you have existing ISDA documentation with target counterparties?
> - Any specific client relationships driving this initiative?

---

**👤 User (09:18 AM)**
> We'll primarily use Bloomberg for execution. We have existing ISDA agreements with major regional banks. This is driven by client demand from our institutional clients who have CNY bond exposure

---

**🤖 NPA Agent (09:19 AM)**
> Excellent! **Bloomberg execution** with **existing ISDA frameworks** for **institutional client demand**.
>
> **📋 Classification Analysis:**
> Based on your description, I'm classifying this as:
> - **Product Type:** Existing (Variation)
> - **Reason:** CNY IRS exist, but Swap Connect mechanism is new connectivity
> - **Approval Track:** NPA Lite with cross-border enhancements
> - **Complexity:** Medium-High (regulatory coordination required)
>
> **4. Risk & Regulatory:**
> - What's your target counterparty rating profile? (Investment grade only?)
> - Any specific risk limits or concentration thresholds?
> - Do you need this approved by any specific date?

---

**👤 User (09:20 AM)**
> Investment grade counterparties only (A- minimum). Risk limits of RMB 2 billion gross notional, RMB 500 million per counterparty. We need approval by end of Q1 for client launch

---

**🤖 NPA Agent (09:20 AM)**
> Perfect! I now have sufficient information to create your NPA. Let me summarize what I understand:
>
> **📄 NPA Summary: CNY Interest Rate Swaps via Swap Connect**
> - **Product:** CNY IRS (FR007, SHIBOR 3M, 1-5Y tenors)
> - **Booking:** Singapore FX Desk
> - **Use Case:** Risk management for CNY bond positions
> - **Execution:** Bloomberg platform
> - **Volume:** RMB 500M monthly (RMB 2B gross limit)
> - **Counterparties:** Investment grade (A- minimum), RMB 500M per counterparty
> - **Timeline:** Q1 approval target
> - **Framework:** Hong Kong-China Swap Connect
>
> **🤖 AI Analysis Complete:**
> - **Similar NPAs Found:** TSG2339 (95% match) - CNY IRS Swap Connect
> - **Classification:** Existing (Variation) → NPA Lite
> - **Predicted Timeline:** 6-8 days (cross-border coordination)
> - **Required Sign-offs:** Finance, Credit, MLR, Operations, Technology (5 parties)
> - **Regulatory:** PBOC-SFC framework compliance required
>
> Ready to generate your NPA draft?

---

**👤 User (09:21 AM)**
> Yes, generate the NPA draft

---

**🤖 NPA Agent (09:21 AM)**
> **🔄 Processing Request...**
>
> ✅ **Prohibited List Check:** PASSED (No restrictions found)
> ✅ **Classification:** Existing (Variation) → NPA Lite
> ✅ **Template Selection:** TSG2339 (CNY IRS Swap Connect)
> ✅ **Auto-Fill Engine:** 78% template completion
> ✅ **Risk Prediction:** Medium complexity, 6-8 day timeline
> ✅ **Sign-off Matrix:** 5 mandatory approvers identified
>
> **📋 Draft NPA Generated Successfully!**
>
> Your NPA has been pre-filled with 37 of 47 fields (78% completion). Key sections auto-populated:
> - Product specifications and business rationale
> - Operational procedures and system requirements
> - Risk assessments adapted from similar products
> - Regulatory compliance framework
> - Cross-border booking procedures
>
> **⚠️ Manual Input Required (10 fields):**
> - Final term sheet attachment
> - Specific counterparty names
> - Exact trade dates
> - Custom risk mitigants (if any)
>
> **🎯 Proactive Recommendations:**
> 1. **PBOC Notification** (Required): Submit to PBOC 10 days before trading
> 2. **CFETS Registration** (Required): Complete trader registration process
> 3. **Inter-CCP Margin** (Important): Set up participating margin arrangements
>
> Would you like to review the draft NPA or proceed to workflow?

---

**👤 User (09:22 AM)**
> Proceed to workflow

---

**🤖 NPA Agent (09:22 AM)**
> **✨ Excellent! Transitioning to NPA Workflow...**
>
> **🏗️ Workflow Orchestration Initiated:**
> - **NPA ID:** TSG2026-015
> - **Status:** Phase 0 Complete → Phase 1 (Ingestion & Triage)
> - **Expected Timeline:** 6-8 days
> - **Next Action:** Checker Review (2-4 hours)
>
> **📊 You'll now see the complete workflow visualization with real-time status updates.**

---

## PART 2: NPA Workflow Dashboard

### UI Component: [`NpaDashboardComponent`](src/app/components/npa/dashboard/npa-dashboard.component.ts)

**Interface Context:**
- Real-time workflow tracking
- Agent health monitoring
- Document management
- Approval orchestration

---

### Workflow Status Display

#### Current Status Panel
```
🏗️ NPA Workflow: TSG2026-015
CNY Interest Rate Swaps via Swap Connect

📊 Status: Phase 1 - Ingestion & Triage
⏱️ Elapsed: 2h 15m | Remaining: 4-6 days
🎯 Progress: 15% Complete

Next Milestone: Checker Approval (Due: Today 17:00)
```

#### Live Agent Activity Panel
```
🤖 Active Agents (8/8 Online)

🔄 Currently Processing:
• Template Auto-Fill Engine: Validating cross-border fields
• Prohibited List Checker: Daily OFAC sync completed ✅
• KB Search Agent: Found 3 similar NPAs for reference

💤 Standby:
• ML Prediction Agent: Timeline forecast ready
• Approval Orchestration: Awaiting checker completion
• Conversational Diligence: Ready for questions
```

---

### Detailed Workflow Stages

#### Phase 0: Product Ideation ✅ COMPLETED (22 minutes)
```
✅ User Conversation: 8 minutes
✅ Product Classification: 1 minute
✅ Template Auto-Fill: 78% completion (12 minutes)
✅ Risk Prediction: 6-8 days forecast
✅ Prohibited Check: PASSED
```

#### Phase 1: Ingestion & Triage 🔄 IN PROGRESS (2h 15m)
```
🔄 Checker Review: In Progress (Sarah Chen)
   Started: 14:30 | SLA: 17:00 (2h 45m remaining)
   Status: Reviewing cross-border procedures section

⏳ Pending: Completeness validation
⏳ Pending: Quality assurance check
```

#### Phase 2: Sign-Off Orchestration ⏳ PENDING

**Approval Orchestration Agent Management:**
```
🎯 Intelligent Routing Engine:
   └── Agent: Approval Orchestration (from Domain Agents)
   └── Logic: Risk matrix + notional amount + cross-border flags
   └── Output: 5-party approval sequence with SLA optimization

📋 Required Approvers (5 parties):

1. 💳 Credit (RMG-Credit) - Jane Tan
   ⏱️ Agent Prediction: 1.5 days (ML forecast: 92% confidence)
   📝 Pre-Analysis: Counterparty exposure limits
   🤖 Agent Support: RAG engine providing similar deal precedents

2. 💰 Finance (Group Product Control) - Mark Chen
   ⏱️ Agent Prediction: 2 days (longest path in critical chain)
   📝 Pre-Analysis: P&L allocation, transfer pricing methodology
   🤖 Agent Support: Analytics providing cost/revenue projections

3. 📊 Market Risk (MLR) - David Wong
   ⏱️ Agent Prediction: 1.5 days (parallel with Credit)
   📝 Pre-Analysis: Interest rate risk aggregation, VaR impact
   🤖 Agent Support: ML model pre-calculating risk sensitivities

4. ⚙️ Operations - Lisa Tan
   ⏱️ Agent Prediction: 1 day (standard settlement procedures)
   📝 Pre-Analysis: HKEx OTC Clear settlement workflows
   🤖 Agent Support: Integration hub validating system capabilities

5. 💻 Technology - Alex Kumar
   ⏱️ Agent Prediction: 1 day (Bloomberg API standard)
   📝 Pre-Analysis: Platform connectivity, trade confirmation flows
   🤖 Agent Support: Doc processing pre-validating technical specs
```

**Optimization Intelligence:**
```
🚀 Approval Orchestration Optimizations:
   • Parallel Routing: Credit + MLR + Operations (saves 0.5 days)
   • Pre-Seeding: Finance gets heads-up during checker phase
   • Auto-Escalation: SLA breach predictions with smart notifications
   • Loop-Back Prevention: 89% accuracy in identifying review issues
```

#### Phase 3: Launch Preparation ⏳ PENDING
```
📋 Launch Checklist:
• PBOC notification submission (10 days before)
• CFETS trader registration completion
• Bloomberg platform configuration
• Risk limit implementation in Murex
• Staff training completion
• UAT sign-off
```

---

### Template Fields Status

#### UI Component: [`NpaField`](src/app/lib/npa-interfaces.ts) Integration

#### Auto-Filled Fields (78% - 37 fields) 🟢

**Template Auto-Fill Engine Results:**
```
✅ Product Name: CNY Interest Rate Swap via Swap Connect
   🤖 Agent: Product Ideation + AI Generation
   📊 Confidence: 98% (direct user specification)
✅ Business Unit: Treasury & Markets
   🤖 Agent: KB Search Engine → TSG2339 similarity match
   📊 Confidence: 95% (organizational consistency)
✅ Booking System: Murex (IRD|IRS|Vanilla CNH typology)
   🤖 Agent: Integration Hub → System capability lookup
   📊 Confidence: 100% (system validation confirmed)
✅ Clearing Arrangement: HKEx OTC Clear ↔ SHCH novation
   🤖 Agent: RAG Engine → Swap Connect framework docs
   📊 Confidence: 100% (regulatory requirement)
✅ Regulatory Framework: PBOC-SFC Joint Initiative
   🤖 Agent: KB Search → Policy document retrieval
   📊 Confidence: 100% (framework definition)
✅ Risk Management: Daily VaR, Inter-CCP margin (0.55x multiplier)
   🤖 Agent: ML Prediction → TSG2339 parameter adaptation
   📊 Confidence: 87% (scaled from historical precedent)
```

#### Adapted Fields (15% - 7 fields) 🟡

**Template Auto-Fill Engine - Adaptation Logic:**
```
⚠️ Target Volume: RMB 500M monthly (was: RMB 200M in TSG2339)
   🤖 Agent: ML Prediction → Volume scaling analysis
   📊 Adaptation Logic: User specification override + market sizing
   🔍 Validation: RAG engine confirms feasible market capacity
⚠️ Risk Limits: RMB 2B gross, RMB 500M per counterparty
   🤖 Agent: Risk Assessment → Custom limit derivation
   📊 Adaptation Logic: User requirements + regulatory constraints
   🔍 Cross-Check: Policy engine validates within MAS guidelines
⚠️ Benchmarks: FR007 + SHIBOR 3M (was: FR007 only in TSG2339)
   🤖 Agent: KB Search → Swap Connect eligible rates lookup
   📊 Adaptation Logic: User scope expansion + framework validation
   🔍 Verification: Integration hub confirms Bloomberg data availability
```

#### Manual Fields (7% - 3 fields) ❌

**Human Input Required - Agent Assistance Available:**
```
❌ Final Term Sheet: [UPLOAD REQUIRED]
   Required by: Checker Review (Phase 1)
   Format: PDF
   🤖 Smart Help: Doc Processing agent will auto-extract key terms
   💡 Agent Tip: Conversational Diligence can guide document preparation
❌ Counterparty List: [SPECIFY NAMES]
   Required by: Credit Review (Phase 2)
   🤖 Smart Help: KB Search can suggest previous Swap Connect counterparties
   💡 Agent Tip: "I can search Salesforce for recent A-rated CNY IRS counterparties in Hong Kong"
❌ Go-Live Date: [SELECT DATE]
   Required by: Launch Planning (Phase 3)
   🤖 Smart Help: ML Prediction suggests optimal launch windows
   💡 Agent Tip: Analytics agent tracking Q1 deadline feasibility (March 31)
```

---

### Document Upload Interface

#### Required Documents Checklist
```
📋 Document Requirements:

🔴 CRITICAL (Blocks Approval):
• Final Term Sheet (PDF) - Upload by Checker phase
• ISDA Master Agreement confirmations
• Counterparty credit ratings documentation

🟡 IMPORTANT (May delay approval):
• Risk committee meeting minutes
• Client demand analysis
• Competitive benchmarking study

🟢 OPTIONAL (Good to have):
• Training materials draft
• Implementation timeline (detailed)
• Budget allocation memo
```

#### Upload Status
```
📤 Upload Interface:

[📁 Drag & Drop Zone]
Supported: PDF, DOC, XLS | Max: 10MB per file

Recent uploads:
✅ ISDA_Template_CNY_IRS.pdf (2.1MB) - 14:30
✅ Risk_Memo_Swap_Connect.docx (1.8MB) - 14:45
⏳ Processing: Counterparty_Ratings.pdf (uploading...)
```

---

### Real-Time Notifications & Alerts

#### Current Active Alerts
```
🔔 Active Notifications (3):

🟡 PBOC Deadline Alert
   Message: PBOC notification required 10 days before trading
   Action: Submit notification by [calculated date]
   Assigned: Compliance Team
🟢 Similar NPA Reference
   Message: TSG2339 approval took 5 days (similar scope)
   Action: Use as reference for timeline planning
🔵 Checker SLA Reminder
   Message: Checker review due in 2h 45m
   Action: Monitor progress
```

#### Smart Recommendations
```
💡 AI Recommendations (4):

1. 🎯 High Impact
   Pre-complete CFETS trader registration (saves 3-5 days)
2. 🎯 Medium Impact
   Engage Finance early on transfer pricing methodology
3. 🎯 Low Impact
   Schedule training sessions during approval process
4. ⚠️ Risk Alert
   Q1 deadline tight - consider expedited approval request
```

---

### Agent Health Dashboard

#### Performance Metrics
```
🤖 Agent Performance (Last 24h):

📈 System Health: 99.2% uptime
🧠 ML Prediction Accuracy: 94%
🔍 KB Search Hit Rate: 96%
⚡ Auto-Fill Success: 78% average

🏆 Top Performing Agents:
1. Prohibited List Checker: 100% accuracy
2. Template Auto-Fill: 92% user acceptance
3. Classification Router: 89% first-time correct

⚠️ Attention Required:
• Approval Orchestration: 2 NPAs awaiting SLA escalation
```

---

### Expected Timeline Visualization

#### Gantt Chart Preview
```
📊 Predicted Timeline (6-8 days):

Day 1-2: [████████▓▓] Checker Review (Current)
Day 2-4: [▓▓▓▓▓▓▓▓▓▓] Credit + Finance (Parallel)
Day 3-5: [▓▓▓▓▓▓▓▓▓▓] MLR + Operations (Parallel)
Day 4-6: [▓▓▓▓▓▓▓▓▓▓] Technology Review
Day 6-8: [▓▓▓▓▓▓▓▓▓▓] Launch Preparation

🎯 Target Completion: [March 28, 2026]
🚨 Q1 Deadline: [March 31, 2026] ✅ On Track
```

#### Dependency Tracking
```
🔗 Critical Dependencies:

External (Not controllable):
• PBOC notification processing: 5-7 business days
• CFETS trader approval: 3-5 business days
• Bloomberg platform certification: 2-3 days

Internal (Controllable):
• Risk limit configuration: 1 day
• Staff training delivery: 2 days
• Documentation finalization: 1 day
```

---

### Proactive Workflow Optimization

#### Smart Escalation Rules
```
⚡ Auto-Escalation Triggers:

🚨 SLA Breach Prevention:
• Checker review >90% of SLA → Auto-remind
• Any approver >36h → Manager notification
• 3 loop-backs → COO escalation

🎯 Timeline Optimization:
• External dependency detected → Early parallel initiation
• Bottleneck prediction → Workload rebalancing suggestion
• Fast-track eligibility → Automatic route adjustment
```

#### Loop-Back Intelligence
```
🔄 Smart Loop-Back Handling:

Previous Loop-Backs (0):
• This NPA: Clean submission ✅
• Desk Average: 1.2 loop-backs per NPA
• Improvement: 15% better than Q4 2025

🤖 AI Prevention:
• Auto-completed risk sections (prevents 68% of Finance loop-backs)
• Cross-border compliance pre-check (prevents 45% of Legal loop-backs)
• Document completeness validation (prevents 72% of Checker loop-backs)
```

---

## PART 3: Real-Time Status Updates

### Live Activity Feed
```
⏰ Live Updates (TSG2026-015):

15:30 | 🔍 Checker Review: Sarah Chen opened document
15:32 | 📝 Auto-note added: Cross-border procedures validated
15:35 | 🤖 Agent Alert: Similar NPA (TSG2339) completed in 5 days
15:40 | ⚡ Optimization: CFETS registration can be initiated in parallel
15:45 | 📨 Notification sent: PBOC deadline approaching (Action required)
15:47 | 🔄 Background: Document OCR processing completed
```

### Mobile-Optimized Status
```
📱 Mobile Dashboard Summary:

TSG2026-015 | CNY IRS Swap Connect
Status: Checker Review (2h 45m remaining)
Progress: ████▓▓▓▓▓▓ 15%

Next: Sign-off routing (5 approvers)
Timeline: 4-6 days remaining
Risk: 🟢 On track for Q1 deadline
```

---

## PART 4: Integration Points

### Dify Agent Service Integration
```typescript
// Real-time agent communication
interface AgentStatus {
  agentId: string;
  status: 'active' | 'idle' | 'processing';
  currentTask?: string;
  performance: {
    uptime: number;
    accuracy: number;
    responseTime: number;
  };
}
```

### KB Search Integration
```typescript
// Similar NPA recommendations
interface SimilarNPA {
  npaId: string;
  similarity: number;
  outcome: 'approved' | 'rejected';
  timeline: number;
  lessons: string[];
  differences: string[];
}
```

### ML Prediction Integration
```typescript
// Timeline and bottleneck predictions
interface NPAPrediction {
  approvalLikelihood: number;
  timelineEstimate: {
    best: number;
    likely: number;
    worst: number;
  };
  bottlenecks: PredictedBottleneck[];
  recommendations: OptimizationAction[];
}
```

---

## Summary: Complete UI Experience

This mock demonstrates the complete journey from initial AI conversation to sophisticated workflow management, showcasing:

1. **Conversational Intelligence**: Natural language understanding with context-aware questioning
2. **Automated Processing**: 78% template completion with intelligent field adaptation
3. **Workflow Orchestration**: Real-time status tracking with predictive insights
4. **User Experience**: Seamless transition from chat to workflow with proactive guidance
5. **Integration Depth**: Comprehensive agent coordination with external system integration

The UI successfully bridges the gap between conversational AI and enterprise workflow management, providing users with both simplicity and sophisticated process control.
