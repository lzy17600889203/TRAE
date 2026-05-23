<template>
  <div class="relative">
    <div
      class="flex items-center gap-2 py-1 cursor-pointer hover:bg-cyber-blue/10 rounded px-2 transition-colors"
      :class="{ 'bg-cyber-blue/20': isActive }"
      @click="toggle"
    >
      <span
        v-if="hasChildren"
        class="text-cyber-blue transition-transform duration-300"
        :class="{ 'rotate-90': isExpanded }"
      >
        ▶
      </span>
      <span v-else class="w-4"></span>

      <span
        class="px-2 py-0.5 rounded text-xs font-semibold"
        :class="getNodeTypeClass()"
      >
        {{ nodeTypeLabel }}
      </span>

      <span class="text-gray-300">{{ nodeValue }}</span>

      <span
        v-if="node.groupIndex"
        class="px-1.5 py-0.5 text-xs bg-cyber-green/30 text-cyber-green rounded"
      >
        #{{ node.groupIndex }}
      </span>

      <span
        v-if="node.isNonCapture"
        class="px-1.5 py-0.5 text-xs bg-yellow-900/50 text-yellow-300 rounded non-capture-error"
        title="非捕获组可能被错误高亮"
      >
        非捕获
      </span>

      <span
        v-if="node.isLookahead || node.isLookbehind"
        class="px-1.5 py-0.5 text-xs bg-purple-900/50 text-purple-300 rounded"
      >
        {{ node.isPositive ? '正向' : '负向' }}{{ node.isLookahead ? '先行' : '后行' }}
      </span>

      <span
        v-if="node.quantifier"
        class="px-1.5 py-0.5 text-xs bg-orange-900/50 text-orange-300 rounded"
      >
        {{ node.quantifier.min }}, {{ node.quantifier.max === Infinity ? '∞' : node.quantifier.max }}
        {{ node.quantifier.greedy ? '贪婪' : '非贪婪' }}
      </span>

      <span
        v-if="node.negate"
        class="px-1.5 py-0.5 text-xs bg-red-900/50 text-red-300 rounded"
      >
        取反
      </span>
    </div>

    <Transition name="expand-collapse">
      <div
        v-if="isExpanded && hasChildren"
        class="ml-6 border-l-2 border-cyber-blue/30 pl-4 expand-collapse"
      >
        <ASTNode
          v-for="(child, index) in node.children"
          :key="child.id || index"
          :node="child"
          :level="level + 1"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRegexStore } from '../stores/regex'
import type { RegexNode } from '@shared/types'

const props = defineProps<{
  node: RegexNode
  level: number
}>()

const store = useRegexStore()

const isExpanded = computed(() => store.expandedNodes.has(props.node.id))
const isActive = computed(() => store.activeNodes.has(props.node.id))
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

const nodeTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    start: '开始',
    end: '结束',
    literal: '字面量',
    quantifier: '量词',
    group: '捕获组',
    capture: '捕获组',
    lookahead: '先行断言',
    lookbehind: '后行断言',
    any: '任意字符',
    class: '字符类',
    anchor: '锚点',
    alternation: '分支',
    backreference: '反向引用'
  }
  return labels[props.node.type] || props.node.type
})

const nodeValue = computed(() => {
  if (!props.node.value) return ''
  if (props.node.type === 'literal') {
    return `"${props.node.value}"`
  }
  return props.node.value
})

function getNodeTypeClass(): string {
  const classes: Record<string, string> = {
    start: 'bg-gray-700',
    end: 'bg-gray-700',
    literal: 'bg-green-900 text-green-300',
    quantifier: 'bg-orange-900 text-orange-300',
    group: 'bg-blue-900 text-blue-300',
    capture: 'bg-blue-900 text-blue-300',
    lookahead: 'bg-purple-900 text-purple-300',
    lookbehind: 'bg-purple-900 text-purple-300',
    any: 'bg-cyan-900 text-cyan-300',
    class: 'bg-teal-900 text-teal-300',
    anchor: 'bg-pink-900 text-pink-300',
    alternation: 'bg-indigo-900 text-indigo-300',
    backreference: 'bg-rose-900 text-rose-300'
  }
  return classes[props.node.type] || 'bg-gray-700'
}

function toggle() {
  if (hasChildren.value) {
    store.toggleNode(props.node.id)
  }
}
</script>

<style scoped>
.expand-collapse-enter-active,
.expand-collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-collapse-enter-from,
.expand-collapse-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.expand-collapse-enter-to,
.expand-collapse-leave-from {
  opacity: 1;
  max-height: 1000px;
  transform: translateY(0);
}
</style>
