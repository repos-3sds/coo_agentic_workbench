/**
 * DB Migrations — runs idempotent schema migrations at server startup.
 * Stub module: all DCE tables live on Railway and are managed via the MCP server.
 */

const db = require('../db');

async function runAllMigrations() {
    try {
        // Ensure core tables exist (idempotent CREATE IF NOT EXISTS)
        await db.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                domain VARCHAR(50),
                action VARCHAR(50),
                method VARCHAR(10),
                path VARCHAR(255),
                user_id VARCHAR(100),
                status_code INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[MIGRATIONS] Core tables verified.');
    } catch (err) {
        console.warn('[MIGRATIONS] Migration check failed (non-fatal):', err.message);
    }
}

module.exports = { runAllMigrations };
