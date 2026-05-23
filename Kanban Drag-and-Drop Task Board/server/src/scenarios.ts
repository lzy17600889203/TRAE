import { createTask, resetAll, moveTask } from './tasks.js';

const COLUMNS = ['todo', 'doing', 'done'] as const;
type Column = (typeof COLUMNS)[number];

export function applyScenario(name: string) {
  resetAll();
  switch (name) {
    case 'single-column-heap':
      return singleColumnHeap();
    case 'deep-nested':
      return deepNested();
    case 'high-frequency-conflict':
      return highFrequencyConflict();
    case 'circular-block':
      return circularBlock();
    default:
      return { ok: false, message: `Unknown scenario: ${name}` };
  }
}

function singleColumnHeap() {
  const operator = 'scenario:single-column-heap';
  const count = 100;
  for (let i = 1; i <= count; i++) {
    createTask(
      {
        title: `堆积卡片 #${i}`,
        description: `这是第 ${i} 张卡片，用于测试单列百张卡片下的拖拽与重排性能。`,
        column: 'todo',
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
      },
      operator
    );
  }
  return { ok: true, scenario: 'single-column-heap', count };
}

function deepNested() {
  const operator = 'scenario:deep-nested';
  let parentId: number | null = null;
  for (let i = 1; i <= 15; i++) {
    const t = createTask(
      {
        title: i === 1 ? '根任务 (Level 1)' : `子任务 (Level ${i})`,
        description: `深度嵌套场景，第 ${i} 层`,
        column: i <= 3 ? 'todo' : i <= 10 ? 'doing' : 'done',
        priority: i <= 3 ? 'high' : 'medium',
        parent_id: parentId
      },
      operator
    );
    parentId = (t as any).id;
  }
  const sibling = createTask(
    { title: '同级兄弟任务', description: '与深度链无关的兄弟任务', column: 'todo', priority: 'low' },
    operator
  );
  return { ok: true, scenario: 'deep-nested', depth: 15, sibling: (sibling as any).id };
}

function highFrequencyConflict() {
  const operator = 'scenario:high-frequency-conflict';
  const tasks: number[] = [];
  for (let i = 1; i <= 30; i++) {
    const t = createTask(
      {
        title: `高频冲突任务 #${i}`,
        description: `模拟高频快速拖拽冲突场景`,
        column: (COLUMNS as readonly string[])[i % 3] as Column,
        priority: 'medium'
      },
      operator
    );
    tasks.push((t as any).id);
  }
  for (let i = 0; i < 15; i++) {
    const id = tasks[i % tasks.length];
    const to = (COLUMNS as readonly string[])[(i + 1) % 3] as Column;
    const toIndex = (i * 3) % 5;
    moveTask(id, to, toIndex, operator);
  }
  return { ok: true, scenario: 'high-frequency-conflict', count: tasks.length };
}

function circularBlock() {
  const operator = 'scenario:circular-block';
  const a = createTask(
    { title: '任务 A', description: '依赖任务 B', column: 'doing', priority: 'high', blocked_by: 'B' },
    operator
  );
  const b = createTask(
    { title: '任务 B', description: '依赖任务 C', column: 'doing', priority: 'high', blocked_by: 'C' },
    operator
  );
  const c = createTask(
    { title: '任务 C', description: '依赖任务 A', column: 'doing', priority: 'high', blocked_by: 'A' },
    operator
  );
  const d = createTask(
    { title: '孤立任务 D', description: '无依赖的普通任务', column: 'todo', priority: 'medium' },
    operator
  );
  return {
    ok: true,
    scenario: 'circular-block',
    ids: { A: (a as any).id, B: (b as any).id, C: (c as any).id, D: (d as any).id }
  };
}
