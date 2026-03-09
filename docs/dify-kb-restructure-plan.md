# Dify Knowledge Base Restructuring Plan — S5-010

**Version:** 1.0.0
**Status:** Planned
**Dependency:** S5-009 (RAG Pipeline Design)

## 1. Current KB Inventory

| KB Name (Dify)           | Content                         | Doc Count | Status    |
|--------------------------|---------------------------------|-----------|-----------|
| GFM_SOP_Summary          | NPA SOPs, classification docs   | ~15       | Active    |
| Risk_Framework_Docs      | Risk assessment frameworks      | ~8        | Active    |
| Regulatory_Notices       | MAS/HKMA notices (manual)       | ~5        | Stale     |
| General_Reference        | Mixed industry docs, templates  | ~20       | Unscoped  |
| NPA_Templates            | Draft templates, form specs     | ~10       | Active    |

**Issues:**
- No consistent metadata (doc_id, version, classification missing)
- `General_Reference` mixes T2-T5 content without authority separation
- Regulatory notices not versioned or dated
- No chunking configuration per KB
- No provenance-compatible document IDs

## 2. Target KB Structure

Per the corpora registry and domain-scoped retrieval design:

### NPA Domain KBs

| Target KB               | Source Type        | Tier | Chunking Strategy   | Content                              |
|--------------------------|-------------------|------|---------------------|--------------------------------------|
| `NPA_SOR_CACHE`          | system_of_record  | 1    | field_level         | Cached entity snapshots (optional)   |
| `NPA_BANK_SOPS`          | bank_sop          | 2    | section_aware       | GFM SOPs, classification criteria    |
| `NPA_INDUSTRY_STANDARDS` | industry_standard | 3    | section_aware       | ISDA, Basel III, FX Global Code      |
| `NPA_REGULATORY`         | external_official | 4    | section_aware       | MAS notices, HKMA circulars          |
| `NPA_TEMPLATES`          | bank_sop          | 2    | fixed_size          | Draft templates, form specifications |

### DESK Domain KBs

| Target KB               | Source Type        | Tier | Chunking Strategy   | Content                              |
|--------------------------|-------------------|------|---------------------|--------------------------------------|
| `DESK_ONBOARDING_DOCS`  | bank_sop          | 2    | section_aware       | Onboarding playbooks, checklists     |
| `DESK_CREDIT_DOCS`      | bank_sop          | 2    | section_aware       | Credit policy, counterparty guides   |

## 3. Migration Steps

### Phase 1: Metadata Enrichment (Pre-migration)
1. Audit every document in existing KBs
2. Assign `doc_id` (format: `{source_type}_{snake_case_name}_v{version}`)
3. Add `version`, `effective_date`, `classification` metadata
4. Tag with `authority_tier` matching source-priority.json

### Phase 2: KB Split & Rename
1. Split `General_Reference` into authority-tier-separated KBs
2. Rename `GFM_SOP_Summary` → `NPA_BANK_SOPS`
3. Rename `Risk_Framework_Docs` → merge into `NPA_BANK_SOPS` (T2 content)
4. Create new `NPA_REGULATORY` KB from `Regulatory_Notices`
5. Create `NPA_INDUSTRY_STANDARDS` from T3 content in `General_Reference`

### Phase 3: Chunking Configuration
1. Configure section-aware chunking for SOPs (chunk_size=512, overlap=64)
2. Configure section-aware chunking for regulatory docs (chunk_size=384, overlap=48)
3. Configure field-level chunking for entity cache (chunk_size=256, no overlap)
4. Re-index all KBs with new chunking settings

### Phase 4: Metadata Requirements per Document

Every document uploaded to a restructured KB must include:

```json
{
  "doc_id": "SOPv3.2_NPA_Classification_Criteria",
  "version": "3.2",
  "effective_date": "2026-01-15",
  "classification": "INTERNAL",
  "authority_tier": 2,
  "source_type": "bank_sop",
  "domain": "NPA",
  "section_count": 8,
  "last_reviewed": "2026-02-28"
}
```

## 4. Chunking Configuration per KB

| KB                        | Method          | Chunk Size | Overlap | Section Markers                    |
|---------------------------|-----------------|-----------|---------|-----------------------------------|
| `NPA_BANK_SOPS`           | section_aware   | 512       | 64      | `#`, `##`, `Section X.Y`         |
| `NPA_REGULATORY`          | section_aware   | 384       | 48      | `Article`, `Section`, `Part`      |
| `NPA_INDUSTRY_STANDARDS`  | section_aware   | 512       | 64      | `Article`, `Annex`, `Schedule`    |
| `NPA_TEMPLATES`           | fixed_size      | 512       | 64      | N/A                               |
| `NPA_SOR_CACHE`           | field_level     | 256       | 0       | JSON field boundaries             |

## 5. Testing Plan

### Pre-Migration Baseline
1. Run 10 representative queries against current KBs
2. Record top-8 results + relevance scores for each
3. Note any missing or irrelevant results

### Post-Migration Validation
1. Re-run the same 10 queries against restructured KBs
2. Compare top-8 results:
   - **Recall:** Do we still find the same relevant docs?
   - **Precision:** Are irrelevant docs filtered out?
   - **Authority ordering:** Are T1/T2 docs ranked above T3/T4?
3. Verify provenance tags are present on every returned chunk
4. Verify metadata fields (doc_id, version, effective_date) are populated
5. Run grounding scorer on sample agent responses to confirm citation coverage

### Acceptance Criteria
- [ ] All 5 target KBs created and indexed
- [ ] Every document has valid doc_id, version, classification metadata
- [ ] Section-aware chunking active for SOPs and regulatory docs
- [ ] Post-migration recall >= 90% of pre-migration baseline
- [ ] Authority tier ordering confirmed in reranked results
- [ ] Provenance tags attached to all returned chunks
