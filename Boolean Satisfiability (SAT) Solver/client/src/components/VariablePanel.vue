<script setup lang="ts">
import { computed } from 'vue';
import { useSolverStore } from '@/stores/solverStore';
import { useAnimationStore } from '@/stores/animationStore';

const solverStore = useSolverStore();
const animationStore = useAnimationStore();

const variables = computed(() => {
  if (!solverStore.formula) return [];
  
  const vars: { id: number; value: 0 | 1 | -1; level: number }[] = [];
  for (let i = 1; i <= solverStore.formula.variableCount; i++) {
    const v = solverStore.variables.get(i);
    vars.push({
      id: i,
      value: v?.value || 0,
      level: v?.level || -1
    });
  }
  return vars;
});

function isVariableAnimating(varId: number): boolean {
  return animationStore.pendingAnimations.some(
    a => a.target === `variable-${varId}` && a.type === 'variable_switch'
  );
}

function getVariableClass(varItem: { id: number; value: 0 | 1 | -1 }): string {
  if (isVariableAnimating(varItem.id)) {
    return 'var--animating';
  }
  
  if (varItem.value === 1) return 'var--true';
  if (varItem.value === -1) return 'var--false';
  return 'var--unassigned';
}

function getVariableLabel(varItem: { value: 0 | 1 | -1 }): string {
  if (varItem.value === 1) return 'T';
  if (varItem.value === -1) return 'F';
  return '?';
}

function getVariableColor(varItem: { value: 0 | 1 | -1 }): string {
  if (varItem.value === 1) return 'var(--color-satisfy)';
  if (varItem.value === -1) return 'var(--color-conflict)';
  return 'var(--color-text-muted)';
}
</script>

<template>
  <div class="variable-panel panel">
    <div class="panel__header">
      <h2>变量状态</h2>
      <span class="var-count">{{ variables.length }} 个变量</span>
    </div>

    <div class="variables-grid">
      <div
        v-for="varItem in variables"
        :key="varItem.id"
        :class="['variable', getVariableClass(varItem)]"
      >
        <span class="var-name">x{{ varItem.id }}</span>
        <div 
          class="var-toggle"
          :style="{ '--toggle-color': getVariableColor(varItem) }"
        >
          <span class="var-label">{{ getVariableLabel(varItem) }}</span>
        </div>
      </div>

      <div v-if="variables.length === 0" class="empty-state">
        <span>加载公式后显示变量</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.variable-panel {
  .panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
  }

  .var-count {
    font-size: 12px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
}

.variables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
}

.variable {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.var--true {
    border-color: rgba(0, 217, 160, 0.3);
    background: rgba(0, 217, 160, 0.1);

    .var-toggle {
      background: var(--color-satisfy);
    }
  }

  &.var--false {
    border-color: rgba(255, 71, 87, 0.3);
    background: rgba(255, 71, 87, 0.1);

    .var-toggle {
      background: var(--color-conflict);
    }
  }

  &.var--unassigned {
    .var-toggle {
      background: var(--color-border);
    }
  }

  &.var--animating {
    animation: varBounce 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
}

.var-name {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.var-toggle {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.25s ease;
}

.var-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: white;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
  font-size: 13px;
}

@keyframes varBounce {
  0% { transform: scale(1); }
  30% { transform: scale(0.9); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
</style>
