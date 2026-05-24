const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL;
let db;

async function init() {
  if (db) return db;
  SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'counterpoint.db');
  let buf = null;
  try { buf = fs.readFileSync(dbPath); } catch (_) {}
  db = new SQL.Database(buf);

  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      musicxml TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score_id TEXT NOT NULL,
      measure_index INTEGER NOT NULL,
      voice_index INTEGER NOT NULL,
      step TEXT,
      octave INTEGER,
      pitch INTEGER,
      duration TEXT,
      analysis_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_analyses_score ON analyses(score_id);`);

  persist();
  return db;
}

function persist() {
  const data = db.export();
  const buf = Buffer.from(data);
  fs.writeFileSync(path.join(__dirname, 'counterpoint.db'), buf);
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

function all(sql, params = []) {
  const res = db.exec(sql, params);
  if (!res || !res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const o = {};
    cols.forEach((c, i) => (o[c] = row[i]));
    return o;
  });
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

function transaction(fn) {
  db.run('BEGIN TRANSACTION');
  try {
    fn();
    db.run('COMMIT');
    persist();
  } catch (e) {
    try { db.run('ROLLBACK'); } catch (_) {}
    persist();
    throw e;
  }
}

module.exports = { init, run, all, get, transaction };
