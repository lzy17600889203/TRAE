const db = require('../database/db');

module.exports = async function (fastify, opts) {
  fastify.get('/shifts', async (request, reply) => {
    return db.prepare('SELECT * FROM shifts ORDER BY id').all();
  });
};
