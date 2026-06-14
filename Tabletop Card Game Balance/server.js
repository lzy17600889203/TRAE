// Tabletop Card Game Balance - Express Server
// 纯 JS 数据存储（JSON 文件持久化），无需编译依赖
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { runMonteCarlo } = require('./simulation');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'cards.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- 数据层 ----------
let _nextId = 1;
function loadCards() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      _nextId = (data.nextId || 0) + 1;
      return data.cards || [];
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveCards(cards) {
  try {
    const nextId = cards.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    fs.writeFileSync(DATA_FILE, JSON.stringify({ cards, nextId }, null, 2));
  } catch (e) { console.warn('saveCards failed', e.message); }
}

function defaultCards() {
  // 初始默认使用 balanced 预设（每费有"镜像卡"，确保 WR 平衡）
  return [
    { id: 1, name: '新兵', cost: 1, attack: 3, health: 2, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 2, name: '新兵乙', cost: 1, attack: 2, health: 3, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 3, name: '守卫', cost: 2, attack: 3, health: 3, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 4, name: '刺客', cost: 2, attack: 4, health: 2, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 5, name: '骑士', cost: 3, attack: 4, health: 3, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 6, name: '战士', cost: 3, attack: 5, health: 2, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 7, name: '术士', cost: 4, attack: 5, health: 4, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 8, name: '法圣', cost: 4, attack: 4, health: 5, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 9, name: '领主', cost: 5, attack: 6, health: 4, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
    { id: 10, name: '巨龙', cost: 5, attack: 5, health: 5, type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0 },
  ];
}

let cards = loadCards();
if (!cards || cards.length === 0) {
  cards = defaultCards();
  saveCards(cards);
}

function persist() { saveCards(cards); }

// ---------- 路由 ----------
app.get('/api/cards', (req, res) => {
  res.json(cards.slice().sort((a, b) => a.id - b.id));
});

app.post('/api/cards', (req, res) => {
  const { name, cost, attack, health, copies, type } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const newCard = {
    id: cards.reduce((m, c) => Math.max(m, c.id), 0) + 1,
    name,
    cost: cost ?? 1,
    attack: attack ?? 1,
    health: health ?? 1,
    copies: copies ?? 2,
    type: type || 'minion',
    win_rate: 0.5,
    avg_turns: 15,
    first_adv: 0.5,
    updated_at: 0,
  };
  cards.push(newCard);
  persist();
  res.json({ id: newCard.id, ok: true });
});

app.put('/api/cards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, cost, attack, health, copies, type } = req.body || {};
  const c = cards.find((x) => x.id === id);
  if (!c) return res.status(404).json({ ok: false });
  if (name !== undefined) c.name = name;
  if (cost !== undefined) c.cost = cost;
  if (attack !== undefined) c.attack = attack;
  if (health !== undefined) c.health = health;
  if (copies !== undefined) c.copies = copies;
  if (type !== undefined) c.type = type;
  persist();
  res.json({ ok: true });
});

app.delete('/api/cards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = cards.length;
  cards = cards.filter((c) => c.id !== id);
  if (cards.length === before) return res.status(404).json({ ok: false });
  persist();
  res.json({ ok: true });
});

// 运行批量蒙特卡洛模拟
app.post('/api/simulate', (req, res) => {
  const { iterations, targetCardId } = req.body || {};
  const n = Math.max(100, Math.min(10000, iterations || 2000));
  if (cards.length < 2) {
    return res.status(400).json({ error: 'need at least 2 cards' });
  }
  const results = {};
  const startTime = Date.now();
  const targets = targetCardId ? cards.filter((c) => c.id === targetCardId) : cards;

  for (const card of targets) {
    const stats = runMonteCarlo(card, cards, n, card.id * 2654435761 + 1);
    results[card.id] = stats;
    card.win_rate = stats.winRateA;
    card.avg_turns = stats.avgTurns;
    card.first_adv = stats.firstPlayerAdvantage;
    card.updated_at = Date.now();
  }
  persist();
  res.json({
    took: Date.now() - startTime,
    iterations: n,
    results,
    cards: cards.slice().sort((a, b) => a.id - b.id),
  });
});

// 状态分析
app.get('/api/status', (req, res) => {
  if (cards.length === 0) return res.json({ status: 'empty', message: '暂无卡牌' });
  const winRates = cards.map((c) => c.win_rate || 0.5);
  const avgTurns = cards.reduce((s, c) => s + (c.avg_turns || 0), 0) / cards.length;
  const maxWR = Math.max(...winRates);
  const minWR = Math.min(...winRates);
  let status = 'balanced';
  let message = '完美平衡';
  if (maxWR > 0.65 || minWR < 0.35) { status = 'broken'; message = '严重超模'; }
  else if (avgTurns > 30) { status = 'stall'; message = '对局时间过长'; }
  res.json({ status, message, maxWinRate: maxWR, minWinRate: minWR, avgTurns, cards });
});

// 三种演示预设
app.post('/api/preset/:type', (req, res) => {
  const type = req.params.type;
  let presets = [];
  if (type === 'broken') {
    // 包含一张严重超模的"毒瘤龙"，其数值 (9/8) 远超同费其他卡
    // 其余卡数值平衡，替换对比时 WR≈0.5
    presets = [
      { name: '新兵', cost: 1, attack: 2, health: 2 },
      { name: '新兵乙', cost: 1, attack: 2, health: 2 },
      { name: '守卫', cost: 2, attack: 3, health: 3 },
      { name: '火枪手', cost: 2, attack: 3, health: 3 },
      { name: '骑士', cost: 3, attack: 3, health: 3 },
      { name: '剑士', cost: 3, attack: 3, health: 3 },
      { name: '术士', cost: 4, attack: 3, health: 4 },
      { name: '⚡毒瘤龙⚡', cost: 4, attack: 9, health: 8 },
      { name: '领主', cost: 5, attack: 4, health: 4 },
      { name: '巨龙', cost: 5, attack: 4, health: 4 },
    ];
  } else if (type === 'balanced') {
    // 每张卡同费都有"镜像"，胜率 WR 集中在 40%-60%，非常平衡
    presets = [
      { name: '新兵', cost: 1, attack: 3, health: 2 },
      { name: '新兵乙', cost: 1, attack: 2, health: 3 },
      { name: '守卫', cost: 2, attack: 3, health: 3 },
      { name: '刺客', cost: 2, attack: 4, health: 2 },
      { name: '骑士', cost: 3, attack: 4, health: 3 },
      { name: '战士', cost: 3, attack: 5, health: 2 },
      { name: '术士', cost: 4, attack: 5, health: 4 },
      { name: '法圣', cost: 4, attack: 4, health: 5 },
      { name: '领主', cost: 5, attack: 6, health: 4 },
      { name: '巨龙', cost: 5, attack: 5, health: 5 },
    ];
  } else if (type === 'stall') {
    // 僵局：全员防御向，攻极低血极高。
    // 每费 2 张相同数值，确保互相替换时 WR 不偏移
    // 总回合数会明显超过 30 回合——界面色调会变成"生锈的铁"
    presets = [
      { name: '石墙甲', cost: 1, attack: 1, health: 20 },
      { name: '石墙乙', cost: 1, attack: 1, health: 20 },
      { name: '厚甲兵甲', cost: 2, attack: 1, health: 20 },
      { name: '厚甲兵乙', cost: 2, attack: 1, health: 20 },
      { name: '重盾卫甲', cost: 3, attack: 1, health: 20 },
      { name: '重盾卫乙', cost: 3, attack: 1, health: 20 },
      { name: '铁甲兽甲', cost: 4, attack: 2, health: 20 },
      { name: '铁甲兽乙', cost: 4, attack: 2, health: 20 },
      { name: '岩石巨人', cost: 5, attack: 2, health: 20 },
      { name: '巨型堡垒', cost: 5, attack: 2, health: 20 },
    ];
  } else {
    return res.status(400).json({ error: 'unknown preset' });
  }
  cards = presets.map((p, i) => ({
    id: i + 1, name: p.name, cost: p.cost, attack: p.attack, health: p.health,
    type: 'minion', copies: 2, win_rate: 0.5, avg_turns: 15, first_adv: 0.5, updated_at: 0,
  }));
  persist();
  res.json({ ok: true, type, cards: cards.slice() });
});

app.listen(PORT, () => {
  console.log(`[TRAE] Tabletop Card Balance running at http://localhost:${PORT}`);
});
