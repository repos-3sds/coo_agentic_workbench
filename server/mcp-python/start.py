"""
Combined launcher — REST API + MCP SSE on single port.

REST API + MCP SSE: http://localhost:3002
  - /health, /tools, /openapi.json  (REST endpoints)
  - /mcp/sse, /mcp/messages         (MCP SSE transport)

MCP SSE is mounted alongside the FastAPI app so a single-port deployment
can serve both protocols on the same public domain.
"""
import asyncio
import os
import sys
import time

from dotenv import load_dotenv

# Load environment: try local .env first, then project root .env
_dir = os.path.dirname(__file__)
load_dotenv(os.path.join(_dir, ".env"))  # local (Docker / hosted env)
load_dotenv(os.path.join(_dir, "..", "..", ".env"))  # project root (dev)

# Ensure this directory is on the path
sys.path.insert(0, _dir)

from db import health_check, reset_pool  # noqa: E402


def _check_db() -> bool:
    """Run the async DB health check synchronously with retry logic."""
    loop = asyncio.new_event_loop()
    try:
        for attempt in range(1, 6):
            ok = loop.run_until_complete(health_check())
            if ok:
                # Reset pool so the server creates a fresh pool in its own loop
                reset_pool()
                return True
            print(f"[INIT] DB attempt {attempt}/5 failed, retrying in 3s...")
            time.sleep(3)
        return False
    finally:
        loop.close()


def main() -> None:
    print("=========================================")
    print("  NPA Workbench — MCP Tools Server (Python)")
    print("=========================================\n")

    # 1. Verify database connectivity (retry up to 5 times for cloud cold starts)
    print("[INIT] Checking database connection...")
    if not _check_db():
        print("[INIT] Database connection failed after 5 attempts.")
        print("[INIT]    Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME env vars.")
        print("[INIT]    WARNING: Server is starting without database access. Tools requiring DB will fail.")
    else:
        print("[INIT] Database connected\n")

    # 2. Start the unified server (REST API + MCP SSE mounted together)
    from rest_server import start_rest_server
    start_rest_server()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Server stopped.")
    except Exception as e:
        print(f"[FATAL] {e}")
        sys.exit(1)
