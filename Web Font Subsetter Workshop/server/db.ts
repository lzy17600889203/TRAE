import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', 'data.sqlite');

const SQL = await initSqlJs();

let _db: any;
function openDb() {
  if (_db) return _db;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }
  _db.run(`
    CREATE TABLE IF NOT EXISTS fonts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      size INTEGER NOT NULL,
      format TEXT NOT NULL,
      glyph_count INTEGER,
      family TEXT,
      units_per_em INTEGER,
      tables TEXT,
      data BLOB NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      font_id TEXT NOT NULL,
      preset TEXT,
      charset TEXT,
      algorithm TEXT,
      status TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      output_size INTEGER,
      error TEXT,
      output BLOB,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  persist();
  return _db;
}

let persistTimer: any;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (!_db) return;
    const data = _db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }, 200);
}

export const db = {
  prepare(sql: string) {
    const database = openDb();
    return {
      run(params: Record<string, any> = {}) {
        database.run(sql, params);
        persist();
      },
      get(params: Record<string, any> = {}): any {
        const res = database.execWithParams(sql, params);
        if (!res.length) return undefined;
        const row = res[0];
        const obj: any = {};
        row.columns.forEach((c: string, i: number) => {
          let v: any = row.values[0][i];
          if (v instanceof Uint8Array) v = Buffer.from(v);
          obj[c] = v;
        });
        return obj;
      },
      all(params: Record<string, any> = {}): any[] {
        const res = database.execWithParams(sql, params);
        if (!res.length) return [];
        const row = res[0];
        return row.values.map((vals: any[]) => {
          const obj: any = {};
          row.columns.forEach((c: string, i: number) => {
            let v: any = vals[i];
            if (v instanceof Uint8Array) v = Buffer.from(v);
            obj[c] = v;
          });
          return obj;
        });
      },
    };
  },
  exec(sql: string) {
    openDb().run(sql);
    persist();
  },
};

export type FontRow = {
  id: string; name: string; size: number; format: string;
  glyph_count: number | null; family: string | null; units_per_em: number | null;
  tables: string | null; data: Buffer; created_at: string;
};

export type TaskRow = {
  id: string; font_id: string; preset: string | null; charset: string | null;
  algorithm: string | null; status: string; progress: number; output_size: number | null;
  error: string | null; output: Buffer | null; created_at: string;
};
