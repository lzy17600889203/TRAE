import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL = await initSqlJs({
  locateFile: (file) =>
    path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
});

const dbPath = path.join(__dirname, 'lp.db');

let db;

function loadOrCreate() {
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      objective TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'max',
      constraints TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS iterations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      step INTEGER NOT NULL,
      tableau TEXT NOT NULL,
      basis TEXT NOT NULL,
      entering INTEGER,
      leaving INTEGER,
      pivot_row INTEGER,
      pivot_col INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  persist();
}

function persist() {
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.warn('db persist failed', e.message);
  }
}

loadOrCreate();

export function saveModel(model) {
  const { name, objective, direction, constraints } = model;
  db.run(
    `INSERT INTO models (name, objective, direction, constraints) VALUES (?, ?, ?, ?)`,
    [name, JSON.stringify(objective), direction, JSON.stringify(constraints)]
  );
  const row = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
  persist();
  return row;
}

export function listModels() {
  const res = db.exec(
    'SELECT id, name, direction, created_at FROM models ORDER BY id DESC'
  );
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const o = {};
    cols.forEach((c, i) => (o[c] = v[i]));
    return o;
  });
}

export function getModel(id) {
  const res = db.exec('SELECT * FROM models WHERE id = ?', [id]);
  if (!res.length) return null;
  const cols = res[0].columns;
  const row = {};
  cols.forEach((c, i) => (row[c] = res[0].values[0][i]));
  return {
    ...row,
    objective: JSON.parse(row.objective),
    constraints: JSON.parse(row.constraints)
  };
}

export function clearIterations(modelId) {
  db.run('DELETE FROM iterations WHERE model_id = ?', [modelId]);
  persist();
}

export function saveIteration(iter) {
  db.run(
    `INSERT INTO iterations
     (model_id, step, tableau, basis, entering, leaving, pivot_row, pivot_col, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      iter.model_id,
      iter.step,
      JSON.stringify(iter.tableau),
      JSON.stringify(iter.basis),
      iter.entering ?? null,
      iter.leaving ?? null,
      iter.pivot_row ?? null,
      iter.pivot_col ?? null,
      iter.notes ?? null
    ]
  );
  persist();
}

export function getIterations(modelId) {
  const res = db.exec(
    'SELECT * FROM iterations WHERE model_id = ? ORDER BY step ASC',
    [modelId]
  );
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const o = {};
    cols.forEach((c, i) => (o[c] = v[i]));
    return {
      ...o,
      tableau: JSON.parse(o.tableau),
      basis: JSON.parse(o.basis)
    };
  });
}

export { db };
