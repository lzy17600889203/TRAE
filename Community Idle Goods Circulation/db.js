const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db', 'app.db');
const SAVE_INTERVAL = 5000;

let SQL;
let db;

function save() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('[db save error]', e.message);
  }
}

async function initDB() {
  SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS goods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'on_sale',
      images TEXT NOT NULL DEFAULT '[]',
      location TEXT DEFAULT '',
      category TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goods_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      buyer_name TEXT NOT NULL,
      message TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goods_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_goods_user ON goods(user_id);
    CREATE INDEX IF NOT EXISTS idx_goods_status ON goods(status);
    CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_messages_goods ON messages(goods_id);
  `);

  // seed default user
  const u = db.prepare('SELECT id FROM users WHERE username = ?');
  const res = u.get(['alice']);
  if (!res) {
    db.run('INSERT INTO users (username, nickname) VALUES (?, ?)', ['alice', '°¢ÀöË¿']);
    db.run('INSERT INTO users (username, nickname) VALUES (?, ?)', ['bob', '±«²ª']);
  }
  save();
}

function queryRows(sql, params) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params || []);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('[sql err]', e.message, sql);
    throw e;
  }
}

function queryOne(sql, params) {
  const rows = queryRows(sql, params);
  return rows.length ? rows[0] : null;
}

function exec(sql, params) {
  try {
    db.run(sql, params || []);
    return { changes: db.getRowsModified() || 0, lastInsertRowid: null };
  } catch (e) {
    console.error('[sql err]', e.message, sql);
    throw e;
  }
}

function runInsert(sql, params) {
  exec(sql, params);
  const r = queryOne('SELECT last_insert_rowid() AS id');
  return r && r.id;
}

module.exports = {
  initDB,
  queryRows,
  queryOne,
  exec,
  runInsert,
  save
};

setInterval(() => { if (db) save(); }, SAVE_INTERVAL);
process.on('exit', () => { if (db) save(); });
process.on('SIGINT', () => { if (db) save(); process.exit(); });
