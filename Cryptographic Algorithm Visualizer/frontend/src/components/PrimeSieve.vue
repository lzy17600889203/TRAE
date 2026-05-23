<template>
  <div class="prime-sieve-container">
    <h3>素数筛选动画</h3>
    <div class="sieve-wrapper">
      <canvas ref="canvas" class="sieve-canvas"></canvas>
    </div>
    <div class="sieve-info">
      <div class="info-item">
        <span class="label">筛选范围:</span>
        <span>{{ sieveRange }} 以内</span>
      </div>
      <div class="info-item">
        <span class="label">找到素数:</span>
        <span class="prime-count">{{ primes.length }}</span>
      </div>
      <div class="info-item">
        <span class="label">当前步骤:</span>
        <span>{{ currentStep }}</span>
      </div>
    </div>
    <div v-if="data.factors?.length" class="factor-result">
      <h4>分解结果</h4>
      <div class="factor-display">
        <span class="factor-item" v-for="f in data.factors" :key="f">
          {{ f }}
        </span>
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

const sieveRange = ref(100)
const primes = ref([])
const currentStep = ref('等待开始...')

onMounted(() => {
  initCanvas()
  if (props.data.action === 'factor-attack') {
    runFactorization()
  }
})

watch(() => props.data, (newData) => {
  if (newData.action === 'factor-attack') {
    runFactorization()
  }
}, { deep: true })

function initCanvas() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  canvas.value.width = 800
  canvas.value.height = 400
}

async function runFactorization() {
  if (animationId) cancelAnimationFrame(animationId)
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  const n = BigInt(props.data.n?.slice(0, 20) || '0')
  currentStep.value = '开始分解...'
  
  const smallDivisors = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]
  const factors = []
  
  const cols = 6
  const cellSize = 60
  const gap = 10
  
  for (let i = 0; i < smallDivisors.length; i++) {
    const divisor = BigInt(smallDivisors[i])
    
    currentStep.value = `尝试除数: ${divisor}`
    
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = 50 + col * (cellSize + gap)
    const y = 50 + row * (cellSize + gap)
    
    await animateDivisor(ctx, x, y, cellSize, divisor)
    
    if (n % divisor === 0n) {
      factors.push(divisor.toString())
      primes.value.push(smallDivisors[i])
      
      const otherFactor = (n / divisor).toString()
      factors.push(otherFactor)
      
      currentStep.value = `✓ 找到因子: ${divisor}`
      
      ctx.fillStyle = '#00ff88'
      ctx.font = 'bold 14px JetBrains Mono'
      ctx.fillText(`✓ ${divisor}`, x + cellSize / 2, y + cellSize + 15)
    } else {
      ctx.fillStyle = '#8b9dc3'
      ctx.font = '12px JetBrains Mono'
      ctx.fillText('×', x + cellSize / 2, y + cellSize + 15)
    }
    
    await sleep(300)
  }
  
  if (factors.length > 0) {
    currentStep.value = '分解成功!'
  } else {
    currentStep.value = '无法分解 (需要更大素数)'
  }
}

async function animateDivisor(ctx, x, y, size, divisor) {
  for (let scale = 0.5; scale <= 1.2; scale += 0.1) {
    ctx.clearRect(x - 10, y - 10, size + 20, size + 30)
    
    ctx.strokeStyle = '#00fff2'
    ctx.lineWidth = 2
    ctx.shadowBlur = 15
    ctx.shadowColor = '#00fff2'
    ctx.strokeRect(x, y, size * scale, size * scale)
    
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(x, y, size * scale, size * scale)
    
    ctx.fillStyle = '#00fff2'
    ctx.font = 'bold 16px JetBrains Mono'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(divisor.toString(), x + size * scale / 2, y + size * scale / 2)
    
    await sleep(50)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
</script>

<style scoped>
.prime-sieve-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  color: var(--accent-cyan);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1rem;
}

h4 {
  color: var(--accent-orange);
  margin-bottom: 0.5rem;
}

.sieve-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.sieve-canvas {
  display: block;
}

.sieve-info {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-top: 1rem;
}

.info-item {
  text-align: center;
}

.label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.prime-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  color: var(--accent-cyan);
}

.factor-result {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-orange);
  border-radius: 8px;
}

.factor-display {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.factor-item {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--accent-cyan);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-cyan);
}
</style>
