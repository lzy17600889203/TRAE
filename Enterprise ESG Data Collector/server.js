const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  calculateEmissions,
  detectAnomalies,
  classifyCompany,
} = require('./emissions');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'esg_records.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

function readRecords() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function writeRecords(records) {
  ensureStorage();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function computeFromPayload(raw) {
  const payload = {
    electricity: Number(raw.electricity) || 0,
    water: Number(raw.water) || 0,
    businessTravelAir: Number(raw.businessTravelAir) || 0,
    businessTravelRail: Number(raw.businessTravelRail) || 0,
    businessTravelRoad: Number(raw.businessTravelRoad) || 0,
    wasteHazardous: Number(raw.wasteHazardous) || 0,
    wasteUnclassified: Number(raw.wasteUnclassified) || 0,
    paper: Number(raw.paper) || 0,
  };
  const result = calculateEmissions(payload);
  const anomalies = detectAnomalies(payload);
  const classification = classifyCompany(result.total);
  return { payload, result, anomalies, classification };
}

app.post('/api/submit', (req, res) => {
  const raw = req.body || {};
  const { payload, result, anomalies, classification } = computeFromPayload(raw);

  const records = readRecords();
  const id = records.length + 1;
  const record = {
    id,
    companyName: raw.companyName || '未命名企业',
    reportPeriod: raw.reportPeriod || '',
    ...payload,
    totalEmission: result.total,
    classification,
    anomalies,
    createdAt: new Date().toISOString(),
  };
  records.unshift(record);
  writeRecords(records);

  res.json({
    ok: true,
    id,
    result,
    anomalies,
    classification,
  });
});

app.post('/api/preview', (req, res) => {
  const { result, anomalies, classification } = computeFromPayload(req.body || {});
  res.json({ ok: true, result, anomalies, classification });
});

app.get('/api/records', (req, res) => {
  const records = readRecords().slice(0, 50);
  res.json({ ok: true, records });
});

app.listen(PORT, () => {
  console.log(`ESG 采集服务已启动： http://localhost:${PORT}`);
  console.log('数据存储文件：', DATA_FILE);
});
