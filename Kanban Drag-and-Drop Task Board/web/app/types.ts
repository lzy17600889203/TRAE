export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskColumn = 'todo' | 'doing' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string;
  column: TaskColumn;
  priority: TaskPriority;
  sort_index: number;
  parent_id: number | null;
  blocked_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: number;
  task_id: number;
  action: string;
  from_column: string | null;
  to_column: string | null;
  from_index: number | null;
  to_index: number | null;
  operator: string;
  detail: string | null;
  created_at: string;
}

export const COLUMNS: { id: TaskColumn; label: string; color: string }[] = [
  { id: 'todo', label: '待办', color: '#a5b4fc' },
  { id: 'doing', label: '进行中', color: '#fbbf24' },
  { id: 'done', label: '已完成', color: '#34d399' }
];
