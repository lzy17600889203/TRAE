import type { FastifyInstance } from 'fastify';
import { CDCLSolver } from '../solvers/cdcl.js';
import { parseDIMACS, parseCNF } from '../solvers/parser.js';
import { getPresetFormula, getAllPresets } from '../solvers/presets.js';
import { saveFormula, saveClause, saveLearnedClause, saveDecisionLog, getFormulaById, getClausesByFormulaId, getDecisionLogs, clearFormulaData, ensureDb } from '../db/index.js';
import type { AnimationEvent, Formula } from '../types/index.js';

let currentSolver: CDCLSolver | null = null;
let currentFormulaId: number = 0;
let animationEvents: AnimationEvent[] = [];

export async function solverRoutes(fastify: FastifyInstance) {
  fastify.get('/api/presets', async (request, reply) => {
    return getAllPresets();
  });

  fastify.get('/api/presets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const formula = getPresetFormula(id as any);
      return formula;
    } catch {
      reply.code(404).send({ error: 'Preset not found' });
    }
  });

  fastify.post('/api/formula/parse', async (request, reply) => {
    const { formula, format } = request.body as { formula: string; format: 'cnf' | 'dimacs' };
    
    try {
      const parsed: Formula = format === 'dimacs' 
        ? parseDIMACS(formula)
        : parseCNF(formula);
      
      await ensureDb();
      const formulaId = saveFormula(parsed);
      
      for (const clause of parsed.clauses) {
        saveClause(clause, formulaId);
      }

      return { ...parsed, id: formulaId };
    } catch (error) {
      reply.code(400).send({ error: 'Failed to parse formula' });
    }
  });

  fastify.get('/api/formula/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await ensureDb();
    const formula = getFormulaById(parseInt(id));
    
    if (!formula) {
      reply.code(404).send({ error: 'Formula not found' });
      return;
    }

    const clauses = getClausesByFormulaId(parseInt(id));
    
    return { ...formula, clauses };
  });

  fastify.post('/api/solver/init', async (request, reply) => {
    const { formulaId, variableCount, clauses } = request.body as {
      formulaId: number;
      variableCount: number;
      clauses: any[];
    };

    await ensureDb();
    currentSolver = new CDCLSolver();
    currentFormulaId = formulaId;
    animationEvents = [];

    currentSolver.init(formulaId, variableCount, clauses);

    currentSolver.setOnEvent((event) => {
      animationEvents.push(event);
      if (event.type === 'decision' || event.type === 'propagation' || event.type === 'conflict') {
        saveDecisionLog({
          step: animationEvents.length,
          type: event.type,
          variable: event.data.variable,
          value: event.data.value,
          level: event.data.level || 0,
          clauseId: event.data.clauseId
        }, formulaId);
      }
    });

    return { status: 'initialized', formulaId };
  });

  fastify.post('/api/solver/run', async (request, reply) => {
    if (!currentSolver) {
      reply.code(400).send({ error: 'Solver not initialized' });
      return;
    }

    const { maxSteps, stepDelay } = request.body as {
      maxSteps?: number;
      stepDelay?: number;
    };

    const result = await currentSolver.solve(maxSteps || 10000, stepDelay || 0);

    await ensureDb();
    for (const learnedClause of currentSolver.getState().learnedClauses) {
      saveLearnedClause(learnedClause, currentFormulaId);
    }

    return {
      ...result,
      animationEvents: animationEvents
    };
  });

  fastify.post('/api/solver/pause', async (request, reply) => {
    if (currentSolver) {
      currentSolver.pause();
    }
    return { status: 'paused' };
  });

  fastify.post('/api/solver/resume', async (request, reply) => {
    if (currentSolver) {
      currentSolver.resume();
    }
    return { status: 'resumed' };
  });

  fastify.post('/api/solver/stop', async (request, reply) => {
    if (currentSolver) {
      currentSolver.stop();
    }
    return { status: 'stopped' };
  });

  fastify.get('/api/solver/state', async (request, reply) => {
    if (!currentSolver) {
      reply.code(400).send({ error: 'Solver not initialized' });
      return;
    }

    return {
      ...currentSolver.getState(),
      variables: Object.fromEntries(currentSolver.getVariables()),
      stats: currentSolver.getStats()
    };
  });

  fastify.get('/api/solver/events', async (request, reply) => {
    return { events: animationEvents };
  });

  fastify.get('/api/solver/stats', async (request, reply) => {
    if (!currentSolver) {
      reply.code(400).send({ error: 'Solver not initialized' });
      return;
    }

    return currentSolver.getStats();
  });

  fastify.delete('/api/db/logs/:formulaId', async (request, reply) => {
    const { formulaId } = request.params as { formulaId: string };
    await ensureDb();
    clearFormulaData(parseInt(formulaId));
    return { status: 'cleared' };
  });

  fastify.get('/api/db/logs/:formulaId', async (request, reply) => {
    const { formulaId } = request.params as { formulaId: string };
    await ensureDb();
    const logs = getDecisionLogs(parseInt(formulaId));
    return { logs };
  });
}
