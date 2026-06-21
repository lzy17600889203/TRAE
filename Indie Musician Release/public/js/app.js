(function () {
  'use strict';

  // ===== Global state =====
  const state = {
    songs: [],
    fans: [],
    announcements: [],
    regions: [],
    fanFilter: { q: '', region: '', tag: '', sort: 'followed_desc' },
    editingSong: null,
    editingFan: null,
    uploadedFile: null, // { filename, originalName, duration, url }
  };

  // ===== Utilities =====
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function showToast(msg, type) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.borderColor = type === 'error' ? '#7a2828' : 'var(--border)';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    const now = new Date();
    const diffMin = (now - d) / 60000;
    if (diffMin < 1) return '刚刚发布';
    if (diffMin < 60) return Math.round(diffMin) + ' 分钟前';
    if (diffMin < 60 * 24) return Math.round(diffMin / 60) + ' 小时前';
    return d.toLocaleString('zh-CN');
  }

  function fmtDuration(sec) {
    if (!sec) return '—';
    const s = Number(sec) || 0;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }

  async function api(path, options) {
    const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options || {}));
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const msg = (body && body.error) || '请求失败';
      showToast(msg, 'error');
      throw new Error(msg);
    }
    return body;
  }

  // ===== Tabs =====
  function initTabs() {
    $$('#mainTabs .tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('#mainTabs .tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const name = btn.getAttribute('data-tab');
        $$('.panel').forEach((p) => {
          p.classList.toggle('hidden', p.getAttribute('data-panel') !== name);
        });
      });
    });
  }

  // ===== Modals =====
  function openModal(id) { $('#' + id).classList.remove('hidden'); }
  function closeModal(id) { $('#' + id).classList.add('hidden'); }

  function initModals() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-modal')) {
        closeModal(e.target.getAttribute('data-close'));
      }
      if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') $$('.modal').forEach((m) => m.classList.add('hidden'));
    });
  }

  // ===== Songs =====
  async function loadSongs() {
    state.songs = await api('/api/songs');
    renderSongs();
  }

  function renderSongs() {
    const root = $('#songList');
    root.innerHTML = '';
    if (!state.songs.length) {
      root.innerHTML = '<div style="color:var(--muted)">还没有歌曲，点击右上角上传一首吧。</div>';
      return;
    }
    for (const s of state.songs) {
      const card = document.createElement('div');
      card.className = 'song-card';
      const statusText = s.status === 'published' ? '上架' : s.status === 'offline' ? '下架' : '草稿';
      card.innerHTML = `
        <div>
          <h3>${escapeHtml(s.title)}</h3>
          <div class="meta">${escapeHtml(s.album || '未指定专辑')} · 时长 ${fmtDuration(s.duration)}</div>
        </div>
        <div>
          <span class="status ${s.status}">${statusText}</span>
        </div>
        ${s.filename ? `<audio controls style="width:100%" src="/uploads/audio/${encodeURIComponent(s.filename)}"></audio>` : ''}
        ${s.lyrics ? `<div class="meta" style="white-space:pre-wrap;max-height:90px;overflow:auto">${escapeHtml(s.lyrics)}</div>` : ''}
        <div class="actions">
          <button class="btn btn-sm" data-act="edit" data-id="${s.id}">编辑</button>
          <button class="btn btn-sm" data-act="toggle" data-id="${s.id}">
            ${s.status === 'published' ? '下架' : '重新上架'}
          </button>
          <button class="btn btn-sm btn-danger" data-act="del" data-id="${s.id}">删除</button>
        </div>
      `;
      root.appendChild(card);
    }
    root.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => handleSongAction(b.getAttribute('data-act'), Number(b.getAttribute('data-id'))));
    });
  }

  async function handleSongAction(act, id) {
    const song = state.songs.find((s) => s.id === id);
    if (!song) return;
    if (act === 'edit') {
      openSongEditor(song);
    } else if (act === 'toggle') {
      const next = song.status === 'published' ? 'offline' : 'published';
      await api(`/api/songs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      showToast(next === 'published' ? '已重新上架' : '已下架');
      await loadSongs();
    } else if (act === 'del') {
      if (!confirm(`确定删除《${song.title}》？`)) return;
      await api(`/api/songs/${id}`, { method: 'DELETE' });
      showToast('已删除');
      await loadSongs();
    }
  }

  function openSongEditor(song) {
    state.editingSong = song || null;
    state.uploadedFile = null;
    $('#songModalTitle').textContent = song ? '编辑歌曲' : '上传新歌';
    $('#fieldTitle').value = song ? song.title : '';
    $('#fieldAlbum').value = song ? song.album || '' : '';
    $('#fieldLyrics').value = song ? song.lyrics || '' : '';
    $('#fieldDuration').value = song ? song.duration || 0 : '';
    $('#fieldStatus').value = song ? song.status || 'published' : 'published';
    $('#progressWrap').classList.add('hidden');
    $('#progressFill').style.width = '0%';
    $('#progressMeta').textContent = '准备上传...';
    $('#audioPreview').innerHTML = '';
    if (song && song.filename) {
      $('#audioPreview').innerHTML = `<audio controls style="width:100%" src="/uploads/audio/${encodeURIComponent(song.filename)}"></audio>`;
    }
    openModal('songModal');
  }

  function initUploadDropzone() {
    const dz = $('#dropzone');
    const input = $('#fileInput');
    dz.addEventListener('click', (e) => {
      if (e.target !== input) input.click();
    });
    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => {
      e.preventDefault(); dz.classList.add('drag');
    }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => {
      e.preventDefault(); dz.classList.remove('drag');
    }));
    dz.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    });
    input.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleFileUpload(file);
    });
  }

  function handleFileUpload(file) {
    if (!/^audio\//.test(file.type) && !/\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name)) {
      showToast('请上传音频文件', 'error');
      return;
    }
    const wrap = $('#progressWrap');
    const fill = $('#progressFill');
    const meta = $('#progressMeta');
    wrap.classList.remove('hidden');
    fill.style.width = '0%';
    meta.textContent = `上传中：${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;

    const form = new FormData();
    form.append('audio', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/songs/upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        fill.style.width = pct + '%';
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 400) throw new Error(data.error || '上传失败');
        fill.style.width = '100%';
        meta.textContent = `解析完成：时长 ${fmtDuration(data.duration)}`;
        state.uploadedFile = data;
        if (!$('#fieldTitle').value) $('#fieldTitle').value = data.originalName.replace(/\.[^.]+$/, '');
        if (!$('#fieldDuration').value || Number($('#fieldDuration').value) === 0) {
          $('#fieldDuration').value = data.duration || 0;
        }
        $('#audioPreview').innerHTML = `<audio controls style="width:100%" src="${data.url}"></audio>`;
        showToast('上传成功');
      } catch (err) {
        showToast(err.message || '上传失败', 'error');
      }
    };
    xhr.onerror = () => showToast('网络错误', 'error');
    xhr.send(form);
  }

  function initSongForm() {
    $('#btnNewSong').addEventListener('click', () => openSongEditor(null));
    $('#btnSaveSong').addEventListener('click', async () => {
      const title = $('#fieldTitle').value.trim();
      if (!title) { showToast('请填写歌名', 'error'); return; }
      const body = {
        title,
        album: $('#fieldAlbum').value.trim(),
        lyrics: $('#fieldLyrics').value,
        duration: Number($('#fieldDuration').value) || 0,
        status: $('#fieldStatus').value,
      };
      if (state.uploadedFile) {
        body.filename = state.uploadedFile.filename;
        body.originalName = state.uploadedFile.originalName;
      }
      if (state.editingSong) {
        await api(`/api/songs/${state.editingSong.id}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('已保存');
      } else {
        await api('/api/songs', { method: 'POST', body: JSON.stringify(body) });
        showToast('已创建歌曲');
      }
      closeModal('songModal');
      await loadSongs();
    });
  }

  // ===== Fans =====
  async function loadFans() {
    const params = new URLSearchParams();
    if (state.fanFilter.q) params.set('q', state.fanFilter.q);
    if (state.fanFilter.region) params.set('region', state.fanFilter.region);
    if (state.fanFilter.tag) params.set('tag', state.fanFilter.tag);
    if (state.fanFilter.sort) params.set('sort', state.fanFilter.sort);
    state.fans = await api(`/api/fans?${params.toString()}`);
    renderFans();
  }

  async function loadRegions() {
    state.regions = await api('/api/fans/regions');
    const sel = $('#fanRegion');
    sel.innerHTML = '<option value="">全部地区</option>';
    for (const r of state.regions) {
      const opt = document.createElement('option');
      opt.value = r; opt.textContent = r;
      sel.appendChild(opt);
    }
  }

  function renderFans() {
    const tbody = $('#fanTbody');
    tbody.innerHTML = '';
    const q = state.fanFilter.q.trim().toLowerCase();

    // Build rows then apply transition classes to existing ones for smoother anim
    const fans = state.fans;
    if (!fans.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:24px">暂无匹配粉丝</td></tr>';
      return;
    }
    for (const f of fans) {
      const tr = document.createElement('tr');
      tr.dataset.id = f.id;
      const tagHtml = (f.tags || '')
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`)
        .join('') || '<span style="color:var(--muted)">—</span>';
      tr.innerHTML = `
        <td>${escapeHtml(f.name)}</td>
        <td>${escapeHtml(f.region || '—')}</td>
        <td>${tagHtml}</td>
        <td>${fmtDate(f.followed_at)}</td>
        <td>
          <button class="btn btn-sm" data-act="edit" data-id="${f.id}">编辑</button>
          <button class="btn btn-sm btn-danger" data-act="del" data-id="${f.id}">删除</button>
        </td>
      `;
      if (q) {
        const haystack = `${f.name} ${f.region || ''} ${f.tags || ''}`.toLowerCase();
        if (haystack.includes(q)) tr.classList.add('highlight');
      }
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => handleFanAction(b.getAttribute('data-act'), Number(b.getAttribute('data-id'))));
    });
  }

  async function handleFanAction(act, id) {
    if (act === 'edit') {
      const fan = state.fans.find((f) => f.id === id);
      if (fan) openFanEditor(fan);
    } else if (act === 'del') {
      if (!confirm('删除该粉丝？')) return;
      await api(`/api/fans/${id}`, { method: 'DELETE' });
      showToast('已删除');
      await loadFans();
    }
  }

  function openFanEditor(fan) {
    state.editingFan = fan;
    $('#fanFieldName').value = fan ? fan.name : '';
    $('#fanFieldRegion').value = fan ? fan.region || '' : '';
    $('#fanFieldTags').value = fan ? fan.tags || '' : '';
    openModal('fanModal');
  }

  function initFanForm() {
    $('#tagPresets').addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') return;
      const tag = e.target.getAttribute('data-tag');
      const field = $('#fanFieldTags');
      const current = field.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      if (!current.includes(tag)) current.push(tag);
      field.value = current.join(', ');
    });
    $('#btnSaveFan').addEventListener('click', async () => {
      const name = $('#fanFieldName').value.trim();
      if (!name) { showToast('请填写姓名', 'error'); return; }
      const body = {
        name,
        region: $('#fanFieldRegion').value.trim(),
        tags: $('#fanFieldTags').value.trim(),
      };
      if (state.editingFan) {
        await api(`/api/fans/${state.editingFan.id}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('已更新');
      } else {
        await api('/api/fans', { method: 'POST', body: JSON.stringify(body) });
        showToast('已新增');
      }
      closeModal('fanModal');
      await loadFans();
      await loadRegions();
    });
  }

  function initFanFilters() {
    let debounceTimer;
    $('#fanSearch').addEventListener('input', (e) => {
      state.fanFilter.q = e.target.value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applyFanFilterAnimated();
      }, 200);
    });
    $('#fanRegion').addEventListener('change', (e) => { state.fanFilter.region = e.target.value; applyFanFilterAnimated(); });
    $('#fanSort').addEventListener('change', (e) => { state.fanFilter.sort = e.target.value; loadFans(); });
  }

  // Apply filter without re-fetching for the fade-out animation, then refresh after.
  async function applyFanFilterAnimated() {
    const q = state.fanFilter.q.trim().toLowerCase();
    const region = state.fanFilter.region;
    const tag = state.fanFilter.tag;
    const tbody = $('#fanTbody');
    for (const tr of Array.from(tbody.children)) {
      const id = Number(tr.dataset.id);
      const fan = state.fans.find((f) => f.id === id);
      if (!fan) continue;
      const matches = (!q || (`${fan.name} ${fan.region || ''} ${fan.tags || ''}`.toLowerCase().includes(q)))
        && (!region || fan.region === region)
        && (!tag || (fan.tags || '').toLowerCase().includes(tag.toLowerCase()));
      tr.classList.toggle('fade-out', !matches);
      tr.classList.toggle('highlight', matches && !!q);
    }
    // After animation settle, fetch new list to keep ordering / data fresh
    setTimeout(loadFans, 350);
  }

  // ===== Announcements =====
  async function loadAnnouncements() {
    state.announcements = await api('/api/announcements');
    renderAnnouncementBar();
    renderAnnouncementList();
  }

  function renderAnnouncementBar() {
    const root = $('#announcementScroll');
    root.innerHTML = '';
    if (!state.announcements.length) {
      root.innerHTML = '<div style="color:var(--muted);padding:6px 4px">还没有公告。</div>';
      return;
    }
    for (const a of state.announcements) {
      const card = document.createElement('div');
      card.className = 'ann-card';
      const ts = fmtDate(a.created_at);
      const isNew = (Date.now() / 1000 - (a.created_at || 0)) < 60;
      card.innerHTML = `
        <div><span class="title">${escapeHtml(a.title)}</span>${isNew ? '<span class="badge">刚刚发布</span>' : ''}</div>
        <div class="meta">${ts}</div>
        <div style="font-size:13px">${escapeHtml(a.content || '').slice(0, 80)}</div>
      `;
      root.appendChild(card);
    }
  }

  function renderAnnouncementList() {
    const root = $('#announcementList');
    root.innerHTML = '';
    if (!state.announcements.length) {
      root.innerHTML = '<div style="color:var(--muted)">还没有公告。</div>';
      return;
    }
    for (const a of state.announcements) {
      const row = document.createElement('div');
      row.className = 'ann-row';
      row.innerHTML = `
        <div class="content">
          <h4>${escapeHtml(a.title)}</h4>
          <div>${escapeHtml(a.content || '')}</div>
          <small>${fmtDate(a.created_at)}</small>
        </div>
        <div><button class="btn btn-sm btn-danger" data-id="${a.id}">删除</button></div>
      `;
      row.querySelector('button[data-id]').addEventListener('click', async () => {
        if (!confirm('删除该公告？')) return;
        await api(`/api/announcements/${a.id}`, { method: 'DELETE' });
        showToast('已删除');
        await loadAnnouncements();
      });
      root.appendChild(row);
    }
  }

  function initAnnouncementForm() {
    $('#btnNewAnnouncement').addEventListener('click', () => openAnnouncement());
    $('#btnNewAnnouncement2').addEventListener('click', () => openAnnouncement());
    $('#btnPublishAnnouncement').addEventListener('click', async () => {
      const title = $('#annTitle').value.trim();
      if (!title) { showToast('请填写标题', 'error'); return; }
      const content = $('#annContent').value.trim();
      const created = await api('/api/announcements', { method: 'POST', body: JSON.stringify({ title, content }) });
      showToast('已发布');
      $('#annTitle').value = '';
      $('#annContent').value = '';
      closeModal('announcementModal');
      state.announcements.unshift(created);
      renderAnnouncementBar();
      renderAnnouncementList();
    });
  }

  function openAnnouncement() {
    $('#annTitle').value = '';
    $('#annContent').value = '';
    openModal('announcementModal');
  }

  // ===== HTML escape =====
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ===== Boot =====
  function boot() {
    initTabs();
    initModals();
    initUploadDropzone();
    initSongForm();
    initFanForm();
    initFanFilters();
    initAnnouncementForm();
    loadSongs();
    loadRegions();
    loadFans();
    loadAnnouncements();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
