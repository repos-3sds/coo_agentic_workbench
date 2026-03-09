# Product Catalog & Historical NPA Summaries (POC)
**Agent:** CF_NPA_BIZ  
**Suggested Dify dataset:** `COO Command Center — Business (Catalog)`  
**Last updated:** 2026-02-23

## Purpose
Help business agents provide “precedent-aware” guidance:
- find similar past NPAs
- reference Evidence Library records
- summarise key takeaways for classification and expected sign-offs

---

## 1) Sources of precedents in this project
### Evidence Library (UI + DB table)
- DB table: `evidence_library`
- API: `GET /api/evidence`
- Categories: PRECEDENTS / AUDITS / EXCEPTIONS

### Seeded demo NPAs (DB)
- NPAs and signoffs are seeded by server seed scripts and SQL migrations.

---

## 2) How to query (operator notes)
If you have MySQL access, run:
```sql
SELECT record_id, title, evidence_type, status, event_date
FROM evidence_library
ORDER BY event_date DESC;
```

For knowledge base UI docs:
```sql
SELECT doc_id, title, ui_category, agent_target
FROM kb_documents
WHERE ui_category IS NOT NULL
ORDER BY ui_category, title;
```

---

## 3) How the agent should write a “historical precedent summary”
Use this template:
- Closest precedent(s): {record_id / title}
- Similarity drivers: {asset class, jurisdiction, booking model, client segment}
- Outcome: {approved/rejected} + why
- Constraints learned: {limits, required docs, sign-offs}
- Recommendation: {track + gating}

