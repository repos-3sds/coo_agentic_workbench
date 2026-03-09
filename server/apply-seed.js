/**
 * apply-seed.js — Execute a SQL seed file using a fresh mysql2 connection
 *   with multipleStatements:true so the entire file runs as one batch.
 * Usage:
 *   node server/apply-seed.js <path-to-sql-file>
 *   node server/apply-seed.js --env-file ./server/.env.railway <path-to-sql-file>
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

function parseArgs(argv) {
    const args = argv.slice(2);
    let envFile = path.join(__dirname, '.env');
    let sqlPath = null;

    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--env-file') {
            envFile = path.resolve(args[i + 1] || '');
            i++;
            continue;
        }
        if (a.startsWith('-')) continue;
        if (!sqlPath) sqlPath = a;
    }

    return { envFile, sqlPath };
}

const { envFile, sqlPath } = parseArgs(process.argv);
dotenv.config({ path: envFile });

const sqlFile = path.resolve(sqlPath || '../database/seed-npa-001-digital-asset-custody.sql');

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,   // ← execute the whole file at once
    });

    try {
        console.log(`Using env file: ${envFile}`);
        console.log(`Connected to ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        const sql = fs.readFileSync(sqlFile, 'utf8');
        console.log(`Executing: ${sqlFile} (${sql.length} bytes)`);

        await conn.query(sql);
        console.log('SQL executed successfully.');

        // Verification (best-effort; keep backward compatible across different seed files)
        const [[{ db }]] = await conn.query('SELECT DATABASE() AS db');
        console.log(`Database: ${db}`);

        const [[{ hasKbDocuments }]] = await conn.query(
            "SELECT COUNT(*) AS hasKbDocuments FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kb_documents'"
        );
        const [[{ hasEvidence }]] = await conn.query(
            "SELECT COUNT(*) AS hasEvidence FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'evidence_library'"
        );
        const [[{ hasFormData }]] = await conn.query(
            "SELECT COUNT(*) AS hasFormData FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'npa_form_data'"
        );

        if (hasKbDocuments) {
            const [[{ kbUiRows }]] = await conn.query(
                "SELECT COUNT(*) AS kbUiRows FROM kb_documents WHERE ui_category IS NOT NULL"
            );
            const [[{ kbTotalRows }]] = await conn.query("SELECT COUNT(*) AS kbTotalRows FROM kb_documents");
            console.log(`kb_documents: ${kbTotalRows} rows (${kbUiRows} UI-tagged)`);
        }

        if (hasEvidence) {
            const [[{ evidenceRows }]] = await conn.query(
                "SELECT COUNT(*) AS evidenceRows FROM evidence_library"
            );
            console.log(`evidence_library: ${evidenceRows} rows`);
        }

        if (!hasKbDocuments && !hasEvidence && hasFormData) {
            const [rows] = await conn.query(
                "SELECT project_id, COUNT(*) AS cnt FROM npa_form_data GROUP BY project_id ORDER BY project_id"
            );
            console.log('npa_form_data counts (by project):', JSON.stringify(rows));
        }

    } catch (err) {
        console.error('Error:', err.message);
        if (err.sql) console.error('SQL context:', err.sql.slice(0, 200));
        process.exit(1);
    } finally {
        await conn.end();
        process.exit(0);
    }
})();
