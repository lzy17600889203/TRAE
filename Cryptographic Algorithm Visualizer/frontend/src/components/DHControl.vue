<template>
  <div class="dh-control">
    <h3>Diffie-Hellman 密钥交换</h3>
    
    <div class="control-group">
      <label>素数位数</label>
      <select v-model="primeBits">
        <option :value="64">64位 (不安全)</option>
        <option :value="128">128位</option>
        <option :value="256">256位</option>
      </select>
    </div>
    
    <div v-if="params" class="params-display">
      <h4>公共参数</h4>
      <div class="param-item">
        <span class="param-name">p (素数):</span>
        <code>{{ truncate(params.p, 40) }}...</code>
      </div>
      <div class="param-item">
        <span class="param-name">g (生成元):</span>
        <code>{{ params.g }}</code>
      </div>
    </div>
    
    <div v-if="aliceKeyPair" class="party-keys">
      <div class="party alice">
        <h4>🔵 Alice</h4>
        <code>私钥: {{ truncate(aliceKeyPair.privateKey, 20) }}...</code>
        <code>公钥: {{ truncate(aliceKeyPair.publicKey, 40) }}...</code>
      </div>
      <div class="party bob">
        <h4>🔴 Bob</h4>
        <code>私钥: {{ truncate(bobKeyPair.privateKey, 20) }}...</code>
        <code>公钥: {{ truncate(bobKeyPair.publicKey, 40) }}...</code>
      </div>
    </div>
    
    <div v-if="sharedSecret" class="secret-display">
      <h4>共享密钥</h4>
      <code class="shared-secret">{{ truncate(sharedSecret, 60) }}</code>
      <span class="match-badge" v-if="secretMatch">✓ 匹配</span>
    </div>
    
    <div class="btn-group">
      <button class="btn-primary" @click="startExchange" :disabled="processing">
        {{ processing ? '交换中...' : '开始密钥交换' }}
      </button>
    </div>
    
    <div v-if="scenarioConfig?.type === 'dh-mitm'" class="mitm-warning">
      <h4>🕵️ 中间人攻击演示</h4>
      <button class="btn-danger" @click="runMitmAttack">
        执行 MITM 攻击
      </button>
      
      <div v-if="mitmResult" class="mitm-result">
        <div class="attack-timeline">
          <div v-for="(step, idx) in mitmResult.steps" :key="idx" class="timeline-item">
            <div class="timeline-marker" :class="step.type"></div>
            <div class="timeline-content">
              <p class="step-desc">{{ step.description }}</p>
              <code v-if="step.interceptedAlicePublic">
                Alice公钥: {{ truncate(step.interceptedAlicePublic, 30) }}...
              </code>
              <code v-if="step.interceptedBobPublic">
                Bob公钥: {{ truncate(step.interceptedBobPublic, 30) }}...
              </code>
            </div>
          </div>
        </div>
        
        <div class="attack-summary">
          <h5>攻击成功!</h5>
          <p>攻击者可以分别与 Alice 和 Bob 建立不同的共享密钥:</p>
          <code>与 Alice: {{ truncate(mitmResult.attackerSharedWithAlice, 30) }}...</code>
          <code>与 Bob: {{ truncate(mitmResult.attackerSharedWithBob, 30) }}...</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps(['scenarioConfig'])
const emit = defineEmits(['animation-data'])

const primeBits = ref(128)
const params = ref(null)
const aliceKeyPair = ref(null)
const bobKeyPair = ref(null)
const sharedSecret = ref('')
const secretMatch = ref(false)
const processing = ref(false)
const mitmResult = ref(null)

watch(() => props.scenarioConfig, (config) => {
  if (config?.type === 'dh-mitm') {
    runMitmAttack()
  }
}, { immediate: true })

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

async function startExchange() {
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/dh/key-exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p: params.value?.p || undefined,
        g: params.value?.g || undefined,
        bits: params.value ? undefined : primeBits.value
      })
    })
    const json = await res.json()
    if (json.success) {
      params.value = json.data.params
      aliceKeyPair.value = json.data.alice
      bobKeyPair.value = json.data.bob
      sharedSecret.value = json.data.sharedSecrets.alice
      secretMatch.value = json.data.sharedSecrets.match
      
      emit('animation-data', {
        type: 'dh-exchange',
        action: 'key-exchange',
        params: json.data.params,
        alice: json.data.alice,
        bob: json.data.bob,
        sharedSecret: json.data.sharedSecrets
      })
    }
  } catch (e) {
    console.error('DH exchange error:', e)
  }
  processing.value = false
}

async function runMitmAttack() {
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/dh/demo-mitm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const json = await res.json()
    if (json.success) {
      mitmResult.value = json.data.mitmResult
      
      emit('animation-data', {
        type: 'mitm',
        action: 'mitm-attack',
        ...json.data
      })
    }
  } catch (e) {
    console.error('MITM attack error:', e)
  }
  processing.value = false
}
</script>

<style scoped>
.dh-control {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

h3 {
  color: var(--accent-green);
  margin-bottom: 1rem;
  font-family: 'JetBrains Mono', monospace;
}

h4 {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0.5rem 0;
}

h5 {
  color: var(--accent-orange);
  margin: 0.5rem 0;
}

.control-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

select {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
}

.params-display, .secret-display {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.param-item, .party {
  margin-bottom: 0.5rem;
}

.param-name {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

code {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-primary);
  word-break: break-all;
}

.party-keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.party {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 6px;
}

.party.alice {
  border-left: 3px solid #3498db;
}

.party.bob {
  border-left: 3px solid #e74c3c;
}

.shared-secret {
  color: var(--accent-green) !important;
  font-size: 0.75rem !important;
}

.match-badge {
  display: inline-block;
  background: var(--accent-green);
  color: var(--bg-primary);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.btn-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-primary, .btn-danger {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--accent-green);
  color: var(--bg-primary);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
}

.btn-danger {
  background: var(--accent-orange);
  color: var(--bg-primary);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mitm-warning {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid var(--accent-orange);
  border-radius: 6px;
}

.mitm-result {
  margin-top: 1rem;
}

.attack-timeline {
  position: relative;
  padding-left: 1.5rem;
}

.attack-timeline::before {
  content: '';
  position: absolute;
  left: 0.25rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent-orange);
}

.timeline-item {
  position: relative;
  margin-bottom: 1rem;
}

.timeline-marker {
  position: absolute;
  left: -1.35rem;
  top: 0.25rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 2px solid var(--accent-orange);
}

.timeline-marker.intercept {
  background: var(--accent-orange);
}

.timeline-content {
  background: var(--bg-secondary);
  padding: 0.5rem;
  border-radius: 4px;
}

.step-desc {
  font-size: 0.8rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.attack-summary {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid var(--accent-orange);
}

.attack-summary p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0.5rem 0;
}
</style>
