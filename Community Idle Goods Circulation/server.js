const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { initDB, queryRows, queryOne, runInsert, exec, save } = require('./db');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const DEFAULT_USERS = [
  { username: 'alice', nickname: '阿丽丝' },
  { username: 'bob', nickname: '鲍勃' },
  { username: 'carol', nickname: '卡萝尔' }
];

function seedDefaultUsers() {
  const existing = queryRows('SELECT username FROM users').map((u) => u.username);
  DEFAULT_USERS.forEach((u) => {
    if (existing.indexOf(u.username) === -1) {
      exec('INSERT INTO users (username, nickname) VALUES (?, ?)', [u.username, u.nickname]);
    }
  });
  save();
}

function getCurrentUser(req) {
  const uid = parseInt(req.headers['x-user-id'], 10) || 1;
  const user = queryOne('SELECT id, username, nickname FROM users WHERE id = ?', [uid]);
  return user || { id: 1, username: 'alice', nickname: '阿丽丝' };
}

function enrichGoods(row) {
  if (!row) return null;
  let images = [];
  try { images = JSON.parse(row.images || '[]'); } catch (e) {}
  return { ...row, images };
}

app.get('/api/users', (req, res) => {
  res.json(queryRows('SELECT id, username, nickname, created_at FROM users ORDER BY id'));
});

app.post('/api/users', (req, res) => {
  const { username, nickname } = req.body || {};
  if (!username || !nickname) return res.status(400).json({ error: '参数不全' });
  try {
    const id = runInsert('INSERT INTO users (username, nickname) VALUES (?, ?)', [username, nickname]);
    save();
    res.json({ id, username, nickname });
  } catch (e) {
    res.status(400).json({ error: '用户名已存在' });
  }
});

app.get('/api/me', (req, res) => res.json(getCurrentUser(req)));

app.post('/api/upload', upload.array('images', 9), (req, res) => {
  const urls = (req.files || []).map(f => '/uploads/' + f.filename);
  res.json({ urls });
});

app.get('/api/goods', (req, res) => {
  const { user_id, status, q } = req.query;
  let sql = 'SELECT g.*, u.nickname AS owner_name FROM goods g JOIN users u ON u.id = g.user_id WHERE 1=1';
  const params = [];
  if (user_id) { sql += ' AND g.user_id = ?'; params.push(user_id); }
  if (status) { sql += ' AND g.status = ?'; params.push(status); }
  if (q) {
    sql += ' AND (g.title LIKE ? OR g.description LIKE ?)';
    params.push('%' + q + '%', '%' + q + '%');
  }
  sql += ' ORDER BY g.created_at DESC, g.id DESC';
  res.json(queryRows(sql, params).map(enrichGoods));
});

app.get('/api/goods/:id', (req, res) => {
  const row = queryOne(
    'SELECT g.*, u.nickname AS owner_name, u.username AS owner_username FROM goods g JOIN users u ON u.id = g.user_id WHERE g.id = ?',
    [parseInt(req.params.id, 10)]
  );
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(enrichGoods(row));
});

app.post('/api/goods', (req, res) => {
  const user = getCurrentUser(req);
  const { title, description, price, images, location, category } = req.body || {};
  if (!title) return res.status(400).json({ error: '标题必填' });
  const imgs = JSON.stringify(Array.isArray(images) ? images : []);
  const id = runInsert(
    'INSERT INTO goods (user_id, title, description, price, images, location, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.id, title, description || '', parseFloat(price) || 0, imgs, location || '', category || '']
  );
  save();
  const row = queryOne('SELECT g.*, u.nickname AS owner_name FROM goods g JOIN users u ON u.id = g.user_id WHERE g.id = ?', [id]);
  res.json(enrichGoods(row));
});

app.put('/api/goods/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const row = queryOne('SELECT * FROM goods WHERE id = ?', [id]);
  if (!row) return res.status(404).json({ error: 'not found' });
  if (row.user_id !== user.id) return res.status(403).json({ error: '无权修改' });
  const { title, description, price, images, location, category, status } = req.body || {};
  const patch = [];
  const vals = [];
  if (title !== undefined) { patch.push('title=?'); vals.push(title); }
  if (description !== undefined) { patch.push('description=?'); vals.push(description); }
  if (price !== undefined) { patch.push('price=?'); vals.push(parseFloat(price) || 0); }
  if (images !== undefined) { patch.push('images=?'); vals.push(JSON.stringify(images || [])); }
  if (location !== undefined) { patch.push('location=?'); vals.push(location || ''); }
  if (category !== undefined) { patch.push('category=?'); vals.push(category || ''); }
  if (status !== undefined) { patch.push('status=?'); vals.push(status); }
  if (patch.length) {
    exec('UPDATE goods SET ' + patch.join(',') + ' WHERE id = ?', [...vals, id]);
    save();
  }
  const updated = queryOne('SELECT g.*, u.nickname AS owner_name FROM goods g JOIN users u ON u.id = g.user_id WHERE g.id = ?', [id]);
  res.json(enrichGoods(updated));
});

app.delete('/api/goods/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const row = queryOne('SELECT * FROM goods WHERE id = ?', [id]);
  if (!row) return res.status(404).json({ error: 'not found' });
  if (row.user_id !== user.id) return res.status(403).json({ error: '无权删除' });
  exec('DELETE FROM messages WHERE goods_id = ?', [id]);
  exec('DELETE FROM orders WHERE goods_id = ?', [id]);
  exec('DELETE FROM goods WHERE id = ?', [id]);
  save();
  res.json({ ok: true });
});

app.get('/api/orders', (req, res) => {
  const user = getCurrentUser(req);
  const { role } = req.query;
  let sql = 'SELECT o.*, g.title AS goods_title, g.price AS goods_price, g.images AS goods_images, ' +
            ' u_s.nickname AS seller_name, u_b.nickname AS buyer_name ' +
            ' FROM orders o JOIN goods g ON g.id = o.goods_id ' +
            ' JOIN users u_s ON u_s.id = o.seller_id ' +
            ' JOIN users u_b ON u_b.id = o.buyer_id ' +
            ' WHERE 1=1';
  const params = [];
  if (role === 'seller') { sql += ' AND o.seller_id = ?'; params.push(user.id); }
  else if (role === 'buyer') { sql += ' AND o.buyer_id = ?'; params.push(user.id); }
  else { sql += ' AND (o.seller_id = ? OR o.buyer_id = ?)'; params.push(user.id, user.id); }
  sql += ' ORDER BY o.created_at DESC';
  const rows = queryRows(sql, params).map(r => {
    let imgs = [];
    try { imgs = JSON.parse(r.goods_images || '[]'); } catch (e) {}
    return { ...r, goods_images: imgs };
  });
  res.json(rows);
});

app.post('/api/orders', (req, res) => {
  const user = getCurrentUser(req);
  const { goods_id, message } = req.body || {};
  const gid = parseInt(goods_id, 10);
  const g = queryOne('SELECT * FROM goods WHERE id = ?', [gid]);
  if (!g) return res.status(404).json({ error: '商品不存在' });
  if (g.user_id === user.id) return res.status(400).json({ error: '不能购买自己的商品' });
  if (g.status !== 'on_sale') return res.status(400).json({ error: '商品不可购买' });
  const id = runInsert('INSERT INTO orders (goods_id, seller_id, buyer_id, buyer_name, message) VALUES (?, ?, ?, ?, ?)',
    [gid, g.user_id, user.id, user.nickname, message || '']);
  save();
  res.json({ id });
});

app.put('/api/orders/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return res.status(404).json({ error: 'not found' });
  if (order.seller_id !== user.id) return res.status(403).json({ error: '无权处理' });
  if (!['pending', 'accepted', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '状态非法' });
  }
  exec('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  if (status === 'accepted') exec('UPDATE goods SET status = ? WHERE id = ?', ['reserved', order.goods_id]);
  if (status === 'completed') exec('UPDATE goods SET status = ? WHERE id = ?', ['sold', order.goods_id]);
  if (status === 'rejected') exec('UPDATE goods SET status = ? WHERE id = ? AND status = ?', ['on_sale', order.goods_id, 'reserved']);
  save();
  res.json({ ok: true });
});

app.delete('/api/orders/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return res.status(404).json({ error: 'not found' });
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return res.status(403).json({ error: '无权' });
  }
  exec('DELETE FROM orders WHERE id = ?', [id]);
  save();
  res.json({ ok: true });
});

app.get('/api/goods/:id/messages', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = queryRows(
    'SELECT m.id, m.goods_id, m.user_id, m.content, m.created_at, ' +
    ' u.nickname AS user_nickname, u.username AS user_username ' +
    ' FROM messages m JOIN users u ON u.id = m.user_id ' +
    ' WHERE m.goods_id = ? ORDER BY m.created_at ASC, m.id ASC',
    [id]
  );
  res.json(rows);
});

app.post('/api/goods/:id/messages', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const g = queryOne('SELECT id, user_id FROM goods WHERE id = ?', [id]);
  if (!g) return res.status(404).json({ error: '商品不存在' });
  const { content } = req.body || {};
  if (!content || !content.trim()) return res.status(400).json({ error: '内容不能为空' });
  const mid = runInsert('INSERT INTO messages (goods_id, user_id, username, content) VALUES (?, ?, ?, ?)',
    [id, user.id, user.nickname, String(content)]);
  save();
  const m = queryOne(
    'SELECT m.id, m.goods_id, m.user_id, m.content, m.created_at, ' +
    ' u.nickname AS user_nickname, u.username AS user_username ' +
    ' FROM messages m JOIN users u ON u.id = m.user_id WHERE m.id = ?',
    [mid]
  );
  res.json(m);
});

app.delete('/api/messages/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const m = queryOne('SELECT * FROM messages WHERE id = ?', [id]);
  if (!m) return res.status(404).json({ error: 'not found' });
  if (m.user_id !== user.id) return res.status(403).json({ error: '无权' });
  exec('DELETE FROM messages WHERE id = ?', [id]);
  save();
  res.json({ ok: true });
});

app.get('/api/messages', (req, res) => {
  const user = getCurrentUser(req);
  res.json(queryRows(
    'SELECT m.*, u.nickname AS sender_name FROM messages_priv m JOIN users u ON u.id = m.from_id ' +
    'WHERE m.from_id = ? OR m.to_id = ? ORDER BY m.created_at DESC',
    [user.id, user.id]
  ));
});

app.post('/api/messages', (req, res) => {
  const user = getCurrentUser(req);
  const { to_id, content } = req.body || {};
  const to = parseInt(to_id, 10);
  if (!to || !content) return res.status(400).json({ error: '参数不全' });
  const mid = runInsert('INSERT INTO messages_priv (from_id, to_id, content) VALUES (?, ?, ?)',
    [user.id, to, content]);
  save();
  res.json({ id: mid });
});

function isPortFree(p) {
  return new Promise(res => {
    const srv = net.createServer();
    srv.once('error', () => res(false));
    srv.once('listening', () => { srv.close(); res(true); });
    srv.listen(p, '127.0.0.1');
  });
}

async function start() {
  await initDB();
  exec('CREATE TABLE IF NOT EXISTS messages_priv (' +
       'id INTEGER PRIMARY KEY AUTOINCREMENT, from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, ' +
       'content TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (strftime(\'%s\',\'now\')))');
  seedDefaultUsers();
  save();

  let port = PORT;
  while (!(await isPortFree(port))) {
    console.log('[port]', port, '已占用, 尝试', port + 1);
    port++;
  }
  app.listen(port, '127.0.0.1', () => {
    console.log('======================================');
    console.log('  社区闲置交易平台已启动');
    console.log('  前台访问地址: http://localhost:' + port + '/');
    console.log('  API 基路径  : http://localhost:' + port + '/api');
    console.log('======================================');
  });
}

start();
