import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  listProofs, getProof, createProof, updateProof, deleteProof, saveStepsApi,
  listAxioms, upsertAxiom, deleteAxiom, getAxiom,
  listLemmas, upsertLemma, deleteLemma
} from './db.js';
import { BUILTIN_AXIOMS, BUILTIN_RULES, validateStep, analyzeProof, parseAxiom } from './inference.js';
import { PRESET_SCENES } from './scenes.js';
import { parse, format } from './parser.js';

// Seed builtin axioms on first run
for (const ax of BUILTIN_AXIOMS) {
  if (!getAxiom(ax.id)) {
    upsertAxiom({ id: ax.id, name: ax.name, formula: ax.formula, description: 'Built-in axiom', builtin: 1 });
  }
}

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });

// --- Proofs ---
fastify.get('/api/proofs', async () => listProofs());

fastify.get('/api/proofs/:id', async (req, res) => {
  const p = getProof(Number(req.params.id));
  if (!p) return res.code(404).send({ error: 'Not found' });
  return p;
});

fastify.post('/api/proofs', async (req) => {
  const { name, goal, description } = req.body || {};
  if (!name) throw { statusCode: 400, message: 'name required' };
  return createProof({ name, goal: goal || '', description: description || '' });
});

fastify.put('/api/proofs/:id', async (req) => {
  const { name, goal, description } = req.body || {};
  return updateProof(Number(req.params.id), { name, goal, description });
});

fastify.delete('/api/proofs/:id', async (req) => {
  deleteProof(Number(req.params.id));
  return { ok: true };
});

fastify.put('/api/proofs/:id/steps', async (req) => {
  const id = Number(req.params.id);
  const { steps } = req.body || {};
  if (!Array.isArray(steps)) throw { statusCode: 400, message: 'steps array required' };
  saveStepsApi(id, steps);
  return getProof(id);
});

// --- Validate a single step ---
fastify.post('/api/validate-step', async (req) => {
  const { step, proof, checkProof } = req.body || {};
  const axiomLibrary = listAxioms();
  const lemmaLibrary = listLemmas();
  const result = validateStep(step, proof || { steps: [] }, axiomLibrary, lemmaLibrary, BUILTIN_AXIOMS, BUILTIN_RULES);
  const analysis = checkProof && proof ? analyzeProof(proof) : null;
  return { step: result, analysis };
});

// --- Validate full proof ---
fastify.post('/api/validate-proof', async (req) => {
  const { proof } = req.body || {};
  if (!proof || !Array.isArray(proof.steps)) throw { statusCode: 400, message: 'proof required' };
  const axiomLibrary = listAxioms();
  const lemmaLibrary = listLemmas();
  const stepResults = proof.steps.map(s => validateStep(s, proof, axiomLibrary, lemmaLibrary, BUILTIN_AXIOMS, BUILTIN_RULES));
  const analysis = analyzeProof(proof);
  return { steps: stepResults, analysis };
});

// --- Parser test endpoint ---
fastify.post('/api/parse', async (req) => {
  const { formula } = req.body || {};
  try {
    const ast = parse(formula || '');
    return { ok: true, ast, formatted: format(ast) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// --- Axioms ---
fastify.get('/api/axioms', async () => listAxioms());
fastify.post('/api/axioms', async (req) => {
  const { id, name, formula, description } = req.body || {};
  if (!id || !name || !formula) throw { statusCode: 400, message: 'id, name, formula required' };
  // validate parse
  try { parse(formula); } catch (e) { throw { statusCode: 400, message: 'Formula parse error: ' + e.message }; }
  return upsertAxiom({ id, name, formula, description: description || '', builtin: 0 });
});
fastify.delete('/api/axioms/:id', async (req) => {
  deleteAxiom(req.params.id);
  return { ok: true };
});

// --- Lemmas ---
fastify.get('/api/lemmas', async () => listLemmas());
fastify.post('/api/lemmas', async (req) => {
  const { id, name, formula, proof_id, description } = req.body || {};
  if (!id || !name || !formula) throw { statusCode: 400, message: 'id, name, formula required' };
  try { parse(formula); } catch (e) { throw { statusCode: 400, message: 'Formula parse error: ' + e.message }; }
  return upsertLemma({ id, name, formula, proof_id: proof_id || null, description: description || '' });
});
fastify.delete('/api/lemmas/:id', async (req) => {
  deleteLemma(req.params.id);
  return { ok: true };
});

// --- Rules list ---
fastify.get('/api/rules', async () => BUILTIN_RULES);

// --- Preset scenes ---
fastify.get('/api/scenes', async () => PRESET_SCENES.map(s => ({ id: s.id, name: s.name, nameEn: s.nameEn, description: s.description, goal: s.goal })));

fastify.get('/api/scenes/:id', async (req, res) => {
  const s = PRESET_SCENES.find(x => x.id === req.params.id);
  if (!s) return res.code(404).send({ error: 'Not found' });
  return s;
});

// --- Load a scene into a new proof ---
fastify.post('/api/scenes/:id/load', async (req) => {
  const s = PRESET_SCENES.find(x => x.id === req.params.id);
  if (!s) throw { statusCode: 404, message: 'Scene not found' };
  const proof = createProof({ name: s.name, goal: s.goal, description: s.description });
  saveStepsApi(proof.id, s.steps);
  return getProof(proof.id);
});

const PORT = process.env.PORT || 4000;
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log('Proof assistant backend listening on http://localhost:' + PORT);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
