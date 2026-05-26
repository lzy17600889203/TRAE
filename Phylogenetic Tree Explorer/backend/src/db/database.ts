import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Species {
  id: number;
  name: string;
  latin_name: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  parent_id: number | null;
  created_at: string;
}

export interface Feature {
  id: number;
  species_id: number;
  feature_name: string;
  feature_value: string;
  category: string;
}

export interface CharacteristicMatrix {
  species_id: number;
  feature_name: string;
  feature_value: number;
}

let SQL: SqlJsStatic;
let db: Database;
let dbFilePath: string;

function resultsToObjects(results: any[]): any[] {
  return results.map((row: any) => {
    const obj: any = {};
    if (row.columns && row.values) {
      row.columns.forEach((col: string, idx: number) => {
        obj[col] = row.values[0][idx];
      });
    }
    return obj;
  });
}

function queryAll(sql: string, params: any[] = []): any[] {
  try {
    const results = db.exec(sql);
    if (results.length === 0) return [];
    const result = results[0];
    const rows: any[] = [];
    for (let i = 0; i < result.values.length; i++) {
      const obj: any = {};
      for (let j = 0; j < result.columns.length; j++) {
        obj[result.columns[j]] = result.values[i][j];
      }
      rows.push(obj);
    }
    return rows;
  } catch (e: any) {
    console.error('queryAll error:', e.message);
    return [];
  }
}

function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  try {
    db.run(sql, params);
    const result = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
    const rawId = result[0]?.values[0]?.[0] || 0;
    const rawChanges = result[0]?.values[0]?.[1] || 0;
    return { lastInsertRowid: Number(rawId), changes: Number(rawChanges) };
  } catch (e: any) {
    console.error('run error:', e.message);
    return { lastInsertRowid: 0, changes: 0 };
  }
}

function get(sql: string, params: any[] = []): any | null {
  try {
    const results = db.exec(sql);
    if (results.length === 0) return null;
    const result = results[0];
    if (result.values.length === 0) return null;
    const obj: any = {};
    for (let j = 0; j < result.columns.length; j++) {
      obj[result.columns[j]] = result.values[0][j];
    }
    return obj;
  } catch (e: any) {
    console.error('get error:', e.message);
    return null;
  }
}

function exec(sql: string): void {
  try {
    db.run(sql);
  } catch (e: any) {
    console.error('exec error:', e.message);
  }
}

function transaction(fn: () => void): void {
  try {
    db.run('BEGIN TRANSACTION');
    fn();
    db.run('COMMIT');
  } catch (e: any) {
    db.run('ROLLBACK');
    console.error('transaction error:', e.message);
  }
}

export async function initDatabase(): Promise<Database> {
  SQL = await initSqlJs();
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbFilePath = path.join(dataDir, 'phylogenetic.db');

  let fileBuffer: Uint8Array | undefined;
  if (fs.existsSync(dbFilePath)) {
    fileBuffer = fs.readFileSync(dbFilePath);
  }

  db = new SQL.Database(fileBuffer);

  saveDatabase();

  return db;
}

export function saveDatabase(): void {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (e: any) {
    console.error('saveDatabase error:', e.message);
  }
}

export function getDb(): Database {
  return db;
}

export function createSchema(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      latin_name TEXT,
      kingdom TEXT,
      phylum TEXT,
      class TEXT,
      "order" TEXT,
      family TEXT,
      genus TEXT,
      species TEXT,
      parent_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES species(id)
    );

    CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id INTEGER NOT NULL,
      feature_name TEXT NOT NULL,
      feature_value TEXT,
      category TEXT,
      FOREIGN KEY (species_id) REFERENCES species(id)
    );

    CREATE TABLE IF NOT EXISTS characteristic_matrix (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id INTEGER NOT NULL,
      feature_name TEXT NOT NULL,
      feature_value REAL DEFAULT 0,
      FOREIGN KEY (species_id) REFERENCES species(id)
    );

    CREATE TABLE IF NOT EXISTS distance_matrix (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_a_id INTEGER NOT NULL,
      species_b_id INTEGER NOT NULL,
      distance REAL NOT NULL,
      FOREIGN KEY (species_a_id) REFERENCES species(id),
      FOREIGN KEY (species_b_id) REFERENCES species(id)
    );

    CREATE TABLE IF NOT EXISTS phylogeny_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      algorithm TEXT NOT NULL,
      tree_data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  saveDatabase();
}

export function clearAllData(): void {
  exec('DELETE FROM characteristic_matrix');
  exec('DELETE FROM features');
  exec('DELETE FROM species');
  exec('DELETE FROM distance_matrix');
  exec('DELETE FROM phylogeny_results');
  exec("DELETE FROM sqlite_sequence WHERE name='species'");
  exec("DELETE FROM sqlite_sequence WHERE name='features'");
  exec("DELETE FROM sqlite_sequence WHERE name='characteristic_matrix'");
  exec("DELETE FROM sqlite_sequence WHERE name='distance_matrix'");
  exec("DELETE FROM sqlite_sequence WHERE name='phylogeny_results'");
  saveDatabase();
}

export { queryAll, run, get as dbGet, exec as dbExec, transaction as dbTransaction };
