'use client';

import { useState } from 'react';
import { api } from './useTasks';

const SCENARIOS: { id: string; label: string; desc: string }[] = [
  {
    id: 'single-column-heap',
    label: '单列堆积',
    desc: '在“待办”列中生成 100 张卡片，测试 DOM 重排掉帧'
  },
  {
    id: 'deep-nested',
    label: '深层子任务',
    desc: '生成 15 层深度嵌套的父子任务链'
  },
  {
    id: 'high-frequency-conflict',
    label: '高频拖拽冲突',
    desc: '模拟 30 张卡片 × 15 次并发移动'
  },
  {
    id: 'circular-block',
    label: '循环依赖阻塞',
    desc: 'A→B→C→A 循环依赖，测试阻塞展示'
  }
];

const BUGS: { id: string; label: string }[] = [
  { id: 'indexOffset', label: '索引错位 (±1)' },
  { id: 'staleOverride', label: '并发覆盖写' },
  { id: 'randomDrop', label: '随机拖拽丢弃' }
];

export function ScenarioBar({ onApplied }: { onApplied: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [bugStates, setBugStates] = useState<Record<string, boolean>>({
    indexOffset: false,
    staleOverride: false,
    randomDrop: false
  });

  const apply = async (id: string) => {
    setLoading(id);
    try {
      await api.applyScenario(id);
      onApplied();
    } finally {
      setLoading(null);
    }
  };

  const toggleBug = async (id: string) => {
    const next = !bugStates[id];
    const res = await api.setBug(id, next);
    if (res.ok) {
      setBugStates({ ...bugStates, [id]: next });
    }
  };

  return (
    <div className="px-5 py-3 bg-white border-b border-slate-200">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          预设场景
        </span>
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => apply(s.id)}
            disabled={loading === s.id}
            title={s.desc}
            className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {loading === s.id ? '加载中…' : s.label}
          </button>
        ))}
        <span className="mx-2 h-5 w-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          异常开关
        </span>
        {BUGS.map((b) => (
          <button
            key={b.id}
            onClick={() => toggleBug(b.id)}
            className={
              'rounded-lg border px-2 py-1 text-xs transition-colors ' +
              (bugStates[b.id]
                ? 'bg-rose-100 border-rose-300 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50')
            }
          >
            {bugStates[b.id] ? '● ' : '○ '}
            {b.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        提示：启用“索引错位”后，拖拽落位会比目标位置偏移 1 格；启用“并发覆盖写”后，更新卡片描述会被注入覆盖标记。
      </p>
    </div>
  );
}
