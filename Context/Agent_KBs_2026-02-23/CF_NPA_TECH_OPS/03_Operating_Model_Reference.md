# Operating Model Reference (POC)
**Agent:** CF_NPA_TECH_OPS  
**Suggested Dify dataset:** `COO Command Center — Tech/Ops (Operating Model)`  
**Last updated:** 2026-02-23

## Purpose
Give the agent a role-based operating model to write clear ownership in NPAs.

---

## 1) Key roles (minimum)
- **Business owner**: product desk / sponsor
- **System owner**: tech team accountable for change and run
- **Operations owner**: settlements, reconciliations, breaks management
- **Compliance owner**: AML/sanctions workflow and approvals
- **Finance owner**: valuation, accounting, P&L controls

---

## 2) RACI (example)
| Activity | Business | Tech | Ops | LCS | Finance | RMG |
|---|---|---|---|---|---|---|
| Define product scope | A | C | C | C | C | C |
| Implement booking change | C | A | C | C | C | C |
| Reconciliation setup | C | C | A | C | C | C |
| Sanctions screening hook | C | C | C | A | C | C |
| Valuation controls | C | C | C | C | A | C |
| Stress/capital assessment | C | C | C | C | C | A |

Legend: A=Accountable, R=Responsible, C=Consulted.

