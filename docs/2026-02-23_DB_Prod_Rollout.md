# DB Prod Rollout Notes (2026-02-23)

## What changed (DB layer)

1. **Upserts fixed for `npa_form_data`**
   - Adds `UNIQUE KEY (project_id, field_key)` so `INSERT ... ON DUPLICATE KEY UPDATE` actually upserts.
2. **Timestamps added to `npa_form_data`**
   - Adds `created_at` and `updated_at` (API currently references `updated_at` in at least one upsert path).
3. **Field registry sync**
   - Ensures the DB has the expected **339 fields / 13 sections** for `STD_NPA_V2` via `004_sync_339_fields.sql`.

## Files to apply

- `database/migrations/004_sync_339_fields.sql`
- `database/migrations/005_fix_npa_form_data_upsert.sql`
- `database/migrations/006_fix_npa_projects_updated_at_default.sql`

(Safe approach: apply **all** migrations in `database/migrations/` in numeric order.)

## Production runbook

### 0) Backup (required)

```bash
mysqldump -u <user> -p --single-transaction <db_name> > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 1) Apply migrations

From the repo root:

```bash
for f in database/migrations/*.sql; do
  echo "Applying $f"
  mysql -h <host> -P <port> -u <user> -p <db_name> < "$f"
done
```

### 2) Validate

Run these checks:

```sql
-- A) No duplicates (must return 0 rows)
SELECT project_id, field_key, COUNT(*) AS c
FROM npa_form_data
GROUP BY project_id, field_key
HAVING c > 1;

-- B) Unique index exists
SHOW INDEX FROM npa_form_data WHERE Key_name = 'uniq_npa_form_data_project_field';

-- C) Columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'npa_form_data'
  AND column_name IN ('created_at', 'updated_at');

-- D) Fields are synced (expect >= 339 total)
SELECT COUNT(*) AS ref_npa_fields_count FROM ref_npa_fields;
```

### 3) Smoke-test upsert behavior

```sql
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage)
VALUES ('NPA-TEST', 'product_name', 'A', 'MANUAL')
ON DUPLICATE KEY UPDATE field_value = VALUES(field_value);

INSERT INTO npa_form_data (project_id, field_key, field_value, lineage)
VALUES ('NPA-TEST', 'product_name', 'B', 'MANUAL')
ON DUPLICATE KEY UPDATE field_value = VALUES(field_value);

SELECT project_id, field_key, field_value
FROM npa_form_data
WHERE project_id = 'NPA-TEST' AND field_key = 'product_name';
```

Expected: exactly **1 row** with `field_value = 'B'`.

## Optional: seed demo drafts

After the DB is deployed and migrations are applied, you can optionally seed complete demo drafts for `NPA-2026-001` to `NPA-2026-005`:

```bash
chmod +x database/apply-demo-seeds.sh
./database/apply-demo-seeds.sh --host <host> --port <port> --user <user> --password <password> --database <db_name>
```

## Rollback

- Preferred: restore from the backup created in step 0.
- If you must revert only the uniqueness change:
  - Drop the unique index: `ALTER TABLE npa_form_data DROP INDEX uniq_npa_form_data_project_field;`
