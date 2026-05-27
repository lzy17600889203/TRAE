const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../../inventory.db')

let db = null

const initDB = async () => {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  })
  
  let existingData = null
  if (fs.existsSync(dbPath)) {
    existingData = fs.readFileSync(dbPath)
  }
  
  db = new SQL.Database(existingData)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      min_stock INTEGER DEFAULT 0,
      max_stock INTEGER DEFAULT 99999,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      cost REAL NOT NULL,
      expiry_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      archived INTEGER DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      batch_id INTEGER,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost REAL,
      total_cost REAL,
      transaction_date TEXT DEFAULT CURRENT_TIMESTAMP,
      remark TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      total_quantity INTEGER DEFAULT 0,
      avg_cost REAL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id)
    )
  `)

  return db
}

const saveDB = () => {
  if (db) {
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  }
}

module.exports = { initDB, saveDB, getDB: () => db }