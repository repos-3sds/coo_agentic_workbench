/**
 * Bulk-import local PDFs into kb_documents + uploads/kb for in-app viewing.
 *
 * Usage:
 *   node server/import-kb-pdfs.js /absolute/path/to/folder [UNIVERSAL|AGENT|WORKFLOW]
 *
 * Notes:
 * - This does NOT upload to Dify datasets. Do that separately for agent grounding.
 * - Requires DB migration 011_add_kb_document_files.sql to be applied.
 */

const { loadEnv } = require('./utils/load-env');
loadEnv();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

function sha256File(absPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}

function safeTitleFromFilename(name) {
  return name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
}

async function ensureSchema() {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS hasFilePath FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='kb_documents' AND COLUMN_NAME='file_path'"
  );
  if (!row?.hasFilePath) {
    throw new Error('KB schema missing file_path. Apply database/migrations/011_add_kb_document_files.sql first.');
  }
}

async function main() {
  const folder = process.argv[2];
  const category = String(process.argv[3] || 'UNIVERSAL').toUpperCase();

  if (!folder) {
    console.error('Missing folder arg. Example: node server/import-kb-pdfs.js Context/KB\\ Official\\ PDFs/pdfs UNIVERSAL');
    process.exit(1);
  }

  const absFolder = path.resolve(process.cwd(), folder);
  if (!fs.existsSync(absFolder) || !fs.statSync(absFolder).isDirectory()) {
    console.error('Folder not found:', absFolder);
    process.exit(1);
  }

  await ensureSchema();

  const uploadDir = path.join(__dirname, '..', 'uploads', 'kb');
  fs.mkdirSync(uploadDir, { recursive: true });

  const files = fs.readdirSync(absFolder).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (!files.length) {
    console.log('No PDFs found in:', absFolder);
    return;
  }

  let ok = 0;
  for (const f of files) {
    const src = path.join(absFolder, f);
    const hash = sha256File(src);
    const docId = `KB-${hash.slice(0, 12)}`; // deterministic per file content
    const outName = `${docId}__${path.basename(f).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const destAbs = path.join(uploadDir, outName);
    const relPath = path.posix.join('uploads', 'kb', outName);

    if (!fs.existsSync(destAbs)) fs.copyFileSync(src, destAbs);
    const size = fs.statSync(destAbs).size;

    const title = safeTitleFromFilename(f);
    const now = new Date();

    await db.query(
      `INSERT INTO kb_documents
        (doc_id, filename, doc_type, embedding_id, last_synced,
         title, description, ui_category, agent_target, icon_name, display_date,
         source_url, file_path, mime_type, file_size, sha256, visibility)
       VALUES (?, ?, 'REGULATORY', NULL, ?, ?, NULL, ?, NULL, 'file-text', NULL,
               NULL, ?, 'application/pdf', ?, ?, 'INTERNAL')
       ON DUPLICATE KEY UPDATE
         filename=VALUES(filename),
         last_synced=VALUES(last_synced),
         title=VALUES(title),
         ui_category=COALESCE(VALUES(ui_category), ui_category),
         file_path=VALUES(file_path),
         mime_type=VALUES(mime_type),
         file_size=VALUES(file_size),
         sha256=VALUES(sha256)`,
      [docId, f, now, title, category, relPath, size, hash]
    );

    ok++;
    console.log(`Imported: ${docId}  ${f}`);
  }

  console.log(`Done. Imported ${ok}/${files.length}.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
