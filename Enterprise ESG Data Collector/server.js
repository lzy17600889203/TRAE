const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const {
  calculateEmissions,
  detectAnomalies,
  classifyCompany,
} = require('./emissions');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database(path.join(__dirname, 'esg_data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS esg_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT,
    report_period TEXT,
    electricity REAL DEFAULT 0,
    water REAL DEFAULT 0,
    business_travel_air REAL DEFAULT 0,
    business_travel_rail REAL DEFAULT 0,
    business_travel_road REAL DEFAULT 0,
    waste_hazardous REAL DEFAULT 0,
    waste_unclassified REAL DEFAULT 0,
    paper REAL DEFAULT 0,
    total_emission REAL,
    classification TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/submit', (req, res) => {
  const raw = req.body || {};

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

  const stmt = db.prepare(`
    INSERT INTO esg_records
      (company_name, report_period, electricity, water,
       business_travel_air, business_travel_rail, business_travel_road,
       waste_hazardous, waste_unclassified, paper, total_emission, classification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    raw.companyName || '未命名企业',
    raw.reportPeriod || '',
    payload.electricity,
    payload.water,
    payload.businessTravelAir,
    payload.businessTravelRail,
    payload.businessTravelRoad,
    payload.wasteHazardous,
    payload.wasteUnclassified,
    payload.paper,
    result.total,
    classification
  );

  res.json({
    ok: true,
    id: info.lastInsertRowid,
    result,
    anomalies,
    classification,
  });
});

app.post('/api/preview', (req, res) => {
  const raw = req.body || {};
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

  res.json({
    ok: true,
    result,
    anomalies,
    classification,
  });
});

app.get('/api/records', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM esg_records ORDER BY id DESC LIMIT 50')
    .all();
  res.json({ ok: true, records: rows });
});

app.listen(PORT, () => {
  console.log(`ESG 采集服务启动于 http://localhost:${PORT}`);
});
