/**
 * Async Handler Wrapper
 *
 * Wraps async Express route handlers to automatically catch errors
 * and forward them to Express error-handling middleware.
 *
 * Eliminates the need for try/catch blocks in every route handler.
 *
 * Usage:
 *   const { asyncHandler } = require('../middleware/async-handler');
 *   router.get('/items', asyncHandler(async (req, res) => {
 *       const items = await service.getAll();
 *       res.json(items);
 *   }));
 *
 * If the async function throws, the error is forwarded to the
 * centralized error handler (error-handler.js) via next(err).
 */

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = { asyncHandler };
