<template>
  <div class="particle-mixer-container">
    <h3>数据混淆扩散粒子搅拌</h3>
    <div class="mixer-wrapper">
      <canvas ref="canvas" class="mixer-canvas"></canvas>
    </div>
    <div class="mixer-stats">
      <div class="stat-item">
        <span class="stat-label">扩散熵:</span>
        <div class="stat-bar">
          <div class="stat-fill" :style="{ width: entropy + '%' }"></div>
        </div>
        <span class="stat-value">{{ entropy }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">粒子数:</span>
        <span class="stat-value">{{ particles.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">状态:</span>
        <span class="stat-value" :class="{ mixing: isMixing }">
          {{ isMixing ? '混合中...' : '完成' }}
        </span>
      </div>
    </div>
    <div v-if="data.paddingErrors" class="oracle-info">
      <h4>Oracle 错误分布</h4>
      <div class="error-visualization">
        <div 
          v-for="(err, idx) in data.paddingErrors.slice(0, 16)" 
          :key="idx"
          class="error-dot"
          :class="{ vulnerable: err.exploitability === '易受攻击' }"
          :title="`位置 ${err.position}: ${err.description}`"
        ></div>
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

const particles = ref([])
const entropy = ref(0)
const isMixing = ref(false)

const particleCount = 100

onMounted(() => {
  initCanvas()
  initParticles()
  startMixing()
})

watch(() => props.data, () => {
  initParticles()
  entropy.value = 0
  startMixing()
}, { deep: true })

function initCanvas() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  canvas.value.width = 800
  canvas.value.height = 400
}

function initParticles() {
  particles.value = []
  for (let i = 0; i < particleCount; i++) {
    particles.value.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 3 + Math.random() * 4,
      color: `hsla(${Math.random() * 360}, 100%, 60%, 0.8)`,
      originalX: Math.random() * canvas.value.width,
      originalY: Math.random() * canvas.value.height
    })
  }
}

function startMixing() {
  if (animationId) cancelAnimationFrame(animationId)
  isMixing.value = true
  
  let frame = 0
  const maxFrames = 120
  
  function animate() {
    ctx.fillStyle = 'rgba(10, 14, 23, 0.2)'
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    
    particles.value.forEach((p, i) => {
      p.x += p.vx
      p.y += p.vy
      
      if (p.x < 0 || p.x > canvas.value.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.value.height) p.vy *= -1
      
      const chaos = frame / maxFrames
      p.vx += (Math.random() - 0.5) * chaos * 2
      p.vy += (Math.random() - 0.5) * chaos * 2
      
      p.vx *= 0.99
      p.vy *= 0.99
      
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2)
      ctx.strokeStyle = p.color.replace('0.8', '0.3')
      ctx.stroke()
    })
    
    for (let i = 0; i < particles.value.length; i++) {
      for (let j = i + 1; j < particles.value.length; j++) {
        const dx = particles.value[j].x - particles.value[i].x
        const dy = particles.value[j].y - particles.value[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 50) {
          ctx.beginPath()
          ctx.moveTo(particles.value[i].x, particles.value[i].y)
          ctx.lineTo(particles.value[j].x, particles.value[j].y)
          ctx.strokeStyle = `rgba(191, 0, 255, ${0.3 - dist / 150})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }
    
    entropy.value = Math.min(100, Math.round((frame / maxFrames) * 150))
    
    frame++
    
    if (frame < maxFrames) {
      isMixing.value = true
      animationId = requestAnimationFrame(animate)
    } else {
      isMixing.value = false
      entropy.value = 100
    }
  }
  
  animate()
}
</script>

<style scoped>
.particle-mixer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  color: var(--accent-purple);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1rem;
}

h4 {
  color: var(--accent-orange);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.mixer-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.mixer-canvas {
  display: block;
}

.mixer-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-bar {
  width: 100px;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
  transition: width 0.3s ease;
}

.stat-value {
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-cyan);
}

.stat-value.mixing {
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.oracle-info {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-orange);
  border-radius: 8px;
}

.error-visualization {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
}

.error-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

.error-dot.vulnerable {
  background: var(--accent-orange);
  border-color: var(--accent-orange);
  box-shadow: 0 0 10px var(--accent-orange);
}
</style>
