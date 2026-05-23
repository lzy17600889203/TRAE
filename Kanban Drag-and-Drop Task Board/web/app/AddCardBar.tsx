'use client';

import { useState } from 'react';
import { api } from './useTasks';

export function AddCardBar({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [column, setColumn] = useState<'todo' | 'doing' | 'done'>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    api.createTask({ title: t, column, priority }).then(() => {
      setTitle('');
      onCreated();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-white border-b border-slate-200">
      <input
        className="flex-1 min-w-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder="新卡片标题…  (按回车创建)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <select
        className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        value={column}
        onChange={(e) => setColumn(e.target.value as any)}
      >
        <option value="todo">待办</option>
        <option value="doing">进行中</option>
        <option value="done">已完成</option>
      </select>
      <select
        className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        value={priority}
        onChange={(e) => setPriority(e.target.value as any)}
      >
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
      <button
        onClick={submit}
        className="rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-500"
      >
        + 新增卡片
      </button>
    </div>
  );
}
