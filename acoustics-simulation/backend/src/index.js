const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { dbWrapper, initDatabase } = require('./database');
const AcousticsEngine = require('./acoustics-engine');
const presets = require('./presets');

const engine = new AcousticsEngine();

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

fastify.get('/api/health', async () => {
  return { status: 'ok' };
});

fastify.get('/api/presets', async () => {
  return Object.entries(presets).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description
  }));
});

fastify.get('/api/presets/:id', async (request, reply) => {
  const preset = presets[request.params.id];
  if (!preset) {
    reply.code(404);
    return { error: 'Preset not found' };
  }
  return preset;
});

fastify.get('/api/scenarios', async () => {
  const stmt = dbWrapper.prepare('SELECT * FROM scenarios ORDER BY created_at DESC');
  return stmt.all();
});

fastify.post('/api/scenarios', async (request) => {
  const { name } = request.body;
  const stmt = dbWrapper.prepare('INSERT INTO scenarios (name) VALUES (?)');
  const result = stmt.run(name || 'Unnamed Scenario');
  return { id: result.lastInsertRowid };
});

fastify.get('/api/scenarios/:id', async (request, reply) => {
  const scenario = dbWrapper.prepare('SELECT * FROM scenarios WHERE id = ?').get(request.params.id);
  if (!scenario) {
    reply.code(404);
    return { error: 'Scenario not found' };
  }
  
  const walls = dbWrapper.prepare('SELECT * FROM walls WHERE scenario_id = ?').all(request.params.id);
  const sources = dbWrapper.prepare('SELECT * FROM sources WHERE scenario_id = ?').all(request.params.id);
  
  return { ...scenario, walls, sources };
});

fastify.post('/api/walls', async (request) => {
  const { scenario_id, vertices, impedance, reflection, absorption, is_absorber } = request.body;
  const stmt = dbWrapper.prepare(`
    INSERT INTO walls (scenario_id, vertices, impedance, reflection, absorption, is_absorber)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    scenario_id,
    JSON.stringify(vertices),
    impedance || 1.0,
    reflection || 0.99,
    absorption || 0.01,
    is_absorber ? 1 : 0
  );
  return { id: result.lastInsertRowid };
});

fastify.delete('/api/walls/:id', async (request) => {
  const stmt = dbWrapper.prepare('DELETE FROM walls WHERE id = ?');
  stmt.run(request.params.id);
  return { success: true };
});

fastify.post('/api/sources', async (request) => {
  const { scenario_id, position_x, position_y, position_z, frequency, amplitude } = request.body;
  const stmt = dbWrapper.prepare(`
    INSERT INTO sources (scenario_id, position_x, position_y, position_z, frequency, amplitude)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    scenario_id,
    position_x || 0,
    position_y || 0,
    position_z || 0,
    frequency || 440,
    amplitude || 1.0
  );
  return { id: result.lastInsertRowid };
});

fastify.delete('/api/sources/:id', async (request) => {
  const stmt = dbWrapper.prepare('DELETE FROM sources WHERE id = ?');
  stmt.run(request.params.id);
  return { success: true };
});

fastify.post('/api/solve', async (request) => {
  const { frequency, walls, sources, absorption_coefficient, domain } = request.body;
  
  if (domain) {
    engine.setDomain(domain.x, domain.y, domain.z);
  }
  
  const pressureField = engine.solveHelmholtz(
    frequency || 440,
    walls,
    sources,
    absorption_coefficient || 0.05
  );
  
  const aliasingInfo = engine.checkAliasing(frequency || 440);
  const energyCheck = engine.checkEnergyConservation(walls);
  const modeCheck = engine.checkHighOrderModes(domain);
  
  return {
    pressureField,
    aliasingInfo,
    energyCheck,
    modeCheck
  };
});

fastify.post('/api/resonances', async (request) => {
  const { walls, sources, absorption_coefficient, domain } = request.body;
  
  if (domain) {
    engine.setDomain(domain.x, domain.y, domain.z);
  }
  
  const resonances = engine.findResonances(walls, sources, absorption_coefficient || 0.05);
  const eigenfreqs = engine.calculateEigenfrequencies();
  
  return { resonances, eigenfrequencies: eigenfreqs };
});

fastify.post('/api/frequency-response', async (request) => {
  const { walls, sources, absorption_coefficient, freq_range, steps, domain } = request.body;
  
  if (domain) {
    engine.setDomain(domain.x, domain.y, domain.z);
  }
  
  const response = engine.calculateFrequencyResponse(
    walls,
    sources,
    absorption_coefficient || 0.05,
    freq_range || [20, 2000],
    steps || 50
  );
  
  return { frequencyResponse: response };
});

fastify.post('/api/standing-waves', async (request) => {
  const { frequency, domain } = request.body;
  
  if (domain) {
    engine.setDomain(domain.x, domain.y, domain.z);
  }
  
  const nodes = engine.calculateStandingWaveNodes(frequency || 440);
  return { nodes };
});

fastify.get('/api/materials', async () => {
  const stmt = dbWrapper.prepare('SELECT * FROM materials');
  return stmt.all();
});

fastify.post('/api/materials', async (request) => {
  const { name, impedance, absorption, porosity } = request.body;
  const stmt = dbWrapper.prepare(`
    INSERT INTO materials (name, impedance, absorption, porosity)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    name,
    impedance || 1.0,
    absorption || 0.01,
    porosity || 0.3
  );
  return { id: result.lastInsertRowid };
});

fastify.get('/api/frequency-responses', async (request) => {
  const { scenario_id } = request.query;
  let stmt;
  if (scenario_id) {
    stmt = dbWrapper.prepare('SELECT * FROM frequency_responses WHERE scenario_id = ? ORDER BY created_at DESC');
    return stmt.all(scenario_id);
  }
  stmt = dbWrapper.prepare('SELECT * FROM frequency_responses ORDER BY created_at DESC');
  return stmt.all();
});

fastify.post('/api/frequency-responses', async (request) => {
  const { scenario_id, data } = request.body;
  const stmt = dbWrapper.prepare(`
    INSERT INTO frequency_responses (scenario_id, data)
    VALUES (?, ?)
  `);
  const result = stmt.run(scenario_id, JSON.stringify(data));
  return { id: result.lastInsertRowid };
});

fastify.post('/api/analyze-anomalies', async (request) => {
  const { walls, sources, frequency, domain } = request.body;
  
  if (domain) {
    engine.setDomain(domain.x, domain.y, domain.z);
  }
  
  const anomalies = [];
  const aliasingInfo = engine.checkAliasing(frequency || 440);
  
  for (const alias of aliasingInfo) {
    if (alias.isAliased) {
      anomalies.push({
        type: 'aliasing',
        severity: alias.severity,
        message: `网格欠采样混叠 - kh=${alias.kh.toFixed(2)}`,
        gridIndex: alias.gridIndex,
        kh: alias.kh
      });
    }
  }
  
  if (sources) {
    for (const src of sources) {
      const distToWall = engine.distanceToNearestWall(src, walls);
      if (distToWall < 0.1) {
        anomalies.push({
          type: 'source_wall_proximity',
          severity: '严重',
          message: `声源贴墙 (距离=${distToWall.toFixed(3)}m)，可能导致阻抗发散`
        });
      }
    }
  }
  
  const energyCheck = engine.checkEnergyConservation(walls);
  for (const anom of energyCheck.anomalies) {
    anomalies.push({
      type: 'energy',
      severity: '高',
      message: anom
    });
  }
  
  const modeCheck = engine.checkHighOrderModes(domain);
  for (const anom of modeCheck) {
    anomalies.push({
      type: 'mode',
      severity: '中',
      message: anom
    });
  }
  
  return { anomalies };
});

const start = async () => {
  try {
    await initDatabase();
    
    const defaultMaterials = dbWrapper.prepare('SELECT COUNT(*) as count FROM materials').get();
    if (!defaultMaterials || defaultMaterials.count === 0) {
      const materials = [
        { name: '混凝土', impedance: 1.2, absorption: 0.03, porosity: 0.05 },
        { name: '玻璃纤维板', impedance: 0.3, absorption: 0.7, porosity: 0.8 },
        { name: '泡沫塑料', impedance: 0.1, absorption: 0.9, porosity: 0.95 },
        { name: '木板', impedance: 1.5, absorption: 0.1, porosity: 0.2 }
      ];
      const insertStmt = dbWrapper.prepare(`
        INSERT INTO materials (name, impedance, absorption, porosity)
        VALUES (?, ?, ?, ?)
      `);
      for (const mat of materials) {
        insertStmt.run(mat.name, mat.impedance, mat.absorption, mat.porosity);
      }
    }
    
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
