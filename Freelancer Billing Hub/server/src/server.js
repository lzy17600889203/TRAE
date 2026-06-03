import Fastify from 'fastify';
import cors from '@fastify/cors';
import db from './db.js';
import seedScenarios from './seed.js';

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });

// ---------- helpers ----------
const clampHours = (h) => {
  if (typeof h !== 'number' || Number.isNaN(h)) return 0;
  return Math.max(0, Math.min(24, Number(h)));
};
const sanitizeRate = (r) => {
  if (typeof r !== 'number' || Number.isNaN(r)) return 0;
  return Math.max(0, Number(r));
};

// ---------- clients ----------
fastify.get('/api/clients', () => db.prepare('SELECT * FROM clients ORDER BY id').all());

fastify.post('/api/clients', (req) => {
  const { name, contact = '' } = req.body || {};
  if (!name || !String(name).trim()) throw new Error('客户名称不能为空');
  const info = db.prepare('INSERT INTO clients (name, contact) VALUES (?, ?)').run(String(name).trim(), String(contact));
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
});

fastify.delete('/api/clients/:id', (req) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(Number(req.params.id));
  return { ok: true };
});

// ---------- projects ----------
fastify.get('/api/projects', (req) => {
  const clientId = req.query.client_id;
  const sql = clientId
    ? 'SELECT * FROM projects WHERE client_id = ? ORDER BY id'
    : 'SELECT * FROM projects ORDER BY id';
  return clientId ? db.prepare(sql).all(Number(clientId)) : db.prepare(sql).all();
});

fastify.get('/api/projects/detail', () => {
  const rows = db.prepare(`
    SELECT p.*, c.name AS client_name
    FROM projects p LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.id
  `).all();
  return rows;
});

fastify.post('/api/projects', (req) => {
  const { client_id, name, rate = 0, billing_mode = 'hourly' } = req.body || {};
  if (!client_id) throw new Error('必须选择客户');
  if (!name || !String(name).trim()) throw new Error('项目名称不能为空');
  const safeRate = sanitizeRate(Number(rate));
  const info = db.prepare('INSERT INTO projects (client_id, name, rate, billing_mode) VALUES (?, ?, ?, ?)').run(
    Number(client_id), String(name).trim(), safeRate, billing_mode === 'flat' ? 'flat' : 'hourly'
  );
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
});

// ---------- time entries ----------
fastify.get('/api/time-entries', (req) => {
  const projectId = req.query.project_id;
  const sql = projectId
    ? `SELECT te.*, p.name AS project_name, c.name AS client_name
       FROM time_entries te
       LEFT JOIN projects p ON p.id = te.project_id
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE te.project_id = ?
       ORDER BY te.work_date DESC, te.id DESC`
    : `SELECT te.*, p.name AS project_name, c.name AS client_name
       FROM time_entries te
       LEFT JOIN projects p ON p.id = te.project_id
       LEFT JOIN clients c ON c.id = p.client_id
       ORDER BY te.work_date DESC, te.id DESC
       LIMIT 500`;
  return projectId ? db.prepare(sql).all(Number(projectId)) : db.prepare(sql).all();
});

fastify.post('/api/time-entries', (req) => {
  const { project_id, work_date, hours, description = '' } = req.body || {};
  if (!project_id) throw new Error('必须选择项目');
  if (!work_date) throw new Error('必须填写日期');
  const h = Number(hours);
  const safeHours = clampHours(h);
  const warning = (h < 0 || h > 24) ? `原始输入 ${h} 小时已修正为 ${safeHours} 小时` : '';
  const info = db.prepare('INSERT INTO time_entries (project_id, work_date, hours, description) VALUES (?, ?, ?, ?)')
    .run(Number(project_id), String(work_date), safeHours, String(description));
  return { entry: db.prepare('SELECT * FROM time_entries WHERE id = ?').get(info.lastInsertRowid), warning };
});

fastify.delete('/api/time-entries/:id', (req) => {
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(Number(req.params.id));
  return { ok: true };
});

// ---------- invoices ----------
fastify.get('/api/invoices', (req) => {
  const status = req.query.status;
  const sql = status
    ? `SELECT i.*, p.name AS project_name, p.rate AS project_rate, p.billing_mode AS project_billing_mode,
              c.name AS client_name
       FROM invoices i
       LEFT JOIN projects p ON p.id = i.project_id
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE i.status = ?
       ORDER BY i.year DESC, i.month DESC, i.id DESC`
    : `SELECT i.*, p.name AS project_name, p.rate AS project_rate, p.billing_mode AS project_billing_mode,
              c.name AS client_name
       FROM invoices i
       LEFT JOIN projects p ON p.id = i.project_id
       LEFT JOIN clients c ON c.id = p.client_id
       ORDER BY i.year DESC, i.month DESC, i.id DESC`;
  return status ? db.prepare(sql).all(String(status)) : db.prepare(sql).all();
});

fastify.post('/api/invoices/generate', (req) => {
  const { project_id, year, month } = req.body || {};
  if (!project_id || !year || !month) throw new Error('参数缺失');
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(project_id));
  if (!project) throw new Error('项目不存在');
  const y = Number(year), m = Number(month);
  const dateStart = `${y}-${String(m).padStart(2, '0')}-01`;
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  const dateEnd = `${nextY}-${String(nextM).padStart(2, '0')}-01`;

  const rows = db.prepare(`
    SELECT * FROM time_entries
    WHERE project_id = ? AND work_date >= ? AND work_date < ?
  `).all(Number(project_id), dateStart, dateEnd);

  const totalHours = rows.reduce((s, r) => s + Number(r.hours || 0), 0);
  const totalAmount = project.billing_mode === 'flat'
    ? sanitizeRate(Number(project.rate))
    : totalHours * sanitizeRate(Number(project.rate));

  const existing = db.prepare(`
    SELECT * FROM invoices WHERE project_id = ? AND year = ? AND month = ?
  `).get(Number(project_id), y, m);

  let invoice;
  if (existing) {
    db.prepare(`
      UPDATE invoices SET total_hours = ?, total_amount = ? WHERE id = ?
    `).run(totalHours, totalAmount, existing.id);
    invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(existing.id);
  } else {
    const info = db.prepare(`
      INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status)
      VALUES (?, ?, ?, ?, ?, 'unpaid')
    `).run(Number(project_id), y, m, totalHours, totalAmount);
    invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(info.lastInsertRowid);
  }

  return { invoice, entries: rows };
});

fastify.patch('/api/invoices/:id', (req) => {
  const { status, note, paid_at } = req.body || {};
  const id = Number(req.params.id);
  if (status) {
    db.prepare('UPDATE invoices SET status = ?, note = COALESCE(?, note), paid_at = ? WHERE id = ?')
      .run(String(status), note || null, paid_at || (status === 'paid' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : ''), id);
  } else if (note !== undefined) {
    db.prepare('UPDATE invoices SET note = ? WHERE id = ?').run(String(note), id);
  }
  return db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
});

fastify.delete('/api/invoices/:id', (req) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(Number(req.params.id));
  return { ok: true };
});

// ---------- summary ----------
fastify.get('/api/summary', () => {
  const totalHours = db.prepare('SELECT COALESCE(SUM(total_hours),0) AS t FROM invoices').get().t;
  const totalAmount = db.prepare('SELECT COALESCE(SUM(total_amount),0) AS t FROM invoices').get().t;
  const unpaid = db.prepare("SELECT COALESCE(SUM(total_amount),0) AS t FROM invoices WHERE status = 'unpaid'").get().t;
  const invoiceCount = db.prepare('SELECT COUNT(*) AS c FROM invoices').get().c;
  return { totalHours, totalAmount, unpaid, invoiceCount };
});

// ---------- scenarios ----------
fastify.get('/api/scenarios', () => db.prepare('SELECT * FROM scenarios ORDER BY id').all());

fastify.post('/api/scenarios/load', (req) => {
  const { key } = req.body || {};
  if (!key) throw new Error('缺少 scenario key');
  seedScenarios(key);
  return { ok: true, key };
});

fastify.post('/api/reset', () => {
  db.prepare('DELETE FROM time_entries').run();
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM projects').run();
  db.prepare('DELETE FROM clients').run();
  db.prepare('DELETE FROM scenarios').run();
  seedScenarios(null);
  return { ok: true };
});

// ---------- start ----------
seedScenarios(null);

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('🚀 后端运行在 http://localhost:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
