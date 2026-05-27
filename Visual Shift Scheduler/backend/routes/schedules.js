const db = require('../database/db');
const ruleChecker = require('../services/ruleChecker');

module.exports = async function (fastify, opts) {
  fastify.get('/schedules', async (request, reply) => {
    const { weekStart } = request.query;
    
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().split('T')[0];

    const schedules = db.prepare(
      'SELECT * FROM schedules WHERE date >= ? AND date < ?'
    ).all(weekStart, endDateStr);
    
    return schedules.map(schedule => {
      const violations = ruleChecker.checkAllRules(schedule);
      return { ...schedule, violations };
    });
  });

  fastify.post('/schedules', async (request, reply) => {
    const { employeeId, shiftId, date } = request.body;
    
    const info = db.prepare(
      'INSERT INTO schedules (employeeId, shiftId, date) VALUES (?, ?, ?)'
    ).run(employeeId, shiftId, date);
    
    const row = db.prepare('SELECT * FROM schedules WHERE id = ?').get(info.lastInsertRowid);
    const violations = row ? ruleChecker.checkAllRules(row) : [];
    
    return { ...row, violations };
  });

  fastify.put('/schedules/:id', async (request, reply) => {
    const { id } = request.params;
    const { employeeId, shiftId, date } = request.body;
    
    db.prepare(
      'UPDATE schedules SET employeeId = ?, shiftId = ?, date = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(employeeId, shiftId, date, id);
    
    const row = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
    const violations = row ? ruleChecker.checkAllRules(row) : [];
    
    return { ...row, violations };
  });

  fastify.delete('/schedules/:id', async (request, reply) => {
    const { id } = request.params;
    
    db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    reply.code(204);
    return;
  });
};
