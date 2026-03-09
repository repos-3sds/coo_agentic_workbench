
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'npa_user',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'npa_password',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'npa_workbench',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 50,            // Cap queued requests to prevent infinite blocking
    connectTimeout: 5000,      // 5s connection timeout
    enableKeepAlive: true,     // Keep connections alive over long-lived Railway tunnels
    keepAliveInitialDelay: 30000, // Ping every 30s to detect dead connections
    idleTimeout: 60000         // Release idle connections after 60s
});

module.exports = pool.promise();
