<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <h2 class="text-lg font-semibold text-cyber-blue mb-4">输入区</h2>

    <div class="space-y-4">
      <div>
        <label class="block text-sm text-gray-400 mb-1">正则表达式</label>
        <div class="flex gap-2">
          <span class="text-cyber-green self-center">/</span>
          <input
            v-model="store.pattern"
            type="text"
            placeholder="输入正则表达式..."
            class="flex-1 bg-cyber-dark/50 border border-cyber-blue/30 rounded px-3 py-2 text-cyber-green font-mono focus:outline-none focus:border-cyber-blue"
          />
          <span class="text-cyber-green self-center">/</span>
          <input
            v-model="store.flags"
            type="text"
            placeholder="flags"
            class="w-20 bg-cyber-dark/50 border border-cyber-blue/30 rounded px-3 py-2 text-cyber-yellow font-mono focus:outline-none focus:border-cyber-blue"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-400 mb-1">目标文本</label>
        <textarea
          v-model="store.testString"
          rows="4"
          placeholder="输入测试文本..."
          class="w-full bg-cyber-dark/50 border border-cyber-blue/30 rounded px-3 py-2 text-gray-200 font-mono focus:outline-none focus:border-cyber-blue resize-none"
        />
      </div>

      <div class="flex gap-2">
        <button
          @click="store.analyze"
          :disabled="!canAnalyze || store.isAnalyzing"
          class="flex-1 bg-cyber-blue hover:bg-cyber-blue/80 text-cyber-dark font-semibold py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ store.isAnalyzing ? '分析中...' : '开始分析' }}
        </button>
        <button
          @click="clearInputs"
          class="px-4 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded transition-colors"
        >
          清空
        </button>
      </div>
    </div>

    <div v-if="store.hasCatastrophicWarning" class="mt-4 p-3 bg-red-900/30 border border-cyber-red rounded catastrophic-warning">
      <p class="text-cyber-red text-sm">
        ⚠️ 检测到潜在的灾难性回溯模式，执行可能会变慢
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRegexStore } from '../stores/regex'

const store = useRegexStore()

const canAnalyze = computed(() => store.pattern.trim().length > 0 && store.testString.trim().length > 0)

function clearInputs() {
  store.pattern = ''
  store.testString = ''
  store.flags = ''
  store.analysisResult = null
  store.currentStepIndex = 0
}
</script>
