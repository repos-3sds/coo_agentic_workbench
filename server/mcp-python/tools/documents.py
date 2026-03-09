"""
Document Tools — 4 tools
Document management: upload metadata, completeness checks, requirements lookup.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: upload_document_metadata ─────────────────────────────

UPLOAD_DOCUMENT_METADATA_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "document_name": {"type": "string", "description": "Name of the document"},
        "document_type": {"type": "string", "description": "Type (TERM_SHEET, CREDIT_REPORT, RISK_MEMO, LEGAL_OPINION, ISDA, TAX_ASSESSMENT)"},
        "file_size": {"type": "string", "description": "File size (e.g. '2.3 MB')"},
        "file_extension": {"type": "string", "description": "File extension (e.g. 'pdf')"},
        "category": {"type": "string", "description": "Document category"},
        "uploaded_by": {"type": "string", "description": "Name of person uploading"},
        "validation_status": {"type": "string", "description": "Validation status. Must be one of: VALID, PENDING, INVALID, WARNING. Defaults to PENDING"},
        "validation_stage": {"type": "string", "description": "Validation stage (AUTOMATED, BUSINESS, RISK, COMPLIANCE, LEGAL, FINAL)"},
        "criticality": {"type": "string", "description": "Document criticality. Must be one of: CRITICAL, IMPORTANT, OPTIONAL"},
        "required_by_stage": {"type": "string", "description": "Stage this doc is required by (CHECKER, SIGN_OFF, LAUNCH)"},
        "doc_requirement_id": {"type": "integer", "description": "FK to ref_document_requirements"},
    },
    "required": ["project_id", "document_name", "document_type"],
}


async def upload_document_metadata_handler(inp: dict) -> ToolResult:
    row_id = await execute(
        """INSERT INTO npa_documents
               (project_id, document_name, document_type, file_size, file_extension,
                category, uploaded_by, validation_status, validation_stage,
                criticality, required_by_stage, doc_requirement_id, uploaded_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
        [inp["project_id"], inp["document_name"], inp["document_type"],
         inp.get("file_size"), inp.get("file_extension"),
         inp.get("category"), inp.get("uploaded_by"),
         inp.get("validation_status", "PENDING"),
         inp.get("validation_stage"),
         inp.get("criticality"),
         inp.get("required_by_stage"),
         inp.get("doc_requirement_id")],
    )

    return ToolResult(success=True, data={
        "document_id": row_id,
        "project_id": inp["project_id"],
        "document_name": inp["document_name"],
        "document_type": inp["document_type"],
        "validation_status": inp.get("validation_status", "PENDING"),
    })


# ─── Tool 2: check_document_completeness ─────────────────────────

CHECK_DOCUMENT_COMPLETENESS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "stage": {"type": "string", "description": "Check completeness for a specific stage (CHECKER, SIGN_OFF, LAUNCH)"},
    },
    "required": ["project_id"],
}


async def check_document_completeness_handler(inp: dict) -> ToolResult:
    # Get the project's approval track to filter requirements
    project = await query(
        "SELECT approval_track FROM npa_projects WHERE id = %s",
        [inp["project_id"]],
    )
    approval_track = project[0]["approval_track"] if project else "FULL_NPA"

    # Get requirements that apply
    requirements = await query(
        """SELECT id, doc_code, doc_name, category, criticality, required_for, required_by_stage
           FROM ref_document_requirements
           WHERE required_for IN ('ALL', %s)
           ORDER BY order_index""",
        [approval_track],
    )

    # If stage filter, narrow down
    if inp.get("stage"):
        requirements = [r for r in requirements if r.get("required_by_stage") == inp["stage"] or not r.get("required_by_stage")]

    # Get uploaded documents
    uploaded = await query(
        """SELECT document_type, validation_status, doc_requirement_id
           FROM npa_documents
           WHERE project_id = %s""",
        [inp["project_id"]],
    )
    uploaded_req_ids = {d["doc_requirement_id"] for d in uploaded if d.get("doc_requirement_id")}
    uploaded_types = {d["document_type"] for d in uploaded}

    missing = []
    present = []
    for req in requirements:
        found = req["id"] in uploaded_req_ids or req.get("doc_code") in uploaded_types
        entry = {
            "requirement_id": req["id"],
            "doc_code": req["doc_code"],
            "doc_name": req["doc_name"],
            "criticality": req["criticality"],
            "required_by_stage": req.get("required_by_stage"),
        }
        if found:
            present.append(entry)
        else:
            missing.append(entry)

    critical_missing = [m for m in missing if m["criticality"] == "CRITICAL"]
    is_complete = len(critical_missing) == 0

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "approval_track": approval_track,
        "stage_filter": inp.get("stage"),
        "is_complete": is_complete,
        "missing": missing,
        "present": present,
        "summary": {
            "total_required": len(requirements),
            "present": len(present),
            "missing": len(missing),
            "critical_missing": len(critical_missing),
            "completion_pct": round((len(present) / len(requirements)) * 100) if requirements else 100,
        },
    })


# ─── Tool 3: get_document_requirements ────────────────────────────

GET_DOCUMENT_REQUIREMENTS_SCHEMA = {
    "type": "object",
    "properties": {
        "approval_track": {"type": "string", "description": "Filter by approval track (FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN). Defaults to ALL"},
        "category": {"type": "string", "description": "Filter by category (CORE, CONDITIONAL, SUPPLEMENTARY)"},
    },
}


async def get_document_requirements_handler(inp: dict) -> ToolResult:
    conditions = []
    params = []

    if inp.get("approval_track") and inp["approval_track"] != "ALL":
        conditions.append("(required_for = 'ALL' OR required_for = %s)")
        params.append(inp["approval_track"])
    if inp.get("category"):
        conditions.append("category = %s")
        params.append(inp["category"])

    where = f" WHERE {' AND '.join(conditions)}" if conditions else ""

    reqs = await query(
        f"""SELECT id, doc_code, doc_name, description, category, criticality,
                   required_for, source, template_available, required_by_stage, order_index
            FROM ref_document_requirements{where}
            ORDER BY order_index""",
        params,
    )

    # Also get conditional rules
    rules = await query("SELECT * FROM ref_document_rules ORDER BY id")

    return ToolResult(success=True, data={
        "requirements": reqs,
        "conditional_rules": rules,
        "summary": {
            "total": len(reqs),
            "critical": len([r for r in reqs if r["criticality"] == "CRITICAL"]),
            "important": len([r for r in reqs if r["criticality"] == "IMPORTANT"]),
            "optional": len([r for r in reqs if r["criticality"] == "OPTIONAL"]),
        },
    })


# ─── Tool 4: validate_document ──────────────────────────────────

VALIDATE_DOCUMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "document_id": {"type": "integer", "description": "Document ID to validate"},
        "validation_status": {"type": "string", "description": "Validation result. Must be one of: VALID, INVALID, WARNING"},
        "validation_stage": {"type": "string", "description": "Validation stage (AUTOMATED, BUSINESS, RISK, COMPLIANCE, LEGAL, FINAL)"},
        "validation_notes": {"type": "string", "description": "Notes about the validation result"},
        "validated_by": {"type": "string", "description": "Who performed the validation"},
    },
    "required": ["document_id", "validation_status"],
}


async def validate_document_handler(inp: dict) -> ToolResult:
    # Check document exists
    docs = await query(
        "SELECT id, project_id, document_name, document_type, validation_status FROM npa_documents WHERE id = %s",
        [inp["document_id"]],
    )
    if not docs:
        return ToolResult(success=False, error=f"Document ID {inp['document_id']} not found")

    doc = docs[0]
    await execute(
        """UPDATE npa_documents
           SET validation_status = %s, validation_stage = %s
           WHERE id = %s""",
        [inp["validation_status"], inp.get("validation_stage"), inp["document_id"]],
    )

    return ToolResult(success=True, data={
        "document_id": inp["document_id"],
        "project_id": doc["project_id"],
        "document_name": doc["document_name"],
        "previous_status": doc["validation_status"],
        "new_status": inp["validation_status"],
        "validation_stage": inp.get("validation_stage"),
    })


# ─── Tool 5: doc_lifecycle_validate ──────────────────────────────
# Used by DOC_LIFECYCLE agent to run automated validation across all docs for an NPA

DOC_LIFECYCLE_VALIDATE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "validations_json": {
            "type": "string",
            "description": "JSON string array of document validation results. Each object requires: document_id (integer), validation_status (one of VALID, INVALID, WARNING). Optional: validation_stage (string), validation_notes (string). Example: [{\"document_id\":1,\"validation_status\":\"VALID\",\"validation_stage\":\"AUTOMATED\"}]",
        },
    },
    "required": ["project_id", "validations_json"],
}


async def doc_lifecycle_validate_handler(inp: dict) -> ToolResult:
    # Accept validations as JSON string or direct array
    validations_raw = inp.get("validations_json") or inp.get("validations", [])
    if isinstance(validations_raw, str):
        validations_raw = json.loads(validations_raw)

    results = []
    for v in validations_raw:
        docs = await query("SELECT id, document_name, validation_status FROM npa_documents WHERE id = %s AND project_id = %s",
                           [v["document_id"], inp["project_id"]])
        if not docs:
            results.append({"document_id": v["document_id"], "error": "Not found"})
            continue

        await execute(
            """UPDATE npa_documents
               SET validation_status = %s, validation_stage = %s
               WHERE id = %s""",
            [v["validation_status"], v.get("validation_stage"), v["document_id"]],
        )
        results.append({
            "document_id": v["document_id"],
            "document_name": docs[0]["document_name"],
            "previous_status": docs[0]["validation_status"],
            "new_status": v["validation_status"],
        })

    # After validating all docs, check completeness
    completeness = await check_document_completeness_handler({"project_id": inp["project_id"]})

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "validations_applied": len([r for r in results if "error" not in r]),
        "results": results,
        "completeness": completeness.data if completeness.success else None,
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="upload_document_metadata", description="Record document metadata for an NPA (name, type, size, validation status). Does not handle file storage.", category="documents", input_schema=UPLOAD_DOCUMENT_METADATA_SCHEMA, handler=upload_document_metadata_handler),
    ToolDefinition(name="check_document_completeness", description="Check whether all required documents have been uploaded for an NPA, optionally filtered by stage.", category="documents", input_schema=CHECK_DOCUMENT_COMPLETENESS_SCHEMA, handler=check_document_completeness_handler),
    ToolDefinition(name="get_document_requirements", description="Get the master list of document requirements, optionally filtered by approval track and category.", category="documents", input_schema=GET_DOCUMENT_REQUIREMENTS_SCHEMA, handler=get_document_requirements_handler),
    ToolDefinition(name="validate_document", description="Validate a specific document and update its validation status and stage.", category="documents", input_schema=VALIDATE_DOCUMENT_SCHEMA, handler=validate_document_handler),
    ToolDefinition(name="doc_lifecycle_validate", description="Batch-validate all documents for an NPA. Used by DOC_LIFECYCLE agent to run automated validation and check completeness.", category="documents", input_schema=DOC_LIFECYCLE_VALIDATE_SCHEMA, handler=doc_lifecycle_validate_handler),
])
