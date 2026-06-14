// 卡牌数值调优沙盘 - 前端主逻辑
const API_BASE = '/api';

const state = {
  cards: [],
  simResults: {}, // cardId -> { history, winRateA, avgTurns, firstAdv }
  selectedCardId: null,
  status: 'balanced',
  statusMessage: '加载中...',
};

// ========== 工具函数 ==========
async function api(path, options) {
  const res = await fetch(API_BASE + path, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error('HTTP ' + res.status + ': ' + err);
  }
  return res.json();
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function winRateColor(wr) {
  if (wr > 0.65) return '#ff3b5c';
  if (wr > 0.55) return '#ffd23f';
  if (wr > 0.45) return '#57d68c';
  if (wr > 0.35) return '#4aa8ff';
  return '#7d5fff';
}

function isBroken(wr) { return wr > 0.65 || wr < 0.35; }

// ========== 卡牌列表渲染 ==========
function renderCards() {
  const list = $('#cardsList');
  list.innerHTML = '';
  state.cards.forEach((c) => {
    const wr = c.win_rate || 0.5;
    const broken = wr > 0.65;
    const row = document.createElement('div');
    row.className = 'card-row' + (broken ? ' op' : '') +
      (state.selectedCardId === c.id ? ' selected' : '');
    row.innerHTML = `
      <div class="card-icon" title="${broken ? '毒瘤卡' : '普通卡'}">
        ${broken ? '🕶️' : '⚔'}
      </div>
      <div class="card-body">
        <div class="card-title">
          <input type="text" class="edit-name" value="${escapeHtml(c.name)}" data-id="${c.id}" />
          <span class="card-wr" style="color:${winRateColor(wr)}">${(wr * 100).toFixed(1)}%</span>
        </div>
        <div class="card-meta">
          <span class="stat-chip cost">费 <input type="number" min="0" max="10" value="${c.cost}" data-field="cost" data-id="${c.id}" /></span>
          <span class="stat-chip atk">攻 <input type="number" min="0" value="${c.attack}" data-field="attack" data-id="${c.id}" /></span>
          <span class="stat-chip hp">血 <input type="number" min="1" value="${c.health}" data-field="health" data-id="${c.id}" /></span>
          <span class="stat-chip">回合 ${(c.avg_turns || 0).toFixed(1)}</span>
        </div>
      </div>
      <button class="del-btn" data-del="${c.id}">删除</button>
    `;
    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.classList.contains('del-btn')) return;
      state.selectedCardId = c.id;
      $('#selectedCardName').textContent = c.name;
      $('#chartTitle').textContent = `${c.name} · 胜率收敛曲线`;
      renderCards();
      drawChart();
    });
    list.appendChild(row);
  });

  // 绑定编辑
  $$('#cardsList input[type="number"]').forEach((inp) => {
    inp.addEventListener('change', async () => {
      const id = parseInt(inp.dataset.id, 10);
      const field = inp.dataset.field;
      const card = state.cards.find((c) => c.id === id);
      if (!card) return;
      card[field] = parseInt(inp.value, 10) || 0;
      await api('/cards/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: card.name, cost: card.cost, attack: card.attack, health: card.health,
          copies: card.copies, type: card.type,
        }),
      });
      renderCards();
      drawSandbox();
    });
  });

  $$('#cardsList .edit-name').forEach((inp) => {
    inp.addEventListener('change', async () => {
      const id = parseInt(inp.dataset.id, 10);
      const card = state.cards.find((c) => c.id === id);
      if (!card) return;
      card.name = inp.value;
      await api('/cards/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: card.name, cost: card.cost, attack: card.attack, health: card.health,
          copies: card.copies, type: card.type,
        }),
      });
    });
  });

  $$('#cardsList .del-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.del, 10);
      if (!confirm('删除这张卡？')) return;
      await api('/cards/' + id, { method: 'DELETE' });
      if (state.selectedCardId === id) state.selectedCardId = null;
      await loadCards();
    });
  });

  // 自动选中第一张
  if (!state.selectedCardId && state.cards.length > 0) {
    state.selectedCardId = state.cards[0].id;
    $('#selectedCardName').textContent = state.cards[0].name;
    $('#chartTitle').textContent = `${state.cards[0].name} · 胜率收敛曲线`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ========== 状态检测 & 更新 ==========
function updateStatusFromCards() {
  if (state.cards.length === 0) {
    state.status = 'empty';
    state.statusMessage = '暂无卡牌';
  } else {
    const winRates = state.cards.map((c) => c.win_rate || 0.5);
    const avgTurns = state.cards.reduce((s, c) => s + (c.avg_turns || 15), 0) / state.cards.length;
    const maxWR = Math.max(...winRates);
    const minWR = Math.min(...winRates);
    if (maxWR > 0.65 || minWR < 0.35) {
      state.status = 'broken';
      state.statusMessage = '严重超模 ⚠ 毒瘤警报';
    } else if (avgTurns > 30) {
      state.status = 'stall';
      state.statusMessage = '对局时间过长 ⌛';
    } else {
      state.status = 'balanced';
      state.statusMessage = '完美平衡 ✔';
    }
  }
  applyTheme();
}

function applyTheme() {
  document.body.dataset.status = state.status;
  $('#statusText').textContent = state.statusMessage;
  const dot = $('.status-dot');
  const colors = {
    broken: '#ff3b5c',
    balanced: '#57d68c',
    stall: '#ffb56b',
    empty: '#8b9cb3',
  };
  dot.style.background = colors[state.status] || '#4aa8ff';
  dot.style.boxShadow = `0 0 12px ${colors[state.status] || '#4aa8ff'}`;

  // 顶部指标
  if (state.cards.length > 0) {
    const maxWR = Math.max(...state.cards.map((c) => c.win_rate || 0.5));
    const avg = state.cards.reduce((s, c) => s + (c.avg_turns || 0), 0) / state.cards.length;
    const first = state.cards.reduce((s, c) => s + (c.first_adv || 0.5), 0) / state.cards.length;
    $('#mMaxWR').textContent = (maxWR * 100).toFixed(1) + '%';
    $('#mAvgTurns').textContent = avg.toFixed(1);
    $('#mFirstAdv').textContent = (first * 100).toFixed(1) + '%';
  }
}

// ========== 沙盘 Canvas ==========
let sandboxCtx, sandboxCanvas;
let sandboxParticles = [];
let sandboxTime = 0;

function setupSandbox() {
  sandboxCanvas = $('#sandboxCanvas');
  sandboxCtx = sandboxCanvas.getContext('2d');
  resizeCanvas(sandboxCanvas, sandboxCtx);
  window.addEventListener('resize', () => {
    resizeCanvas(sandboxCanvas, sandboxCtx);
    resizeCanvas($('#chartCanvas'), $('#chartCanvas').getContext('2d'));
  });
  requestAnimationFrame(loopSandbox);
}

function resizeCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = Math.max(400, rect.height) * dpr;
  canvas.style.height = Math.max(400, rect.height) + 'px';
  ctx.scale(dpr, dpr);
}

function drawSandbox() {
  // 标记重绘需要刷新节点位置
  sandboxParticles = state.cards.map((c) => {
    const existing = sandboxParticles.find((p) => p.id === c.id);
    const basePower = (c.attack + c.health) / (2 + c.cost);
    return existing || {
      id: c.id,
      x: Math.random() * 600,
      y: Math.random() * 400,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      baseSize: 14 + basePower * 4,
      bobPhase: Math.random() * Math.PI * 2,
    };
  });
}

function loopSandbox() {
  sandboxTime += 1;
  const w = sandboxCanvas.width / (window.devicePixelRatio || 1);
  const h = sandboxCanvas.height / (window.devicePixelRatio || 1);

  // 背景根据状态改变
  const bgGrad = sandboxCtx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
  if (state.status === 'broken') {
    bgGrad.addColorStop(0, 'rgba(255, 59, 92, 0.12)');
    bgGrad.addColorStop(1, 'rgba(20, 6, 12, 0)');
  } else if (state.status === 'stall') {
    bgGrad.addColorStop(0, 'rgba(160, 98, 59, 0.15)');
    bgGrad.addColorStop(1, 'rgba(20, 14, 8, 0)');
  } else {
    bgGrad.addColorStop(0, 'rgba(87, 214, 140, 0.08)');
    bgGrad.addColorStop(1, 'rgba(8, 20, 20, 0)');
  }
  sandboxCtx.clearRect(0, 0, w, h);
  sandboxCtx.fillStyle = bgGrad;
  sandboxCtx.fillRect(0, 0, w, h);

  // 网格
  sandboxCtx.strokeStyle = 'rgba(255,255,255,0.03)';
  sandboxCtx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    sandboxCtx.beginPath(); sandboxCtx.moveTo(x, 0); sandboxCtx.lineTo(x, h); sandboxCtx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    sandboxCtx.beginPath(); sandboxCtx.moveTo(0, y); sandboxCtx.lineTo(w, y); sandboxCtx.stroke();
  }

  // 节点
  const cards = state.cards;
  if (cards.length === 0) {
    sandboxCtx.fillStyle = 'rgba(255,255,255,0.4)';
    sandboxCtx.font = '16px sans-serif';
    sandboxCtx.textAlign = 'center';
    sandboxCtx.fillText('请先添加卡牌', w / 2, h / 2);
    requestAnimationFrame(loopSandbox);
    return;
  }

  // 节点间连线（根据费用相似）
  for (let i = 0; i < sandboxParticles.length; i++) {
    for (let j = i + 1; j < sandboxParticles.length; j++) {
      const p1 = sandboxParticles[i]; const p2 = sandboxParticles[j];
      const c1 = cards.find((c) => c.id === p1.id);
      const c2 = cards.find((c) => c.id === p2.id);
      if (!c1 || !c2) continue;
      const dx = p1.x - p2.x; const dy = p1.y - p2.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 180) {
        const alpha = (1 - d / 180) * 0.18;
        sandboxCtx.strokeStyle = `rgba(120, 160, 220, ${alpha})`;
        sandboxCtx.lineWidth = 1;
        sandboxCtx.beginPath();
        sandboxCtx.moveTo(p1.x, p1.y); sandboxCtx.lineTo(p2.x, p2.y);
        sandboxCtx.stroke();
      }
    }
  }

  // 更新位置与绘制
  sandboxParticles.forEach((p) => {
    const card = cards.find((c) => c.id === p.id);
    if (!card) return;
    p.x += p.vx; p.y += p.vy;
    p.bobPhase += 0.02;
    // 弹回边界
    if (p.x < 30 || p.x > w - 30) p.vx *= -1;
    if (p.y < 30 || p.y > h - 30) p.vy *= -1;
    // 轻微漂移
    p.vx += (Math.random() - 0.5) * 0.04;
    p.vy += (Math.random() - 0.5) * 0.04;
    p.vx = Math.max(-1.2, Math.min(1.2, p.vx));
    p.vy = Math.max(-1.2, Math.min(1.2, p.vy));

    const wr = card.win_rate || 0.5;
    const color = winRateColor(wr);
    const bob = Math.sin(p.bobPhase) * 2;
    const cx = p.x; const cy = p.y + bob;
    const size = p.baseSize + (wr > 0.65 ? Math.sin(sandboxTime * 0.1) * 4 + 4 : 0);

    // 外发光
    if (wr > 0.65) {
      const glow = sandboxCtx.createRadialGradient(cx, cy, 0, cx, cy, size * 3.2);
      glow.addColorStop(0, 'rgba(255, 59, 92, 0.7)');
      glow.addColorStop(1, 'rgba(255, 59, 92, 0)');
      sandboxCtx.fillStyle = glow;
      sandboxCtx.beginPath(); sandboxCtx.arc(cx, cy, size * 3.2, 0, Math.PI * 2); sandboxCtx.fill();
    } else if (state.status === 'balanced') {
      const glow = sandboxCtx.createRadialGradient(cx, cy, 0, cx, cy, size * 2);
      glow.addColorStop(0, 'rgba(87, 214, 140, 0.25)');
      glow.addColorStop(1, 'rgba(87, 214, 140, 0)');
      sandboxCtx.fillStyle = glow;
      sandboxCtx.beginPath(); sandboxCtx.arc(cx, cy, size * 2, 0, Math.PI * 2); sandboxCtx.fill();
    } else if (state.status === 'stall') {
      const glow = sandboxCtx.createRadialGradient(cx, cy, 0, cx, cy, size * 2);
      glow.addColorStop(0, 'rgba(160, 98, 59, 0.35)');
      glow.addColorStop(1, 'rgba(160, 98, 59, 0)');
      sandboxCtx.fillStyle = glow;
      sandboxCtx.beginPath(); sandboxCtx.arc(cx, cy, size * 2, 0, Math.PI * 2); sandboxCtx.fill();
    }

    // 主体
    sandboxCtx.beginPath();
    sandboxCtx.fillStyle = color;
    sandboxCtx.arc(cx, cy, size, 0, Math.PI * 2);
    sandboxCtx.fill();
    sandboxCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    sandboxCtx.lineWidth = 2;
    sandboxCtx.stroke();

    // 费用角标（左上小方块）
    sandboxCtx.fillStyle = '#2c3a55';
    sandboxCtx.fillRect(cx - size - 2, cy - size - 2, 16, 16);
    sandboxCtx.fillStyle = '#fff';
    sandboxCtx.font = 'bold 12px sans-serif';
    sandboxCtx.textAlign = 'center'; sandboxCtx.textBaseline = 'middle';
    sandboxCtx.fillText(card.cost, cx - size + 6, cy - size + 6);

    // 攻/血
    sandboxCtx.fillStyle = '#fff';
    sandboxCtx.font = 'bold 13px sans-serif';
    sandboxCtx.textAlign = 'center'; sandboxCtx.textBaseline = 'middle';
    sandboxCtx.fillText(`${card.attack}/${card.health}`, cx, cy);

    // 卡名（在节点下方）
    sandboxCtx.fillStyle = 'rgba(255,255,255,0.85)';
    sandboxCtx.font = '11px sans-serif';
    sandboxCtx.fillText(card.name.slice(0, 8), cx, cy + size + 14);

    // 选中高亮
    if (card.id === state.selectedCardId) {
      sandboxCtx.strokeStyle = 'rgba(74, 168, 255, 0.9)';
      sandboxCtx.lineWidth = 2;
      sandboxCtx.setLineDash([4, 4]);
      sandboxCtx.beginPath(); sandboxCtx.arc(cx, cy, size + 8, 0, Math.PI * 2); sandboxCtx.stroke();
      sandboxCtx.setLineDash([]);
    }
  });

  requestAnimationFrame(loopSandbox);
}

// ========== 胜率折线图 ==========
let chartCtx, chartCanvas;
function setupChart() {
  chartCanvas = $('#chartCanvas');
  chartCtx = chartCanvas.getContext('2d');
  resizeCanvas(chartCanvas, chartCtx);
}

function drawChart() {
  if (!chartCtx) return;
  const w = chartCanvas.width / (window.devicePixelRatio || 1);
  const h = chartCanvas.height / (window.devicePixelRatio || 1);
  chartCtx.clearRect(0, 0, w, h);

  const pad = { top: 24, right: 24, bottom: 40, left: 48 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  // 背景格
  chartCtx.strokeStyle = 'rgba(255,255,255,0.05)';
  chartCtx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (ch * i) / 5;
    chartCtx.beginPath(); chartCtx.moveTo(pad.left, y); chartCtx.lineTo(pad.left + cw, y); chartCtx.stroke();
  }

  // y 轴刻度 0-100%
  chartCtx.fillStyle = 'rgba(255,255,255,0.5)';
  chartCtx.font = '11px sans-serif';
  chartCtx.textAlign = 'right'; chartCtx.textBaseline = 'middle';
  for (let i = 0; i <= 5; i++) {
    const v = 1 - i * 0.2;
    const y = pad.top + (ch * i) / 5;
    chartCtx.fillText((v * 100).toFixed(0) + '%', pad.left - 8, y);
  }

  // 阈值线：65%, 50%, 35%
  drawThreshold(cw, ch, pad, 0.65, '#ff3b5c', '65%');
  drawThreshold(cw, ch, pad, 0.5, '#57d68c', '50%');
  drawThreshold(cw, ch, pad, 0.35, '#7d5fff', '35%');

  // 获取曲线数据
  let series = [];
  let titleLines = [];
  if (state.selectedCardId && state.simResults[state.selectedCardId]) {
    series = state.simResults[state.selectedCardId].history || [];
    titleLines = [`${(state.simResults[state.selectedCardId].winRateA * 100).toFixed(1)}%`];
  } else {
    // 如果没有针对这张卡的模拟，则绘制所有卡的 win_rate 水平线比较
    const all = state.cards;
    if (all.length > 0) {
      // 画平滑对比线
      all.forEach((c, idx) => {
        chartCtx.setLineDash([4, 4]);
        chartCtx.strokeStyle = winRateColor(c.win_rate || 0.5);
        chartCtx.lineWidth = 1.2;
        const y = pad.top + ch * (1 - (c.win_rate || 0.5));
        chartCtx.beginPath(); chartCtx.moveTo(pad.left, y); chartCtx.lineTo(pad.left + cw, y); chartCtx.stroke();
        chartCtx.setLineDash([]);
        chartCtx.fillStyle = winRateColor(c.win_rate || 0.5);
        chartCtx.font = '10px sans-serif';
        chartCtx.textAlign = 'left';
        chartCtx.textBaseline = 'middle';
        chartCtx.fillText(c.name.slice(0, 6) + ' ' + ((c.win_rate || 0.5) * 100).toFixed(0) + '%', pad.left + 6, y - 6);
      });
    }
  }

  if (series.length > 0) {
    const maxSample = series[series.length - 1].sample;
    const minSample = series[0].sample;
    const xFor = (s) => pad.left + ((s - minSample) / Math.max(1, maxSample - minSample)) * cw;
    const yFor = (v) => pad.top + ch * (1 - v);

    // 曲线
    chartCtx.strokeStyle = '#4aa8ff';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    series.forEach((pt, i) => {
      const x = xFor(pt.sample);
      const y = yFor(pt.winRate);
      if (i === 0) chartCtx.moveTo(x, y); else chartCtx.lineTo(x, y);
    });
    chartCtx.stroke();

    // 填充
    chartCtx.fillStyle = 'rgba(74, 168, 255, 0.15)';
    chartCtx.lineTo(xFor(series[series.length - 1].sample), pad.top + ch);
    chartCtx.lineTo(xFor(series[0].sample), pad.top + ch);
    chartCtx.closePath();
    chartCtx.fill();

    // 点
    series.forEach((pt) => {
      const x = xFor(pt.sample); const y = yFor(pt.winRate);
      chartCtx.beginPath();
      chartCtx.fillStyle = winRateColor(pt.winRate);
      chartCtx.arc(x, y, 3, 0, Math.PI * 2);
      chartCtx.fill();
    });

    // x 轴
    chartCtx.fillStyle = 'rgba(255,255,255,0.5)';
    chartCtx.font = '11px sans-serif';
    chartCtx.textAlign = 'center';
    chartCtx.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) {
      const x = pad.left + (cw * i) / 4;
      const sample = minSample + (maxSample - minSample) * (i / 4);
      chartCtx.fillText(Math.round(sample) + '局', x, pad.top + ch + 8);
    }

    // 当前胜率大数字
    if (series.length > 0) {
      const latest = series[series.length - 1];
      chartCtx.fillStyle = winRateColor(latest.winRate);
      chartCtx.font = 'bold 28px sans-serif';
      chartCtx.textAlign = 'right'; chartCtx.textBaseline = 'top';
      chartCtx.fillText((latest.winRate * 100).toFixed(1) + '%', pad.left + cw, pad.top + 4);
    }
  } else {
    chartCtx.fillStyle = 'rgba(255,255,255,0.4)';
    chartCtx.font = '14px sans-serif';
    chartCtx.textAlign = 'center'; chartCtx.textBaseline = 'middle';
    chartCtx.fillText('点击「▶ 运行蒙特卡洛」开始模拟', pad.left + cw / 2, pad.top + ch / 2);
  }
}

function drawThreshold(cw, ch, pad, value, color, label) {
  const y = pad.top + ch * (1 - value);
  chartCtx.setLineDash([6, 4]);
  chartCtx.strokeStyle = color;
  chartCtx.lineWidth = 1;
  chartCtx.beginPath(); chartCtx.moveTo(pad.left, y); chartCtx.lineTo(pad.left + cw, y); chartCtx.stroke();
  chartCtx.setLineDash([]);
  chartCtx.fillStyle = color;
  chartCtx.font = '10px sans-serif';
  chartCtx.textAlign = 'left'; chartCtx.textBaseline = 'middle';
  chartCtx.fillText(label, pad.left + cw - 30, y - 6);
}

// ========== 事件绑定 ==========
function bindEvents() {
  $('#addCardBtn').addEventListener('click', async () => {
    const name = $('#newName').value.trim() || '无名卡';
    const cost = parseInt($('#newCost').value, 10) || 1;
    const attack = parseInt($('#newAttack').value, 10) || 1;
    const health = parseInt($('#newHealth').value, 10) || 1;
    await api('/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cost, attack, health, copies: 2, type: 'minion' }),
    });
    $('#newName').value = '';
    await loadCards();
  });

  $('#runSimBtn').addEventListener('click', runSimulation);

  $$('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.preset;
      const result = await api('/preset/' + type, { method: 'POST' });
      state.cards = result.cards;
      state.simResults = {};
      state.selectedCardId = result.cards[0]?.id || null;
      if (state.selectedCardId) {
        const c = state.cards.find((x) => x.id === state.selectedCardId);
        $('#selectedCardName').textContent = c?.name || '—';
        $('#chartTitle').textContent = `${c?.name || '—'} · 胜率收敛曲线`;
      }
      renderCards();
      drawSandbox();
      drawChart();
      // 运行模拟让演示效果生效
      await runSimulation(true);
    });
  });
}

async function loadCards() {
  const cards = await api('/cards');
  state.cards = cards;
  updateStatusFromCards();
  renderCards();
  drawSandbox();
  drawChart();
}

async function runSimulation(silent) {
  const btn = $('#runSimBtn');
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = '模拟中...';
  try {
    const iterations = parseInt($('#iterations').value, 10) || 2000;
    const res = await api('/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iterations }),
    });
    state.cards = res.cards;
    state.simResults = res.results;
    updateStatusFromCards();
    renderCards();
    drawSandbox();
    drawChart();
    if (!silent) {
      showToast(`✓ 模拟完成，共 ${res.iterations * state.cards.length} 局对战，耗时 ${res.took}ms`);
    }
  } catch (err) {
    alert('模拟失败：' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    background: rgba(20, 30, 45, 0.95); color: #fff; padding: 12px 20px;
    border-radius: 10px; border: 1px solid var(--accent); z-index: 100;
    font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    opacity: 0; transition: opacity 0.3s;
  `;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2500);
}

// ========== 启动 ==========
window.addEventListener('DOMContentLoaded', async () => {
  setupSandbox();
  setupChart();
  bindEvents();
  await loadCards();
  // 启动时自动跑一次模拟，让界面有内容
  await runSimulation(true);
});
