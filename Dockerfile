FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

ENV PYTHONPATH=/app/src/mcp_servers
EXPOSE 8000

CMD ["python", "src/mcp_servers/sa1_server.py"]
