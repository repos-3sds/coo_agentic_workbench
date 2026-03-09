# NPA Workbench Database

Production database schema and seed data for the **NPA (New Product Approval) Workbench** -- an AI-driven platform for managing the full lifecycle of new product approvals in financial services.

## Overview

| Property | Value |
|---|---|
| **Engine** | MariaDB 10.6+ (InnoDB) |
| **Character Set** | `utf8mb4` / `utf8mb4_general_ci` |
| **Tables** | 42 |
| **Seed Data Rows** | ~1,054 |
| **Full Export Size** | ~188 KB |

---

## Prerequisites

- **MariaDB 10.6+** or **MySQL 8.0+**
- `mysql` CLI client (for `deploy.sh`)
- Docker & Docker Compose (for containerised deployment)

---

## Quick Start

### Option A -- Docker (recommended)

```bash
# Start MariaDB with auto-import
docker compose -f docker-compose.db.yml up -d

# Verify (wait ~15s for init)
docker exec npa_mariadb mysql -unpa_user -pnpa_password -e "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='npa_workbench';"
```

Notes:
- `docker-compose.db.yml` mounts `database/migrations/*.sql` into `/docker-entrypoint-initdb.d/` so migrations apply automatically on first init.
- If you already have a persisted volume, you may need to remove it to re-run init scripts.

### Option B -- Local MariaDB

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run with defaults (localhost:3306, npa_user/npa_password, npa_workbench)
./deploy.sh

# Skip migrations (legacy behavior)
./deploy.sh --skip-migrations

# Or specify connection parameters
./deploy.sh --host 127.0.0.1 --port 3307 --user root --password secret --database npa_workbench
```

### Option C -- Manual Import

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS npa_workbench CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root -p npa_workbench < npa_workbench_full_export.sql
```

---

## File Inventory

| File | Description |
|---|---|
| `npa_workbench_full_export.sql` | Full MariaDB dump (schema + data, 42 tables) |
| `schema-only.sql` | DDL only -- table definitions, indexes, foreign keys |
| `seed-data-only.sql` | INSERT statements only -- reference and demo data |
| `deploy.sh` | Automated deployment script with verification |
| `docker-compose.db.yml` | Standalone Docker Compose for MariaDB |
| `.env.example` | Environment variable template |

---

## Migrations (Important)

The `npa_workbench_full_export.sql` is a baseline snapshot. The application expects additional schema/data updates that are shipped as incremental SQL migrations in `database/migrations/`.

Key migrations:
- `004_sync_339_fields.sql` — syncs the `STD_NPA_V2` registry to **339 fields / 13 sections**
- `005_fix_npa_form_data_upsert.sql` — fixes `npa_form_data` upserts by adding a `(project_id, field_key)` unique key and adds `created_at`/`updated_at`

`deploy.sh` applies all migrations by default; use `--skip-migrations` to disable.

## Optional Demo Seeds (NPA Drafts)

For demos, you can optionally seed complete `npa_form_data` drafts for:
- `NPA-2026-001` through `NPA-2026-005`

Files:
- `seed-npa-001-digital-asset-custody.sql`
- `seed-npa-002-fx-put-option.sql`
- `seed-npa-003-green-bond-etf.sql`
- `seed-npa-004-capital-protected-note.sql`
- `seed-npa-005-supply-chain-finance.sql`

How to apply:
```bash
# After deploy/import + migrations are complete:
chmod +x apply-demo-seeds.sh
./apply-demo-seeds.sh --host 127.0.0.1 --port 3306 --user npa_user --password npa_password --database npa_workbench

# Or run deploy.sh with the flag:
./deploy.sh --apply-demo-seeds
```

## Table Inventory (42 Tables)

### Core NPA Lifecycle (7 tables)

| Table | Rows | Description |
|---|---|---|
| `npa_projects` | 12 | Master NPA records with status, classification, and timeline |
| `npa_form_data` | 54 | Dynamic key-value form field entries per NPA |
| `npa_jurisdictions` | 19 | Multi-jurisdiction mappings for cross-border NPAs |
| `npa_intake_assessments` | 55 | Initial intake questionnaire responses |
| `npa_classification_scorecards` | 12 | AI-generated classification scores per NPA |
| `npa_classification_assessments` | 75 | Individual criteria evaluations for classification |
| `npa_workflow_states` | 60 | State machine transitions tracking NPA lifecycle |

### Approval & Governance (5 tables)

| Table | Rows | Description |
|---|---|---|
| `npa_signoffs` | 54 | Individual sign-off records from approvers |
| `npa_approvals` | 4 | High-level approval decisions (Checker, GFM COO, PAC) |
| `npa_loop_backs` | 6 | Rejection loop-back records with circuit breaker tracking |
| `npa_comments` | 19 | Discussion threads on NPAs |
| `npa_escalations` | 4 | Escalation records for SLA breaches or blockers |

### Risk & Compliance (4 tables)

| Table | Rows | Description |
|---|---|---|
| `npa_risk_checks` | 36 | 4-layer risk assessment results (policy, regulatory, sanctions, dynamic) |
| `npa_prerequisite_results` | 96 | Prerequisite check outcomes per NPA |
| `npa_documents` | 28 | Uploaded document metadata and approval status |
| `npa_external_parties` | 14 | Third-party vendor and counterparty records |

### Post-Launch Monitoring (5 tables)

| Table | Rows | Description |
|---|---|---|
| `npa_breach_alerts` | 7 | Threshold breach alerts for launched products |
| `npa_performance_metrics` | 4 | KPI snapshots for launched products |
| `npa_monitoring_thresholds` | 9 | Configurable alert thresholds per product |
| `npa_post_launch_conditions` | 10 | Conditions imposed at approval that require monitoring |
| `npa_market_risk_factors` | 20 | Market risk factor observations |

### Dashboard & Analytics (4 tables)

| Table | Rows | Description |
|---|---|---|
| `npa_kpi_snapshots` | 3 | Historical pipeline-level KPI snapshots |
| `npa_market_clusters` | 4 | Product cluster aggregations for trend analysis |
| `npa_prospects` | 5 | Pipeline prospect records |
| `npa_audit_log` | 30 | Immutable audit trail for all NPA actions |

### AI Agent System (5 tables)

| Table | Rows | Description |
|---|---|---|
| `agent_sessions` | 10 | Agent conversation sessions with handoff tracking |
| `agent_messages` | 28 | Individual agent/user messages with reasoning chains |
| `npa_agent_routing_decisions` | 14 | Agent-to-agent routing decisions with confidence scores |
| `kb_documents` | 20 | Knowledge base document registry for RAG |
| `evidence_library` | 8 | Evidence Library records shown in the UI |

### Reference Data (13 tables)

| Table | Rows | Description |
|---|---|---|
| `users` | 15 | System users (makers, checkers, approvers, admins) |
| `ref_npa_templates` | 2 | NPA form templates (Full, Standard) |
| `ref_npa_sections` | 18 | Template section definitions |
| `ref_npa_fields` | 106 | Individual field definitions within sections |
| `ref_field_options` | 72 | Dropdown/select option values for fields |
| `ref_classification_criteria` | 28 | Classification scoring criteria and weights |
| `ref_signoff_routing_rules` | 19 | Rules mapping NPA types to required approvers |
| `ref_document_requirements` | 20 | Document requirements per NPA classification |
| `ref_document_rules` | 3 | Conditional document requirement rules |
| `ref_escalation_rules` | 9 | SLA and escalation trigger rules |
| `ref_prerequisite_categories` | 9 | Prerequisite check category definitions |
| `ref_prerequisite_checks` | 32 | Individual prerequisite check definitions |
| `ref_prohibited_items` | 9 | Prohibited product/activity list |

---

## Data Statistics Summary

| Category | Tables | Total Rows |
|---|---|---|
| Core NPA Lifecycle | 7 | 287 |
| Approval & Governance | 5 | 87 |
| Risk & Compliance | 4 | 174 |
| Post-Launch Monitoring | 5 | 50 |
| Dashboard & Analytics | 4 | 42 |
| AI Agent System | 5 | 80 |
| Reference Data | 13 | 342 |
| **Total** | **43** | **1,062** |

---

## Environment Variables

Copy `.env.example` and customise:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | MariaDB host |
| `DB_PORT` | `3306` | MariaDB port |
| `DB_USER` | `npa_user` | Application database user |
| `DB_PASSWORD` | `npa_password` | Application database password |
| `DB_DATABASE` | `npa_workbench` | Database name |
| `MYSQL_ROOT_PASSWORD` | `npa_root_secret` | MariaDB root password (Docker only) |
| `API_PORT` | `3000` | Express API server port |
| `API_BASE_URL` | `http://localhost:3000/api` | API base URL |

---

## Backup & Restore

### Full Backup

```bash
mysqldump -u npa_user -p --single-transaction --routines --triggers npa_workbench > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Schema Only Backup

```bash
mysqldump -u npa_user -p --no-data --routines --triggers npa_workbench > schema_backup.sql
```

### Data Only Backup

```bash
mysqldump -u npa_user -p --no-create-info --complete-insert --single-transaction npa_workbench > data_backup.sql
```

### Docker Backup

```bash
docker exec npa_mariadb mysqldump -unpa_user -pnpa_password --single-transaction npa_workbench > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
mysql -u npa_user -p npa_workbench < backup_file.sql
```

### Docker Restore

```bash
docker exec -i npa_mariadb mysql -unpa_user -pnpa_password npa_workbench < backup_file.sql
```

---

## Notes

- All tables use **InnoDB** engine with foreign key constraints.
- JSON columns use `longtext` with `json_valid()` CHECK constraints for MariaDB compatibility.
- Timestamps default to `current_timestamp()` and use UTC timezone.
- The `npa_audit_log` table provides a complete immutable audit trail for regulatory compliance.
- Agent tables support the multi-agent orchestration architecture (Master COO Orchestrator, Domain Orchestrators, Specialist Agents).
