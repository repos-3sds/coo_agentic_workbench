"""Database and application configuration for DCE Agent MCP servers."""

import os

# ---------------------------------------------------------------------------
# MySQL/MariaDB connection
# Supports both DCE_DB_* (local Docker) and MYSQL* (Railway) env vars
# ---------------------------------------------------------------------------
DB_CONFIG = {
    "host": os.getenv("DCE_DB_HOST") or os.getenv("MYSQLHOST", "127.0.0.1"),
    "port": int(os.getenv("DCE_DB_PORT") or os.getenv("MYSQLPORT", "3307")),
    "user": os.getenv("DCE_DB_USER") or os.getenv("MYSQLUSER", "dce_user"),
    "password": os.getenv("DCE_DB_PASSWORD") or os.getenv("MYSQLPASSWORD", "dce_pass_2026"),
    "database": os.getenv("DCE_DB_NAME") or os.getenv("MYSQLDATABASE", "dce_agent"),
    "autocommit": False,
}

# ---------------------------------------------------------------------------
# Case ID generation
# ---------------------------------------------------------------------------
CASE_ID_PREFIX = "AO"
CASE_ID_YEAR = "2026"

# ---------------------------------------------------------------------------
# Agent metadata
# ---------------------------------------------------------------------------
SA1_AGENT_MODEL = "claude-sonnet-4-6"
SA1_PRIORITY_MODEL = "claude-haiku-4-5"
SA1_NODE_ID = "N-0"
SA1_NEXT_NODE = "N-1"
SA1_MAX_RETRIES = 2

SA2_AGENT_MODEL = "claude-sonnet-4-6"
SA2_NODE_ID = "N-1"
SA2_NEXT_NODE = "N-2"
SA2_MAX_RETRIES = 3
