const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { calcCarbon, buildSummary } = require('./carbon');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'entries.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadEntries() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}
function saveEntries(arr) {
  fs.writeFileSync(DB_FILE, JSON.stringify(arr, null, 2), 'utf-8');
}

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/entries', (req, res) => {
  const { date, transport, transport_km, diet, electricity_kwh, note } = req.body || {};
  const useDate = date || todayStr();
  const result = calcCarbon({ transport, transport_km, diet, electricity_kwh });
  const entries = loadEntries();
  const entry = {
    id: Date.now(),
    date: useDate,
    transport: transport || null,
    transport_km: Number(transport_km) || 0,
    diet: diet || null,
    electricity_kwh: Number(electricity_kwh) || 0,
    note: note || '',
    carbon_delta: result.delta,
    co2: result.co2,
    score: result.score,
    created_at: new Date().toISOString()
  };
  entries.push(entry);
  saveEntries(entries);
  res.json({ id: entry.id, date: useDate, delta: result.delta, co2: result.co2, score: result.score });
});

app.get('/api/entries', (req, res) => {
  const rows = loadEntries().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  res.json(rows);
});

app.get('/api/summary', (req, res) => {
  const rows = loadEntries().sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  res.json(buildSummary(rows));
});

app.delete('/api/entries/:id', (req, res) => {
  const id = Number(req.params.id);
  const entries = loadEntries().filter((e) => e.id !== id);
  saveEntries(entries);
  res.json({ deleted: entries.length });
});

app.post('/api/seed-demo', (req, res) => {
  const { scenario } = req.body || {};
  const today = new Date();
  const seeded = [];
  const fake = (offsetDays, transport, km, diet, kwh) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const r = calcCarbon({ transport, transport_km: km, diet, electricity_kwh: kwh });
    return {
      id: Date.now() + seeded.length + Math.random(),
      date,
      transport,
      transport_km: km,
      diet,
      electricity_kwh: kwh,
      note: 'demo',
      carbon_delta: r.delta,
      co2: r.co2,
      score: r.score,
      created_at: d.toISOString()
    };
  };

  if (scenario === 'guardian') {
    for (let i = 29; i >= 0; i--) seeded.push(fake(i, 'bike', 8, 'vegan', 2));
  } else if (scenario === 'warning') {
    for (let i = 13; i >= 0; i--) seeded.push(fake(i, 'car', 60, 'meat', 15));
  } else if (scenario === 'commute') {
    for (let i = 9; i >= 0; i--) seeded.push(fake(i, 'bike', 6, 'mixed', 6));
  }
  saveEntries(seeded);
  res.json({ scenario, seeded: seeded.length, entries: seeded.map((s) => ({ date: s.date, delta: s.carbon_delta })) });
});

const DEFAULT_PORT = 3000;
const MAX_TRIES = 20;

function isPortFree(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
  });
}

async function start() {
  let port = DEFAULT_PORT;
  let tries = 0;
  while (tries < MAX_TRIES) {
    const free = await isPortFree(port);
    if (free) break;
    console.log(`[INFO] 端口 ${port} 被占用，尝试下一个端口...`);
    port += 1;
    tries += 1;
  }
  app.listen(port, '0.0.0.0', () => {
    console.log('========================================');
    console.log('  地球健康度追踪器已启动');
    console.log(`  前台访问地址: http://localhost:${port}/`);
    console.log('========================================');
  });
}

start();
