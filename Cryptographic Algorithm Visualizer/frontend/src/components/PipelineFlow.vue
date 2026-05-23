<template>
  <div class="pipeline-flow-container">
    <h3>AES 轮函数流水线</h3>
    <div class="pipeline-wrapper">
      <canvas ref="canvas" class="pipeline-canvas"></canvas>
    </div>
    <div class="round-info">
      <div class="round-selector">
        <button 
          v-for="r in rounds" 
          :key="r"
          :class="['round-btn', { active: currentRound === r }]"
          @click="showRound(r)"
        >
          {{ r }}
        </button>
      </div>
      <div class="step-details" v-if="currentStepData">
        <div class="step-row">
          <span class="step-label">操作:</span>
          <span class="step-value">{{ currentStepData.type }}</span>
        </div>
        <div class="step-row">
          <span class="step-label">轮次:</span>
          <span class="step-value">{{ currentStepData.round }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps(['data'])
const canvas = ref(null)
let ctx = null
let animationId = null

const rounds = computed(() => {
  return props.data.keySchedule?.map((_, i) => i) || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
})
const currentRound = ref(0)
const currentStepData = ref(null)

onMounted(() => {
  initCanvas()
  if (props.data.steps) {
    startPipelineAnimation()
  }
})

watch(() => props.data, (newData) => {
  if (newData.steps) {
    startPipelineAnimation()
  }
}, { deep: true })

function initCanvas() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  canvas.value.width = 800
  canvas.value.height = 300
}

function showRound(r) {
  currentRound.value = r
  const step = props.data.steps?.find(s => s.round === r)
  if (step) {
    currentStepData.value = step
  }
}

async function startPipelineAnimation() {
  if (animationId) cancelAnimationFrame(animationId)
  
  const steps = props.data.steps || []
  let currentStep = 0
  
  async function animate() {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    
    const nodeWidth = 100
    const nodeHeight = 60
    const gap = 80
    const startX = 50
    const centerY = canvas.value.height / 2
    
    const pipelineNodes = [
      { label: 'SubBytes', color: '#bf00ff' },
      { label: 'ShiftRows', color: '#00fff2' },
      { label: 'MixColumns', color: '#ff6b35' },
      { label: 'AddRoundKey', color: '#00ff88' }
    ]
    
    for (let i = 0; i < 10; i++) {
      const x = startX + i * (nodeWidth + gap)
      
      const isPast = i < currentStep % 10
      const isCurrent = i === currentStep % 10
      
      ctx.strokeStyle = isCurrent ? '#00fff2' : isPast ? '#00ff88' : '#2a3a5c'
      ctx.lineWidth = isCurrent ? 3 : 2
      ctx.shadowBlur = isCurrent ? 15 : 0
      ctx.shadowColor = isCurrent ? '#00fff2' : 'transparent'
      
      const height = nodeHeight + (i % 4) * 15
      ctx.strokeRect(x, centerY - height / 2, nodeWidth, height)
      
      ctx.fillStyle = '#0a0e17'
      ctx.fillRect(x, centerY - height / 2, nodeWidth, height)
      
      const nodeIndex = i % 4
      const node = pipelineNodes[nodeIndex]
      
      ctx.fillStyle = isCurrent ? node.color : isPast ? '#00ff88' : '#8b9dc3'
      ctx.font = 'bold 12px JetBrains Mono'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label, x + nodeWidth / 2, centerY - 10)
      
      ctx.fillStyle = '#8b9dc3'
      ctx.font = '10px JetBrains Mono'
      ctx.fillText(`Round ${i + 1}`, x + nodeWidth / 2, centerY + 15)
      
      if (i < 9) {
        ctx.beginPath()
        ctx.moveTo(x + nodeWidth, centerY)
        
        const arrowY = centerY + Math.sin(i * 0.5) * 10
        ctx.lineTo(x + nodeWidth + gap - 10, arrowY)
        ctx.stroke()
        
        ctx.fillStyle = isCurrent ? '#00fff2' : '#2a3a5c'
        ctx.beginPath()
        ctx.moveTo(x + nodeWidth + gap - 5, arrowY)
        ctx.lineTo(x + nodeWidth + gap - 15, arrowY - 5)
        ctx.lineTo(x + nodeWidth + gap - 15, arrowY + 5)
        ctx.fill()
      }
    }
    
    currentStep++
    if (currentStep < 100) {
      animationId = requestAnimationFrame(() => setTimeout(animate, 200))
    }
  }
  
  animate()
}
</script>

<style scoped>
.pipeline-flow-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  color: var(--accent-purple);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1rem;
}

.pipeline-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.pipeline-canvas {
  display: block;
}

.round-info {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-top: 1rem;
}

.round-selector {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.round-btn {
  flex: 1;
  padding: 0.4rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.round-btn:hover {
  border-color: var(--accent-purple);
}

.round-btn.active {
  background: var(--accent-purple);
  color: white;
  border-color: var(--accent-purple);
}

.step-details {
  display: flex;
  gap: 1rem;
}

.step-row {
  flex: 1;
}

.step-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.step-value {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-cyan);
}
</style>
