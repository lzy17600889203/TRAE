const fastify = require('fastify')({ logger: true });
const path = require('path');
const { v4: uuid } = require('uuid');

fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', 'frontend', 'dist'),
  prefix: '/',
  decorateReply: false
});

const DB = require('./db');
const { analyze } = require('./ruleEngine');
const { SCENES } = require('./presets');
const { scoreToMusicXML } = require('./musicxml');

// Health
fastify.get('/api/health', async () => ({ ok: true }));

// Presets
fastify.get('/api/presets', async () => ({
  presets: Object.values(SCENES).map((s) => ({ id: s.id, title: s.title }))
}));

fastify.get('/api/presets/:id', async (req) => {
  const s = SCENES[req.params.id];
  if (!s) throw { statusCode: 404, message: 'Preset not found' };
  return s;
});

// Analysis
fastify.post('/api/analyze', async (req) => {
  const score = req.body;
  const issues = analyze(score);
  return { issues };
});

// Save score with MusicXML + analysis rows
fastify.post('/api/scores', async (req) => {
  const score = req.body;
  const id = uuid();
  const musicxml = scoreToMusicXML(score);
  const title = score.title || 'Untitled';
  DB.run('INSERT INTO scores (id, title, musicxml) VALUES (?, ?, ?)', [id, title, musicxml]);

  const issues = analyze(score);
  (score.voices || []).forEach((v, vi) => {
    v.notes.forEach((n, ni) => {
      const midi = (n.octave + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[n.step] + (n.alter === '#' ? 1 : n.alter === 'b' ? -1 : 0);
      DB.run(
        'INSERT INTO analyses (score_id, measure_index, voice_index, step, octave, pitch, duration, analysis_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, 0, vi, n.step, n.octave, midi, n.duration, JSON.stringify({ noteIndex: ni })]
      );
    });
  });
  return { id, title, musicxml, issues };
});

// List & get scores
fastify.get('/api/scores', async () => ({
  scores: DB.all('SELECT id, title, created_at, updated_at FROM scores ORDER BY updated_at DESC')
}));

fastify.get('/api/scores/:id', async (req) => {
  const s = DB.get('SELECT * FROM scores WHERE id = ?', [req.params.id]);
  if (!s) throw { statusCode: 404, message: 'Score not found' };
  const analyses = DB.all('SELECT * FROM analyses WHERE score_id = ?', [req.params.id]);
  return { ...s, analyses };
});

// SPA fallback
fastify.setNotFoundHandler((req, reply) => {
  if (!req.raw.url.startsWith('/api/')) {
    return reply.sendFile('index.html');
  }
  reply.code(404).send({ error: 'Not Found' });
});

const start = async () => {
  try {
    await DB.init();
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
