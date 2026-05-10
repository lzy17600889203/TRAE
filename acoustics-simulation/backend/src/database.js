const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;
let SQL = null;

const dbPath = path.join(__dirname, '..', 'acoustics.db');

async function initDatabase() {
  if (db) return db;

  SQL = await initSqlJs();

  let dbFileBuffer = null;
  if (fs.existsSync(dbPath)) {
    try {
      dbFileBuffer = fs.readFileSync(dbPath);
    } catch (e) {
      console.warn('Failed to read existing database:', e.message);
    }
  }

  db = new SQL.Database(dbFileBuffer);

  db.run(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS walls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER,
      vertices TEXT NOT NULL,
      impedance REAL DEFAULT 1.0,
      reflection REAL DEFAULT 0.99,
      absorption REAL DEFAULT 0.01,
      is_absorber INTEGER DEFAULT 0,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      impedance REAL DEFAULT 1.0,
      absorption REAL DEFAULT 0.01,
      porosity REAL DEFAULT 0.3
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER,
      position_x REAL,
      position_y REAL,
      position_z REAL,
      frequency REAL DEFAULT 440,
      amplitude REAL DEFAULT 1.0,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS frequency_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );
  `);

  saveDatabase();

  return db;
}

function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.warn('Failed to save database:', e.message);
    }
  }
}

function getLastInsertId() {
  if (!db) return null;
  const result = db.exec('SELECT last_insert_rowid() as id');
  if (result && result[0] && result[0].values && result[0].values[0]) {
    return result[0].values[0][0];
  }
  return null;
}

function prepare(sql) {
  if (!db) throw new Error('Database not initialized');
  
  return {
    run: function(...params) {
      db.run(sql, params);
      saveDatabase();
      return {
        lastInsertRowid: getLastInsertId()
      };
    },
    get: function(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: function(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  };
}

const dbWrapper = {
  run: (sql, params = []) => {
    if (!db) throw new Error('Database not initialized');
    db.run(sql, params);
    saveDatabase();
  },
  prepare: (sql) => prepare(sql),
  exec: (sql) => {
    if (!db) throw new Error('Database not initialized');
    db.run(sql);
    saveDatabase();
  }
};

module.exports = {
  dbWrapper,
  initDatabase
};
