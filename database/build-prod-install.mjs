import fs from 'node:fs';
import path from 'node:path';

function stripSqlComments(sql) {
  let out = '';

  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = i + 1 < sql.length ? sql[i + 1] : '';

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inSingle) {
      out += ch;
      if (ch === '\\' && next) {
        out += next;
        i++;
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      out += ch;
      if (ch === '\\' && next) {
        out += next;
        i++;
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }

    if (inBacktick) {
      out += ch;
      if (ch === '`') inBacktick = false;
      continue;
    }

    if (ch === "'" && !inDouble && !inBacktick) {
      inSingle = true;
      out += ch;
      continue;
    }
    if (ch === '"' && !inSingle && !inBacktick) {
      inDouble = true;
      out += ch;
      continue;
    }
    if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = true;
      out += ch;
      continue;
    }

    if (ch === '/' && next === '*') {
      const third = i + 2 < sql.length ? sql[i + 2] : '';

      // MySQL/MariaDB "versioned comments" are semantically executable code
      // like: /*!40101 SET NAMES utf8mb4 */;
      // We preserve the inner SQL but remove the comment wrappers.
      if (third === '!') {
        const end = sql.indexOf('*/', i + 3);
        if (end !== -1) {
          let inner = sql.slice(i + 2, end); // starts with "!40101 ..."
          if (inner.startsWith('!')) inner = inner.slice(1);
          inner = inner.replace(/^\d+\s+/, '');
          out += inner.trim();
          i = end + 1; // loop will i++ to char after '/'
          continue;
        }
      }

      // MariaDB-specific sandbox marker; not SQL
      if (third === 'M' && i + 3 < sql.length && sql[i + 3] === '!') {
        const end = sql.indexOf('*/', i + 4);
        if (end !== -1) {
          i = end + 1;
          continue;
        }
      }

      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === '#') {
      while (i < sql.length && sql[i] !== '\n') i++;
      if (i < sql.length) out += '\n';
      continue;
    }

    if (ch === '-' && next === '-') {
      const prev = i === 0 ? '\n' : sql[i - 1];
      const after = i + 2 < sql.length ? sql[i + 2] : '';
      const precededByWhitespace = prev === '\n' || prev === '\r' || prev === '\t' || prev === ' ';
      const followedByWhitespace = after === ' ' || after === '\t' || after === '\r' || after === '\n';
      if (precededByWhitespace && followedByWhitespace) {
        while (i < sql.length && sql[i] !== '\n') i++;
        if (i < sql.length) out += '\n';
        continue;
      }
    }

    out += ch;
  }

  return out;
}

function normalizeWhitespace(sql) {
  const lines = sql
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/g, ''))
    .filter((l) => l.trim().length > 0);
  return lines.join('\n') + '\n';
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function build() {
  const repoRoot = path.resolve(process.cwd());
  const dbDir = path.join(repoRoot, 'database');
  const migrationsDir = path.join(dbDir, 'migrations');

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const parts = [];

  parts.push('SET NAMES utf8mb4;');
  parts.push('SET FOREIGN_KEY_CHECKS=0;');
  parts.push('SET UNIQUE_CHECKS=0;');
  parts.push("SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';");

  const schemaPath = path.join(dbDir, 'schema-only.sql');
  parts.push(readFile(schemaPath));

  for (const mf of migrationFiles) {
    parts.push(readFile(path.join(migrationsDir, mf)));
  }

  const seedPath = path.join(dbDir, 'seed-data-only.sql');
  parts.push(readFile(seedPath));

  parts.push('SET UNIQUE_CHECKS=1;');
  parts.push('SET FOREIGN_KEY_CHECKS=1;');

  const combined = parts.join('\n\n');
  const stripped = stripSqlComments(combined);
  const normalized = normalizeWhitespace(stripped);

  const outPath = path.join(dbDir, 'prod_install.sql');
  fs.writeFileSync(outPath, normalized, 'utf8');
  process.stdout.write(`Wrote ${outPath}\n`);
}

build();
