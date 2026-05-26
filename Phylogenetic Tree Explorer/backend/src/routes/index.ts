import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { clearAllData, queryAll, run, dbGet, saveDatabase } from '../db/database.js';
import { presetScenarios, loadScenarioToDatabase } from '../presets/scenarios.js';
import { buildPhylogeny } from '../algorithms/phylogeny.js';

interface SpeciesInput {
  name: string;
  latinName?: string;
  taxonomy: Record<string, string>;
  parentId?: number | null;
}

interface FeatureInput {
  species_id: number;
  feature_name: string;
  feature_value: string | number;
  category?: string;
}

interface CharacteristicInput {
  species_id: number;
  feature_name: string;
  feature_value: number;
}

interface PhylogenyRequest {
  algorithm: 'upgma' | 'nj';
  options?: {
    hasMissingData?: boolean;
    longBranchMultiplier?: number;
    polyphyleticForce?: boolean;
    circularDependency?: boolean;
  };
}

export async function speciesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/species', async (request, reply) => {
    const rows = queryAll('SELECT * FROM species ORDER BY id');
    return { data: rows };
  });

  fastify.get('/species/:id', async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
    const row = dbGet('SELECT * FROM species WHERE id = ?', [request.params.id]);
    if (!row) {
      reply.status(404);
      return { error: '物种不存在' };
    }
    return { data: row };
  });

  fastify.post('/species', async (request: FastifyRequest<{ Body: SpeciesInput }>, reply) => {
    const body = request.body;

    const existing = dbGet('SELECT id FROM species WHERE name = ?', [body.name.trim()]);
    if (existing) {
      reply.status(400);
      return { error: '物种名称已存在，请使用不同的名称' };
    }

    const result = run(
      `INSERT INTO species (name, latin_name, kingdom, phylum, class, "order", family, genus, species, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.name.trim(),
        body.latinName || '',
        body.taxonomy?.kingdom || '',
        body.taxonomy?.phylum || '',
        body.taxonomy?.class || '',
        body.taxonomy?.order || '',
        body.taxonomy?.family || '',
        body.taxonomy?.genus || '',
        body.taxonomy?.species || '',
        body.parentId || null,
      ]
    );
    saveDatabase();
    return { data: { id: result.lastInsertRowid, ...body } };
  });

  fastify.put('/species/:id', async (request: FastifyRequest<{ Params: { id: number }; Body: SpeciesInput }>, reply) => {
    const body = request.body;

    const existing = dbGet('SELECT id FROM species WHERE name = ? AND id != ?', [
      body.name.trim(),
      request.params.id,
    ]);
    if (existing) {
      reply.status(400);
      return { error: '物种名称已存在，请使用不同的名称' };
    }

    const result = run(
      `UPDATE species SET name=?, latin_name=?, kingdom=?, phylum=?, class=?, "order"=?, family=?, genus=?, species=?, parent_id=?
       WHERE id=?`,
      [
        body.name.trim(),
        body.latinName || '',
        body.taxonomy?.kingdom || '',
        body.taxonomy?.phylum || '',
        body.taxonomy?.class || '',
        body.taxonomy?.order || '',
        body.taxonomy?.family || '',
        body.taxonomy?.genus || '',
        body.taxonomy?.species || '',
        body.parentId || null,
        request.params.id,
      ]
    );
    saveDatabase();
    if (result.changes === 0) {
      reply.status(404);
      return { error: '物种不存在' };
    }
    return { data: { id: request.params.id, ...body } };
  });

  fastify.delete('/species/:id', async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
    const result = run('DELETE FROM species WHERE id = ?', [request.params.id]);
    saveDatabase();
    if (result.changes === 0) {
      reply.status(404);
      return { error: '物种不存在' };
    }
    return { success: true };
  });

  fastify.get('/species/:id/features', async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
    const rows = queryAll('SELECT * FROM features WHERE species_id = ?', [request.params.id]);
    return { data: rows };
  });

  fastify.get('/species/:id/characteristics', async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
    const rows = queryAll('SELECT * FROM characteristic_matrix WHERE species_id = ?', [request.params.id]);
    return { data: rows };
  });
}

export async function featureRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/features', async (request, reply) => {
    const rows = queryAll('SELECT * FROM features ORDER BY species_id, id');
    return { data: rows };
  });

  fastify.post('/features', async (request: FastifyRequest<{ Body: FeatureInput }>, reply) => {
    const body = request.body;
    const result = run(
      'INSERT INTO features (species_id, feature_name, feature_value, category) VALUES (?, ?, ?, ?)',
      [body.species_id, body.feature_name, String(body.feature_value), body.category || '']
    );
    saveDatabase();
    return { data: { id: result.lastInsertRowid, ...body } };
  });

  fastify.post('/features/batch', async (request: FastifyRequest<{ Body: FeatureInput[] }>, reply) => {
    const features = request.body;
    for (const item of features) {
      run(
        'INSERT INTO features (species_id, feature_name, feature_value, category) VALUES (?, ?, ?, ?)',
        [item.species_id, item.feature_name, String(item.feature_value), item.category || '']
      );
    }
    saveDatabase();
    return { success: true, count: features.length };
  });

  fastify.get('/characteristics', async (request, reply) => {
    const rows = queryAll('SELECT * FROM characteristic_matrix ORDER BY species_id, id');
    return { data: rows };
  });

  fastify.post('/characteristics', async (request: FastifyRequest<{ Body: CharacteristicInput }>, reply) => {
    const body = request.body;
    const result = run(
      'INSERT INTO characteristic_matrix (species_id, feature_name, feature_value) VALUES (?, ?, ?)',
      [body.species_id, body.feature_name, body.feature_value]
    );
    saveDatabase();
    return { data: { id: result.lastInsertRowid, ...body } };
  });

  fastify.post('/characteristics/batch', async (request: FastifyRequest<{ Body: CharacteristicInput[] }>, reply) => {
    const items = request.body;
    for (const item of items) {
      run(
        'INSERT INTO characteristic_matrix (species_id, feature_name, feature_value) VALUES (?, ?, ?)',
        [item.species_id, item.feature_name, item.feature_value]
      );
    }
    saveDatabase();
    return { success: true, count: items.length };
  });
}

export async function scenarioRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/scenarios', async (request, reply) => {
    return { data: presetScenarios };
  });

  fastify.post('/scenarios/:id/load', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const result = loadScenarioToDatabase(request.params.id);
    return {
      data: {
        species: result.species,
        characteristics: result.characteristics,
        hasMissingData: result.hasMissingData,
        longBranchMultiplier: result.longBranchMultiplier,
        polyphyleticForce: result.polyphyleticForce,
        circularDependency: result.circularDependency,
      },
    };
  });

  fastify.post('/scenarios/clear', async (request, reply) => {
    clearAllData();
    return { success: true };
  });
}

export async function phylogenyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/phylogeny/compute', async (request: FastifyRequest<{ Body: PhylogenyRequest }>, reply) => {
    const body = request.body;

    const species = queryAll('SELECT id, name FROM species ORDER BY id') as Array<{
      id: number;
      name: string;
    }>;

    const characteristics = queryAll(
      'SELECT species_id, feature_name, feature_value FROM characteristic_matrix ORDER BY species_id'
    ) as Array<{ species_id: number; feature_name: string; feature_value: number }>;

    if (species.length < 2) {
      reply.status(400);
      return { error: '至少需要2个物种才能构建系统发育树' };
    }

    const result = buildPhylogeny(body.algorithm || 'upgma', species, characteristics, {
      hasMissingData: body.options?.hasMissingData,
      longBranchMultiplier: body.options?.longBranchMultiplier,
      polyphyleticForce: body.options?.polyphyleticForce,
      circularDependency: body.options?.circularDependency,
    });

    const dbResult = run('INSERT INTO phylogeny_results (algorithm, tree_data) VALUES (?, ?)', [
      result.algorithm,
      JSON.stringify(result.tree),
    ]);
    saveDatabase();

    return {
      data: result,
      resultId: dbResult.lastInsertRowid,
    };
  });

  fastify.get('/phylogeny/results', async (request, reply) => {
    const rows = queryAll('SELECT * FROM phylogeny_results ORDER BY created_at DESC LIMIT 10');
    return { data: rows };
  });

  fastify.get('/phylogeny/distance-matrix', async (request, reply) => {
    const species = queryAll('SELECT id, name FROM species ORDER BY id') as Array<{
      id: number;
      name: string;
    }>;

    const characteristics = queryAll(
      'SELECT species_id, feature_name, feature_value FROM characteristic_matrix ORDER BY species_id'
    ) as Array<{ species_id: number; feature_name: string; feature_value: number }>;

    if (species.length < 2) {
      return { data: { labels: [], matrix: [], speciesIds: [] } };
    }

    const { computeDistanceMatrix } = await import('../algorithms/phylogeny.js');
    const matrix = computeDistanceMatrix(species, characteristics);

    return { data: matrix };
  });
}
