<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCluster } from '../composables/useCluster';
import { FileText, Check, X, Clock } from 'lucide-vue-next';

const { state } = useCluster();

const selectedNode = ref<number | null>(null);

const nodeLogs = computed(() => {
  if (selectedNode.value === null) return [];
  return state.logs[selectedNode.value] || [];
});

const logStats = computed(() => {
  const logs = nodeLogs.value;
  return {
    total: logs.length,
    committed: logs.filter(l => l.committed).length,
    applied: logs.filter(l => l.applied).length
  };
});

function getLogEntryColor(entry: { committed: boolean; applied: boolean }) {
  if (entry.applied) return 'bg-emerald-500/20 border-emerald-500/50';
  if (entry.committed) return 'bg-green-500/20 border-green-500/50';
  return 'bg-slate-500/20 border-slate-500/50';
}

function getLogStatusIcon(entry: { committed: boolean; applied: boolean }) {
  if (entry.applied) return Check;
  if (entry.committed) return Check;
  return Clock;
}

function getLogStatusText(entry: { committed: boolean; applied: boolean }) {
  if (entry.applied) return '已应用';
  if (entry.committed) return '已提交';
  return '未提交';
}
</script>

<template>
  <div class="logs-container bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-cyan-400 font-mono">日志详情</h2>
      <div class="flex gap-2">
        <button
          v-for="node in state.nodes"
          :key="node.id"
          @click="selectedNode = selectedNode === node.id ? null : node.id"
          class="px-2 py-1 text-xs rounded border transition-all"
          :class="selectedNode === node.id 
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
            : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50'"
        >
          节点 {{ node.id }}
        </button>
      </div>
    </div>

    <div v-if="selectedNode !== null" class="space-y-4">
      <div class="grid grid-cols-3 gap-2">
        <div class="stat-card">
          <span class="stat-label">总日志</span>
          <span class="stat-value text-slate-300">{{ logStats.total }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">已提交</span>
          <span class="stat-value text-green-400">{{ logStats.committed }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">已应用</span>
          <span class="stat-value text-emerald-400">{{ logStats.applied }}</span>
        </div>
      </div>

      <div class="logs-list max-h-64 overflow-y-auto space-y-2">
        <div
          v-for="log in nodeLogs.slice().reverse()"
          :key="log.logIndex"
          class="log-entry"
          :class="getLogEntryColor(log)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <component :is="getLogStatusIcon(log)" class="w-4 h-4" 
                :class="log.applied ? 'text-emerald-400' : log.committed ? 'text-green-400' : 'text-slate-500'" />
              <span class="text-xs font-mono text-slate-300">#{{ log.logIndex }}</span>
            </div>
            <span class="text-xs px-1.5 py-0.5 rounded"
              :class="log.applied ? 'bg-emerald-500/20 text-emerald-400' : log.committed ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'">
              {{ getLogStatusText(log) }}
            </span>
          </div>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-xs text-slate-400">任期:</span>
            <span class="text-xs font-mono text-cyan-400">{{ log.term }}</span>
            <span class="text-xs text-slate-400 ml-2">命令:</span>
            <span class="text-xs font-mono text-slate-300 truncate">{{ log.command }}</span>
          </div>
        </div>

        <div v-if="nodeLogs.length === 0" class="text-center py-8">
          <FileText class="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p class="text-sm text-slate-500">暂无日志记录</p>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <FileText class="w-8 h-8 text-slate-600 mx-auto mb-2" />
      <p class="text-sm text-slate-500">选择节点查看日志详情</p>
    </div>
  </div>
</template>

<style scoped>
.logs-container {
  width: 320px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 0.375rem;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.stat-label {
  font-size: 0.625rem;
  color: #64748b;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.log-entry {
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid;
  transition: all 0.2s;
}

.log-entry:hover {
  transform: translateX(2px);
}

.logs-list::-webkit-scrollbar {
  width: 4px;
}

.logs-list::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 2px;
}

.logs-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 2px;
}

.logs-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
