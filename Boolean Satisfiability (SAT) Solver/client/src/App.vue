<script setup lang="ts">
import { ref } from 'vue';
import { useSolverStore } from '@/stores/solverStore';
import HeaderBar from '@/components/HeaderBar.vue';
import InputPanel from '@/components/InputPanel.vue';
import DecisionTree from '@/components/DecisionTree.vue';
import VariablePanel from '@/components/VariablePanel.vue';
import StatsPanel from '@/components/StatsPanel.vue';
import LogViewer from '@/components/LogViewer.vue';

const solverStore = useSolverStore();
const activeTab = ref<'tree' | 'clauses' | 'logs'>('tree');
</script>

<template>
  <div class="app">
    <HeaderBar />
    
    <main class="main-content">
      <aside class="sidebar">
        <InputPanel />
      </aside>
      
      <section class="visualization">
        <DecisionTree v-if="activeTab === 'tree'" />
        <LogViewer v-else-if="activeTab === 'logs'" />
      </section>
      
      <aside class="info-panel">
        <VariablePanel />
        <StatsPanel />
      </aside>
    </main>
    
    <nav class="bottom-nav">
      <button 
        :class="['nav-btn', { active: activeTab === 'tree' }]"
        @click="activeTab = 'tree'"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        决策树
      </button>
      <button 
        :class="['nav-btn', { active: activeTab === 'logs' }]"
        @click="activeTab = 'logs'"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M3 3v18h18v-18H3zm16 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
        </svg>
        日志
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 380px 1fr 320px;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.sidebar {
  overflow-y: auto;
}

.visualization {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.bottom-nav {
  display: none;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: 8px 16px;

  @media (max-width: 1024px) {
    display: flex;
    justify-content: center;
    gap: 16px;
  }
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 14px;

  &.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .sidebar,
  .info-panel {
    display: none;
  }

  .visualization {
    grid-row: 2;
  }
}
</style>
