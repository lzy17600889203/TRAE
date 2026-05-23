<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-cyber-blue">历史记录</h2>
      <button
        v-if="store.history.length > 0"
        @click="clearHistory"
        class="px-3 py-1 text-sm bg-cyber-red/20 hover:bg-cyber-red/30 text-cyber-red rounded transition-colors"
      >
        清空
      </button>
    </div>

    <div v-if="store.history.length === 0" class="text-center text-gray-500 py-4">
      暂无历史记录
    </div>

    <div v-else class="space-y-2 max-h-48 overflow-y-auto">
      <div
        v-for="record in store.history"
        :key="record.id"
        @click="loadHistory(record)"
        class="p-2 bg-cyber-dark/50 border border-cyber-blue/20 rounded hover:border-cyber-blue/50 cursor-pointer transition-colors"
      >
        <p class="text-xs font-mono text-cyber-green truncate">
          /{{ record.pattern }}/{{ record.flags }}
        </p>
        <p class="text-xs text-gray-400 truncate mt-1">
          {{ record.testString.slice(0, 50) }}{{ record.testString.length > 50 ? '...' : '' }}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          {{ formatDate(record.createdAt) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegexStore } from '../stores/regex'
import type { DebugHistory } from '@shared/types'

const store = useRegexStore()

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function loadHistory(record: DebugHistory) {
  store.pattern = record.pattern
  store.testString = record.testString
  store.flags = record.flags
  store.analyze()
}

async function clearHistory() {
  try {
    await fetch('/api/history', { method: 'DELETE' })
    store.history = []
  } catch (error) {
    console.error('Failed to clear history:', error)
  }
}
</script>
