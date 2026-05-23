<template>
  <div class="dh-visualizer-container">
    <h3>Diffie-Hellman 密钥交换可视化</h3>
    <div class="exchange-wrapper">
      <canvas ref="canvas" class="exchange-canvas"></canvas>
    </div>
    
    <div class="exchange-diagram" v-if="data.mitmResult">
      <div class="party alice">
        <div class="party-icon">🔵</div>
        <h4>Alice</h4>
        <code>g^a mod p</code>
      </div>
      
      <div class="channel">
        <div class="channel-line"></div>
        <div class="mitm-badge" v-if="data.type === 'mitm'">🕵️ MITM</div>
        <div class="data-packet" :class="{ intercepted: data.type === 'mitm' }">
          <span>{{ truncate(data.alicePublicKey || '', 20) }}...</span>
        </div>
      </div>
      
      <div class="party bob">
        <div class="party-icon">🔴</div>
        <h4>Bob</h4>
        <code>g^b mod p</code>
      </div>
    </div>
    
    <div class="exchange-info" v-if="data.params">
      <div class="info-section">
        <h4>公共参数</h4>
        <div class="param-row">
          <span>p:</span>
          <code>{{ truncate(data.params.p, 40) }}...</code>
        </div>
        <div class="param-row">
          <span>g:</span>
          <code>{{ data.params.g }}</code>
        </div>
      </div>
      
      <div class="info-section" v-if="data.sharedSecret">
        <h4>共享密钥</h4>
        <code class="shared-key">{{ truncate(data.sharedSecret, 50) }}...</code>
      </div>
    </div>
    
    <div v-if="data.type === 'mitm' && data.mitmResult" class="mitm-warning">
      <h4>🕵️ 中间人攻击分析</h4>
      <div class="attack-steps">
        <div v-for="(step, idx) in data.mitmResult.steps" :key="idx" class="attack-step">
          <span class="step-num">{{ idx + 1 }}</span>
          <div class="step-content">
            <p>{{ step.description }}</p>
            <code v-if="step.mitmPublicForAlice">伪造公钥: {{ truncate(step.mitmPublicForAlice, 30) }}...</code>
          </div>
        </div>
      </div>
      <div class="vulnerability-summary">
        <p>漏洞: {{ data.mitmResult.attackerSharedWithAlice === data.mitmResult.attackerSharedWithBob ? '攻击成功!' : '' }}</p>
        <p class="mitigation">防御: 使用 ECDHE 或在 DH 交换中加入数字签名验证</p>
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
  startAnimation()
})

watch(() => props.data, () => {
  startAnimation()
}, { deep: true })

function initCanvas() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  canvas.value.width = 800
  canvas.value.height = 200
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function startAnimation() {
  if (animationId) cancelAnimationFrame(animationId)
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  const centerY = 100
  const aliceX = 100
  const bobX = 700
  const attackerX = 400
  
  ctx.fillStyle = '#3498db'
  ctx.beginPath()
  ctx.arc(aliceX, centerY, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('A', aliceX, centerY)
  
  ctx.fillStyle = '#e74c3c'
  ctx.beginPath()
  ctx.arc(bobX, centerY, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText('B', bobX, centerY)
  
  if (props.data.type === 'mitm') {
    ctx.fillStyle = '#ff6b35'
    ctx.beginPath()
    ctx.arc(attackerX, centerY, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px Arial'
    ctx.fillText('E', attackerX, centerY)
    
    ctx.strokeStyle = '#ff6b35'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    ctx.beginPath()
    ctx.moveTo(attackerX + 25, centerY - 30)
    ctx.lineTo(attackerX + 25, centerY - 60)
    ctx.stroke()
    
    ctx.setLineDash([])
    
    ctx.fillStyle = '#ff6b35'
    ctx.font = '10px JetBrains Mono'
    ctx.fillText('Attacker', attackerX, centerY - 70)
  }
  
  let progress = 0
  let phase = 0
  
  function animate() {
    if (phase === 0) {
      progress += 0.02
      
      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(aliceX + 30, centerY)
      ctx.lineTo(aliceX + 30 + (attackerX - aliceX - 30) * Math.min(progress, 1), centerY)
      ctx.stroke()
      
      if (props.data.type === 'mitm') {
        ctx.fillStyle = 'rgba(255, 107, 53, 0.5)'
        ctx.beginPath()
        ctx.arc(aliceX + 30 + (attackerX - aliceX - 30) * Math.min(progress, 1), centerY, 8, 0, Math.PI * 2)
        ctx.fill()
      }
      
      if (progress >= 1) {
        phase = 1
        progress = 0
      }
    } else if (phase === 1) {
      progress += 0.02
      
      if (props.data.type === 'mitm') {
        ctx.strokeStyle = '#ff6b35'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        
        ctx.beginPath()
        ctx.moveTo(attackerX + 25, centerY)
        ctx.lineTo(attackerX + 25 + (bobX - attackerX - 30) * Math.min(progress, 1), centerY)
        ctx.stroke()
        
        ctx.setLineDash([])
        
        ctx.fillStyle = 'rgba(255, 107, 53, 0.5)'
        ctx.beginPath()
        ctx.arc(attackerX + 25 + (bobX - attackerX - 30) * Math.min(progress, 1), centerY, 6, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = '#e74c3c'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(aliceX + 30, centerY)
        ctx.lineTo(aliceX + 30 + (bobX - aliceX - 30) * Math.min(progress, 1), centerY)
        ctx.stroke()
      }
      
      if (progress >= 1) {
        return
      }
    }
    
    animationId = requestAnimationFrame(animate)
  }
  
  animate()
}
</script>

<style scoped>
.dh-visualizer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  color: var(--accent-green);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1rem;
}

h4 {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0.5rem 0;
}

.exchange-wrapper {
  height: 200px;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.exchange-canvas {
  display: block;
}

.exchange-diagram {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-top: 1rem;
}

.party {
  text-align: center;
}

.party-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.party h4 {
  margin: 0.25rem 0;
}

.party code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.channel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 1rem 0;
}

.channel-line {
  width: 100%;
  height: 2px;
  background: var(--border-color);
}

.mitm-badge {
  position: absolute;
  top: 0;
  background: var(--accent-orange);
  color: var(--bg-primary);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.data-packet {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 0.75rem;
}

.data-packet.intercepted {
  border: 1px solid var(--accent-orange);
  background: rgba(255, 107, 53, 0.1);
}

.exchange-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-top: 1rem;
}

.info-section h4 {
  color: var(--accent-cyan);
}

.param-row {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.param-row span {
  color: var(--text-secondary);
}

.param-row code, .shared-key {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  color: var(--accent-cyan);
}

.mitm-warning {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid var(--accent-orange);
  border-radius: 8px;
}

.mitm-warning h4 {
  color: var(--accent-orange);
}

.attack-steps {
  margin-top: 0.75rem;
}

.attack-step {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.step-num {
  width: 24px;
  height: 24px;
  background: var(--accent-orange);
  color: var(--bg-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content p {
  font-size: 0.85rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.step-content code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--accent-orange);
}

.vulnerability-summary {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--accent-orange);
}

.vulnerability-summary p {
  font-size: 0.85rem;
  color: var(--accent-orange);
  font-weight: bold;
}

.mitigation {
  color: var(--accent-cyan) !important;
  font-weight: normal !important;
}
</style>
