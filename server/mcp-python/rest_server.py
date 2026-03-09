"""
REST API + MCP SSE Server — Port 3002
Exposes all NPA tools as:
  1. HTTP endpoints + auto-generated OpenAPI spec (for Dify Custom Tool import)
  2. MCP SSE transport at /sse (for Dify native MCP integration)

ARCHITECTURE FIX (2026-02-16):
  Previously, MCP SSE was mounted inside FastAPI via app.mount("/mcp", ...).
  This caused FastAPI's CORS middleware to interfere with MCP SSE streams,
  producing duplicate JSON responses ("Extra data" parse errors in Dify).

  Now we use a raw ASGI path router that splits traffic at the ASGI level:
    /mcp/*  → MCP SSE app (no FastAPI middleware)
    /*      → FastAPI REST app (with CORS middleware)
  Both share the same port (single-port deployment constraint).
"""
import os
import sys
import json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure tools/ is importable
sys.path.insert(0, os.path.dirname(__file__))

from registry import registry  # noqa: E402

# Import all tool modules so they self-register
import tools  # noqa: E402, F401

# Import the MCP server instance (already has all 71 tools registered)
from main import mcp_server  # noqa: E402

# DB health
from db import health_check  # noqa: E402

# Some hosting providers set PORT automatically; otherwise REST_PORT is used.
REST_PORT = int(os.getenv("PORT", os.getenv("REST_PORT", "3002")))

# ─── FastAPI REST app (with CORS middleware) ─────────────────────
rest_app = FastAPI(
    title="NPA Workbench MCP Tools API",
    description="REST API exposing MCP tools for NPA Multi-Agent Workbench. Import this spec into Dify as a Custom Tool provider.",
    version="1.0.0",
    servers=[{"url": os.getenv("PUBLIC_URL", f"http://localhost:{REST_PORT}"), "description": os.getenv("ENV", "Local development")}],
    # Disable FastAPI's built-in /openapi.json so our custom one is served
    openapi_url=None,
)

rest_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MCP SSE app (standalone — NO FastAPI middleware) ────────────
# FastMCP's sse_app() returns a Starlette app with /sse and /messages endpoints.
# It MUST run without CORS middleware to avoid duplicate JSON responses.
mcp_sse_app = mcp_server.sse_app()


# ─── ASGI Path Router — splits /mcp/* vs /* at the ASGI level ───
# This ensures MCP SSE traffic NEVER passes through FastAPI middleware.
class ASGIPathRouter:
    """Routes requests by path prefix to different ASGI apps.
    /mcp/* → MCP SSE app (strips /mcp prefix)
    /*     → FastAPI REST app
    """
    def __init__(self, mcp_app, rest_app):
        self.mcp_app = mcp_app
        self.rest_app = rest_app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path.startswith("/mcp"):
                # Strip /mcp prefix so SSE app sees /sse, /messages
                scope = dict(scope)
                scope["path"] = path[4:] or "/"
                scope["root_path"] = scope.get("root_path", "") + "/mcp"
                await self.mcp_app(scope, receive, send)
                return
        await self.rest_app(scope, receive, send)


# The top-level ASGI app — this is what uvicorn runs
app = ASGIPathRouter(mcp_app=mcp_sse_app, rest_app=rest_app)


# ─── Custom OpenAPI spec matching TypeScript output ───────────────

@rest_app.get("/openapi.json", include_in_schema=False)
async def openapi_spec():
    """Generate OpenAPI 3.0.3 spec identical to the TypeScript version."""
    all_tools = registry.get_all()
    paths = {}

    for td in all_tools:
        paths[f"/tools/{td.name}"] = {
            "post": {
                "operationId": td.name,
                "summary": td.description,
                "tags": [td.category],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": td.input_schema,
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Successful tool execution",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "data": {"type": "object"},
                                        "error": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }

    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "NPA Workbench MCP Tools API",
            "description": "REST API exposing MCP tools for NPA Multi-Agent Workbench. Import this spec into Dify as a Custom Tool provider.",
            "version": "1.0.0",
        },
        "servers": [
            {"url": os.getenv("PUBLIC_URL", f"http://localhost:{REST_PORT}"), "description": os.getenv("ENV", "Local development")},
        ],
        "paths": paths,
        "tags": [{"name": cat, "description": f"{cat} tools"} for cat in registry.get_categories()],
    }
    return JSONResponse(content=spec)


# ─── Tool listing endpoint ────────────────────────────────────────

@rest_app.get("/tools")
async def list_tools():
    all_tools = registry.get_all()
    return {
        "tools": [{"name": t.name, "description": t.description, "category": t.category} for t in all_tools],
        "count": len(all_tools),
    }


# ─── Dynamic tool execution ──────────────────────────────────────

@rest_app.api_route("/tools/{tool_name}", methods=["POST"], include_in_schema=False)
async def execute_tool(tool_name: str, request: Request):
    """Execute a tool by name. Matches POST /tools/{tool-name} from TypeScript."""
    td = registry.get_tool(tool_name)
    if td is None:
        return JSONResponse(status_code=404, content={"success": False, "error": f"Tool '{tool_name}' not found"})

    try:
        body = await request.json()
    except Exception:
        body = {}

    try:
        result = await td.handler(body)
        return JSONResponse(content={"success": result.success, "data": result.data, "error": result.error})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ─── Health check ─────────────────────────────────────────────────

@rest_app.get("/health")
async def health():
    db_ok = await health_check()
    return {
        "status": "ok",
        "server": "REST API for Dify",
        "dbOk": db_ok,
        "tools": registry.count(),
        "categories": registry.get_categories(),
        "openApiSpec": f"{os.getenv('PUBLIC_URL', f'http://localhost:{REST_PORT}')}/openapi.json",
    }


def start_rest_server():
    """Start the unified server (ASGI path router → REST + MCP SSE)."""
    import uvicorn
    public = os.getenv("PUBLIC_URL", f"http://localhost:{REST_PORT}")
    print(f"[SERVER]   Listening on http://0.0.0.0:{REST_PORT}")
    print(f"[SERVER]   ASGI path router: /mcp/* → MCP SSE, /* → FastAPI REST")
    print(f"[REST API] OpenAPI spec: {public}/openapi.json")
    print(f"[REST API] {registry.count()} tools exposed as POST /tools/{{name}}")
    print(f"[MCP SSE]  SSE endpoint: {public}/mcp/sse")
    print(f"[MCP SSE]  Messages endpoint: {public}/mcp/messages")
    print(f"[MCP SSE]  {registry.count()} tools via MCP protocol (CORS-free)")
    uvicorn.run(app, host="0.0.0.0", port=REST_PORT, log_level="info")


if __name__ == "__main__":
    start_rest_server()
