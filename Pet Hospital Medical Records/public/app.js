const AVATARS = {
  'dog-golden': '🐕',
  'dog-corgi': '🐶',
  'cat-orange': '🐱',
  'cat-british': '😸',
  'bunny': '🐰',
  'hamster': '🐹',
  'generic': '🐾'
};
const SPECIES_EMOJI = { '狗狗': '🦴', '猫咪': '🐟', '兔子': '🥕', '仓鼠': '🌰' };

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.hidden = true, 2200);
}

function fmtDate(d) {
  if (!d) return '—';
  return d.slice(0, 10);
}

function daysText(n) {
  if (n === Infinity || n === null || n === undefined) return '—';
  if (n < 0) return `已过期 ${-n} 天`;
  if (n === 0) return '就在今天!';
  return `还有 ${n} 天`;
}

function metricChip(label, value, cls = '') {
  return `<div class="metric ${cls}">${label}<br/><b style="font-size:15px">${value}</b></div>`;
}

function statusTag(status) {
  if (status === 'critical') return `<div class="status-tag" style="background:var(--red)">🚨 重症监护</div>`;
  return `<div class="status-tag">✨ 健康活泼</div>`;
}

function renderPetCard(pet) {
  const isCritical = pet.status === 'critical';
  const hasHalo = (pet.rabies_days !== Infinity && pet.rabies_days <= 30);
  const avatar = AVATARS[pet.avatar] || AVATARS.generic;
  const classes = ['pet-card'];
  if (isCritical) classes.push('critical');
  if (hasHalo) classes.push('halo');

  const face = isCritical ? '😣' : '😊';
  const wCls = isCritical ? 'bad' : '';
  const tCls = pet.temperature > 39.2 || pet.temperature < 37.8 ? 'warn' : '';
  const hCls = isCritical ? 'bad' : '';

  const iv = isCritical ? `
    <div class="iv-drip" title="输液中">
      <div class="bag"></div>
      <div class="tube"><span class="drop"></span></div>
    </div>` : '';

  const haloNote = hasHalo
    ? `<div style="text-align:center;color:#b37a00;font-size:12px;margin-top:8px">⚠️ 狂犬疫苗 ${daysText(pet.rabies_days)}</div>`
    : '';

  return `
    <div class="${classes.join(' ')}" data-id="${pet.id}">
      ${statusTag(pet.status)}
      ${iv}
      <div class="card-avatar-wrap">
        <div class="card-avatar">
          ${avatar}
          <span class="face">${face}</span>
        </div>
      </div>
      <div class="name">${pet.name}</div>
      <div class="species">${pet.species}${pet.breed ? ' · ' + pet.breed : ''} · ${pet.age || '?'}岁</div>
      <div class="metric-row">
        ${metricChip('体重', pet.weight ? pet.weight + 'kg' : '—', wCls)}
        ${metricChip('体温', pet.temperature ? pet.temperature + '℃' : '—', tCls)}
        ${metricChip('心率', pet.heart_rate ? pet.heart_rate : '—', hCls)}
      </div>
      ${haloNote}
    </div>`;
}

function renderAddCard() {
  return `<div class="pet-card add-card" id="addCardBtn">
    <div class="plus">+</div>
    <div style="font-weight:700">新建档案</div>
    <div style="font-size:12px;color:var(--soft);margin-top:4px">为新的小成员建立病历</div>
  </div>`;
}

async function loadPets() {
  const grid = document.getElementById('cardGrid');
  try {
    const res = await fetch('/api/pets');
    const pets = await res.json();
    if (!pets.length) {
      grid.innerHTML = `<div class="loading">暂无宠物档案，点击下方「新建档案」来添加一只！</div>` + renderAddCard();
    } else {
      grid.innerHTML = pets.map(renderPetCard).join('') + renderAddCard();
    }
  } catch (e) {
    grid.innerHTML = `<div class="loading">❌ 无法连接后端，请先运行 <code>npm install &amp;&amp; npm start</code></div>`;
  }
}

// 事件委托：在整个页面上一次性监听，点击 pet-card[data-id] 进入详情，点击 #addCardBtn 弹出模态框
document.addEventListener('click', (e) => {
  const petCard = e.target.closest('.pet-card[data-id]');
  if (petCard) {
    location.href = `/detail.html?id=${petCard.dataset.id}`;
    return;
  }
  if (e.target.closest('#addCardBtn')) {
    openAddModal();
  }
});

async function loadPush() {
  const list = document.getElementById('pushList');
  try {
    const msgs = await fetch('/api/push').then(r => r.json());
    if (!msgs.length) {
      list.innerHTML = `<li class="empty">暂无提醒 · 点击右上角「扫描提醒」触发一次</li>`;
      return;
    }
    list.innerHTML = msgs.map(m => `
      <li class="${m.kind || ''}">
        <div>
          <span class="kind">${m.kind === 'rabies' ? '狂犬疫苗' : m.kind === 'deworm' ? '驱虫' : '系统'}</span>
          <b>${m.title}</b>
          <div style="color:var(--soft);font-size:13px;margin-top:4px">${m.body || ''} · ${m.pet_name || '系统消息'}</div>
        </div>
        <div style="color:var(--soft);font-size:12px;white-space:nowrap">${(m.scheduled_at || '').replace('T',' ').slice(0,16)}</div>
      </li>
    `).join('');
  } catch (e) { /* ignore */ }
}

function openAddModal() {
  document.getElementById('addModal').classList.add('is-open');
}
function closeAddModal() {
  document.getElementById('addModal').classList.remove('is-open');
  document.getElementById('addForm').reset();
}

document.addEventListener('DOMContentLoaded', () => {
  const d = new Date();
  document.getElementById('todayLabel').textContent =
    `今天 ${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  loadPets();
  loadPush();

  document.getElementById('scanBtn').addEventListener('click', async () => {
    const r = await fetch('/api/scan-reminders', { method: 'POST' }).then(x => x.json());
    toast(`生成 ${r.generated} 条新提醒`);
    loadPush();
    loadPets();
  });

  document.getElementById('cancelAdd').addEventListener('click', closeAddModal);
  document.getElementById('addModal').addEventListener('click', (e) => {
    if (e.target.id === 'addModal') closeAddModal();
  });
  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; }
    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      if (!body.name || !body.species) {
        toast('请至少填写「姓名」与「品种」');
        return;
      }
      for (const k of ['age', 'weight', 'temperature', 'heart_rate']) {
        if (body[k]) body[k] = parseFloat(body[k]);
      }
      body.avatar = 'generic';
      body.status = 'healthy';
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast(`${body.name} 的档案已建立！`);
      closeAddModal();
      await loadPets();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast('建立档案失败：' + err.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
