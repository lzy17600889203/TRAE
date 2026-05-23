<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <h2 class="text-lg font-semibold text-cyber-blue mb-4">预设场景</h2>

    <div class="space-y-3">
      <button
        v-for="preset in store.presets"
        :key="preset.id"
        @click="loadPreset(preset)"
        class="w-full text-left p-3 bg-cyber-dark/50 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded transition-all group"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold" :class="getCategoryColor(preset.category)">
            {{ preset.name }}
          </span>
          <span class="text-xs px-2 py-1 rounded" :class="getCategoryBadge(preset.category)">
            {{ getCategoryLabel(preset.category) }}
          </span>
        </div>
        <p class="text-sm text-gray-400 mb-2">{{ preset.description }}</p>
        <div class="text-xs font-mono text-cyber-green">
          /{{ preset.pattern }}/{{ preset.flags }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegexStore } from '../stores/regex'
import type { PresetScenario } from '@shared/types'

const store = useRegexStore()

function loadPreset(preset: PresetScenario) {
  store.loadPreset(preset)
  store.analyze()
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'greedy': return 'text-cyber-yellow'
    case 'backtrack': return 'text-cyber-red'
    case 'lookaround': return 'text-cyber-purple'
    case 'email': return 'text-cyber-green'
    default: return 'text-cyber-blue'
  }
}

function getCategoryBadge(category: string) {
  switch (category) {
    case 'greedy': return 'bg-yellow-900/50 text-yellow-300'
    case 'backtrack': return 'bg-red-900/50 text-red-300'
    case 'lookaround': return 'bg-purple-900/50 text-purple-300'
    case 'email': return 'bg-green-900/50 text-green-300'
    default: return 'bg-blue-900/50 text-blue-300'
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'greedy': return '贪婪匹配'
    case 'backtrack': return '回溯灾难'
    case 'lookaround': return '零宽断言'
    case 'email': return '邮箱校验'
    default: return category
  }
}
</script>
