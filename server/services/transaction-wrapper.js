/**
 * Transaction Wrapper
 *
 * Provides a reusable database transaction pattern that eliminates
 * ~200 lines of duplicated BEGIN/COMMIT/ROLLBACK boilerplate across
 * transition, approval, and other route files.
 *
 * Usage:
 *   const { withTransaction } = require('../services/transaction-wrapper');
 *   const db = require('../db');
 *
 *   // Simple usage:
 *   const result = await withTransaction(db, async (conn) => {
 *       const [rows] = await conn.query('SELECT ...', [params]);
 *       await conn.query('UPDATE ...', [params]);
 *       return rows;
 *   });
 *
 *   // In route handlers (with asyncHandler):
 *   router.post('/:id/submit', asyncHandler(async (req, res) => {
 *       const result = await withTransaction(db, async (conn) => {
 *           // ... all DB operations within transaction
 *           return { status: 'OK', data: ... };
 *       });
 *       res.json(result);
 *   }));
 *
 * @module services/transaction-wrapper
 */

/**
 * Execute a function within a database transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 *
 * @param {object} db - Database pool (must have getConnection())
 * @param {function(conn): Promise<T>} fn - Async function receiving the connection
 * @returns {Promise<T>} Result of the function
 * @throws Will re-throw any error after rolling back
 */
async function withTransaction(db, fn) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const result = await fn(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * Execute a SELECT FOR UPDATE within a transaction.
 * Common pattern: lock a row, validate state, perform mutation.
 *
 * @param {object} db - Database pool
 * @param {string} table - Table name
 * @param {string} id - Row ID to lock
 * @param {function(conn, row): Promise<T>} fn - Function receiving connection and locked row
 * @returns {Promise<T>} Result of the function
 * @throws AppError(404) if row not found
 */
async function withLockedRow(db, table, id, fn) {
    const { AppError } = require('../middleware/error-handler');

    return withTransaction(db, async (conn) => {
        const [rows] = await conn.query(
            `SELECT * FROM ${table} WHERE id = ? FOR UPDATE`,
            [id]
        );
        if (rows.length === 0) {
            throw AppError.notFound(table.replace(/^npa_/, '').replace(/_/g, ' '));
        }
        return fn(conn, rows[0]);
    });
}

module.exports = { withTransaction, withLockedRow };
