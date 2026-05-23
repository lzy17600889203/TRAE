'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { Task, TaskColumn } from './types';
import { COLUMNS } from './types';
import { api } from './useTasks';

interface Props {
  tasks: Task[];
  onMutate: () => void;
  moving: Record<number, number>;
  markMoving: (id: number, delta: 1 | -1) => void;
}

export function Board({ tasks, onMutate, moving, markMoving }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<{
    column: TaskColumn;
    index: number;
  } | null>(null);
  const [dropColumnActive, setDropColumnActive] = useState<TaskColumn | null>(
    null
  );

  const grouped = useMemo(() => {
    const result: Record<TaskColumn, Task[]> = { todo: [], doing: [], done: [] };
    for (const t of tasks) {
      if (!result[t.column]) result[t.column] = [];
      result[t.column].push(t);
    }
    for (const k of Object.keys(result) as TaskColumn[]) {
      result[k].sort((a, b) => a.sort_index - b.sort_index);
    }
    return result;
  }, [tasks]);

  const computeIndex = (col: TaskColumn, y: number, el: HTMLElement) => {
    const children = Array.from(
      el.querySelectorAll<HTMLElement>('[data-card]')
    ).filter((c) => Number(c.dataset.cardId) !== draggingId);
    let idx = children.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (y < mid) {
        idx = i;
        break;
      }
    }
    return idx;
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('dragging');
    setDraggingId(null);
    setDragOver(null);
    setDropColumnActive(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    col: TaskColumn,
    el: HTMLElement
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropColumnActive(col);
    const idx = computeIndex(col, e.clientY, el);
    setDragOver({ column: col, index: idx });
  };

  const handleDrop = (e: React.DragEvent, col: TaskColumn, el: HTMLElement) => {
    e.preventDefault();
    if (draggingId == null) return;
    const idx = computeIndex(col, e.clientY, el);
    markMoving(draggingId, 1);
    api.moveTask(draggingId, col, idx).then(() => {
      markMoving(draggingId, -1);
      onMutate();
    });
    setDraggingId(null);
    setDragOver(null);
    setDropColumnActive(null);
  };

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 p-5 min-h-0">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className="flex flex-col rounded-2xl bg-white/80 shadow-sm border border-slate-200 min-h-0"
        >
          <div
            className="flex items-center justify-between px-4 py-3 rounded-t-2xl"
            style={{ background: `${col.color}22` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: col.color }}
              />
              <h2 className="text-slate-800 font-semibold tracking-wide">
                {col.label}
              </h2>
              <span className="text-xs text-slate-500">
                {grouped[col.id].length}
              </span>
            </div>
          </div>
          <div
            className={clsx(
              'column-body flex-1 p-3 overflow-y-auto rounded-b-2xl',
              dropColumnActive === col.id && 'drop-active'
            )}
            onDragOver={(e) => handleDragOver(e, col.id, e.currentTarget)}
            onDragLeave={() => {
              if (dropColumnActive === col.id) setDropColumnActive(null);
            }}
            onDrop={(e) => handleDrop(e, col.id, e.currentTarget)}
          >
            <div className="flex flex-col gap-2">
              {grouped[col.id].map((t) => {
                const others = grouped[col.id].filter(
                  (x) => x.id !== draggingId
                );
                const showIndicatorBefore =
                  dragOver?.column === col.id &&
                  dragOver.index === others.indexOf(t);
                return (
                  <div key={t.id} className="flex flex-col">
                    {showIndicatorBefore && (
                      <div className="drop-indicator active rounded-lg" />
                    )}
                    <Card
                      task={t}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      moving={!!moving[t.id]}
                      onMutate={onMutate}
                      ghost={t.id === draggingId}
                    />
                  </div>
                );
              })}
              {dragOver?.column === col.id &&
                dragOver.index >=
                  grouped[col.id].filter((x) => x.id !== draggingId).length && (
                  <div className="drop-indicator active rounded-lg" />
                )}
              {grouped[col.id].length === 0 &&
                dragOver?.column !== col.id && (
                  <div className="text-center text-slate-400 text-sm py-10 select-none">
                    拖拽卡片到此处
                  </div>
                )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({
  task,
  onDragStart,
  onDragEnd,
  moving,
  onMutate,
  ghost
}: {
  task: Task;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  moving: boolean;
  onMutate: () => void;
  ghost?: boolean;
}) {
  const [justCreated] = useState(() => {
    const t = new Date(task.created_at).getTime();
    return Date.now() - t < 3000;
  });
  const [sweep, setSweep] = useState(false);

  useEffect(() => {
    if (moving) {
      setSweep(false);
      const id = requestAnimationFrame(() => setSweep(true));
      return () => cancelAnimationFrame(id);
    }
  }, [moving, task.column]);

  const priorityColor =
    task.priority === 'high'
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : task.priority === 'medium'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div
      data-card
      data-card-id={task.id}
      draggable={!ghost}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={clsx(
        'card-item group rounded-xl border border-slate-200 bg-white p-3 cursor-grab active:cursor-grabbing select-none relative',
        'hover:border-indigo-300 hover:shadow-md',
        justCreated && 'new-card-pop',
        moving && 'ring-2 ring-indigo-300',
        ghost && 'opacity-40 border-dashed border-indigo-200'
      )}
      style={{
        boxShadow:
          '0 1px 2px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.05)'
      }}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 sweep-line rounded-t-xl ${sweep ? 'sweep' : ''}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-slate-800 text-sm leading-5">
          {task.title}
        </div>
        <button
          onClick={() => {
            if (confirm(`删除卡片 "${task.title}"?`)) {
              api.deleteTask(task.id).then(onMutate);
            }
          }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 text-xs"
          title="删除"
        >
          ✕
        </button>
      </div>
      {task.description && (
        <div className="mt-1 text-xs text-slate-500 line-clamp-2">
          {task.description}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span
          className={clsx(
            'text-[10px] px-1.5 py-0.5 rounded border',
            priorityColor
          )}
        >
          {task.priority === 'high'
            ? '高'
            : task.priority === 'medium'
            ? '中'
            : '低'}
        </span>
        <span className="text-[10px] text-slate-400">#{task.id}</span>
        {task.blocked_by && (
          <span className="text-[10px] text-rose-500">
            阻塞于 {task.blocked_by}
          </span>
        )}
        {task.parent_id && (
          <span className="text-[10px] text-slate-500">parent #{task.parent_id}</span>
        )}
      </div>
    </div>
  );
}
