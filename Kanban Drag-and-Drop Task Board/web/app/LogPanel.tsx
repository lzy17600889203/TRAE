'use client';

import type { TaskLog } from './types';

export function LogPanel({ logs }: { logs: TaskLog[] }) {
  return (
    <div className="w-full md:w-72 shrink-0 bg-white border-l border-slate-200 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">变更日志</span>
        <span className="text-xs text-slate-400">最近 {logs.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {logs.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-6">暂无日志</div>
        )}
        {logs.map((l) => (
          <div
            key={l.id}
            className="text-[11px] leading-relaxed rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={
                  'inline-block w-1.5 h-1.5 rounded-full ' +
                  (l.action === 'move'
                    ? 'bg-indigo-500'
                    : l.action === 'reorder'
                    ? 'bg-amber-500'
                    : l.action === 'create'
                    ? 'bg-emerald-500'
                    : l.action === 'delete'
                    ? 'bg-rose-500'
                    : 'bg-slate-400')
                }
              />
              <span className="font-medium text-slate-700">{l.action}</span>
              <span className="text-slate-400">· task #{l.task_id}</span>
            </div>
            {l.detail && (
              <div className="text-slate-500 truncate">{l.detail}</div>
            )}
            <div className="text-slate-400 mt-0.5">
              {l.created_at.replace('T', ' ').slice(0, 19)} · {l.operator}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
