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
}

export interface SolverState {
  status: 'idle' | 'running' | 'paused' | 'solved' | 'unsolved' | 'timeout';
  variables: Map<number, Variable>;
  clauses: Clause[];
  decisions: Decision[];
  currentLevel: number;
  conflicts: number;
  propagations: number;
  learnedClauses: Clause[];
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

export interface Formula {
  id?: number;
  name?: string;
  dimacs: string;
  variableCount: number;
  clauseCount: number;
  clauses: Clause[];
}

export interface DecisionLog {
  id?: number;
  formulaId?: number;
  step: number;
  type: 'decision' | 'propagation' | 'conflict' | 'backtrack' | 'learn';
  variable?: number;
  value?: number;
  level: number;
  clauseId?: number;
  timestamp?: string;
}
