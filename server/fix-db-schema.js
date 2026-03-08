require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixSchema() {
    console.log('Connecting to remote DB:', process.env.DB_HOST);
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            multipleStatements: true
        });

        console.log('Running ALTER TABLE statements on agent_sessions...');
        const sql = `
            ALTER TABLE agent_sessions ADD COLUMN title VARCHAR(255) DEFAULT 'New Chat';
            ALTER TABLE agent_sessions ADD COLUMN preview VARCHAR(255) DEFAULT NULL;
            ALTER TABLE agent_sessions ADD COLUMN domain_agent_json TEXT DEFAULT NULL;
            ALTER TABLE agent_sessions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
        `;
        await pool.query(sql);

        console.log('Successfully added missing columns to agent_sessions!');
        await pool.end();
    } catch (err) {
        console.error('Error altering database:', err);
        process.exit(1);
    }
}

fixSchema();
