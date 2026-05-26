import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDatabase, createSchema } from './db/database.js';
import { speciesRoutes, featureRoutes, scenarioRoutes, phylogenyRoutes } from './routes/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function start(): Promise<void> {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await initDatabase();
  createSchema();

  const fastify = Fastify({
    logger: {
      level: 'info',
    },
  });

  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Phylogenetic Tree Explorer API',
      version: '1.0.0',
    };
  });

  await fastify.register(speciesRoutes, { prefix: '/api' });
  await fastify.register(featureRoutes, { prefix: '/api' });
  await fastify.register(scenarioRoutes, { prefix: '/api' });
  await fastify.register(phylogenyRoutes, { prefix: '/api' });

  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
