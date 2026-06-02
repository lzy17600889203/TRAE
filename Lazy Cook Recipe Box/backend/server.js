'use strict';

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const path = require('path');
const fs = require('fs');
const {
  listRecipesByScene,
  listAllRecipes,
  getRecipeWithIngredients,
  addRecipe,
  isEmpty,
} = require('./database');

fastify.register(cors, { origin: true });

// 让后端同时托管前端静态页面（避免 CORS / file:// 协议限制）
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

fastify.get('/', (_, reply) => {
  const file = path.join(FRONTEND_DIR, 'index.html');
  if (fs.existsSync(file)) {
    reply.type('text/html; charset=utf-8').send(fs.readFileSync(file, 'utf-8'));
  } else {
    reply.redirect('/api/health');
  }
});

fastify.get('/api/health', (_, reply) => {
  reply.send({ status: 'ok', time: new Date().toISOString() });
});

fastify.get('/api/recipes', async (request) => {
  const { scene } = request.query || {};
  if (scene && scene !== 'all') {
    return listRecipesByScene(scene);
  }
  return listAllRecipes();
});

function formatQuantity(q) {
  if (q == null || isNaN(q)) return null;
  if (Math.abs(q - Math.round(q)) < 1e-9) return Math.round(q);
  return Number(q.toFixed(2));
}

fastify.get('/api/recipes/:id', async (request) => {
  const id = Number(request.params.id);
  const servingsRaw = Number(request.query.servings);
  const recipe = await getRecipeWithIngredients(id);
  if (!recipe) {
    throw { statusCode: 404, message: '菜谱不存在' };
  }
  const base = Number(recipe.base_servings) || 1;
  const targetServings = servingsRaw > 0 ? servingsRaw : base;
  const ratio = targetServings / base;

  const ingredients = recipe.ingredients.map((ing) => {
    if (ing.is_fuzzy) {
      return {
        id: ing.id,
        name: ing.name,
        quantity: null,
        display_quantity: ing.fuzzy_label || '适量',
        unit: ing.unit,
        is_fuzzy: true,
      };
    }
    if (ing.base_quantity == null || isNaN(ing.base_quantity)) {
      return {
        id: ing.id,
        name: ing.name,
        quantity: null,
        display_quantity: '?',
        unit: ing.unit,
        is_fuzzy: true,
      };
    }
    const scaled = ing.base_quantity * ratio;
    return {
      id: ing.id,
      name: ing.name,
      quantity: scaled,
      display_quantity: String(formatQuantity(scaled)),
      unit: ing.unit || '',
      is_fuzzy: false,
    };
  });

  return {
    id: recipe.id,
    name: recipe.name,
    emoji: recipe.emoji,
    scene: recipe.scene,
    description: recipe.description,
    steps: recipe.steps,
    base_servings: base,
    target_servings: targetServings,
    ratio,
    ingredients,
  };
});

fastify.post('/api/recipes', async (request) => {
  const body = request.body || {};
  if (!body.name || !body.scene) {
    throw { statusCode: 400, message: '菜谱名称和场景必填' };
  }
  const id = await addRecipe(body);
  return { id, name: body.name };
});

const start = async () => {
  if (await isEmpty()) {
    fastify.log.info('数据库为空，自动执行 seed...');
    require('./seed.js');
  }
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`🍳 后端 + 前端已启动: http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
