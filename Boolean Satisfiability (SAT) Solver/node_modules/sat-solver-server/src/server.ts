import Fastify from 'fastify';
import cors from '@fastify/cors';
import { solverRoutes } from './routes/solver.js';
import { ensureDb, db } from './db/index.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true
});

await fastify.register(solverRoutes);

const start = async () => {
  try {
    await ensureDb();
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('SAT Solver Server running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

start();
