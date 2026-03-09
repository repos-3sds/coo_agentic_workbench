"""
Database module — aiomysql connection pool + query/execute helpers.
Mirrors server/mcp/src/db.ts exactly.
"""
from __future__ import annotations

import os
import ssl
from datetime import date, datetime
from decimal import Decimal

import aiomysql

_pool: aiomysql.Pool | None = None


def _bool_env(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "y", "on")


def _build_ssl_ctx() -> ssl.SSLContext | None:
    """
    Build an SSLContext for MySQL connections.

    Env vars:
      - DB_SSL_MODE: disable|require|verify  (default: require in production, disable otherwise)
      - DB_SSL_INSECURE: true to disable hostname/cert verification (default: false)
      - DB_SSL_CA_FILE: path to CA bundle (optional)
    """
    env = (os.getenv("ENV") or "").strip().lower()
    default_mode = "require" if env == "production" else "disable"
    mode = (os.getenv("DB_SSL_MODE") or default_mode).strip().lower()

    if mode in ("disable", "off", "false", "0", "none"):
        return None

    ca_file = os.getenv("DB_SSL_CA_FILE")
    ssl_ctx = ssl.create_default_context(cafile=ca_file) if ca_file else ssl.create_default_context()

    # Default to True because Railway's MySQL proxy uses a self-signed / mismatched cert
    insecure = _bool_env("DB_SSL_INSECURE", True)
    if insecure:
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

    if mode not in ("require", "verify"):
        raise ValueError(f"Unsupported DB_SSL_MODE: {mode}")

    return ssl_ctx


async def get_pool() -> aiomysql.Pool:
    """Return the shared connection pool, creating it on first call."""
    global _pool
    if _pool is None:
        ssl_ctx = _build_ssl_ctx()

        _pool = await aiomysql.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "npa_user"),
            password=os.getenv("DB_PASSWORD", "npa_password"),
            db=os.getenv("DB_NAME", "npa_workbench"),
            minsize=1,
            maxsize=10,
            autocommit=True,
            ssl=ssl_ctx,
        )
    return _pool


def _serialize_row(row: dict) -> dict:
    """Convert MySQL types (datetime, Decimal, bytes) to JSON-safe Python types."""
    out = {}
    for key, val in row.items():
        if isinstance(val, datetime):
            out[key] = val.isoformat()
        elif isinstance(val, date):
            out[key] = val.isoformat()
        elif isinstance(val, Decimal):
            out[key] = float(val)
        elif isinstance(val, (bytes, bytearray)):
            out[key] = val.decode("utf-8", errors="replace")
        else:
            out[key] = val
    return out


async def query(sql: str, params: list | None = None) -> list[dict]:
    """Execute a SELECT and return all rows as JSON-safe dicts."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, params or [])
            rows = await cur.fetchall()
            return [_serialize_row(r) for r in rows]


async def execute(sql: str, params: list | None = None) -> int:
    """Execute an INSERT/UPDATE/DELETE and return lastrowid."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, params or [])
            return cur.lastrowid


async def health_check() -> bool:
    """Verify database connectivity."""
    try:
        await query("SELECT 1")
        return True
    except Exception as e:
        print(f"[DB HEALTH_CHECK ERROR] {e}")
        return False


def reset_pool() -> None:
    """Discard the current pool so the next call to get_pool() creates a fresh one.
    Call this after running health_check() in a temporary event loop."""
    global _pool
    _pool = None


async def close_pool() -> None:
    """Close the pool on shutdown."""
    global _pool
    if _pool is not None:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
