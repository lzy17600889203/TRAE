const AVATARS = { 'dog-golden': '🐕', 'dog-corgi': '🐶', 'cat-orange': '🐱', 'cat-british': '😸', 'bunny': '🐰', 'hamster': '🐹', 'generic': '🐾' };
const TYPE_LABEL = { vaccine: '疫苗', checkup: '体检', deworm: '驱虫', neuter: '绝育', other: '其它' };

function daysText(n) {
  if (n === Infinity || n === null || n === undefined) return '未设置';
  if (n < 0) return `已过期 ${-n} 天`;
  if (n === 0) return '今天';
  return `${n} 天后`;
}

function metricChip(label, value, cls = '') {
  return `<div class="metric ${cls}">${label}<b>${value}</b></div>`;
}

function renderHero(pet) {
  const avatar = AVATARS[pet.avatar] || AVATARS.generic;
  const isCritical = pet.status === 'critical';
  const face = isCritical ? '😣' : '😊';
  document.title = `${pet.name} 的档案 · 宠物医疗记录`;
  document.getElementById('petName').textContent = pet.name;
  document.getElementById('petMeta').textContent =
    `${pet.species}${pet.breed ? ' · ' + pet.breed : ''} · ${pet.age || '?'}岁`;

  const wCls = isCritical ? 'bad' : '';
  const tCls = pet.temperature > 39.2 || pet.temperature < 37.8 ? 'warn' : '';
  const hCls = isCritical ? 'bad' : '';

  const halo = (pet.rabies_days !== Infinity && pet.rabies_days <= 30)
    ? `<div style="margin-top:10px;color:#b37a00;background:#fff1c0;padding:8px 12px;border-radius:12px;font-size:13px">⚠️ 狂犬疫苗 ${daysText(pet.rabies_days)}到期</div>`
    : '';

  document.getElementById('petHero').className = 'pet-hero' + (isCritical ? ' critical' : '');
  document.getElementById('petHero').innerHTML = `
    <div class="big-avatar" style="position:relative">
      ${avatar}
      <span style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:28px">${face}</span>
    </div>
    <div class="pet-hero-info" style="flex:1">
      <h2>${pet.name}</h2>
      <div class="meta">${pet.species}${pet.breed ? ' · ' + pet.breed : ''} · ${pet.age || '?'}岁 · ${isCritical ? '🚨 重症监护' : '✨ 健康活泼'}</div>
      <div class="info-grid">
        ${metricChip('体重', pet.weight ? pet.weight + ' kg' : '—', wCls)}
        ${metricChip('体温', pet.temperature ? pet.temperature + ' ℃' : '—', tCls)}
        ${metricChip('心率', pet.heart_rate ? pet.heart_rate + ' bpm' : '—', hCls)}
        ${metricChip('下次驱虫', pet.next_deworming ? pet.next_deworming.slice(0,10) : '—')}
        ${metricChip('下次狂犬疫苗', pet.next_rabies ? pet.next_rabies.slice(0,10) : '—')}
      </div>
      ${halo}
    </div>
  `;
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
        ${r.next_visit ? `📅 下次复诊: ${r.next_visit.slice(0,10)}` : ''}
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    document.getElementById('timeline').innerHTML = `<div class="loading">缺少宠物 ID</div>`;
    return;
  }
  try {
    const data = await fetch(`/api/pets/${id}`).then(r => r.json());
    renderHero(data.pet);
    renderTimeline(data.records);
  } catch (e) {
    document.getElementById('timeline').innerHTML = `<div class="loading">❌ 无法加载，请确认后端已启动</div>`;
  }
});
