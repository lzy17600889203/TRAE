const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');

const DEFAULT_PORT = 3000;
const DATA_FILE = path.join(__dirname, 'focus-data.json');

// ---------- 简单持久化存储 (类 SQLite 语义) ----------
let sessions = [];
function loadSessions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const obj = JSON.parse(raw);
      if (Array.isArray(obj.sessions)) sessions = obj.sessions;
    }
  } catch (e) { sessions = []; }
}
function saveSessions() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ sessions: sessions }, null, 2));
  } catch (e) { /* ignore */ }
}
loadSessions();

// ---------- Express ----------
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/sessions', (req, res) => {
  const { start_time, end_time, duration_seconds, sources, score, status } = req.body;
  if (!start_time || !end_time || !sources || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const row = {
    id: (sessions[sessions.length - 1]?.id || 0) + 1,
    start_time, end_time,
    duration_seconds: duration_seconds || 0,
    sources, score: score || 0, status,
    created_at: new Date().toISOString()
  };
  sessions.push(row);
  saveSessions();
  res.json({ id: row.id, ok: true });
});

app.get('/api/sessions', (req, res) => {
  const limit = Math.min(50, sessions.length);
  res.json(sessions.slice(-limit).reverse());
});

app.get('/api/stats', (req, res) => {
  const total = sessions.length;
  const total_seconds = sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
  const avg_score = total ? Math.round(sessions.reduce((a, s) => a + (s.score || 0), 0) / total) : 0;
  const completed = sessions.filter(s => s.status === 'completed').length;
  res.json({ total_sessions: total, total_seconds, avg_score, completed_count: completed });
});

// ---------- 端口检测与启动 ----------
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    let port = startPort;
    function tryPort(p) {
      const server = net.createServer();
      server.unref();
      server.on('error', () => tryPort(p + 1));
      server.listen(p, '0.0.0.0', () => {
        const actual = server.address().port;
        server.close(() => resolve(actual));
      });
    }
    tryPort(port);
  });
}

(async () => {
  const port = await findAvailablePort(DEFAULT_PORT);
  const hosts = ['localhost'];
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(name => {
    ifaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) hosts.push(iface.address);
    });
  });
  app.listen(port, '0.0.0.0', () => {
    console.log('========================================');
    console.log('  Immersive White Noise Mixer - Started');
    console.log('  Default Port: ' + DEFAULT_PORT);
    console.log('  Using Port:   ' + port + (port !== DEFAULT_PORT ? '  (auto-switch, ' + DEFAULT_PORT + ' was busy)' : ''));
    console.log('----------------------------------------');
    console.log('  Frontend URLs:');
    hosts.forEach(h => console.log('    http://' + h + ':' + port + '/'));
    console.log('========================================');
  });
})();
