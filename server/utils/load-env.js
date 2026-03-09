const path = require('path');
const fs = require('fs');

/**
 * Load environment variables for the server.
 *
 * Default: server/.env
 * Override: set ENV_FILE to an absolute path, or a path relative to repo root
 * (or server/ as a convenience).
 *
 * Example:
 *   ENV_FILE=server/.env.railway node server/index.js
 *   ENV_FILE=.env.railway node server/index.js
 */
function loadEnv() {
    const dotenv = require('dotenv');
    const serverDir = path.resolve(__dirname, '..');
    const repoRoot = path.resolve(serverDir, '..');

    const defaultEnv = path.resolve(serverDir, '.env');

    let envFile = defaultEnv;
    if (process.env.ENV_FILE) {
        // 1) Absolute path
        if (path.isAbsolute(process.env.ENV_FILE)) {
            envFile = process.env.ENV_FILE;
        } else {
            // 2) Relative to repo root
            const fromRoot = path.resolve(repoRoot, process.env.ENV_FILE);
            // 3) Relative to server/ (common when running from server dir)
            const fromServer = path.resolve(serverDir, process.env.ENV_FILE);
            envFile = fs.existsSync(fromRoot) ? fromRoot : fromServer;
        }
    }

    // If ENV_FILE points to a missing file, fall back to server/.env
    if (!fs.existsSync(envFile)) envFile = defaultEnv;

    dotenv.config({ path: envFile, quiet: true });
    return envFile;
}

module.exports = { loadEnv };
