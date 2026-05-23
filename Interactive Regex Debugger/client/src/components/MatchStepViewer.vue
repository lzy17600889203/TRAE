<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-cyber-blue">匹配步骤追踪</h2>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-400">
          步骤 {{ store.currentStepIndex + 1 }} / {{ store.totalSteps }}
        </span>
      </div>
    </div>

    <div v-if="!store.analysisResult" class="text-center text-gray-500 py-8">
      等待分析结果...
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-center gap-4">
        <button
          @click="store.resetSteps"
          :disabled="store.currentStepIndex === 0"
          class="px-3 py-1 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded transition-colors disabled:opacity-50"
        >
          ⏮ 重置
        </button>
        <button
          @click="store.prevStep"
          :disabled="store.currentStepIndex === 0"
          class="px-3 py-1 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded transition-colors disabled:opacity-50"
        >
          ◀ 上一步
        </button>
        <button
          @click="store.play"
          class="px-4 py-1 bg-cyber-green text-cyber-dark rounded hover:bg-cyber-green/80 transition-colors"
        >
          {{ store.isPlaying ? '⏸ 暂停' : '▶ 播放' }}
        </button>
        <button
          @click="store.nextStep"
          :disabled="store.currentStepIndex >= store.totalSteps - 1"
          class="px-3 py-1 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded transition-colors disabled:opacity-50"
        >
          下一步 ▶
        </button>
      </div>

      <div class="flex items-center justify-center gap-2">
        <span class="text-xs text-gray-400">速度:</span>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          v-model.number="store.animationSpeed"
          class="w-32 accent-cyber-blue"
        />
        <span class="text-xs text-gray-400">{{ store.animationSpeed }}ms</span>
      </div>

      <div v-if="currentStep" class="p-4 bg-cyber-dark/50 border rounded" :class="getStepBorderClass()">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">动作类型:</span>
            <span class="ml-2 font-mono" :class="getActionClass()">{{ getActionLabel() }}</span>
          </div>
          <div>
            <span class="text-gray-400">当前状态:</span>
            <span class="ml-2 font-mono text-cyber-blue">S{{ currentStep.stateId }}</span>
          </div>
          <div>
            <span class="text-gray-400">输入位置:</span>
            <span class="ml-2 font-mono text-cyber-yellow">{{ currentStep.inputIndex }}</span>
          </div>
          <div>
            <span class="text-gray-400">当前字符:</span>
            <span class="ml-2 font-mono text-cyber-green">"{{ currentStep.currentChar || 'EOF' }}"</span>
          </div>
        </div>

        <div v-if="currentStep.backtrackFrom !== undefined" class="mt-3 text-sm">
          <span class="text-gray-400">回溯自:</span>
          <span class="ml-2 font-mono text-cyber-red">S{{ currentStep.backtrackFrom }}</span>
        </div>

        <div v-if="Object.keys(currentStep.captureGroups).length > 0" class="mt-3">
          <span class="text-gray-400 text-sm">捕获组:</span>
          <div class="mt-1 flex flex-wrap gap-2">
            <span
              v-for="(group, index) in currentStep.captureGroups"
              :key="index"
              class="px-2 py-1 text-xs rounded highlight-capture"
              :class="getCaptureGroupClass(Number(index))"
            >
              ${{ index }}: "{{ group.value }}"
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="text-sm text-gray-400 mb-2">测试文本高亮:</div>
        <div class="p-3 bg-cyber-dark/50 border border-cyber-blue/30 rounded font-mono text-sm">
          <span
            v-for="(char, index) in testStringChars"
            :key="index"
            :class="getCharClass(index)"
          >{{ char === '\n' ? '\\n' : char }}</span>
        </div>
      </div>

      <div class="mt-4">
        <div class="text-sm text-gray-400 mb-2">步骤进度:</div>
        <div class="flex gap-px">
          <div
            v-for="(_, index) in store.analysisResult?.steps"
            :key="index"
            :class="getProgressBarClass(index)"
            class="flex-1 h-2 transition-colors"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRegexStore } from '../stores/regex'
import type { MatchStep } from '@shared/types'

const store = useRegexStore()

const currentStep = computed(() => store.currentStep as MatchStep | null)
const testStringChars = computed(() => store.testString.split(''))

function getStepBorderClass(): string {
  if (!currentStep.value) return 'border-gray-600'
  switch (currentStep.value.action) {
    case 'consume':
      return 'border-cyber-green'
    case 'epsilon':
      return 'border-cyber-blue'
    case 'backtrack':
      return 'border-cyber-red'
    case 'fail':
      return 'border-cyber-red wither-branch'
    case 'accept':
      return 'border-cyber-green'
    default:
      return 'border-gray-600'
  }
}

function getActionClass(): string {
  if (!currentStep.value) return 'text-gray-400'
  switch (currentStep.value.action) {
    case 'consume': return 'text-cyber-green'
    case 'epsilon': return 'text-cyber-blue'
    case 'backtrack': return 'text-cyber-red'
    case 'fail': return 'text-cyber-red'
    case 'accept': return 'text-cyber-green'
    default: return 'text-gray-400'
  }
}

function getActionLabel(): string {
  if (!currentStep.value) return '未知'
  switch (currentStep.value.action) {
    case 'consume': return '消费字符'
    case 'epsilon': return 'ε 转移'
    case 'backtrack': return '回溯'
    case 'fail': return '失败'
    case 'accept': return '接受 ✓'
    default: return currentStep.value.action
  }
}

function getCaptureGroupClass(index: number): string {
  const colors = [
    'bg-blue-900/50 text-blue-300 border border-blue-500',
    'bg-green-900/50 text-green-300 border border-green-500',
    'bg-yellow-900/50 text-yellow-300 border border-yellow-500',
    'bg-purple-900/50 text-purple-300 border border-purple-500',
    'bg-pink-900/50 text-pink-300 border border-pink-500'
  ]
  return colors[index % colors.length]
}

function getCharClass(index: number): string {
  if (!currentStep.value) return 'text-gray-400'

  if (index === currentStep.value.inputIndex) {
    return 'bg-cyber-blue text-cyber-dark px-1 rounded animate-pulse'
  }
  if (index < currentStep.value.inputIndex) {
    return 'text-cyber-green'
  }
  return 'text-gray-400'
}

function getProgressBarClass(index: number): string {
  if (index < store.currentStepIndex) {
    return 'bg-cyber-green'
  }
  if (index === store.currentStepIndex) {
    return 'bg-cyber-blue animate-pulse'
  }
  return 'bg-gray-700'
}
</script>
