const AVATARS = { 'dog-golden': '🐕', 'dog-corgi': '🐶', 'cat-orange': '🐱', 'cat-british': '😸', 'bunny': '🐰', 'hamster': '🐹', 'generic': '🐾' };
const TYPE_LABEL = { vaccine: '疫苗', checkup: '体检', deworm: '驱虫', neuter: '绝育', other: '其它' };

let currentPet = null;

function daysText(n) {
  if (n === Infinity || n === null || n === undefined) return '未设置';
  if (n < 0) return `已过期 ${-n} 天`;
  if (n === 0) return '今天';
  return `${n} 天后`;
}

function metricChip(label, value, cls = '') {
  return `<div class="metric ${cls}">${label}<b>${value}</b></div>`;
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._tm);
  t._tm = setTimeout(() => { t.hidden = true; }, 2200);
}

function renderHero(pet) {
  const avatar = AVATARS[pet.avatar] || AVATARS.generic;
  const isCritical = pet.status === 'critical';
  const face = isCritical ? '😣' : '😊';
  document.title = `${pet.name} 的档案 · 宠物医疗记录`;
  document.getElementById('petName').textContent = pet.name;
  document.getElementById('petMeta').textContent =
    `${pet.species}${pet.breed ? ' · ' + pet.breed : ''} · ${pet.age != null && pet.age !== '' ? pet.age + '岁' : '年龄未知'}`;

  const wCls = isCritical ? 'bad' : '';
  const tCls = (pet.temperature != null && (pet.temperature > 39.2 || pet.temperature < 37.8)) ? 'warn' : '';
  const hCls = isCritical ? 'bad' : '';

  const chips = [];
  if (pet.weight != null && pet.weight !== '') chips.push(metricChip('体重', `${pet.weight} kg`, wCls));
  if (pet.temperature != null && pet.temperature !== '') chips.push(metricChip('体温', `${pet.temperature} ℃`, tCls));
  if (pet.heart_rate != null && pet.heart_rate !== '') chips.push(metricChip('心率', `${pet.heart_rate} bpm`, hCls));
  chips.push(metricChip('下次驱虫', pet.next_deworming ? pet.next_deworming.slice(0, 10) : '未设置'));
  chips.push(metricChip('下次狂犬疫苗', pet.next_rabies ? pet.next_rabies.slice(0, 10) : '未设置'));

  const halo = (pet.rabies_days !== Infinity && pet.rabies_days !== null && pet.rabies_days !== undefined && pet.rabies_days <= 30)
    ? `<div style="margin-top:10px;color:#b37a00;background:#fff1c0;padding:8px 12px;border-radius:12px;font-size:13px">⚠️ 狂犬疫苗 ${daysText(pet.rabies_days)}到期</div>`
    : '';

  document.getElementById('petHero').className = 'pet-hero' + (isCritical ? ' critical' : '');
  document.getElementById('petHero').innerHTML = `
    <div class="big-avatar" style="position:relative">
      ${avatar}
      <span style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:28px">${face}</span>
    </div>
    <div class="pet-hero-info" style="flex:1">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <h2 style="margin:0">${pet.name}</h2>
        <button id="editBtn" class="btn btn-primary" type="button" style="font-size:13px;padding:6px 12px">✏️ 编辑基础档案</button>
      </div>
      <div class="meta">${pet.species}${pet.breed ? ' · ' + pet.breed : ''} · ${pet.age != null && pet.age !== '' ? pet.age + '岁' : '年龄未知'} · ${isCritical ? '🚨 重症监护' : '✨ 健康活泼'}</div>
      <div class="info-grid">${chips.join('')}</div>
      ${halo}
    </div>
  `;
  const editBtn = document.getElementById('editBtn');
  if (editBtn) editBtn.addEventListener('click', openEditModal);
}

function openEditModal() {
  if (!currentPet) return;
  const p = currentPet;
  const form = document.getElementById('editForm');
  form.name.value = p.name || '';
  form.species.value = p.species || '';
  form.breed.value = p.breed || '';
  form.age.value = p.age != null ? p.age : '';
  form.weight.value = p.weight != null ? p.weight : '';
  form.temperature.value = p.temperature != null ? p.temperature : '';
  form.heart_rate.value = p.heart_rate != null ? p.heart_rate : '';
  form.next_deworming.value = p.next_deworming ? p.next_deworming.slice(0, 10) : '';
  form.next_rabies.value = p.next_rabies ? p.next_rabies.slice(0, 10) : '';
  document.getElementById('editModal').classList.add('is-open');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('is-open');
}

function renderTimeline(records) {
  const box = document.getElementById('timeline');
  if (!records.length) {
    box.innerHTML = `<div class="loading">暂无医疗记录</div>`;
    return;
  }
  box.innerHTML = records.map(r => `
    <div class="timeline-item ${r.type}">
      <div class="row">
        <span class="date">${(r.record_date || '').slice(0, 10)}</span>
        <span class="type-tag">${TYPE_LABEL[r.type] || r.type}</span>
      </div>
      <h3>${r.title}</h3>
      <div class="desc">${r.description || ''}</div>
      <div class="meta">
        ${r.hospital ? `🏥 ${r.hospital}` : ''}
        ${r.doctor ? `👨‍⚕️ ${r.doctor}` : ''}
        ${r.next_visit ? `📅 下次复诊: ${r.next_visit.slice(0, 10)}` : ''}
      </div>
    </div>
  `).join('');
}

async function saveEdit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {};
  for (const [k, v] of fd.entries()) body[k] = v;
  for (const k of ['age', 'weight', 'temperature', 'heart_rate']) {
    body[k] = body[k] === '' ? null : parseFloat(body[k]);
  }
  for (const k of ['next_deworming', 'next_rabies']) {
    body[k] = body[k] || null;
  }
  for (const k of ['name', 'species', 'breed']) {
    body[k] = body[k] || null;
  }
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;
  try {
    const res = await fetch(`/api/pets/${currentPet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json();
    // 回填 deworm/rabies 倒计时（列表接口 enrichPet 里才有）
    const enriched = await fetch(`/api/pets/${updated.id}`).then(r => r.json());
    currentPet = enriched.pet;
    // enrichPet 内不返回 records；为了简单只更新 hero
    renderHero(currentPet);
    closeEditModal();
    toast('已保存修改');
  } catch (err) {
    toast('保存失败：' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    document.getElementById('timeline').innerHTML = `<div class="loading">缺少宠物 ID</div>`;
    return;
  }
  try {
    const data = await fetch(`/api/pets/${id}`).then(r => r.json());
    currentPet = data.pet;
    renderHero(data.pet);
    renderTimeline(data.records);
  } catch (e) {
    document.getElementById('timeline').innerHTML = `<div class="loading">❌ 无法加载，请确认后端已启动</div>`;
  }
  document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
  document.getElementById('editForm').addEventListener('submit', saveEdit);
});
