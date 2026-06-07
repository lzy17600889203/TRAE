(function(){
  const API = '';
  let state = {
    preset: 'bull',
    holdings: [],
    prices: {},
    trades: [],
    snapshots: [],
  };

  const CATEGORY_COLORS = {
    mainstream: ['#ffcf4d', '#ff9800', '#ffb74d', '#ffd54f'],
    meme: ['#ff00aa', '#ff3d8a', '#ff79c6', '#ff55a3'],
    altcoin: ['#00f0ff', '#29b6f6', '#4dd0e1', '#81d4fa'],
    default: ['#7a00ff', '#9c27b0', '#ab47bc', '#ba68c8']
  };

  function colorForCoin(coin, i){
    const palette = CATEGORY_COLORS[coin.category] || CATEGORY_COLORS.default;
    return palette[i % palette.length];
  }

  async function req(path, opts){
    const r = await fetch(API + path, Object.assign({ headers: {'Content-Type':'application/json'} }, opts));
    return r.json();
  }

  async function seed(preset){
    try {
      await req('/api/seed', { method:'POST', body: JSON.stringify({ preset }) });
    } catch(e){ console.warn(e); }
    await refreshAll();
  }

  async function refreshAll(){
    try {
      state.holdings = await req('/api/holdings');
      const pricesArr = await req('/api/prices');
      state.prices = {};
      for (const p of pricesArr) state.prices[p.symbol] = p;
      state.trades = await req('/api/trades?limit=30');
      state.snapshots = await req('/api/snapshots');
    } catch(e){ console.warn(e); }
    renderAll();
  }

  function fmtMoney(n){
    if (n == null || isNaN(n)) return '$0';
    if (Math.abs(n) >= 1_000_000) return '$' + (n/1_000_000).toFixed(2) + 'M';
    if (Math.abs(n) >= 1_000) return '$' + (n/1_000).toFixed(2) + 'K';
    return '$' + n.toFixed(2);
  }
  function fmtNum(n, d=4){
    if (n == null || isNaN(n)) return '0';
    if (Math.abs(n) >= 1000) return n.toFixed(2);
    if (Math.abs(n) >= 1) return n.toFixed(2);
    return n.toFixed(d);
  }
  function fmtTime(ts){
    if (!ts) return '--';
    const d = new Date(ts);
    return d.toLocaleTimeString('zh-CN', { hour12:false });
  }

  function renderDonut(){
    const canvas = document.getElementById('donutCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const cx = W/2, cy = H/2;
    const R = Math.min(W,H)/2 - 30;
    const inner = R * 0.62;

    const items = state.holdings
      .map(h => ({ ...h, price: (state.prices[h.symbol]||{}).price || 0, value: h.amount * ((state.prices[h.symbol]||{}).price || 0) }))
      .filter(x => x.value > 0);

    let totalValue = 0, totalCost = 0;
    for (const h of items) {
      totalValue += h.value;
      totalCost += h.amount * (h.avg_cost || 0);
    }

    const preset = document.body.dataset.preset;
    const empty = items.length === 0 || preset === 'empty';

    // outer ring
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R+4, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,240,255,.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, inner-4, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,240,255,.18)'; ctx.stroke();

    // rotating ticks
    const tickOffset = (Date.now()/60) % 360;
    for (let i=0; i<72; i++){
      const ang = ((i*5 + tickOffset) * Math.PI/180);
      const x1 = cx + Math.cos(ang) * (R+8); const y1 = cy + Math.sin(ang) * (R+8);
      const x2 = cx + Math.cos(ang) * (R+14); const y2 = cy + Math.sin(ang) * (R+14);
      ctx.strokeStyle = i % 6 === 0 ? 'rgba(0,240,255,.6)' : 'rgba(0,240,255,.15)';
      ctx.lineWidth = i % 6 === 0 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }

    if (empty){
      // giant question mark
      ctx.fillStyle = 'rgba(80,80,80,.25)';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(160,160,160,.55)';
      ctx.font = 'bold 180px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', cx, cy);
      document.getElementById('totalValue').textContent = '$0.00';
      document.getElementById('totalPnl').textContent = '空仓 // EMPTY';
      document.getElementById('totalPnl').className = 'center-pnl';
    } else {
      let start = -Math.PI/2;
      items.forEach((h, i) => {
        const frac = h.value / totalValue;
        const end = start + frac * Math.PI * 2;
        const color = colorForCoin(h, i);
        const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, R);
        grad.addColorStop(0, color + '66');
        grad.addColorStop(0.6, color);
        grad.addColorStop(1, color + 'ff');
        ctx.save();
        ctx.shadowBlur = (preset === 'bull' && h.category === 'mainstream') ? 28 : 12;
        ctx.shadowColor = color;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, start, end);
        ctx.arc(cx, cy, inner, end, start, true);
        ctx.closePath();
        ctx.fill();

        // separator line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(5,6,11,.8)'; ctx.lineWidth = 2;
        ctx.stroke();

        // label if big enough
        if (frac > 0.06){
          const mid = (start + end) / 2;
          const lx = cx + Math.cos(mid) * (inner + (R-inner)*0.55);
          const ly = cy + Math.sin(mid) * (inner + (R-inner)*0.55);
          ctx.fillStyle = '#000';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(h.symbol, lx, ly);
        }
        ctx.restore();
        start = end;
      });

      document.getElementById('totalValue').textContent = fmtMoney(totalValue);
      const pnlPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0;
      const pnlEl = document.getElementById('totalPnl');
      pnlEl.textContent = (pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(2) + '%  //  ' + fmtMoney(totalValue - totalCost);
      pnlEl.className = 'center-pnl ' + (pnlPct >= 0 ? 'positive' : 'negative');
    }
    ctx.restore();

    // render legend
    const leg = document.getElementById('legend');
    leg.innerHTML = '';
    items.sort((a,b) => b.value - a.value).forEach((h, i) => {
      const div = document.createElement('div');
      div.className = 'legend-item';
      const color = colorForCoin(h, i);
      div.innerHTML = `<span class="legend-dot" style="background:${color};color:${color}"></span>
        <span><b>${h.symbol}</b> · ${(h.value/totalValue*100).toFixed(1)}%</span>
        <span style="margin-left:auto;color:var(--text-dim)">${fmtMoney(h.value)}</span>`;
      leg.appendChild(div);
    });
  }

  function renderLine(){
    const canvas = document.getElementById('lineCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const preset = document.body.dataset.preset;

    const pad = { l: 60, r: 20, t: 20, b: 30 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;

    // grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,.1)'; ctx.lineWidth = 1;
    for (let i=0;i<=6;i++){
      const y = pad.t + (ch/6)*i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+cw, y); ctx.stroke();
    }
    for (let i=0;i<=10;i++){
      const x = pad.l + (cw/10)*i;
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t+ch); ctx.stroke();
    }

    // axis outline
    ctx.strokeStyle = 'rgba(0,240,255,.3)';
    ctx.strokeRect(pad.l, pad.t, cw, ch);

    // labels
    ctx.fillStyle = 'rgba(120,140,160,.7)'; ctx.font = '10px monospace'; ctx.textAlign='left';
    const pts = state.snapshots.map(s => ({ t: s.created_at, v: s.total_value })).sort((a,b)=>a.t-b.t);

    if (pts.length === 0){
      ctx.fillStyle = 'rgba(120,140,160,.8)'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
      ctx.fillText('NO DATA // 等待录入', pad.l + cw/2, pad.t + ch/2);
      ctx.restore();
      return;
    }

    const minV = Math.min(...pts.map(p=>p.v), 0);
    const maxV = Math.max(...pts.map(p=>p.v), 1);
    const range = maxV - minV || 1;
    const minT = pts[0].t;
    const maxT = pts[pts.length-1].t;
    const tRange = maxT - minT || 1;

    // y labels
    for (let i=0;i<=4;i++){
      const v = maxV - (range/4)*i;
      const y = pad.t + (ch/4)*i;
      ctx.fillText(fmtMoney(v), 6, y+4);
      ctx.strokeStyle = 'rgba(0,240,255,.18)';
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+cw, y); ctx.stroke();
    }

    // zero line
    if (minV < 0 && maxV > 0){
      const y = pad.t + ch - ((0 - minV)/range)*ch;
      ctx.strokeStyle = 'rgba(255,23,68,.55)'; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+cw, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,23,68,.9)'; ctx.fillText('BREAK-EVEN', pad.l+8, y-4);
    }

    // area
    let color = '#00f0ff';
    if (preset === 'bull') color = '#00ff9d';
    else if (preset === 'bear') color = '#ff1744';
    else if (preset === 'hft') color = '#ff00aa';

    const xy = pts.map(p => ({
      x: pad.l + ((p.t - minT)/tRange)*cw,
      y: pad.t + ch - ((p.v - minV)/range)*ch
    }));

    // fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t+ch);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xy[0].x, pad.t+ch);
    xy.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(xy[xy.length-1].x, pad.t+ch);
    ctx.closePath();
    ctx.fill();

    // line
    ctx.strokeStyle = color; ctx.lineWidth = 2.4;
    ctx.shadowBlur = 12; ctx.shadowColor = color;
    ctx.beginPath();
    xy.forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
    ctx.stroke();
    ctx.shadowBlur = 0;

    // end dot
    const last = xy[xy.length-1];
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(last.x, last.y, 4, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

    // end label
    ctx.fillStyle = color; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(pts[pts.length-1].v), pad.l+cw-4, last.y - 10);

    const firstV = pts[0].v, lastV = pts[pts.length-1].v;
    const pct = firstV ? (lastV - firstV)/firstV*100 : 0;

    // trend arrow in top-right
    ctx.font = 'bold 16px monospace'; ctx.textAlign = 'right';
    const up = pct >= 0;
    ctx.fillStyle = up ? '#00ff9d' : '#ff1744';
    ctx.fillText((up?'▲':'▼') + ' ' + (up?'+':'') + pct.toFixed(2) + '%', pad.l+cw-4, pad.t+14);

    ctx.restore();

    // stats row
    const stat = document.getElementById('statRow');
    const diff = lastV - firstV;
    stat.innerHTML = `
      <div><span class="stat-label">起始市值</span><span class="stat-val">${fmtMoney(firstV)}</span></div>
      <div><span class="stat-label">当前市值</span><span class="stat-val">${fmtMoney(lastV)}</span></div>
      <div><span class="stat-label">期间盈亏</span><span class="stat-val ${diff>=0?'pnl-pos':'pnl-neg'}">${(diff>=0?'+':'')+fmtMoney(diff).replace('$','$')}</span></div>
      <div><span class="stat-label">收益率</span><span class="stat-val ${pct>=0?'pnl-pos':'pnl-neg'}">${(pct>=0?'+':'')+pct.toFixed(2)+'%'}</span></div>
      <div><span class="stat-label">样本点</span><span class="stat-val">${pts.length}</span></div>
    `;

    document.getElementById('lineTag').textContent = pct >= 0 ? 'TREND UP ↑' : 'TREND DOWN ↓';
  }

  function renderHoldings(){
    const list = document.getElementById('holdingsList');
    list.innerHTML = '';
    let totalCost = 0, totalValue = 0, count = 0;
    const rows = state.holdings.map(h => {
      const price = (state.prices[h.symbol]||{}).price || 0;
      const chg = (state.prices[h.symbol]||{}).change_24h || 0;
      const value = h.amount * price;
      const cost = h.amount * (h.avg_cost||0);
      totalCost += cost; totalValue += value;
      return { ...h, price, chg, value, cost, pnl: value - cost, pnlPct: cost>0 ? (value-cost)/cost*100 : 0 };
    }).filter(x => x.amount > 0).sort((a,b)=>b.value-a.value);

    count = rows.length;
    rows.forEach((h, i) => {
      const bleeding = h.chg <= -20;
      const row = document.createElement('div');
      row.className = 'holding-row' + (bleeding ? ' bleeding' : '');
      const iconCls = bleeding ? 'coin-icon bleeding' : 'coin-icon';
      row.innerHTML = `
        <div class="holding-symbol">
          <span class="${iconCls}">${h.symbol.substring(0,2)}</span>
          <div><div>${h.symbol}</div><div style="font-size:10px;color:var(--text-dim)">${h.name||h.category||''}</div></div>
        </div>
        <div class="num-val">${fmtNum(h.amount)}</div>
        <div class="num-val">${fmtMoney(h.avg_cost||0)}</div>
        <div class="num-val ${h.chg>=0?'pnl-pos':'pnl-neg'}">${fmtMoney(h.price)}</div>
        <div class="num-val">${fmtMoney(h.value)}</div>
        <div class="num-val ${h.chg>=0?'pnl-pos':'pnl-neg'}">${h.chg>=0?'▲':'▼'}${Math.abs(h.chg).toFixed(2)}%</div>
        <div class="num-val ${h.pnl>=0?'pnl-pos':'pnl-neg'}">${(h.pnl>=0?'+':'')+fmtMoney(h.pnl)}<br/><span style="font-size:10px">${(h.pnlPct>=0?'+':'')+h.pnlPct.toFixed(2)}%</span></div>
      `;
      list.appendChild(row);
    });
    if (count === 0){
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim)">无持仓 // NO HOLDINGS</div>';
    }
    document.getElementById('holdingsCount').textContent = count + ' ITEMS';
    document.getElementById('assetDistTag').textContent = totalValue > 0 ? (totalValue>=totalCost?'PROFIT':'LOSS') : 'EMPTY';
  }

  function renderTrades(){
    const list = document.getElementById('tradesList');
    list.innerHTML = '';
    const ts = state.trades.slice().sort((a,b)=>b.created_at-a.created_at).slice(0,30);
    ts.forEach(t => {
      const row = document.createElement('div');
      row.className = 'trade-row ' + (t.type||'').toLowerCase();
      row.innerHTML = `
        <span>${fmtTime(t.created_at)}</span>
        <span class="trade-type">${(t.type||'').toUpperCase()}</span>
        <span>${t.symbol}</span>
        <span class="num-val">${fmtNum(t.amount)}</span>
        <span class="num-val">${fmtMoney(t.price)}</span>
        <span class="num-val">${fmtMoney(t.total)}</span>
      `;
      list.appendChild(row);
    });
    document.getElementById('tradesCount').textContent = ts.length + ' TX';
  }

  function renderAll(){
    renderDonut();
    renderLine();
    renderHoldings();
    renderTrades();
    const mode = { bull:'BULL MARKET', bear:'BEAR MARKET', hft:'HIGH-FREQ', empty:'CASH ONLY' }[document.body.dataset.preset] || '--';
    document.getElementById('curMode').textContent = mode;
  }

  // events
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;
      document.body.dataset.preset = preset;
      state.preset = preset;
      seed(preset);
    });
  });

  document.getElementById('tradeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.amount = Number(payload.amount);
    payload.price = Number(payload.price);
    await req('/api/trades', { method:'POST', body: JSON.stringify(payload) });
    await req('/api/prices/refresh', { method:'POST', body: JSON.stringify({ preset: state.preset }) });
    await refreshAll();
    e.target.reset();
  });

  document.getElementById('holdingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.amount = Number(payload.amount);
    payload.avg_cost = Number(payload.avg_cost);
    await req('/api/holdings', { method:'POST', body: JSON.stringify(payload) });
    await req('/api/prices/refresh', { method:'POST', body: JSON.stringify({ preset: state.preset }) });
    await refreshAll();
    e.target.reset();
  });

  // clock + animated donut ticks
  setInterval(() => {
    const d = new Date();
    document.getElementById('clock').textContent =
      String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
  }, 1000);

  setInterval(() => {
    if (document.body.dataset.preset !== 'empty') renderDonut();
  }, 80);

  // ping
  async function ping(){
    try {
      const t0 = performance.now();
      const r = await req('/api/ping');
      const ms = Math.round(performance.now() - t0);
      document.getElementById('pingMs').textContent = ms + 'ms';
      document.getElementById('sysStatus').textContent = r.ok ? 'ONLINE' : 'DEGRADED';
    } catch(e){}
  }

  // auto refresh in HFT mode
  let autoRefreshTimer = null;
  function refreshInterval(){
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (document.body.dataset.preset === 'hft'){
      autoRefreshTimer = setInterval(async () => {
        await req('/api/prices/refresh', { method:'POST', body: JSON.stringify({ preset:'hft' }) });
        await refreshAll();
      }, 2500);
    }
  }

  // init
  (async function init(){
    try {
      await req('/api/seed', { method:'POST', body: JSON.stringify({ preset:'bull' }) });
      await refreshAll();
      ping(); refreshInterval();
    } catch(e){
      console.error(e);
    }
  })();

  const origRender = renderAll;
  window._applyPreset = function(preset){
    document.body.dataset.preset = preset;
    refreshInterval();
    renderAll();
  };
})();
