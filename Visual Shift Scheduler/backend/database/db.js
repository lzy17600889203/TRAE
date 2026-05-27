const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `./node_modules/sql.js/dist/${file}`
  });
  
  const dbPath = path.join(__dirname, '../database.sqlite');
  
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      department TEXT NOT NULL,
      maxConsecutiveDays INTEGER DEFAULT 5,
      maxDailyHours INTEGER DEFAULT 8,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      color TEXT NOT NULL,
      isNightShift INTEGER DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER NOT NULL,
      shiftId INTEGER NOT NULL,
      date TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countResult = db.exec('SELECT COUNT(*) as count FROM shifts');
  if (countResult.length > 0 && countResult[0].values[0][0] === 0) {
    const shifts = [
      { name: '早班', startTime: '08:00', endTime: '16:00', color: '#3b82f6', isNightShift: 0 },
      { name: '中班', startTime: '16:00', endTime: '24:00', color: '#8b5cf6', isNightShift: 0 },
      { name: '晚班', startTime: '22:00', endTime: '06:00', color: '#1f2937', isNightShift: 1 }
    ];

    shifts.forEach(shift => {
      db.run(
        'INSERT INTO shifts (name, startTime, endTime, color, isNightShift) VALUES (?, ?, ?, ?, ?)',
        [shift.name, shift.startTime, shift.endTime, shift.color, shift.isNightShift]
      );
    });
  }
  
  saveDatabase();
  console.log('Connected to SQLite database');
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const dbPath = path.join(__dirname, '../database.sqlite');
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function prepare(sql) {
  return {
    all: (...params) => {
      const result = db.exec(sql, params);
      if (result.length === 0) return [];
      const columns = result[0].columns;
      return result[0].values.map(row => {
        const obj = {};
        row.forEach((val, idx) => {
          obj[columns[idx]] = val;
        });
        return obj;
      });
    },
    get: (...params) => {
      const result = db.exec(sql, params);
      if (result.length === 0 || result[0].values.length === 0) return null;
      const columns = result[0].columns;
      const row = result[0].values[0];
      const obj = {};
      row.forEach((val, idx) => {
        obj[columns[idx]] = val;
      });
      return obj;
    },
    run: (...params) => {
      db.run(sql, params);
      saveDatabase();
      const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
      return { lastInsertRowid: lastIdResult[0].values[0][0] };
    }
  };
}

function exec(sql) {
  db.run(sql);
  saveDatabase();
}

initDatabase();

module.exports = {
  prepare,
  exec
};
