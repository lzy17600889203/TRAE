const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- 持久化 ----------
function loadOrders() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

let ORDERS = loadOrders();

function saveOrders() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(ORDERS, null, 2), 'utf-8');
  } catch (e) {
    console.error('保存失败:', e);
  }
}

// ---------- 预设数据 ----------
function seedPreset(name) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const samples = [
    { t: '蓝色牛仔托特包', o: '旧牛仔裤', target: '托特包', p: 'denim' },
    { t: '碎花拼布抱枕', o: '旧碎花连衣裙', target: '拼布抱枕', p: 'floral' },
    { t: '军绿改造短裤', o: '旧军绿长裤', target: '休闲短裤', p: 'cargo' },
    { t: '白 T 收纳袋', o: '棉质 T 恤', target: '小收纳袋', p: 'tshirt' },
    { t: '羊毛渔夫帽', o: '旧毛呢外套', target: '保暖帽', p: 'wool' },
    { t: '丝绒晚宴包', o: '旧丝绒裙', target: '手拿包', p: 'velvet' },
    { t: '格子围巾', o: '旧格子衬衫', target: '复古围巾', p: 'plaid' },
    { t: '皮革钱包', o: '旧皮夹克', target: '长款钱包', p: 'leather' },
    { t: '针织地垫', o: '旧毛衣', target: '圆形地垫', p: 'knit' },
    { t: '牛仔笔袋', o: '旧牛仔夹克', target: '文具笔袋', p: 'denim2' },
    { t: '亚麻窗帘', o: '旧亚麻衬衫', target: '布艺窗帘', p: 'linen' },
    { t: '帆布手提袋', o: '旧帆布袋', target: '手提袋', p: 'canvas' },
  ];

  if (name === 'productive') {
    return samples.slice(0, 9).map((s, i) => ({
      id: Math.random().toString(36).slice(2, 10),
      title: s.t,
      original: s.o,
      target: s.target,
      photo: s.p,
      status: 'done',
      created_at: now - (9 - i) * DAY,
      updated_at: now - (8 - i) * DAY,
      notes: '已完成改造，可通知客户取件。',
    }));
  }
  if (name === 'backlog') {
    return samples.map((s, i) => ({
      id: Math.random().toString(36).slice(2, 10),
      title: s.t,
      original: s.o,
      target: s.target,
      photo: s.p,
      status: 'pending',
      created_at: now - (12 - i) * DAY,
      updated_at: now - (12 - i) * DAY,
      notes: '客户正在排队等候。',
    }));
  }
  if (name === 'working') {
    return samples.slice(0, 4).map((s, i) => ({
      id: Math.random().toString(36).slice(2, 10),
      title: s.t,
      original: s.o,
      target: s.target,
      photo: s.p,
      status: 'working',
      created_at: now - (4 - i) * DAY,
      updated_at: now - 2 * 60 * 60 * 1000,
      notes: '缝纫机上作业中。',
    }));
  }
  // mixed
  return [
    { id: 'a1', title: '牛仔托特包', original: '旧牛仔裤', target: '托特包', photo: 'denim', status: 'pending', created_at: now - 10 * DAY, updated_at: now - 10 * DAY, notes: '客户希望使用口袋做装饰。' },
    { id: 'a2', title: '拼布抱枕', original: '旧碎花裙', target: '拼布抱枕', photo: 'floral', status: 'pending', created_at: now - 8 * DAY, updated_at: now - 8 * DAY, notes: '尺寸约 40×40。' },
    { id: 'a3', title: '皮革钱包', original: '旧皮夹克', target: '长款钱包', photo: 'leather', status: 'working', created_at: now - 3 * DAY, updated_at: now - 1 * 60 * 60 * 1000, notes: '裁切完成，开始缝制。' },
    { id: 'a4', title: '针织毛毯', original: '旧毛衣', target: '拼接地垫', photo: 'knit', status: 'working', created_at: now - 9 * DAY, updated_at: now - 9 * DAY, notes: '改造周期略长，需提醒客户。' },
    { id: 'a5', title: '帆布收纳', original: '旧帆布袋', target: '收纳包', photo: 'canvas', status: 'done', created_at: now - 14 * DAY, updated_at: now - 2 * DAY, notes: '已交付。' },
    { id: 'a6', title: '格子围巾', original: '旧格子衬衫', target: '复古围巾', photo: 'plaid', status: 'done', created_at: now - 12 * DAY, updated_at: now - 4 * DAY, notes: '已交付。' },
  ];
}

// ---------- API ----------
app.get('/api/orders', (_req, res) => {
  const sorted = [...ORDERS].sort((a, b) => b.updated_at - a.updated_at);
  res.json(sorted);
});

app.get('/api/orders/:id', (req, res) => {
  const order = ORDERS.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const { title, original, target, photo, notes } = req.body || {};
  if (!title || !original || !target) {
    return res.status(400).json({ error: 'title / original / target 为必填' });
  }
  const now = Date.now();
  const order = {
    id: Math.random().toString(36).slice(2, 10),
    title,
    original,
    target,
    photo: photo || null,
    status: 'pending',
    created_at: now,
    updated_at: now,
    notes: notes || null,
  };
  ORDERS.unshift(order);
  saveOrders();
  res.status(201).json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const order = ORDERS.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  const { title, original, target, photo, status, notes } = req.body || {};
  if (title !== undefined) order.title = title;
  if (original !== undefined) order.original = original;
  if (target !== undefined) order.target = target;
  if (photo !== undefined) order.photo = photo;
  if (notes !== undefined) order.notes = notes;
  if (status && ['pending', 'working', 'done'].includes(status)) order.status = status;
  order.updated_at = Date.now();
  saveOrders();
  res.json(order);
});

app.delete('/api/orders/:id', (req, res) => {
  const idx = ORDERS.findIndex((o) => o.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: '订单不存在' });
  ORDERS.splice(idx, 1);
  saveOrders();
  res.json({ ok: true });
});

app.delete('/api/orders', (_req, res) => {
  ORDERS = [];
  saveOrders();
  res.json({ ok: true });
});

app.post('/api/preset/:name', (req, res) => {
  const name = req.params.name;
  ORDERS = seedPreset(name);
  saveOrders();
  res.json({ ok: true, count: ORDERS.length, preset: name });
});

app.listen(PORT, () => {
  console.log(`[Upcycled Studio] 服务器已启动: http://localhost:${PORT}`);
});
