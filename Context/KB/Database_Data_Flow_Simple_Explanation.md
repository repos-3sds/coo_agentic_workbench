# NPA Database Data Flow: Simple Explanation
## Following Sarah's $75M FX Option Journey Through the Database

**No Code, No Syntax - Just the Story of Data**

---

## The Big Picture: What Happens to Data?

Think of the database as a **giant filing cabinet** with different drawers for different types of information. As Sarah creates her NPA and it moves through the system, data gets written into various drawers, and the agents read from these drawers to make decisions.

**The 7 Main Filing Drawers:**

1. **NPA Drawer** - The main NPA record (like a master file folder)
2. **Properties Drawer** - All 47 template fields (individual index cards)
3. **Documents Drawer** - All uploaded files (physical documents)
4. **Sign-Offs Drawer** - Approval status from each department (signature sheets)
5. **Workflow Drawer** - Current status and progress (status board)
6. **Memory Drawer** - Vector embeddings for finding similar NPAs (library catalog)
7. **Audit Drawer** - Every action logged (security camera footage)

---

## Sarah's Journey: Step-by-Step Data Flow

### **Monday, 09:00 AM - Sarah Opens NPA Workbench**

**What Happens:**
1. System checks: "Who is this user?"
2. Looks in **Users Drawer**
3. Finds: Sarah Lim, Singapore FX Desk, Role = Maker

**Data Created:**
```
Users Drawer (already exists):
├─ Name: Sarah Lim
├─ Email: sarah.lim@mbs.com
├─ Department: Singapore FX Desk
├─ Role: MAKER
└─ Can create NPAs: YES
```

**Audit Trail:**
```
Activity Log Drawer (new entry):
├─ Who: Sarah Lim
├─ What: Logged into NPA Workbench
├─ When: Monday 09:00 AM
└─ Where: IP 192.168.1.100
```

---

### **09:02 AM - Sarah Starts Conversation (Question 1)**

**Sarah types:** "It's an FX option on GBP/USD..."

**What Happens:**
1. Product Ideation Agent reads Sarah's answer
2. Extracts: Product Type = FX Option
3. Writes to **NPA Drawer** (creates new main record)

**Data Created:**
```
NPA Drawer (NEW):
├─ NPA ID: TSG2025-042
├─ Product Name: (empty for now)
├─ Product Type: FX_OPTION
├─ Status: DRAFT
├─ Current Stage: PHASE_0_IDEATION
├─ Maker: Sarah Lim
├─ Created: Monday 09:02 AM
└─ Source NPA: (empty - will be TSG1917 later)
```

**Workflow Drawer (NEW):**
```
├─ NPA: TSG2025-042
├─ Current Phase: PHASE_0_IDEATION
├─ Current Step: Question 1 of 10
├─ Progress: 10%
└─ Next Action: Continue interview
```

---

### **09:04 AM - Sarah Reveals Notional: $75M**

**What Happens:**
1. Product Ideation Agent detects: >$20M threshold
2. Writes to **Properties Drawer** (first field stored)
3. Updates **NPA Drawer** with notional

**Data Created:**
```
NPA Drawer (UPDATED):
├─ Notional Currency: USD
├─ Notional Amount: 75,000,000
└─ (Everything else stays the same)

Properties Drawer (NEW):
Entry 1:
├─ NPA: TSG2025-042
├─ Field Name: "notional_amount"
├─ Field Value: "75000000"
├─ Field Type: NUMBER
├─ Auto-Filled: NO (Sarah typed it)
├─ Status: GREEN (valid)
└─ Category: 1 (Product Specs)
```

**Agent Decision Drawer (NEW):**
```
ML Prediction Agent Decision:
├─ NPA: TSG2025-042
├─ Decision Type: THRESHOLD_DETECTION
├─ Input: Notional = $75M
├─ Output: ROAE required, Finance VP required
├─ Reasoning: "Notional >$20M triggers ROAE per policy"
└─ Timestamp: Monday 09:04 AM
```

---

### **09:07 AM - Cross-Border Detected**

**Sarah says:** "Singapore desk, counterparty in Hong Kong"

**What Happens:**
1. Product Ideation Agent detects: Different jurisdictions
2. Updates **NPA Drawer**: Cross-border flag = TRUE
3. Classification Router Agent determines: Need 5 mandatory sign-offs

**Data Updated:**
```
NPA Drawer (UPDATED):
├─ Is Cross-Border: YES
├─ Booking Entities: ["MBS Singapore", "MBS Hong Kong"]
└─ Location: Singapore

Agent Decision Drawer (NEW ENTRY):
Classification Router Decision:
├─ NPA: TSG2025-042
├─ Decision: Cross-border = MANDATORY 5 sign-offs
├─ Departments Added: Operations, Technology
├─ Reasoning: "Singapore→Hong Kong requires Ops/Tech approval"
└─ Confidence: 99%
```

---

### **09:12 AM - KB Search Finds TSG1917**

**What Happens:**
1. KB Search Agent looks in **Memory Drawer** (vector embeddings)
2. Finds: TSG1917 is 94% similar
3. Writes similarity link to **NPA Drawer**

**Memory Drawer (SEARCH):**
```
Vector Embeddings (read from):
├─ TSG1917: [0.123, -0.456, 0.789, ...] → 94% match
├─ TSG1823: [0.098, -0.521, 0.654, ...] → 88% match
└─ TSG2044: [0.145, -0.389, 0.712, ...] → 82% match

Agent returns: "TSG1917 is best match"
```

**NPA Drawer (UPDATED):**
```
├─ Source NPA: TSG1917
├─ Similarity Score: 94%
└─ (This links Sarah's NPA to TSG1917 for auto-fill)
```

---

### **09:15 AM - ML Prediction Runs**

**What Happens:**
1. ML Prediction Agent reads data from **NPA Drawer** and **Memory Drawer**
2. Calculates: 78% approval likelihood, 4.2 days timeline
3. Writes predictions back to **NPA Drawer**

**Data Read (Agent looks at):**
```
NPA Drawer:
├─ Product Type: FX_OPTION
├─ Notional: $75M
├─ Cross-Border: YES
├─ Similarity to TSG1917: 94%
└─ Counterparty Rating: (not filled yet)

Memory Drawer (historical data):
├─ TSG1917: Approved in 3 days, zero loop-backs
├─ FX Option approval rate: 87%
└─ Q4 Legal delays: +0.5 days average
```

**Data Written (Agent's prediction):**
```
NPA Drawer (UPDATED):
├─ Predicted Approval Likelihood: 78%
├─ Predicted Timeline: 4.2 days
├─ Predicted Bottleneck: Finance (1.8 days)
├─ Prediction Confidence: 92%
└─ Prediction Timestamp: Monday 09:15 AM

Agent Decision Drawer (NEW):
├─ Agent: ML Prediction Sub-Agent
├─ Input: Product type, notional, cross-border, similarity
├─ Output: 78% approval, 4.2 days
├─ Reasoning: "Strong precedent (TSG1917) +25%, Large notional -12%"
└─ Bottleneck Factors: [Finance ROAE: 68% chance, 2.5 days]
```

---

### **09:20 AM - Template Auto-Fill Runs**

**What Happens:**
1. Template Auto-Fill Agent reads TSG1917 from **Properties Drawer**
2. Copies/adapts 37 fields
3. Writes to **Properties Drawer** with auto-fill metadata

**Data Read (from TSG1917):**
```
Properties Drawer (TSG1917):
Entry 205:
├─ Field: "booking_system"
├─ Value: "Murex"
├─ Category: 2 (Operational Info)

Entry 206:
├─ Field: "settlement_method"
├─ Value: "Cash-settled, T+2"

Entry 207:
├─ Field: "var_amount"
├─ Value: "180000" (for $25M notional)
```

**Data Written (to TSG2025-042):**
```
Properties Drawer (NEW ENTRIES):

Entry 1:
├─ NPA: TSG2025-042
├─ Field: "booking_system"
├─ Value: "Murex"
├─ Auto-Filled: YES
├─ Auto-Fill Source: DIRECT_COPY (from TSG1917)
├─ Status: GREEN
└─ Confidence: 95%

Entry 2:
├─ NPA: TSG2025-042
├─ Field: "settlement_method"
├─ Value: "Cash-settled, T+2"
├─ Auto-Filled: YES
├─ Auto-Fill Source: DIRECT_COPY
├─ Status: GREEN
└─ Confidence: 95%

Entry 3:
├─ NPA: TSG2025-042
├─ Field: "var_amount"
├─ Value: "540000" (scaled 3x from $25M to $75M)
├─ Auto-Filled: YES
├─ Auto-Fill Source: INTELLIGENT_ADAPT
├─ Status: YELLOW (please verify)
└─ Confidence: 88%

... (34 more fields auto-filled)
```

---

### **09:25 AM - Sarah Uploads Documents**

**Sarah uploads:** Term_Sheet.pdf, S&P_Credit_Report.pdf, ROAE_Model.xlsx

**What Happens for EACH document:**
1. File saved to **cloud storage** (like Google Drive)
2. Metadata written to **Documents Drawer**
3. Text extracted and saved
4. Document validation recorded

**File Storage (Cloud):**
```
Supabase Storage Bucket: "npa-documents"
├─ npas/
│   ├─ 2025/
│   │   ├─ TSG2025-042/
│   │   │   ├─ term_sheet.pdf (450 KB)
│   │   │   ├─ credit_report.pdf (2.1 MB)
│   │   │   └─ roae_model.xlsx (125 KB)
```

**Documents Drawer (NEW ENTRIES):**
```
Entry 1:
├─ NPA: TSG2025-042
├─ Document Name: "Term_Sheet.pdf"
├─ Document Type: TERM_SHEET
├─ File Path: "npas/2025/TSG2025-042/term_sheet.pdf"
├─ File Size: 450 KB
├─ Category: 1 (Product Specs)
├─ Uploaded By: Sarah Lim
├─ Uploaded At: Monday 09:25 AM
├─ Validation Status: VALID
└─ Extracted Text: "FX Put Option, GBP/USD, Notional $75M..."

Entry 2:
├─ Document Name: "S&P_Credit_Report.pdf"
├─ Document Type: CREDIT_REPORT
├─ Category: 4 (Risk Analysis)
├─ Extracted Date: December 1, 2025 (15 days old ✅)
├─ Validation Status: VALID
└─ Warnings: None

Entry 3:
├─ Document Name: "ROAE_Model.xlsx"
├─ Document Type: ROAE_MODEL
├─ Category: 4 (Risk Analysis)
├─ Validation Status: VALID
├─ Auto-Fill Contribution: YES
└─ Fields Extracted: ["roae_base": "5.1%", "roae_scenarios": {...}]
```

**Document Validation Drawer (NEW):**
```
Validation 1:
├─ Document: Term_Sheet.pdf
├─ Check: FORMAT_CHECK
├─ Result: PASS
├─ Details: "PDF readable, 3 pages"

Validation 2:
├─ Document: S&P_Credit_Report.pdf
├─ Check: DATE_CHECK
├─ Result: PASS
├─ Details: "Report dated Dec 1, 2025 (15 days old, <90 days ✅)"

Validation 3:
├─ Document: ROAE_Model.xlsx
├─ Check: CONTENT_VALIDATION
├─ Result: PASS
├─ Details: "ROAE 5.1% matches NPA field ✅"
```

---

### **09:42 AM - Sarah Submits NPA**

**What Happens:**
1. System checks completeness (100%)
2. Updates **Workflow Drawer**: PHASE_1_DRAFT → PHASE_2_CHECKER
3. Creates notification for Checker
4. Logs submission to **Audit Drawer**

**NPA Drawer (UPDATED):**
```
├─ Status: CHECKER_REVIEW
├─ Current Stage: PHASE_2_CHECKER
├─ Submitted At: Monday 09:42 AM
└─ (All other data stays the same)
```

**Workflow Drawer (UPDATED):**
```
├─ Current Phase: PHASE_2_CHECKER
├─ Progress: 100% (for Maker's part)
├─ Next Action: "Awaiting Checker review"
├─ Next Action Owner: CHECKER (Emily Tan)
└─ Phase Started: Monday 09:42 AM
```

**Workflow Transition History (NEW):**
```
Transition 1:
├─ NPA: TSG2025-042
├─ From: PHASE_1_DRAFT
├─ To: PHASE_2_CHECKER
├─ Trigger: Sarah clicked "Submit"
├─ Successful: YES
└─ Time: Monday 09:42 AM
```

**Notifications Drawer (NEW):**
```
Notification 1:
├─ Recipient: Emily Tan (Checker)
├─ Type: CHECKER_REVIEW_NEEDED
├─ Title: "New NPA Submitted: TSG2025-042"
├─ Message: "Sarah Lim submitted FX Option NPA for review"
├─ Delivery: [EMAIL, IN_APP]
├─ Priority: NORMAL
├─ Link: "/npas/TSG2025-042"
└─ Created: Monday 09:42 AM
```

**Audit Drawer (NEW):**
```
Activity 5:
├─ User: Sarah Lim
├─ Action: NPA_SUBMITTED
├─ NPA: TSG2025-042
├─ Details: "Completeness 100%, Documents 13/13"
├─ Timestamp: Monday 09:42 AM
└─ IP Address: 192.168.1.100
```

---

### **Monday 02:00 PM - Checker Approves**

**Emily Tan (Checker) clicks "Approve for Sign-Off"**

**What Happens:**
1. System creates 6 sign-off records in **Sign-Offs Drawer**
2. Updates **Workflow Drawer**: PHASE_2_CHECKER → PHASE_3_SIGNOFF
3. Creates 6 notifications (one for each approver)
4. Logs Checker approval to **Audit Drawer**

**NPA Drawer (UPDATED):**
```
├─ Status: SIGN_OFF
├─ Current Stage: PHASE_3_SIGNOFF
├─ Checker: Emily Tan
├─ Checker Reviewed At: Monday 02:00 PM
└─ (Everything else same)
```

**Sign-Offs Drawer (NEW - 6 ENTRIES):**
```
Sign-Off 1:
├─ NPA: TSG2025-042
├─ Department: CREDIT
├─ Approver: Jane Tan
├─ Status: PENDING
├─ Notified At: Monday 02:00 PM
├─ SLA Deadline: Wednesday 02:00 PM (48 hours)
├─ Processing Mode: PARALLEL
└─ Hours Elapsed: 0

Sign-Off 2:
├─ Department: FINANCE
├─ Approver: Mark Lee
├─ Status: PENDING
├─ Notified At: Monday 02:00 PM
├─ SLA Deadline: Wednesday 02:00 PM
├─ Processing Mode: PARALLEL
└─ Hours Elapsed: 0

Sign-Off 3:
├─ Department: MLR
├─ Approver: Sarah Chen
├─ Status: PENDING
├─ (same pattern)

Sign-Off 4:
├─ Department: OPERATIONS
├─ Approver: David Lim
├─ Status: PENDING

Sign-Off 5:
├─ Department: TECHNOLOGY
├─ Approver: Emily Wong
├─ Status: PENDING

Sign-Off 6:
├─ Department: FINANCE_VP
├─ Approver: Jane Tan
├─ Status: PENDING (but not notified yet - waits for Finance)
├─ Notified At: NULL
├─ Processing Mode: SEQUENTIAL (depends on Finance)
└─ Depends On: FINANCE
```

**Notifications Drawer (6 NEW notifications):**
```
Notification for Credit:
├─ Recipient: Jane Tan
├─ Type: APPROVAL_REQUEST
├─ Title: "NPA Approval Needed: TSG2025-042"
├─ Message: "FX Option $75M requires your Credit approval"
├─ Priority: NORMAL
├─ SLA: 48 hours
└─ Created: Monday 02:00 PM

(Same for Finance, MLR, Ops, Tech)
(Finance VP notification NOT created yet - sequential)
```

---

### **Monday 05:30 PM - First Approval (Operations)**

**David Lim (Operations) clicks "Approve"**

**What Happens:**
1. Updates **Sign-Offs Drawer**: Operations status → APPROVED
2. Dashboard reads **Sign-Offs Drawer** to show real-time progress
3. Logs approval to **Audit Drawer**

**Sign-Offs Drawer (UPDATED):**
```
Sign-Off 4 (Operations):
├─ Status: PENDING → APPROVED ✅
├─ Decision: APPROVE
├─ Decision At: Monday 05:30 PM
├─ Comments: "Cross-border settlement standard, no issues"
├─ Hours Elapsed: 3.5 hours
└─ SLA Status: ON TIME (44.5 hours remaining)
```

**Dashboard Query (Real-Time):**
```
System reads Sign-Offs Drawer for TSG2025-042:
├─ Total Sign-Offs: 6
├─ Approved: 1 (Operations)
├─ Pending: 4 (Credit, Finance, MLR, Tech)
├─ Not Started: 1 (Finance VP - sequential)
└─ Progress: 17% (1 of 6)
```

**Sarah's Dashboard Shows:**
```
NPA TSG2025-042 - Live Status:
├─ ✅ Operations: APPROVED (3.5 hours)
├─ ⏳ Credit: Under Review (3.5 hours elapsed, 44.5 remaining)
├─ ⏳ Finance: Under Review (3.5 hours elapsed)
├─ ⏳ MLR: Under Review (3.5 hours elapsed)
├─ ⏳ Technology: Under Review (3.5 hours elapsed)
└─ 🔒 Finance VP: LOCKED (waiting for Finance)
```

---

### **Tuesday 02:30 PM - Finance Asks Question**

**Mark Lee (Finance) posts comment:** "Can you clarify VaR calculation?"

**What Happens:**
1. Writes comment to **Comments Drawer**
2. Approval Orchestration Agent reads comment
3. Agent checks: Can AI answer without Maker?
4. Agent finds answer in **Documents Drawer** (Bloomberg screenshot)
5. Agent writes response to **Comments Drawer**
6. NO update to **Sign-Offs Drawer** yet (still PENDING)

**Comments Drawer (NEW):**
```
Comment 1:
├─ NPA: TSG2025-042
├─ Author: Mark Lee (Finance)
├─ Comment Type: APPROVER_QUESTION
├─ Text: "Can you clarify VaR calculation methodology?"
├─ Created: Tuesday 02:30 PM
└─ Thread ID: THREAD-001

Comment 2 (AI Response):
├─ NPA: TSG2025-042
├─ Author: Conversational Diligence Agent
├─ Comment Type: AGENT_RESPONSE
├─ Text: "VaR uses 9.2% volatility from Bloomberg..."
├─ Generated By AI: YES
├─ Confidence: 95%
├─ Parent Comment: Comment 1
├─ Thread ID: THREAD-001
└─ Created: Tuesday 02:32 PM (2 minutes later)
```

**Agent Decision Drawer (NEW):**
```
Smart Routing Decision:
├─ NPA: TSG2025-042
├─ Question: "VaR methodology clarification"
├─ Question Type: CLARIFICATION
├─ Answerable from NPA: YES (Bloomberg screenshot exists)
├─ Routing Decision: AI_HANDLE (no Maker loop-back)
├─ Document Used: Bloomberg_Screenshots.pdf
├─ Time Saved: 2-3 days (avoided loop-back)
└─ Timestamp: Tuesday 02:30 PM
```

---

### **Tuesday 04:00 PM - Finance Approves**

**Mark Lee clicks "Approve" after reading AI's answer**

**What Happens:**
1. Updates **Sign-Offs Drawer**: Finance → APPROVED
2. Unlocks Finance VP (sequential gate)
3. Creates notification for Finance VP
4. Logs approval

**Sign-Offs Drawer (UPDATED):**
```
Sign-Off 2 (Finance):
├─ Status: APPROVED ✅
├─ Decision At: Tuesday 04:00 PM
├─ Comments: "ROAE acceptable, VaR methodology confirmed"
├─ Hours Elapsed: 26 hours
├─ SLA Status: ON TIME (22 hours remaining)
└─ Clarification: Asked & Answered by AI

Sign-Off 6 (Finance VP):
├─ Status: PENDING (still waiting, but now notified)
├─ Notified At: Tuesday 04:00 PM ✅ (just unlocked)
├─ SLA Deadline: Wednesday 04:00 PM (24 hours - expedited)
├─ Processing Mode: SEQUENTIAL
└─ Depends On: FINANCE (now satisfied ✅)
```

**Notifications Drawer (NEW):**
```
Notification for Finance VP:
├─ Recipient: Jane Tan
├─ Type: APPROVAL_REQUEST
├─ Title: "VP Approval Needed: TSG2025-042"
├─ Message: "Finance approved, VP sign-off now required"
├─ Priority: HIGH (notional >$50M)
├─ SLA: 24 hours (expedited)
└─ Created: Tuesday 04:00 PM
```

---

### **Tuesday 05:00 PM - All Approvals Complete**

**Jane Tan (Finance VP) clicks "Approve"**

**What Happens:**
1. Updates **Sign-Offs Drawer**: Finance VP → APPROVED
2. Checks: All 6 sign-offs complete?
3. Updates **NPA Drawer**: Status → APPROVED
4. Updates **Workflow Drawer**: PHASE_3_SIGNOFF → PHASE_4_LAUNCH
5. Calculates actual timeline (1.1 days)
6. Creates notification for Sarah

**Sign-Offs Drawer (FINAL STATE):**
```
All 6 Sign-Offs:
├─ ✅ CREDIT: Approved (Jane Tan, 20.5 hours)
├─ ✅ FINANCE: Approved (Mark Lee, 26 hours)
├─ ✅ FINANCE_VP: Approved (Jane Tan, 1 hour)
├─ ✅ MLR: Approved (Sarah Chen, 20 hours)
├─ ✅ OPERATIONS: Approved (David Lim, 3.5 hours)
└─ ✅ TECHNOLOGY: Approved (Emily Wong, 19.2 hours)

All Complete: YES
Average Time: 15 hours per approver
Longest: Finance (26 hours)
Shortest: Operations (3.5 hours)
```

**NPA Drawer (UPDATED):**
```
├─ Status: APPROVED ✅
├─ Current Stage: PHASE_4_LAUNCH
├─ All Sign-Offs Completed: Tuesday 05:00 PM
├─ Approved At: Tuesday 05:00 PM
├─ Actual Timeline: 1.1 days (Submitted Mon 09:42, Approved Tue 17:00)
├─ Loop-Back Count: 0 (zero loop-backs!)
├─ Predicted Timeline: 4.2 days
├─ Timeline Beat Prediction By: 3.1 days (74% faster!)
└─ Expires At: December 17, 2026 (1 year validity)
```

**ML Model Learning (FEEDBACK LOOP):**
```
Agent Decision Drawer (OUTCOME UPDATE):
├─ Original Prediction (Dec 16, 09:15 AM):
│   ├─ Approval Likelihood: 78%
│   └─ Timeline: 4.2 days
│
├─ Actual Outcome (Dec 17, 05:00 PM):
│   ├─ Approved: YES (prediction correct ✅)
│   └─ Timeline: 1.1 days (prediction off by 3.1 days)
│
├─ Learning:
│   ├─ ROAE pre-population saved 2.5 days ✅
│   ├─ Finance VP heads-up saved 0.3 days ✅
│   ├─ AI smart routing saved 2 days ✅
│   └─ Total proactive savings: 4.8 days
│
└─ Model Retraining:
    ├─ Feature: "ROAE pre-populated" → Increase weight
    ├─ Feature: "Proactive VP email" → Increase weight
    └─ Next prediction will be more accurate
```

---

## Summary: Where Does Data Live?

### **Main NPA Record**
**Location:** NPA Drawer
**Contains:** Overall status, classification, approval track, predictions, timeline
**Updated:** Throughout journey (created → draft → submitted → approved)

### **47 Template Fields**
**Location:** Properties Drawer
**Contains:** Individual field values with auto-fill metadata
**Updated:** During template auto-fill (09:20 AM), Sarah's edits (09:20-09:40 AM)

### **Documents (13 files)**
**Location:** Documents Drawer (metadata) + Cloud Storage (files)
**Contains:** Validation status, extracted text, category
**Updated:** As Sarah uploads (09:25-09:35 AM)

### **Sign-Offs (6 approvers)**
**Location:** Sign-Offs Drawer
**Contains:** Each approver's status, timeline, SLA, comments
**Updated:** Real-time as approvers review (Mon 02:00 PM - Tue 05:00 PM)

### **Workflow State**
**Location:** Workflow Drawer
**Contains:** Current phase, progress %, next action
**Updated:** At each phase transition (Draft → Checker → Sign-Off → Launch)

### **Similar NPAs (for search)**
**Location:** Memory Drawer (vector embeddings)
**Contains:** Mathematical representation of NPAs for similarity matching
**Updated:** When KB Search runs (09:12 AM)

### **Audit Trail (immutable)**
**Location:** Audit Drawer
**Contains:** Every action, every decision, every access
**Updated:** Continuously, cannot be deleted (7-year retention)

---

## Real-Time Dashboard: How It Works

**Sarah Opens Dashboard:**

1. **Browser sends request:** "Show me TSG2025-042 status"

2. **Database looks in Sign-Offs Drawer:**
   - Reads all 6 sign-off records
   - Calculates hours elapsed for each
   - Calculates SLA remaining for each

3. **Database returns:**
   ```
   Credit: APPROVED (20.5 hrs)
   Finance: APPROVED (26 hrs)
   Finance VP: APPROVED (1 hr)
   MLR: APPROVED (20 hrs)
   Operations: APPROVED (3.5 hrs)
   Technology: APPROVED (19.2 hrs)
   
   Overall: 100% complete
   ```

4. **Browser displays live dashboard**

**When Finance Approves (Tuesday 04:00 PM):**

1. **Mark clicks "Approve"**
2. **Database writes:** Sign-Offs Drawer, Finance → APPROVED
3. **Realtime subscription fires:** "HEY! Finance status changed!"
4. **Sarah's browser instantly updates:** Shows Finance checkmark ✅
5. **No page refresh needed** - Updates in <100ms

---

## Key Insights: Data Flow Principles

### **1. Single Source of Truth**

Each piece of data has ONE home:
- **NPA status?** → NPA Drawer
- **Sign-off status?** → Sign-Offs Drawer
- **Documents?** → Documents Drawer
- **User info?** → Users Drawer

No duplicate data, no confusion.

---

### **2. Linked by Relationships**

Data is connected like family tree:
```
NPA (parent)
├── Properties (children - 47 fields)
├── Documents (children - 13 files)
├── Sign-Offs (children - 6 approvers)
└── Comments (children - questions/answers)
```

Delete NPA → All children automatically deleted (cascade)

---

### **3. Read vs Write**

**Agents READ data to make decisions:**
- ML Prediction reads: Product type, notional, cross-border
- KB Search reads: Vector embeddings
- Classification Router reads: Product description, precedents

**Agents WRITE their decisions:**
- Classification: "EXISTING (Variation), 88% confidence"
- ML Prediction: "78% approval, 4.2 days"
- Template Auto-Fill: 37 fields → Properties Drawer

---

### **4. Immutable Audit Trail**

**Activity Log = Security Camera:**
- Records EVERYTHING
- Cannot be edited or deleted
- Linked like blockchain (each row points to previous)
- 7-year retention for regulators

Example:
```
09:02 AM: Sarah created NPA
09:25 AM: Sarah uploaded Term Sheet
09:42 AM: Sarah submitted NPA
02:00 PM: Emily approved for sign-off
05:30 PM: David approved (Operations)
04:00 PM: Mark approved (Finance)
05:00 PM: Jane approved (Finance VP)
```

Full audit trail from start to finish.

---

### **5. Real-Time Updates**

**How Sarah sees live updates:**

1. **Browser subscribes:** "Tell me when Sign-Offs change"
2. **Database watches:** Sign-Offs Drawer for TSG2025-042
3. **When change happens:** Database pushes update instantly
4. **Sarah's screen updates:** No refresh needed

Like watching live sports scores update automatically.

---

## The Filing Cabinet Analogy

Imagine a physical office:

**NPA Drawer** = Main file folder on desk  
**Properties Drawer** = Index card box (47 cards, one per field)  
**Documents Drawer** = File cabinet with hanging folders  
**Sign-Offs Drawer** = Signature sheet circulating between 6 desks  
**Workflow Drawer** = Status board on wall  
**Memory Drawer** = Library catalog system  
**Audit Drawer** = Security camera footage (cannot erase)

When Sarah creates NPA:
1. Open new main folder
2. Write on 47 index cards
3. Add documents to hanging folders
4. Pass signature sheet to 6 people
5. Update status board
6. Security camera records everything

When agents need info:
1. Open main folder (read NPA Drawer)
2. Look at index cards (read Properties Drawer)
3. Check signature sheet (read Sign-Offs Drawer)
4. Search library catalog (vector search)

When approvers sign-off:
1. Sign signature sheet
2. Return to circulation
3. Status board auto-updates
4. Security camera logs signature

**Simple, organized, traceable.**

---

## Final Picture: Complete Data Journey

```
Sarah's Input (09:00-09:42 AM):
├─ Conversation answers → NPA Drawer
├─ 47 field values → Properties Drawer
└─ 13 document uploads → Documents Drawer + Cloud Storage

Agent Processing (09:02-09:40 AM):
├─ Classification decisions → NPA Drawer + Agent Decisions
├─ ML predictions → NPA Drawer + Agent Decisions
├─ Template auto-fill → Properties Drawer (37 fields)
├─ KB search → Memory Drawer lookup, NPA Drawer update
└─ Document validation → Documents Drawer + Validations Drawer

Checker Review (02:00 PM):
├─ Approval → NPA Drawer (status update)
└─ Create 6 sign-offs → Sign-Offs Drawer

Approvers (02:00 PM - 05:00 PM):
├─ 6 parallel reviews → Sign-Offs Drawer (real-time updates)
├─ Comments/questions → Comments Drawer
├─ AI responses → Comments Drawer
└─ Final approvals → Sign-Offs Drawer (status → APPROVED)

Outcome (05:00 PM):
├─ NPA status → APPROVED
├─ Timeline → 1.1 days (vs 12 days before)
├─ Loop-backs → 0 (vs 1.4 average)
└─ ML model learns → Improves future predictions

Audit Trail (continuous):
└─ Every action logged → Audit Drawer (immutable, 7-year retention)
```

**That's the complete data flow - from Sarah's first keystroke to final approval, all tracked in the database!** 🎉

