/**
 * Centralized Error Handling Middleware
 *
 * Provides consistent error response formatting across all routes.
 * Replaces 17+ duplicate try/catch patterns in route files.
 *
 * Error Types:
 *   - AppError: application-level errors with status codes
 *   - Validation errors: 400 with details array
 *   - DB errors: mapped to user-friendly messages
 *   - Unknown errors: 500 with safe message in production
 *
 * Usage:
 *   // At the end of Express app setup (after all routes):
 *   const { errorHandler, AppError } = require('./middleware/error-handler');
 *   app.use(errorHandler);
 *
 *   // In route handlers (with asyncHandler):
 *   throw new AppError('Project not found', 404);
 *   throw AppError.notFound('Project');
 *   throw AppError.badRequest('Title is required');
 *   throw AppError.forbidden('Compliance gate blocked', { gate: 'PAC' });
 */

/**
 * Custom application error with HTTP status code and optional details.
 */
class AppError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code (default 500)
     * @param {object} [details] - Additional error context
     */
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; // Distinguishes from programming errors
    }

    static notFound(entity = 'Resource') {
        return new AppError(`${entity} not found`, 404);
    }

    static badRequest(message, details = null) {
        return new AppError(message, 400, details);
    }

    static forbidden(message, details = null) {
        return new AppError(message, 403, details);
    }

    static conflict(message, details = null) {
        return new AppError(message, 409, details);
    }

    static gatewayTimeout(message = 'Request timeout') {
        return new AppError(message, 504);
    }
}

/**
 * Known DB error code mappings → user-friendly responses.
 */
const DB_ERROR_MAP = {
    'ER_NO_REFERENCED_ROW_2': {
        status: 400,
        message: 'Referenced record does not exist. Check foreign key values.'
    },
    'ER_ROW_IS_REFERENCED_2': {
        status: 409,
        message: 'Cannot delete: record is referenced by other data.'
    },
    'ER_DUP_ENTRY': {
        status: 409,
        message: 'Duplicate entry. A record with this key already exists.'
    },
    'ER_NO_SUCH_TABLE': {
        status: 500,
        message: 'Database table not found. Run pending migrations.'
    },
    'ER_BAD_FIELD_ERROR': {
        status: 500,
        message: 'Database column not found. Run pending migrations.'
    }
};

/**
 * Express error-handling middleware.
 * Must be registered AFTER all routes: app.use(errorHandler);
 */
function errorHandler(err, req, res, _next) {
    // Already sent headers — let Express default handler close the connection
    if (res.headersSent) {
        return _next(err);
    }

    // 1. Application errors (AppError)
    if (err.isOperational) {
        const response = { error: err.message };
        if (err.details) response.details = err.details;
        console.error(`[${req.method} ${req.originalUrl}] ${err.statusCode}: ${err.message}`);
        return res.status(err.statusCode).json(response);
    }

    // 2. Known DB errors
    const dbMapping = DB_ERROR_MAP[err.code];
    if (dbMapping) {
        console.error(`[${req.method} ${req.originalUrl}] DB ${err.code}: ${err.message}`);
        return res.status(dbMapping.status).json({ error: dbMapping.message });
    }

    // 3. JSON parse errors (malformed request body)
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }

    // 4. Unknown / programming errors
    console.error(`[${req.method} ${req.originalUrl}] Unhandled Error:`, err.stack || err.message);
    const errorMsg = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    return res.status(500).json({ error: errorMsg });
}

module.exports = { errorHandler, AppError };
