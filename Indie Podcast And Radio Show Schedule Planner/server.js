const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'schedule.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SEGMENT_DEFAULTS = {
  intro: { label: '片头', duration: 3, color: '#ffd166' },
  main: { label: '正片', duration: 45, color: '#06d6a0' },
  ad: { label: '广告', duration: 8, color: '#ef476f' },
  outro: { label: '片尾', duration: 4, color: '#118ab2' }
};
const DAY_LIMIT_MINUTES = 60;

function seedDatabase() {
  if (fs.existsSync(DB_FILE)) return;
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10);

  const segments = [];

  // 黄金档 19:00-21:00 — 密密的彩色色块
  segments.push({ id: 's1', type: 'intro', day: ymd, startMinute: 19 * 60 + 0, duration: 3, title: '开场曲' });
  segments.push({ id: 's2', type: 'main', day: ymd, startMinute: 19 * 60 + 3, duration: 22, title: '夜聊电台·第一回' });
  segments.push({ id: 's3', type: 'ad', day: ymd, startMinute: 19 * 60 + 25, duration: 5, title: '赞助商口播' });
  segments.push({ id: 's4', type: 'main', day: ymd, startMinute: 19 * 60 + 30, duration: 25, title: '夜聊电台·第二回' });
  segments.push({ id: 's5', type: 'ad', day: ymd, startMinute: 19 * 60 + 55, duration: 5, title: '贴片广告' });
  segments.push({ id: 's6', type: 'outro', day: ymd, startMinute: 20 * 60 + 0, duration: 4, title: '结语' });

  // 20:00 新一档 — 严重超时（超过 60 分钟）
  segments.push({ id: 's7', type: 'intro', day: ymd, startMinute: 20 * 60 + 5, duration: 4, title: '午夜序曲' });
  segments.push({ id: 's8', type: 'main', day: ymd, startMinute: 20 * 60 + 9, duration: 38, title: '超长特辑' });
  segments.push({ id: 's9', type: 'ad', day: ymd, startMinute: 20 * 60 + 47, duration: 8, title: '广告 1' });
  segments.push({ id: 's10', type: 'main', day: ymd, startMinute: 20 * 60 + 55, duration: 15, title: '加更内容' });
  segments.push({ id: 's11', type: 'outro', day: ymd, startMinute: 21 * 60 + 10, duration: 5, title: '谢幕' });

  // 常规档 08:00 早间 — 正常
  segments.push({ id: 's12', type: 'intro', day: ymd, startMinute: 8 * 60 + 0, duration: 2, title: '早安片头' });
  segments.push({ id: 's13', type: 'main', day: ymd, startMinute: 8 * 60 + 2, duration: 40, title: '晨间新闻' });
  segments.push({ id: 's14', type: 'ad', day: ymd, startMinute: 8 * 60 + 42, duration: 5, title: '本地广告' });
  segments.push({ id: 's15', type: 'outro', day: ymd, startMinute: 8 * 60 + 47, duration: 3, title: '结束' });

  // 凌晨 2-6 点 — 留白 / 自动白噪音（用 null slot 概念，由前端渲染为深蓝）
  // 这里我们不加入任何 segment，由前端渲染为蓝色默认带

  // 停播检修日（明天）— 在另一天做全部灰色的 demo，需要一个特殊 flag
  const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  segments.push({ id: 's_maint_1', type: 'intro', day: tomorrow, startMinute: 0, duration: 0, title: '__MAINTENANCE_DAY__' });

  fs.writeFileSync(DB_FILE, JSON.stringify({ segments }, null, 2), 'utf8');
}

function loadDB() {
  if (!fs.existsSync(DB_FILE)) seedDatabase();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { segments: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// --- "SQLite query" style helpers to validate segment durations ---
function computeDayTotals(segments, day) {
  const daySegs = segments.filter((s) => s.day === day && s.title !== '__MAINTENANCE_DAY__');
  const byHour = new Map();
  for (const seg of daySegs) {
    const hour = Math.floor(seg.startMinute / 60);
    if (!byHour.has(hour)) byHour.set(hour, { total: 0, segments: [] });
    byHour.get(hour).total += seg.duration;
    byHour.get(hour).segments.push(seg);
  }
  return byHour;
}

function dayIsMaintenance(segments, day) {
  return segments.some((s) => s.day === day && s.title === '__MAINTENANCE_DAY__');
}

// GET /api/segments?day=YYYY-MM-DD
app.get('/api/segments', (req, res) => {
  const db = loadDB();
  const day = req.query.day || new Date().toISOString().slice(0, 10);
  const segments = db.segments.filter((s) => s.day === day);
  const byHour = computeDayTotals(db.segments, day);
  const hourlyTotals = [];
  for (let h = 0; h < 24; h++) {
    const bucket = byHour.get(h);
    hourlyTotals.push({
      hour: h,
      totalMinutes: bucket ? bucket.total : 0,
      overflow: bucket ? bucket.total > DAY_LIMIT_MINUTES : false
    });
  }
  const maintenance = dayIsMaintenance(db.segments, day);
  res.json({
    day,
    segments,
    hourlyTotals,
    dayLimitMinutes: DAY_LIMIT_MINUTES,
    maintenance
  });
});

// POST /api/segments — 新增 / 覆盖（后端按 SQLite 语义校验总时长）
app.post('/api/segments', (req, res) => {
  const { type, day, startMinute, duration, title } = req.body || {};
  if (!SEGMENT_DEFAULTS[type]) return res.status(400).json({ error: '未知 segment 类型' });
  if (!day || typeof startMinute !== 'number' || typeof duration !== 'number') {
    return res.status(400).json({ error: '参数缺失' });
  }
  const db = loadDB();
  const id = 'seg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const newSeg = { id, type, day, startMinute, duration, title: title || SEGMENT_DEFAULTS[type].label };
  db.segments.push(newSeg);
  saveDB(db);

  const hour = Math.floor(startMinute / 60);
  const byHour = computeDayTotals(db.segments, day);
  const bucket = byHour.get(hour);
  const overflow = bucket && bucket.total > DAY_LIMIT_MINUTES;

  res.json({ ok: true, segment: newSeg, hour, totalMinutes: bucket ? bucket.total : duration, overflow });
});

// DELETE /api/segments/:id
app.delete('/api/segments/:id', (req, res) => {
  const db = loadDB();
  const before = db.segments.length;
  db.segments = db.segments.filter((s) => s.id !== req.params.id);
  saveDB(db);
  res.json({ ok: true, removed: before - db.segments.length });
});

// GET /api/days — 所有已存排播的日期列表
app.get('/api/days', (req, res) => {
  const db = loadDB();
  const days = Array.from(new Set(db.segments.map((s) => s.day))).sort();
  res.json({ days });
});

// POST /api/preset/:name — 加载演示预设
app.post('/api/preset/:name', (req, res) => {
  const db = loadDB();
  const day = req.body.day || new Date().toISOString().slice(0, 10);

  // 清空该日已有的 segment
  db.segments = db.segments.filter((s) => s.day !== day);

  const name = req.params.name;
  const preset = [];

  if (name === 'prime') {
    // 黄金档爆满 19:00-21:00
    preset.push({ type: 'intro', startMinute: 19 * 60 + 0, duration: 3, title: '开场曲' });
    preset.push({ type: 'main', startMinute: 19 * 60 + 3, duration: 22, title: '夜聊电台·第一回' });
    preset.push({ type: 'ad', startMinute: 19 * 60 + 25, duration: 5, title: '赞助商口播' });
    preset.push({ type: 'main', startMinute: 19 * 60 + 30, duration: 25, title: '夜聊电台·第二回' });
    preset.push({ type: 'ad', startMinute: 19 * 60 + 55, duration: 5, title: '贴片广告' });
    preset.push({ type: 'outro', startMinute: 20 * 60 + 0, duration: 4, title: '结语' });
    preset.push({ type: 'intro', startMinute: 20 * 60 + 10, duration: 3, title: '第二档开场' });
    preset.push({ type: 'main', startMinute: 20 * 60 + 13, duration: 30, title: '深夜故事' });
    preset.push({ type: 'ad', startMinute: 20 * 60 + 43, duration: 7, title: '午夜咖啡' });
    preset.push({ type: 'outro', startMinute: 20 * 60 + 50, duration: 5, title: '晚安' });
  } else if (name === 'latenight') {
    // 深夜留白 — 2-6 点保持深蓝，其他时段少内容
    preset.push({ type: 'intro', startMinute: 0, duration: 2, title: '零点过渡' });
    preset.push({ type: 'main', startMinute: 2, duration: 20, title: '轻音乐' });
    preset.push({ type: 'outro', startMinute: 22, duration: 2, title: '淡出' });
    preset.push({ type: 'intro', startMinute: 6 * 60 + 0, duration: 3, title: '清晨信号' });
    preset.push({ type: 'main', startMinute: 6 * 60 + 3, duration: 25, title: '早安广播' });
    preset.push({ type: 'outro', startMinute: 6 * 60 + 28, duration: 3, title: '切新闻' });
  } else if (name === 'overflow') {
    // 严重超时 — 某小时超过 60 分钟
    preset.push({ type: 'intro', startMinute: 19 * 60 + 0, duration: 5, title: '超长片头' });
    preset.push({ type: 'main', startMinute: 19 * 60 + 5, duration: 40, title: '超长正片' });
    preset.push({ type: 'ad', startMinute: 19 * 60 + 45, duration: 10, title: '广告 A' });
    preset.push({ type: 'ad', startMinute: 19 * 60 + 55, duration: 10, title: '广告 B' });
    preset.push({ type: 'main', startMinute: 20 * 60 + 5, duration: 10, title: '加更' });
    preset.push({ type: 'outro', startMinute: 20 * 60 + 15, duration: 5, title: '片尾' });
  } else if (name === 'maintenance') {
    // 停播检修
    preset.push({ type: 'intro', startMinute: 0, duration: 0, title: '__MAINTENANCE_DAY__' });
  } else {
    return res.status(404).json({ error: '未知预设' });
  }

  for (const p of preset) {
    db.segments.push({
      id: 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: p.type,
      day,
      startMinute: p.startMinute,
      duration: p.duration,
      title: p.title
    });
  }
  saveDB(db);

  res.json({ ok: true, day, preset: name });
});

seedDatabase();
app.listen(PORT, () => {
  console.log(`[RadioScheduler] 已启动: http://localhost:${PORT}`);
  console.log(`[RadioScheduler] 数据文件: ${DB_FILE}`);
});
