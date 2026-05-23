<script setup lang="ts">
import { onMounted } from 'vue';
import ControlPanel from '../components/ControlPanel.vue';
import ClusterVisualization from '../components/ClusterVisualization.vue';
import EventTimeline from '../components/EventTimeline.vue';
import LogDetails from '../components/LogDetails.vue';
import { useCluster } from '../composables/useCluster';

const { state, fetchScenarios, createCluster } = useCluster();

onMounted(async () => {
  await fetchScenarios();
  await createCluster(5);
});
</script>

<template>
  <div class="app-container min-h-screen bg-slate-950 flex flex-col">
    <header class="app-header bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span class="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-cyan-400 font-mono">Raft 一致性协议模拟器</h1>
            <p class="text-xs text-slate-500">分布式一致性协议教学平台</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <span class="text-xs text-slate-400">状态:</span>
            <span :class="state.isRunning ? (state.isPaused ? 'text-yellow-400' : 'text-green-400') : 'text-slate-500'" class="text-xs font-medium">
              {{ state.isRunning ? (state.isPaused ? '已暂停' : '运行中') : '未启动' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 flex gap-4 p-4 overflow-hidden">
      <aside class="flex-shrink-0">
        <ControlPanel />
      </aside>

      <section class="flex-1 flex flex-col gap-4 min-w-0">
        <div class="flex-1 min-h-0">
          <ClusterVisualization />
        </div>
        <div class="h-64">
          <LogDetails />
        </div>
      </section>

      <aside class="flex-shrink-0">
        <EventTimeline />
      </aside>
    </main>

    <footer class="app-footer bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 px-6 py-2">
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span>Raft Consensus Algorithm Simulator</span>
        <span>节点: {{ state.nodes.length }} | 任期: {{ state.currentTerm }} | Leader: {{ state.leaderId !== null ? `节点 ${state.leaderId}` : '无' }}</span>
      </div>
    </footer>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap');

body {
  font-family: 'JetBrains Mono', monospace;
}

.app-container {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}
</style>
