import fastify from 'fastify';
import cors from '@fastify/cors';
import { buildDatabase } from './db.js';
import {
  parseGraph,
  toCypher,
  toGremlin,
  executeGraphQuery,
} from './graph-engine.js';

const app = fastify({ logger: true });
await app.register(cors, { origin: true });

const db = buildDatabase();

app.get('/api/ping', () => ({ pong: true }));

app.get('/api/scenes', () => {
  return { scenes: Object.keys(SCENES) };
});

app.get('/api/scenes/:id', (req) => {
  const id = req.params.id;
  if (!SCENES[id]) {
    throw { statusCode: 404, message: 'scene not found' };
  }
  return SCENES[id];
});

app.post('/api/translate', (req, reply) => {
  const { graph, lang = 'cypher' } = req.body || {};
  try {
    const parsed = parseGraph(graph);
    const query = lang === 'gremlin' ? toGremlin(parsed) : toCypher(parsed);
    return { query, parsed };
  } catch (err) {
    reply.code(400);
    return { error: err.message };
  }
});

app.post('/api/execute', async (req, reply) => {
  const { graph, options = {} } = req.body || {};
  try {
    const parsed = parseGraph(graph);
    const cypher = toCypher(parsed);
    const gremlin = toGremlin(parsed);
    const result = await executeGraphQuery(db, parsed, {
      timeoutMs: options.timeoutMs || 2000,
      maxDepth: options.maxDepth || 15,
      detectCycle: options.detectCycle !== false,
    });
    return { cypher, gremlin, result };
  } catch (err) {
    const status = err.statusCode || 500;
    reply.code(status);
    return {
      error: err.message || String(err),
      kind: err.kind || 'unknown',
    };
  }
});

app.get('/api/data', () => {
  const nodes = db.prepare('SELECT * FROM nodes').all();
  const edges = db.prepare('SELECT * FROM edges').all();
  return { nodes, edges };
});

const start = async () => {
  try {
    await app.listen({ port: 4000, host: '0.0.0.0' });
    console.log('backend up on http://localhost:4000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const SCENES = {
  friends: {
    id: 'friends',
    name: '社交网络好友推荐',
    description:
      '从用户 Alice 出发，匹配其好友的好友（两跳），过滤共同好友用于推荐。',
    query: 'MATCH (a:User {name:"Alice"})-[:KNOWS]->(b:User)-[:KNOWS]->(c:User) RETURN a,b,c',
    graph: {
      nodes: [
        { id: 'A', label: 'User', name: 'Alice', x: 100, y: 200, color: '#60a5fa', start: true },
        { id: 'B', label: 'User', name: '', x: 360, y: 140, color: '#34d399' },
        { id: 'C', label: 'User', name: '', x: 620, y: 200, color: '#f472b6' },
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', type: 'KNOWS' },
        { id: 'e2', source: 'B', target: 'C', type: 'KNOWS' },
      ],
    },
    expected: ['Alice → Bob → Carol', 'Alice → Bob → Dan', 'Alice → Eve → Carol'],
  },
  knowledge: {
    id: 'knowledge',
    name: '知识图谱实体关联',
    description: '查询 “达芬奇” 的作品类型为 “绘画” 的实体，并通过 “创作” 关系反向查询作者。',
    query: 'MATCH (a:Artist {name:"Leonardo"})-[:CREATED]->(w:Work {kind:"painting"}) RETURN a,w',
    graph: {
      nodes: [
        { id: 'A', label: 'Artist', name: 'Leonardo', x: 120, y: 220, color: '#fbbf24', start: true },
        { id: 'W', label: 'Work', kind: 'painting', x: 480, y: 220, color: '#a78bfa' },
      ],
      edges: [{ id: 'e1', source: 'A', target: 'W', type: 'CREATED' }],
    },
    expected: ['Leonardo → MonaLisa', 'Leonardo → LastSupper'],
  },
  recursion: {
    id: 'recursion',
    name: '深层递归查询',
    description:
      '使用 [*1..12] 变长路径从节点 1 进行深度递归，演示递归深度过大导致的查询超时。',
    query: 'MATCH p=(a:Node {id:1})-[:LINK*1..12]->(b) RETURN p',
    graph: {
      nodes: [
        { id: 'A', label: 'Node', id_: '1', x: 120, y: 220, color: '#22d3ee', start: true },
        { id: 'B', label: 'Node', x: 500, y: 220, color: '#fb7185' },
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', type: 'LINK', min: 1, max: 12 },
      ],
    },
    expected: ['查询将触发递归深度过大而超时'],
  },
  cycle: {
    id: 'cycle',
    name: '循环引用死锁',
    description:
      'A→B→C→A 形成循环，缺少深度上限与方向约束将导致解析死循环与语法错误。',
    query: 'MATCH (a)-[:REF*]->(b)-[:REF*]->(c)-[:REF*]->(a) RETURN a,b,c',
    graph: {
      nodes: [
        { id: 'A', label: 'Item', x: 120, y: 240, color: '#f87171', start: true },
        { id: 'B', label: 'Item', x: 400, y: 120, color: '#f87171' },
        { id: 'C', label: 'Item', x: 680, y: 240, color: '#f87171' },
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', type: 'REF' },
        { id: 'e2', source: 'B', target: 'C', type: 'REF' },
        { id: 'e3', source: 'C', target: 'A', type: 'REF' },
      ],
    },
    expected: ['检测到循环依赖，解析将死锁并被终止'],
  },
};

start();
