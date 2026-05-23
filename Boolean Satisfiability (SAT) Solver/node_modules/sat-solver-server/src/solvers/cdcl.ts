import type { Clause, Variable, Decision, AnimationEvent, SolverStats } from '../types/index.js';

export class CDCLSolver {
  private clauses: Clause[] = [];
  private originalClauses: Clause[] = [];
  private learnedClauses: Clause[] = [];
  private variables: Map<number, Variable> = new Map();
  private decisions: Decision[] = [];
  private variableCount: number = 0;
  private currentLevel: number = 0;
  private step: number = 0;
  private conflicts: number = 0;
  private propagations: number = 0;
  private startTime: number = 0;
  private formulaId: number = 0;
  private status: 'idle' | 'running' | 'paused' | 'solved' | 'unsolved' | 'timeout' = 'idle';
  private animationEvents: AnimationEvent[] = [];
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private shouldStop: boolean = false;
  private onEvent: ((event: AnimationEvent) => void) | null = null;
  private nextClauseId: number = 1;
  private activityIncrement: number = 1;
  private decayFactor: number = 0.95;
  private vsidsScores: Map<number, number> = new Map();
  private restartLimit: number = 1000;
  private conflictLimit: number = 100;

  constructor() {}

  init(formulaId: number, variableCount: number, clauses: Clause[]): void {
    this.formulaId = formulaId;
    this.variableCount = variableCount;
    this.originalClauses = clauses.map(c => ({ ...c }));
    this.clauses = [...this.originalClauses];
    this.learnedClauses = [];
    this.decisions = [];
    this.currentLevel = 0;
    this.step = 0;
    this.conflicts = 0;
    this.propagations = 0;
    this.status = 'idle';
    this.animationEvents = [];
    this.isRunning = false;
    this.isPaused = false;
    this.shouldStop = false;
    this.nextClauseId = Math.max(...clauses.map(c => c.id)) + 1;

    this.variables.clear();
    for (let i = 1; i <= variableCount; i++) {
      this.variables.set(i, { value: 0, level: -1, reason: null });
      this.vsidsScores.set(i, 0);
    }
  }

  setOnEvent(callback: (event: AnimationEvent) => void): void {
    this.onEvent = callback;
  }

  private emitEvent(event: AnimationEvent): void {
    this.animationEvents.push(event);
    if (this.onEvent) {
      this.onEvent(event);
    }
  }

  private isVariableAssigned(var_: number): boolean {
    const v = this.variables.get(var_);
    return v !== undefined && v.value !== 0;
  }

  private getVariableValue(var_: number): 0 | 1 | -1 {
    const v = this.variables.get(var_);
    return v ? v.value : 0;
  }

  private assign(var_: number, value: 1 | -1, reason: Clause | null, level: number): void {
    const v = this.variables.get(var_);
    if (v) {
      v.value = value;
      v.level = level;
      v.reason = reason;
    }

    this.emitEvent({
      type: reason ? 'propagation' : 'decision',
      data: { variable: var_, value, level, clauseId: reason?.id },
      timestamp: Date.now()
    });
  }

  private unassign(var_: number): void {
    const v = this.variables.get(var_);
    if (v) {
      v.value = 0;
      v.level = -1;
      v.reason = null;
    }
  }

  private clauseSatisfied(clause: Clause): boolean {
    for (const lit of clause.literals) {
      const var_ = Math.abs(lit);
      const val = this.getVariableValue(var_);
      if ((lit > 0 && val === 1) || (lit < 0 && val === -1)) {
        return true;
      }
    }
    return false;
  }

  private clauseConflicted(clause: Clause): boolean {
    for (const lit of clause.literals) {
      const var_ = Math.abs(lit);
      const val = this.getVariableValue(var_);
      if (val === 0) return false;
    }
    return true;
  }

  private clauseUnsatisfiedLiterals(clause: Clause): Literal[] {
    return clause.literals.filter(lit => {
      const var_ = Math.abs(lit);
      const val = this.getVariableValue(var_);
      return !((lit > 0 && val === 1) || (lit < 0 && val === -1));
    });
  }

  private propagate(): Clause | null {
    let changed = true;
    while (changed) {
      changed = false;
      for (const clause of this.clauses) {
        if (this.clauseSatisfied(clause)) continue;
        if (this.clauseConflicted(clause)) {
          return clause;
        }
        const unsatisfied = this.clauseUnsatisfiedLiterals(clause);
        if (unsatisfied.length === 1) {
          const lit = unsatisfied[0];
          const var_ = Math.abs(lit);
          const value: 1 | -1 = lit > 0 ? 1 : -1;
          if (this.getVariableValue(var_) === 0) {
            this.assign(var_, value, clause, this.currentLevel);
            this.propagations++;
            changed = true;
          }
        }
      }
    }
    return null;
  }

  private selectVariable(): number | null {
    const unassigned: number[] = [];
    for (let i = 1; i <= this.variableCount; i++) {
      if (!this.isVariableAssigned(i)) {
        unassigned.push(i);
      }
    }
    if (unassigned.length === 0) return null;

    let bestVar = unassigned[0];
    let bestScore = this.vsidsScores.get(bestVar) || 0;

    for (const v of unassigned) {
      const score = this.vsidsScores.get(v) || 0;
      if (score > bestScore) {
        bestScore = score;
        bestVar = v;
      }
    }

    const value = Math.random() < 0.5 ? 1 : -1;
    return bestVar;
  }

  private analyze(conflictClause: Clause): { clause: Clause; level: number } {
    const seen = new Set<number>();
    const stack: { lit: Literal; clause: Clause | null }[] = [];
    
    for (const lit of conflictClause.literals) {
      stack.push({ lit, clause: conflictClause });
    }

    const learnedLiterals: Literal[] = [];
    let currentLevel = this.currentLevel;
    let numDecisions = 0;

    while (true) {
      if (stack.length === 0) break;

      const { lit, clause } = stack.pop()!;
      const var_ = Math.abs(lit);
      const v = this.variables.get(var_);

      if (v && !seen.has(var_) && clause) {
        seen.add(var_);

        if (v.reason !== null && v.level === this.currentLevel) {
          numDecisions++;
          for (const l of v.reason.literals) {
            if (Math.abs(l) !== var_) {
              stack.push({ lit: l, clause: v.reason });
            }
          }
        } else {
          learnedLiterals.push(lit);
          if (v.level > 0 && v.level < currentLevel) {
            currentLevel = v.level;
          }
        }
      }
    }

    const level = currentLevel > 0 ? currentLevel : 0;

    const learnedClause: Clause = {
      id: this.nextClauseId++,
      literals: learnedLiterals,
      isLearned: true,
      activity: 0,
      lbd: learnedLiterals.filter(l => {
        const v = this.variables.get(Math.abs(l));
        return v && v.level > level;
      }).length + 1,
      reason: 'conflict',
      level: this.currentLevel
    };

    return { clause: learnedClause, level };
  }

  private backtrack(targetLevel: number, learnedClause?: Clause): void {
    for (let i = this.decisions.length - 1; i >= 0; i--) {
      const decision = this.decisions[i];
      if (decision.level <= targetLevel) break;

      this.unassign(decision.variable);
      this.decisions.pop();

      this.emitEvent({
        type: 'backtrack',
        data: { variable: decision.variable, level: decision.level },
        timestamp: Date.now()
      });
    }

    this.currentLevel = targetLevel;

    if (learnedClause) {
      this.learnedClauses.push(learnedClause);
      this.clauses.push(learnedClause);

      this.emitEvent({
        type: 'learn',
        data: { learnedClause },
        timestamp: Date.now()
      });
    }
  }

  private decayActivities(): void {
    for (const clause of this.clauses) {
      clause.activity *= this.decayFactor;
    }
    for (const [var_, score] of this.vsidsScores) {
      this.vsidsScores.set(var_, score * this.decayFactor);
    }
  }

  private bumpClauseActivity(clause: Clause): void {
    clause.activity += this.activityIncrement;
    if (clause.isLearned) {
      for (const lit of clause.literals) {
        const var_ = Math.abs(lit);
        const current = this.vsidsScores.get(var_) || 0;
        this.vsidsScores.set(var_, current + this.activityIncrement);
      }
    }
  }

  private checkSatisfiability(): boolean {
    for (const clause of this.originalClauses) {
      if (!this.clauseSatisfied(clause)) {
        return false;
      }
    }
    for (const clause of this.originalClauses) {
      for (const lit of clause.literals) {
        this.emitEvent({
          type: 'satisfy',
          data: { variable: Math.abs(lit), value: lit > 0 ? 1 : -1 },
          timestamp: Date.now()
        });
      }
    }
    return true;
  }

  async solve(maxSteps: number = 10000, stepDelay: number = 0): Promise<{
    status: 'solved' | 'unsolved' | 'timeout';
    assignment?: Map<number, number>;
    stats: SolverStats;
  }> {
    this.startTime = Date.now();
    this.isRunning = true;
    this.isPaused = false;
    this.shouldStop = false;
    this.status = 'running';

    const maxTime = 30000;

    while (this.isRunning && !this.shouldStop) {
      if (this.step >= maxSteps) {
        this.status = 'timeout';
        this.isRunning = false;
        break;
      }

      if (Date.now() - this.startTime > maxTime) {
        this.status = 'timeout';
        this.isRunning = false;
        break;
      }

      const conflict = this.propagate();

      if (conflict) {
        this.conflicts++;
        this.bumpClauseActivity(conflict);

        this.emitEvent({
          type: 'conflict',
          data: { clauseId: conflict.id, level: this.currentLevel },
          timestamp: Date.now()
        });

        if (this.currentLevel === 0) {
          this.status = 'unsolved';
          this.isRunning = false;
          break;
        }

        const { clause: learnedClause, level } = this.analyze(conflict);
        this.backtrack(level, learnedClause);

        if (this.conflicts % this.conflictLimit === 0) {
          this.decayActivities();
        }
      } else {
        const allAssigned = Array.from(this.variables.values()).every(v => v.value !== 0);
        
        if (allAssigned) {
          const satisfied = this.checkSatisfiability();
          if (satisfied) {
            this.status = 'solved';
            this.isRunning = false;
            break;
          }
        }

        const var_ = this.selectVariable();
        if (var_ === null) {
          const satisfied = this.checkSatisfiability();
          this.status = satisfied ? 'solved' : 'unsolved';
          this.isRunning = false;
          break;
        }

        const value: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
        this.currentLevel++;
        
        this.decisions.push({ level: this.currentLevel, variable: var_, value });
        
        this.emitEvent({
          type: 'decision',
          data: { variable: var_, value, level: this.currentLevel },
          timestamp: Date.now()
        });

        this.assign(var_, value, null, this.currentLevel);
        this.step++;
      }

      if (stepDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }

      while (this.isPaused && !this.shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const assignment = new Map<number, number>();
    if (this.status === 'solved') {
      for (const [var_, v] of this.variables) {
        assignment.set(var_, v.value === 1 ? 1 : 0);
      }
    }

    return {
      status: this.status === 'solved' ? 'solved' : this.status === 'unsolved' ? 'unsolved' : 'timeout',
      assignment: this.status === 'solved' ? assignment : undefined,
      stats: this.getStats()
    };
  }

  pause(): void {
    this.isPaused = true;
    this.status = 'paused';
  }

  resume(): void {
    this.isPaused = false;
    this.status = 'running';
  }

  stop(): void {
    this.shouldStop = true;
    this.isRunning = false;
    this.isPaused = false;
    this.status = 'idle';
  }

  getStats(): SolverStats {
    const memUsage = process.memoryUsage();
    return {
      decisions: this.decisions.length,
      conflicts: this.conflicts,
      propagations: this.propagations,
      learnedClauses: this.learnedClauses.length,
      maxLevel: Math.max(...this.decisions.map(d => d.level), 0),
      memoryUsage: memUsage.heapUsed,
      elapsedTime: this.startTime > 0 ? Date.now() - this.startTime : 0
    };
  }

  getState(): {
    status: string;
    currentLevel: number;
    decisions: Decision[];
    learnedClauses: Clause[];
    animationEvents: AnimationEvent[];
  } {
    return {
      status: this.status,
      currentLevel: this.currentLevel,
      decisions: [...this.decisions],
      learnedClauses: [...this.learnedClauses],
      animationEvents: [...this.animationEvents]
    };
  }

  getVariables(): Map<number, Variable> {
    return new Map(this.variables);
  }

  getClauses(): Clause[] {
    return [...this.clauses];
  }
}

export const solver = new CDCLSolver();
