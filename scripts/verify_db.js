
const mysql = require('mysql2/promise');

async function verifyTables() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'npa_user',
            password: 'npa_password',
            database: 'npa_workbench',
            port: 3306
        });

        console.log('✅ Connected to MariaDB!');

        const [rows] = await connection.execute('SHOW TABLES');
        console.log('\nExisting Tables:');
        rows.forEach(row => {
            console.log(`- ${Object.values(row)[0]}`);
        });

        // Check for specific Phase 3 tables
        const tables = rows.map(r => Object.values(r)[0]);
        const required = [
            'npa_projects',
            'npa_intake_assessments',
            'npa_classification_scorecards',
            'npa_workflow_states',
            'ref_document_rules'
        ];

        const missing = required.filter(t => !tables.includes(t));

        if (missing.length === 0) {
            console.log('\n✅ All Phase 3 & Core tables created successfully!');
        } else {
            console.error('\n❌ Missing tables:', missing);
            process.exit(1);
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

verifyTables();
