/**
 * Knowledge Base Document Files
 *
 * Stores and serves KB PDFs so:
 *  - Users can view PDFs inside the UI
 *  - Agents can be asked questions about the same docs (docs must also be uploaded to Dify datasets)
 *
 * Design:
 *  - kb_documents remains the registry table (metadata + optional file/link fields)
 *  - Files are stored under /uploads/kb (local FS; prod can later migrate to S3/R2)
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const axios = require('axios');
const FormData = require('form-data');

// ─── Storage ────────────────────────────────────────────────────────────────

let multer;
let upload;
try {
    multer = require('multer');

    const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'kb');
    if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadRoot),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf';
            const safeBase = path.basename(file.originalname || 'document', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            const docId = String(req.body.doc_id || '').trim() || `KB-${crypto.randomUUID()}`;
            // Keep a timestamp to avoid collisions if doc_id reused intentionally
            cb(null, `${docId}__${safeBase}__${Date.now()}${ext}`);
        }
    });

    const fileFilter = (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (!['.pdf', '.md', '.mmd'].includes(ext)) {
            return cb(new Error('Only PDF or Markdown (.md/.mmd) uploads are supported for Knowledge Base.'));
        }
        cb(null, true);
    };

    upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 } // 50MB
    });
} catch (e) {
    console.warn('[KB] multer not installed. KB upload endpoints will return 501.');
    upload = null;
}

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
}

async function downloadToFile(url, destPath) {
    const resp = await axios.get(url, { responseType: 'stream', timeout: 60_000 });
    await new Promise((resolve, reject) => {
        const w = fs.createWriteStream(destPath);
        resp.data.pipe(w);
        w.on('finish', resolve);
        w.on('error', reject);
    });
    const stat = fs.statSync(destPath);
    return { size: stat.size, contentType: resp.headers?.['content-type'] };
}

function formatAxiosError(e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    const snippet =
        typeof data === 'string'
            ? data.slice(0, 300)
            : data
              ? JSON.stringify(data).slice(0, 300)
              : '';
    const base = e?.message || 'Request failed';
    return status ? `${base} (HTTP ${status})${snippet ? `: ${snippet}` : ''}` : base;
}

function resolveKbPath(relPath) {
    const baseDir = path.join(__dirname, '..', '..'); // repo root
    const abs = path.resolve(baseDir, relPath);
    const uploadsDir = path.resolve(baseDir, 'uploads');
    if (!abs.startsWith(uploadsDir + path.sep) && abs !== uploadsDir) {
        throw new Error('Invalid file path');
    }
    return abs;
}

// ─── Routes ────────────────────────────────────────────────────────────────

// GET /api/kb/:docId — metadata for a KB doc (includes file/link fields)
router.get('/:docId', requireAuth(), async (req, res) => {
    try {
        const docId = String(req.params.docId);
        const [rows] = await db.query('SELECT * FROM kb_documents WHERE doc_id = ?', [docId]);
        if (!rows.length) return res.status(404).json({ error: 'KB document not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[KB] Fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch KB document' });
    }
});

// GET /api/kb/:docId/file — stream PDF (or redirect to source_url if no local file)
router.get('/:docId/file', requireAuth(), async (req, res) => {
    try {
        const docId = String(req.params.docId);
        const [rows] = await db.query(
            'SELECT doc_id, filename, file_path, mime_type, source_url FROM kb_documents WHERE doc_id = ?',
            [docId]
        );
        if (!rows.length) return res.status(404).json({ error: 'KB document not found' });
        const doc = rows[0];

        if (doc.file_path) {
            const abs = resolveKbPath(String(doc.file_path));
            if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing on server' });
            res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
            // Inline so browser can view
            res.setHeader('Content-Disposition', `inline; filename="${doc.filename || `${doc.doc_id}.pdf`}"`);
            return res.sendFile(abs);
        }

        if (doc.source_url) {
            return res.redirect(302, String(doc.source_url));
        }

        return res.status(404).json({ error: 'No file or source URL for this KB document' });
    } catch (err) {
        console.error('[KB] File serve error:', err.message);
        res.status(500).json({ error: 'Failed to serve KB document file' });
    }
});

// POST /api/kb/upload — upload a PDF and register/update kb_documents
const uploadHandler = upload ? upload.single('file') : null;

router.post('/upload', requireAuth(), (req, res) => {
    if (!uploadHandler) {
        return res.status(501).json({ error: 'File upload not available. Install server dependency: multer' });
    }

    uploadHandler(req, res, async (err) => {
        if (err) {
            if (multer && err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
            return res.status(400).json({ error: err.message || 'Upload failed' });
        }

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        try {
            const now = new Date();
            const docId = String(req.body.doc_id || '').trim() || `KB-${crypto.randomUUID()}`;
            const title = String(req.body.title || '').trim() || path.basename(req.file.originalname, path.extname(req.file.originalname));
            const description = String(req.body.description || '').trim() || null;
            const docType = String(req.body.doc_type || 'REGULATORY').trim().toUpperCase();
            const uiCategory = req.body.ui_category ? String(req.body.ui_category).trim().toUpperCase() : null;
            const agentTarget = req.body.agent_target ? String(req.body.agent_target).trim() : null;
            const iconName = req.body.icon_name ? String(req.body.icon_name).trim() : 'file-text';
            const displayDate = req.body.display_date ? String(req.body.display_date).trim() : null;
            const visibility = req.body.visibility ? String(req.body.visibility).trim().toUpperCase() : 'INTERNAL';
            const sourceUrl = req.body.source_url ? String(req.body.source_url).trim() : null;

            const relPath = path.posix.join('uploads', 'kb', path.basename(req.file.path));
            const hash = sha256File(req.file.path);

            try {
                await db.query(
                `INSERT INTO kb_documents
                 (doc_id, filename, doc_type, embedding_id, last_synced,
                  title, description, ui_category, agent_target, icon_name, display_date,
                  source_url, file_path, mime_type, file_size, sha256, visibility)
                 VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   filename=VALUES(filename),
                   doc_type=VALUES(doc_type),
                   last_synced=VALUES(last_synced),
                   title=VALUES(title),
                   description=VALUES(description),
                   ui_category=COALESCE(VALUES(ui_category), ui_category),
                   agent_target=COALESCE(VALUES(agent_target), agent_target),
                   icon_name=COALESCE(VALUES(icon_name), icon_name),
                   display_date=COALESCE(VALUES(display_date), display_date),
                   source_url=COALESCE(VALUES(source_url), source_url),
                   file_path=VALUES(file_path),
                   mime_type=VALUES(mime_type),
                   file_size=VALUES(file_size),
                   sha256=VALUES(sha256),
                   visibility=VALUES(visibility)`,
                [
                    docId,
                    req.file.originalname,
                    docType,
                    now,
                    title,
                    description,
                    uiCategory,
                    agentTarget,
                    iconName,
                    displayDate,
                    sourceUrl,
                    relPath,
                    req.file.mimetype ||
                        (path.extname(req.file.originalname || '').toLowerCase() === '.pdf'
                            ? 'application/pdf'
                            : 'text/markdown'),
                    req.file.size,
                    hash,
                    visibility
                ]
                );
            } catch (schemaErr) {
                const msg = String(schemaErr?.message || '');
                if (msg.includes('Unknown column') || msg.includes('ER_BAD_FIELD_ERROR')) {
                    return res.status(400).json({
                        error: 'KB schema missing file/link columns. Apply DB migration database/migrations/011_add_kb_document_files.sql and retry.'
                    });
                }
                throw schemaErr;
            }

            res.json({
                status: 'UPLOADED',
                doc_id: docId,
                title,
                filename: req.file.originalname,
                file_path: relPath,
                sha256: hash,
                view_url: `/api/kb/${encodeURIComponent(docId)}/file`
            });
        } catch (dbErr) {
            console.error('[KB] DB upsert failed:', dbErr.message);
            res.status(500).json({ error: 'Failed to register KB document in DB' });
        }
    });
});

// PATCH /api/kb/:docId/meta — update KB metadata in our DB (optionally propagate to Dify if linked + file exists)
router.patch('/:docId/meta', requireAuth(), async (req, res) => {
    try {
        const docId = String(req.params.docId || '').trim();
        if (!docId) return res.status(400).json({ error: 'docId is required' });

        const [rows] = await db.query('SELECT * FROM kb_documents WHERE doc_id = ?', [docId]);
        const doc = rows[0];
        if (!doc) return res.status(404).json({ error: 'KB doc not found' });

        const patch = {
            title: req.body.title !== undefined ? String(req.body.title || '').trim() : undefined,
            description: req.body.description !== undefined ? String(req.body.description || '').trim() : undefined,
            ui_category: req.body.ui_category !== undefined ? String(req.body.ui_category || '').trim().toUpperCase() : undefined,
            doc_type: req.body.doc_type !== undefined ? String(req.body.doc_type || '').trim().toUpperCase() : undefined,
            agent_target: req.body.agent_target !== undefined ? (String(req.body.agent_target || '').trim() || null) : undefined,
            icon_name: req.body.icon_name !== undefined ? String(req.body.icon_name || '').trim() : undefined,
            visibility: req.body.visibility !== undefined ? String(req.body.visibility || '').trim().toUpperCase() : undefined,
            display_date: req.body.display_date !== undefined ? (String(req.body.display_date || '').trim() || null) : undefined,
            source_url: req.body.source_url !== undefined ? (String(req.body.source_url || '').trim() || null) : undefined,
        };

        const sets = [];
        const values = [];
        for (const [k, v] of Object.entries(patch)) {
            if (v === undefined) continue;
            sets.push(`${k} = ?`);
            values.push(v);
        }
        if (sets.length > 0) {
            values.push(docId);
            await db.query(`UPDATE kb_documents SET ${sets.join(', ')} WHERE doc_id = ?`, values);
        }

        // Optional: propagate name changes back to Dify (best-effort).
        // Requires kb_documents.embedding_id formatted like "<dataset_uuid>:<document_uuid>" AND a local file copy.
        const propagate = req.body.propagate_to_dify === true || String(req.body.propagate_to_dify || '').toLowerCase() === 'true';
        let dify = null;
        if (propagate) {
            const embedding = String(doc.embedding_id || '').trim();
            const m = embedding.match(/^([0-9a-f-]{36}):([0-9a-f-]{36})$/i);
            if (m) {
                const datasetId = m[1];
                const difyDocId = m[2];
                const apiKey = String(process.env.DIFY_DATASET_API_KEY || '').trim();
                const baseUrl = String(process.env.DIFY_API_BASE || 'https://api.dify.ai/v1').trim();
                const newName = patch.title !== undefined ? patch.title : (String(doc.title || '').trim() || null);

                try {
                    if (!apiKey) throw new Error('Missing server env: DIFY_DATASET_API_KEY');
                    if (!newName) throw new Error('title is required to propagate to Dify');

                    const rel = String(doc.file_path || '').trim();
                    const abs = rel ? path.join(__dirname, '..', '..', rel) : null;
                    const mime = String(doc.mime_type || '').toLowerCase();
                    const filename = String(doc.filename || '').toLowerCase();
                    const isMarkdown = mime.includes('markdown') || filename.endsWith('.md') || filename.endsWith('.mmd');
                    const isPdf = mime.includes('pdf') || filename.endsWith('.pdf');

                    if (!abs || !fs.existsSync(abs)) {
                        throw new Error('Cannot propagate: local file is missing for this doc');
                    }

                    if (isMarkdown) {
                        const text = fs.readFileSync(abs, 'utf8');
                        await axios.post(
                            `${baseUrl}/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(difyDocId)}/update_by_text`,
                            { name: newName, text, process_rule: { mode: 'automatic' } },
                            { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 60_000 }
                        );
                        dify = { ok: true, mode: 'update_by_text' };
                    } else if (isPdf) {
                        const form = new FormData();
                        form.append('file', fs.createReadStream(abs), { filename: path.basename(abs) });
                        form.append('data', JSON.stringify({ name: newName, indexing_technique: 'high_quality', process_rule: { mode: 'automatic' } }));
                        await axios.post(
                            `${baseUrl}/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(difyDocId)}/update-by-file`,
                            form,
                            { headers: { ...form.getHeaders(), Authorization: `Bearer ${apiKey}` }, timeout: 120_000 }
                        );
                        dify = { ok: true, mode: 'update-by-file' };
                    } else {
                        throw new Error('Cannot propagate: unsupported mime_type for Dify update');
                    }
                } catch (e) {
                    const detail = e?.response?.data ? JSON.stringify(e.response.data).slice(0, 800) : (e?.message || 'Dify update failed');
                    dify = { ok: false, error: detail };
                }
            } else {
                dify = { ok: false, error: 'No linked Dify embedding_id (expected dataset_uuid:document_uuid)' };
            }
        }

        const [updatedRows] = await db.query('SELECT * FROM kb_documents WHERE doc_id = ?', [docId]);
        res.json({ doc: updatedRows[0], dify });
    } catch (err) {
        console.error('[KB] meta update failed:', err.message);
        res.status(500).json({ error: 'Failed to update KB doc metadata' });
    }
});

// POST /api/kb/dify/sync — import PDFs from a Dify Dataset into kb_documents + local /uploads/kb
// Body: { dataset_id, ui_category, doc_type?, agent_target?, icon_name?, visibility? }
router.post('/dify/sync', requireAuth(), async (req, res) => {
    try {
        const apiKey = String(process.env.DIFY_DATASET_API_KEY || '').trim();
        const baseUrl = String(process.env.DIFY_API_BASE || 'https://api.dify.ai/v1').trim();
        if (!apiKey) return res.status(400).json({ error: 'Missing server env: DIFY_DATASET_API_KEY' });

        const datasetRefRaw = String(req.body?.dataset_id || '').trim();
        if (!datasetRefRaw) return res.status(400).json({ error: 'dataset_id is required' });

        const uiCategory = String(req.body?.ui_category || 'UNIVERSAL').trim().toUpperCase();
        const docType = String(req.body?.doc_type || 'REGULATORY').trim().toUpperCase();
        const agentTarget = req.body?.agent_target ? String(req.body.agent_target).trim() : null;
        const iconName = req.body?.icon_name ? String(req.body.icon_name).trim() : 'file-text';
        const visibility = String(req.body?.visibility || 'INTERNAL').trim().toUpperCase();

        const client = axios.create({
            baseURL: baseUrl,
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 30_000
        });

        const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

        // Dify API expects dataset_id to be a UUID. If caller provides a name, resolve via GET /datasets?keyword=...
        let datasetId = datasetRefRaw;
        if (!isUuid(datasetId)) {
            // Common mistake: pasting API key/token (dat-...) or masked dataset-* string.
            if (/^(dat|dataset)-/i.test(datasetId)) {
                return res.status(400).json({
                    error:
                        'Invalid dataset_id. Dify dataset_id must be a UUID (not a token starting with dat-/dataset-). ' +
                        'Please paste the Knowledge Base UUID from Dify (or enter the KB name and we will resolve it).'
                });
            }

            const resolved = [];
            let page = 1;
            const limit = 100;
            for (;;) {
                const r = await client.get('/datasets', { params: { keyword: datasetRefRaw, page, limit } });
                const items = r?.data?.data || [];
                if (Array.isArray(items)) resolved.push(...items);
                if (!r?.data?.has_more || !Array.isArray(items) || items.length < limit) break;
                page += 1;
                if (page > 10) break; // safety cap
            }

            const exact = resolved.filter(d => String(d?.name || '').trim().toLowerCase() === datasetRefRaw.toLowerCase());
            const candidates = (exact.length ? exact : resolved).slice(0, 5);

            if (!candidates.length) {
                return res.status(404).json({
                    error:
                        'Knowledge Base not found in Dify for the given dataset_id/name. ' +
                        'Please paste the KB UUID (recommended) or the exact KB name.',
                });
            }

            if (candidates.length > 1 && !exact.length) {
                return res.status(409).json({
                    error: 'Multiple knowledge bases matched. Please paste the KB UUID or use an exact name.',
                    candidates: candidates.map(c => ({ id: c.id, name: c.name }))
                });
            }

            datasetId = String(candidates[0].id || '').trim();
            if (!isUuid(datasetId)) {
                return res.status(400).json({ error: 'Failed to resolve dataset UUID from Dify.' });
            }
        }

        const collected = [];
        let page = 1;
        const limit = 50;
        for (;;) {
            const r = await client.get(`/datasets/${encodeURIComponent(datasetId)}/documents`, { params: { page, limit } });
            const items = r?.data?.data || r?.data?.documents || [];
            if (!Array.isArray(items) || items.length === 0) break;
            collected.push(...items);
            if (items.length < limit) break;
            page += 1;
            if (page > 50) break; // safety cap
        }

        const results = { dataset_id: datasetId, imported: 0, skipped: 0, errors: 0, docs: [] };

        const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'kb');
        if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

        for (const doc of collected) {
            const difyDocId = String(doc?.id || doc?.document_id || doc?.documentId || '').trim();
            const name = String(doc?.name || doc?.title || difyDocId || 'document').trim();
            if (!difyDocId) {
                results.skipped += 1;
                continue;
            }

            try {
                // Get document detail (includes data_source_info, indexing_status, etc.)
                const detailResp = await client.get(`/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(difyDocId)}`);
                const detail = detailResp?.data || {};
                const dataSourceInfo = detail?.data_source_info || detail?.data_source_info || {};
                const dataSourceType = String(detail?.data_source_type || detail?.data_source_type || '').toLowerCase();

                const stableDocId = `DIFY-${difyDocId}`;
                const now = new Date();

                // Attempt to download the original PDF if Dify exposes a file_id.
                // Note: Dify Knowledge API does not always provide a file download endpoint.
                // If we cannot fetch bytes, we still register metadata + source_url (if any).
                let relPath = null;
                let mimeType = null;
                let fileSize = null;
                let sha256 = null;

                const candidateUrl =
                    (typeof dataSourceInfo?.url === 'string' && dataSourceInfo.url.trim()) ||
                    (typeof detail?.source_url === 'string' && detail.source_url.trim()) ||
                    null;

                const fileId =
                    (typeof dataSourceInfo?.file_id === 'string' && dataSourceInfo.file_id.trim()) ||
                    (typeof dataSourceInfo?.fileId === 'string' && dataSourceInfo.fileId.trim()) ||
                    null;

                if (fileId) {
                    try {
                        // This is documented for message/workflow uploads; may or may not work for KB docs.
                        const safeBase = String(name).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'document';
                        const localName = `${stableDocId}__${safeBase}__${Date.now()}.pdf`;
                        const absPath = path.join(uploadRoot, localName);
                        const rel = path.posix.join('uploads', 'kb', localName);
                        const dl = await downloadToFile(`${baseUrl.replace(/\/v1$/, '')}/v1/files/${encodeURIComponent(fileId)}/preview?as_attachment=true`, absPath);
                        const ct = (dl.contentType || 'application/pdf').split(';')[0];
                        if (ct !== 'application/pdf') {
                            try { fs.unlinkSync(absPath); } catch { /* ignore */ }
                        } else {
                            relPath = rel;
                            mimeType = ct;
                            fileSize = dl.size;
                            sha256 = sha256File(absPath);
                        }
                    } catch (e) {
                        // fall back to metadata only
                    }
                }

                await db.query(
                    `INSERT INTO kb_documents
                     (doc_id, filename, doc_type, embedding_id, last_synced,
                      title, description, ui_category, agent_target, icon_name, display_date,
                      source_url, file_path, mime_type, file_size, sha256, visibility)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                       filename=VALUES(filename),
                       doc_type=VALUES(doc_type),
                       embedding_id=VALUES(embedding_id),
                       last_synced=VALUES(last_synced),
                       title=VALUES(title),
                       description=VALUES(description),
                       ui_category=COALESCE(VALUES(ui_category), ui_category),
                       agent_target=COALESCE(VALUES(agent_target), agent_target),
                       icon_name=COALESCE(VALUES(icon_name), icon_name),
                       source_url=COALESCE(VALUES(source_url), source_url),
                       file_path=VALUES(file_path),
                       mime_type=VALUES(mime_type),
                       file_size=VALUES(file_size),
                       sha256=VALUES(sha256),
                       visibility=VALUES(visibility)`,
                    [
                        stableDocId,
                        detail?.name || name,
                        docType,
                        `${datasetId}:${difyDocId}`,
                        now,
                        String(detail?.name || name).replace(/\.pdf$/i, ''),
                        `Synced from Dify KB ${datasetId} (${dataSourceType || 'source'}).`,
                        uiCategory,
                        agentTarget,
                        iconName,
                        null,
                        candidateUrl,
                        relPath,
                        mimeType,
                        fileSize,
                        sha256,
                        visibility
                    ]
                );

                results.imported += 1;
                results.docs.push({
                    doc_id: stableDocId,
                    title: name,
                    status: 'IMPORTED',
                    downloaded_pdf: !!relPath,
                    source_url: !!candidateUrl
                });
            } catch (e) {
                results.errors += 1;
                results.docs.push({ doc_id: `DIFY-${difyDocId}`, title: name, status: 'ERROR', reason: formatAxiosError(e) });
            }
        }

        res.json(results);
    } catch (err) {
        const msg = String(err?.message || '');
        if (msg.includes('Unknown column') || msg.includes('ER_BAD_FIELD_ERROR')) {
            return res.status(400).json({
                error: 'KB schema missing file/link columns. Apply DB migration database/migrations/011_add_kb_document_files.sql and retry.'
            });
        }
        console.error('[KB] Dify sync error:', err.message);
        res.status(500).json({ error: 'Failed to sync from Dify dataset' });
    }
});

module.exports = router;
