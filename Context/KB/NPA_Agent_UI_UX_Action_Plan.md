# NPA Agent UI/UX Action Plan
## Complete User Flow & Information Architecture

**Goal:** Design intuitive navigation from "User clicks NPA Agent" → "NPA Approved & Launched"

---

## Current State Analysis (From Screenshot)

**What I See:**
- Left sidebar with COO Functions (Desk Support, NPA, DCE, etc.)
- Functional Agents section (NPA Agent is one of them)
- Middle section shows workflow stages (Ingestion → Review → Sign Off → Launch → PIR → Monitoring)
- Main content area shows NPA details (Product Specs, Documents)
- Right panel shows "Active Agents" (DocExtractionAgent, CompletenessCheckAgent, HistoryAgent)
- Bottom shows Audit & Evidence Log

**What's Missing:**
- Landing page/dashboard when user first clicks "NPA Agent"
- Overview of NPA Agent capabilities & sub-agents
- Pipeline view of all ongoing NPAs
- KPIs and analytics
- Entry points for different user types (Maker vs Checker vs Approver)

---

## Proposed User Flow: Complete Journey

### **LEVEL 1: NPA Agent Landing Page (Dashboard)**
**Trigger:** User clicks "NPA Agent" from left sidebar

**Purpose:** Orientation + Quick Actions + Status Overview

**What User Sees:**

#### **Section 1: Hero Area - Quick Actions (Top)**
Three primary actions based on user role:

**For Makers:**
- **[+ Create New NPA]** (Large primary button)
  - Launches conversational AI interview
  - Badge showing "Average 38 min to complete"
  
- **[Continue Draft NPA]** (If user has drafts)
  - Shows thumbnail cards of saved drafts
  - Each card: NPA ID, Product name, % complete, Last edited
  
- **[Upload & Auto-Populate]** (Alternative entry)
  - Upload term sheet/RFP → AI extracts & pre-fills
  - Badge: "78% auto-fill accuracy"

**For Checkers:**
- **[Review Pending NPAs (3)]** (Shows count)
  - Direct link to review queue
  
**For Approvers:**
- **[Your Pending Approvals (5)]** (Shows count)
  - Direct link to sign-off queue
  - SLA countdown badges (red/yellow/green)

---

#### **Section 2: NPA Agent Overview Card**

**What is the NPA Agent?**
Brief 2-sentence description:
"The NPA Agent streamlines New Product Approval from 12 days to 4 days using AI-powered automation. It orchestrates 8 specialized sub-agents to guide you through ideation, documentation, approvals, and launch."

**Architecture Visualization:**
Simple flowchart showing 8 sub-agents (non-interactive, just informative):

```
[Product Ideation] → [Classification Router] → [Template Auto-Fill] → [ML Prediction]
        ↓                    ↓                        ↓                    ↓
[KB Search] ← [Document Checklist] → [Conversational Diligence] → [Approval Orchestration]
        ↓                                                                  ↓
[Prohibited List Checker] ────────────────────────────────────────────────┘
```

**Below flowchart:**
- Expandable accordion: "▶ Learn More About Each Sub-Agent"
  - Click to expand: 8 rows, each showing:
    - Agent name
    - 1-sentence purpose
    - Example: "Reduces X by Y%"

**Metrics Display:**
- **Success Rate:** 95% first-time approval (up from 52%)
- **Average Timeline:** 4.2 days (down from 12 days)
- **Auto-Fill Coverage:** 78% of fields (saves 60 min/NPA)

---

#### **Section 3: NPA Pipeline - Live View**

**Title:** "Active NPAs (23)" with filter dropdown

**Visualization:** Kanban board OR horizontal pipeline view

**Columns/Stages:**
1. **Draft (8)**
2. **Checker Review (3)**
3. **Sign-Off (7)**
4. **Launch Prep (2)**
5. **Launched (3 this week)**

**Each NPA Card Shows:**
- NPA ID (clickable)
- Product name (truncated)
- Product type badge (FX Option, Swap, etc.)
- Maker name
- Days in current stage (with color: <2 days green, 2-4 yellow, >4 red)
- Progress bar (% complete)
- Status badge (On Track / At Risk / Delayed)

**Interactions:**
- Click card → Opens detailed NPA view (existing screen you built)
- Hover card → Quick preview tooltip (notional, desk, timeline)
- Drag & drop disabled (workflow controls this, not user)

**Filters (Dropdown):**
- My NPAs (Maker view)
- My Desk NPAs (Team view)
- All NPAs (Admin view)
- By Product Type (FX, Rates, Credit, etc.)
- By Status (Draft, Checker Review, etc.)

---

#### **Section 4: Aging Analysis - NPAs at Risk**

**Title:** "Aging NPAs - Attention Required (4)"

**Why:** Highlights NPAs approaching SLA breach or stuck

**Table View:**

| NPA ID | Product | Days Elapsed | Stage | Issue | Action |
|--------|---------|--------------|-------|-------|--------|
| TSG2025-820 | EUR/USD Swap | 9 days | Sign-Off | Finance VP pending 3 days | [Send Reminder] |
| TSG2025-815 | Credit Derivative | 14 days | Checker Review | Missing documents (2) | [Contact Maker] |
| TSG2025-801 | FX Option | 8 days | Sign-Off | Legal has questions | [View Thread] |
| TSG2025-798 | Bond Fund | 11 days | Launch Prep | Tech UAT incomplete | [Escalate] |

**Color Coding:**
- 7-10 days: Yellow (Warning)
- >10 days: Red (Critical)

**Quick Actions:**
- [Send Reminder] → Automated email to approver with SLA countdown
- [Contact Maker] → Opens chat with Maker, AI drafts message
- [View Thread] → Jump to Comments section of NPA
- [Escalate] → Notify GFM COO, create escalation ticket

---

#### **Section 5: Top Performers - Revenue Impact**

**Title:** "Top 5 NPAs by Revenue Potential (This Quarter)"

**Why:** Show business value, celebrate wins

**Card Grid (5 cards, horizontal):**

Each card shows:
- **NPA ID:** TSG2025-042
- **Product:** FX Put Option GBP/USD
- **Desk:** Singapore FX Desk
- **Notional:** $75M
- **Estimated Annual Revenue:** $2.3M
- **Status:** Approved ✅ (Launched Dec 18)
- **Timeline:** 1.1 days (91% faster than baseline)

**Sorting Options:**
- By Revenue (default)
- By Speed (fastest approvals)
- By Complexity (most fields auto-filled)

**Interaction:**
- Click card → Opens detailed NPA view
- [Share Success Story] button → Generates 1-pager for leadership

---

#### **Section 6: NPA KPIs - Performance Dashboard**

**Title:** "NPA Agent Performance Metrics"

**Layout:** 3x2 grid of metric cards

**Metric Card 1: Approval Success Rate**
- **Current:** 95% (first-time approval)
- **Baseline:** 52%
- **Trend:** ↑ 43% improvement
- **Sparkline:** Last 12 weeks trend

**Metric Card 2: Average Timeline**
- **Current:** 4.2 days
- **Target:** 4.0 days
- **Baseline:** 12 days
- **Trend:** ↓ 67% reduction

**Metric Card 3: Loop-Back Rate**
- **Current:** 0.2 per NPA
- **Baseline:** 1.4 per NPA
- **Trend:** ↓ 86% reduction
- **Impact:** "Saves 3-5 days per loop-back avoided"

**Metric Card 4: Template Auto-Fill Coverage**
- **Current:** 78%
- **Target:** 85%
- **Trend:** ↑ 12% from launch
- **Impact:** "Saves 60 min per NPA"

**Metric Card 5: Document Completeness (First Submission)**
- **Current:** 89%
- **Baseline:** 45%
- **Trend:** ↑ 44% improvement
- **Impact:** "Reduces Checker loop-backs by 68%"

**Metric Card 6: ML Prediction Accuracy**
- **Approval Likelihood:** 92% accuracy
- **Timeline Prediction:** ±0.8 days average error
- **Bottleneck Detection:** 87% accurate
- **Trend:** Improving with each NPA (learning)

**Interactions:**
- Click metric card → Drill-down view (detailed breakdown)
- Time range selector (Last 7 days / 30 days / Quarter / All time)
- Export to PDF/Excel button

---

#### **Section 7: Quick Links & Resources**

**For Makers:**
- [📖 NPA User Guide] → Step-by-step documentation
- [🎥 Video Tutorial] → 5-min walkthrough
- [❓ Common Questions] → FAQ with AI chat support
- [📋 NPA Template Library] → Download blank templates

**For Approvers:**
- [📊 Approval Best Practices] → Guidelines for reviewers
- [⏱️ SLA Tracker] → My approvals and deadlines
- [🔔 Notification Settings] → Configure email/Slack alerts

**For Admins:**
- [⚙️ Configuration] → Approval tracks, thresholds, rules
- [👥 User Management] → Assign roles (Maker/Checker/Approver)
- [🗂️ Knowledge Base] → Upload historical NPAs for ML training

---

### **LEVEL 2: Create New NPA - Conversational Interface**

**Trigger:** User clicks [+ Create New NPA] from Landing Page

**Transition:** Smooth slide-in from right OR full-page navigation

**What Changes:**
- Main content area replaces dashboard with chat interface
- Left sidebar stays visible (for navigation)
- Right panel shows "Active Agents" (real-time)
- Top breadcrumb: "NPA Agent > Create New NPA"

**Chat Interface Layout:**

**Header:**
- **Title:** "Create New NPA - Conversational Interview"
- **Subtitle:** "I'll guide you through 10 questions to build your NPA"
- **Progress:** Question 3 of 10 (30% complete)
- **Estimated Time Remaining:** ~25 minutes

**Main Chat Area:**
- Agent messages on left (blue bubble)
- User responses on right (gray bubble)
- Document upload area inline (drag & drop or browse)
- Real-time typing indicator when agent is "thinking"

**Example Flow (First 3 Messages):**

```
[Agent]: Hi! I'm your NPA Agent. I'll help you create a New Product Approval 
         in about 38 minutes. Ready to start?
         
         [Let's Go!] [I Need Help First]

[User clicks: Let's Go!]

[Agent]: Great! Let's start with the basics.
         
         Question 1 of 10: Describe the product in your own words.
         (Example: "It's an FX option where we sell USD, buy GBP...")
         
         [Text box for user to type]

[User types]: It's an FX option on GBP/USD...

[Agent]: Perfect! An FX Option on GBP/USD. 
         
         🔍 I'm checking our database... Found 8 similar products!
         📊 TSG1917 is 94% similar - I can auto-fill 78% of your NPA based on this.
         
         Question 2 of 10: What's the notional amount?
         
         [Text box]
```

**Right Panel - Active Agents (Real-Time Updates):**

Shows agents activating as conversation progresses:

```
ACTIVE AGENTS:

✅ Product Ideation Agent
   Status: Listening...
   Last Action: Captured product type (FX Option)
   
🔄 KB Search Agent  
   Status: Searching...
   Found: TSG1917 (94% match)
   
⏳ Classification Router Agent
   Status: Waiting for more info...
   
⏸️ Template Auto-Fill Engine
   Status: Waiting for KB Search...
   
⏸️ ML Prediction Agent
   Status: Idle
```

**Bottom - Auto-Save Indicator:**
- "Draft auto-saved 30 seconds ago"
- [Save & Exit] button (saves draft, returns to dashboard)

---

### **LEVEL 3: NPA Detail View - Individual NPA**

**Trigger:** User clicks NPA card from Pipeline OR "Continue Draft"

**What User Sees:** (Similar to your current screenshot, but enhanced)

**Layout:** 3-column

#### **Left Column: Workflow Stages (Vertical Timeline)**

Shows 6 stages with status indicators:

```
🔵 Ingestion & Triage ✅ COMPLETE (09:00-09:42 AM, Dec 16)
  └─ Substeps:
     ✅ Product Ideation Interview (38 min)
     ✅ Document Upload (13 files)
     ✅ Completeness Check (100%)

🔵 Review ✅ COMPLETE (09:42 AM-02:00 PM, Dec 16)
  └─ Substeps:
     ✅ Checker Review (Emily Tan, 4 hours)
     ✅ Document Validation (All passed)

🟢 Sign Off - IN PROGRESS (02:00 PM Dec 16 - Now)
  └─ Substeps:
     ✅ Credit Approval (Jane Tan, 20.5 hrs)
     ✅ Finance Approval (Mark Lee, 26 hrs)
     🔄 Finance VP (Jane Tan, pending 1 hr)
     ✅ MLR Approval (Sarah Chen, 20 hrs)
     ✅ Operations (David Lim, 3.5 hrs)
     ✅ Technology (Emily Wong, 19.2 hrs)
     
  Progress: 5 of 6 approvals (83%)

⏸️ Launch - PENDING
  └─ Awaiting all sign-offs

⏸️ PIR - NOT STARTED

⏸️ Monitoring - NOT STARTED
```

**Interactions:**
- Click stage → Expand/collapse substeps
- Click substep → Jump to relevant section in main content
- Hover approver name → Quick profile card

---

#### **Middle Column: Main Content Area**

**Top Section - NPA Header:**
- **NPA ID:** TSG2025-042
- **Status Badge:** APPROVAL_MODE (blue)
- **Product Name:** FX Put Option GBP/USD Vanilla
- **Maker:** Sarah Lim (Singapore FX Desk)
- **Submitted:** Dec 16, 09:42 AM
- **Last Updated:** Just now
- **Actions:** [Save & Continue] [Request Help] [View Audit Log]

**Tabbed Interface:**

**Tab 1: Product Specifications**
- Document upload area (your current design is good)
- Extracted attributes (Product Type, Currency Pair, Notional, Tenor)
- Auto-filled by DocExtractionAgent with confidence %

**Tab 2: NPA Template (47 Fields)**
- Grouped by 10 categories (collapsible sections):
  1. Product Specs
  2. Operational & Tech Info
  3. Pricing Model
  4. Risk Analysis
  5. Data Management
  6. Entity/Location
  7. IP Info
  8. Financial Crime
  9. Risk Reporting
  10. Trading Products

- Each field shows:
  - Field name
  - Field value (editable)
  - Auto-fill status (🟢 Auto-filled & verified / 🟡 Auto-filled, verify / ⚪ Manual entry)
  - Source (if auto-filled): "From TSG1917" with [View Source] link

**Tab 3: Documents (13 uploaded)**
- Table view with columns:
  - Document Name
  - Category (1-10)
  - Size
  - Upload Date
  - Validation Status (✅ Valid / ⚠️ Warning / ❌ Invalid)
  - Actions ([Download] [Replace] [Delete])

**Tab 4: Approvals & Comments**
- Timeline view of all comments/questions
- Threaded conversations
- AI responses highlighted differently
- Approver status table (Department, Approver, Status, Time Elapsed, SLA)

**Tab 5: Predictions & Insights**
- ML Prediction summary:
  - Approval Likelihood: 78% (bar chart)
  - Predicted Timeline: 4.2 days
  - Predicted Bottlenecks: [Finance: 1.8 days (68% chance)]
  - Recommendations: [Upload ROAE now] [Pre-notify Finance VP]

**Tab 6: Similar NPAs**
- Top 5 similar historical NPAs with:
  - NPA ID, Similarity %, Approval status, Timeline
  - [View Details] [Copy Settings] buttons

---

#### **Right Column: Active Agents Panel** (Your current design)

Shows real-time agent activity:

```
ACTIVE AGENTS:

✅ DocExtractionAgent
   Successfully parsed 1 document
   Mapped 14 fields to NPA Template v2
   Latency: 1.2s | Tokens: 4.5k
   
⚠️ CompletenessCheckAgent  
   MISSING: Risk Memo required for FX Options > $10M
   Auto-Draft Waiver Request
   
⏳ HistoryAgent
   Waiting for Risk Memo...
```

**Expandable:** Click agent name → See full decision log

---

### **LEVEL 4: Checker Review Queue**

**Trigger:** Checker clicks [Review Pending NPAs (3)] from Landing Page

**Layout:** Table view with sortable columns

**Columns:**
| NPA ID | Product | Maker | Submitted | Days Pending | Completeness | Priority | Actions |
|--------|---------|-------|-----------|--------------|--------------|----------|---------|
| TSG2025-882 | FX Option USD/SGD | Vikramaditya | 2 hours ago | 0.1 days | 100% ✅ | Normal | [Review] |
| TSG2025-880 | EUR Swap | Sarah Lim | 1 day ago | 1.2 days | 89% ⚠️ | High | [Review] |
| TSG2025-875 | Credit Default Swap | Mark Lee | 3 days ago | 3.1 days | 100% ✅ | Critical | [Review] |

**Sorting Options:**
- By Days Pending (default, oldest first)
- By Priority (Critical → Normal)
- By Completeness (incomplete first)
- By Notional (largest first)

**Filters:**
- By Product Type
- By Desk
- By Completeness (<80% / 80-95% / >95%)

**Actions:**
- [Review] → Opens detailed NPA view (Level 3)
- [Batch Approve] → Select multiple, approve all (if 100% complete)

**Checker View Enhancements:**
When Checker opens NPA (Level 3), additional options:
- **Pre-Submission Checklist** (auto-generated):
  ```
  ✅ All 13 required documents present
  ✅ All documents validated (no errors)
  ✅ 47/47 template fields completed
  ✅ Cross-border requirements met (Ops + Tech approvals added)
  ✅ Prohibited list check passed
  ⚠️ ROAE sensitivity model: Please verify calculations
  
  Recommendation: APPROVE for Sign-Off
  ```

- **Actions:**
  - [Approve for Sign-Off] (green button)
  - [Reject - Send Back to Maker] (red button, requires reason)
  - [Request Clarification] (yellow button, opens comment thread)

---

### **LEVEL 5: Approver Sign-Off Queue**

**Trigger:** Approver clicks [Your Pending Approvals (5)] from Landing Page

**Layout:** Card view with SLA countdown

**Each Card Shows:**

```
┌─────────────────────────────────────────────┐
│ TSG2025-042 - FX Put Option GBP/USD         │
│ Notional: $75M | Desk: Singapore FX         │
├─────────────────────────────────────────────┤
│ ⏰ SLA: 22 hours remaining (ON TIME)        │
│ 📊 Approval Type: FINANCE                   │
│ 📅 Submitted: Dec 16, 02:00 PM              │
│                                              │
│ Quick Preview:                               │
│ • Product Type: FX Option                   │
│ • Risk Analysis: VaR $540K, ROAE 5.1%      │
│ • Documents: 13/13 complete                 │
│                                              │
│ [View Full NPA] [Approve] [Request Info]   │
└─────────────────────────────────────────────┘
```

**SLA Color Coding:**
- 🟢 >24 hours remaining: Green
- 🟡 12-24 hours remaining: Yellow
- 🔴 <12 hours remaining: Red
- ⚠️ SLA breached: Flashing red

**Sorting:**
- By SLA (most urgent first) - default
- By Notional (largest first)
- By Department (group by Credit, Finance, Legal, etc.)

**Approver View Enhancements:**
When Approver opens NPA (Level 3), additional panel:

**Department-Specific View (e.g., Finance Approver sees):**
```
YOUR REVIEW SCOPE - FINANCE

Key Areas to Review:
✅ ROAE Analysis: 5.1% (base), 4.0%-6.2% (scenarios)
✅ P&L Impact: $2.3M estimated annual revenue
✅ VaR: $540K (within desk limit $2M, 27% of book)
⚠️ Notional $75M: Requires VP approval (threshold >$50M)

Documents for Your Review:
📊 ROAE_Sensitivity_Model.xlsx (validated ✅)
📈 Bloomberg_GBP_USD_Volatility.pdf (current ✅)
📋 Pricing_Methodology.pdf (standard Black-Scholes ✅)

Questions Asked by Others:
💬 Credit (Jane Tan): "Counterparty ABC Corp rated A-, acceptable?"
   └─ Yes, within guidelines (answered by Maker)

Your Decision:
[✅ Approve] [❌ Reject] [💬 Ask Question]

If Approve:
[ ] I have reviewed ROAE calculations
[ ] I confirm P&L estimates reasonable
[ ] I confirm VaR within limits
[ ] I recommend Finance VP approval (required for >$50M)

[Submit Approval]
```

**Smart Features:**
- AI highlights sections relevant to approver's department
- Auto-links to related policies/guidelines
- Shows similar NPAs' approval decisions for reference

---

## Navigation Flow Summary

```
Landing Page (Dashboard)
    │
    ├─→ [Create New NPA] → Conversational Interface (Level 2)
    │                           ↓
    │                      NPA Detail View (Level 3)
    │
    ├─→ [Continue Draft] → NPA Detail View (Level 3)
    │
    ├─→ [Pipeline Card] → NPA Detail View (Level 3)
    │
    ├─→ [Review Pending NPAs] → Checker Queue (Level 4)
    │                               ↓
    │                          NPA Detail View (Level 3)
    │
    └─→ [Your Pending Approvals] → Approver Queue (Level 5)
                                      ↓
                                 NPA Detail View (Level 3)
```

**Key Principle:** NPA Detail View (Level 3) is the hub. All paths converge here.

---

## Responsive Behavior & State Management

### **Left Sidebar - Persistent Navigation**
- Always visible (collapsible on mobile)
- Shows current location: "NPA Agent > Create New NPA > TSG2025-042"
- Quick jump to other functional agents

### **Main Content Area - Contextual**
- Dashboard (Level 1): Full width, 3-column layout
- Chat Interface (Level 2): Full width, chat-focused
- NPA Detail (Level 3): 3-column (Workflow | Content | Agents)

### **Right Panel - Active Agents**
- Shown only when relevant (Level 2, Level 3)
- Collapsible to give more space to main content
- Real-time WebSocket updates (no page refresh)

### **State Persistence**
- User's position saved: If user navigates away and returns, resume where left off
- Draft NPAs auto-saved every 30 seconds
- Form state cached in browser (survive refresh)

---

## Key UX Principles

### **1. Progressive Disclosure**
- Landing page: High-level overview
- Click pipeline card: Medium detail (card preview)
- Click NPA ID: Full detail (all 47 fields, documents, approvals)

Don't overwhelm with everything at once.

### **2. Role-Based Views**
- Maker sees: [Create NPA] [My Drafts] [My Submitted NPAs]
- Checker sees: [Review Queue] [Aging NPAs]
- Approver sees: [Pending Approvals] [SLA Tracker]
- Admin sees: [All NPAs] [KPIs] [Configuration]

Same data, different lenses.

### **3. Real-Time Feedback**
- Active Agents panel updates live (show AI working)
- Dashboard KPIs update every 60 seconds
- Approval status changes push instantly (WebSocket)
- SLA countdown ticks in real-time

Users feel in control, not waiting in dark.

### **4. Contextual Help**
- Inline tooltips (hover "?" icon for explanations)
- AI chat assistant (bottom-right bubble): "Ask me anything about NPAs"
- Contextual tutorials (first-time users get walkthroughs)

### **5. Actionable Insights**
- Don't just show "Aging NPAs" → Show [Send Reminder] [Escalate] actions
- Don't just show "ML Prediction 78%" → Show [Upload ROAE to boost to 85%]
- Don't just show "Finance pending" → Show [Pre-notify Finance VP]

Data + Action = Value.

---

## Implementation Priority (Phased Approach)

### **Phase 1: MVP (Launch Ready)**
✅ Landing Page Dashboard (Sections 1-3)
✅ NPA Detail View (Level 3) - Enhanced
✅ Conversational Interface (Level 2) - Basic
✅ Workflow Timeline (Left column in Level 3)
✅ Active Agents Panel (Right column) - You have this

**Goal:** Users can create NPAs, track progress, see agents working

### **Phase 2: Enhanced Analytics**
📊 NPA Pipeline Kanban (Section 3)
📊 Aging Analysis Table (Section 4)
📊 Top Performers Revenue Cards (Section 5)
📊 KPI Dashboard (Section 6)

**Goal:** Leadership visibility, data-driven decisions

### **Phase 3: Role-Specific Views**
👤 Checker Review Queue (Level 4)
👤 Approver Sign-Off Queue (Level 5)
👤 Department-Specific Views (Finance/Legal/Ops lenses)

**Goal:** Optimize for each user type

### **Phase 4: Advanced Features**
🤖 AI Chat Assistant (context-aware help)
📈 Predictive Alerts (SLA breach warnings)
🔗 Integration with Slack/Teams (notifications)
📱 Mobile-responsive views

**Goal:** Power-user features, mobile access

---

## Data Flow: Landing Page → Database

**When User Opens Landing Page:**

1. **Frontend sends request:** "GET /npa-agent/dashboard"

2. **Backend queries database:**
   - NPA Drawer: Count by status (Draft: 8, Checker: 3, Sign-Off: 7...)
   - Sign-Offs Drawer: My pending approvals (for Approver role)
   - Workflow Drawer: Aging NPAs (>7 days in same stage)
   - NPAs table: Top 5 by notional for revenue ranking
   - Agent Decisions Drawer: ML prediction accuracy stats

3. **Backend returns JSON:**
   ```json
   {
     "user": {
       "name": "Vikramaditya",
       "role": "MAKER",
       "pending_drafts": 2
     },
     "pipeline": {
       "draft": 8,
       "checker_review": 3,
       "sign_off": 7,
       "launch_prep": 2,
       "launched_this_week": 3
     },
     "aging_npas": [
       {"npa_id": "TSG2025-820", "days": 9, "stage": "Sign-Off", ...}
     ],
     "top_performers": [
       {"npa_id": "TSG2025-042", "revenue": 2300000, ...}
     ],
     "kpis": {
       "approval_rate": 0.95,
       "avg_timeline_days": 4.2,
       "loop_back_rate": 0.2,
       "auto_fill_coverage": 0.78
     }
   }
   ```

4. **Frontend renders:** Dashboard with live data

**Real-Time Updates:**
- WebSocket subscription: `dashboard:updates`
- When any NPA status changes → Push update → Dashboard refreshes that section
- No full page reload, just affected cards/numbers update

---

## Success Metrics for UI/UX

### **User Engagement**
- **Time to First NPA:** <5 minutes from login to starting conversational interview
- **Dashboard Bounce Rate:** <10% (users actually click into NPAs, not just look)
- **Repeat Usage:** >80% of Makers create 2+ NPAs within first month

### **Task Completion**
- **NPA Creation Completion Rate:** >90% (users who start, finish)
- **Draft Abandonment Rate:** <15% (drafts saved but never submitted)
- **Checker Review Time:** <30 minutes per NPA (down from 2 hours)

### **Satisfaction**
- **User Satisfaction Score:** >4.5/5.0
- **Net Promoter Score:** >50 (users recommend to colleagues)
- **Support Ticket Reduction:** >60% (less "how do I..." questions)

### **Business Impact**
- **NPA Timeline:** Maintain 4.2 days average (67% reduction sustained)
- **First-Time Approval Rate:** >95% (zero loop-backs)
- **Agent Utilization:** >80% of NPAs use AI auto-fill (not bypassing to manual)

---

## Key Takeaways

### **What User Sees When Clicking "NPA Agent":**

**First Screen = Dashboard (Landing Page)**
- Quick actions (Create NPA, Continue Draft, Review Queue)
- Live pipeline view (23 NPAs in various stages)
- Aging analysis (4 NPAs need attention)
- Top performers (celebrate wins)
- KPIs (95% success rate, 4.2 days timeline)

**Not a Chat Interface Directly** → That's Level 2 (after clicking [Create New NPA])

### **Philosophy:**
**Dashboard = Situation Room**
- See everything at a glance
- Jump to what needs attention
- Celebrate successes
- Data-driven decisions

**Conversational Interface = Guided Creation**
- Only when user chooses to create/edit
- Focused, distraction-free
- AI guides step-by-step

**NPA Detail View = Command Center**
- Deep dive into single NPA
- See all agents working
- Track approvals real-time
- Take actions

---

## Next Steps (Action Plan)

### **Step 1: Wireframe Review (No Code Yet)**
- Sketch out 5 levels on whiteboard/Figma
- Walk through user journey: "Sarah logs in → Creates NPA → Gets approved"
- Validate with 2-3 actual Makers/Checkers

### **Step 2: Database Schema Finalization**
- Ensure all dashboard queries are supported
- Add indexes for performance (pipeline view, aging analysis)
- Define API endpoints needed

### **Step 3: Component Library**
- Build reusable UI components:
  - NPA Card (for pipeline)
  - Metric Card (for KPIs)
  - Timeline Visualization (for workflow stages)
  - Agent Status Card (for Active Agents panel)

### **Step 4: Phased Implementation**
- **Week 1-2:** Landing Page Dashboard (Level 1)
- **Week 3-4:** NPA Detail View Enhanced (Level 3)
- **Week 5-6:** Conversational Interface Polish (Level 2)
- **Week 7-8:** Checker/Approver Queues (Level 4-5)

### **Step 5: User Testing**
- 5 Makers test Create NPA flow
- 3 Checkers test Review Queue
- 2 Approvers test Sign-Off flow
- Iterate based on feedback

### **Step 6: Launch & Monitor**
- Soft launch to Singapore FX Desk (pilot)
- Monitor KPIs daily
- Weekly iteration cycle
- Full rollout after 2 weeks

---

**This approach balances information density with usability. Users aren't overwhelmed, but power users can drill down deep. The dashboard is their command center, and the agents work visibly in the background.** 🚀

