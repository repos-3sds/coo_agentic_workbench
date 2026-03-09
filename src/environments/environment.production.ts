/**
 * Production environment — Express serves both Angular static files and API
 * on the same origin, so apiBaseUrl stays empty (relative paths).
 *
 * If deploying Angular separately (e.g. GitHub Pages), set apiBaseUrl to the
 * Railway Express URL: e.g. 'https://your-app.up.railway.app'
 */
export const environment = {
    production: true,
    apiBaseUrl: ''
};
