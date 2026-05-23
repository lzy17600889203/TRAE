<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSolverStore } from '@/stores/solverStore';

const solverStore = useSolverStore();
const filterType = ref<string>('all');

const filteredLogs = computed(() => {
  const events = solverStore.animationEvents;
  if (filterType.value === 'all') return events;
  return events.filter(e => e.type === filterType.value);
});

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    decision: 'D',
    propagation: 'P',
    conflict: 'X',
    backtrack: 'B',
    learn: 'L',
    satisfy: '✓'
  };
  return icons[type] || '?';
}

function getEventClass(type: string): string {
  const classes: Record<string, string> = {
    decision: 'log--decision',
    propagation: 'log--propagation',
    conflict: 'log--conflict',
    backtrack: 'log--backtrack',
    learn: 'log--learn',
    satisfy: 'log--satisfy'
  };
  return classes[type] || '';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

function getEventDescription(event: any): string {
  switch (event.type) {
    case 'decision':
      return `决策: x${event.data.variable} = ${event.data.value === 1 ? 'True' : 'False'} (层级 ${event.data.level})`;
    case 'propagation':
      return `传播: x${event.data.variable} = ${event.data.value === 1 ? 'True' : 'False'}`;
    case 'conflict':
      return `冲突: 子句 #${event.data.clauseId} 冲突`;
    case 'backtrack':
      return `回溯: 从层级 ${event.data.level} 回退`;
    case 'learn':
      return `学习: 新子句 [${event.data.learnedClause?.literals.map((l: number) => l > 0 ? `x${l}` : `¬x${Math.abs(l)}`).join(', ')}]`;
    case 'satisfy':
      return `满足: x${event.data.variable} = ${event.data.value === 1 ? 'True' : 'False'}`;
    default:
      return '未知事件';
  }
}
</script>

<template>
  <div class="log-viewer">
    <div class="log-header">
      <h2>搜索日志</h2>
      <div class="log-filter">
        <button
          v-for="type in ['all', 'decision', 'propagation', 'conflict', 'backtrack', 'learn']"
          :key="type"
          :class="['filter-btn', { active: filterType === type }]"
          @click="filterType = type"
        >
          {{ type === 'all' ? '全部' : 
             type === 'decision' ? '决策' :
             type === 'propagation' ? '传播' :
             type === 'conflict' ? '冲突' :
             type === 'backtrack' ? '回溯' : '学习' }}
        </button>
      </div>
    </div>

    <div class="log-list">
      <div
        v-for="(event, index) in filteredLogs"
        :key="index"
        :class="['log-item', getEventClass(event.type)]"
      >
        <span class="log-icon">{{ getEventIcon(event.type) }}</span>
        <div class="log-content">
          <span class="log-desc">{{ getEventDescription(event) }}</span>
          <span class="log-time">{{ formatTime(event.timestamp) }}</span>
        </div>
      </div>

      <div v-if="filteredLogs.length === 0" class="empty-state">
        <span>暂无日志记录</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-secondary);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--color-border);

  h2 {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
}

.log-filter {
  display: flex;
  gap: 4px;
}

.filter-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 11px;
  transition: all 0.2s;

  &:hover {
    color: var(--color-text-secondary);
    border-color: var(--color-accent);
  }

  &.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }
}

.log-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-border);
  animation: slideIn 0.2s ease-out;

  &.log--decision {
    border-left-color: var(--color-node-decision);
    
    .log-icon {
      background: var(--color-node-decision);
    }
  }

  &.log--propagation {
    border-left-color: var(--color-node-propagation);
    
    .log-icon {
      background: var(--color-node-propagation);
    }
  }

  &.log--conflict {
    border-left-color: var(--color-conflict);
    
    .log-icon {
      background: var(--color-conflict);
    }
  }

  &.log--backtrack {
    border-left-color: var(--color-warning);
    
    .log-icon {
      background: var(--color-warning);
    }
  }

  &.log--learn {
    border-left-color: var(--color-satisfy);
    
    .log-icon {
      background: var(--color-satisfy);
    }
  }

  &.log--satisfy {
    border-left-color: var(--color-satisfy);
    
    .log-icon {
      background: var(--color-satisfy);
    }
  }
}

.log-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.log-desc {
  font-size: 13px;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  word-break: break-all;
}

.log-time {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-muted);
  font-size: 13px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
