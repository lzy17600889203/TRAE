const ruleChecker = require('../services/ruleChecker');

module.exports = async function (fastify, opts) {
  fastify.post('/rules/check', async (request, reply) => {
    const { employeeId, shiftId, date } = request.body;
    
    const schedule = { employeeId, shiftId, date, id: 0 };
    const violations = await ruleChecker.checkAllRules(schedule);
    
    return {
      isValid: violations.length === 0,
      violations
    };
  });
};