import { prepare, exec, transaction, logAction, touchTask } from './db.js';
import { bugFlags } from './bugs.js';

export interface TaskInput {
  title: string;
  description?: string;
  column?: string;
  priority?: string;
  parent_id?: number | null;
  blocked_by?: string;
}

export function listTasks() {
  return prepare(
    `SELECT * FROM tasks ORDER BY
     CASE column WHEN 'todo' THEN 1 WHEN 'doing' THEN 2 WHEN 'done' THEN 3 ELSE 4 END,
     sort_index ASC, id ASC`
  ).all();
}

export function getTask(id: number) {
  return prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
}

export function createTask(input: TaskInput, operator = 'anonymous') {
  const column = input.column ?? 'todo';
  const priority = input.priority ?? 'medium';
  const countRow = prepare(`SELECT COUNT(*) as c FROM tasks WHERE column = ?`).get(column) as { c: number };
  const sortIndex = countRow.c;
  const info = prepare(
    `INSERT INTO tasks (title, description, column, priority, sort_index, parent_id, blocked_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.title,
    input.description ?? '',
    column,
    priority,
    sortIndex,
    input.parent_id ?? null,
    input.blocked_by ?? ''
  );
  const id = Number(info.lastInsertRowid);
  logAction(id, 'create', {
    to_column: column,
    to_index: sortIndex,
    operator,
    detail: `Created "${input.title}"`
  });
  return getTask(id);
}

export function updateTask(
  id: number,
  patch: Partial<Omit<TaskInput, 'column' | 'parent_id'>> & {
    column?: string;
    parent_id?: number | null;
  },
  operator = 'anonymous'
) {
  const existing = getTask(id);
  if (!existing) return null;

  if (bugFlags.staleOverride && patch.description !== undefined) {
    patch.description = '[OVERWRITTEN by concurrent bug] ' + (patch.description ?? '');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (fields.length === 0) return existing;
  values.push(id);
  prepare(`UPDATE tasks SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(
    ...values
  );
  logAction(id, 'update', {
    operator,
    detail: `Updated fields: ${Object.keys(patch).join(', ')}${bugFlags.staleOverride ? ' (stale-overwrite bug enabled)' : ''}`
  });
  return getTask(id);
}

export function deleteTask(id: number, operator = 'anonymous') {
  const existing = getTask(id);
  if (!existing) return false;
  logAction(id, 'delete', {
    from_column: existing.column,
    from_index: existing.sort_index,
    operator,
    detail: `Deleted "${existing.title}"`
  });
  prepare(`DELETE FROM task_logs WHERE task_id = ?`).run(id);
  prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
  reindexColumn(existing.column);
  return true;
}

export function reindexColumn(column: string) {
  const rows = prepare(
    `SELECT id FROM tasks WHERE column = ? AND parent_id IS NULL ORDER BY sort_index ASC, id ASC`
  ).all(column) as { id: number }[];
  const stmt = prepare(`UPDATE tasks SET sort_index = ? WHERE id = ?`);
  transaction(() => {
    rows.forEach((r, i) => stmt.run(i, r.id));
  });
}

export function moveTask(
  id: number,
  toColumn: string,
  toIndex: number,
  operator = 'anonymous'
) {
  const existing = getTask(id);
  if (!existing) return null;
  const fromColumn = existing.column;
  const fromIndex = existing.sort_index;

  const bugOffset = bugFlags.indexOffset ? 1 : 0;
  const clampedWithBug = toIndex + bugOffset;

  if (fromColumn === toColumn) {
    const rows = prepare(
      `SELECT id, sort_index FROM tasks WHERE column = ? AND parent_id IS NULL ORDER BY sort_index ASC, id ASC`
    ).all(fromColumn) as { id: number; sort_index: number }[];
    const currentPos = rows.findIndex((r) => r.id === id);
    if (currentPos === -1) return null;
    const clamped = Math.max(0, Math.min(clampedWithBug, rows.length - 1));
    rows.splice(currentPos, 1);
    rows.splice(clamped, 0, { id, sort_index: clamped });
    const upd = prepare(`UPDATE tasks SET sort_index = ?, updated_at = datetime('now') WHERE id = ?`);
    transaction(() => {
      rows.forEach((r, i) => upd.run(i, r.id));
    });
    logAction(id, 'reorder', {
      from_column: fromColumn,
      to_column: toColumn,
      from_index: fromIndex,
      to_index: clamped,
      operator,
      detail: `Reordered within ${fromColumn}${bugOffset ? ' (index offset bug enabled)' : ''}`
    });
  } else {
    const fromRows = prepare(
      `SELECT id FROM tasks WHERE column = ? AND parent_id IS NULL ORDER BY sort_index ASC, id ASC`
    ).all(fromColumn) as { id: number }[];
    const toRows = prepare(
      `SELECT id FROM tasks WHERE column = ? AND parent_id IS NULL ORDER BY sort_index ASC, id ASC`
    ).all(toColumn) as { id: number }[];
    const filteredFrom = fromRows.filter((r) => r.id !== id);
    const clamped = Math.max(0, Math.min(clampedWithBug, toRows.length));
    toRows.splice(clamped, 0, { id });

    const updFrom = prepare(`UPDATE tasks SET sort_index = ?, updated_at = datetime('now') WHERE id = ?`);
    const updTo = prepare(`UPDATE tasks SET sort_index = ?, column = ?, updated_at = datetime('now') WHERE id = ?`);
    const updToOther = prepare(`UPDATE tasks SET sort_index = ? WHERE id = ?`);
    transaction(() => {
      filteredFrom.forEach((r, i) => updFrom.run(i, r.id));
      toRows.forEach((r, i) => {
        if (r.id === id) {
          updTo.run(i, toColumn, id);
        } else {
          updToOther.run(i, r.id);
        }
      });
    });

    logAction(id, 'move', {
      from_column: fromColumn,
      to_column: toColumn,
      from_index: fromIndex,
      to_index: clamped,
      operator,
      detail: `Moved from ${fromColumn} to ${toColumn}${bugOffset ? ' (index offset bug enabled)' : ''}`
    });
  }

  return getTask(id);
}

export function listLogs(taskId?: number, limit = 200) {
  if (taskId) {
    return prepare(`SELECT * FROM task_logs WHERE task_id = ? ORDER BY id DESC LIMIT ?`).all(taskId, limit);
  }
  return prepare(`SELECT * FROM task_logs ORDER BY id DESC LIMIT ?`).all(limit);
}

export function resetAll() {
  prepare(`DELETE FROM task_logs`).run();
  prepare(`DELETE FROM tasks`).run();
}

export { logAction, touchTask };
