"""
KB Search Tools — 3 tools
Knowledge base document search and retrieval.
Used by Ideation, AutoFill, Diligence, Risk, and Classification agents.
"""
from registry import ToolDefinition, ToolResult, registry
from db import query


# ─── Tool 1: search_kb_documents ─────────────────────────────────

SEARCH_KB_DOCUMENTS_SCHEMA = {
    "type": "object",
    "properties": {
        "search_term": {"type": "string", "description": "Search query for knowledge base documents"},
        "doc_type": {"type": "string", "description": "Filter by document type (e.g. POLICY, REGULATION, GUIDELINE, TEMPLATE, FAQ)"},
        "limit": {"type": "integer", "description": "Max results to return. Defaults to 10"},
    },
    "required": ["search_term"],
}


async def search_kb_documents_handler(inp: dict) -> ToolResult:
    conditions = ["(filename LIKE %s OR doc_type LIKE %s)"]
    search = f"%{inp['search_term']}%"
    params = [search, search]

    if inp.get("doc_type"):
        conditions.append("doc_type = %s")
        params.append(inp["doc_type"])

    limit = inp.get("limit", 10)
    params.append(limit)

    docs = await query(
        f"""SELECT doc_id, filename, doc_type, embedding_id, last_synced
            FROM kb_documents
            WHERE {' AND '.join(conditions)}
            ORDER BY last_synced DESC
            LIMIT %s""",
        params,
    )

    return ToolResult(success=True, data={
        "query": inp["search_term"],
        "results": docs,
        "total": len(docs),
    })


# ─── Tool 2: get_kb_document_by_id ───────────────────────────────

GET_KB_DOCUMENT_BY_ID_SCHEMA = {
    "type": "object",
    "properties": {
        "doc_id": {"type": "string", "description": "Knowledge base document ID"},
    },
    "required": ["doc_id"],
}


async def get_kb_document_by_id_handler(inp: dict) -> ToolResult:
    rows = await query(
        "SELECT doc_id, filename, doc_type, embedding_id, last_synced FROM kb_documents WHERE doc_id = %s",
        [inp["doc_id"]],
    )

    if not rows:
        return ToolResult(success=False, error=f"KB document '{inp['doc_id']}' not found")

    return ToolResult(success=True, data={"document": rows[0]})


# ─── Tool 3: list_kb_sources ─────────────────────────────────────

LIST_KB_SOURCES_SCHEMA = {
    "type": "object",
    "properties": {
        "doc_type": {"type": "string", "description": "Filter by document type"},
    },
}


async def list_kb_sources_handler(inp: dict) -> ToolResult:
    if inp.get("doc_type"):
        docs = await query(
            "SELECT doc_id, filename, doc_type, last_synced FROM kb_documents WHERE doc_type = %s ORDER BY filename",
            [inp["doc_type"]],
        )
    else:
        docs = await query(
            "SELECT doc_id, filename, doc_type, last_synced FROM kb_documents ORDER BY doc_type, filename",
        )

    # Group by type
    by_type = {}
    for d in docs:
        dt = d.get("doc_type", "UNKNOWN")
        by_type.setdefault(dt, []).append(d)

    return ToolResult(success=True, data={
        "sources": docs,
        "by_type": {k: len(v) for k, v in by_type.items()},
        "total": len(docs),
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="search_kb_documents", description="Search the knowledge base for documents by keyword, with optional type filtering. Used for RAG context.", category="kb_search", input_schema=SEARCH_KB_DOCUMENTS_SCHEMA, handler=search_kb_documents_handler),
    ToolDefinition(name="get_kb_document_by_id", description="Retrieve a specific knowledge base document by ID with its metadata and embedding reference.", category="kb_search", input_schema=GET_KB_DOCUMENT_BY_ID_SCHEMA, handler=get_kb_document_by_id_handler),
    ToolDefinition(name="list_kb_sources", description="List all available knowledge base sources, optionally filtered by document type.", category="kb_search", input_schema=LIST_KB_SOURCES_SCHEMA, handler=list_kb_sources_handler),
])
