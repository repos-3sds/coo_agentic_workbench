-- Migration 002: Add Ideation/Concept fields to ref_npa_fields
-- These fields are used by ideation_save_concept tool to store
-- early-stage concept data before formal template filling begins.
--
-- The ideation_save_concept tool writes: concept_notes, product_rationale,
-- target_market, estimated_revenue. These must exist in ref_npa_fields
-- because npa_form_data.field_key has a FK constraint to ref_npa_fields.field_key.

-- 1. Add an Ideation section to both templates
INSERT IGNORE INTO ref_npa_sections (id, template_id, title, description, order_index)
VALUES
    ('SEC_IDEATION_FULL', 'FULL_NPA_V1', 'Ideation & Concept', 'Early-stage concept notes, rationale, and market analysis captured during ideation', -1),
    ('SEC_IDEATION_STD',  'STD_NPA_V2',  'Ideation & Concept', 'Early-stage concept notes, rationale, and market analysis captured during ideation', 0);

-- 2. Add the 4 concept fields (linked to FULL_NPA_V1 section; STD inherits via field_key)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index)
VALUES
    ('FLD_CONCEPT_NOTES',    'SEC_IDEATION_FULL', 'concept_notes',     'Concept Notes',      'text',    0, 'Freeform ideation and concept notes captured during initial product discussions', 1),
    ('FLD_PROD_RATIONALE',   'SEC_IDEATION_FULL', 'product_rationale', 'Product Rationale',   'text',    0, 'Business rationale and justification for the proposed product',                  2),
    ('FLD_TARGET_MARKET',    'SEC_IDEATION_FULL', 'target_market',     'Target Market',       'text',    0, 'Description of the target market segment and customer base',                     3),
    ('FLD_EST_REVENUE',      'SEC_IDEATION_FULL', 'estimated_revenue', 'Estimated Revenue',   'decimal', 0, 'Estimated annual revenue in USD',                                                4);
