"""
AutoFill Tools — 5 tools
Powers the Template AutoFill Agent: get template structure, populate fields with lineage tracking.
Mirrors server/mcp/src/tools/autofill.ts exactly.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


def _normalize_field_type(value) -> str:
    if not value:
        return ""
    v = str(value).strip().lower()
    v = v.replace("_", "-")
    # Canonicalize to UI-supported vocabulary where possible
    if v in ("select", "radio"):
        return "dropdown"
    if v in ("multi-select", "multi_select"):
        return "multiselect"
    if v in ("multiselect",):
        return "multiselect"
    if v in ("dropdown",):
        return "dropdown"
    if v in ("checkbox-group", "checkboxgroup"):
        return "checkbox_group"
    if v in ("yes/no", "yes-no", "yesno", "yes_no"):
        return "yesno"
    return v


OPTION_FIELD_TYPES = {
    "dropdown",
    "multiselect",
    "checkbox_group",
    "yesno",
    # legacy/variants
    "select",
    "multi-select",
    "radio",
    "checkbox-group",
    "yes/no",
}


# ─── Tool 1: autofill_get_template_fields ─────────────────────────

GET_TEMPLATE_FIELDS_SCHEMA = {
    "type": "object",
    "properties": {
        "template_id": {"type": "string", "description": "Template ID to retrieve. Valid values: FULL_NPA_V1 or STD_NPA_V2. Defaults to STD_NPA_V2 if not provided"},
        "section_id": {"type": "string", "description": "Filter to a specific section (e.g. SEC_PROD, SEC_RISK, SEC_BASIC)"},
    },
}


async def autofill_get_template_fields_handler(inp: dict) -> ToolResult:
    template_id = inp.get("template_id", "STD_NPA_V2")
    section_sql = "SELECT s.id, s.title, s.description, s.order_index FROM ref_npa_sections s WHERE s.template_id = %s"
    section_params: list = [template_id]

    if inp.get("section_id"):
        section_sql += " AND s.id = %s"
        section_params.append(inp["section_id"])
    section_sql += " ORDER BY s.order_index"

    sections = await query(section_sql, section_params)

    result = []
    for section in sections:
        fields = await query(
            """SELECT f.id, f.field_key, f.label, f.field_type, f.is_required, f.tooltip, f.order_index
               FROM ref_npa_fields f WHERE f.section_id = %s ORDER BY f.order_index""",
            [section["id"]],
        )
        for field in fields:
            ft = _normalize_field_type(field.get("field_type"))
            field["field_type"] = ft
            if ft in OPTION_FIELD_TYPES:
                options = await query(
                    "SELECT value, label, order_index FROM ref_field_options WHERE field_id = %s ORDER BY order_index",
                    [field["id"]],
                )
                field["options"] = options

        result.append({**section, "fields": fields, "field_count": len(fields)})

    return ToolResult(success=True, data={
        "template_id": template_id,
        "sections": result,
        "total_sections": len(result),
        "total_fields": sum(s["field_count"] for s in result),
    })


# ─── Tool 2: autofill_populate_field ──────────────────────────────

POPULATE_FIELD_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "field_key": {"type": "string", "description": "Field key from the template (e.g., product_name, risk_level)"},
        "value": {"type": "string", "description": "Value to fill in"},
        "lineage": {"type": "string", "description": "How this value was determined. Must be one of: AUTO, ADAPTED, MANUAL"},
        "confidence_score": {"type": "number", "description": "AI confidence in the auto-filled value 0-100. Defaults to 90"},
        "metadata_json": {"type": "string", "description": "JSON string of additional metadata about the auto-fill decision"},
    },
    "required": ["project_id", "field_key", "value", "lineage"],
}


async def autofill_populate_field_handler(inp: dict) -> ToolResult:
    confidence = inp.get("confidence_score", 90)
    # Accept metadata as string or dict
    metadata = inp.get("metadata_json") or inp.get("metadata")
    if isinstance(metadata, str):
        metadata_str = metadata
    elif metadata:
        metadata_str = json.dumps(metadata)
    else:
        metadata_str = None

    await execute(
        """INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON DUPLICATE KEY UPDATE
              field_value = VALUES(field_value),
              lineage = VALUES(lineage),
              confidence_score = VALUES(confidence_score),
              metadata = VALUES(metadata)""",
        [inp["project_id"], inp["field_key"], inp["value"], inp["lineage"],
         confidence, metadata_str],
    )
    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "field_key": inp["field_key"],
        "lineage": inp["lineage"],
        "confidence_score": confidence,
    })


# ─── Tool 3: autofill_populate_batch ──────────────────────────────

POPULATE_BATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "fields_json": {
            "type": "string",
            "description": "JSON string array of fields to populate. Each object requires: field_key (string), value (string). Optional: lineage (AUTO, ADAPTED, or MANUAL — defaults to AUTO), confidence_score (number 0-100, defaults to 90). Example: [{\"field_key\":\"product_name\",\"value\":\"FX Options\",\"lineage\":\"AUTO\",\"confidence_score\":95}]",
        },
    },
    "required": ["project_id", "fields_json"],
}


async def autofill_populate_batch_handler(inp: dict) -> ToolResult:
    # Accept fields as JSON string or direct array
    fields_raw = inp.get("fields_json") or inp.get("fields", [])
    if isinstance(fields_raw, str):
        fields_raw = json.loads(fields_raw)

    results = []
    success_count = 0
    error_count = 0

    for field in fields_raw:
        try:
            await execute(
                """INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score)
                   VALUES (%s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                      field_value = VALUES(field_value),
                      lineage = VALUES(lineage),
                      confidence_score = VALUES(confidence_score)""",
                [inp["project_id"], field["field_key"], field["value"],
                 field.get("lineage", "AUTO"), field.get("confidence_score", 90)],
            )
            results.append({"field_key": field["field_key"], "status": "ok"})
            success_count += 1
        except Exception as e:
            results.append({"field_key": field["field_key"], "status": "error", "error": str(e)})
            error_count += 1

    return ToolResult(success=error_count == 0, data={
        "project_id": inp["project_id"],
        "total": len(fields_raw),
        "success_count": success_count,
        "error_count": error_count,
        "results": results,
    })


# ─── Tool 4: autofill_get_form_data ───────────────────────────────

GET_FORM_DATA_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "section_id": {"type": "string", "description": "Filter to fields in a specific section"},
    },
    "required": ["project_id"],
}


async def autofill_get_form_data_handler(inp: dict) -> ToolResult:
    sql = """SELECT fd.id, fd.field_key, fd.field_value, fd.lineage, fd.confidence_score, fd.metadata,
                    f.label, f.field_type, f.is_required, f.section_id, s.title as section_title
             FROM npa_form_data fd
             LEFT JOIN ref_npa_fields f ON f.field_key = fd.field_key
             LEFT JOIN ref_npa_sections s ON s.id = f.section_id
             WHERE fd.project_id = %s"""
    params: list = [inp["project_id"]]

    if inp.get("section_id"):
        sql += " AND f.section_id = %s"
        params.append(inp["section_id"])
    sql += " ORDER BY s.order_index, f.order_index"

    form_data = await query(sql, params)

    # Get total field count for the relevant template (determined by project's approval_track)
    # FULL_NPA → FULL_NPA_V1, everything else → STD_NPA_V2
    project_row = await query("SELECT approval_track FROM npa_projects WHERE id = %s", [inp["project_id"]])
    approval_track = project_row[0].get("approval_track", "STD") if project_row else "STD"
    tpl_id = "FULL_NPA_V1" if approval_track == "FULL_NPA" else "STD_NPA_V2"
    total_fields = await query(
        """SELECT COUNT(*) as cnt FROM ref_npa_fields f
           JOIN ref_npa_sections s ON s.id = f.section_id
           WHERE s.template_id = %s""",
        [tpl_id],
    )
    total_count = total_fields[0].get("cnt", 0) if total_fields else 0
    filled_count = len(form_data)
    auto_count = sum(1 for f in form_data if f.get("lineage") == "AUTO")

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "form_data": form_data,
        "coverage": {
            "filled": filled_count,
            "total": total_count,
            "percentage": round((filled_count / total_count) * 100) if total_count > 0 else 0,
            "auto_filled": auto_count,
            "adapted": sum(1 for f in form_data if f.get("lineage") == "ADAPTED"),
            "manual": sum(1 for f in form_data if f.get("lineage") == "MANUAL"),
        },
    })


# ─── Tool 5: autofill_get_field_options ───────────────────────────

GET_FIELD_OPTIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "field_id": {"type": "string", "description": "Field ID to get options for (dropdown/multiselect/etc.)"},
    },
    "required": ["field_id"],
}


async def autofill_get_field_options_handler(inp: dict) -> ToolResult:
    options = await query(
        "SELECT value, label, order_index FROM ref_field_options WHERE field_id = %s ORDER BY order_index",
        [inp["field_id"]],
    )
    field = await query(
        "SELECT id, field_key, label, field_type FROM ref_npa_fields WHERE id = %s",
        [inp["field_id"]],
    )
    return ToolResult(success=True, data={
        "field": field[0] if field else None,
        "options": options,
        "count": len(options),
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="autofill_get_template_fields", description="Get all sections and fields for an NPA template. Valid template_ids: 'STD_NPA_V2' (72 fields, 10 sections, default) or 'FULL_NPA_V1' (30 fields, 8 sections). Returns complete form structure with field types, requirements, and tooltips.", category="autofill", input_schema=GET_TEMPLATE_FIELDS_SCHEMA, handler=autofill_get_template_fields_handler),
    ToolDefinition(name="autofill_populate_field", description="Fill a single template field with lineage tracking. Uses UPSERT to update existing values.", category="autofill", input_schema=POPULATE_FIELD_SCHEMA, handler=autofill_populate_field_handler),
    ToolDefinition(name="autofill_populate_batch", description="Fill multiple template fields at once with lineage tracking. Efficient batch operation for auto-filling entire sections.", category="autofill", input_schema=POPULATE_BATCH_SCHEMA, handler=autofill_populate_batch_handler),
    ToolDefinition(name="autofill_get_form_data", description="Get current form state for an NPA. Returns all filled fields with their values, lineage, and confidence scores.", category="autofill", input_schema=GET_FORM_DATA_SCHEMA, handler=autofill_get_form_data_handler),
    ToolDefinition(name="autofill_get_field_options", description="Get dropdown/select options for a specific template field.", category="autofill", input_schema=GET_FIELD_OPTIONS_SCHEMA, handler=autofill_get_field_options_handler),
])
