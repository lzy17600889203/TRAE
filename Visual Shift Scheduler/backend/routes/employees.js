const db = require('../database/db');

module.exports = async function (fastify, opts) {
  fastify.get('/employees', async (request, reply) => {
    return db.prepare('SELECT * FROM employees ORDER BY name').all();
  });

  fastify.post('/employees', async (request, reply) => {
    const { name, avatar, department, maxConsecutiveDays, maxDailyHours } = request.body;
    
    const info = db.prepare(
      'INSERT INTO employees (name, avatar, department, maxConsecutiveDays, maxDailyHours) VALUES (?, ?, ?, ?, ?)'
    ).run(name, avatar || '', department, maxConsecutiveDays || 5, maxDailyHours || 8);
    
    return db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
  });

  fastify.put('/employees/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, avatar, department, maxConsecutiveDays, maxDailyHours } = request.body;
    
    db.prepare(
      'UPDATE employees SET name = ?, avatar = ?, department = ?, maxConsecutiveDays = ?, maxDailyHours = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, avatar || '', department, maxConsecutiveDays, maxDailyHours, id);
    
    return db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  });

  fastify.delete('/employees/:id', async (request, reply) => {
    const { id } = request.params;
    
    const count = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE employeeId = ?').get(id).count;
    if (count > 0) {
      reply.code(400);
      return { error: '该员工存在排班记录，无法删除' };
    }
    
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    reply.code(204);
    return;
  });
};
