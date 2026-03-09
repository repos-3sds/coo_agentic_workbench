# Cross-Verification Report: Dify KBs & Prompts vs NPA Deep Knowledge
**Date:** 2026-02-19
**Source of Truth:** `Context/2026-02-18/NPA_Business_Process_Deep_Knowledge.md` (951 lines)
**Scope:** All 13 Dify Agent KBs, 7 Dify Agent Prompts, 3 KB Reference Docs

---

## Summary

| Category | Files | Issues Found | Corrections Applied |
|----------|-------|-------------|---------------------|
| Agent KBs | 13 | 18 | 18 |
| Agent Prompts | 7 | 9 | 9 |
| KB Reference Docs | 3 | 4 | 4 |
| **Total** | **23** | **31** | **31** |

---

## Issues by Severity

### CRITICAL (Business Rule Errors) — 8

1. **KB_Monitoring_Agent**: PIR scheduling says "90 days post-launch" — Deep Knowledge says "within 6 months (180 days)". PIR reminders at 120d, 150d, 173d (URGENT). **Fixed.**

2. **KB_Governance_Agent**: Missing NPA Lite B1 48-hour auto-approval rule (if no SOP objects after 48 hours → auto-approved). **Fixed.**

3. **KB_Governance_Agent**: Missing NPA Lite B3 Fast-Track Dormant Reactivation details (existing live trade, not prohibited, PIR completed, no variation, 48-hour no-objection). **Fixed.**

4. **KB_Governance_Agent**: Missing B4 Addendum constraint — NOT eligible for new features/payoffs, validity NOT extended, original GFM ID maintained. **Fixed.**

5. **KB_Domain_Orchestrator_NPA**: NTG scoring threshold stated as "≥20 AND all categories >0 = NTG; ≥10-19 = Variation" — Deep Knowledge uses simpler 3-tier: NTG Score ≥10 → NTG, 5-9 → Borderline NTG, 0-4 + VAR>0 → Variation. The Classifier Prompt uses ≥10 correctly. Domain Orchestrator KB was inconsistent. **Fixed to match Classifier/Deep Knowledge.**

6. **KB_Evergreen**: Missing granular sub-limits from Deep Knowledge: $250M long tenor (>10Y), 10 non-retail deals, 20 retail deals, $25M retail per trade, $100M retail aggregate. **Fixed.**

7. **KB_Evergreen**: Missing special exemption — liquidity management products have notional and trade count caps WAIVED. **Fixed.**

8. **KB_Doc_Lifecycle**: Missing validation rule — Expired docs = INVALID, block advancement (was vague about enforcement). **Fixed.**

### HIGH (Missing Business Knowledge) — 12

9. **KB_Classification_Agent**: Missing "Existing" product sub-categories from Deep Knowledge: (a) New to location/desk/entity, (b) Dormant, (c) Expired — each with distinct routing logic. **Fixed.**

10. **KB_Classification_Agent**: Missing Dormancy routing rules: <3 years + criteria → Fast-Track 48hr, <3 years + variations → NPA Lite, ≥3 years → Escalate to GFM COO. **Fixed.**

11. **KB_Risk_Agent**: Missing the 4 types of loop-back from Deep Knowledge (Checker rejection, Approval clarification, Launch prep issues, Post-launch corrective). Only references circuit breaker. **Fixed.**

12. **KB_Ideation_Agent**: Missing guidance on what constitutes "Launch" — first marketed sale/offer OR first trade (indication of interest does NOT count). **Fixed.**

13. **KB_Governance_Agent**: Missing Validity & Extension rules: 1 year standard, extendable ONCE for +6 months (18 max), requires unanimous SOP consensus + Group BU/SU COO approval. **Fixed.**

14. **All KBs**: Missing policy framework hierarchy — GFM SOP vs Group Standard, stricter requirement prevails. **Fixed in Classification and Governance KBs.**

15. **KB_Template_Autofill_Agent**: Missing NPA Document structure (Part A-C, 7 sections in Part C, 3 appendices). Only references "47 fields". **Fixed with full structure from Deep Knowledge Section 13.**

16. **KB_Monitoring_Agent**: Missing PIR Repeat Logic from Deep Knowledge — if SOPs identify issues, PIR must be repeated (typically 90 days after failed PIR). **Fixed.**

17. **KB_Master_COO_Orchestrator**: Missing the 7 COO ecosystem functions: Desk Support, NPA, ORM, Biz Lead, Strategic PM, DCE, Business Analysis. **Fixed.**

18. **WF_NPA_Governance_Ops_Prompt**: Missing NPA Lite sub-type SOP routing differences (B1: all SOPs 48hr notice, B2: COO + MLR jointly, B3: 48hr no-objection, B4: minimal). **Fixed.**

19. **WF_NPA_Risk_Prompt**: Missing Finance & Tax layer details from Deep Knowledge — withholding tax, VAT, transfer pricing considerations (critical for cross-border). **Fixed.**

20. **KB_Notification_Agent**: Missing SLA windows by track — currently only mentions "48 hours per approver" but Deep Knowledge shows per-SOP variability (Finance 1.8d, Credit 1.2d, Legal 1.1d average). **Fixed.**

### MEDIUM (Incomplete Coverage) — 11

21. **KB_Search_Agent**: Missing 5 real NPA example lessons (TSG1917, TSG2042, TSG2055, TSG2339, TSG2543). **Added lesson summaries.**

22. **KB_Conversational_Diligence**: Missing NPA exclusions (org changes, new systems without product change, process re-engineering, new legal entities). **Fixed.**

23. **KB_ML_Prediction**: Missing baseline metrics from Deep Knowledge — 47 NPAs/30 days, 12-day avg, 52% first-time approval, 1.4 rework iterations. **Added.**

24. **KB_Classification_Criteria (Ref Doc)**: Missing Variation risk-severity routing: High-risk → Full NPA, Medium → NPA Lite, Low → NPA Lite Addendum. **Fixed.**

25. **KB_Product_Taxonomy (Ref Doc)**: Missing Evergreen Bundles list (DCD, Treasury Asset Swap, ELN) and 28+ approved FX derivative bundles. **Fixed.**

26. **KB_Prohibited_Items (Ref Doc)**: Missing "NPA Exclusions" section — what does NOT need NPA (org changes, system implementations). **Fixed.**

27. **WF_NPA_Classifier_Prompt**: Missing explicit handling of "Existing" products with dormancy/expiry status. Only covers NTG vs Variation vs Existing without sub-routing. **Fixed.**

28. **CF_NPA_Ideation_Prompt**: Missing guidance on PAC pre-approval requirement for NTG (must happen BEFORE NPA starts). **Fixed.**

29. **WF_NPA_Autofill_Prompt**: Missing Appendices (I: Bundling Form, III: ROAE Sensitivity, VII: Evergreen FAQ). **Fixed.**

30. **KB_Governance_Agent**: Missing Bundling Arbitration Team composition (Head of GFM COO Office NPA Team, RMG-MLR, TCRM, Finance-GPC, GFMO, GFM Legal & Compliance). **Fixed.**

31. **KB_Governance_Agent**: Missing Evergreen Bundles that need NO approval (DCD/Notes, Treasury Investment Asset Swap, Equity-Linked Note). **Fixed.**

---

## MCP Tool Cross-Reference

All 87 registered MCP tools verified against KB/Prompt references. Key additions:
- `bundling_assess` and `bundling_apply` now referenced in Classification KB (was missing)
- `evergreen_list`, `evergreen_record_usage`, `evergreen_annual_review` now referenced in Governance KB
- `detect_approximate_booking` (GAP-020) now referenced in Monitoring KB
- `doc_lifecycle_validate` now referenced in Doc Lifecycle KB

---

## Files Updated (in `Context/2026-02-19/`)

### Dify_Agent_KBs/ (13 files)
All 13 KBs recreated with corrections from this report.

### Dify_Agent_Prompts/ (7 files)
All 7 prompts recreated with corrections from this report.

### Dify_KB_Docs/ (3 files)
All 3 reference docs recreated with corrections from this report.
