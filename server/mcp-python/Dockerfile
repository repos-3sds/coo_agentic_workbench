# ─── NPA MCP Tools Server ─────────────────────────────────────
# Python 3.12 server exposing 78 MCP tools via single port:
#   - REST API + OpenAPI  at /tools, /openapi.json
#   - MCP SSE transport   at /mcp/sse
# ──────────────────────────────────────────────────────────────
FROM python:3.12-slim

LABEL maintainer="NPA Workbench Team" \
      description="MCP Tools Server for NPA Multi-Agent Workbench" \
      version="2.0.0"

# Security: run as non-root
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./
COPY tools/ ./tools/

# Non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port (REST + MCP SSE unified). Most hosts will set $PORT; default is 10000.
EXPOSE 10000

# Health check against REST API — uses PORT env var (defaults to 10000)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python3 -c "import os,urllib.request; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\",\"10000\")}/health')" || exit 1

# Start both servers (MCP SSE + REST API)
CMD ["python3", "start.py"]
