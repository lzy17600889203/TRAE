const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mm = require('music-metadata');
const db = require('./db');
const seed = require('./seeds');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

app.use(express.static(PUBLIC_DIR));

seed();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AUDIO_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\u4e00-\u9fa5-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^audio\//.test(file.mimetype) || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持音频文件'));
    }
  },
});

app.post('/api/songs/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未接收到文件' });
    let duration = 0;
    try {
      const meta = await mm.parseFile(req.file.path, { duration: true });
      duration = Math.round(meta.format.duration || 0);
    } catch (_) {
      duration = 0;
    }
    res.json({
      filename: path.basename(req.file.filename),
      originalName: req.file.originalname,
      size: req.file.size,
      duration,
      url: `/uploads/audio/${encodeURIComponent(req.file.filename)}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/songs', (req, res) => {
  const rows = [...db.songs].sort((a, b) => (b.created_at || 0) - (a.created_at || 0) || b.id - a.id);
  res.json(rows);
});

app.post('/api/songs', (req, res) => {
  const { title, album, lyrics, duration, filename, originalName, status } = req.body || {};
  if (!title) return res.status(400).json({ error: '歌曲标题必填' });
  const song = {
    id: db.nextId('songs'),
    title,
    album: album || '',
    lyrics: lyrics || '',
    duration: Number(duration) || 0,
    filename: filename || '',
    original_name: originalName || '',
    status: status === 'draft' ? 'draft' : 'published',
    created_at: Math.floor(Date.now() / 1000),
  };
  db.songs.push(song);
  db.persist();
  res.json({ id: song.id });
});

app.put('/api/songs/:id', (req, res) => {
  const { title, album, lyrics, duration, filename, originalName, status } = req.body || {};
  const id = Number(req.params.id);
  const existing = db.songs.find((s) => s.id === id);
  if (!existing) return res.status(404).json({ error: '歌曲不存在' });
  existing.title = title || '';
  existing.album = album || '';
  existing.lyrics = lyrics || '';
  existing.duration = Number(duration) || 0;
  if (filename) existing.filename = filename;
  if (originalName) existing.original_name = originalName;
  existing.status = status === 'draft' ? 'draft' : status === 'offline' ? 'offline' : 'published';
  db.persist();
  res.json({ ok: true });
});

app.patch('/api/songs/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const existing = db.songs.find((s) => s.id === id);
  if (!existing) return res.status(404).json({ error: '歌曲不存在' });
  existing.status = status === 'draft' ? 'draft' : status === 'offline' ? 'offline' : 'published';
  db.persist();
  res.json({ ok: true, status: existing.status });
});

app.delete('/api/songs/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.songs.findIndex((s) => s.id === id);
  if (idx >= 0) db.songs.splice(idx, 1);
  db.persist();
  res.json({ ok: true });
});

app.get('/api/fans', (req, res) => {
  const { q, region, tag, sort } = req.query;
  let list = [...db.fans];
  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter((f) => {
      return (
        (f.name || '').toLowerCase().includes(needle) ||
        (f.tags || '').toLowerCase().includes(needle) ||
        (f.region || '').toLowerCase().includes(needle)
      );
    });
  }
  if (region) list = list.filter((f) => f.region === region);
  if (tag) list = list.filter((f) => (f.tags || '').includes(String(tag)));
  if (sort === 'followed_asc') list.sort((a, b) => (a.followed_at || 0) - (b.followed_at || 0));
  else if (sort === 'region_asc') list.sort((a, b) => String(a.region).localeCompare(String(b.region)) || String(a.name).localeCompare(String(b.name)));
  else list.sort((a, b) => (b.followed_at || 0) - (a.followed_at || 0));
  res.json(list);
});

app.get('/api/fans/regions', (req, res) => {
  const set = new Set();
  for (const f of db.fans) {
    if (f.region) set.add(f.region);
  }
  res.json([...set].sort());
});

app.post('/api/fans', (req, res) => {
  const { name, region, tags } = req.body || {};
  if (!name) return res.status(400).json({ error: '粉丝姓名必填' });
  const fan = {
    id: db.nextId('fans'),
    name,
    region: region || '',
    tags: tags || '',
    followed_at: Math.floor(Date.now() / 1000),
  };
  db.fans.push(fan);
  db.persist();
  res.json({ id: fan.id });
});

app.put('/api/fans/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.fans.find((f) => f.id === id);
  if (!existing) return res.status(404).json({ error: '粉丝不存在' });
  const { name, region, tags } = req.body || {};
  existing.name = name || '';
  existing.region = region || '';
  existing.tags = tags || '';
  db.persist();
  res.json({ ok: true });
});

app.patch('/api/fans/:id/tags', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.fans.find((f) => f.id === id);
  if (!existing) return res.status(404).json({ error: '粉丝不存在' });
  existing.tags = (req.body && req.body.tags) || '';
  db.persist();
  res.json({ ok: true });
});

app.delete('/api/fans/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.fans.findIndex((f) => f.id === id);
  if (idx >= 0) db.fans.splice(idx, 1);
  db.persist();
  res.json({ ok: true });
});

app.get('/api/announcements', (req, res) => {
  const list = [...db.announcements].sort((a, b) => (b.created_at || 0) - (a.created_at || 0) || b.id - a.id);
  res.json(list);
});

app.post('/api/announcements', (req, res) => {
  const { title, content } = req.body || {};
  if (!title) return res.status(400).json({ error: '公告标题必填' });
  const ann = {
    id: db.nextId('announcements'),
    title,
    content: content || '',
    created_at: Math.floor(Date.now() / 1000),
  };
  db.announcements.push(ann);
  db.persist();
  res.json(ann);
});

app.delete('/api/announcements/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.announcements.findIndex((a) => a.id === id);
  if (idx >= 0) db.announcements.splice(idx, 1);
  db.persist();
  res.json({ ok: true });
});

function isPortFree(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close();
      resolve(true);
    });
    tester.listen(port, '127.0.0.1');
  });
}

async function start() {
  let port = Number(process.env.PORT) || 3000;
  while (!(await isPortFree(port))) {
    console.log(`[端口冲突] ${port} 被占用，尝试下一个端口...`);
    port += 1;
    if (port > 65000) break;
  }
  app.listen(port, () => {
    console.log(`✓ 独立音乐人后台已启动: http://localhost:${port}`);
  });
}

start();
