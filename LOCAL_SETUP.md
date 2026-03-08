# DCE Account Opening — Local Development Setup
> Full local stack: MariaDB + MCP Servers (SA-1/SA-2/SA-3) + Dify

---

## Architecture

```
Your Mac
├── Docker Desktop
│   ├── dce_mariadb        → port 3307  (MariaDB 11.3, auto-migrated)
│   ├── dce_mcp_sa1_sa2    → port 8000  (SA-1 + SA-2 MCP tools)
│   └── dce_mcp_sa3        → port 8001  (SA-3 MCP tools)
│
└── Dify (separate Docker Compose)
    └── localhost:80        (workflow UI, connects to MCP servers via host.docker.internal)
```

---

## Prerequisites (one-time installs)

### Step 1 — Homebrew
Open Terminal and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Follow the prompts. When done, run the two `eval` commands it prints at the end to add brew to your PATH.

Verify:
```bash
brew --version
```

---

### Step 2 — Python 3.11
```bash
brew install pyenv
pyenv install 3.11.9
pyenv global 3.11.9
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc
```

Verify:
```bash
python3 --version   # should show Python 3.11.x
```

---

### Step 3 — Docker Desktop
1. Download from: https://www.docker.com/products/docker-desktop/
2. Open the `.dmg` and drag Docker to Applications
3. Launch Docker from Applications
4. Wait for the whale icon in the menu bar to show "Docker Desktop is running"

Verify:
```bash
docker --version
docker compose version
```

---

## Project Setup (run once after prerequisites)

### Step 4 — Clone / enter project
```bash
cd "/Users/rangabodavalla/Documents/GIT Repos/DCE_Account_opening"
```

### Step 5 — Configure environment
```bash
# .env already exists with local defaults — just add your Anthropic key
# Open .env in any editor and set ANTHROPIC_API_KEY=sk-ant-...
```

### Step 6 — Build and start the stack
```bash
make up
```

This single command:
- Builds Docker images for SA-1/SA-2 and SA-3 MCP servers
- Starts MariaDB and auto-runs all 6 migration + seed SQL files (001–006)
- Starts both MCP servers, waiting for DB to be healthy first

First run takes ~2-3 minutes (image build + DB init). Subsequent starts take ~10 seconds.

### Step 7 — Verify everything is up
```bash
make health
```

Expected output:
```
--- Health Checks ---
SA-1/SA-2 (port 8000):  ✓ UP
SA-3      (port 8001):  ✓ UP
```

```bash
make db-status
```
Expected: 15+ tables listed with row counts.

---

## Testing MCP Tools

### Option A — MCP Inspector (recommended first step)
Test individual tools interactively in a browser UI:
```bash
# Test SA-1/SA-2 tools
make inspect-sa1

# Test SA-3 tools
make inspect-sa3
```
Opens browser at `http://localhost:5173`. Select a tool, fill in parameters, run.

### Option B — Direct curl
```bash
# Health check
curl http://localhost:8000/health
curl http://localhost:8001/health

# List available tools (MCP protocol)
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Option C — Claude Desktop (MCP client)
Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "dce-sa1-sa2": {
      "url": "http://localhost:8000/mcp"
    },
    "dce-sa3": {
      "url": "http://localhost:8001/mcp"
    }
  }
}
```
Restart Claude Desktop. Tools appear automatically.

---

## Dify Setup (workflow testing)

### Install Dify
```bash
# In your home directory (outside this project)
cd ~
git clone https://github.com/langgenius/dify.git
cd dify/docker
cp .env.example .env
# Edit .env — set SECRET_KEY to any random 32-char string
docker compose up -d
```

Dify starts at: http://localhost/install
- Create admin account on first visit
- Go to: Settings → Model Provider → Anthropic → Add API Key

### Connect MCP servers to Dify
In Dify, MCP servers are accessed via HTTP Tool nodes in workflows.

MCP server URLs from inside Dify's Docker network:
```
SA-1/SA-2: http://host.docker.internal:8000/mcp
SA-3:      http://host.docker.internal:8001/mcp
```

### Import existing workflows
In Dify UI → Studio → Import DSL:
- Import `dify/SA1_Intake_Triage_Workflow.dsl`
- Import `dify/SA2_Document_Collection_Workflow.dsl`

---

## Day-to-Day Commands

| Command | What it does |
|---|---|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make restart` | Rebuild + restart |
| `make reset` | Wipe DB + fresh start |
| `make logs` | Tail all logs |
| `make logs-sa3` | Tail SA-3 logs |
| `make ps` | Show container status |
| `make health` | Check MCP server health |
| `make db-shell` | Open MariaDB shell |
| `make db-status` | Show table row counts |
| `make inspect-sa1` | MCP Inspector for SA-1/SA-2 |
| `make inspect-sa3` | MCP Inspector for SA-3 |

---

## DB Migrations (reference)

Migrations run automatically on first `make up`. Manual re-run if needed:
```bash
# Open DB shell
make db-shell

# Then paste each file manually if needed:
SOURCE /docker-entrypoint-initdb.d/001_create_tables.sql;
SOURCE /docker-entrypoint-initdb.d/002_seed_data.sql;
# ... etc
```

Or full reset (re-runs all migrations from scratch):
```bash
make reset
```

---

## Troubleshooting

### DB not healthy / MCP servers won't start
```bash
make logs-db    # Check for SQL errors in migrations
```
If migrations failed: `make reset` to wipe and re-run.

### Port already in use
```bash
lsof -i :3307   # Something using MariaDB port
lsof -i :8000   # Something using SA-1 port
lsof -i :8001   # Something using SA-3 port
```
Kill the conflicting process or change ports in `.env`.

### Rebuild after code changes
```bash
make restart    # Rebuilds images + restarts (DB data preserved)
```

### Check MCP tool error details
```bash
make logs-sa1   # Live SA-1/SA-2 server logs
make logs-sa3   # Live SA-3 server logs
```
