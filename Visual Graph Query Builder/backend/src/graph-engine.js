export function parseGraph(graph) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    const err = new Error('Graph structure is invalid (need nodes + edges arrays)');
    err.kind = 'malformed';
    err.statusCode = 400;
    throw err;
  }

  const nodes = graph.nodes.map((n) => ({ ...n }));
  const edges = graph.edges.map((e) => ({ ...e }));

  if (nodes.length === 0) {
    const err = new Error('画布没有任何节点，无法构建查询');
    err.kind = 'empty-graph';
    err.statusCode = 400;
    throw err;
  }

  const startNodes = nodes.filter((n) => n.start);
  if (startNodes.length === 0) {
    const err = new Error('没有指定起点节点，请将至少一个节点标记为 START');
    err.kind = 'no-start';
    err.statusCode = 400;
    throw err;
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
      const err = new Error(`边 ${e.id} 引用了不存在的节点`);
      err.kind = 'dangling-edge';
      err.statusCode = 400;
      throw err;
    }
  }

  const adj = new Map();
  const inDeg = new Map();
  for (const n of nodes) {
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  }
  for (const e of edges) {
    adj.get(e.source).push(e);
    inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
  }

  const hasCycle = detectCycle(nodes, edges);
  if (hasCycle) {
    const err = new Error(
      '检测到循环引用：图中存在环，解析将进入死循环。请移除环或添加深度约束。'
    );
    err.kind = 'cycle-detected';
    err.statusCode = 422;
    throw err;
  }

  const isolated = nodes.filter(
    (n) => (adj.get(n.id) || []).length === 0 && (inDeg.get(n.id) || 0) === 0
  );
  if (isolated.length > 0) {
    const err = new Error(
      `发现孤立节点：${isolated.map((i) => i.id).join(', ')}，无法匹配任何路径`
    );
    err.kind = 'isolated-nodes';
    err.statusCode = 422;
    throw err;
  }

  return {
    nodes,
    edges,
    startNodeIds: startNodes.map((n) => n.id),
    adjacency: adj,
  };
}

function detectCycle(nodes, edges) {
  const color = new Map();
  nodes.forEach((n) => color.set(n.id, 0));
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.source).push(e.target));

  const dfs = (u) => {
    color.set(u, 1);
    for (const v of adj.get(u)) {
      if (color.get(v) === 1) return true;
      if (color.get(v) === 0 && dfs(v)) return true;
    }
    color.set(u, 2);
    return false;
  };

  for (const n of nodes) {
    if (color.get(n.id) === 0) {
      if (dfs(n.id)) return true;
    }
  }
  return false;
}

export function toCypher(parsed) {
  const { nodes, edges, startNodeIds } = parsed;
  const parts = edges.map((e) => {
    const s = nodes.find((n) => n.id === e.source);
    const t = nodes.find((n) => n.id === e.target);
    const range =
      typeof e.min === 'number' || typeof e.max === 'number'
        ? `*${e.min ?? 1}..${e.max ?? ''}`
        : '';
    return `(${s.id}:${s.label}${propsFragment(s)})-[:${e.type || 'CONNECTS'}${range}]->(${t.id}:${t.label}${propsFragment(t)})`;
  });
  const used = new Set();
  edges.forEach((e) => {
    used.add(e.source);
    used.add(e.target);
  });
  const loneNodes = nodes.filter((n) => !used.has(n.id));
  const loneParts = loneNodes.map(
    (n) => `(${n.id}:${n.label}${propsFragment(n)})`
  );
  return `MATCH ${[...parts, ...loneParts].join(', ')} RETURN ${nodes.map((n) => n.id).join(', ')}`;

  function propsFragment(n) {
    const keys = ['name', 'kind', 'city', 'country', 'id_'];
    const out = [];
    for (const k of keys) {
      if (n[k] !== undefined && n[k] !== null && n[k] !== '') {
        const label = k === 'id_' ? 'id' : k;
        const val = typeof n[k] === 'string' ? `"${n[k]}"` : n[k];
        out.push(`${label}:${val}`);
      }
    }
    return out.length ? ` {${out.join(', ')}}` : '';
  }
}

export function toGremlin(parsed) {
  const { nodes, edges, startNodeIds } = parsed;
  const starts = nodes.filter((n) => n.start);
  const head = starts[0] || nodes[0];
  const steps = edges
    .filter((e) => e.source === head.id)
    .map((e) => {
      const range =
        typeof e.min === 'number' || typeof e.max === 'number'
          ? `.times(${e.max ?? 1}).loops(${e.min ?? 1})`
          : '';
      return `.outE('${e.type}').inV()${range}`;
    })
    .join('');
  return `g.V().hasLabel('${head.label}').has('name','${head.name ?? head.id}')${steps}.path()`;
}

export async function executeGraphQuery(db, parsed, options) {
  const timeoutMs = options.timeoutMs || 8000;
  const maxDepth = options.maxDepth || 15;
  const start = Date.now();

  const allNodes = db
    .prepare('SELECT id, label, props FROM nodes')
    .all()
    .map((n) => ({ ...n, props: JSON.parse(n.props) }));
  const allEdges = db.prepare('SELECT id, source, target, type FROM edges').all();

  const nodeById = new Map(allNodes.map((n) => [n.id, n]));
  const edgeByNode = new Map();
  allNodes.forEach((n) => edgeByNode.set(n.id, []));
  allEdges.forEach((e) => edgeByNode.get(e.source).push(e));

  const startNodes = parsed.nodes.filter((n) => n.start);
  if (startNodes.length === 0) {
    return { rows: [], note: 'no-start-node', status: 'empty' };
  }

  const results = [];
  const visitedInPath = new Set();
  const warn = { timeout: false, depthExceeded: false };
  let chain = [];

  function walk(current, remainingEdges, depth) {
    if (Date.now() - start > timeoutMs) {
      warn.timeout = true;
      return;
    }
    if (depth > maxDepth) {
      warn.depthExceeded = true;
      return;
    }
    if (visitedInPath.has(current.id)) {
      return;
    }
    visitedInPath.add(current.id);
    chain.push(current);

    if (remainingEdges.length === 0) {
      results.push([...chain]);
      chain.pop();
      visitedInPath.delete(current.id);
      return;
    }

    const nextEdge = remainingEdges[0];
    const isVariableLength =
      typeof nextEdge.min === 'number' || typeof nextEdge.max === 'number';
    const outgoing = edgeByNode.get(current.id) || [];
    const candidates = outgoing.filter(
      (e) => !nextEdge.type || e.type === nextEdge.type
    );

    if (candidates.length === 0) {
      chain.pop();
      visitedInPath.delete(current.id);
      return;
    }

    const patternTarget = parsed.nodes.find((n) => n.id === nextEdge.target);

    for (const c of candidates) {
      const next = nodeById.get(c.target);
      if (!next) continue;
      if (isVariableLength) {
        if (patternTarget && matchesPattern(next, patternTarget)) {
          walk(next, remainingEdges.slice(1), depth + 1);
          if (warn.timeout) return;
        }
        walk(next, remainingEdges, depth + 1);
        if (warn.timeout) return;
      } else {
        if (patternTarget && !matchesPattern(next, patternTarget)) continue;
        walk(next, remainingEdges.slice(1), depth + 1);
        if (warn.timeout) return;
      }
    }

    chain.pop();
    visitedInPath.delete(current.id);
  }

  for (const startNode of startNodes) {
    const matchingStart = findMatchingNodes(startNode, allNodes);
    for (const dbStart of matchingStart) {
      chain = [];
      visitedInPath.clear();
      walk(dbStart, parsed.edges, 0);
    }
  }

  if (warn.timeout) {
    const err = new Error(
      `查询超时（>${timeoutMs}ms）：递归深度过大或图过于复杂，请减小路径长度或增加深度约束`
    );
    err.kind = 'timeout';
    err.statusCode = 408;
    throw err;
  }

  const rows = results.map((path) =>
    path.map((n) => ({ id: n.id, label: n.label, props: n.props }))
  );

  return {
    rows,
    count: rows.length,
    note:
      rows.length === 0
        ? '未匹配到结果（可能由于非法属性过滤、孤立节点或无匹配路径）'
        : `匹配到 ${rows.length} 条路径`,
    status: rows.length === 0 ? 'empty' : 'ok',
  };
}

function findMatchingNodes(pattern, nodes) {
  return nodes.filter((n) => matchesPattern(n, pattern));
}

function matchesPattern(node, pattern) {
  if (!pattern) return true;
  if (pattern.label && node.label !== pattern.label) return false;
  const props = node.props || {};
  for (const key of ['name', 'kind', 'city', 'country']) {
    if (pattern[key] !== undefined && pattern[key] !== '') {
      if (props[key] !== pattern[key]) return false;
    }
  }
  if (pattern.id_ && String(props.id ?? props.name) !== String(pattern.id_)) {
    return false;
  }
  return true;
}
