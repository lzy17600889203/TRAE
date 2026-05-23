import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  listLogs
} from './tasks.js';
import { applyScenario } from './scenarios.js';
import { bugFlags, setBug } from './bugs.js';
import { initDb, forceSave } from './db.js';

await initDb();

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });

fastify.get('/api/tasks', async () => {
  return { items: listTasks() };
});

fastify.get<{ Params: { id: string } }>('/api/tasks/:id', async (req, reply) => {
  const id = Number(req.params.id);
  const item = getTask(id);
  if (!item) return reply.status(404).send({ error: 'Not Found' });
  return item;
});

fastify.post<{ Body: any }>('/api/tasks', async (req) => {
  const body = req.body || {};
  const operator = body.operator ?? 'anonymous';
  return createTask(
    {
      title: body.title ?? 'Untitled',
      description: body.description ?? '',
      column: body.column ?? 'todo',
      priority: body.priority ?? 'medium',
      parent_id: body.parent_id ?? null,
      blocked_by: body.blocked_by ?? ''
    },
    operator
  );
});

fastify.patch<{ Params: { id: string }; Body: any }>('/api/tasks/:id', async (req, reply) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const operator = body.operator ?? 'anonymous';
  const result = updateTask(
    id,
    {
      title: body.title,
      description: body.description,
      priority: body.priority,
      blocked_by: body.blocked_by
    },
    operator
  );
  if (!result) return reply.status(404).send({ error: 'Not Found' });
  return result;
});

fastify.delete<{ Params: { id: string }; Body: any }>('/api/tasks/:id', async (req, reply) => {
  const id = Number(req.params.id);
  const body: any = req.body ?? {};
  const operator = body.operator ?? 'anonymous';
  const ok = deleteTask(id, operator);
  if (!ok) return reply.status(404).send({ error: 'Not Found' });
  return { ok: true };
});

fastify.post<{ Params: { id: string }; Body: any }>('/api/tasks/:id/move', async (req, reply) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const toColumn = body.to_column ?? 'todo';
  const toIndex = Number.isFinite(body.to_index) ? Number(body.to_index) : 0;
  const operator = body.operator ?? 'anonymous';
  const result = moveTask(id, toColumn, toIndex, operator);
  if (!result) return reply.status(404).send({ error: 'Not Found' });
  return result;
});

fastify.post<{ Body: any }>('/api/scenarios', async (req) => {
  const body: any = req.body ?? {};
  const name = body.name;
  if (!name) return { ok: false, message: 'name is required' };
  return applyScenario(name);
});

fastify.get<{ Querystring: { task_id?: string; limit?: string } }>(
  '/api/logs',
  async (req) => {
    const taskId = req.query.task_id ? Number(req.query.task_id) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    return { items: listLogs(taskId, limit) };
  }
);

fastify.get('/api/bugs', async () => {
  return bugFlags;
});

fastify.post<{ Body: any }>('/api/bugs/:name', async (req) => {
  const name = (req.params as any).name;
  const body: any = req.body ?? {};
  const value = body.value !== false;
  return setBug(name, value);
});

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

process.on('SIGINT', () => {
  forceSave();
  process.exit(0);
});
process.on('SIGTERM', () => {
  forceSave();
  process.exit(0);
});

try {
  await fastify.listen({ port, host });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
