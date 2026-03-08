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

SA3_AGENT_MODEL = "claude-sonnet-4-6"
SA3_NODE_ID = "N-2"
SA3_NEXT_NODE = "N-3"
SA3_MAX_RETRIES = 1

SA4_AGENT_MODEL = "claude-sonnet-4-6"
SA4_NODE_ID = "N-3"
SA4_NEXT_NODE = "N-4"
SA4_MAX_RETRIES = 1

SA5_AGENT_MODEL = "claude-sonnet-4-6"
SA5_NODE_ID = "N-4"
SA5_NEXT_NODE = "N-5"
SA5_MAX_RETRIES = 1

SA6_AGENT_MODEL = "claude-sonnet-4-6"
SA6_NODE_ID = "N-5"
SA6_NEXT_NODE = "N-6"
SA6_MAX_RETRIES = 1

SA7_AGENT_MODEL = "claude-sonnet-4-6"
SA7_NODE_ID = "N-6"
SA7_NEXT_NODE = None   # FINAL node — no next node in pipeline
SA7_MAX_RETRIES = 1

# ---------------------------------------------------------------------------
# Domain Orchestrator
# ---------------------------------------------------------------------------
ORCH_PORT = 8006

# MCP Server Port Map (orchestrator uses this to call sub-agents)
MCP_PORTS = {
    "N-0": 8000,  # SA1
    "N-1": 8000,  # SA2 (shared server with SA1)
    "N-2": 8001,  # SA3
    "N-3": 8002,  # SA4
    "N-4": 8003,  # SA5
    "N-5": 8004,  # SA6
    "N-6": 8005,  # SA7
}

# Container name map (used when running inside Docker)
MCP_CONTAINERS = {
    "N-0": "dce_mcp_sa1_sa2",
    "N-1": "dce_mcp_sa1_sa2",
    "N-2": "dce_mcp_sa3",
    "N-3": "dce_mcp_sa4",
    "N-4": "dce_mcp_sa5",
    "N-5": "dce_mcp_sa6",
    "N-6": "dce_mcp_sa7",
}

# Pipeline definition (linear node order)
PIPELINE_NODES = ["N-0", "N-1", "N-2", "N-3", "N-4", "N-5", "N-6"]
PIPELINE_TERMINAL = "DONE"

# HITL nodes that require auto-resolution in test mode
HITL_NODES = {"N-2", "N-3", "N-4", "N-5"}
