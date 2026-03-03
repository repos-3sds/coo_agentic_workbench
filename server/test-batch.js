require('dotenv').config();
const mysql = require('mysql2/promise');

async function testBatch() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        const sessionId = "test_insert_" + Date.now();
        console.log("Creating session:", sessionId);
        await pool.query(
            `INSERT INTO agent_sessions (id, title, user_id) VALUES (?, ?, ?)`,
            [sessionId, 'Test', 'user1']
        );

        const isoTimestamp = new Date().toISOString();
        console.log("Inserting message with timestamp:", isoTimestamp);

        await pool.query(
            `INSERT INTO agent_messages (session_id, role, content, agent_identity_id, timestamp, metadata)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sessionId, 'user', 'hello', null, isoTimestamp, null]
        );

        console.log("Success!");
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

testBatch();
