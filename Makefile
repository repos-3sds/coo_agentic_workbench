# DCE Account Opening — Local Dev Makefile
# ==========================================
# Usage: make <target>
#
# Prerequisites: Docker Desktop must be running.

.PHONY: help up down restart logs logs-db logs-sa1 logs-sa3 logs-sa4 logs-sa5 \
        ps health db-shell clean reset inspect-sa1 inspect-sa3 inspect-sa4 inspect-sa5 test

# ─────────────────────────────────────────────
# Default target
# ─────────────────────────────────────────────
help:
	@echo ""
	@echo "DCE Account Opening — Local Dev Commands"
	@echo "========================================="
	@echo ""
	@echo "Stack Management:"
	@echo "  make up            Build images and start all services (detached)"
	@echo "  make down          Stop all services (keeps DB data)"
	@echo "  make restart       Full rebuild and restart"
	@echo "  make reset         Stop + wipe all DB data + rebuild (fresh start)"
	@echo ""
	@echo "Monitoring:"
	@echo "  make ps            Show running containers + health status"
	@echo "  make logs          Tail all service logs"
	@echo "  make logs-db       Tail MariaDB logs"
	@echo "  make logs-sa1      Tail SA-1/SA-2 MCP server logs"
	@echo "  make logs-sa3      Tail SA-3 MCP server logs"
	@echo "  make logs-sa4      Tail SA-4 MCP server logs"
	@echo "  make logs-sa5      Tail SA-5 MCP server logs"
	@echo "  make health        Check health endpoints for all MCP servers"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell      Open interactive MariaDB shell (dce_agent DB)"
	@echo "  make db-status     Show tables + row counts in dce_agent"
	@echo ""
	@echo "Testing:"
	@echo "  make inspect-sa1   Open MCP Inspector for SA-1/SA-2 (port 8000)"
	@echo "  make inspect-sa3   Open MCP Inspector for SA-3 (port 8001)"
	@echo "  make inspect-sa4   Open MCP Inspector for SA-4 (port 8002)"
	@echo "  make inspect-sa5   Open MCP Inspector for SA-5 (port 8003)"
	@echo "  make test          Run pytest test suite"
	@echo ""

# ─────────────────────────────────────────────
# Stack Management
# ─────────────────────────────────────────────
up:
	@echo "→ Building images and starting services..."
	docker compose up -d --build
	@echo ""
	@echo "→ Waiting for services to be healthy..."
	@sleep 5
	@make ps

down:
	@echo "→ Stopping services (data preserved)..."
	docker compose down

restart:
	@echo "→ Rebuilding and restarting..."
	docker compose down
	docker compose up -d --build
	@sleep 5
	@make ps

reset:
	@echo "→ Full reset: stopping, wiping volumes, rebuilding..."
	@echo "   WARNING: All DB data will be lost!"
	docker compose down -v
	docker compose up -d --build
	@echo "→ Waiting 15s for DB to initialise and run migrations..."
	@sleep 15
	@make ps

# ─────────────────────────────────────────────
# Monitoring
# ─────────────────────────────────────────────
ps:
	@echo "--- Container Status ---"
	docker compose ps
	@echo ""

logs:
	docker compose logs -f

logs-db:
	docker compose logs -f db

logs-sa1:
	docker compose logs -f mcp-sa1-sa2

logs-sa3:
	docker compose logs -f mcp-sa3

logs-sa4:
	docker compose logs -f mcp-sa4

logs-sa5:
	docker compose logs -f mcp-sa5

health:
	@echo "--- Health Checks ---"
	@echo -n "SA-1/SA-2 (port 8000): "
	@curl -sf http://localhost:8000/health && echo " ✓ UP" || echo " ✗ DOWN"
	@echo -n "SA-3      (port 8001): "
	@curl -sf http://localhost:8001/health && echo " ✓ UP" || echo " ✗ DOWN"
	@echo -n "SA-4      (port 8002): "
	@curl -sf http://localhost:8002/health && echo " ✓ UP" || echo " ✗ DOWN"
	@echo -n "SA-5      (port 8003): "
	@curl -sf http://localhost:8003/health && echo " ✓ UP" || echo " ✗ DOWN"
	@echo ""

# ─────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────
db-shell:
	@echo "→ Opening MariaDB shell (dce_agent)..."
	docker compose exec db mysql -u dce_user -pdce_pass_2026 dce_agent

db-status:
	@echo "--- dce_agent Tables ---"
	docker compose exec db mysql -u dce_user -pdce_pass_2026 dce_agent -e \
		"SELECT table_name, table_rows \
		 FROM information_schema.tables \
		 WHERE table_schema = 'dce_agent' \
		 ORDER BY table_name;"

# ─────────────────────────────────────────────
# MCP Testing — MCP Inspector
# ─────────────────────────────────────────────
inspect-sa1:
	@echo "→ Opening MCP Inspector for SA-1/SA-2 server..."
	@echo "   URL: http://localhost:8000/mcp"
	npx @modelcontextprotocol/inspector http://localhost:8000/mcp

inspect-sa3:
	@echo "→ Opening MCP Inspector for SA-3 server..."
	@echo "   URL: http://localhost:8001/mcp"
	npx @modelcontextprotocol/inspector http://localhost:8001/mcp

inspect-sa4:
	@echo "→ Opening MCP Inspector for SA-4 server..."
	@echo "   URL: http://localhost:8002/mcp"
	npx @modelcontextprotocol/inspector http://localhost:8002/mcp

inspect-sa5:
	@echo "→ Opening MCP Inspector for SA-5 server..."
	@echo "   URL: http://localhost:8003/mcp"
	npx @modelcontextprotocol/inspector http://localhost:8003/mcp

# ─────────────────────────────────────────────
# Test Suite
# ─────────────────────────────────────────────
test:
	@echo "→ Running pytest..."
	python3 -m pytest tests/ -v

clean:
	@echo "→ Stopping services and removing volumes..."
	docker compose down -v
	docker system prune -f
