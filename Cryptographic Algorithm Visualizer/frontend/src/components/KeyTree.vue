<template>
  <div class="key-tree-container">
    <h3>密钥扩展树状分支</h3>
    <div class="tree-wrapper">
      <canvas ref="canvas" class="tree-canvas"></canvas>
    </div>
    <div class="tree-legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #00fff2"></span>
        <span>原始密钥</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #bf00ff"></span>
        <span>轮密钥</span>
      </div>
      <div class="legend-item">
        <span class="legend-color weak"></span>
        <span>重复密钥 ⚠️</span>
      </div>
    </div>
    <div v-if="data.weakKeyIndicators" class="weak-key-alert">
      <p v-if="data.weakKeyIndicators.isWeak">⚠️ 弱密钥警告: 检测到不安全的密钥模式!</p>
      <div class="weak-indicators">
        <span v-if="data.weakKeyIndicators.indicators?.allZeros">全零</span>
        <span v-if="data.weakKeyIndicators.indicators?.allOnes">全一</span>
        <span v-if="data.weakKeyIndicators.indicators?.halfZeros">前半零</span>
        <span v-if="data.weakKeyIndicators.indicators?.repeatingByte">重复字节</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps(['data'])
const canvas = ref(null)
let ctx = null
let animationId = null

onMounted(() => {
  initCanvas()
  if (props.data.keySchedule) {
    drawKeyTree()
  }
})

watch(() => props.data, () => {
  if (props.data.keySchedule) {
    drawKeyTree()
  }
}, { deep: true })

function initCanvas() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  canvas.value.width = 800
  canvas.value.height = 400
}

function drawKeyTree() {
  if (animationId) cancelAnimationFrame(animationId)
  
  const keySchedule = props.data.keySchedule || []
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  const startX = 80
  const startY = 50
  const levelHeight = 50
  const nodeWidth = 60
  const nodeHeight = 30
  
  const nodesByLevel = {}
  const duplicateKeys = new Set()
  
  if (keySchedule.length > 1) {
    for (let i = 1; i < keySchedule.length; i++) {
      if (keySchedule[i].key === keySchedule[i - 1].key) {
        duplicateKeys.add(i)
      }
    }
  }
  
  ctx.font = '12px JetBrains Mono'
  ctx.textAlign = 'center'
  
  ctx.fillStyle = '#00fff2'
  ctx.fillRect(startX - 5, startY - 15, nodeWidth + 10, nodeHeight + 5)
  ctx.fillStyle = '#0a0e17'
  ctx.fillText('K', startX + nodeWidth / 2, startY + 5)
  ctx.fillStyle = '#8b9dc3'
  ctx.font = '10px JetBrains Mono'
  ctx.fillText('Original', startX + nodeWidth / 2, startY + 18)
  
  for (let level = 0; level < Math.min(keySchedule.length, 6); level++) {
    const y = startY + (level + 1) * levelHeight
    
    const keyData = keySchedule[level]
    const isWeak = duplicateKeys.has(level)
    
    ctx.strokeStyle = isWeak ? '#ff6b35' : '#bf00ff'
    ctx.lineWidth = isWeak ? 3 : 2
    ctx.shadowBlur = isWeak ? 15 : 5
    ctx.shadowColor = isWeak ? '#ff6b35' : '#bf00ff'
    
    ctx.strokeRect(startX - 5, y - 15, nodeWidth + 10, nodeHeight + 5)
    
    ctx.beginPath()
    ctx.moveTo(startX + nodeWidth / 2, startY + nodeHeight + 5)
    ctx.lineTo(startX + nodeWidth / 2, y - 15)
    ctx.stroke()
    
    ctx.fillStyle = isWeak ? '#ff6b35' : '#0a0e17'
    ctx.fillRect(startX - 5, y - 15, nodeWidth + 10, nodeHeight + 5)
    
    ctx.fillStyle = isWeak ? '#0a0e17' : '#bf00ff'
    ctx.font = 'bold 10px JetBrains Mono'
    ctx.fillText(`R${level}`, startX + nodeWidth / 2, y + 3)
    
    if (isWeak) {
      ctx.fillStyle = '#ff6b35'
      ctx.font = '8px JetBrains Mono'
      ctx.fillText('⚠️ 重复!', startX + nodeWidth / 2 + 40, y + 3)
    }
  }
  
  ctx.shadowBlur = 0
  
  if (duplicateKeys.size > 0) {
    ctx.fillStyle = '#ff6b35'
    ctx.font = 'bold 14px JetBrains Mono'
    ctx.fillText('⚠️ 弱密钥导致密钥扩展产生重复轮密钥', 400, canvas.value.height - 20)
  }
  
  animateBranches()
}

function animateBranches() {
  let frame = 0
  
  function animate() {
    frame++
    
    ctx.clearRect(canvas.value.width - 150, 0, 150, canvas.value.height)
    
    ctx.fillStyle = `rgba(191, 0, 255, ${0.3 + Math.sin(frame * 0.1) * 0.2})`
    ctx.fillRect(canvas.value.width - 140, 20, 120, canvas.value.height - 40)
    
    ctx.strokeStyle = '#bf00ff'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    
    for (let i = 0; i < 5; i++) {
      const y = 50 + i * 60
      ctx.beginPath()
      ctx.moveTo(canvas.value.width - 140, y)
      ctx.lineTo(canvas.value.width - 20, y)
      ctx.stroke()
    }
    
    ctx.setLineDash([])
    
    ctx.fillStyle = '#bf00ff'
    ctx.font = '10px JetBrains Mono'
    ctx.fillText('Key', canvas.value.width - 80, 35)
    ctx.fillText('Schedule', canvas.value.width - 85, 48)
    
    if (frame < 100) {
      animationId = requestAnimationFrame(animate)
    }
  }
  
  animate()
}
</script>

<style scoped>
.key-tree-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  color: var(--accent-purple);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1rem;
}

.tree-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.tree-canvas {
  display: block;
}

.tree-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.legend-color.weak {
  background: linear-gradient(135deg, #ff6b35 50%, #bf00ff 50%);
}

.weak-key-alert {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid var(--accent-orange);
  border-radius: 6px;
  text-align: center;
}

.weak-key-alert p {
  color: var(--accent-orange);
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.weak-indicators {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.weak-indicators span {
  padding: 0.2rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>
