'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'renovation.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER,
      name TEXT NOT NULL,
      planned_amount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      progress REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      order_index INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT,
      planned_amount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      quantity REAL DEFAULT 1,
      unit TEXT,
      paid INTEGER DEFAULT 0,
      refunded INTEGER DEFAULT 0,
      supplier TEXT,
      notes TEXT,
      purchase_date TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL DEFAULT 0,
      event_date TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
    );
  `);
}

function getDb() {
  return db;
}

module.exports = { initSchema, getDb };
