-- Migration 007: Normalize ref_npa_fields.field_type vocabulary (Feb 23, 2026)
--
-- Goal:
--   Ensure a canonical field-type taxonomy across DB/API/UI/MCP.
--   The UI renderer expects: dropdown, multiselect, yesno, checkbox_group, etc.
--   Legacy values like select, multi-select, radio can break rendering.
--
-- Safe to run multiple times.

UPDATE ref_npa_fields
SET field_type = 'dropdown'
WHERE LOWER(TRIM(field_type)) IN ('select', 'radio');

UPDATE ref_npa_fields
SET field_type = 'multiselect'
WHERE LOWER(TRIM(field_type)) IN ('multi-select', 'multi_select');

UPDATE ref_npa_fields
SET field_type = 'checkbox_group'
WHERE LOWER(TRIM(field_type)) IN ('checkbox-group', 'checkboxgroup');

UPDATE ref_npa_fields
SET field_type = 'yesno'
WHERE LOWER(TRIM(field_type)) IN ('yes/no', 'yes_no', 'yes-no');

