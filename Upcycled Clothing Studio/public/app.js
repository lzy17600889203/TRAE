(function () {
  const API = '/api/orders';
  const DAY = 24 * 60 * 60 * 1000;

  const columns = {
    pending: document.getElementById('col-pending'),
    working: document.getElementById('col-working'),
    done: document.getElementById('col-done'),
  };

  const counts = {
    pending: document.getElementById('count-pending'),
    working: document.getElementById('count-working'),
    done: document.getElementById('count-done'),
  };

  const emptyState = document.getElementById('empty-state');
  const board = document.getElementById('board');
  const backlogBanner = document.getElementById('backlog-banner');
  const dialog = document.getElementById('new-order-dialog');
  const form = document.getElementById('new-order-form');

  // 布艺风格配色
  const palettes = {
    denim: { a: '#3b5f8a', b: '#7ea3c7', c: '#1f3a5f' },
    floral: { a: '#f8b4c4', b: '#ffd9e0', c: '#b23a5e' },
    cargo: { a: '#4b5538', b: '#a8b27a', c: '#2e3821' },
    tshirt: { a: '#ffffff', b: '#e0e0e0', c: '#7c7c7c' },
    wool: { a: '#6b4e2e', b: '#c69c6d', c: '#3a2a14' },
    velvet: { a: '#7a1f4d', b: '#b85a8a', c: '#3d0e26' },
    plaid: { a: '#c2410c', b: '#fde68a', c: '#7c2d12' },
    leather: { a: '#6b3f1d', b: '#a0703d', c: '#3a1f0a' },
    knit: { a: '#8b5e3c', b: '#d4a373', c: '#5d3a1c' },
    denim2: { a: '#2c4a70', b: '#6b96c4', c: '#182d44' },
    linen: { a: '#e8dcc4', b: '#f5ecd7', c: '#8a7a5c' },
    canvas: { a: '#c9b79a', b: '#e5d9c3', c: '#6d5a3c' },
    default: { a: '#f59e0b', b: '#fde68a', c: '#92400e' },
  };

  function pickPalette(key) {
    return palettes[key] || palettes.default;
  }

  function clothingSVG(key) {
    const p = pickPalette(key);
    const patterns = {
      denim: `
        <rect width="300" height="200" fill="${p.b}"/>
        <g stroke="${p.c}" stroke-width="1.2" opacity="0.6">
          <line x1="0" y1="10" x2="300" y2="10"/><line x1="0" y1="30" x2="300" y2="30"/>
          <line x1="0" y1="50" x2="300" y2="50"/><line x1="0" y1="70" x2="300" y2="70"/>
          <line x1="0" y1="90" x2="300" y2="90"/><line x1="0" y1="110" x2="300" y2="110"/>
          <line x1="0" y1="130" x2="300" y2="130"/><line x1="0" y1="150" x2="300" y2="150"/>
          <line x1="0" y1="170" x2="300" y2="170"/><line x1="0" y1="190" x2="300" y2="190"/>
        </g>
        <path d="M100 40 l50 0 l0 40 l-30 0 l-20 -40 z M200 40 l50 0 l0 40 l-30 0 l-20 -40 z" fill="${p.a}" stroke="${p.c}" stroke-width="2"/>
        <rect x="90" y="120" width="120" height="60" rx="6" fill="${p.a}" stroke="${p.c}" stroke-width="2"/>
      `,
      floral: `
        <rect width="300" height="200" fill="${p.b}"/>
        ${Array.from({ length: 18 }).map((_, i) => {
          const cx = (i * 53) % 300 + 15;
          const cy = ((i * 71) % 180) + 15;
          return `<g transform="translate(${cx} ${cy})">
            <circle r="10" fill="${p.a}" opacity="0.8"/>
            <circle r="4" fill="${p.c}"/>
          </g>`;
        }).join('')}
        <path d="M80 180 Q150 60 220 180 Z" fill="${p.a}" stroke="${p.c}" stroke-width="2" opacity="0.85"/>
      `,
      default: `
        <rect width="300" height="200" fill="${p.b}"/>
        <path d="M60 50 l100 -20 l100 20 l-20 80 l-60 30 l-60 -30 z" fill="${p.a}" stroke="${p.c}" stroke-width="2"/>
        <circle cx="150" cy="140" r="30" fill="${p.b}" stroke="${p.c}" stroke-width="2"/>
        <text x="150" y="146" text-anchor="middle" font-size="24" fill="${p.c}">♻</text>
      `,
    };
    return patterns[key] || patterns.default;
  }

  function daysAgo(ts) {
    return Math.floor((Date.now() - ts) / DAY);
  }

  function isOverdue(order) {
    // 超过 7 天未完成（从 created_at 到当前，且状态不是 done）
    if (order.status === 'done') return false;
    return (Date.now() - order.created_at) > 7 * DAY;
  }

  function renderCard(order) {
    const div = document.createElement('article');
    div.className = `card status-${order.status}${isOverdue(order) ? ' overdue' : ''}`;
    div.dataset.id = order.id;

    const days = daysAgo(order.created_at);
    const paletteKey = order.photo || 'default';

    let sewingBlock = '';
    if (order.status === 'working') {
      sewingBlock = `
        <div class="sewing-indicator">
          <div class="sewing-machine">
            <span class="needle"></span>
            <span class="body"></span>
          </div>
          <span>缝纫中…</span>
        </div>`;
    }

    let leaf = '';
    if (order.status === 'done') {
      leaf = `<div class="leaf-badge" title="环保再利用">🌿</div>`;
    }

    let overdue = '';
    if (isOverdue(order)) {
      overdue = `<div class="overdue-tag">超过 ${days} 天</div>`;
    }

    div.innerHTML = `
      <div class="card-photo">
        <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          ${clothingSVG(paletteKey)}
        </svg>
        ${leaf}
        ${overdue}
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(order.title)}</h3>
        <p class="card-req">
          原物品：<strong>${escapeHtml(order.original)}</strong>
          <br/>改造目标：<strong>${escapeHtml(order.target)}</strong>
          ${order.notes ? `<br/><span style="color:#7c6a52">备注：${escapeHtml(order.notes)}</span>` : ''}
        </p>
        <div class="card-meta">
          <span>📅 ${days === 0 ? '今天' : `${days} 天前`}提交</span>
          ${sewingBlock || `<span style="color:${order.status === 'done' ? '#16a34a' : '#7c6a52'}">${statusLabel(order.status)}</span>`}
        </div>
        <div class="card-actions">
          ${order.status === 'pending' ? '<button data-act="working">开始改造</button>' : ''}
          ${order.status === 'working' ? '<button data-act="pending">暂停</button><button data-act="done">完成</button>' : ''}
          ${order.status === 'done' ? '<button data-act="working">回退</button>' : ''}
          <button data-act="delete" style="color:#b91c1c">删除</button>
        </div>
      </div>
    `;

    div.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'delete') {
          deleteOrder(order.id);
        } else {
          updateStatus(order.id, act);
        }
      });
    });

    return div;
  }

  function statusLabel(s) {
    return { pending: '待改造', working: '改造中', done: '已完成' }[s] || s;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function render(orders) {
    Object.values(columns).forEach((c) => (c.innerHTML = ''));
    const counter = { pending: 0, working: 0, done: 0 };

    if (!orders || orders.length === 0) {
      board.hidden = true;
      emptyState.hidden = false;
      backlogBanner.hidden = true;
      Object.keys(counts).forEach((k) => (counts[k].textContent = '0'));
      return;
    }

    board.hidden = false;
    emptyState.hidden = true;

    orders.forEach((o) => {
      if (!(o.status in columns)) o.status = 'pending';
      counter[o.status] = (counter[o.status] || 0) + 1;
      columns[o.status].appendChild(renderCard(o));
    });

    Object.keys(counts).forEach((k) => (counts[k].textContent = counter[k] || 0));

    // 积压预警：待改造 >= 8 个
    backlogBanner.hidden = counter.pending < 8;
  }

  async function load() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      render(data);
    } catch (err) {
      console.error(err);
      render([]);
    }
  }

  async function updateStatus(id, status) {
    try {
      await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteOrder(id) {
    if (!confirm('确认删除这个订单？')) return;
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function createOrder(payload) {
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function applyPreset(name) {
    if (name === 'empty') {
      if (!confirm('将清空所有订单，确定？')) return;
      try {
        await fetch(API, { method: 'DELETE' });
        load();
      } catch (e) { console.error(e); }
      return;
    }
    if (!confirm('将替换为预设订单数据，确定？')) return;
    try {
      await fetch(`/api/preset/${name}`, { method: 'POST' });
      load();
    } catch (e) { console.error(e); }
  }

  // 事件绑定
  document.getElementById('btn-refresh').addEventListener('click', load);
  document.getElementById('btn-new').addEventListener('click', () => {
    dialog.showModal();
  });

  form.addEventListener('submit', (e) => {
    const btn = e.submitter;
    if (btn && btn.value === 'cancel') return;
    const data = new FormData(form);
    const paletteKeys = Object.keys(palettes).filter((k) => k !== 'default');
    const payload = {
      title: String(data.get('title') || ''),
      original: String(data.get('original') || ''),
      target: String(data.get('target') || ''),
      notes: String(data.get('notes') || ''),
      photo: paletteKeys[Math.floor(Math.random() * paletteKeys.length)],
    };
    createOrder(payload);
    form.reset();
  });

  document.getElementById('preset-select').addEventListener('change', (e) => {
    applyPreset(e.target.value);
  });

  // 首次加载：如果为空，生成一些默认订单便于演示
  async function bootstrap() {
    const res = await fetch(API);
    const data = res.ok ? await res.json() : [];
    if (data.length === 0) {
      await fetch('/api/preset/mixed', { method: 'POST' });
    }
    load();
  }

  bootstrap();

  // 每 60 秒刷新一次，让超过 7 天的卡片能自动变橙
  setInterval(load, 60 * 1000);
})();
