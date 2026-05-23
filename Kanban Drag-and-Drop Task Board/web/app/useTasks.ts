'use client';

import { useEffect, useState } from 'react';
import type { Task, TaskLog } from './types';

const BASE = '/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<TaskLog[]>([]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [tRes, lRes] = await Promise.all([
        fetch(`${BASE}/tasks`).then((r) => r.json()),
        fetch(`${BASE}/logs?limit=50`).then((r) => r.json())
      ]);
      setTasks(tRes.items || []);
      setLogs(lRes.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { tasks, logs, loading, refresh, setTasks, setLogs };
}

export const api = {
  createTask: (body: Partial<Task> & { title: string }) =>
    fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).then((r) => r.json()),
  updateTask: (id: number, body: Partial<Task>) =>
    fetch(`${BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).then((r) => r.json()),
  deleteTask: (id: number) =>
    fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' }).then((r) => r.json()),
  moveTask: (id: number, to_column: string, to_index: number) =>
    fetch(`${BASE}/tasks/${id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to_column, to_index })
    }).then((r) => r.json()),
  applyScenario: (name: string) =>
    fetch(`${BASE}/scenarios`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    }).then((r) => r.json()),
  setBug: (name: string, value: boolean) =>
    fetch(`${BASE}/bugs/${name}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value })
    }).then((r) => r.json()),
  getBugs: () => fetch(`${BASE}/bugs`).then((r) => r.json())
};
