/**
 * Unit Tests — Transaction Wrapper
 *
 * Tests withTransaction() and withLockedRow() from services/transaction-wrapper.js
 * Uses mock database pool/connection objects (no real DB required).
 *
 * Run:  node --test server/tests/unit/transaction-wrapper.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withTransaction, withLockedRow } = require('../../services/transaction-wrapper');

// ─── Mock DB factory ────────────────────────────────────────────────────────

function createMockDb(options = {}) {
    const log = [];
    const conn = {
        beginTransaction: async () => { log.push('BEGIN'); },
        commit: async () => { log.push('COMMIT'); },
        rollback: async () => { log.push('ROLLBACK'); },
        release: () => { log.push('RELEASE'); },
        query: async (sql, params) => {
            log.push({ query: sql, params });
            if (options.queryResult) {
                return options.queryResult(sql, params);
            }
            return [[], []]; // default: empty result
        }
    };

    const db = {
        getConnection: async () => {
            log.push('GET_CONNECTION');
            if (options.connectionError) {
                throw options.connectionError;
            }
            return conn;
        }
    };

    return { db, conn, log };
}

// ─── withTransaction ────────────────────────────────────────────────────────

describe('withTransaction', () => {
    it('should execute BEGIN, fn, COMMIT, RELEASE on success', async () => {
        const { db, log } = createMockDb();

        const result = await withTransaction(db, async (conn) => {
            return 'success-value';
        });

        assert.equal(result, 'success-value');
        assert.deepEqual(log, ['GET_CONNECTION', 'BEGIN', 'COMMIT', 'RELEASE']);
    });

    it('should execute BEGIN, ROLLBACK, RELEASE on error', async () => {
        const { db, log } = createMockDb();

        await assert.rejects(
            withTransaction(db, async () => {
                throw new Error('tx-failure');
            }),
            { message: 'tx-failure' }
        );

        assert.deepEqual(log, ['GET_CONNECTION', 'BEGIN', 'ROLLBACK', 'RELEASE']);
    });

    it('should pass connection to callback function', async () => {
        const { db, conn } = createMockDb();
        let receivedConn = null;

        await withTransaction(db, async (c) => {
            receivedConn = c;
        });

        assert.equal(receivedConn, conn, 'Callback should receive the connection object');
    });

    it('should allow queries within transaction', async () => {
        const { db, log } = createMockDb({
            queryResult: (sql) => {
                if (sql.includes('SELECT')) return [[{ id: 1, name: 'test' }], []];
                return [{ affectedRows: 1 }, []];
            }
        });

        const result = await withTransaction(db, async (conn) => {
            const [rows] = await conn.query('SELECT * FROM test WHERE id = ?', [1]);
            await conn.query('UPDATE test SET name = ? WHERE id = ?', ['updated', 1]);
            return rows[0];
        });

        assert.equal(result.id, 1);
        assert.equal(result.name, 'test');
        // Verify transaction lifecycle + 2 queries
        assert.equal(log.filter(x => typeof x === 'string' && x === 'BEGIN').length, 1);
        assert.equal(log.filter(x => typeof x === 'string' && x === 'COMMIT').length, 1);
        assert.equal(log.filter(x => typeof x === 'object').length, 2);
    });

    it('should always release connection even if rollback throws', async () => {
        const log = [];
        const conn = {
            beginTransaction: async () => { log.push('BEGIN'); },
            commit: async () => { log.push('COMMIT'); },
            rollback: async () => {
                log.push('ROLLBACK');
                throw new Error('rollback-also-failed');
            },
            release: () => { log.push('RELEASE'); }
        };
        const db = { getConnection: async () => { log.push('CONN'); return conn; } };

        // The error from rollback will propagate (overriding the original error)
        await assert.rejects(
            withTransaction(db, async () => { throw new Error('original'); }),
            { message: 'rollback-also-failed' }
        );

        assert.ok(log.includes('RELEASE'), 'Connection must be released even if rollback fails');
    });

    it('should propagate getConnection errors', async () => {
        const db = {
            getConnection: async () => { throw new Error('pool exhausted'); }
        };

        await assert.rejects(
            withTransaction(db, async () => {}),
            { message: 'pool exhausted' }
        );
    });
});

// ─── withLockedRow ──────────────────────────────────────────────────────────

describe('withLockedRow', () => {
    it('should SELECT FOR UPDATE and pass row to callback', async () => {
        const { db, log } = createMockDb({
            queryResult: (sql) => {
                if (sql.includes('FOR UPDATE')) {
                    return [[{ id: 42, name: 'locked-row', status: 'ACTIVE' }], []];
                }
                return [[], []];
            }
        });

        const result = await withLockedRow(db, 'npa_projects', 42, async (conn, row) => {
            assert.equal(row.id, 42);
            assert.equal(row.name, 'locked-row');
            return { processed: true, original: row.status };
        });

        assert.equal(result.processed, true);
        assert.equal(result.original, 'ACTIVE');

        // Verify the FOR UPDATE query
        const selectQuery = log.find(x => typeof x === 'object' && x.query?.includes('FOR UPDATE'));
        assert.ok(selectQuery, 'Should have executed FOR UPDATE query');
        assert.ok(selectQuery.query.includes('npa_projects'), 'Should query correct table');
        assert.deepEqual(selectQuery.params, [42]);
    });

    it('should throw AppError(404) when row not found', async () => {
        const { db } = createMockDb({
            queryResult: () => [[], []] // empty result
        });

        await assert.rejects(
            withLockedRow(db, 'npa_transitions', 999, async () => {}),
            (err) => {
                assert.ok(err.message.includes('not found') || err.statusCode === 404,
                    `Expected 404 error, got: ${err.message}`);
                return true;
            }
        );
    });

    it('should strip npa_ prefix from error message', async () => {
        const { db } = createMockDb({
            queryResult: () => [[], []]
        });

        await assert.rejects(
            withLockedRow(db, 'npa_draft_approvals', 1, async () => {}),
            (err) => {
                // Should say "draft approvals" not "npa_draft_approvals"
                assert.ok(!err.message.includes('npa_'),
                    `Error message should not contain npa_ prefix: ${err.message}`);
                return true;
            }
        );
    });

    it('should run within a transaction (BEGIN/COMMIT/RELEASE)', async () => {
        const { db, log } = createMockDb({
            queryResult: () => [[{ id: 1 }], []]
        });

        await withLockedRow(db, 'test_table', 1, async () => 'ok');

        assert.ok(log.includes('BEGIN'), 'Should BEGIN transaction');
        assert.ok(log.includes('COMMIT'), 'Should COMMIT on success');
        assert.ok(log.includes('RELEASE'), 'Should RELEASE connection');
    });

    it('should ROLLBACK on callback error', async () => {
        const { db, log } = createMockDb({
            queryResult: () => [[{ id: 1 }], []]
        });

        await assert.rejects(
            withLockedRow(db, 'test_table', 1, async () => {
                throw new Error('callback-failed');
            }),
            { message: 'callback-failed' }
        );

        assert.ok(log.includes('ROLLBACK'), 'Should ROLLBACK on callback error');
        assert.ok(log.includes('RELEASE'), 'Should still RELEASE connection');
    });
});
