'use client';

import { useState } from 'react';
import { Board } from './Board';
import { AddCardBar } from './AddCardBar';
import { ScenarioBar } from './ScenarioBar';
import { LogPanel } from './LogPanel';
import { useTasks } from './useTasks';

export default function Page() {
  const { tasks, logs, loading, refresh } = useTasks();
  const [moving, setMoving] = useState<Record<number, number>>({});

  const markMoving = (id: number, delta: 1 | -1) => {
    setMoving((prev) => {
      const next = { ...prev };
      const count = (next[id] ?? 0) + delta;
      if (count <= 0) delete next[id];
      else next[id] = count;
      return next;
    });
  };

  return (
    <main className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-sm" />
          <div>
            <h1 className="text-slate-800 font-semibold tracking-tight">
              Kanban Drag & Drop Board
            </h1>
            <p className="text-xs text-slate-500">
              Next.js · Fastify · SQLite · better-sqlite3
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          {loading ? '加载中…' : `共 ${tasks.length} 张卡片`}
        </div>
      </header>
      <ScenarioBar onApplied={refresh} />
      <AddCardBar onCreated={refresh} />
      <div className="flex-1 flex min-h-0">
        <Board
          tasks={tasks}
          onMutate={refresh}
          moving={moving}
          markMoving={markMoving}
        />
        <LogPanel logs={logs} />
      </div>
    </main>
  );
}
