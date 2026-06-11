const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'pets.db');

let SQL, db;

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function expand(sql, params) {
  if (!params || params.length === 0) return sql;
  let i = 0;
  return sql.replace(/\?/g, () => escape(params[i++]));
}

function open() {
  const buf = fs.existsSync(dbFile) ? fs.readFileSync(dbFile) : null;
  db = new SQL.Database(buf);

  db.run(`
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT,
      age INTEGER,
      avatar TEXT,
      status TEXT DEFAULT 'healthy',
      weight REAL,
      temperature REAL,
      heart_rate INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      next_deworming TEXT,
      next_rabies TEXT
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      hospital TEXT,
      doctor TEXT,
      record_date TEXT NOT NULL,
      next_visit TEXT
    );

    CREATE TABLE IF NOT EXISTS push_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER,
      title TEXT NOT NULL,
      body TEXT,
      kind TEXT,
      scheduled_at TEXT DEFAULT (datetime('now')),
      "read" INTEGER DEFAULT 0
    );
  `);
  save();
}

function save() {
  fs.writeFileSync(dbFile, db.export());
}

function all(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params) {
  const rows = all(sql, params);
  return rows[0];
}

function run(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  stmt.step();
  stmt.free();
  const lastId = all('SELECT last_insert_rowid() as id')[0].id;
  const changes = all('SELECT changes() as c')[0].c;
  save();
  return { lastInsertRowid: lastId, changes };
}

function transaction(fn) {
  // Queue up runs into a single batched BEGIN/COMMIT so sql.js keeps the
  // transaction boundary alive across prepared statements.
  const queue = [];
  const scoped = { run: (sql, params) => { queue.push({ sql, params }); return queue[queue.length - 1]; } };
  fn(scoped);
  if (queue.length === 0) return;

  const parts = ['BEGIN'];
  for (const q of queue) parts.push(expand(q.sql, q.params));
  parts.push('COMMIT');

  try {
    db.run(parts.join(';\n'));
    save();

    // Populate lastInsertRowid for each queued INSERT. last_insert_rowid is
    // connection-wide and each INSERT increments it sequentially. We assign
    // ascending ids starting from the connection's current max.
    const firstNewId = all('SELECT last_insert_rowid() as id')[0].id;
    // Count how many inserts happened in the batch to walk back through ids.
    let insertCount = 0;
    for (const q of queue) if (/^\s*insert\s+/i.test(q.sql)) insertCount++;
    let currentBaseId = firstNewId - insertCount + 1;
    for (const q of queue) {
      if (/^\s*insert\s+/i.test(q.sql)) {
        q.lastInsertRowid = currentBaseId++;
        q.changes = 1;
      } else {
        q.lastInsertRowid = 0;
        q.changes = 0;
      }
    }
  } catch (e) {
    try { db.run('ROLLBACK'); } catch (_) {}
    throw e;
  }
}

async function init() {
  SQL = await initSqlJs();
  open();
  return { all, get, run, transaction };
}

module.exports = init;
