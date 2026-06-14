/* =========================================================
   县域预制菜溯源看板 · 前端脚本
   ========================================================= */

const STAGES = [
  { key: 'pickup',    name: '田间采摘', icon: '🌱', desc: '农户采收 · 农残快检' },
  { key: 'process',   name: '工厂加工', icon: '🏭', desc: '清洗 · 烹制 · 分装' },
  { key: 'coldchain', name: '冷链运输', icon: '❄️', desc: '温控 ≤ 4℃' },
  { key: 'shelf',     name: '门店上架', icon: '🛒', desc: '终端零售' },
];

/* 预设演示批次 */
const DEMO_BATCHES = {
  normal: {
    batch_code: 'NY20260601-001',
    product_name: '冬笋炒腊肉预制包',
    origin: '浙江·安吉县天荒坪镇 · 李大山合作社',
    farmer: '李大山',
    pickup_time: '2026-06-01 06:20',
    process_time: '2026-06-01 09:45',
    coldchain_time: '2026-06-01 14:10',
    shelf_time: '2026-06-03 08:00',
    coldchain_temp: 2.4,
    status: 'normal',
    inspection_report: '农残未检出；菌落总数 120 CFU/g（合格）；大肠菌群 <3 MPN/g；中心温度全程 2.4℃，符合 HACCP 标准。',
    photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20countryside%20bamboo%20forest%20farm%20mountains%20misty%20morning%20harvest&image_size=landscape_16_9',
  },
  alert: {
    batch_code: 'NY20260602-014',
    product_name: '乡村土鸡汤预制包',
    origin: '江西·兴国县茶园乡 · 王春芳散养户',
    farmer: '王春芳',
    pickup_time: '2026-06-02 05:50',
    process_time: '2026-06-02 10:20',
    coldchain_time: '2026-06-02 15:05',
    shelf_time: '2026-06-04 09:30',
    coldchain_temp: 6.8,
    status: 'alert',
    inspection_report: '⚠️ 冷链温度异常！本批次 K5 车厢制冷机组在 15:05-15:40 期间故障，温度升至 6.8℃，已超过 4℃ 安全阈值。建议隔离批次并复检微生物指标。',
    photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20rural%20free%20range%20chicken%20farm%20orange%20sunset%20mountains&image_size=landscape_16_9',
  },
  pending: {
    batch_code: 'NY20260603-027',
    product_name: '农家梅菜扣肉（待扫码）',
    origin: '广东·梅县区松口镇 · 陈锦辉',
    farmer: '陈锦辉',
    pickup_time: '2026-06-03 07:10',
    process_time: null,
    coldchain_time: null,
    shelf_time: null,
    coldchain_temp: null,
    status: 'pending',
    inspection_report: '等待扫码枪录入加工 / 冷链 / 上架数据…',
    photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20hakka%20village%20old%20houses%20tiled%20roof%20dried%20vegetable%20courtyard&image_size=landscape_16_9',
  },
};

/* 与 STAGES 对应，用于提取时间 / 温度 */
function getStageValue(batch, key) {
  switch (key) {
    case 'pickup':    return { time: batch.pickup_time, extra: null };
    case 'process':   return { time: batch.process_time, extra: null };
    case 'coldchain': return { time: batch.coldchain_time, extra: batch.coldchain_temp };
    case 'shelf':     return { time: batch.shelf_time, extra: null };
  }
}

/* 当前选中的批次（用于渲染时间轴） */
let currentBatch = DEMO_BATCHES.normal;

/* ================== DOM 初始化 ================== */
const $timelineSvg = document.getElementById('timeline-svg');
const $nodes = document.getElementById('nodes');
const $flowLight = document.getElementById('flow-light');
const $metaCode = document.getElementById('meta-code');
const $metaProduct = document.getElementById('meta-product');
const $metaOrigin = document.getElementById('meta-origin');
const $alertCard = document.getElementById('alert-card');
const $metaTemp = document.getElementById('meta-temp');
const $metaTempSub = document.getElementById('meta-temp-sub');
const $detailPanel = document.getElementById('detail-panel');
const $batchRows = document.getElementById('batch-rows');
const $toast = document.getElementById('toast');

/* 顶部时钟 */
function tickClock() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  document.getElementById('clock').textContent =
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
setInterval(tickClock, 1000);
tickClock();

/* ================== 渲染时间轴 ================== */
function renderTimeline(batch) {
  currentBatch = batch;
  const overallStatus =
    batch.status === 'alert' ? 'alert' :
    batch.status === 'pending' ? 'pending' : 'normal';

  /* meta 头部 */
  $metaCode.textContent = batch.batch_code;
  $metaProduct.textContent = batch.product_name;
  $metaOrigin.textContent = batch.origin;

  if (overallStatus === 'alert' && typeof batch.coldchain_temp === 'number') {
    $alertCard.hidden = false;
    $metaTemp.textContent = `${batch.coldchain_temp.toFixed(1)} ℃`;
    $metaTempSub.textContent = `超过 4℃ 安全阈值 · 建议隔离批次 NY${batch.batch_code.slice(-3)}`;
  } else {
    $alertCard.hidden = true;
  }

  /* 光带模式 */
  $flowLight.classList.toggle('alert-mode', overallStatus === 'alert');
  $flowLight.classList.toggle('pending-mode', overallStatus === 'pending');

  /* 清除旧节点 */
  $nodes.innerHTML = '';

  /* 构造节点 */
  const nodePositions = [];
  STAGES.forEach((stage, idx) => {
    const { time, extra } = getStageValue(batch, stage.key);

    /* 节点状态：冷链节点决定是否变红 */
    let nodeStatus = 'normal';
    if (!time) {
      nodeStatus = 'pending';
    } else if (stage.key === 'coldchain' && batch.status === 'alert') {
      nodeStatus = 'alert';
    } else if (stage.key === 'coldchain' && typeof extra === 'number' && extra > 4) {
      nodeStatus = 'alert';
    } else if (overallStatus === 'pending' && time) {
      nodeStatus = 'normal';
    } else if (overallStatus === 'pending' && !time) {
      nodeStatus = 'pending';
    }

    const node = document.createElement('div');
    node.className = `node status-${nodeStatus}`;
    node.dataset.stage = stage.key;

    const iconBadge = nodeStatus === 'alert'
      ? `<div class="node-icon">⚠ 温度异常</div>`
      : nodeStatus === 'pending'
        ? `<div class="node-icon">… 待扫码</div>`
        : '';

    const tempLine = (stage.key === 'coldchain' && typeof extra === 'number')
      ? `<div class="node-temp">${extra.toFixed(1)} ℃</div>`
      : '';

    node.innerHTML = `
      ${iconBadge}
      <div class="node-dot" aria-hidden="true"></div>
      <div class="node-label">
        <div class="node-name">${stage.icon} ${stage.name}</div>
        <div class="node-time">${time || '—'}</div>
        ${tempLine}
      </div>
    `;

    node.addEventListener('click', () => openDetail(batch, stage));
    $nodes.appendChild(node);

    nodePositions.push({
      key: stage.key,
      status: nodeStatus,
      el: node,
    });
  });

  /* 更新 SVG 平滑光带 */
  requestAnimationFrame(drawSvgLine);
}

/* 绘制一条曲线，经过每个节点圆心，使其看起来像一条"光带" */
function drawSvgLine() {
  const rect = $timelineSvg.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  $timelineSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const nodeEls = $nodes.querySelectorAll('.node');
  if (nodeEls.length < 2) return;

  const centers = Array.from(nodeEls).map((n) => {
    const dot = n.querySelector('.node-dot').getBoundingClientRect();
    const parent = $timelineSvg.getBoundingClientRect();
    return {
      x: dot.left - parent.left + dot.width / 2,
      y: dot.top - parent.top + dot.height / 2,
      status: n.classList.contains('status-alert') ? 'alert' :
              n.classList.contains('status-pending') ? 'pending' : 'normal',
    };
  });

  const overallAlert = centers.some((c) => c.status === 'alert');
  const overallPending = centers.every((c) => c.status === 'pending');

  /* 使用 Catmull-Rom → 贝塞尔平滑 */
  const d = smoothPath(centers);

  const gradientId = 'glow-grad';
  const strokeColor = overallAlert
    ? '#ff3b5c' : overallPending ? 'rgba(138,167,200,0.5)' : '#34d399';

  $timelineSvg.innerHTML = `
    <defs>
      <linearGradient id="${gradientId}" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="${overallAlert ? '#ff7a8e' : '#6ee7b7'}" stop-opacity="0.25"/>
        <stop offset="50%" stop-color="${strokeColor}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${overallAlert ? '#ff8a3d' : '#38bdf8'}" stop-opacity="0.25"/>
      </linearGradient>
      <filter id="blur-soft" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="3"/>
      </filter>
    </defs>
    <path d="${d}" fill="none" stroke="url(#${gradientId})"
          stroke-width="${overallPending ? 2 : 10}"
          stroke-linecap="round"
          stroke-dasharray="${overallPending ? '10,8' : 'none'}"
          opacity="${overallPending ? 0.8 : 1}"
          filter="${overallPending ? 'none' : 'url(#blur-soft)'}"/>
    <path d="${d}" fill="none" stroke="${strokeColor}"
          stroke-width="2" stroke-linecap="round"
          stroke-dasharray="${overallPending ? '10,8' : 'none'}"
          opacity="${overallPending ? 0.6 : 0.95}"/>
  `;
}

function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

window.addEventListener('resize', () => drawSvgLine());

/* ================== 批次详情面板 ================== */
function openDetail(batch, stage) {
  $detailPanel.hidden = false;
  const alert = batch.status === 'alert';

  document.getElementById('detail-img').src = batch.photo || DEMO_BATCHES.normal.photo;
  document.getElementById('detail-origin').textContent = batch.origin;
  document.getElementById('detail-title').textContent =
    `${stage.icon} ${stage.name} · 批次追溯详情`;
  document.getElementById('detail-code').textContent = batch.batch_code;
  document.getElementById('detail-product').textContent = batch.product_name;
  document.getElementById('detail-pickup').textContent = batch.pickup_time || '—';
  document.getElementById('detail-process').textContent = batch.process_time || '—';
  document.getElementById('detail-temp').textContent =
    typeof batch.coldchain_temp === 'number' ? `${batch.coldchain_temp.toFixed(1)} ℃` : '—';
  document.getElementById('detail-shelf').textContent = batch.shelf_time || '—';
  const report = document.getElementById('detail-report');
  const block = report.parentElement;
  report.textContent = batch.inspection_report || '暂无质检报告';
  block.classList.toggle('danger', alert);

  $detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('close-detail').addEventListener('click', () => {
  $detailPanel.hidden = true;
});

/* ================== 顶部状态切换 ================== */
document.querySelectorAll('.stage-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.stage-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const stage = btn.dataset.stage;
    if (stage === 'reload') {
      await loadRealBatches();
    } else {
      renderTimeline(DEMO_BATCHES[stage]);
    }
  });
});

/* ================== 批次流水表 ================== */
function renderBatchTable(batches) {
  $batchRows.innerHTML = batches.map((b) => {
    const temp = typeof b.coldchain_temp === 'number' ? `${b.coldchain_temp.toFixed(1)} ℃` : '—';
    const badge =
      b.status === 'alert' ? `<span class="badge warn">⚠ 温度异常</span>` :
      b.status === 'pending' ? `<span class="badge wait">◌ 待录入</span>` :
      `<span class="badge ok">✓ 正常</span>`;
    return `
      <tr>
        <td class="mono">${b.batch_code}</td>
        <td>${b.product_name}</td>
        <td>${b.origin || '—'}</td>
        <td>${temp}</td>
        <td>${badge}</td>
        <td><button class="row-btn" data-code="${b.batch_code}">查看 →</button></td>
      </tr>
    `;
  }).join('');

  $batchRows.querySelectorAll('.row-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const hit = batches.find((b) => b.batch_code === code);
      if (hit) renderTimeline(hit);
    });
  });
}

async function loadRealBatches() {
  try {
    const res = await fetch('/api/batches');
    const json = await res.json();
    if (json.ok && json.data.length) {
      /* 取最新一条作为时间轴演示；若没有正常数据，退到演示数据 */
      const first = json.data[0];
      renderTimeline({
        ...first,
        photo: first.status === 'alert' ? DEMO_BATCHES.alert.photo : DEMO_BATCHES.normal.photo,
      });
      renderBatchTable(json.data);
      showToast(`已从后端加载 ${json.data.length} 条批次数据`);
    } else {
      showToast('数据库暂无批次，使用演示数据');
    }
  } catch (e) {
    console.warn('后端不可用，使用演示数据', e);
    showToast('未连接后端，已切换到演示数据');
  }
}

/* ================== 模拟扫码枪录入 ================== */
let scanCursor = 0;
const scanQueue = [
  { stage: 'pickup',    label: '采摘 ✅' },
  { stage: 'process',   label: '加工 ✅' },
  { stage: 'coldchain', label: '冷链 📡', temp: 3.1 },
  { stage: 'shelf',     label: '上架 ✅' },
];

document.getElementById('demo-scan').addEventListener('click', async () => {
  if (scanCursor >= scanQueue.length) {
    scanCursor = 0;
    currentBatch = { ...DEMO_BATCHES.pending };
    renderTimeline(currentBatch);
    showToast('已重置为待录入批次，准备扫码…');
    return;
  }
  const step = scanQueue[scanCursor];
  scanCursor++;

  /* 本地乐观更新 + 通知 */
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  if (step.stage === 'pickup')    currentBatch.pickup_time = timeStr;
  if (step.stage === 'process')   currentBatch.process_time = timeStr;
  if (step.stage === 'coldchain') {
    currentBatch.coldchain_time = timeStr;
    currentBatch.coldchain_temp = step.temp;
    if (step.temp > 4) currentBatch.status = 'alert';
  }
  if (step.stage === 'shelf') {
    currentBatch.shelf_time = timeStr;
    currentBatch.status = currentBatch.status === 'alert' ? 'alert' : 'normal';
    currentBatch.inspection_report = currentBatch.status === 'alert'
      ? '⚠ 冷链温度异常批次，建议复检后上架。'
      : '全程温控合格，可正常销售。';
  }

  renderTimeline(currentBatch);
  showToast(`📟 扫码：${step.label}  ${timeStr}`);

  /* 尽力推送到后端（不阻塞） */
  try {
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch_code: currentBatch.batch_code,
        stage: step.stage,
        temp: step.temp,
        product_name: currentBatch.product_name,
        origin: currentBatch.origin,
        farmer: currentBatch.farmer,
      }),
    });
  } catch (_) { /* offline ok */ }
});

/* ================== Toast ================== */
let toastTimer;
function showToast(msg) {
  $toast.textContent = msg;
  $toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($toast.hidden = true), 2400);
}

/* ================== 启动 ================== */
renderTimeline(DEMO_BATCHES.normal);
loadRealBatches();
