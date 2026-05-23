import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, '..', 'kanban.db');

let SQL: SqlJsStatic | null = null;
let db: SqlJsDatabase | null = null;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;

interface Statement {
  get(...params: unknown[]): any;
  all(...params: unknown[]): any[];
  run(...params: unknown[]): { changes: number; lastInsertRowid: number };
}

function saveToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buf = Buffer.from(data);
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, buf);
  } catch (err) {
    console.error('[db] save failed:', err);
  }
}

function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveToDisk, 200);
}

function wrap(sql: string): Statement {
  if (!db) throw new Error('Database not initialized');
  return {
    get(...params: unknown[]) {
      const stmt = db!.prepare(sql);
      try {
        if (params.length) stmt.bind(params as any);
        if (stmt.step()) {
          return stmt.getAsObject();
        }
        return undefined;
      } finally {
        stmt.free();
      }
    },
    all(...params: unknown[]) {
      const stmt = db!.prepare(sql);
      const rows: any[] = [];
      try {
        if (params.length) stmt.bind(params as any);
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        return rows;
      } finally {
        stmt.free();
      }
    },
    run(...params: unknown[]) {
      db!.run(sql, params.length ? (params as any) : undefined);
      scheduleSave();
      const lastRow = db!.exec('SELECT last_insert_rowid() AS id')[0];
      const lastId = lastRow ? (lastRow.values[0][0] as number) : 0;
      const changesRow = db!.exec('SELECT changes() AS c')[0];
      const changes = changesRow ? (changesRow.values[0][0] as number) : 0;
      return { changes, lastInsertRowid: lastId };
    }
  };
}

export async function initDb() {
  if (db) return;
  SQL = await initSqlJs();

  let existing: Buffer | null = null;
  if (fs.existsSync(DB_PATH)) {
    try {
      existing = fs.readFileSync(DB_PATH);
    } catch {}
  }

  db = existing ? new SQL.Database(existing) : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      column TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      sort_index INTEGER NOT NULL DEFAULT 0,
      parent_id INTEGER,
      blocked_by TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      from_column TEXT,
      to_column TEXT,
      from_index INTEGER,
      to_index INTEGER,
      operator TEXT NOT NULL DEFAULT 'anonymous',
      detail TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_task ON task_logs(task_id)`);

  scheduleSave();
}

export interface TaskRow {
  id: number;
  title: string;
  description: string;
  column: string;
  priority: string;
  sort_index: number;
  parent_id: number | null;
  blocked_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskLogRow {
  id: number;
  task_id: number;
  action: string;
  from_column: string | null;
  to_column: string | null;
  from_index: number | null;
  to_index: number | null;
  operator: string;
  detail: string | null;
  created_at: string;
}

export function logAction(
  taskId: number,
  action: string,
  extra: Partial<Omit<TaskLogRow, 'id' | 'task_id' | 'action' | 'created_at'>> = {}
) {
  if (!db) return;
  const stmt = wrap(
    `INSERT INTO task_logs (task_id, action, from_column, to_column, from_index, to_index, operator, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    taskId,
    action,
    extra.from_column ?? null,
    extra.to_column ?? null,
    extra.from_index ?? null,
    extra.to_index ?? null,
    extra.operator ?? 'anonymous',
    extra.detail ?? null
  );
}

export function touchTask(id: number) {
  if (!db) return;
  wrap(`UPDATE tasks SET updated_at = datetime('now') WHERE id = ?`).run(id);
}

export function prepare(sql: string): Statement {
  return wrap(sql);
}

export function exec(sql: string) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql);
  scheduleSave();
}

export function transaction<T>(fn: () => T): T {
  if (!db) throw new Error('Database not initialized');
  db.run('BEGIN');
  try {
    const result = fn();
    db.run('COMMIT');
    scheduleSave();
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

export function forceSave() {
  saveToDisk();
}
