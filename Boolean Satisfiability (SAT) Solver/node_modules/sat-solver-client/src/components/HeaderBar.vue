<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSolverStore } from '@/stores/solverStore';

const solverStore = useSolverStore();
const presets = ref<{ id: string; name: string; description: string }[]>([]);
const activePreset = ref<string | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('/api/presets');
    presets.value = await response.json();
  } catch (e) {
    console.error('Failed to load presets:', e);
  }
});

function selectPreset(presetId: string) {
  activePreset.value = presetId;
  solverStore.loadPreset(presetId);
}

function getPresetIcon(presetId: string): string {
  const icons: Record<string, string> = {
    unsatisfiable: '⊥',
    explosion: '💥',
    unitPropagation: '⛓',
    pureLiteral: '✨'
  };
  return icons[presetId] || '📋';
}
</script>

<template>
  <header class="header">
    <div class="header__brand">
      <div class="header__logo">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="header__title">
        <h1>SAT 求解器可视化系统</h1>
        <span class="header__subtitle">基于 CDCL 算法的布尔可满足性问题求解</span>
      </div>
    </div>

    <div class="header__presets">
      <span class="presets__label">预设场景：</span>
      <div class="presets__buttons">
        <button
          v-for="preset in presets"
          :key="preset.id"
          :class="['btn', 'btn--preset', { active: activePreset === preset.id }]"
          @click="selectPreset(preset.id)"
          :title="preset.description"
        >
          <span class="preset__icon">{{ getPresetIcon(preset.id) }}</span>
          <span class="preset__name">{{ preset.name.split('：')[0] }}</span>
        </button>
      </div>
    </div>

    <div class="header__status">
      <div v-if="solverStore.isLoading" class="status-badge status-badge--loading">
        <span class="spinner"></span>
        加载中
      </div>
      <div v-else-if="solverStore.error" class="status-badge status-badge--error">
        {{ solverStore.error }}
      </div>
      <div v-else-if="solverStore.isSolved" class="status-badge status-badge--success">
        ✓ 满足 (SAT)
      </div>
      <div v-else-if="solverStore.isUnsolved" class="status-badge status-badge--danger">
        ✗ 不满足 (UNSAT)
      </div>
      <div v-else-if="solverStore.isTimeout" class="status-badge status-badge--warning">
        ⏱ 超时
      </div>
      <div v-else-if="solverStore.isRunning" class="status-badge status-badge--running">
        <span class="spinner"></span>
        运行中
      </div>
      <div v-else class="status-badge status-badge--idle">
        ◯ 就绪
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  gap: 24px;
  flex-wrap: wrap;
}

.header__brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header__logo {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%);
  border-radius: var(--radius-lg);
  color: white;
}

.header__title {
  h1 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
}

.header__subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
}

.header__presets {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.presets__label {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.presets__buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset__icon {
  font-size: 16px;
}

.preset__name {
  font-size: 12px;
}

.header__status {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-mono);

  &--idle {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  &--loading,
  &--running {
    background: rgba(74, 158, 255, 0.15);
    color: #4a9eff;
    border: 1px solid rgba(74, 158, 255, 0.3);
  }

  &--success {
    background: rgba(0, 217, 160, 0.15);
    color: var(--color-satisfy);
    border: 1px solid rgba(0, 217, 160, 0.3);
  }

  &--danger {
    background: rgba(255, 71, 87, 0.15);
    color: var(--color-conflict);
    border: 1px solid rgba(255, 71, 87, 0.3);
  }

  &--warning {
    background: rgba(255, 165, 2, 0.15);
    color: var(--color-warning);
    border: 1px solid rgba(255, 165, 2, 0.3);
  }

  &--error {
    background: rgba(255, 71, 87, 0.1);
    color: var(--color-conflict);
    font-size: 12px;
  }
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .header {
    padding: 12px 16px;
  }

  .header__presets {
    width: 100%;
    order: 3;
    justify-content: center;
  }

  .presets__buttons {
    justify-content: center;
  }
}
</style>
