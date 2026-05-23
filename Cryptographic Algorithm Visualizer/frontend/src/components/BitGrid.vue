<template>
  <div class="bit-grid-container">
    <h3>比特位翻转动画</h3>
    <div class="grid-wrapper">
      <canvas ref="canvas" class="bit-canvas"></canvas>
    </div>
    <div class="data-display">
      <div class="data-item">
        <span class="label">输入:</span>
        <code>{{ data.input || '等待数据...' }}</code>
      </div>
      <div class="arrow">→</div>
      <div class="data-item">
        <span class="label">输出:</span>
        <code class="highlight">{{ data.result || '等待数据...' }}</code>
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

const cellSize = 12
const gap = 2

onMounted(() => {
  initCanvas()
  if (props.data.input) {
    startAnimation()
  }
})

watch(() => props.data, (newData) => {
  if (newData.input) {
    startAnimation()
  }
}, { deep: true })

function initCanvas() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  canvas.value.width = 800
  canvas.value.height = 300
}

function startAnimation() {
  if (animationId) cancelAnimationFrame(animationId)
  
  const inputBits = stringToBits(props.data.input || '')
  const outputBits = stringToBits(props.data.result || '')
  
  let currentBits = new Array(inputBits.length).fill(0)
  let frame = 0
  const totalFrames = 60
  
  function animate() {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    
    const progress = Math.min(frame / totalFrames, 1)
    const targetProgress = props.data.action === 'encrypt' ? progress : 1 - progress
    
    const cols = Math.ceil(Math.sqrt(inputBits.length))
    const rows = Math.ceil(inputBits.length / cols)
    
    const totalWidth = cols * (cellSize + gap)
    const totalHeight = rows * (cellSize + gap)
    const offsetX = (canvas.value.width - totalWidth) / 2
    const offsetY = (canvas.value.height - totalHeight) / 2
    
    for (let i = 0; i < inputBits.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const x = offsetX + col * (cellSize + gap)
      const y = offsetY + row * (cellSize + gap)
      
      const bitProgress = Math.max(0, Math.min(1, (progress * inputBits.length - i) / 2))
      const currentBit = bitProgress >= 1 ? outputBits[i] || 0 : inputBits[i]
      
      ctx.fillStyle = currentBit ? '#00fff2' : '#1a2336'
      ctx.shadowBlur = currentBit ? 8 : 0
      ctx.shadowColor = '#00fff2'
      
      if (bitProgress > 0 && bitProgress < 1) {
        ctx.fillStyle = `rgba(0, 255, 242, ${0.5 + Math.random() * 0.5})`
      }
      
      ctx.fillRect(x, y, cellSize, cellSize)
      
      ctx.fillStyle = currentBit ? '#0a0e17' : '#8b9dc3'
      ctx.font = '8px JetBrains Mono'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(currentBit.toString(), x + cellSize / 2, y + cellSize / 2)
    }
    
    frame++
    if (frame < totalFrames + 20) {
      animationId = requestAnimationFrame(animate)
    }
  }
  
  animate()
}

function stringToBits(str) {
  const bits = []
  for (let i = 0; i < Math.min(str.length, 100); i++) {
    const charCode = str.charCodeAt(i)
    for (let j = 7; j >= 0; j--) {
      bits.push((charCode >> j) & 1)
    }
  }
  return bits
}
</script>

<style scoped>
.bit-grid-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  color: var(--accent-cyan);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1rem;
}

.grid-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.bit-canvas {
  display: block;
}

.data-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.data-item {
  flex: 1;
}

.label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
  word-break: break-all;
}

code.highlight {
  color: var(--accent-cyan);
}

.arrow {
  font-size: 1.5rem;
  color: var(--accent-cyan);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
