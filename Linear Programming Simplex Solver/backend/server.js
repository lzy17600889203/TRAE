import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  saveModel,
  listModels,
  getModel,
  clearIterations,
  saveIteration,
  getIterations
} from './db.js';
import {
  buildStandardForm,
  solveSimplex,
  detectInfeasible,
  analyzeFeasibility
} from './simplex.js';
import { PRESETS } from './presets.js';

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });

fastify.get('/api/presets', async () => {
  return Object.entries(PRESETS).map(([key, p]) => ({ key, ...p }));
});

fastify.post('/api/models', async (req, res) => {
  const body = req.body;
  if (!body || !body.objective || !body.constraints) {
    return res.status(400).send({ error: 'missing fields' });
  }
  const id = saveModel(body);
  return { id };
});

fastify.get('/api/models', async () => listModels());

fastify.get('/api/models/:id', async (req, res) => {
  const m = getModel(Number(req.params.id));
  if (!m) return res.status(404).send({ error: 'not found' });
  return m;
});

fastify.post('/api/solve', async (req, res) => {
  const model = req.body;
  if (!model || !model.objective || !model.constraints) {
    return res.status(400).send({ error: 'invalid model' });
  }

  const feasibility = analyzeFeasibility(model);

  try {
    const std = buildStandardForm(model);
    const infeasible = detectInfeasible(std);

    if (infeasible || (feasibility.feasible === false)) {
      return {
        status: 'infeasible',
        message: '可行域为空，问题无解',
        std: summaryStd(std),
        feasibility
      };
    }

    const result = solveSimplex(std);

    let modelId = null;
    try {
      modelId = saveModel(model);
      clearIterations(modelId);
      for (const iter of result.history) {
        saveIteration({
          model_id: modelId,
          ...iter
        });
      }
    } catch (e) {
      fastify.log.warn({ err: e.message }, 'persist failed, continuing');
    }

    return {
      status: result.status,
      history: result.history,
      final: result.final || null,
      modelId,
      std: summaryStd(std),
      feasibility
    };
  } catch (e) {
    fastify.log.error(e);
    return res.status(500).send({ error: e.message });
  }
});

fastify.get('/api/models/:id/iterations', async (req, res) => {
  const m = getModel(Number(req.params.id));
  if (!m) return res.status(404).send({ error: 'not found' });
  return getIterations(Number(req.params.id));
});

function summaryStd(std) {
  return {
    variables: std.variables,
    slackVars: std.slackVars,
    originalN: std.originalN,
    m: std.m,
    direction: std.direction,
    basis: std.basis,
    tableau: std.tableau.concat([std.objRow]),
    rowsMeta: std.rowsMeta
  };
}

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
