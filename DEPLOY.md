# DCE MCP Tools — Railway Deployment

## Live Instance
- **URL**: `https://dcemcptools-production.up.railway.app`
- **Health**: `GET /health`
- **MCP Endpoint**: `POST /mcp`
- **Dashboard**: https://railway.com/project/f426af29-43fa-4386-94fc-b9ee784e7c70

## One-Click Redeploy (existing project)
```bash
cd "C:\Users\vssvi\Downloads\DCE Agent"
railway up
```

## Fresh Deploy (new Railway project)
```bash
# 1. Login & create project
railway login
railway init --name dce-mcp-tools

# 2. Add MySQL database
railway add --database mysql

# 3. Create dce_agent database & run migrations
mysql -h <RAILWAY_PUBLIC_HOST> -P <RAILWAY_PUBLIC_PORT> -u root -p<MYSQL_ROOT_PASSWORD> -e "CREATE DATABASE IF NOT EXISTS dce_agent;"
mysql -h <RAILWAY_PUBLIC_HOST> -P <RAILWAY_PUBLIC_PORT> -u root -p<MYSQL_ROOT_PASSWORD> dce_agent < db/001_create_tables.sql
mysql -h <RAILWAY_PUBLIC_HOST> -P <RAILWAY_PUBLIC_PORT> -u root -p<MYSQL_ROOT_PASSWORD> dce_agent < db/002_seed_data.sql
mysql -h <RAILWAY_PUBLIC_HOST> -P <RAILWAY_PUBLIC_PORT> -u root -p<MYSQL_ROOT_PASSWORD> dce_agent < db/003_create_sa2_tables.sql
mysql -h <RAILWAY_PUBLIC_HOST> -P <RAILWAY_PUBLIC_PORT> -u root -p<MYSQL_ROOT_PASSWORD> dce_agent < db/004_sa1_prerequisites_for_sa2.sql
mysql -h <RAILWAY_PUBLIC_HOST> -P <RAILWAY_PUBLIC_PORT> -u root -p<MYSQL_ROOT_PASSWORD> dce_agent < db/005_sa2_seed_reordered.sql

# 4. Create MCP server service & link
railway add --service dce_mcp_tools
railway service link dce_mcp_tools

# 5. Set env vars (references MySQL service internally)
railway variable --set "DCE_DB_NAME=dce_agent" --set "PORT=8000" --set "MCP_TRANSPORT=streamable-http"
railway variable --set 'MYSQLHOST=${{MySQL.MYSQLHOST}}' --set 'MYSQLPORT=${{MySQL.MYSQLPORT}}' --set 'MYSQLUSER=${{MySQL.MYSQLUSER}}' --set 'MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}'

# 6. Deploy & generate domain
railway up
railway domain
```

## Environment Variables (dce_mcp_tools service)
| Variable | Value | Source |
|---|---|---|
| `DCE_DB_NAME` | `dce_agent` | Manual |
| `PORT` | `8000` | Manual |
| `MCP_TRANSPORT` | `streamable-http` | Manual |
| `MYSQLHOST` | `${{MySQL.MYSQLHOST}}` | Railway ref |
| `MYSQLPORT` | `${{MySQL.MYSQLPORT}}` | Railway ref |
| `MYSQLUSER` | `${{MySQL.MYSQLUSER}}` | Railway ref |
| `MYSQLPASSWORD` | `${{MySQL.MYSQLPASSWORD}}` | Railway ref |

## DB Migrations (run order matters)
1. `db/001_create_tables.sql` — SA-1 tables (8)
2. `db/002_seed_data.sql` — SA-1 seed (cases 101-103)
3. `db/003_create_sa2_tables.sql` — SA-2 tables (6)
4. `db/004_sa1_prerequisites_for_sa2.sql` — SA-1 data needed by SA-2 FKs
5. `db/005_sa2_seed_reordered.sql` — SA-2 seed data

## MCP Tools (5)
1. `sa1_get_intake_context` — Context retrieval (new/retry)
2. `sa1_create_case_full` — Atomic case creation
3. `sa1_stage_documents_batch` — Batch document staging
4. `sa1_notify_stakeholders` — Multi-channel notifications
5. `sa1_complete_node` — Checkpoint + state update
