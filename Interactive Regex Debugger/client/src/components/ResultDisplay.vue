<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <h2 class="text-lg font-semibold text-cyber-blue mb-4">分析结果</h2>

    <div v-if="!store.analysisResult" class="text-center text-gray-500 py-8">
      等待分析结果...
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 rounded border" :class="resultMatched ? 'border-cyber-green bg-green-900/20' : 'border-cyber-red bg-red-900/20'">
          <div class="text-sm text-gray-400 mb-1">匹配结果</div>
          <div class="text-2xl font-bold" :class="resultMatched ? 'text-cyber-green' : 'text-cyber-red'">
            {{ resultMatched ? '✓ 匹配成功' : '✗ 匹配失败' }}
          </div>
        </div>

        <div class="p-4 rounded border border-cyber-blue bg-cyber-blue/10">
          <div class="text-sm text-gray-400 mb-1">总步骤数</div>
          <div class="text-2xl font-bold text-cyber-blue">{{ store.totalSteps }}</div>
        </div>
      </div>

      <div v-if="resultMatched && matchIndex !== null" class="p-4 rounded border border-cyber-green bg-green-900/20">
        <div class="text-sm text-gray-400 mb-2">匹配详情</div>
        <div class="font-mono text-sm">
          <span class="text-gray-400">匹配位置:</span>
          <span class="text-cyber-green ml-2">{{ matchIndex }}</span>
        </div>
        <div v-if="captureGroupsText" class="font-mono text-sm mt-2">
          <span class="text-gray-400">捕获组:</span>
          <span class="text-cyber-yellow ml-2">{{ captureGroupsText }}</span>
        </div>
      </div>

      <div v-if="warnings.length > 0" class="space-y-2">
        <div class="text-sm font-semibold text-cyber-yellow">⚠️ 警告</div>
        <div
          v-for="(warning, index) in warnings"
          :key="index"
          class="p-3 rounded border text-sm"
          :class="getWarningClass(warning.type)"
        >
          <div class="font-semibold mb-1">{{ getWarningLabel(warning.type) }}</div>
          <div class="text-gray-300">{{ warning.message }}</div>
          <div class="text-xs text-gray-500 mt-1">位置: {{ warning.position }}</div>
        </div>
      </div>

      <div class="p-4 rounded border border-cyber-blue/30 bg-cyber-dark/50">
        <div class="text-sm font-semibold text-cyber-blue mb-2">匹配统计</div>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-400">消费步骤:</span>
            <span class="text-cyber-green ml-2">{{ consumeCount }}</span>
          </div>
          <div>
            <span class="text-gray-400">ε 转移:</span>
            <span class="text-cyber-blue ml-2">{{ epsilonCount }}</span>
          </div>
          <div>
            <span class="text-gray-400">回溯次数:</span>
            <span :class="backtrackCount > 10 ? 'text-cyber-red' : 'text-cyber-yellow'" class="ml-2">
              {{ backtrackCount }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="isAnchorFailure" class="p-4 rounded border border-cyber-red bg-red-900/20 anchor-failure">
        <div class="text-sm font-semibold text-cyber-red mb-2">🔍 锚点失效检测</div>
        <div class="text-sm text-gray-300">
          检测到在多行模式下锚点行为可能不符合预期。在多行模式 (m flag) 下，
          <code class="text-cyber-yellow">^</code> 和 <code class="text-cyber-yellow">$</code>
          会匹配每行的开始和结束，而不是整个字符串的开始和结束。
        </div>
      </div>

      <div v-if="isNonCaptureError" class="p-4 rounded border border-cyber-yellow bg-yellow-900/20 non-capture-error">
        <div class="text-sm font-semibold text-cyber-yellow mb-2">⚡ 非捕获组提示</div>
        <div class="text-sm text-gray-300">
          正则表达式中包含非捕获组 <code class="text-cyber-yellow">(?:...)</code>。
          非捕获组不会创建捕获组，如果你需要引用匹配的内容，请使用普通捕获组 <code class="text-cyber-yellow">(...)</code>。
        </div>
      </div>

      <div v-if="isCatastrophic" class="p-4 rounded border border-cyber-red bg-red-900/30 catastrophic-warning">
        <div class="text-sm font-semibold text-cyber-red mb-2">💥 灾难性回溯警告</div>
        <div class="text-sm text-gray-300">
          检测到潜在的灾难性回溯模式 (Catastrophic Backtracking)。
          这种模式在某些输入下可能导致指数级的回溯尝试，造成严重的性能问题。
          建议使用原子组、占有量词或重新设计正则表达式来避免这个问题。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRegexStore } from '../stores/regex'
import type { RegexWarning } from '@shared/types'

const store = useRegexStore()

const analysisResult = computed(() => store.analysisResult)

const resultMatched = computed(() => analysisResult.value?.finalResult.matched || false)
const matchIndex = computed(() => analysisResult.value?.finalResult.matchIndex)
const captureGroups = computed(() => analysisResult.value?.finalResult.captureGroups || {})
const warnings = computed(() => analysisResult.value?.warnings || [])

const captureGroupsText = computed(() => {
  const groups = captureGroups.value
  return Object.entries(groups)
    .map(([index, group]: [string, any]) => `$${index}="${group.value}"`)
    .join(', ')
})

const consumeCount = computed(() =>
  analysisResult.value?.steps.filter(s => s.action === 'consume').length || 0
)

const epsilonCount = computed(() =>
  analysisResult.value?.steps.filter(s => s.action === 'epsilon').length || 0
)

const backtrackCount = computed(() =>
  analysisResult.value?.steps.filter(s => s.action === 'backtrack').length || 0
)

const isCatastrophic = computed(() =>
  warnings.value.some(w => w.type === 'catastrophic-backtrack') || backtrackCount.value > 100
)

const isAnchorFailure = computed(() => {
  if (!store.flags.includes('m')) return false
  return store.pattern.includes('^') || store.pattern.includes('$')
})

const isNonCaptureError = computed(() => store.pattern.includes('(?:'))

function getWarningClass(type: string): string {
  switch (type) {
    case 'catastrophic-backtrack':
      return 'border-cyber-red bg-red-900/30'
    case 'performance':
      return 'border-cyber-yellow bg-yellow-900/20'
    case 'useless-token':
      return 'border-orange-500 bg-orange-900/20'
    default:
      return 'border-gray-600 bg-gray-800/50'
  }
}

function getWarningLabel(type: string): string {
  const labels: Record<string, string> = {
    'catastrophic-backtrack': '💥 灾难性回溯',
    'performance': '⚡ 性能警告',
    'redundant-escape': '💡 冗余转义',
    'empty-match': 'ℹ️ 空匹配',
    'useless-token': '⚠️ 无效语法'
  }
  return labels[type] || type
}
</script>
