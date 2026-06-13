// Vanilla JS · 24h circular radio scheduler
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const R_INNER = 170;
  const R_OUTER = 280;
  const HOURS = 24;

  const TYPE_COLOR = {
    intro: '#ffd166',
    main: '#06d6a0',
    ad: '#ef476f',
    outro: '#118ab2'
  };
  const TYPE_LABEL = { intro: '片头', main: '正片', ad: '广告', outro: '片尾' };
  const DEFAULT_DURATION = { intro: 3, main: 45, ad: 8, outro: 4 };
  const DANGER = '#ff4d6d';
  const LATENIGHT_BLUE = '#0c3a66';
  const LATENIGHT_BLUE_2 = '#144a7a';

  const clockSvg = document.getElementById('clock');
  const hourRing = document.getElementById('hourRing');
  const ticksG = document.getElementById('ticks');
  const labelsG = document.getElementById('labels');
  const segmentsG = document.getElementById('segments');
  const overflowsG = document.getElementById('overflows');
  const primeGlow = document.getElementById('primeGlow');
  const centerTitle = document.getElementById('centerTitle');
  const centerSub = document.getElementById('centerSub');
  const statusBadge = document.getElementById('statusBadge');
  const hourInfo = document.getElementById('hourInfo');
  const scheduleList = document.getElementById('scheduleList');
  const dayInput = document.getElementById('dayInput');
  const scissors = document.getElementById('scissors');
  const clockShell = document.querySelector('.clock-shell');

  let currentDay = new Date().toISOString().slice(0, 10);
  let data = { segments: [], hourlyTotals: [], maintenance: false, dayLimitMinutes: 60 };

  // ---------- geometry helpers ----------
  // 0 度在 12 点方向（-90° in svg)
  function minuteAngle(minutes) {
    // 24h clock: 0 min = top, 1440 min = one full revolution
    const frac = minutes / (24 * 60);
    return -90 + frac * 360;
  }
  function hourAngle(h) {
    return -90 + (h / HOURS) * 360;
  }
  function polar(r, deg) {
    const rad = (deg * Math.PI) / 180;
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
  }
  function arcPath(r1, r2, startDeg, endDeg, opts = {}) {
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const p1 = polar(r2, startDeg);
    const p2 = polar(r2, endDeg);
    const p3 = polar(r1, endDeg);
    const p4 = polar(r1, startDeg);
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${r2} ${r2} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${r1} ${r1} 0 ${large} 0 ${p4.x} ${p4.y}`,
      'Z'
    ].join(' ');
  }

  // ---------- draw hour ring (24 slices) ----------
  function drawHourRing() {
    hourRing.innerHTML = '';
    const totalDeg = 360 / HOURS;
    for (let h = 0; h < HOURS; h++) {
      const start = -90 + h * totalDeg;
      const end = start + totalDeg;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', arcPath(R_INNER, R_OUTER - 10, start, end));
      path.setAttribute('data-hour', String(h));
      path.setAttribute('stroke', 'rgba(255,255,255,0.08)');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('fill', hourDefaultColor(h));
      hourRing.appendChild(path);
    }
  }

  function hourDefaultColor(h) {
    // 深夜 2-6 点使用深蓝带（自动循环白噪音）
    if (h >= 2 && h < 6) {
      // 两种深蓝交错以强调留白
      return h % 2 === 0 ? LATENIGHT_BLUE : LATENIGHT_BLUE_2;
    }
    return h % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)';
  }

  // ---------- ticks & labels ----------
  function drawTicks() {
    ticksG.innerHTML = '';
    labelsG.innerHTML = '';
    for (let h = 0; h < HOURS; h++) {
      const angle = hourAngle(h);
      const isMajor = h % 6 === 0;
      const rA = R_OUTER - 10;
      const rB = isMajor ? R_OUTER + 8 : R_OUTER - 4;
      const a = polar(rA, angle);
      const b = polar(rB, angle);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('stroke', isMajor ? '#e8e4ff' : 'rgba(255,255,255,0.35)');
      line.setAttribute('stroke-width', isMajor ? '1.5' : '1');
      ticksG.appendChild(line);

      const pos = polar(R_OUTER + 22, angle);
      const txt = document.createElementNS(SVG_NS, 'text');
      txt.setAttribute('x', pos.x);
      txt.setAttribute('y', pos.y + 4);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', isMajor ? '#fff' : '#c5bfff');
      txt.setAttribute('font-size', isMajor ? '13' : '11');
      txt.setAttribute('font-weight', isMajor ? '700' : '400');
      txt.textContent = String(h).padStart(2, '0') + ':00';
      labelsG.appendChild(txt);
    }
  }

  // ---------- segments drawing ----------
  function clearLayer() {
    segmentsG.innerHTML = '';
    overflowsG.innerHTML = '';
    primeGlow.innerHTML = '';
  }

  function colorForSeg(seg, hourOverflow) {
    if (hourOverflow) return DANGER;
    return TYPE_COLOR[seg.type] || '#888';
  }

  function drawSegments(segs, hourly) {
    // Group segs by their starting hour so we can track overlap properly.
    // Simple approach: each seg is a radial slice.
    const sorted = [...segs].filter((s) => s.title !== '__MAINTENANCE_DAY__').sort((a, b) => a.startMinute - b.startMinute);

    // Track radial layers for overlap (stack extra overlaps outward)
    const layerMap = new Map();
    const segmentsInRadius = []; // { seg, layer }

    for (const seg of sorted) {
      const startMin = seg.startMinute;
      const endMin = Math.min(seg.startMinute + seg.duration, 24 * 60);
      let layer = 0;
      // find a layer slot: check each existing seg in same hour for overlap
      const hourKey = Math.floor(startMin / 60);
      for (const other of (layerMap.get(hourKey) || [])) {
        const oStart = other.seg.startMinute;
        const oEnd = other.seg.startMinute + other.seg.duration;
        if (startMin < oEnd && endMin > oStart) {
          layer = Math.max(layer, other.layer + 1);
        }
      }
      if (!layerMap.has(hourKey)) layerMap.set(hourKey, []);
      layerMap.get(hourKey).push({ seg, layer, endMin });
      segmentsInRadius.push({ seg, layer });
    }

    // Draw
    for (const item of segmentsInRadius) {
      const seg = item.seg;
      const layer = item.layer;
      const hour = Math.floor(seg.startMinute / 60);
      const overflow = (hourly.find((x) => x.hour === hour) || {}).overflow;

      const thickness = 22;
      const pad = 2;
      const r1 = R_INNER + layer * (thickness + pad) + pad;
      const r2 = r1 + thickness;

      const startDeg = minuteAngle(seg.startMinute);
      const endDeg = minuteAngle(Math.min(seg.startMinute + seg.duration, 24 * 60));
      if (endDeg - startDeg <= 0.2) continue;

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', arcPath(r1, r2, startDeg, endDeg));
      path.setAttribute('fill', colorForSeg(seg, overflow));
      path.setAttribute('stroke', 'rgba(255,255,255,0.35)');
      path.setAttribute('stroke-width', '0.8');
      path.setAttribute('data-id', seg.id);
      path.setAttribute('data-hour', String(hour));
      if (overflow) {
        path.setAttribute('filter', 'url(#soft)');
      }
      // Tooltip-ish title
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = `${formatMin(seg.startMinute)} - ${formatMin(seg.startMinute + seg.duration)} · ${TYPE_LABEL[seg.type]}: ${seg.title} (${seg.duration}分)`;
      path.appendChild(title);
      segmentsG.appendChild(path);
    }

    // 溢出标记：把对应小时的扇区变成红色底 + 叠加光晕
    const totalDeg = 360 / HOURS;
    let anyOverflow = false;
    const overflowsHours = [];
    for (const h of hourly) {
      if (h.overflow) {
        anyOverflow = true;
        overflowsHours.push(h.hour);
        const start = -90 + h.hour * totalDeg;
        const end = start + totalDeg;
        const glow = document.createElementNS(SVG_NS, 'path');
        glow.setAttribute('d', arcPath(R_INNER - 4, R_OUTER - 6, start, end));
        glow.setAttribute('fill', DANGER);
        glow.setAttribute('opacity', '0.18');
        glow.setAttribute('filter', 'url(#soft)');
        overflowsG.appendChild(glow);

        const outline = document.createElementNS(SVG_NS, 'path');
        outline.setAttribute('d', arcPath(R_INNER, R_OUTER - 10, start, end));
        outline.setAttribute('fill', DANGER);
        outline.setAttribute('opacity', '0.12');
        overflowsG.appendChild(outline);
      }
    }
    // 黄金档橙色光晕（演示用）—— 任意 19-21 点有内容就点亮
    const primeSegs = sorted.filter((s) => s.startMinute >= 19 * 60 && s.startMinute < 21 * 60);
    if (primeSegs.length >= 4) {
      const center = polar((R_INNER + R_OUTER) / 2 - 20, hourAngle(20));
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', center.x);
      circle.setAttribute('cy', center.y);
      circle.setAttribute('r', 180);
      circle.setAttribute('fill', 'url(#primeGlow)');
      primeGlow.appendChild(circle);
    }
    // Scissors marker (严重超时 — 任一时段超过 50 分钟且溢出)
    if (anyOverflow) {
      const firstOverflow = overflowsHours[0];
      const angle = hourAngle(firstOverflow) + (360 / HOURS) / 2;
      const pos = polar(R_OUTER - 40, angle);
      const svgBox = clockSvg.getBoundingClientRect();
      const cx = svgBox.left + svgBox.width / 2 + (pos.x / 640) * svgBox.width;
      const cy = svgBox.top + svgBox.height / 2 + (pos.y / 640) * svgBox.height;
      // 绝对定位到 shell
      const shellRect = clockShell.getBoundingClientRect();
      const relX = cx - shellRect.left;
      const relY = cy - shellRect.top;
      scissors.style.left = relX + 'px';
      scissors.style.top = relY + 'px';
      scissors.classList.remove('hidden');
    } else {
      scissors.classList.add('hidden');
    }

    updateStatusBadge(anyOverflow);
  }

  function drawMaintenanceMode() {
    // 覆盖整环为灰色
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', arcPath(R_INNER, R_OUTER - 10, -90, 270));
    path.setAttribute('fill', '#555');
    path.setAttribute('opacity', '0.6');
    segmentsG.appendChild(path);

    centerTitle.textContent = 'OFF AIR';
    centerTitle.setAttribute('fill', '#aaa');
    centerSub.textContent = '停播检修中';
    statusBadge.textContent = '状态：停播检修';
    statusBadge.className = 'status-badge';
    statusBadge.style.color = '#bbb';
    statusBadge.style.borderColor = '#666';
    scissors.classList.add('hidden');

    // 画熄灭的"ON AIR"灯牌 —— 中心已有 ON AIR，把它变暗并在外面画个灯牌
    const plate = document.createElementNS(SVG_NS, 'g');
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', -60); rect.setAttribute('y', -40);
    rect.setAttribute('width', 120); rect.setAttribute('height', 80);
    rect.setAttribute('rx', 12);
    rect.setAttribute('fill', '#2a2a2a');
    rect.setAttribute('stroke', '#555');
    rect.setAttribute('stroke-width', '1.5');
    plate.appendChild(rect);
    const t1 = document.createElementNS(SVG_NS, 'text');
    t1.setAttribute('text-anchor', 'middle'); t1.setAttribute('y', 6);
    t1.setAttribute('fill', '#888'); t1.setAttribute('font-size', '18'); t1.setAttribute('font-weight', '800');
    t1.textContent = 'OFF AIR';
    plate.appendChild(t1);
    const t2 = document.createElementNS(SVG_NS, 'text');
    t2.setAttribute('text-anchor', 'middle'); t2.setAttribute('y', 28);
    t2.setAttribute('fill', '#666'); t2.setAttribute('font-size', '10');
    t2.textContent = 'MAINTENANCE';
    plate.appendChild(t2);
    clockSvg.appendChild(plate);
  }

  function resetCenter() {
    centerTitle.textContent = 'ON AIR';
    centerTitle.setAttribute('fill', '#fff');
    centerSub.textContent = `节目 ${currentDay}`;
  }

  function updateStatusBadge(isOverflow) {
    if (isOverflow) {
      statusBadge.textContent = '状态：超时警告 (>60 分钟/小时)';
      statusBadge.className = 'status-badge status-warn';
    } else {
      statusBadge.textContent = '状态：正常';
      statusBadge.className = 'status-badge status-ok';
    }
  }

  function formatMin(m) {
    const h = Math.floor(m / 60) % 24;
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  // ---------- list rendering ----------
  function renderList(segs, hourly) {
    scheduleList.innerHTML = '';
    const list = segs
      .filter((s) => s.title !== '__MAINTENANCE_DAY__')
      .sort((a, b) => a.startMinute - b.startMinute);
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'hint';
      empty.textContent = '当前日期没有节目 — 拖一个素材到表盘上试试。';
      scheduleList.appendChild(empty);
      return;
    }
    for (const s of list) {
      const row = document.createElement('div');
      row.className = `seg-row type-${s.type}`;
      const bar = document.createElement('div'); bar.className = 'seg-bar';
      const txt = document.createElement('div');
      txt.innerHTML = `<div><b>${escapeHtml(s.title)}</b> · ${TYPE_LABEL[s.type]}</div><div class="time">${formatMin(s.startMinute)}–${formatMin(s.startMinute + s.duration)} · ${s.duration} 分钟</div>`;
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '删除';
      del.addEventListener('click', () => deleteSegment(s.id));
      row.appendChild(bar);
      row.appendChild(txt);
      row.appendChild(del);
      scheduleList.appendChild(row);
    }

    // hourly summary
    const header = document.createElement('div');
    header.style.marginTop = '14px';
    header.style.fontSize = '12px';
    header.style.color = 'var(--muted)';
    header.textContent = '—— 各小时总计 ——';
    scheduleList.appendChild(header);
    for (const h of hourly) {
      if (h.totalMinutes === 0) continue;
      const row = document.createElement('div');
      row.className = 'seg-row';
      row.style.gridTemplateColumns = '10px 1fr auto';
      const bar = document.createElement('div'); bar.className = 'seg-bar';
      bar.style.background = h.overflow ? DANGER : TYPE_COLOR.main;
      const txt = document.createElement('div');
      txt.innerHTML = `<div>${String(h.hour).padStart(2,'0')}:00 档</div><div class="time">总 ${h.totalMinutes} 分钟${h.overflow ? ' · ⚠️ 超过 60 分钟' : ''}</div>`;
      const spacer = document.createElement('div'); spacer.textContent = '';
      row.appendChild(bar); row.appendChild(txt); row.appendChild(spacer);
      scheduleList.appendChild(row);
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- API ----------
  async function fetchDay(day) {
    const res = await fetch(`/api/segments?day=${encodeURIComponent(day)}`);
    return await res.json();
  }
  async function addSegment(payload) {
    const res = await fetch('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }
  async function deleteSegment(id) {
    await fetch(`/api/segments/${encodeURIComponent(id)}`, { method: 'DELETE' });
    refresh();
  }
  async function applyPreset(name) {
    const res = await fetch(`/api/preset/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: currentDay })
    });
    if (res.ok) refresh();
  }

  async function refresh() {
    const json = await fetchDay(currentDay);
    data = json;
    clearLayer();
    resetCenter();
    if (data.maintenance) {
      drawMaintenanceMode();
    } else {
      drawSegments(data.segments, data.hourlyTotals);
    }
    renderList(data.segments, data.hourlyTotals);
    hourInfo.textContent = `数据：${data.segments.length} 个节目片段 · 每日上限 ${data.dayLimitMinutes} 分钟/小时`;
  }

  // ---------- drag & drop ----------
  function initDnd() {
    const chips = document.querySelectorAll('.chip');
    let dragType = null;
    for (const chip of chips) {
      chip.addEventListener('dragstart', (e) => {
        dragType = chip.dataset.type;
        e.dataTransfer.setData('text/plain', dragType);
        e.dataTransfer.effectAllowed = 'copy';
        document.body.classList.add('drag-over');
      });
      chip.addEventListener('dragend', () => {
        document.body.classList.remove('drag-over');
        document.querySelectorAll('#hourRing path').forEach((p) => p.classList.remove('hovered'));
      });
    }

    clockSvg.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      // highlight hovered hour slice
      const pt = svgPoint(e.clientX, e.clientY);
      const hour = pointToHour(pt);
      document.querySelectorAll('#hourRing path').forEach((p) => {
        if (p.dataset.hour === String(hour)) p.classList.add('hovered');
        else p.classList.remove('hovered');
      });
    });
    clockSvg.addEventListener('dragleave', () => {
      document.querySelectorAll('#hourRing path').forEach((p) => p.classList.remove('hovered'));
    });
    clockSvg.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('text/plain') || dragType;
      document.querySelectorAll('#hourRing path').forEach((p) => p.classList.remove('hovered'));
      document.body.classList.remove('drag-over');
      if (!type) return;
      const pt = svgPoint(e.clientX, e.clientY);
      const hour = pointToHour(pt);
      if (hour < 0) return;
      const minute = pointToMinuteWithinHour(pt, hour);
      openDropModal({ type, hour, minute });
    });

    // hover tooltip for hours
    clockSvg.addEventListener('mousemove', (e) => {
      const pt = svgPoint(e.clientX, e.clientY);
      const hour = pointToHour(pt);
      if (hour < 0) { hourInfo.textContent = '将鼠标移到表盘上查看该小时的节目总时长'; return; }
      const bucket = data.hourlyTotals.find((x) => x.hour === hour);
      const limit = data.dayLimitMinutes;
      const min = bucket ? bucket.totalMinutes : 0;
      hourInfo.textContent = `${String(hour).padStart(2, '0')}:00 档 · 合计 ${min} / ${limit} 分钟${bucket && bucket.overflow ? ' · ⚠️ 溢出' : ''}`;
    });
  }

  // ---------- 自定义 drop modal ----------
  let dropContext = null;

  function openDropModal(ctx) {
    dropContext = ctx;
    const { type, hour, minute } = ctx;
    const modal = document.getElementById('dropModal');
    const summary = document.getElementById('dropSummary');
    const durInput = document.getElementById('dropDuration');
    const titleInput = document.getElementById('dropTitle');
    const errEl = document.getElementById('dropError');
    const confirmBtn = document.getElementById('dropConfirmBtn');

    summary.innerHTML = `在 <b>${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}</b> 插入 <b style="color:#ffb347">${TYPE_LABEL[type]}</b>`;
    durInput.value = DEFAULT_DURATION[type];
    titleInput.value = '';
    errEl.style.display = 'none';
    errEl.textContent = '';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    const closeButtons = modal.querySelectorAll('[data-role="close"]');
    closeButtons.forEach((b) => b.onclick = closeDropModal);

    const onKey = (ev) => {
      if (ev.key === 'Escape') { closeDropModal(); }
      else if (ev.key === 'Enter' && (ev.target === durInput || ev.target === titleInput)) {
        ev.preventDefault();
        confirmBtn.click();
      }
    };
    document.addEventListener('keydown', onKey);
    modal._onKey = onKey;

    // input validation while typing: show error & keep confirm button disabled if invalid
    const validate = () => {
      const v = Number(durInput.value) || 0;
      if (v < 1 || v > 480) {
        errEl.textContent = '请输入 1–480 之间的分钟数';
        errEl.style.display = 'block';
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.cursor = 'not-allowed';
      } else {
        errEl.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '';
        confirmBtn.style.cursor = '';
      }
    };
    durInput.addEventListener('input', validate);
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmBtn.click(); }
    });
    validate();

    confirmBtn.onclick = async () => {
      const d = Math.max(1, Math.min(480, Number(durInput.value) || 0));
      if (!d) { durInput.focus(); return; }
      const t = titleInput.value.trim() || TYPE_LABEL[type];
      closeDropModal();
      const startMinute = hour * 60 + minute;
      await addSegment({ type, day: currentDay, startMinute, duration: d, title: t });
      refresh();
    };

    // autofocus duration input with value pre-selected
    setTimeout(() => { durInput.select(); durInput.focus(); }, 30);
  }

  function closeDropModal() {
    const modal = document.getElementById('dropModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modal._onKey) {
      document.removeEventListener('keydown', modal._onKey);
      modal._onKey = null;
    }
    dropContext = null;
  }

  function svgPoint(clientX, clientY) {
    const rect = clockSvg.getBoundingClientRect();
    // 以 viewBox (-320,-320,640,640) 换算
    const x = ((clientX - rect.left) / rect.width) * 640 - 320;
    const y = ((clientY - rect.top) / rect.height) * 640 - 320;
    return { x, y };
  }

  function pointToHour({ x, y }) {
    const r = Math.hypot(x, y);
    if (r < R_INNER - 10 || r > R_OUTER + 10) return -1;
    let deg = Math.atan2(y, x) * 180 / Math.PI; // -180..180, 0 = right
    // shift so 0 is top
    deg = (deg + 90 + 360) % 360; // 0..360, 0 = top going clockwise
    const hour = Math.floor((deg / 360) * HOURS);
    return hour;
  }
  function pointToMinuteWithinHour({ x, y }, hour) {
    // within the hour bucket, pick minute by finer angle
    let deg = Math.atan2(y, x) * 180 / Math.PI;
    deg = (deg + 90 + 360) % 360;
    const totalMin = (deg / 360) * (24 * 60);
    const withinHour = totalMin - hour * 60;
    let m = Math.floor(withinHour);
    if (m < 0) m = 0;
    if (m > 59) m = 59;
    return m;
  }

  // ---------- UI events ----------
  function initUI() {
    dayInput.value = currentDay;
    dayInput.addEventListener('change', () => {
      currentDay = dayInput.value;
      refresh();
    });
    document.querySelectorAll('.preset-btn').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        applyPreset(b.dataset.preset);
      });
    });
    document.getElementById('insertBtn').addEventListener('click', async () => {
      const h = Math.max(0, Math.min(23, Number(document.getElementById('hourInput').value) || 0));
      const m = Math.max(0, Math.min(59, Number(document.getElementById('minuteInput').value) || 0));
      const duration = Math.max(1, Number(document.getElementById('durationInput').value) || 1);
      const title = document.getElementById('titleInput').value.trim() || TYPE_LABEL[document.getElementById('typeInput').value];
      const type = document.getElementById('typeInput').value;
      await addSegment({ type, day: currentDay, startMinute: h * 60 + m, duration, title });
      refresh();
    });

    // Refresh every 30s just in case (multi-tab editing)
    setInterval(refresh, 30000);
    window.addEventListener('resize', refresh);
  }

  // ---------- boot ----------
  drawHourRing();
  drawTicks();
  initDnd();
  initUI();
  refresh();
})();
