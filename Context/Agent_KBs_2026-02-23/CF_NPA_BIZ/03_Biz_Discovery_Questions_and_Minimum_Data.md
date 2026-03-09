# Business Discovery Questions & Minimum Data (POC)
**Agent:** CF_NPA_BIZ  
**Suggested Dify dataset:** `COO Command Center — Business (Discovery)`  
**Last updated:** 2026-02-23

## Purpose
Ensure business discovery is consistent so downstream agents can execute without gaps.

---

## Minimum discovery questions (ask in order)
1. What is the product (payoff/structure) in plain English?
2. Who are the clients (segment) and how will it be distributed?
3. Where will it be booked and what jurisdictions are involved?
4. What is the expected notional / volume / revenue?
5. What systems are used (booking, risk, settlement) and are changes needed?
6. Any new vendors or platforms?
7. Any known regulatory approvals/licenses required?

---

## Output format (agent should persist)
- `title`, `description`
- `npa_type` (NTG/Variation/Existing) + confidence
- `is_cross_border` + jurisdictions
- `notional_amount` + currency
- `product_category`, `risk_level`
- key dependencies + blockers list

