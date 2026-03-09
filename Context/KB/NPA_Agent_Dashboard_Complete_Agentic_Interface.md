# NPA Agent Dashboard: Complete Agentic Interface
## Building Blocks Architecture + Agent Capabilities + Infrastructure Health

**Purpose:** Pure agent interaction screen - NOT workflow tracking
**Focus:** What the agent CAN DO + Its building blocks + Active work items

---

## Dashboard Philosophy

**This screen answers:**
- 🤖 What can the NPA Agent do for me?
- 🧱 What building blocks power this agent?
- 📚 What knowledge does it have access to?
- 🔌 What services/APIs is it connected to?
- ⚙️ What work is it currently handling?
- 💚 Is everything healthy?

**This screen does NOT show:**
- ❌ NPA pipeline/lifecycle (that's in COO Function: New Product Approval)
- ❌ My NPAs list (that's in COO Function)
- ❌ Approval queues (that's in COO Function)
- ❌ KPIs like "12 days → 4 days" (that's in COO Function)

---

## Screen Layout: 7 Sections

```
┌────────────────────────────────────────────────────────────┐
│ SECTION 1: Agent Hero & Primary CTA                        │
├────────────────────────────────────────────────────────────┤
│ SECTION 2: Agent Capabilities (What I Can Do)              │
├────────────────────────────────────────────────────────────┤
│ SECTION 3: Building Blocks (Shared Utilities)              │
├────────────────────────────────────────────────────────────┤
│ SECTION 4: Knowledge Bases Linked                          │
├────────────────────────────────────────────────────────────┤
│ SECTION 5: Services & Integrations (APIs, MCPs)            │c
├────────────────────────────────────────────────────────────┤
│ SECTION 6: Active Work Items (Tasks in Progress)           │
├────────────────────────────────────────────────────────────┤
│ SECTION 7: Agent Performance & Health                      │
└────────────────────────────────────────────────────────────┘
```

---

## SECTION 1: Agent Hero & Primary CTA

### **Top Banner**

**Agent Identity:**
```
┌─────────────────────────────────────────────────────┐
│  🤖 NPA AGENT                                       │
│  Your AI Assistant for New Product Approvals       │
│                                                      │
│  🟢 Online | Trained on 1,784 NPAs | 95% Success   │
│                                                      │
│  "I can create NPAs, predict approvals, find        │
│   precedents, answer policy questions, validate     │
│   documents, and orchestrate approvals."            │
└─────────────────────────────────────────────────────┘
```

**Agent Avatar (Visual):**
- Friendly AI icon (not generic robot)
- Animated breathing/pulse effect (shows it's alive)
- Status indicator: 🟢 Online / 🟡 Busy / 🔴 Offline

**Agent Stats Bar (Below Avatar):**
```
📊 1,784 NPAs Learned   |   ⚡ 95% Success Rate   |   🎯 92% Prediction Accuracy
```

---

### **Primary CTA (Large Button)**

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│         💬  CHAT WITH NPA AGENT                     │
│                                                      │
│   Ask me anything • Create NPA • Find precedents    │
│                                                      │
└─────────────────────────────────────────────────────┘

[Alternative Entry Points Below]

[📋 Create Guided NPA]   [🔍 Search Knowledge Base]   [📊 Predict Outcome]
```

**What happens when clicked:**
- [💬 Chat] → Opens full-screen conversational interface (multi-intent)
- [📋 Create] → Direct to guided NPA creation interview
- [🔍 Search] → Jump to KB search interface
- [📊 Predict] → Upload draft, get ML prediction

---

## SECTION 2: Agent Capabilities (What I Can Do)

**Title:** "🎯 What This Agent Can Do"

**Layout:** 2x4 grid of capability cards

### **Capability Card Structure:**
Each card shows:
- Icon + Capability Name
- 1-sentence description
- Key stat (usage count or performance metric)
- [Quick Launch] button
- Expandable "Learn More" (collapses to show example)

---

### **Card 1: Create New NPA**
```
┌──────────────────────────────────────────┐
│ 📝 Create New NPA                        │
├──────────────────────────────────────────┤
│ Guide you through 10 questions to build  │
│ a complete NPA with 78% auto-fill        │
│                                           │
│ 📊 1,248 NPAs created                    │
│ ⚡ Avg: 38 min (vs 4 hrs manual)         │
│                                           │
│ [Start Creation]  [▼ Learn More]        │
└──────────────────────────────────────────┘

[Expanded State]
Example: "Create FX Option on GBP/USD"
Sub-Agents Used:
  • Product Ideation (interview)
  • Classification Router (NTG/Variation)
  • Template Auto-Fill (78% coverage)
```

---

### **Card 2: Find Similar NPAs**
```
┌──────────────────────────────────────────┐
│ 🔍 Find Similar NPAs                     │
├──────────────────────────────────────────┤
│ Search 1,784+ historical NPAs by         │
│ description, product type, or semantic   │
│ similarity                                │
│                                           │
│ 🎯 94% avg similarity match              │
│ 📚 Searches descriptions, not keywords   │
│                                           │
│ [Search Now]  [▼ Learn More]             │
└──────────────────────────────────────────┘

[Expanded State]
Example: "Find NPAs similar to TSG1917"
Building Blocks Used:
  • KB Search Agent (RAG Engine)
  • Vector Embeddings (pgvector)
  • npa_embeddings table (1,784 records)
```

---

### **Card 3: Predict Approval Outcome**
```
┌──────────────────────────────────────────┐
│ 📊 Predict Approval                      │
├──────────────────────────────────────────┤
│ AI predictions on approval likelihood,   │
│ timeline, and bottlenecks before submit  │
│                                           │
│ 🎯 92% prediction accuracy               │
│ ⏱️ ±0.8 days timeline error              │
│                                           │
│ [Run Prediction]  [▼ Learn More]         │
└──────────────────────────────────────────┘

[Expanded State]
Example: "78% approval likely, 4.2 days, Finance bottleneck"
Sub-Agents Used:
  • ML Prediction Agent (XGBoost)
  • Historical pattern analysis
  • Bottleneck detection (87% accurate)
```

---

### **Card 4: Answer Policy Questions**
```
┌──────────────────────────────────────────┐
│ 📖 Policy Q&A                            │
├──────────────────────────────────────────┤
│ Ask anything about NPA policies, MAS     │
│ regulations, approval tracks, rules      │
│                                           │
│ 📖 200+ policy docs                      │
│ ✅ 96% answer accuracy                   │
│                                           │
│ [Ask Question]  [▼ Learn More]           │
└──────────────────────────────────────────┘

[Expanded State]
Example: "When is Finance VP approval needed?"
→ "For notionals >$50M per MBS Policy 4.2.1"
Knowledge Sources:
  • MAS 656, MAS 643, CFTC guidelines
  • MBS internal policies
  • Always cites source
```

---

### **Card 5: Auto-Fill Template**
```
┌──────────────────────────────────────────┐
│ 📄 Auto-Fill Template                    │
├──────────────────────────────────────────┤
│ Upload term sheet/RFP → Extract data →   │
│ Pre-fill NPA template automatically      │
│                                           │
│ 📄 Supports PDF, Word, Excel             │
│ 🎯 78% avg auto-fill coverage            │
│                                           │
│ [Upload Document]  [▼ Learn More]        │
└──────────────────────────────────────────┘

[Expanded State]
Example: Upload "GBP_USD_Term_Sheet.pdf" → 14 fields extracted
Sub-Agents + Building Blocks:
  • Document Processing Agent (OCR, Vision AI)
  • Template Auto-Fill Engine
  • Document Ingestion Agent
```

---

### **Card 6: Classify & Route**
```
┌──────────────────────────────────────────┐
│ 🎯 Classification & Routing              │
├──────────────────────────────────────────┤
│ Classify product (NTG/Variation/Existing)│
│ and determine optimal approval track     │
│                                           │
│ 🎯 88% classification confidence         │
│ 🚀 35% eligible for Evergreen (same-day) │
│                                           │
│ [Classify Product]  [▼ Learn More]       │
└──────────────────────────────────────────┘

[Expanded State]
Example: "FX Option → Existing → NPA Lite → 4-day track"
Sub-Agents Used:
  • Classification Router Agent (2-stage)
  • KB Search (find precedents)
  • Rule-Based Decision (23 rules)
```

---

### **Card 7: Validate Documents**
```
┌──────────────────────────────────────────┐
│ ✅ Document Validation                   │
├──────────────────────────────────────────┤
│ Validate completeness, dates, signatures,│
│ compliance before Checker submission     │
│                                           │
│ ✅ Validates 13 doc categories           │
│ ⚠️ Catches 89% of issues pre-submission  │
│                                           │
│ [Validate Documents]  [▼ Learn More]     │
└──────────────────────────────────────────┘

[Expanded State]
Example: "Credit report 95 days old (must be <90)"
Sub-Agents + Building Blocks:
  • Document Checklist Agent
  • Validation Sub-Agent
  • Completeness Triage Sub-Agent
```

---

### **Card 8: Explain Past Decisions**
```
┌──────────────────────────────────────────┐
│ 🕵️ Historical Analysis                   │
├──────────────────────────────────────────┤
│ Understand why NPAs were approved/       │
│ rejected, patterns, approver reasoning   │
│                                           │
│ 🕵️ Analyzes 1,784 historical decisions  │
│ 💬 Parses 5,000+ approver comments       │
│                                           │
│ [Analyze NPA]  [▼ Learn More]            │
└──────────────────────────────────────────┘

[Expanded State]
Example: "Why was TSG1823 rejected?"
→ "Finance rejected - missing ROAE sensitivity"
Building Blocks Used:
  • KB Search Agent (full-text search)
  • Conversational Diligence Agent
  • npa_comments table analysis
```

---

## SECTION 3: Building Blocks (Shared Utilities)

**Title:** "🧱 Building Blocks - Shared Agent Infrastructure"

**Subtitle:** "These utility agents power NPA Agent and 6 other domain agents"

**Layout:** Card grid showing 9 shared utility agents

**Toggle:** [Show Only NPA-Used] ⇄ [Show All Utilities]

---

### **Utility Card Structure:**
- Utility name + icon
- "Shared by X domain agents" badge
- Status indicator (🟢 Healthy / 🟡 Degraded / 🔴 Down)
- Usage stats specific to NPA Agent today
- [View Details] expandable section

---

### **Utility 1: Knowledge Base Agent (RAG Engine)**
```
┌──────────────────────────────────────────┐
│ 🧠 Knowledge Base Agent (RAG)            │
│ 🔗 Shared by 7 domain agents             │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • KB Searches: 234                       │
│ • Avg Response: 1.2s                     │
│ • Hit Rate: 94%                          │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
What it does:
• Semantic search across 1,784+ NPAs
• Vector similarity matching (pgvector)
• Retrieval-Augmented Generation (RAG)

Connected Knowledge Bases:
• Historical NPAs (1,784 records)
• Policy documents (200+ docs)
• Templates library (15 templates)

Performance:
• Query latency: 1.2s avg
• Accuracy: 94% relevance
• Embeddings: 1536-dim vectors
```

---

### **Utility 2: Document Processing Agent**
```
┌──────────────────────────────────────────┐
│ 📄 Document Processing Agent             │
│ 🔗 Shared by 5 domain agents             │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • Documents Processed: 89                │
│ • Extraction Confidence: 94%             │
│ • Avg Processing: 8 sec                  │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
Capabilities:
• OCR (Tesseract + Cloud OCR)
• Table extraction from PDFs
• Vision AI (GPT-4V, Claude 3.5)
• Document classification

Technologies:
• Tesseract for scanned docs
• Custom ML models for financial docs
• Quality threshold: >90% confidence

Today's Stats:
• PDFs: 67, Word: 15, Excel: 7
• Auto-accepted: 83 (94% confidence)
• Manual review: 6 (80-90% confidence)
```

---

### **Utility 3: State Manager**
```
┌──────────────────────────────────────────┐
│ ⚙️ State Manager                         │
│ 🔗 Shared by 4 domain agents             │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • State Transitions: 45                  │
│ • NPAs in Flight: 23                     │
│ • Loop-backs Handled: 2                  │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
What it does:
• Tracks workflow states (Draft → Review → Sign-Off)
• Manages state transitions
• Handles loop-backs intelligently
• Circuit breaker after 3 iterations

NPA Workflow States:
• Ideation: 8 NPAs
• Review: 3 NPAs
• Sign-Off: 7 NPAs
• Launch & Monitoring: 5 NPAs

Loop-Back Logic:
• Avg iterations: 1.4
• Circuit breakers triggered: 0 today
• Smart routing: 2 avoided Maker loop-backs
```

---

### **Utility 4: Data Retrieval Agent**
```
┌──────────────────────────────────────────┐
│ 🔌 Data Retrieval Agent                  │
│ 🔗 Shared by all 7 domain agents         │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • Queries: 456                           │
│ • Avg Response: 0.8s                     │
│ • Cache Hit Rate: 65%                    │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
Connected Systems:
• C720 (customer data): 120 queries
• Murex (trading): 89 queries
• MINV (limits): 156 queries
• RICO (risk controls): 45 queries
• NPA Historical DB: 46 queries

Technologies:
• REST APIs for modern systems
• Database connectors for legacy
• Redis caching (65% hit rate)
• Rate limiting per system

Performance:
• Success rate: 99.5%
• Failed queries: 2 (auto-retried)
• Avg latency: 0.8s
```

---

### **Utility 5: Notification Agent**
```
┌──────────────────────────────────────────┐
│ 🔔 Notification Agent                    │
│ 🔗 Shared by 6 domain agents             │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • Notifications Sent: 234                │
│ • Delivery Rate: 99.1%                   │
│ • Avg Time to Action: 2.3 hrs            │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
Channels:
• Email: 156 sent
• Slack: 45 sent
• In-app: 234 sent (all)
• SMS: 12 sent (urgent only)

Notification Types:
• NPA submitted: 8
• Approval requests: 45
• SLA warnings: 12
• Escalations: 2

Smart Features:
• Batching (consolidate alerts)
• Urgency-based routing
• Template library (20+ templates)
```

---

### **Utility 6: Analytics Agent**
```
┌──────────────────────────────────────────┐
│ 📊 Analytics Agent                       │
│ 🔗 Shared by all 7 domain agents         │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • Metrics Collected: 12,847              │
│ • Insights Generated: 8                  │
│ • Dashboard Refresh: 30s                 │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
Metrics Tracked:
• Processing times (per stage)
• Success rates (approvals/rejections)
• Agent performance (accuracy, speed)
• User behavior (feature usage)

Insights Today:
• "Finance approvals 2x slower this week"
• "FX Options: 85% first-time approval"
• "Document extraction: 89% (down 5%)"

Dashboards:
• Executive (high-level KPIs)
• Operational (real-time queues)
• Agent Performance (health metrics)
```

---

### **Utility 7: Integration Agent**
```
┌──────────────────────────────────────────┐
│ 🔗 Integration Agent                     │
│ 🔗 Shared by all 7 domain agents         │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • API Calls: 456                         │
│ • Success Rate: 98.2%                    │
│ • Avg Latency: 320ms                     │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
Integrations:
• Outbound APIs: 234 calls
• Inbound webhooks: 8 received
• File transfers (SFTP): 12
• Database queries: 202

Technologies:
• API Gateway: Kong
• Webhook handler: Express.js
• Retry logic: Exponential backoff
• Circuit breaker: Auto-stop failing services

Failed Calls:
• 8 failures today (auto-retried)
• All successful on retry
• No circuit breakers triggered
```

---

### **Utility 8: Audit Logger**
```
┌──────────────────────────────────────────┐
│ 📜 Audit Logger                          │
│ 🔗 Shared by all 7 domain agents         │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • Logs Created: 3,456                    │
│ • Storage Used: 2.3 GB                   │
│ • Query Response: <500ms                 │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
What's Logged:
• All state transitions (who, when, why)
• All user actions (create, edit, approve)
• All agent decisions (inputs, outputs, reasoning)
• All data access (who viewed what)

Compliance:
• MAS Audit: 100% coverage
• Tamper-proof: Cryptographic hashing
• Retention: 7 years (regulatory)
• Export: On-demand for auditors

Technologies:
• PostgreSQL (append-only tables)
• AES-256 encryption
• Elasticsearch (fast queries)
```

---

### **Utility 9: Loop-Back Handler**
```
┌──────────────────────────────────────────┐
│ 🔄 Loop-Back Handler                     │
│ 🔗 Shared by 4 domain agents             │
├──────────────────────────────────────────┤
│ Status: 🟢 Healthy                       │
│                                           │
│ NPA Agent Usage Today:                   │
│ • Loop-backs Detected: 8                 │
│ • Avg Iterations: 1.4                    │
│ • Circuit Breakers: 0                    │
│                                           │
│ [▼ View Details]                         │
└──────────────────────────────────────────┘

[Expanded State]
Smart Routing:
• Determines: Does clarification need Maker?
• If answerable from docs → AI handles
• If needs NPA changes → Loop to Maker
• Circuit breaker: Escalate after 3 iterations

Today's Activity:
• Total loop-backs: 8
• AI-handled (no Maker): 2 (saved 2-3 days each)
• Maker-required: 6
• Escalations: 0 (circuit breaker not triggered)

Decision Logic:
• Clarification from existing docs? → AI answers
• New documents needed? → Loop to Maker
• NPA field changes? → Loop to Maker
```

---

## SECTION 4: Knowledge Bases Linked

**Title:** "📚 Knowledge Bases - What This Agent Knows"

**Subtitle:** "1,784 NPAs + 200+ policies + 15 templates + regulatory docs"

**Layout:** Collapsible sections by knowledge category

---

### **Category 1: Historical NPAs**
```
┌───────────────────────────────────────────────────────┐
│ 📊 Historical NPAs (2020-2025)                        │
│ [▼ Expand]                                            │
├───────────────────────────────────────────────────────┤
│ ✅ Approved NPAs: 1,487 records                       │
│    • Used 234 times today                             │
│    • Last updated: 2 hours ago (new approval: TSG042) │
│    • [Browse] [Search] [Download Dataset]             │
│                                                        │
│ ❌ Rejected NPAs: 297 records (with rejection reasons)│
│    • Used 67 times today                              │
│    • Common rejection reasons:                         │
│      - Missing ROAE (28%)                             │
│      - Incomplete docs (34%)                          │
│      - Policy violations (18%)                        │
│    • [Browse Rejections] [Analyze Patterns]           │
│                                                        │
│ 📚 Vector Embeddings: 1,784 total                    │
│    • 1536-dimensional vectors (OpenAI)                │
│    • Semantic search enabled                          │
│    • Avg similarity match: 94%                        │
└───────────────────────────────────────────────────────┘
```

---

### **Category 2: Policy Documents**
```
┌───────────────────────────────────────────────────────┐
│ 📖 Policy Documents & Guidelines                      │
│ [▼ Expand]                                            │
├───────────────────────────────────────────────────────┤
│ 📄 MAS 656 Full Text & Guidelines                     │
│    • Version: 2024 (latest)                           │
│    • Used 67 times today (most queried)               │
│    • Relevance: ⭐⭐⭐⭐⭐ Critical                      │
│    • [View] [Download] [Highlighted Sections]         │
│                                                        │
│ 📄 MAS 643 Broker Management Requirements             │
│    • Used 34 times today                              │
│    • Relevance: ⭐⭐⭐⭐⭐ High                         │
│    • [View] [Download]                                │
│                                                        │
│ 📄 CFTC Disclosure Requirements                       │
│    • Used 12 times today                              │
│    • Relevance: ⭐⭐⭐ Medium                          │
│    • [View] [Download]                                │
│                                                        │
│ 📄 MBS Internal Risk Framework v5.1                   │
│    • Used 28 times today                              │
│    • Relevance: ⭐⭐⭐⭐⭐ High                         │
│    • Last updated: Nov 2025                           │
│    • [View] [Download]                                │
│                                                        │
│ 📄 NPA Guidelines v2.3                                │
│    • Used 89 times today (highest usage!)             │
│    • Last updated: Dec 15, 2025                       │
│    • [View] [Download] [Version History]              │
└───────────────────────────────────────────────────────┘
```

---

### **Category 3: Templates**
```
┌───────────────────────────────────────────────────────┐
│ 📋 Templates Library (15 templates)                   │
│ [▼ Expand]                                            │
├───────────────────────────────────────────────────────┤
│ 📄 NPA Form Template v2.3 (47 fields)                │
│    • Used 45 times today                              │
│    • Auto-fill capable: 78% avg coverage              │
│    • [Download] [Preview] [Use in New NPA]            │
│                                                        │
│ 📄 Credit Memo Template                               │
│    • Used 23 times today                              │
│    • [Download] [Preview]                             │
│                                                        │
│ 📄 Risk Assessment Template (ROAE Model)              │
│    • Used 34 times today                              │
│    • Excel with formulas pre-configured               │
│    • [Download] [Preview]                             │
│                                                        │
│ 📄 Product Specification Template                     │
│    • Used 18 times today                              │
│    • [Download] [Preview]                             │
│                                                        │
│ 📄 Cross-Border Booking Agreement Template            │
│    • Used 12 times today                              │
│    • Word doc with placeholders                       │
│    • [Download] [Preview]                             │
│                                                        │
│ [View All 15 Templates]                               │
└───────────────────────────────────────────────────────┘
```

---

### **Category 4: Product Classifications**
```
┌───────────────────────────────────────────────────────┐
│ 🎯 Product Classification Knowledge                   │
│ [▼ Expand]                                            │
├───────────────────────────────────────────────────────┤
│ 📊 Product Risk Classification Matrix                 │
│    • Used 23 times today                              │
│    • Defines: Risk levels by product type             │
│    • Version: Sep 2025                                │
│    • [View Matrix] [Download]                         │
│                                                        │
│ 📊 NPA Approval Matrix                                │
│    • Used 45 times today                              │
│    • Defines: Which approvals needed by risk/value    │
│    • Version: Nov 2025                                │
│    • [View Matrix] [Download]                         │
│                                                        │
│ 📊 Evergreen Product List                             │
│    • Pre-approved products for same-day trading       │
│    • 47 products currently on list                    │
│    • Updated: Weekly by Risk Committee                │
│    • [View List] [Check Eligibility]                  │
└───────────────────────────────────────────────────────┘
```

---

### **Category 5: Cross-Functional Knowledge**
```
┌───────────────────────────────────────────────────────┐
│ 🔗 Shared Knowledge with Other Agents                 │
│ [▼ Expand]                                            │
├───────────────────────────────────────────────────────┤
│ Desk Support Knowledge Base                           │
│    • Broker limits, trading mandates                  │
│    • Shared: 234 docs                                 │
│    • [Browse Shared Knowledge]                        │
│                                                        │
│ ORM Knowledge Base                                     │
│    • Risk events, audit findings                      │
│    • Shared: 567 docs                                 │
│    • [Browse Shared Knowledge]                        │
│                                                        │
│ Strategic PM Knowledge Base                            │
│    • Project templates, vendor lists                  │
│    • Shared: 89 docs                                  │
│    • [Browse Shared Knowledge]                        │
└───────────────────────────────────────────────────────┘
```

---

## SECTION 5: Services & Integrations (APIs, MCPs, Webhooks)

**Title:** "🔌 Services & Integrations - External Connections"

**Subtitle:** "2 MCPs + 6 APIs + 4 Webhooks + 3 Databases"

**Layout:** Tabbed interface (MCPs | APIs | Webhooks | Databases)

---

### **Tab 1: MCP Servers**
```
┌─────────────────────────────────────────────────────────┐
│ MCP SERVERS (Model Context Protocol)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📌 Notion MCP                                           │
│    URL: https://mcp.notion.com/mcp                      │
│    Status: 🟢 Connected                                 │
│    Used For: Accessing NPA House data                   │
│    Last Used: 5 minutes ago                             │
│    Uptime: 99.8%                                        │
│    [Test Connection] [View Logs] [Configure]            │
│                                                          │
│ 🎨 Figma MCP                                            │
│    URL: https://mcp.figma.com/mcp                       │
│    Status: 🟢 Connected                                 │
│    Used For: Accessing design specs (product visuals)   │
│    Last Used: 2 hours ago                               │
│    Uptime: 99.5%                                        │
│    [Test Connection] [View Logs] [Configure]            │
│                                                          │
│ [+ Add MCP Server] (admin only)                         │
└─────────────────────────────────────────────────────────┘
```

---

### **Tab 2: REST APIs**
```
┌─────────────────────────────────────────────────────────┐
│ REST APIS (Internal Systems)                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🌐 C720 Customer API                                    │
│    Endpoint: https://internal.mbs.com/api/c720          │
│    Status: 🟢 Healthy                                   │
│    Latency: 120ms (avg)                                 │
│    Purpose: Fetch customer data for NPA context         │
│    Calls Today: 234                                     │
│    Success Rate: 99.1%                                  │
│    [Test] [View API Docs] [Configure]                   │
│                                                          │
│ 🌐 Murex Trading API                                    │
│    Endpoint: https://murex.mbs.com/api/trades           │
│    Status: 🟢 Healthy                                   │
│    Latency: 85ms                                        │
│    Purpose: Fetch trade data for product risk           │
│    Calls Today: 89                                      │
│    Success Rate: 98.7%                                  │
│    [Test] [Docs] [Configure]                            │
│                                                          │
│ 🌐 MINV Limit API                                       │
│    Endpoint: https://minv.mbs.com/api/limits            │
│    Status: 🟢 Healthy                                   │
│    Latency: 65ms                                        │
│    Purpose: Check credit and capital limits             │
│    Calls Today: 156                                     │
│    Success Rate: 99.5%                                  │
│    [Test] [Docs] [Configure]                            │
│                                                          │
│ 🌐 RICO Risk Controls API                               │
│    Endpoint: https://rico.mbs.com/api/controls          │
│    Status: 🟢 Healthy                                   │
│    Latency: 95ms                                        │
│    Purpose: Validate risk controls compliance           │
│    Calls Today: 45                                      │
│    Success Rate: 100%                                   │
│    [Test] [Docs] [Configure]                            │
│                                                          │
│ 🌐 NPA House Approval API                               │
│    Endpoint: https://npahouse.mbs.com/api/approvals     │
│    Status: 🟢 Healthy                                   │
│    Latency: 110ms                                       │
│    Purpose: Push NPA approvals to legacy system         │
│    Calls Today: 12                                      │
│    Success Rate: 100%                                   │
│    [Test] [Docs] [Configure]                            │
│                                                          │
│ 🌐 ROBO Advisor API                                     │
│    Endpoint: https://robo.mbs.com/api/insights          │
│    Status: 🟢 Healthy                                   │
│    Latency: 140ms                                       │
│    Purpose: Get customer insights for product targeting │
│    Calls Today: 34                                      │
│    Success Rate: 97.1%                                  │
│    [Test] [Docs] [Configure]                            │
│                                                          │
│ [+ Add API] (admin only)                                │
└─────────────────────────────────────────────────────────┘
```

---

### **Tab 3: Webhooks**
```
┌─────────────────────────────────────────────────────────┐
│ WEBHOOKS (Event-Driven Integration)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ OUTBOUND WEBHOOKS (We send events to external systems)  │
│                                                          │
│ 🔔 NPA Approval Notification                            │
│    URL: https://npahouse.mbs.com/webhook/approval       │
│    Trigger: When NPA fully approved                     │
│    Status: 🟢 Active                                    │
│    Sent Today: 5                                        │
│    Delivery Rate: 100%                                  │
│    [Test] [Logs] [Configure]                            │
│                                                          │
│ 🔔 SLA Breach Alert                                     │
│    URL: https://slack.com/webhooks/coo-alerts           │
│    Trigger: When approval SLA exceeded                  │
│    Status: 🟢 Active                                    │
│    Sent Today: 2                                        │
│    Delivery Rate: 100%                                  │
│    [Test] [Logs] [Configure]                            │
│                                                          │
│ INBOUND WEBHOOKS (We receive events from external)      │
│                                                          │
│ 🔔 NPA House New Submission                             │
│    URL: /api/webhook/npa/new                            │
│    Listens: New NPA created in NPA House                │
│    Status: 🟢 Active                                    │
│    Received Today: 8                                    │
│    Processing Rate: 100%                                │
│    [Test] [Logs] [Configure]                            │
│                                                          │
│ 🔔 Approval Decision                                    │
│    URL: /api/webhook/npa/decision                       │
│    Listens: Approver approved/rejected in NPA House     │
│    Status: 🟢 Active                                    │
│    Received Today: 12                                   │
│    Processing Rate: 100%                                │
│    [Test] [Logs] [Configure]                            │
│                                                          │
│ [+ Add Webhook] (admin only)                            │
└─────────────────────────────────────────────────────────┘
```

---

### **Tab 4: Database Connections**
```
┌─────────────────────────────────────────────────────────┐
│ DATABASE CONNECTIONS                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🗄️ NPA Historical Database (Primary)                    │
│    Type: PostgreSQL 15 (Supabase)                       │
│    Host: npa-db.internal.mbs.com                        │
│    Status: 🟢 Connected                                 │
│    Purpose: Historical NPA records for ML training      │
│    Tables: 21 tables (npas, npa_properties, etc.)       │
│    Records: 1,784 NPAs                                  │
│    Queries Today: 67                                    │
│    Avg Query Time: 45ms                                 │
│    [Test Connection] [Schema] [Configure]               │
│                                                          │
│ 🗄️ Product Catalog Database                             │
│    Type: SQL Server                                     │
│    Host: products.mbs.com                               │
│    Status: 🟢 Connected                                 │
│    Purpose: Master list of tradable products            │
│    Records: 2,300+ products                             │
│    Queries Today: 34                                    │
│    Avg Query Time: 32ms                                 │
│    [Test] [Schema] [Configure]                          │
│                                                          │
│ 🗄️ Capital Management Database                          │
│    Type: Oracle                                         │
│    Host: capital.mbs.com                                │
│    Status: 🟢 Connected                                 │
│    Purpose: RWA calculations, capital allocation        │
│    Queries Today: 23                                    │
│    Avg Query Time: 89ms                                 │
│    [Test] [Schema] [Configure]                          │
│                                                          │
│ [+ Add Database] (admin only)                           │
└─────────────────────────────────────────────────────────┘
```

---

### **Health Monitoring Panel (Bottom of Section)**
```
┌─────────────────────────────────────────────────────────┐
│ 🚨 HEALTH MONITORING & ALERTS                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Auto-Alerts Configured: ✅ Yes                          │
│ Alert Channels:                                         │
│    • Slack: #coo-tech-alerts                            │
│    • Email: vikram@mbs.com, admin@mbs.com               │
│                                                          │
│ Alert Triggers:                                         │
│    • API latency >500ms for 5 consecutive calls         │
│    • Success rate <95% over 1 hour                      │
│    • Connection failures (immediate alert)              │
│    • MCP disconnections (immediate alert)               │
│                                                          │
│ Alerts Today: 0 🟢 (All systems healthy)                │
│                                                          │
│ Last Alert: Dec 27, 14:30                               │
│    "Murex API latency spike (650ms avg)" - Resolved     │
│                                                          │
│ [View Alert History] [Configure Alerts]                 │
└─────────────────────────────────────────────────────────┘
```

---

## SECTION 6: Active Work Items (Tasks in Progress)

**Title:** "⚙️ Active Work Items - What I'm Currently Doing"

**Subtitle:** "Real-time view of tasks being processed by NPA Agent and its sub-agents"

**Layout:** Table view with filters + real-time updates

---

### **Work Items Table**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Filters: [All] [Creating NPAs] [Searching] [Predicting] [Validating]        │
│ Sort By: [Most Recent] [Longest Running] [Agent Type]                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ ID    | Task Type          | Sub-Agent               | Status    | Duration │
│-------+--------------------+-------------------------+-----------+----------│
│ W-423 | Create NPA         | Product Ideation        | 🟢 Active | 12 min   │
│       | User: Sarah Lim    | Question 7 of 10        |           |          │
│       | Product: FX Swap   | Auto-filling template   |           |          │
│       | [View Details] [Monitor]                                             │
│                                                                               │
│ W-422 | KB Search          | KB Search Agent         | 🟢 Active | 3 sec    │
│       | Query: "FX straddle" | Searching embeddings  |           |          │
│       | User: Mark Lee     | Found 5 matches         |           |          │
│       | [View Details] [Monitor]                                             │
│                                                                               │
│ W-421 | Document Upload    | Document Processing     | 🟡 Processing | 8 sec │
│       | File: Term_Sheet.pdf| Extracting text (OCR) |           |          │
│       | User: Emily Tan    | Confidence: 89%         |           |          │
│       | [View Details] [Monitor]                                             │
│                                                                               │
│ W-420 | ML Prediction      | ML Prediction Agent     | 🟢 Active | 2 sec    │
│       | NPA: TSG2025-882   | Running XGBoost model   |           |          │
│       | User: Vikram       | Analyzing 1,784 records |           |          │
│       | [View Details] [Monitor]                                             │
│                                                                               │
│ W-419 | Validate Documents | Document Checklist Agent| ✅ Complete | 15 sec  │
│       | NPA: TSG2025-880   | 13/13 documents valid   |           |          │
│       | User: David Lim    | Ready for submission    |           |          │
│       | [View Details] [Archive]                                             │
│                                                                               │
│ W-418 | Classification     | Classification Router   | 🟢 Active | 5 sec    │
│       | Product: EUR Bond  | Stage 1: Analyzing...   |           |          │
│       | User: Jane Tan     | Checking precedents     |           |          │
│       | [View Details] [Monitor]                                             │
│                                                                               │
│ W-417 | Policy Q&A         | Conversational Diligence| ✅ Complete | 2 sec   │
│       | Question: "Finance VP?" | Answer generated  |           |          │
│       | User: Sarah Chen   | Cited: MBS Policy 4.2.1 |           |          │
│       | [View Details] [Archive]                                             │
│                                                                               │
│ Showing 7 of 23 active work items                                            │
│ [Load More] [View All] [Export]                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### **Expandable Work Item Detail (Example: W-423)**
```
┌──────────────────────────────────────────────────────────┐
│ WORK ITEM W-423: Create NPA                              │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ User: Sarah Lim (sarah.lim@mbs.com)                      │
│ Started: 12 minutes ago (09:30 AM)                       │
│ Product Type: FX Swap (EUR/USD)                          │
│                                                           │
│ CURRENT STATUS:                                          │
│ 🟢 Active - Question 7 of 10                            │
│                                                           │
│ SUB-AGENTS INVOLVED:                                     │
│ ✅ Product Ideation Agent                                │
│    Status: Listening for user responses                  │
│    Questions asked: 7 of 10                              │
│    Responses captured: 7                                 │
│                                                           │
│ 🔄 KB Search Agent                                       │
│    Status: Found TSG1917 (94% match)                     │
│    Precedents identified: 3                              │
│                                                           │
│ 🟡 Template Auto-Fill Engine                             │
│    Status: In progress (62% complete)                    │
│    Fields auto-filled: 29 of 47                          │
│    Source: TSG1917 (Direct Copy: 18, Adapted: 11)       │
│                                                           │
│ ⏳ ML Prediction Agent                                   │
│    Status: Waiting for more data                         │
│    Will run after: Question 10 answered                  │
│                                                           │
│ ⏸️ Classification Router Agent                           │
│    Status: Idle (will trigger after user submits)       │
│                                                           │
│ PROGRESS: 70% (Questions + Template)                     │
│ ETA: ~8 minutes remaining                                │
│                                                           │
│ [View Conversation] [View Draft NPA] [Close]             │
└──────────────────────────────────────────────────────────┘
```

---

### **Work Items Summary Cards (Top of Section)**
```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 🟢 ACTIVE TASKS         │  │ 🟡 QUEUED TASKS         │  │ ✅ COMPLETED TODAY      │
│                         │  │                         │  │                         │
│ 23                      │  │ 8                       │  │ 156                     │
│                         │  │                         │  │                         │
│ Avg Duration: 4.2 min   │  │ Wait Time: 12 sec       │  │ Success Rate: 98.7%     │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ ⚠️ LONG-RUNNING         │  │ 🔴 FAILED               │  │ 📊 THROUGHPUT           │
│                         │  │                         │  │                         │
│ 2                       │  │ 1                       │  │ 34 tasks/hour           │
│                         │  │                         │  │                         │
│ Longest: 45 min         │  │ Auto-retrying...        │  │ Peak: 45 tasks/hour     │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

### **Work Items by Agent Type (Chart/Breakdown)**
```
┌──────────────────────────────────────────────────────────┐
│ BREAKDOWN BY SUB-AGENT                                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Product Ideation Agent          ████████████ 12 active   │
│ KB Search Agent                 ███████ 7 active         │
│ Template Auto-Fill Engine       ██████ 6 active          │
│ ML Prediction Agent             ████ 4 active            │
│ Classification Router Agent     ███ 3 active             │
│ Document Processing Agent       █████ 5 active           │
│ Document Checklist Agent        ████ 4 active            │
│ Conversational Diligence Agent  ██ 2 active              │
│                                                           │
│ Total: 43 sub-agent tasks (some NPAs use multiple)       │
└──────────────────────────────────────────────────────────┘
```

---

## SECTION 7: Agent Performance & Health

**Title:** "💚 Agent Performance & System Health"

**Subtitle:** "Real-time monitoring of agent effectiveness and infrastructure status"

**Layout:** 2-column grid (Performance | Health)

---

### **Left Column: Performance Metrics**

#### **Metric Card 1: Agent Effectiveness**
```
┌──────────────────────────────────────────┐
│ 🎯 AGENT EFFECTIVENESS                   │
├──────────────────────────────────────────┤
│                                           │
│ Success Rate: 95.2%                      │
│ ████████████████████░ 95%                │
│ Baseline: 52% → Improvement: +43%        │
│                                           │
│ First-Time Approval: 95%                 │
│ (NPAs created by agent)                  │
│                                           │
│ Auto-Fill Coverage: 78%                  │
│ (Avg fields populated automatically)     │
│                                           │
│ Prediction Accuracy: 92%                 │
│ (Approval likelihood predictions)        │
│                                           │
│ Timeline Accuracy: ±0.8 days             │
│ (Predicted vs actual)                    │
│                                           │
│ [View Detailed Breakdown]                │
└──────────────────────────────────────────┘
```

---

#### **Metric Card 2: Processing Speed**
```
┌──────────────────────────────────────────┐
│ ⚡ PROCESSING SPEED                      │
├──────────────────────────────────────────┤
│                                           │
│ Avg NPA Creation: 38 min                 │
│ (Conversational interview)               │
│ Baseline: 4 hours → 84% faster           │
│                                           │
│ KB Search: 1.2 sec                       │
│ (Semantic search 1,784 NPAs)             │
│                                           │
│ Document Processing: 8 sec               │
│ (OCR + extraction + validation)          │
│                                           │
│ ML Prediction: 2.3 sec                   │
│ (XGBoost model inference)                │
│                                           │
│ Classification: 1.8 sec                  │
│ (2-stage classification + routing)       │
│                                           │
│ [View Response Time Trends]              │
└──────────────────────────────────────────┘
```

---

#### **Metric Card 3: Usage Stats**
```
┌──────────────────────────────────────────┐
│ 📊 USAGE STATISTICS (Today)              │
├──────────────────────────────────────────┤
│                                           │
│ Active Users: 23                         │
│ (Currently interacting with agent)       │
│                                           │
│ Sessions Started: 67                     │
│ (New conversations initiated)            │
│                                           │
│ NPAs Created: 12                         │
│ (Completed and submitted)                │
│                                           │
│ KB Searches: 234                         │
│ (Similarity searches performed)          │
│                                           │
│ Predictions Run: 45                      │
│ (ML approval predictions)                │
│                                           │
│ Documents Processed: 89                  │
│ (OCR + extraction)                       │
│                                           │
│ Policy Questions: 156                    │
│ (Q&A with policy docs)                   │
│                                           │
│ [View Usage Trends]                      │
└──────────────────────────────────────────┘
```

---

### **Right Column: System Health**

#### **Health Card 1: Infrastructure Status**
```
┌──────────────────────────────────────────┐
│ 💚 INFRASTRUCTURE HEALTH                 │
├──────────────────────────────────────────┤
│                                           │
│ Overall Status: 🟢 ALL SYSTEMS HEALTHY   │
│                                           │
│ Database: 🟢 Healthy                     │
│   • PostgreSQL: 45ms query time          │
│   • Uptime: 99.98%                       │
│   • Storage: 2.3 GB / 100 GB (2%)        │
│                                           │
│ APIs: 🟢 Healthy                         │
│   • 6/6 APIs responding                  │
│   • Avg latency: 95ms                    │
│   • Success rate: 98.9%                  │
│                                           │
│ MCPs: 🟢 Healthy                         │
│   • 2/2 MCPs connected                   │
│   • Notion: 99.8% uptime                 │
│   • Figma: 99.5% uptime                  │
│                                           │
│ Shared Utilities: 🟢 Healthy             │
│   • 9/9 utility agents responding        │
│   • No alerts triggered                  │
│                                           │
│ [View Detailed Health]                   │
└──────────────────────────────────────────┘
```

---

#### **Health Card 2: Error Rates**
```
┌──────────────────────────────────────────┐
│ 🚨 ERROR RATES & ALERTS                  │
├──────────────────────────────────────────┤
│                                           │
│ Error Rate: 1.3% (Low)                   │
│ ██░░░░░░░░░░░░░░░░░░ 1.3%                │
│ Target: <2% ✅                           │
│                                           │
│ Errors Today: 23 of 1,784 operations     │
│                                           │
│ Breakdown:                                │
│ • API timeouts: 8 (auto-retried)         │
│ • OCR low confidence: 6 (manual review)  │
│ • Classification ambiguous: 5 (escalated)│
│ • Database query failures: 2 (retried)   │
│ • Other: 2                                │
│                                           │
│ Active Alerts: 0 🟢                      │
│ Last Alert: Dec 27, 14:30 (Resolved)     │
│                                           │
│ [View Error Logs] [Configure Alerts]     │
└──────────────────────────────────────────┘
```

---

#### **Health Card 3: Resource Usage**
```
┌──────────────────────────────────────────┐
│ 💻 RESOURCE USAGE                        │
├──────────────────────────────────────────┤
│                                           │
│ CPU: 34%                                 │
│ ███████░░░░░░░░░░░░░░ 34%                │
│ Status: 🟢 Normal                        │
│                                           │
│ Memory: 4.2 GB / 16 GB (26%)             │
│ █████░░░░░░░░░░░░░░░ 26%                 │
│ Status: 🟢 Normal                        │
│                                           │
│ Network: 12.5 MB/s                       │
│ ████░░░░░░░░░░░░░░░░ 15%                 │
│ Status: 🟢 Normal                        │
│                                           │
│ Storage: 2.3 GB / 100 GB (2%)            │
│ █░░░░░░░░░░░░░░░░░░░ 2%                  │
│ Status: 🟢 Normal                        │
│                                           │
│ Agent Tokens: 234K / 1M (23%)            │
│ █████░░░░░░░░░░░░░░░ 23%                 │
│ Status: 🟢 Normal                        │
│                                           │
│ [View Resource Trends]                   │
└──────────────────────────────────────────┘
```

---

#### **Health Card 4: Recent Activity Log**
```
┌──────────────────────────────────────────┐
│ 📜 RECENT ACTIVITY LOG                   │
├──────────────────────────────────────────┤
│                                           │
│ 🕐 2 min ago: KB Search completed        │
│    Query: "FX straddle"                  │
│    Result: 5 matches found               │
│    Duration: 1.1s                        │
│                                           │
│ 🕐 5 min ago: NPA Created                │
│    User: Sarah Lim                       │
│    Product: FX Swap EUR/USD              │
│    Duration: 38 min                      │
│                                           │
│ 🕐 12 min ago: ML Prediction run         │
│    NPA: TSG2025-882                      │
│    Result: 89% approval likely           │
│    Duration: 2.1s                        │
│                                           │
│ 🕐 18 min ago: Document validated        │
│    File: Term_Sheet.pdf                  │
│    Result: Valid (94% confidence)        │
│    Duration: 8s                          │
│                                           │
│ 🕐 34 min ago: Classification complete   │
│    Product: EUR Bond                     │
│    Result: EXISTING → NPA Lite           │
│    Confidence: 91%                       │
│                                           │
│ [View Full Activity Log]                 │
└──────────────────────────────────────────┘
```

---

## User Interaction Flow

### **Primary Journey: Chat with Agent**

**Step 1: User clicks [💬 Chat with NPA Agent]**

**Opens full-screen conversational interface:**
```
┌────────────────────────────────────────────────────┐
│ ← Back to NPA Agent Dashboard       [User: Vikram]│
├────────────────────────────────────────────────────┤
│                                                     │
│  🤖 NPA Agent                                      │
│  Hi Vikram! How can I help you today?             │
│                                                     │
│  I can:                                            │
│  • Create a new NPA (guided interview)            │
│  • Find similar historical NPAs                   │
│  • Predict approval likelihood                    │
│  • Answer policy questions                        │
│  • Auto-fill templates from documents             │
│  • Classify and route products                    │
│  • Validate documents                             │
│  • Explain past decisions                         │
│                                                     │
│  What would you like to do?                        │
│                                                     │
│                       [Type your message...] →     │
└────────────────────────────────────────────────────┘
```

**User types:** "Find NPAs similar to FX straddle structure"

**Agent responds:**
```
🤖 Searching knowledge base for FX straddle NPAs...

✅ Found 3 matches:

1. TSG1917 - FX Straddle GBP/USD (94% similar)
   Status: Approved | Timeline: 3.0 days | Desk: Singapore FX
   [View Details] [Use as Template]

2. TSG1823 - FX Straddle EUR/JPY (88% similar)
   Status: Approved | Timeline: 4.0 days | Desk: Hong Kong FX
   [View Details] [Use as Template]

3. TSG1801 - FX Straddle USD/CNY (82% similar)
   Status: Rejected | Reason: Missing collateral docs
   [View Details] [Learn Why Rejected]

Would you like to:
• Create a new NPA based on one of these?
• See detailed comparison?
• Search for more?
```

**Agent is context-aware, multi-turn, helpful.**

---

## Summary: What Makes This Agentic

### **Pure Agent Focus:**
✅ Capabilities front and center (what agent can DO)
✅ Building blocks visible (shared utilities powering agent)
✅ Knowledge bases linked (what agent KNOWS)
✅ Services/APIs shown (external connections)
✅ Work items displayed (what agent is DOING now)
✅ Health monitoring (is agent WORKING well)

### **NOT Business Process:**
❌ No NPA pipeline/lifecycle stages
❌ No "My NPAs" list
❌ No approval queues
❌ No KPIs like "12 days → 4 days"

**Those belong in: COO Functions > New Product Approval**

### **Navigation Separation:**

**COO Function: New Product Approval**
- Entry: Sidebar > COO FUNCTIONS > New Product Approval
- Purpose: Track NPAs through business lifecycle
- Users: Makers, Checkers, Approvers
- Shows: Pipeline, Aging, KPIs, Queues

**Functional Agent: NPA Agent**
- Entry: Sidebar > FUNCTIONAL AGENTS > NPA Agent
- Purpose: Interact with AI capabilities
- Users: Anyone needing agent intelligence
- Shows: Capabilities, Building Blocks, Knowledge, Health

**Perfect separation of concerns!** 🎯

