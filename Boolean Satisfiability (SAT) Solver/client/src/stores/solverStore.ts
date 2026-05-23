import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Clause, Variable, Decision, AnimationEvent, SolverStats, Formula, SolverStatus, TreeNode } from '@/types';

const API_BASE = '/api';

export const useSolverStore = defineStore('solver', () => {
  const status = ref<SolverStatus>('idle');
  const formula = ref<Formula | null>(null);
  const clauses = ref<Clause[]>([]);
  const variables = ref<Map<number, Variable>>(new Map());
  const decisions = ref<Decision[]>([]);
  const learnedClauses = ref<Clause[]>([]);
  const animationEvents = ref<AnimationEvent[]>([]);
  const stats = ref<SolverStats>({
    decisions: 0,
    conflicts: 0,
    propagations: 0,
    learnedClauses: 0,
    maxLevel: 0,
    memoryUsage: 0,
    elapsedTime: 0
  });
  const treeNodes = ref<TreeNode[]>([]);
  const currentFormulaId = ref<number | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isRunning = computed(() => status.value === 'running');
  const isPaused = computed(() => status.value === 'paused');
  const isSolved = computed(() => status.value === 'solved');
  const isUnsolved = computed(() => status.value === 'unsolved');
  const isTimeout = computed(() => status.value === 'timeout');
  const isIdle = computed(() => status.value === 'idle');

  async function loadPreset(presetId: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`${API_BASE}/presets/${presetId}`);
      if (!response.ok) throw new Error('Failed to load preset');
      
      const data: Formula = await response.json();
      formula.value = data;
      clauses.value = data.clauses;
      currentFormulaId.value = data.id;
      
      await initSolver();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  }

  async function parseFormula(input: string, format: 'cnf' | 'dimacs' = 'cnf') {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`${API_BASE}/formula/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula: input, format })
      });
      
      if (!response.ok) throw new Error('Failed to parse formula');
      
      const data: Formula = await response.json();
      formula.value = data;
      clauses.value = data.clauses;
      currentFormulaId.value = data.id;
      
      await initSolver();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  }

  async function initSolver() {
    if (!formula.value) return;
    
    try {
      const response = await fetch(`${API_BASE}/solver/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formulaId: currentFormulaId.value,
          variableCount: formula.value.variableCount,
          clauses: clauses.value
        })
      });
      
      if (!response.ok) throw new Error('Failed to initialize solver');
      
      resetState();
      status.value = 'idle';
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    }
  }

  async function runSolver(speed: 'slow' | 'normal' | 'fast' = 'normal') {
    if (status.value === 'running') return;
    
    const delays = { slow: 100, normal: 20, fast: 0 };
    
    try {
      status.value = 'running';
      
      const response = await fetch(`${API_BASE}/solver/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxSteps: 5000,
          stepDelay: delays[speed]
        })
      });
      
      if (!response.ok) throw new Error('Solver execution failed');
      
      const result = await response.json();
      
      status.value = result.status;
      animationEvents.value = result.animationEvents || [];
      stats.value = result.stats;
      learnedClauses.value = result.learnedClauses || [];
      
      buildTreeFromEvents();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      status.value = 'idle';
    }
  }

  async function pauseSolver() {
    try {
      await fetch(`${API_BASE}/solver/pause`, { method: 'POST' });
      status.value = 'paused';
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    }
  }

  async function resumeSolver() {
    try {
      await fetch(`${API_BASE}/solver/resume`, { method: 'POST' });
      status.value = 'running';
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    }
  }

  async function stopSolver() {
    try {
      await fetch(`${API_BASE}/solver/stop`, { method: 'POST' });
      status.value = 'idle';
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    }
  }

  async function fetchState() {
    try {
      const response = await fetch(`${API_BASE}/solver/state`);
      if (!response.ok) return;
      
      const data = await response.json();
      variables.value = new Map(Object.entries(data.variables).map(([k, v]) => [parseInt(k), v as Variable]));
      decisions.value = data.decisions;
      learnedClauses.value = data.learnedClauses;
      stats.value = data.stats;
      animationEvents.value = data.animationEvents;
    } catch (e) {
      console.error('Failed to fetch state:', e);
    }
  }

  function buildTreeFromEvents() {
    const root: TreeNode = {
      id: 'root',
      level: 0,
      variable: 0,
      value: 1,
      type: 'decision',
      x: 0,
      y: 0,
      children: [],
      parent: null
    };

    const levelNodes: Map<number, TreeNode[]> = new Map();
    levelNodes.set(0, [root]);

    let currentParent = root;
    let currentLevel = 0;

    for (const event of animationEvents.value) {
      if (event.type === 'decision') {
        currentLevel = event.data.level || currentLevel + 1;
        
        const node: TreeNode = {
          id: `decision-${event.timestamp}`,
          level: currentLevel,
          variable: event.data.variable!,
          value: event.data.value as 1 | -1,
          type: 'decision',
          x: 0,
          y: currentLevel * 60,
          children: [],
          parent: currentParent
        };

        const nodesAtLevel = levelNodes.get(currentLevel) || [];
        nodesAtLevel.push(node);
        levelNodes.set(currentLevel, nodesAtLevel);

        currentParent.children.push(node);
        currentParent = node;
      } else if (event.type === 'propagation') {
        const node: TreeNode = {
          id: `prop-${event.timestamp}`,
          level: currentLevel,
          variable: event.data.variable!,
          value: event.data.value as 1 | -1,
          type: 'propagation',
          x: 0,
          y: currentLevel * 60,
          children: [],
          parent: currentParent
        };

        currentParent.children.push(node);
      } else if (event.type === 'conflict') {
        const node: TreeNode = {
          id: `conflict-${event.timestamp}`,
          level: currentLevel,
          variable: 0,
          value: -1,
          type: 'conflict',
          x: 0,
          y: currentLevel * 60,
          children: [],
          parent: currentParent
        };

        currentParent.children.push(node);
      } else if (event.type === 'backtrack') {
        if (currentParent.parent) {
          currentParent = currentParent.parent;
          currentLevel--;
        }
      }
    }

    treeNodes.value = flattenTree(root);
    calculateNodePositions();
  }

  function flattenTree(node: TreeNode): TreeNode[] {
    const result: TreeNode[] = [node];
    for (const child of node.children) {
      result.push(...flattenTree(child));
    }
    return result;
  }

  function calculateNodePositions() {
    const levelWidth = 80;
    const levelNodes: Map<number, TreeNode[]> = new Map();

    for (const node of treeNodes.value) {
      const nodes = levelNodes.get(node.level) || [];
      nodes.push(node);
      levelNodes.set(node.level, nodes);
    }

    for (const [level, nodes] of levelNodes) {
      const startX = -(nodes.length - 1) * levelWidth / 2;
      nodes.forEach((node, index) => {
        node.x = startX + index * levelWidth;
        node.y = level * 60 + 40;
      });
    }
  }

  function resetState() {
    decisions.value = [];
    learnedClauses.value = [];
    animationEvents.value = [];
    stats.value = {
      decisions: 0,
      conflicts: 0,
      propagations: 0,
      learnedClauses: 0,
      maxLevel: 0,
      memoryUsage: 0,
      elapsedTime: 0
    };
    treeNodes.value = [];
    variables.value = new Map();
  }

  function setVariableValue(var_: number, value: 0 | 1 | -1) {
    variables.value.set(var_, { value, level: 0, reason: null });
  }

  return {
    status,
    formula,
    clauses,
    variables,
    decisions,
    learnedClauses,
    animationEvents,
    stats,
    treeNodes,
    currentFormulaId,
    isLoading,
    error,
    isRunning,
    isPaused,
    isSolved,
    isUnsolved,
    isTimeout,
    isIdle,
    loadPreset,
    parseFormula,
    initSolver,
    runSolver,
    pauseSolver,
    resumeSolver,
    stopSolver,
    fetchState,
    resetState,
    setVariableValue
  };
});
