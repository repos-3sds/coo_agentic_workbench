/**
 * Document Upload & Management (GAP-018)
 *
 * Provides file upload (via multer), metadata storage,
 * and document validation status tracking.
 *
 * Documents are stored locally in /uploads/ for dev
 * (production would use S3/GCS/Azure Blob).
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');

// Attempt to load multer; fall back gracefully if not installed
let multer;
let upload;
try {
    multer = require('multer');

    // Configure multer storage
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const projectDir = path.join(uploadDir, req.params.id || 'unlinked');
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
            }
            cb(null, projectDir);
        },
        filename: (req, file, cb) => {
            const timestamp = Date.now();
            const ext = path.extname(file.originalname);
            const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            cb(null, `${base}_${timestamp}${ext}`);
        }
    });

    // File filter: allow common document types
    const fileFilter = (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.json', '.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not allowed. Supported: ${allowedTypes.join(', ')}`));
        }
    };

    upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
    });
} catch (e) {
    // multer not installed — endpoints will return 501
    console.warn('[DOCUMENTS] multer not installed. File upload endpoints will return 501.');
    upload = null;
}

// GET /api/documents/npas/:id — List all documents for an NPA
router.get('/npas/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_documents WHERE project_id = ? ORDER BY uploaded_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[DOCUMENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/documents/npas/:id/requirements — Documents vs requirements matrix
router.get('/npas/:id/requirements', async (req, res) => {
    try {
        const [requirements] = await db.query(
            'SELECT * FROM ref_document_requirements ORDER BY required_by_stage, order_index'
        );
        const [documents] = await db.query(
            'SELECT * FROM npa_documents WHERE project_id = ? ORDER BY uploaded_at DESC',
            [req.params.id]
        );
        res.json({ requirements, documents });
    } catch (err) {
        console.error('[DOCUMENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/documents/npas/:id/upload — Upload a document
const uploadHandler = upload ? upload.single('file') : null;

router.post('/npas/:id/upload', (req, res, next) => {
    if (!uploadHandler) {
        return res.status(501).json({ error: 'File upload not available. Install multer: npm install multer' });
    }
    uploadHandler(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const { document_type, category, required_by_stage, doc_requirement_id } = req.body;
            const file = req.file;

            const [result] = await db.query(
                `INSERT INTO npa_documents
                 (project_id, document_name, document_type, file_size, file_extension, category,
                  validation_status, uploaded_by, required_by_stage, doc_requirement_id)
                 VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
                [
                    req.params.id,
                    file.originalname,
                    document_type || 'OTHER',
                    `${(file.size / 1024).toFixed(1)}KB`,
                    path.extname(file.originalname),
                    category || null,
                    req.body.uploaded_by || 'user',
                    required_by_stage || null,
                    doc_requirement_id || null
                ]
            );

            await db.query(
                `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
                 VALUES (?, ?, 'DOCUMENT_UPLOADED', ?, 0)`,
                [req.params.id, req.body.uploaded_by || 'user', JSON.stringify({
                    document_id: result.insertId,
                    name: file.originalname,
                    size: file.size,
                    type: document_type
                })]
            );

            res.json({
                id: result.insertId,
                status: 'UPLOADED',
                filename: file.originalname,
                size: file.size,
                path: file.path
            });
        } catch (dbErr) {
            console.error('[DOCUMENTS ERROR]', dbErr.message);
            const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : dbErr.message;
            res.status(500).json({ error: errorMsg });
        }
    });
});

// PUT /api/documents/:docId/validate — Update document validation status
router.put('/:docId/validate', async (req, res) => {
    const { validation_status, validation_stage, validation_notes, validated_by } = req.body;
    try {
        const validStatuses = ['VALID', 'PENDING', 'INVALID', 'WARNING'];
        if (validation_status && !validStatuses.includes(validation_status)) {
            return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` });
        }

        await db.query(
            `UPDATE npa_documents SET validation_status = ?, validation_stage = ?
             WHERE id = ?`,
            [validation_status || 'PENDING', validation_stage || null, req.params.docId]
        );

        res.json({ status: 'UPDATED' });
    } catch (err) {
        console.error('[DOCUMENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// DELETE /api/documents/:docId — Remove a document
router.delete('/:docId', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM npa_documents WHERE id = ?', [req.params.docId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({ status: 'DELETED' });
    } catch (err) {
        console.error('[DOCUMENTS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
