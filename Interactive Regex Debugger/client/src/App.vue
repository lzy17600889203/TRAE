<template>
  <div class="min-h-screen p-4">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-cyber-blue glow-text text-center">
        正则表达式可视化调试器
      </h1>
      <p class="text-center text-gray-400 mt-2">
        基于有限状态机 (FSM) 的正则表达式构建与调试工具
      </p>
    </header>

    <div class="max-w-7xl mx-auto grid grid-cols-12 gap-4">
      <div class="col-span-12 lg:col-span-4 space-y-4">
        <InputPanel />
        <PresetScenarios />
        <SnippetsPanel />
        <HistoryPanel />
      </div>

      <div class="col-span-12 lg:col-span-8 space-y-4">
        <FSMVisualizer />
        <MatchStepViewer />
        <ASTViewer />
        <ResultDisplay />
      </div>
    </div>

    <div
      v-if="store.showCatastrophicWarning"
      class="fixed inset-0 bg-red-900/50 freeze-overlay flex items-center justify-center pointer-events-none z-50"
    >
      <div class="bg-cyber-dark border-2 border-cyber-red p-6 rounded-lg catastrophic-warning">
        <h3 class="text-xl font-bold text-cyber-red mb-2">⚠️ 检测到性能问题</h3>
        <p class="text-gray-300">分析耗时较长，可能存在灾难性回溯 (Catastrophic Backtracking)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRegexStore } from './stores/regex'
import InputPanel from './components/InputPanel.vue'
import PresetScenarios from './components/PresetScenarios.vue'
import SnippetsPanel from './components/SnippetsPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import FSMVisualizer from './components/FSMVisualizer.vue'
import MatchStepViewer from './components/MatchStepViewer.vue'
import ASTViewer from './components/ASTViewer.vue'
import ResultDisplay from './components/ResultDisplay.vue'

const store = useRegexStore()

onMounted(() => {
  store.loadSnippets()
  store.loadHistory()
})
</script>
