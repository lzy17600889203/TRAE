const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'traceability.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ================== SQLite (sql.js / WASM，无需编译) ================== */
let db;
let SQL;

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_FILE, data);
  } catch (e) {
    console.warn('[sqlite] 持久化失败（内存模式继续运行）:', e.message);
  }
}

async function openDb() {
  SQL = await initSqlJs({ locateFile: (f) => require.resolve(`sql.js/dist/${f}`) });
  if (fs.existsSync(DB_FILE)) {
    try {
      const buf = fs.readFileSync(DB_FILE);
      db = new SQL.Database(buf);
      return;
    } catch (e) {
      console.warn('[sqlite] 恢复文件失败，重建:', e.message);
    }
  }
  db = new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY,
      batch_code TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      origin TEXT,
      farmer TEXT,
      pickup_time TEXT,
      process_time TEXT,
      coldchain_time TEXT,
      shelf_time TEXT,
      coldchain_temp REAL,
      status TEXT DEFAULT 'pending',
      inspection_report TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
  seedIfEmpty();
  saveDb();
}

function seedIfEmpty() {
  const rows = db.exec('SELECT COUNT(*) as c FROM batches');
  const count = rows.length ? rows[0].values[0][0] : 0;
  if (count > 0) return;

  const demo = [
    {
      batch_code: 'NY20260601-001',
      product_name: '冬笋炒腊肉预制包',
      origin: '浙江·安吉县天荒坪镇',
      farmer: '李大山（合作社）',
      pickup_time: '2026-06-01 06:20',
      process_time: '2026-06-01 09:45',
      coldchain_time: '2026-06-01 14:10',
      shelf_time: '2026-06-03 08:00',
      coldchain_temp: 2.4,
      status: 'normal',
      inspection_report: '农残未检出；菌落总数 120 CFU/g（合格）；大肠菌群 <3 MPN/g。',
    },
    {
      batch_code: 'NY20260602-014',
      product_name: '乡村土鸡汤预制包',
      origin: '江西·兴国县茶园乡',
      farmer: '王春芳（散养户）',
      pickup_time: '2026-06-02 05:50',
      process_time: '2026-06-02 10:20',
      coldchain_time: '2026-06-02 15:05',
      shelf_time: '2026-06-04 09:30',
      coldchain_temp: 6.8,
      status: 'alert',
      inspection_report: '冷链温度异常！最高 6.8℃，已超过 4℃ 阈值，建议隔离该批次复检。',
    },
    {
      batch_code: 'NY20260603-027',
      product_name: '农家梅菜扣肉',
      origin: '广东·梅县区松口镇',
      farmer: '陈锦辉',
      pickup_time: '2026-06-03 07:10',
      process_time: null,
      coldchain_time: null,
      shelf_time: null,
      coldchain_temp: null,
      status: 'pending',
      inspection_report: null,
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO batches
    (batch_code, product_name, origin, farmer, pickup_time, process_time, coldchain_time, shelf_time, coldchain_temp, status, inspection_report)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of demo) {
    stmt.run([
      r.batch_code, r.product_name, r.origin, r.farmer,
      r.pickup_time, r.process_time, r.coldchain_time, r.shelf_time,
      r.coldchain_temp, r.status, r.inspection_report,
    ]);
  }
  stmt.free();
  console.log('[seed] 已写入 3 条演示批次数据');
}

function rowsToObjects(execResult) {
  if (!execResult.length) return [];
  const { columns, values } = execResult[0];
  return values.map((v) => {
    const obj = {};
    columns.forEach((c, i) => (obj[c] = v[i]));
    return obj;
  });
}

/* ================== API ================== */
app.get('/api/batches', (req, res) => {
  const rows = rowsToObjects(db.exec('SELECT * FROM batches ORDER BY id DESC'));
  res.json({ ok: true, data: rows });
});

app.get('/api/batches/:code', (req, res) => {
  const stmt = db.prepare('SELECT * FROM batches WHERE batch_code = ?');
  stmt.bind([req.params.code]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  if (!rows.length) return res.status(404).json({ ok: false, message: '批次不存在' });
  res.json({ ok: true, data: rows[0] });
});

app.post('/api/batches', (req, res) => {
  const b = req.body || {};
  if (!b.batch_code || !b.product_name) {
    return res.status(400).json({ ok: false, message: '批次号与产品名必填' });
  }
  const temp = typeof b.coldchain_temp === 'number' ? b.coldchain_temp : null;
  let status = 'normal';
  if (temp !== null && temp > 4) status = 'alert';
  if (!b.coldchain_time) status = 'pending';

  try {
    const stmt = db.prepare(`
      INSERT INTO batches
      (batch_code, product_name, origin, farmer, pickup_time, process_time, coldchain_time, shelf_time, coldchain_temp, status, inspection_report)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      b.batch_code, b.product_name, b.origin || '', b.farmer || '',
      b.pickup_time || null, b.process_time || null,
      b.coldchain_time || null, b.shelf_time || null,
      temp, status, b.inspection_report || null,
    ]);
    stmt.free();
    saveDb();
    res.json({ ok: true, id: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0], status });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
});

app.post('/api/scan', (req, res) => {
  const { batch_code, stage, temp, product_name, origin, farmer } = req.body || {};
  if (!batch_code || !stage) {
    return res.status(400).json({ ok: false, message: '参数不全' });
  }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const existing = (() => {
    const stmt = db.prepare('SELECT * FROM batches WHERE batch_code = ?');
    stmt.bind([batch_code]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows[0];
  })();

  if (!existing) {
    const stmt = db.prepare(`
      INSERT INTO batches (batch_code, product_name, origin, farmer, pickup_time, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    stmt.run([batch_code, product_name || '未命名预制菜', origin || '', farmer || '', now]);
    stmt.free();
  }

  let updates = [];
  let params = [];
  if (stage === 'pickup') {
    updates.push('pickup_time = ?'); params.push(now);
  } else if (stage === 'process') {
    updates.push('process_time = ?'); params.push(now);
  } else if (stage === 'coldchain') {
    const t = typeof temp === 'number' ? temp : 2.5;
    const status = t > 4 ? 'alert' : (updates.length ? 'normal' : null);
    updates.push('coldchain_time = ?'); params.push(now);
    updates.push('coldchain_temp = ?'); params.push(t);
    if (status) { updates.push('status = ?'); params.push(status); }
  } else if (stage === 'shelf') {
    updates.push('shelf_time = ?'); params.push(now);
  }

  if (updates.length) {
    params.push(batch_code);
    const stmt = db.prepare(`UPDATE batches SET ${updates.join(', ')} WHERE batch_code = ?`);
    stmt.run(params);
    stmt.free();
  }
  saveDb();

  const stmt2 = db.prepare('SELECT * FROM batches WHERE batch_code = ?');
  stmt2.bind([batch_code]);
  let out;
  while (stmt2.step()) out = stmt2.getAsObject();
  stmt2.free();
  res.json({ ok: true, data: out });
});

/* ================== Boot ================== */
openDb().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('  🌽  县域预制菜溯源看板 已启动');
    console.log(`  →  http://localhost:${PORT}`);
    console.log('');
  });
}).catch((e) => {
  console.error('启动失败:', e);
  process.exit(1);
});
