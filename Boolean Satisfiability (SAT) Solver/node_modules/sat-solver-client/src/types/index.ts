export type Literal = number;

export interface Clause {
  id: number;
  literals: Literal[];
  isLearned: boolean;
  activity: number;
  lbd: number;
  reason?: string;
  level?: number;
}

export interface Variable {
  value: 0 | 1 | -1;
  level: number;
  reason: Clause | null;
}

export interface Decision {
  level: number;
  variable: number;
  value: 1 | -1;
  clauseId?: number;
  children?: Decision[];
  x?: number;
  y?: number;
}

export interface AnimationEvent {
  type: 'decision' | 'propagation' | 'conflict' | 'backtrack' | 'learn' | 'satisfy';
  data: {
    variable?: number;
    value?: number;
    clauseId?: number;
    level?: number;
    learnedClause?: Clause;
  };
  timestamp: number;
}

export interface SolverStats {
  decisions: number;
  conflicts: number;
  propagations: number;
  learnedClauses: number;
  maxLevel: number;
  memoryUsage: number;
  elapsedTime: number;
}

export interface Formula {
  id?: number;
  name?: string;
  dimacs: string;
  variableCount: number;
  clauseCount: number;
  clauses: Clause[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
}

export type SolverStatus = 'idle' | 'running' | 'paused' | 'solved' | 'unsolved' | 'timeout';

export interface TreeNode {
  id: string;
  level: number;
  variable: number;
  value: 1 | -1;
  type: 'decision' | 'propagation' | 'conflict';
  x: number;
  y: number;
  children: TreeNode[];
  parent: TreeNode | null;
  isSatisfied?: boolean;
  isBacktracked?: boolean;
}

export type AnimationType = 
  | 'decision_branch'
  | 'satisfaction_check'
  | 'conflict_flash'
  | 'backtrack_erase'
  | 'variable_switch'
  | 'learned_clause_add';

export interface Animation {
  id: string;
  type: AnimationType;
  target: string;
  duration: number;
  easing: string;
}
