import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Clause, DecisionLog, Formula } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/sat-solver.db');

let db: SqlJsDatabase | null = null;
let dbReady: Promise<void>;

async function initDb() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS formulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      dimacs TEXT,
      variable_count INTEGER,
      clause_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clauses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER,
      literals TEXT,
      is_learned INTEGER DEFAULT 0,
      activity REAL DEFAULT 0.0,
      lbd INTEGER DEFAULT 0,
      reason TEXT,
      level INTEGER,
      FOREIGN KEY (formula_id) REFERENCES formulas(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS decision_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER,
      step INTEGER,
      type TEXT,
      variable INTEGER,
      value INTEGER,
      level INTEGER,
      clause_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (formula_id) REFERENCES formulas(id)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_clauses_formula ON clauses(formula_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_clauses_learned ON clauses(is_learned)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_formula ON decision_logs(formula_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_step ON decision_logs(step)`);

  saveToFile();
}

function saveToFile() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

dbReady = initDb();

export async function ensureDb() {
  await dbReady;
}

export function saveFormula(formula: Formula): number {
  if (!db) throw new Error('Database not initialized');
  
  db.run(
    `INSERT INTO formulas (name, dimacs, variable_count, clause_count) VALUES (?, ?, ?, ?)`,
    [formula.name || null, formula.dimacs, formula.variableCount, formula.clauseCount]
  );
  
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveToFile();
  return result[0]?.values[0]?.[0] as number || 0;
}

export function saveClause(clause: Clause, formulaId: number): number {
  if (!db) throw new Error('Database not initialized');
  
  db.run(
    `INSERT INTO clauses (formula_id, literals, is_learned, activity, lbd, reason, level) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      formulaId,
      JSON.stringify(clause.literals),
      clause.isLearned ? 1 : 0,
      clause.activity,
      clause.lbd,
      clause.reason || null,
      clause.level || null
    ]
  );
  
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveToFile();
  return result[0]?.values[0]?.[0] as number || 0;
}

export function saveLearnedClause(clause: Clause, formulaId: number): number {
  if (!db) throw new Error('Database not initialized');
  
  db.run(
    `INSERT INTO clauses (formula_id, literals, is_learned, activity, lbd, reason, level) VALUES (?, ?, 1, ?, ?, ?, ?)`,
    [
      formulaId,
      JSON.stringify(clause.literals),
      clause.activity,
      clause.lbd,
      clause.reason || 'conflict',
      clause.level || 0
    ]
  );
  
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveToFile();
  return result[0]?.values[0]?.[0] as number || 0;
}

export function saveDecisionLog(log: DecisionLog, formulaId: number): void {
  if (!db) throw new Error('Database not initialized');
  
  db.run(
    `INSERT INTO decision_logs (formula_id, step, type, variable, value, level, clause_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      formulaId,
      log.step,
      log.type,
      log.variable || null,
      log.value || null,
      log.level,
      log.clauseId || null
    ]
  );
  saveToFile();
}

export function getFormulaById(id: number): any {
  if (!db) throw new Error('Database not initialized');
  
  const result = db.exec('SELECT * FROM formulas WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const row: any = {};
  columns.forEach((col, i) => row[col] = values[i]);
  return row;
}

export function getClausesByFormulaId(formulaId: number): Clause[] {
  if (!db) throw new Error('Database not initialized');
  
  const result = db.exec('SELECT * FROM clauses WHERE formula_id = ?', [formulaId]);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(values => {
    const row: any = {};
    columns.forEach((col, i) => row[col] = values[i]);
    return {
      id: row.id,
      literals: JSON.parse(row.literals),
      isLearned: row.is_learned === 1,
      activity: row.activity,
      lbd: row.lbd,
      reason: row.reason,
      level: row.level
    };
  });
}

export function getLearnedClauses(formulaId: number): Clause[] {
  if (!db) throw new Error('Database not initialized');
  
  const result = db.exec('SELECT * FROM clauses WHERE formula_id = ? AND is_learned = 1', [formulaId]);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(values => {
    const row: any = {};
    columns.forEach((col, i) => row[col] = values[i]);
    return {
      id: row.id,
      literals: JSON.parse(row.literals),
      isLearned: true,
      activity: row.activity,
      lbd: row.lbd,
      reason: row.reason,
      level: row.level
    };
  });
}

export function getDecisionLogs(formulaId: number): DecisionLog[] {
  if (!db) throw new Error('Database not initialized');
  
  const result = db.exec('SELECT * FROM decision_logs WHERE formula_id = ? ORDER BY step', [formulaId]);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(values => {
    const row: any = {};
    columns.forEach((col, i) => row[col] = values[i]);
    return {
      id: row.id,
      formulaId: row.formula_id,
      step: row.step,
      type: row.type,
      variable: row.variable,
      value: row.value,
      level: row.level,
      clauseId: row.clause_id,
      timestamp: row.timestamp
    };
  });
}

export function clearFormulaData(formulaId: number): void {
  if (!db) throw new Error('Database not initialized');
  
  db.run('DELETE FROM decision_logs WHERE formula_id = ?', [formulaId]);
  db.run('DELETE FROM clauses WHERE formula_id = ?', [formulaId]);
  saveToFile();
}

export function getMemoryUsage(): { heapUsed: number; heapTotal: number } {
  if (global.gc) {
    global.gc();
  }
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal
  };
}

export { db };
