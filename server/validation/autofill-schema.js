/**
 * Zod validation schemas for AUTOFILL data.
 *
 * Validates field data before it's persisted to npa_form_data.
 * Used at two boundaries:
 *   1. POST /api/npas/:id/prefill/persist  — after deterministic pre-fill
 *   2. POST /api/npas/:id/autofill/persist — after LLM streaming completes
 */

const { z } = require('zod');

// ── Single autofill field ──
const AutofillFieldSchema = z.object({
   field_key: z.string().min(1).max(100),
   // npa_form_data.field_value is TEXT (up to ~64KB). Allow larger narratives while still bounding payload size.
   value: z.string().max(60000), // Allow empty string for clearing a field
   lineage: z.enum(['AUTO', 'ADAPTED', 'MANUAL']).default('AUTO'),
   // mysql2 often returns DECIMAL as string; accept "0.88" as well as numbers.
   confidence: z.preprocess(
      (v) => (v === undefined || v === null || v === '' ? null : v),
      z.coerce.number().min(0).max(100).nullable()
   ).optional(),
   source: z.string().max(500).optional().nullable(),
   strategy: z.enum(['RULE', 'COPY', 'LLM', 'MANUAL']).optional(),
});

// ── Batch persist request ──
const PersistBatchSchema = z.object({
   // Template is currently 339 fields; allow a full-template persist in one request.
   filled_fields: z.array(AutofillFieldSchema).min(1).max(400),
});

// ── Prefill response shape (for documentation / client validation) ──
const PrefillResponseSchema = z.object({
   npa_id: z.string(),
   similar_npa_id: z.string().nullable(),
   similar_npa_title: z.string().nullable(),
   filled_fields: z.array(AutofillFieldSchema),
   summary: z.object({
      rule_count: z.number(),
      copy_count: z.number(),
      total_prefilled: z.number(),
      remaining_for_llm: z.string(),
   }),
});

// ── LLM streaming field (JSONL line format from Dify) ──
const LlmStreamFieldSchema = z.object({
   field_key: z.string().min(1),
   value: z.string(),
   lineage: z.enum(['AUTO', 'ADAPTED']).default('AUTO'),
   confidence: z.preprocess(
      (v) => (v === undefined || v === null || v === '' ? undefined : v),
      z.coerce.number().min(0).max(100)
   ).optional(),
   source: z.string().optional(),
   document_section: z.string().optional(),
   label: z.string().optional(),
});

/**
 * Validate a batch of filled fields before DB persist.
 * Returns { success: true, data } or { success: false, errors }.
 */
function validatePersistBatch(body) {
   const result = PersistBatchSchema.safeParse(body);
   if (result.success) {
      return { success: true, data: result.data };
   }
   return {
      success: false,
      errors: result.error.issues.map(issue => ({
         path: issue.path.join('.'),
         message: issue.message,
      })),
   };
}

/**
 * Validate a single LLM stream field (from JSONL parsing).
 * Returns the validated object or null if invalid.
 */
function validateStreamField(fieldObj) {
   const result = LlmStreamFieldSchema.safeParse(fieldObj);
   return result.success ? result.data : null;
}

/**
 * Express middleware: validate req.body as a persist batch.
 * Responds with 400 + error details on failure.
 */
function validatePersistMiddleware(req, res, next) {
   const validation = validatePersistBatch(req.body);
   if (!validation.success) {
      return res.status(400).json({
         error: 'Validation failed',
         details: validation.errors,
      });
   }
   req.validatedBody = validation.data;
   next();
}

module.exports = {
   AutofillFieldSchema,
   PersistBatchSchema,
   PrefillResponseSchema,
   LlmStreamFieldSchema,
   validatePersistBatch,
   validateStreamField,
   validatePersistMiddleware,
};
