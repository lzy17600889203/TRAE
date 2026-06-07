const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbFile = path.join(dbDir, 'portfolio.db');

let db;

function escape(s){
  if (s == null) return 'NULL';
  if (typeof s === 'number') return String(s);
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function initDB(){
  const SQL = await initSqlJs({
    locateFile: f => path.join(__dirname, 'node_modules/sql.js/dist', f)
  });
  let bytes = null;
  if (fs.existsSync(dbFile)) {
    try { bytes = fs.readFileSync(dbFile); } catch(e){ bytes = null; }
  }
  db = new SQL.Database(bytes);
  db.run(`
    CREATE TABLE IF NOT EXISTS coins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'altcoin'
    );
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      note TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      price_24h_ago REAL,
      change_24h REAL,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_value REAL NOT NULL,
      total_cost REAL NOT NULL,
      created_at INTEGER
    );
  `);
  saveDB();
}

function saveDB(){
  try {
    const data = db.export();
    fs.writeFileSync(dbFile, data);
  } catch(e){
    console.warn('saveDB failed:', e.message);
  }
}

function queryFirst(sql){
  const res = db.exec(sql);
  if (!res || res.length === 0) return null;
  const r = res[0];
  if (!r.values || r.values.length === 0) return null;
  const row = {};
  r.columns.forEach((c, i) => row[c] = r.values[0][i]);
  return row;
}
function queryAll(sql){
  const res = db.exec(sql);
  if (!res || res.length === 0) return [];
  const r = res[0];
  return r.values.map(v => {
    const row = {};
    r.columns.forEach((c, i) => row[c] = v[i]);
    return row;
  });
}
function run(sql){
  db.run(sql);
  saveDB();
}

const DEFAULT_COINS = [
  ['BTC', 'Bitcoin', 'mainstream'],
  ['ETH', 'Ethereum', 'mainstream'],
  ['SOL', 'Solana', 'mainstream'],
  ['DOGE', 'Dogecoin', 'meme'],
  ['SHIB', 'Shiba Inu', 'meme'],
  ['PEPE', 'Pepe', 'meme'],
  ['XRP', 'Ripple', 'altcoin'],
  ['ADA', 'Cardano', 'altcoin'],
  ['LINK', 'Chainlink', 'altcoin'],
  ['AVAX', 'Avalanche', 'altcoin']
];

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.get('/api/coins', (req, res) => {
  res.json(queryAll('SELECT * FROM coins'));
});

app.get('/api/holdings', (req, res) => {
  res.json(queryAll(`SELECT h.*, c.name, c.category
    FROM holdings h LEFT JOIN coins c ON h.symbol = c.symbol`));
});

app.post('/api/holdings', (req, res) => {
  const { symbol, amount, avg_cost } = req.body || {};
  if (!symbol) return res.status(400).json({ error: 'bad input' });
  const sym = String(symbol).toUpperCase();
  const amt = Number(amount) || 0;
  const cost = Number(avg_cost) || 0;
  const now = Date.now();
  const existing = queryFirst(`SELECT * FROM holdings WHERE symbol=${escape(sym)}`);
  if (existing) {
    run(`UPDATE holdings SET amount=${amt}, avg_cost=${cost}, updated_at=${now} WHERE symbol=${escape(sym)}`);
  } else {
    run(`INSERT INTO holdings (symbol, amount, avg_cost, updated_at) VALUES (${escape(sym)}, ${amt}, ${cost}, ${now})`);
  }
  res.json({ ok: true });
});

app.get('/api/trades', (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.json(queryAll(`SELECT * FROM trades ORDER BY created_at DESC LIMIT ${limit}`));
});

app.post('/api/trades', (req, res) => {
  const { symbol, type, amount, price, note } = req.body || {};
  if (!symbol || !type || amount == null || price == null) return res.status(400).json({ error: 'bad input' });
  const sym = String(symbol).toUpperCase();
  const amt = Number(amount);
  const prc = Number(price);
  const total = amt * prc;
  const now = Date.now();
  run(`INSERT INTO trades (symbol, type, amount, price, total, note, created_at)
       VALUES (${escape(sym)}, ${escape(type)}, ${amt}, ${prc}, ${total}, ${escape(note||'')}, ${now})`);

  const existing = queryFirst(`SELECT * FROM holdings WHERE symbol=${escape(sym)}`);
  let newAmount, newAvg;
  if (type.toLowerCase() === 'buy') {
    if (existing && existing.amount > 0) {
      const totalCost = existing.avg_cost * existing.amount + total;
      newAmount = existing.amount + amt;
      newAvg = totalCost / newAmount;
    } else {
      newAmount = amt;
      newAvg = prc;
    }
  } else {
    newAmount = Math.max(0, (existing ? existing.amount : 0) - amt);
    newAvg = existing ? existing.avg_cost : 0;
  }
  if (existing) {
    run(`UPDATE holdings SET amount=${newAmount}, avg_cost=${newAvg}, updated_at=${now} WHERE symbol=${escape(sym)}`);
  } else {
    run(`INSERT INTO holdings (symbol, amount, avg_cost, updated_at) VALUES (${escape(sym)}, ${newAmount}, ${newAvg}, ${now})`);
  }
  res.json({ ok: true });
});

app.get('/api/prices', (req, res) => {
  // return latest per symbol
  const all = queryAll('SELECT * FROM prices ORDER BY created_at DESC');
  const seen = new Set();
  const latest = [];
  for (const r of all) {
    if (seen.has(r.symbol)) continue;
    seen.add(r.symbol);
    latest.push(r);
  }
  res.json(latest);
});

app.post('/api/prices/refresh', (req, res) => {
  const preset = (req.body && req.body.preset) || 'bull';
  const now = Date.now();
  const baseMap = {
    bull:  { BTC: 72000, ETH: 4200, SOL: 180, DOGE: 0.22, SHIB: 0.00003, PEPE: 0.000008, XRP: 0.62, ADA: 0.55, LINK: 18, AVAX: 38 },
    bear:  { BTC: 42000, ETH: 2200, SOL: 80,  DOGE: 0.08, SHIB: 0.00001, PEPE: 0.000002, XRP: 0.32, ADA: 0.22, LINK: 9,  AVAX: 18 },
    hft:   { BTC: 64000, ETH: 3400, SOL: 145, DOGE: 0.16, SHIB: 0.00002, PEPE: 0.000005, XRP: 0.52, ADA: 0.42, LINK: 14, AVAX: 28 },
    empty: { BTC: 60000, ETH: 3000, SOL: 120, DOGE: 0.15, SHIB: 0.00002, PEPE: 0.000005, XRP: 0.5,  ADA: 0.4,  LINK: 14, AVAX: 28 }
  }[preset] || {};

  const out = {};
  for (const [sym] of DEFAULT_COINS) {
    const basePrice = baseMap[sym] || 1;
    const jitter = 0.97 + Math.random() * 0.06;
    const price = basePrice * jitter;
    let change24;
    if (preset === 'bull') change24 = Math.random() * 15;
    else if (preset === 'bear') change24 = -(Math.random() * 20 + 5);
    else if (preset === 'hft') change24 = Math.random() * 14 - 5;
    else change24 = Math.random() * 6 - 3;
    if (preset === 'bear' && ['DOGE','SHIB','PEPE'].includes(sym)) change24 = -(22 + Math.random() * 15);
    const price24hAgo = price / (1 + change24 / 100);
    run(`INSERT INTO prices (symbol, price, price_24h_ago, change_24h, created_at)
         VALUES (${escape(sym)}, ${price}, ${price24hAgo}, ${change24}, ${now})`);
    out[sym] = { price, change_24h: change24 };
  }
  res.json({ ok: true, prices: out });
});

app.get('/api/snapshots', (req, res) => {
  res.json(queryAll('SELECT * FROM snapshots ORDER BY created_at ASC'));
});

app.post('/api/snapshots', (req, res) => {
  const holdings = queryAll('SELECT * FROM holdings');
  const allPrices = queryAll('SELECT * FROM prices ORDER BY created_at DESC');
  const priceMap = {};
  const seen = new Set();
  for (const r of allPrices) {
    if (seen.has(r.symbol)) continue;
    seen.add(r.symbol);
    priceMap[r.symbol] = r.price;
  }
  let totalValue = 0, totalCost = 0;
  for (const h of holdings) {
    const price = priceMap[h.symbol] || 0;
    totalValue += h.amount * price;
    totalCost += h.amount * (h.avg_cost || 0);
  }
  run(`INSERT INTO snapshots (total_value, total_cost, created_at) VALUES (${totalValue}, ${totalCost}, ${Date.now()})`);
  res.json({ total_value: totalValue, total_cost: totalCost });
});

app.post('/api/seed', (req, res) => {
  const preset = (req.body && req.body.preset) || 'bull';
  const now = Date.now();

  // reset tables
  try {
    db.run('DROP TABLE IF EXISTS coins;');
    db.run('DROP TABLE IF EXISTS holdings;');
    db.run('DROP TABLE IF EXISTS trades;');
    db.run('DROP TABLE IF EXISTS prices;');
    db.run('DROP TABLE IF EXISTS snapshots;');
    db.run(`
      CREATE TABLE coins (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT DEFAULT 'altcoin');
      CREATE TABLE holdings (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL UNIQUE, amount REAL NOT NULL DEFAULT 0, avg_cost REAL NOT NULL DEFAULT 0, updated_at INTEGER);
      CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL, price REAL NOT NULL, total REAL NOT NULL, note TEXT, created_at INTEGER);
      CREATE TABLE prices (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, price REAL NOT NULL, price_24h_ago REAL, change_24h REAL, created_at INTEGER);
      CREATE TABLE snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, total_value REAL NOT NULL, total_cost REAL NOT NULL, created_at INTEGER);
    `);
    saveDB();
  } catch(e){ console.warn(e.message); }

  for (const [sym, name, cat] of DEFAULT_COINS) {
    run(`INSERT INTO coins (symbol, name, category) VALUES (${escape(sym)}, ${escape(name)}, ${escape(cat)})`);
  }

  const holdingsSeed = {
    bull:  { BTC: 1.5, ETH: 12, SOL: 80,   DOGE: 20000, SHIB: 5e6, PEPE: 10e6, XRP: 3000, ADA: 5000, LINK: 200, AVAX: 400 },
    bear:  { BTC: 0.8, ETH: 6,  SOL: 30,   DOGE: 50000, SHIB: 15e6, PEPE: 25e6, XRP: 2000, ADA: 3000, LINK: 100, AVAX: 200 },
    hft:   { BTC: 0.3, ETH: 5,  SOL: 40,   DOGE: 8000,  SHIB: 3e6, PEPE: 5e6,  XRP: 1500, ADA: 2500, LINK: 80,  AVAX: 150 },
    empty: {}
  }[preset] || {};

  const avgCostSeed = {
    bull:  { BTC: 35000, ETH: 1800, SOL: 50,  DOGE: 0.08, SHIB: 0.000008, PEPE: 0.000002, XRP: 0.25, ADA: 0.18, LINK: 7,  AVAX: 15 },
    bear:  { BTC: 68000, ETH: 3800, SOL: 200, DOGE: 0.28, SHIB: 0.00004,  PEPE: 0.000012, XRP: 0.75, ADA: 0.65, LINK: 22, AVAX: 45 },
    hft:   { BTC: 62000, ETH: 3300, SOL: 140, DOGE: 0.17, SHIB: 0.00002,  PEPE: 0.0000055,XRP: 0.5,  ADA: 0.4,  LINK: 14, AVAX: 28 },
    empty: {}
  }[preset] || {};

  for (const [sym] of DEFAULT_COINS) {
    const amt = holdingsSeed[sym] != null ? holdingsSeed[sym] : 0;
    const avg = avgCostSeed[sym] || 0;
    run(`INSERT INTO holdings (symbol, amount, avg_cost, updated_at) VALUES (${escape(sym)}, ${amt}, ${avg}, ${now})`);
  }

  const base = {
    bull:  { BTC: 72000, ETH: 4200, SOL: 180, DOGE: 0.22, SHIB: 0.00003, PEPE: 0.000008, XRP: 0.62, ADA: 0.55, LINK: 18, AVAX: 38 },
    bear:  { BTC: 42000, ETH: 2200, SOL: 80,  DOGE: 0.08, SHIB: 0.00001, PEPE: 0.000002, XRP: 0.32, ADA: 0.22, LINK: 9,  AVAX: 18 },
    hft:   { BTC: 64000, ETH: 3400, SOL: 145, DOGE: 0.16, SHIB: 0.00002, PEPE: 0.000005, XRP: 0.52, ADA: 0.42, LINK: 14, AVAX: 28 },
    empty: { BTC: 60000, ETH: 3000, SOL: 120, DOGE: 0.15, SHIB: 0.00002, PEPE: 0.000005, XRP: 0.5,  ADA: 0.4,  LINK: 14, AVAX: 28 }
  }[preset] || {};

  for (const [sym] of DEFAULT_COINS) {
    const price = base[sym] || 1;
    let change24;
    if (preset === 'bull') change24 = Math.random() * 15;
    else if (preset === 'bear') change24 = -(Math.random() * 20 + 5);
    else if (preset === 'hft') change24 = Math.random() * 10 - 5;
    else change24 = Math.random() * 6 - 3;
    if (preset === 'bear' && ['DOGE','SHIB','PEPE'].includes(sym)) change24 = -(22 + Math.random() * 15);
    const price24hAgo = price / (1 + change24 / 100);
    run(`INSERT INTO prices (symbol, price, price_24h_ago, change_24h, created_at)
         VALUES (${escape(sym)}, ${price}, ${price24hAgo}, ${change24}, ${now})`);
  }

  const nTrades = 20;
  const syms = Object.keys(holdingsSeed);
  for (let i = 0; i < nTrades; i++) {
    const sym = syms[Math.floor(Math.random() * syms.length)];
    const isBuy = preset === 'bull' ? Math.random() > 0.4 : preset === 'bear' ? Math.random() > 0.6 : Math.random() > 0.5;
    const amt = Math.random() * (holdingsSeed[sym] * 0.05) + 0.001;
    const price = (base[sym] || 1) * (0.95 + Math.random() * 0.1);
    run(`INSERT INTO trades (symbol, type, amount, price, total, note, created_at)
         VALUES (${escape(sym)}, ${escape(isBuy?'buy':'sell')}, ${amt}, ${price}, ${amt*price}, ${escape('')}, ${now - (nTrades-i)*60000})`);
  }

  // current snapshot
  let totalValue = 0, totalCost = 0;
  for (const [sym, amt] of Object.entries(holdingsSeed)) {
    totalValue += amt * (base[sym] || 0);
    totalCost += amt * (avgCostSeed[sym] || 0);
  }
  run(`INSERT INTO snapshots (total_value, total_cost, created_at) VALUES (${totalValue}, ${totalCost}, ${now})`);

  // history snapshots
  const snapStart = now - 1000 * 60 * 60 * 24 * 30;
  for (let i = 0; i < 60; i++) {
    const t = snapStart + (now - snapStart) * (i / 59);
    let factor;
    if (preset === 'bull') factor = 0.4 + (i / 59) * 0.6 + (Math.random() - 0.5) * 0.05;
    else if (preset === 'bear') factor = 1.4 - (i / 59) * 0.8 + (Math.random() - 0.5) * 0.05;
    else if (preset === 'hft') factor = 0.9 + (Math.random() - 0.5) * 0.1 + (i / 59) * 0.05;
    else factor = 1 + (Math.random() - 0.5) * 0.02;
    run(`INSERT INTO snapshots (total_value, total_cost, created_at) VALUES (${totalValue*factor}, ${totalCost}, ${Math.floor(t)})`);
  }

  res.json({ ok: true });
});

// check port availability
function portInUse(port){
  return new Promise(resolve => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => { tester.close(); resolve(false); })
      .listen(port);
  });
}

async function start(){
  await initDB();
  let usePort = PORT;
  const maxTry = 10;
  for (let i = 0; i < maxTry; i++){
    if (!(await portInUse(usePort))) break;
    console.log(`Port ${usePort} in use, trying ${usePort+1}...`);
    usePort++;
  }
  app.listen(usePort, () => {
    console.log('========================================');
    console.log('  CRYPTO PORTFOLIO TRACKER RUNNING');
    console.log(`  → 前台地址:  http://localhost:${usePort}/`);
    console.log(`  →  API Base:  http://localhost:${usePort}/api`);
    console.log('========================================');
  });
}

start().catch(e => { console.error(e); process.exit(1); });
