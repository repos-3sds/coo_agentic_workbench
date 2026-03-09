function chunkArray(items, chunkSize) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const size = Math.max(1, Number(chunkSize) || 1);
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function toJsonOrNull(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
        try {
            JSON.parse(val);
            return val;
        } catch {
            return null;
        }
    }
    try {
        return JSON.stringify(val);
    } catch {
        return null;
    }
}

function toFieldValue(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    try {
        return JSON.stringify(val);
    } catch {
        return String(val);
    }
}

async function bulkUpsertNpaFormData(conn, projectId, fields, opts = {}) {
    const batchSize = Math.max(1, Number(opts.batchSize) || 400);
    const skipFalsyValue = Boolean(opts.skipFalsyValue);

    const normalized = (Array.isArray(fields) ? fields : [])
        .map((f) => ({
            field_key: f?.field_key ?? f?.key,
            field_value: toFieldValue(f?.field_value ?? f?.value),
            lineage: f?.lineage || 'MANUAL',
            confidence_score:
                f?.confidence_score !== undefined ? f.confidence_score :
                    (f?.confidence !== undefined ? f.confidence : null),
            metadata: toJsonOrNull(f?.metadata),
        }))
        .filter((f) => {
            if (!f.field_key) return false;
            if (skipFalsyValue && !f.field_value) return false;
            return true;
        });

    if (normalized.length === 0) return { rows: 0, batches: 0 };

    const batches = chunkArray(normalized, batchSize);
    let affected = 0;

    for (const batch of batches) {
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const sql = `
            INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata)
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE
                field_value = VALUES(field_value),
                lineage = VALUES(lineage),
                confidence_score = VALUES(confidence_score),
                metadata = VALUES(metadata)
        `;
        const params = [];
        for (const row of batch) {
            params.push(
                projectId,
                String(row.field_key),
                row.field_value,
                row.lineage,
                row.confidence_score,
                row.metadata
            );
        }

        const [result] = await conn.query(sql, params);
        affected += Number(result?.affectedRows || 0);
    }

    return { rows: normalized.length, batches: batches.length, affectedRows: affected };
}

module.exports = { bulkUpsertNpaFormData, chunkArray, toJsonOrNull, toFieldValue };

