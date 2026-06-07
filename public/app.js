(() => {
  const API = '';

  // ---------- SVG gauge ----------
  const svg = document.getElementById('gauge');
  const arcBg = document.getElementById('arc-bg');
  const arcFg = document.getElementById('arc-fg');
  const needleLine = document.getElementById('needle-line');
  const needle = document.getElementById('needle');
  const ticksGroup = document.getElementById('ticks');
  const healthNum = document.getElementById('health-num');
  const statusLabel = document.getElementById('status-label');
  const statDelta = document.getElementById('stat-delta');
  const statStreak = document.getElementById('stat-streak');
  const statDays = document.getElementById('stat-days');

  const CENTER_X = 160;
  const CENTER_Y = 180;
  const R = 140;
  const START_ANGLE = 200;   // degrees
  const END_ANGLE = 340;     // degrees

  function polar(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(cx, cy, r, start, end) {
    const s = polar(cx, cy, r, start);
    const e = polar(cx, cy, r, end);
    const large = (end - start) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  function drawTicks() {
    ticksGroup.innerHTML = '';
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const angle = START_ANGLE + t * (END_ANGLE - START_ANGLE);
      const outer = polar(CENTER_X, CENTER_Y, R + 4, angle);
      const inner = polar(CENTER_X, CENTER_Y, R - 10, angle);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', outer.x); line.setAttribute('y1', outer.y);
      line.setAttribute('x2', inner.x); line.setAttribute('y2', inner.y);
      line.setAttribute('stroke', 'rgba(255,255,255,0.35)');
      line.setAttribute('stroke-width', '1.5');
      ticksGroup.appendChild(line);
    }
  }

  function setGauge(health, shake = false) {
    const t = Math.max(0, Math.min(100, health)) / 100;
    const fillAngle = START_ANGLE + t * (END_ANGLE - START_ANGLE);
    arcBg.setAttribute('d', arcPath(CENTER_X, CENTER_Y, R, START_ANGLE, END_ANGLE));
    arcFg.setAttribute('d', arcPath(CENTER_X, CENTER_Y, R, START_ANGLE, fillAngle));
    // needle angle
    const rotate = -160 + t * 140; // -160deg .. -20deg (SVG coord)
    needle.setAttribute('transform', `translate(${CENTER_X},${CENTER_Y}) rotate(${rotate})`);
    needleLine.setAttribute('stroke', health >= 80 ? '#27ae60' : (health <= 25 ? '#e74c3c' : '#2c3e50'));
    healthNum.textContent = health.toFixed(1);
    if (shake) {
      needle.animate(
        [
          { transform: `translate(${CENTER_X},${CENTER_Y}) rotate(${rotate - 12}deg)` },
          { transform: `translate(${CENTER_X},${CENTER_Y}) rotate(${rotate + 12}deg)` },
          { transform: `translate(${CENTER_X},${CENTER_Y}) rotate(${rotate - 6}deg)` },
          { transform: `translate(${CENTER_X},${CENTER_Y}) rotate(${rotate + 6}deg)` },
          { transform: `translate(${CENTER_X},${CENTER_Y}) rotate(${rotate}deg)` }
        ],
        { duration: 900, easing: 'ease-in-out' }
      );
    }
  }

  drawTicks();

  // ---------- 3D voxel tree ----------
  const voxelScene = document.getElementById('voxel-scene');
  const treeHint = document.getElementById('tree-hint');

  const LEAF = '#2f8f4a';
  const LEAF_LIGHT = '#47b367';
  const TRUNK = '#6b4423';
  const TRUNK_LIGHT = '#8a5a2e';
  const FRUIT_GOLD = '#ffd23f';
  const FRUIT_SHINE = '#ffec85';
  const WITHER = '#7a6a50';

  function createVoxel(cx, cy, cz, color) {
    const el = document.createElement('div');
    el.className = 'voxel';
    el.style.transform = `translate3d(${cx - 8}px, ${cy - 8}px, ${cz - 8}px)`;
    for (const f of ['front','back','left','right','top','bottom']) {
      const face = document.createElement('div');
      face.className = 'face f-' + f;
      // face colors - top lighter, bottom darker, sides varied
      face.style.background = color;
      if (f === 'top') face.style.background = shadeColor(color, 18);
      if (f === 'bottom') face.style.background = shadeColor(color, -25);
      if (f === 'left' || f === 'right') face.style.background = shadeColor(color, -10);
      el.appendChild(face);
    }
    return el;
  }

  function shadeColor(hex, percent) {
    const n = parseInt(hex.replace('#',''), 16);
    let r = (n >> 16) + Math.round(255 * percent / 100);
    let g = ((n >> 8) & 0xff) + Math.round(255 * percent / 100);
    let b = (n & 0xff) + Math.round(255 * percent / 100);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6,'0');
  }

  function buildTree(status, golden = false, deltaTotal = 0) {
    voxelScene.innerHTML = '';
    const stageW = 16, stageH = 20, stageD = 16;
    const scale = 16;
    const offsetX = -(stageW * scale) / 2;
    const offsetY = -(stageH * scale);
    const offsetZ = -(stageD * scale) / 2;

    // Grow stages based on status
    let trunkH, canopy, wither;
    if (status === 'empty') {
      trunkH = 3; canopy = 0; wither = true; // 光秃秃
    } else if (status === 'warning') {
      trunkH = 4; canopy = 2; wither = true; // 枯萎
    } else if (status === 'guardian') {
      trunkH = 9; canopy = 5; wither = false; // 参天大树
    } else {
      trunkH = 6; canopy = 3; wither = false;
    }

    const voxels = [];

    // trunk
    for (let y = 0; y < trunkH; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (Math.abs(x) + Math.abs(z) <= 1) {
            voxels.push({ x: x * 2 + 8, y, z: z * 2 + 8, color: wither ? WITHER : TRUNK });
          }
        }
      }
    }

    // canopy (pyramid-ish)
    if (canopy > 0) {
      for (let layer = 0; layer < canopy; layer++) {
        const radius = canopy - layer + 1;
        const y = trunkH + layer;
        for (let x = -radius; x <= radius; x++) {
          for (let z = -radius; z <= radius; z++) {
            if (x * x + z * z <= radius * radius + 1) {
              voxels.push({
                x: x * 2 + 8,
                y,
                z: z * 2 + 8,
                color: wither ? shadeColor(WITHER, 8) : (Math.random() > 0.5 ? LEAF : LEAF_LIGHT)
              });
            }
          }
        }
      }
      // top sphere
      const yTop = trunkH + canopy;
      for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
          if (x * x + z * z <= 5) {
            voxels.push({
              x: x * 2 + 8,
              y: yTop,
              z: z * 2 + 8,
              color: wither ? shadeColor(WITHER, 15) : LEAF_LIGHT
            });
          }
        }
      }
    }

    // golden fruit
    if (golden) {
      const fruitPositions = [
        [3, trunkH + 1, 3], [-3, trunkH + 1, -2], [2, trunkH + 2, -3], [-2, trunkH + 2, 3], [0, trunkH + 3, 1]
      ];
      for (const [fx, fy, fz] of fruitPositions) {
        voxels.push({
          x: fx * 2 + 8,
          y: fy,
          z: fz * 2 + 8,
          color: Math.random() > 0.5 ? FRUIT_GOLD : FRUIT_SHINE
        });
      }
    }

    // render
    for (const v of voxels) {
      const el = createVoxel(v.x * 8, -v.y * 8 + 160, v.z * 8, v.color);
      voxelScene.appendChild(el);
    }

    // hint
    const hints = {
      empty: '🪵 光秃秃的树干，等待你的第一滴汗水……',
      warning: '☁️ 树叶正在枯萎，请多一点绿色出行！',
      normal: '🌱 小树正在茁壮成长，请保持你的环保习惯。',
      guardian: '🌳 参天大树！你是一位真正的环保卫士。'
    };
    treeHint.textContent = hints[status] || hints.normal;
    if (golden) treeHint.textContent += ' 🌟 连续一周绿色出行，结出了金色的果实！';
  }

  // ---------- particles ----------
  const particlesCanvas = document.getElementById('particles');
  const pctx = particlesCanvas.getContext('2d');
  let particles = [];
  let particleMode = 'idle';

  function resizeParticles() {
    particlesCanvas.width = particlesCanvas.clientWidth;
    particlesCanvas.height = particlesCanvas.clientHeight;
  }
  resizeParticles();
  window.addEventListener('resize', resizeParticles);

  function spawnParticles(mode) {
    particleMode = mode;
    particles = [];
    const w = particlesCanvas.width;
    const h = particlesCanvas.height;
    if (mode === 'idle') return;

    let count;
    if (mode === 'guardian') count = 55;
    else if (mode === 'warning') count = 40;
    else count = 18;

    for (let i = 0; i < count; i++) {
      if (mode === 'guardian') {
        const isBird = Math.random() < 0.35;
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.3) * 1.6,
          vy: -Math.random() * 0.8 - 0.2,
          r: isBird ? 6 + Math.random() * 4 : 3 + Math.random() * 3,
          life: 200 + Math.random() * 200,
          age: 0,
          kind: isBird ? 'bird' : (Math.random() > 0.5 ? 'butterfly' : 'leaf'),
          hue: isBird ? 200 + Math.random() * 40 : (80 + Math.random() * 60)
        });
      } else if (mode === 'warning') {
        particles.push({
          x: Math.random() * w,
          y: h + Math.random() * 100,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 0.6 - 0.2,
          r: 14 + Math.random() * 20,
          life: 600 + Math.random() * 300,
          age: 0,
          kind: 'smog',
          hue: 0
        });
      } else {
        particles.push({
          x: Math.random() * w,
          y: h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.3 - Math.random() * 0.4,
          r: 2 + Math.random() * 2,
          life: 400,
          age: 0,
          kind: 'spark',
          hue: 120
        });
      }
    }
  }

  function drawParticles() {
    const w = particlesCanvas.width;
    const h = particlesCanvas.height;
    pctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.age += 1;
      if (p.kind === 'bird') p.vx += Math.sin(p.age * 0.1) * 0.15;
      if (p.kind === 'butterfly') { p.vx += Math.sin(p.age * 0.08) * 0.3; p.vy += Math.cos(p.age * 0.1) * 0.1; }
      if (p.y < -20 || p.x < -40 || p.x > w + 40 || p.age > p.life) {
        if (particleMode === 'guardian') {
          p.x = Math.random() * w; p.y = h + 10; p.age = 0;
        } else if (particleMode === 'warning') {
          p.x = Math.random() * w; p.y = h + 20; p.age = 0;
        } else {
          p.x = Math.random() * w; p.y = h; p.age = 0;
        }
      }

      if (p.kind === 'bird') {
        pctx.save();
        pctx.translate(p.x, p.y);
        pctx.strokeStyle = `hsl(${p.hue},40%,80%)`;
        pctx.lineWidth = 2;
        const flap = Math.sin(p.age * 0.4) * 4;
        pctx.beginPath();
        pctx.moveTo(-10, flap);
        pctx.quadraticCurveTo(0, -6 - flap, 10, flap);
        pctx.stroke();
        pctx.restore();
      } else if (p.kind === 'butterfly') {
        pctx.save();
        pctx.translate(p.x, p.y);
        const flap = Math.abs(Math.sin(p.age * 0.3));
        pctx.fillStyle = `hsla(${p.hue + p.age * 0.3},80%,70%,0.9)`;
        pctx.beginPath();
        pctx.ellipse(-4, 0, 4, 3 + flap * 3, 0, 0, Math.PI * 2);
        pctx.ellipse(4, 0, 4, 3 + flap * 3, 0, 0, Math.PI * 2);
        pctx.fill();
        pctx.restore();
      } else if (p.kind === 'leaf') {
        pctx.save();
        pctx.translate(p.x, p.y);
        pctx.rotate(p.age * 0.05);
        pctx.fillStyle = `hsla(${p.hue},60%,55%,0.85)`;
        pctx.beginPath();
        pctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
        pctx.fill();
        pctx.restore();
      } else if (p.kind === 'smog') {
        const grad = pctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, 'rgba(60,50,50,0.45)');
        grad.addColorStop(1, 'rgba(40,30,30,0)');
        pctx.fillStyle = grad;
        pctx.beginPath();
        pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pctx.fill();
      } else {
        pctx.fillStyle = `hsla(${p.hue},80%,70%,0.7)`;
        pctx.beginPath();
        pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pctx.fill();
      }
    }
    requestAnimationFrame(drawParticles);
  }
  drawParticles();

  // ---------- form ----------
  const form = document.getElementById('entry-form');
  const fDate = document.getElementById('f-date');
  const fTransport = document.getElementById('f-transport');
  const fKm = document.getElementById('f-km');
  const fDiet = document.getElementById('f-diet');
  const fKwh = document.getElementById('f-kwh');
  const fNote = document.getElementById('f-note');
  const formResult = document.getElementById('form-result');

  fDate.value = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      date: fDate.value,
      transport: fTransport.value || null,
      transport_km: Number(fKm.value) || 0,
      diet: fDiet.value || null,
      electricity_kwh: Number(fKwh.value) || 0,
      note: fNote.value
    };
    const res = await fetch(API + '/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const sign = data.delta >= 0 ? '+' : '';
    formResult.textContent = `已记录：碳分 ${sign}${data.delta}（CO₂ ${data.co2} kg，环保 ${data.score} 分）`;
    formResult.style.color = data.delta >= 0 ? '#7ed6a2' : '#e74c3c';
    refresh();
  });

  // ---------- timeline ----------
  const timeline = document.getElementById('timeline');
  const iconMap = {
    walk: '🚶', bike: '🚲', bus: '🚌', subway: '🚇', car: '🚗', plane: '✈️'
  };

  function renderTimeline(days) {
    timeline.innerHTML = '';
    const axis = document.createElement('div');
    axis.className = 'axis';
    timeline.appendChild(axis);

    if (!days || days.length === 0) {
      const tip = document.createElement('div');
      tip.style.position = 'absolute';
      tip.style.left = '50%';
      tip.style.top = '50%';
      tip.style.transform = 'translate(-50%,-50%)';
      tip.style.color = '#7f8c8d';
      tip.style.fontSize = '13px';
      tip.textContent = '暂无出行数据';
      timeline.appendChild(tip);
      return;
    }
    const n = days.length;
    for (let i = 0; i < n; i++) {
      const cell = document.createElement('div');
      const left = 12 + (i + 0.5) * ((timeline.clientWidth - 24) / n);
      cell.className = 'day-cell';
      cell.style.left = left + 'px';
      const firstTransport = days[i].transports && days[i].transports[0];
      const icon = firstTransport ? (iconMap[firstTransport] || '🌿') : '🌿';
      cell.innerHTML = `<div class="icon">${icon}</div><div>${days[i].date.slice(5)}</div><div style="color:${days[i].delta >= 0 ? '#7ed6a2' : '#e74c3c'}; font-weight:600;">${days[i].delta >= 0 ? '+' : ''}${days[i].delta}</div>`;
      timeline.appendChild(cell);
    }
  }

  // ---------- entries list ----------
  const entriesList = document.getElementById('entries-list');
  async function refresh() {
    const [summary, entries] = await Promise.all([
      fetch(API + '/api/summary').then((r) => r.json()),
      fetch(API + '/api/entries').then((r) => r.json())
    ]);

    setGauge(summary.earth_health, summary.status === 'warning');
    statDelta.textContent = (summary.total_delta >= 0 ? '+' : '') + summary.total_delta;
    statStreak.textContent = summary.green_streak_days + ' 天';
    statDays.textContent = summary.timeline.length + ' 天';

    const statusText = {
      empty: '🪵 初始荒芜',
      normal: '🚲 日常通勤',
      warning: '☁️ 高碳警告',
      guardian: '🌳 环保卫士'
    };
    statusLabel.textContent = statusText[summary.status] || '日常通勤';

    document.body.classList.remove('warning-mode', 'guardian-mode');
    if (summary.status === 'warning') document.body.classList.add('warning-mode');
    if (summary.status === 'guardian') document.body.classList.add('guardian-mode');

    buildTree(summary.status, summary.golden_fruit_ready, summary.total_delta);
    spawnParticles(summary.status);
    renderTimeline(summary.recent7);

    entriesList.innerHTML = '';
    for (const e of entries.slice(0, 12)) {
      const li = document.createElement('li');
      const d = Number(e.carbon_delta);
      const cls = d >= 0 ? 'delta-pos' : 'delta-neg';
      const sign = d >= 0 ? '+' : '';
      const parts = [];
      if (e.transport) parts.push(iconMap[e.transport] || e.transport);
      if (e.diet) parts.push(e.diet);
      if (e.electricity_kwh) parts.push(e.electricity_kwh + 'kWh');
      li.innerHTML = `<span>${e.date} · ${parts.join(' / ')}</span><span class="${cls}">${sign}${d}</span>`;
      entriesList.appendChild(li);
    }
  }

  // ---------- scenario buttons ----------
  document.querySelectorAll('.sc-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.sc-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const scenario = btn.dataset.scenario;
      if (scenario === 'empty') {
        await fetch(API + '/api/seed-demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: 'empty' }) });
      } else {
        await fetch(API + '/api/seed-demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario }) });
      }
      await refresh();
    });
  });

  refresh();
})();
