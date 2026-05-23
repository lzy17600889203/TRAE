<script setup lang="ts">
import { ref, watch } from 'vue';
import { Play, Pause, RotateCcw, Zap, Split, Skull, FileWarning, Shuffle, Send, Wifi } from 'lucide-vue-next';
import { useCluster } from '../composables/useCluster';
import type { ClusterConfig } from '../../shared/types';

const { state, createCluster, loadScenario, start, pause, resume, reset, sendCommand, healNetwork, setSpeed } = useCluster();

const nodeCount = ref(5);
const minLatency = ref(50);
const maxLatency = ref(200);
const failureProbability = ref(0);
const speed = ref(1);
const customCommand = ref('');

const scenarios = [
  { name: 'network_split', description: '网络分区脑裂', icon: Split, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { name: 'leader_crash', description: 'Leader频繁崩溃', icon: Skull, color: 'text-red-400', bg: 'bg-red-500/20' },
  { name: 'log_inconsistency', description: '日志不一致', icon: FileWarning, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { name: 'message_disorder', description: '消息乱序延迟', icon: Shuffle, color: 'text-blue-400', bg: 'bg-blue-500/20' }
];

async function handleCreateCluster() {
  const config: Partial<ClusterConfig> = {
    minLatency: minLatency.value,
    maxLatency: maxLatency.value,
    failureProbability: failureProbability.value / 100
  };
  await createCluster(nodeCount.value, config);
}

async function handleLoadScenario(name: string) {
  await loadScenario(name);
}

function handleSendCommand() {
  if (customCommand.value.trim()) {
    sendCommand(customCommand.value);
    customCommand.value = '';
  } else {
    sendCommand();
  }
}

function handleSpeedChange() {
  setSpeed(speed.value);
}

watch(speed, handleSpeedChange);
</script>

<template>
  <div class="control-panel bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 space-y-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-bold text-cyan-400 font-mono">控制面板</h2>
      <div class="flex items-center gap-2">
        <span :class="state.isConnected ? 'text-green-400' : 'text-red-400'" class="text-xs">
          <span :class="state.isConnected ? 'bg-green-500' : 'bg-red-500'" class="inline-block w-2 h-2 rounded-full mr-1 animate-pulse"></span>
          {{ state.isConnected ? '已连接' : '未连接' }}
        </span>
      </div>
    </div>

    <div class="section">
      <label class="section-label">集群配置</label>
      <div class="grid grid-cols-2 gap-3">
        <div class="input-group">
          <label class="input-label">节点数量</label>
          <input v-model.number="nodeCount" type="number" min="3" max="9" class="config-input" />
        </div>
        <div class="input-group">
          <label class="input-label">故障概率 (%)</label>
          <input v-model.number="failureProbability" type="number" min="0" max="50" class="config-input" />
        </div>
        <div class="input-group">
          <label class="input-label">最小延迟 (ms)</label>
          <input v-model.number="minLatency" type="number" min="10" max="500" class="config-input" />
        </div>
        <div class="input-group">
          <label class="input-label">最大延迟 (ms)</label>
          <input v-model.number="maxLatency" type="number" min="10" max="1000" class="config-input" />
        </div>
      </div>
      <button @click="handleCreateCluster" class="w-full mt-3 btn-primary">
        <Zap class="w-4 h-4" />
        创建集群
      </button>
    </div>

    <div class="section">
      <label class="section-label">预设场景</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="scenario in scenarios"
          :key="scenario.name"
          @click="handleLoadScenario(scenario.name)"
          class="scenario-btn"
          :class="scenario.bg"
        >
          <component :is="scenario.icon" class="w-4 h-4" :class="scenario.color" />
          <span class="text-xs text-slate-300">{{ scenario.description }}</span>
        </button>
      </div>
    </div>

    <div class="section">
      <label class="section-label">模拟控制</label>
      <div class="flex gap-2">
        <button
          v-if="!state.isRunning"
          @click="start"
          class="flex-1 btn-success"
        >
          <Play class="w-4 h-4" />
          启动
        </button>
        <template v-else>
          <button
            v-if="!state.isPaused"
            @click="pause"
            class="flex-1 btn-warning"
          >
            <Pause class="w-4 h-4" />
            暂停
          </button>
          <button
            v-else
            @click="resume"
            class="flex-1 btn-success"
          >
            <Play class="w-4 h-4" />
            继续
          </button>
        </template>
        <button @click="reset" class="btn-danger">
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>

      <div class="mt-3">
        <label class="input-label">模拟速度: {{ speed }}x</label>
        <input
          v-model.number="speed"
          type="range"
          min="0.5"
          max="3"
          step="0.5"
          class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>
    </div>

    <div class="section">
      <label class="section-label">客户端请求</label>
      <div class="flex gap-2">
        <input
          v-model="customCommand"
          type="text"
          placeholder="输入命令..."
          class="flex-1 config-input"
          @keyup.enter="handleSendCommand"
        />
        <button @click="handleSendCommand" class="btn-primary">
          <Send class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="section">
      <label class="section-label">网络控制</label>
      <button @click="healNetwork" class="w-full btn-info">
        <Wifi class="w-4 h-4" />
        修复网络分区
      </button>
    </div>

    <div class="section stats-section">
      <label class="section-label">集群状态</label>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="stat-item">
          <span class="stat-label">当前任期:</span>
          <span class="stat-value text-cyan-400">{{ state.currentTerm }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Leader:</span>
          <span class="stat-value" :class="state.leaderId !== null ? 'text-green-400' : 'text-slate-500'">
            {{ state.leaderId !== null ? `节点 ${state.leaderId}` : '无' }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">活跃节点:</span>
          <span class="stat-value text-green-400">{{ state.nodes.filter(n => n.state !== 'dead').length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总节点:</span>
          <span class="stat-value">{{ state.nodes.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  width: 280px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.section {
  padding-top: 1rem;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.section-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-label {
  font-size: 0.7rem;
  color: #64748b;
}

.config-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 0.375rem;
  color: #e2e8f0;
  font-size: 0.75rem;
  outline: none;
  transition: all 0.2s;
}

.config-input:focus {
  border-color: #06b6d4;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
}

.scenario-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(100, 116, 139, 0.3);
  transition: all 0.2s;
}

.scenario-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(100, 116, 139, 0.5);
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.btn-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.btn-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-info:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.stats-section {
  padding-bottom: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.5rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 0.25rem;
}

.stat-label {
  color: #64748b;
}

.stat-value {
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}
</style>
