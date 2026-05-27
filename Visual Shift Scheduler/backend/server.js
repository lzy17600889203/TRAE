const fastify = require('fastify')({ logger: true });

fastify.addHook('onRequest', (request, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (request.method === 'OPTIONS') {
    reply.status(204).send();
    return;
  }
  done();
});

fastify.register(require('./routes/employees'));
fastify.register(require('./routes/shifts'));
fastify.register(require('./routes/schedules'));
fastify.register(require('./routes/scenes'));
fastify.register(require('./routes/rules'));

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
