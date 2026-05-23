<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSolverStore } from '@/stores/solverStore';

const solverStore = useSolverStore();

const inputMode = ref<'cnf' | 'dimacs'>('cnf');
const formulaInput = ref('');
const speed = ref<'slow' | 'normal' | 'fast'>('normal');

const canStart = computed(() => {
  return solverStore.formula !== null && solverStore.isIdle;
});

const canControl = computed(() => {
  return solverStore.formula !== null && !solverStore.isIdle;
});

function handleParse() {
  if (!formulaInput.value.trim()) return;
  solverStore.parseFormula(formulaInput.value, inputMode.value);
}

function handleRun() {
  solverStore.runSolver(speed.value);
}

function handlePause() {
  solverStore.pauseSolver();
}

function handleResume() {
  solverStore.resumeSolver();
}

function handleStop() {
  solverStore.stopSolver();
}

function handleReset() {
  solverStore.resetState();
}

function insertExample() {
  if (inputMode.value === 'cnf') {
    formulaInput.value = 'x1 OR x2\nx1 OR -x2\n-x1 OR x3';
  } else {
    formulaInput.value = `p cnf 3 3
1 2 0
1 -2 0
-1 3 0`;
  }
}
</script>

<template>
  <div class="input-panel panel">
    <div class="panel__header">
      <h2>公式输入</h2>
      <div class="mode-toggle">
        <button
          :class="['mode-btn', { active: inputMode === 'cnf' }]"
          @click="inputMode = 'cnf'"
        >
          手动输入
        </button>
        <button
          :class="['mode-btn', { active: inputMode === 'dimacs' }]"
          @click="inputMode = 'dimacs'"
        >
          DIMACS
        </button>
      </div>
    </div>

    <div class="input-section">
      <div class="input-wrapper">
        <textarea
          v-model="formulaInput"
          :placeholder="inputMode === 'cnf' 
            ? '输入 CNF 公式，每行一个子句\n例如：x1 OR x2 OR -x3\n或者：1 2 -3' 
            : '输入 DIMACS CNF 格式\n例如：\np cnf 3 3\n1 2 0\n1 -2 0\n-1 3 0'"
          class="formula-input"
          rows="8"
        ></textarea>
        <button class="btn btn--ghost btn--icon insert-btn" @click="insertExample" title="插入示例">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="action-row">
      <button class="btn btn--primary" @click="handleParse" :disabled="!formulaInput.trim()">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
        解析
      </button>
    </div>

    <div v-if="solverStore.formula" class="formula-info">
      <div class="info-row">
        <span class="info-label">变量数</span>
        <span class="info-value">{{ solverStore.formula.variableCount }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">子句数</span>
        <span class="info-value">{{ solverStore.formula.clauseCount }}</span>
      </div>
    </div>

    <div class="control-section">
      <h3>求解控制</h3>
      
      <div class="speed-control">
        <span class="speed-label">执行速度</span>
        <div class="speed-buttons">
          <button
            v-for="s in ['slow', 'normal', 'fast']"
            :key="s"
            :class="['speed-btn', { active: speed === s }]"
            @click="speed = s as any"
          >
            {{ s === 'slow' ? '慢速' : s === 'normal' ? '中速' : '快速' }}
          </button>
        </div>
      </div>

      <div class="control-buttons">
        <button
          v-if="solverStore.isIdle"
          class="btn btn--success"
          :disabled="!canStart"
          @click="handleRun"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M8 5v14l11-7z"/>
          </svg>
          开始求解
        </button>

        <template v-else>
          <button
            v-if="solverStore.isRunning"
            class="btn btn--warning"
            @click="handlePause"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            暂停
          </button>

          <button
            v-if="solverStore.isPaused"
            class="btn btn--success"
            @click="handleResume"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            继续
          </button>

          <button class="btn btn--danger" @click="handleStop">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 6h12v12H6z"/>
            </svg>
            停止
          </button>
        </template>

        <button class="btn btn--ghost" @click="handleReset" :disabled="solverStore.isRunning">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.input-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.mode-toggle {
  display: flex;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  padding: 2px;
}

.mode-btn {
  padding: 6px 12px;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 12px;
  transition: all 0.2s;

  &.active {
    background: var(--color-accent);
    color: white;
  }

  &:hover:not(.active) {
    color: var(--color-text-primary);
  }
}

.input-section {
  flex: 1;
}

.input-wrapper {
  position: relative;
}

.formula-input {
  width: 100%;
  min-height: 180px;
  padding: 14px;
  padding-right: 48px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);

  &:focus {
    outline: none;
    border-color: var(--color-accent-light);
    box-shadow: 0 0 0 3px rgba(79, 159, 255, 0.1);
  }
}

.insert-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-bg-secondary);
}

.action-row {
  display: flex;
  gap: 8px;
}

.formula-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.control-section {
  border-top: 1px solid var(--color-border);
  padding-top: 20px;

  h3 {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: 16px;
  }
}

.speed-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.speed-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.speed-buttons {
  display: flex;
  gap: 4px;
  background: var(--color-bg-primary);
  padding: 2px;
  border-radius: var(--radius-md);
}

.speed-btn {
  padding: 6px 14px;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 12px;

  &.active {
    background: var(--color-accent);
    color: white;
  }

  &:hover:not(.active) {
    color: var(--color-text-primary);
  }
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .btn {
    flex: 1;
    min-width: 100px;
  }
}
</style>
