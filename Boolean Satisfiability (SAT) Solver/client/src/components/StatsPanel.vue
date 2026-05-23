<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSolverStore } from '@/stores/solverStore';
import { useAnimationStore } from '@/stores/animationStore';

const solverStore = useSolverStore();
const animationStore = useAnimationStore();

const memoryLevel = computed(() => {
  const mem = solverStore.stats.memoryUsage;
  const threshold = 100 * 1024 * 1024;
  const ratio = mem / threshold;
  if (ratio > 0.9) return 'critical';
  if (ratio > 0.8) return 'warning';
  return 'normal';
});

const memoryDisplay = computed(() => {
  const mb = solverStore.stats.memoryUsage / (1024 * 1024);
  return mb.toFixed(1) + ' MB';
});

const progressPercent = computed(() => {
  const maxSteps = 5000;
  const current = solverStore.stats.decisions + solverStore.stats.conflicts;
  return Math.min(100, (current / maxSteps) * 100);
});

const isTimeoutWarning = computed(() => {
  return solverStore.stats.elapsedTime > 25000;
});

const backtrackDepth = computed(() => {
  return solverStore.stats.maxLevel;
});

watch(() => solverStore.stats, (newStats) => {
  if (newStats.elapsedTime > 30000 && solverStore.status !== 'timeout') {
  }
}, { deep: true });
</script>

<template>
  <div class="stats-panel panel">
    <div class="panel__header">
      <h2>求解统计</h2>
      <span v-if="animationStore.isAnimating" class="running-indicator">
        <span class="pulse"></span>
        运行中
      </span>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-label">决策次数</span>
        <span class="stat-value stat-value--decision">{{ solverStore.stats.decisions }}</span>
      </div>

      <div class="stat-item">
        <span class="stat-label">冲突次数</span>
        <span class="stat-value stat-value--conflict">{{ solverStore.stats.conflicts }}</span>
      </div>

      <div class="stat-item">
        <span class="stat-label">传播次数</span>
        <span class="stat-value">{{ solverStore.stats.propagations }}</span>
      </div>

      <div class="stat-item">
        <span class="stat-label">学习子句</span>
        <span class="stat-value stat-value--learn">{{ solverStore.stats.learnedClauses }}</span>
      </div>

      <div class="stat-item">
        <span class="stat-label">最大层级</span>
        <span class="stat-value stat-value--level">{{ solverStore.stats.maxLevel }}</span>
      </div>

      <div class="stat-item">
        <span class="stat-label">运行时间</span>
        <span 
          class="stat-value stat-value--time"
          :class="{ 'time--warning': isTimeoutWarning }"
        >
          {{ (solverStore.stats.elapsedTime / 1000).toFixed(1) }}s
        </span>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-label">
        <span>搜索进度</span>
        <span>{{ progressPercent.toFixed(0) }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${progressPercent}%` }"
          :class="{ 'progress--warning': progressPercent > 80 }"
        ></div>
      </div>
    </div>

    <div class="memory-section" v-if="solverStore.stats.memoryUsage > 0">
      <div class="memory-header">
        <span class="memory-label">内存占用</span>
        <span 
          class="memory-value"
          :class="`memory--${memoryLevel}`"
        >
          {{ memoryDisplay }}
        </span>
      </div>
      <div class="memory-bar">
        <div 
          class="memory-fill"
          :class="`memory-fill--${memoryLevel}`"
          :style="{ width: `${Math.min(100, solverStore.stats.memoryUsage / (150 * 1024 * 1024) * 100)}%` }"
        ></div>
      </div>
    </div>

    <div class="backtrack-section">
      <div class="backtrack-header">
        <span class="backtrack-label">回溯深度</span>
        <span 
          class="backtrack-value"
          :class="{ 
            'backtrack--high': backtrackDepth > 20,
            'backtrack--critical': backtrackDepth > 50 
          }"
        >
          {{ backtrackDepth }}
        </span>
      </div>
    </div>

    <div v-if="isTimeoutWarning" class="warning-banner">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
      <span>求解时间过长，可能存在搜索空间爆炸</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stats-panel {
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
}

.running-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-satisfy);

  .pulse {
    width: 8px;
    height: 8px;
    background: var(--color-satisfy);
    border-radius: 50%;
    animation: pulse 1s ease-in-out infinite;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);

  &--decision {
    color: var(--color-node-decision);
  }

  &--conflict {
    color: var(--color-conflict);
  }

  &--learn {
    color: var(--color-warning);
  }

  &--level {
    color: var(--color-node-propagation);
  }

  &--time {
    &.time--warning {
      color: var(--color-warning);
      animation: pulse 1s ease-in-out infinite;
    }
  }
}

.progress-section {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.progress-bar {
  height: 6px;
  background: var(--color-bg-primary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-light) 100%);
  border-radius: 3px;
  transition: width 0.3s ease;

  &.progress--warning {
    background: linear-gradient(90deg, var(--color-warning) 0%, var(--color-conflict) 100%);
  }
}

.memory-section {
  margin-bottom: 16px;
}

.memory-header,
.backtrack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.memory-label,
.backtrack-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.memory-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;

  &.memory--normal {
    color: var(--color-satisfy);
  }

  &.memory--warning {
    color: var(--color-warning);
  }

  &.memory--critical {
    color: var(--color-conflict);
    animation: pulse 1s ease-in-out infinite;
  }
}

.memory-bar {
  height: 4px;
  background: var(--color-bg-primary);
  border-radius: 2px;
  overflow: hidden;
}

.memory-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;

  &--normal {
    background: var(--color-satisfy);
  }

  &--warning {
    background: var(--color-warning);
  }

  &--critical {
    background: var(--color-conflict);
  }
}

.backtrack-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  padding: 4px 10px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);

  &.backtrack--high {
    color: var(--color-warning);
    border-color: rgba(255, 165, 2, 0.3);
  }

  &.backtrack--critical {
    color: var(--color-conflict);
    border-color: rgba(255, 71, 87, 0.3);
    animation: pulse 1s ease-in-out infinite;
  }
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 165, 2, 0.15);
  border: 1px solid rgba(255, 165, 2, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-warning);
  font-size: 12px;
  animation: flash-yellow 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes flash-yellow {
  0%, 100% { background: rgba(255, 165, 2, 0.15); }
  50% { background: rgba(255, 165, 2, 0.25); }
}
</style>
