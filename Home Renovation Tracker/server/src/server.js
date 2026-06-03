'use strict';

const Fastify = require('fastify');
const cors = require('@fastify/cors');

const { initSchema } = require('./db');
const repo = require('./repository');
const { seedScenarios, clearAll } = require('./seed');

initSchema();
seedScenarios();

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: true });

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function normalizeExpensePayload(body) {
  return {
    item_name: body?.item_name || '未命名项目',
    category: body?.category || '其他',
    planned_amount: safeNumber(body?.planned_amount, 0),
    actual_amount: safeNumber(body?.actual_amount, 0),
    quantity: safeNumber(body?.quantity, 1),
    unit: body?.unit || '项',
    paid: body?.paid ? 1 : 0,
    refunded: body?.refunded ? 1 : 0,
    supplier: body?.supplier || '',
    notes: body?.notes || ''
  };
}

fastify.get('/api/health', async () => {
  return { ok: true, time: new Date().toISOString() };
});

fastify.get('/api/scenarios', async () => {
  return repo.getAllScenarios();
});

fastify.get('/api/scenarios/:key', async (request) => {
  const data = repo.getScenarioWithDetails(request.params.key);
  if (!data) {
    return { error: 'not_found', message: '未找到该装修项目' };
  }
  return data;
});

fastify.post('/api/scenarios', async (request) => {
  const body = request.body || {};
  return repo.createEmptyScenario(body.name, body.description);
});

fastify.post('/api/seed', async () => {
  return seedScenarios();
});

fastify.post('/api/clear', async () => {
  return clearAll();
});

fastify.post('/api/scenarios/:key/stages', async (request) => {
  const body = request.body || {};
  const payload = {
    name: body.name || '新阶段',
    planned_amount: safeNumber(body.planned_amount, 0),
    status: body.status || 'active',
    notes: body.notes || ''
  };
  const res = repo.addStage(request.params.key, payload);
  if (!res) {
    return { error: 'not_found' };
  }
  return res;
});

fastify.put('/api/stages/:id', async (request) => {
  const body = request.body || {};
  const payload = {
    name: body.name,
    planned_amount: safeNumber(body.planned_amount, undefined),
    status: body.status,
    notes: body.notes
  };
  const res = repo.updateStage(request.params.id, payload);
  if (!res) return { error: 'not_found' };
  return res;
});

fastify.delete('/api/stages/:id', async (request) => {
  return repo.deleteStage(request.params.id);
});

fastify.post('/api/stages/:id/expenses', async (request) => {
  const payload = normalizeExpensePayload(request.body);
  const res = repo.addExpense(request.params.id, payload);
  if (!res) return { error: 'not_found' };
  return res;
});

fastify.put('/api/expenses/:id', async (request) => {
  const payload = normalizeExpensePayload(request.body);
  const res = repo.updateExpense(request.params.id, payload);
  if (!res) return { error: 'not_found' };
  return res;
});

fastify.delete('/api/expenses/:id', async (request) => {
  return repo.deleteExpense(request.params.id);
});

const start = async () => {
  try {
    const port = process.env.PORT || 3100;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`装修记账本后端运行在 http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
