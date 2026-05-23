<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="logo">🔐 加密算法可视化</h1>
      <nav class="nav-tabs">
        <button 
          v-for="algo in algorithms" 
          :key="algo.id"
          :class="['tab-btn', { active: activeAlgo === algo.id }]"
          @click="activeAlgo = algo.id"
        >
          {{ algo.name }}
        </button>
      </nav>
    </header>

    <main class="main-content">
      <section class="control-panel">
        <AttackScenarios @load-scenario="handleScenarioLoad" />
        
        <div class="algo-controls">
          <RSAControl 
            v-if="activeAlgo === 'rsa'" 
            :scenario-config="scenarioConfig"
            @animation-data="handleAnimationData"
          />
          <AESControl 
            v-if="activeAlgo === 'aes'" 
            :scenario-config="scenarioConfig"
            @animation-data="handleAnimationData"
          />
          <DHControl 
            v-if="activeAlgo === 'dh'" 
            :scenario-config="scenarioConfig"
            @animation-data="handleAnimationData"
          />
        </div>

        <div class="records-section">
          <h3>📁 实验记录</h3>
          <button class="btn-secondary" @click="loadRecords">刷新记录</button>
          <div class="records-list">
            <div v-for="record in records" :key="record.id" class="record-item">
              <span>{{ record.name }}</span>
              <span class="badge">{{ record.algorithm }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="visualization-panel">
        <BitGrid 
          v-if="animationData.type === 'bitflip' || animationData.type === 'modular'"
          :data="animationData"
        />
        <PrimeSieve 
          v-if="animationData.type === 'prime-sieve'"
          :data="animationData"
        />
        <PipelineFlow 
          v-if="animationData.type === 'aes-rounds'"
          :data="animationData"
        />
        <KeyTree 
          v-if="animationData.type === 'key-expansion'"
          :data="animationData"
        />
        <ParticleMixer 
          v-if="animationData.type === 'particle-diffusion'"
          :data="animationData"
        />
        <DHVisualizer 
          v-if="animationData.type === 'dh-exchange' || animationData.type === 'mitm'"
          :data="animationData"
        />
        
        <div v-if="!animationData.type" class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>选择算法并开始加密以查看可视化动画</p>
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <div class="status-bar">
        <span class="status-item">算法: {{ currentAlgoName }}</span>
        <span class="status-item" v-if="processing">⏳ 处理中...</span>
        <span class="status-item" v-if="lastResult">{{ lastResult }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AttackScenarios from './components/AttackScenarios.vue'
import RSAControl from './components/RSAControl.vue'
import AESControl from './components/AESControl.vue'
import DHControl from './components/DHControl.vue'
import BitGrid from './components/BitGrid.vue'
import PrimeSieve from './components/PrimeSieve.vue'
import PipelineFlow from './components/PipelineFlow.vue'
import KeyTree from './components/KeyTree.vue'
import ParticleMixer from './components/ParticleMixer.vue'
import DHVisualizer from './components/DHVisualizer.vue'

const algorithms = [
  { id: 'rsa', name: 'RSA' },
  { id: 'aes', name: 'AES' },
  { id: 'dh', name: 'Diffie-Hellman' }
]

const activeAlgo = ref('rsa')
const scenarioConfig = ref(null)
const animationData = ref({})
const records = ref([])
const processing = ref(false)
const lastResult = ref('')

const currentAlgoName = computed(() => {
  return algorithms.find(a => a.id === activeAlgo.value)?.name || ''
})

function handleScenarioLoad(config) {
  scenarioConfig.value = config
  animationData.value = { type: config.animationType, ...config }
}

function handleAnimationData(data) {
  animationData.value = data
  processing.value = false
  lastResult.value = data.result || ''
}

async function loadRecords() {
  try {
    const res = await fetch('/api/records/list')
    const json = await res.json()
    if (json.success) {
      records.value = json.data
    }
  } catch (e) {
    console.error('Failed to load records:', e)
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-primary: #0a0e17;
  --bg-secondary: #131a2b;
  --bg-tertiary: #1a2336;
  --accent-cyan: #00fff2;
  --accent-purple: #bf00ff;
  --accent-orange: #ff6b35;
  --accent-green: #00ff88;
  --text-primary: #e8e8e8;
  --text-secondary: #8b9dc3;
  --border-color: #2a3a5c;
  --glow-cyan: 0 0 20px rgba(0, 255, 242, 0.5);
  --glow-purple: 0 0 20px rgba(191, 0, 255, 0.5);
}

body {
  font-family: 'Noto Sans SC', 'JetBrains Mono', monospace;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  color: var(--accent-cyan);
  text-shadow: var(--glow-cyan);
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem 1.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.tab-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.tab-btn.active {
  background: var(--accent-cyan);
  color: var(--bg-primary);
  border-color: var(--accent-cyan);
  box-shadow: var(--glow-cyan);
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1px;
  background: var(--border-color);
}

.control-panel {
  background: var(--bg-secondary);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
}

.algo-controls {
  flex: 1;
}

.records-section {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.records-section h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.records-list {
  max-height: 200px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  margin-bottom: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.badge {
  background: var(--accent-purple);
  color: var(--bg-primary);
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
}

.visualization-panel {
  background: var(--bg-primary);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  gap: 1rem;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.app-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 0.5rem 2rem;
}

.status-bar {
  display: flex;
  gap: 2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-secondary {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--accent-purple);
  color: var(--accent-purple);
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .visualization-panel {
    min-height: 400px;
  }
}
</style>
