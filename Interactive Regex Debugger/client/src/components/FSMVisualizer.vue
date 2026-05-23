<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <h2 class="text-lg font-semibold text-cyber-blue mb-4">有限状态机 (FSM) 可视化</h2>

    <div v-if="!store.analysisResult" class="text-center text-gray-500 py-8">
      输入正则表达式并点击"开始分析"查看状态机可视化
    </div>

    <div v-else class="relative">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        class="border border-cyber-blue/20 rounded bg-cyber-dark/50"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#00d4ff" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#00ff88" />
          </marker>
          <marker
            id="arrowhead-failed"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff4757" />
          </marker>
        </defs>

        <g v-for="state in fsmStates" :key="'state-' + state.id">
          <circle
            :cx="getStateX(state.id)"
            :cy="getStateY(state.id)"
            :r="25"
            :class="getStateClass(state.id)"
            :style="getStateStyle(state.id)"
          />
          <text
            :x="getStateX(state.id)"
            :y="getStateY(state.id)"
            text-anchor="middle"
            dominant-baseline="middle"
            class="text-xs font-mono"
            :fill="getStateTextColor(state.id)"
          >
            S{{ state.id }}
          </text>
          <circle
            v-if="state.isAccepting"
            :cx="getStateX(state.id)"
            :cy="getStateY(state.id)"
            :r="30"
            fill="none"
            stroke="#00ff88"
            stroke-width="2"
          />
        </g>

        <g v-for="(transition, tIndex) in allTransitions" :key="'trans-' + tIndex">
          <path
            :d="getTransitionPath(transition)"
            :class="getTransitionClass(transition)"
            fill="none"
            :marker-end="getTransitionMarker(transition)"
          />
          <text
            v-if="transition.symbol"
            :x="getLabelX(transition)"
            :y="getLabelY(transition)"
            text-anchor="middle"
            class="text-xs font-mono"
            :fill="getTransitionLabelColor(transition)"
          >
            {{ formatSymbol(transition.symbol) }}
          </text>
        </g>
      </svg>

      <div class="mt-4 flex flex-wrap gap-4 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full bg-cyber-blue/50 border border-cyber-blue"></span>
          <span class="text-gray-400">起始状态</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full border-2 border-cyber-green"></span>
          <span class="text-gray-400">接受状态</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full bg-cyber-green"></span>
          <span class="text-gray-400">当前激活</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full bg-cyber-red opacity-50"></span>
          <span class="text-gray-400">失败状态</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRegexStore } from '../stores/regex'
import type { FSMState, FSMTransition } from '@shared/types'

const store = useRegexStore()

const svgWidth = ref(600)
const svgHeight = ref(300)
const statePositions = ref<Map<number, { x: number; y: number }>>(new Map())
const pulsingStates = ref<Set<number>>(new Set())

interface TransitionWithInfo extends FSMTransition {
  fromStateId: number
}

const fsmStates = computed(() => store.analysisResult?.fsm.states || [])

const allTransitions = computed(() => {
  const transitions: TransitionWithInfo[] = []
  fsmStates.value.forEach(state => {
    state.transitions.forEach(transition => {
      transitions.push({
        ...transition,
        fromStateId: state.id
      })
    })
  })
  return transitions
})

watch(fsmStates, () => {
  layoutStates()
}, { immediate: true })

watch(() => store.currentStep, (step) => {
  if (step) {
    pulsingStates.value.add(step.stateId)
    setTimeout(() => {
      pulsingStates.value.delete(step.stateId)
    }, 500)
  }
})

function layoutStates() {
  const states = fsmStates.value
  const padding = 60
  const usableWidth = svgWidth.value - padding * 2
  const usableHeight = svgHeight.value - padding * 2
  const cols = Math.ceil(Math.sqrt(states.length))
  const rows = Math.ceil(states.length / cols)

  statePositions.value.clear()

  states.forEach((state, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = padding + (usableWidth / (cols - 1 || 1)) * col
    const y = padding + (usableHeight / (rows - 1 || 1)) * row
    statePositions.value.set(state.id, { x, y })
  })
}

function getStateX(stateId: number): number {
  return statePositions.value.get(stateId)?.x || 0
}

function getStateY(stateId: number): number {
  return statePositions.value.get(stateId)?.y || 0
}

function getStateClass(stateId: number): string {
  const classes = ['node-state']
  if (store.currentStep?.stateId === stateId) {
    classes.push('node-active')
  } else if (store.currentStep?.action === 'fail' && pulsingStates.value.has(stateId)) {
    classes.push('node-failed')
  } else {
    classes.push('node-inactive')
  }
  if (pulsingStates.value.has(stateId)) {
    classes.push('node-pulse')
  }
  return classes.join(' ')
}

function getStateStyle(stateId: number): Record<string, string> {
  const styles: Record<string, string> = {}
  if (stateId === store.analysisResult?.fsm.startState) {
    styles['stroke-width'] = '3'
  }
  return styles
}

function getStateTextColor(stateId: number): string {
  if (store.currentStep?.stateId === stateId) return '#0a0e1a'
  return '#00d4ff'
}

function getTransitionPath(transition: TransitionWithInfo): string {
  const from = statePositions.value.get(transition.fromStateId)
  const to = statePositions.value.get(transition.targetStateId)
  if (!from || !to) return ''

  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  const offsetX = (dx / dist) * 25
  const offsetY = (dy / dist) * 25

  return `M ${from.x + offsetX} ${from.y + offsetY} L ${to.x - offsetX} ${to.y - offsetY}`
}

function getTransitionClass(transition: TransitionWithInfo): string {
  const currentStep = store.currentStep
  if (currentStep &&
      currentStep.stateId === transition.targetStateId &&
      (currentStep.action === 'consume' || currentStep.action === 'epsilon')) {
    return 'path-active flow-path'
  }
  if (currentStep?.action === 'backtrack' &&
      currentStep.backtrackFrom === transition.fromStateId) {
    return 'path-failed'
  }
  return 'path-inactive'
}

function getTransitionMarker(transition: TransitionWithInfo): string {
  const currentStep = store.currentStep
  if (currentStep &&
      currentStep.stateId === transition.targetStateId &&
      (currentStep.action === 'consume' || currentStep.action === 'epsilon')) {
    return 'url(#arrowhead-active)'
  }
  if (currentStep?.action === 'backtrack' &&
      currentStep.backtrackFrom === transition.fromStateId) {
    return 'url(#arrowhead-failed)'
  }
  return 'url(#arrowhead)'
}

function getTransitionLabelColor(transition: TransitionWithInfo): string {
  const currentStep = store.currentStep
  if (currentStep &&
      currentStep.stateId === transition.targetStateId &&
      (currentStep.action === 'consume' || currentStep.action === 'epsilon')) {
    return '#00ff88'
  }
  return '#666'
}

function getLabelX(transition: TransitionWithInfo): number {
  const from = statePositions.value.get(transition.fromStateId)
  const to = statePositions.value.get(transition.targetStateId)
  if (!from || !to) return 0
  return (from.x + to.x) / 2
}

function getLabelY(transition: TransitionWithInfo): number {
  const from = statePositions.value.get(transition.fromStateId)
  const to = statePositions.value.get(transition.targetStateId)
  if (!from || !to) return 0
  return (from.y + to.y) / 2 - 5
}

function formatSymbol(symbol: string): string {
  if (symbol === null || symbol === undefined) return 'ε'
  if (symbol === '\n') return '\\n'
  if (symbol === '\r') return '\\r'
  if (symbol === '\t') return '\\t'
  return symbol
}
</script>
