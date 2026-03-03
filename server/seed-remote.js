require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedRemote() {
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

        const sqlFilePath = path.join(__dirname, '..', 'database', 'npa_workbench_full_export.sql');
        console.log(`Reading SQL file from: ${sqlFilePath}`);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing SQL statements... This might take a moment.');
        await pool.query(sqlContent);

        console.log('Successfully seeded the remote database!');
        await pool.end();
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seedRemote();
