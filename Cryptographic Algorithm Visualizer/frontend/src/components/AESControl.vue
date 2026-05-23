<template>
  <div class="aes-control">
    <h3>AES 加密演示</h3>
    
    <div class="control-group">
      <label>密钥长度</label>
      <select v-model="keyLength">
        <option value="128">128位 (16字节)</option>
        <option value="192">192位 (24字节)</option>
        <option value="256">256位 (32字节)</option>
      </select>
    </div>
    
    <div class="control-group">
      <label>加密模式</label>
      <select v-model="mode">
        <option value="ECB">ECB (电子密码本)</option>
        <option value="CBC">CBC (密码块链接)</option>
        <option value="CTR">CTR (计数器)</option>
      </select>
    </div>
    
    <div class="control-group">
      <label>输入明文 (Hex)</label>
      <input v-model="plaintext" placeholder="48656c6c6f20576f726c6421" />
      <small>当前: {{ hexToText(plaintext) }}</small>
    </div>
    
    <div class="control-group">
      <label>密钥 (Hex)</label>
      <input v-model="key" placeholder="0123456789ABCDEF..." />
    </div>
    
    <div v-if="scenarioConfig?.type === 'aes-weak-key'" class="weak-key-warning">
      <p>⚠️ 当前使用弱密钥: 全零密钥</p>
      <p class="warning-text">这将导致密钥扩展中多个轮密钥完全相同</p>
    </div>
    
    <div class="btn-group">
      <button class="btn-primary" @click="encrypt" :disabled="processing">
        {{ processing ? '加密中...' : '加密' }}
      </button>
      <button class="btn-secondary" @click="decrypt" :disabled="!ciphertext || processing">
        解密
      </button>
      <button class="btn-secondary" @click="generateRandomKey">
        随机密钥
      </button>
    </div>
    
    <div v-if="ciphertext" class="result-section">
      <h4>加密结果</h4>
      <code>{{ ciphertext }}</code>
    </div>
    
    <div v-if="result?.steps?.length > 0" class="process-log">
      <h4>加密步骤</h4>
      <div class="steps-container">
        <div v-for="(step, idx) in result.steps.slice(0, 10)" :key="idx" class="step-item">
          <span class="step-type">{{ step.type }}</span>
          <span class="step-round" v-if="step.round">Round {{ step.round }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="scenarioConfig?.type === 'padding-oracle'" class="attack-section">
      <h4>📮 Padding Oracle 攻击演示</h4>
      <button class="btn-danger" @click="runPaddingOracleAttack">
        模拟 Oracle 攻击
      </button>
      
      <div v-if="oracleResult" class="oracle-result">
        <p>{{ oracleResult.description }}</p>
        <div class="error-grid">
          <div 
            v-for="err in oracleResult.paddingErrors?.slice(0, 8)" 
            :key="err.position"
            class="error-cell"
            :class="{ vulnerable: err.exploitability === '易受攻击' }"
          >
            <span>Pos {{ err.position }}</span>
            <span>{{ err.exploitability }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps(['scenarioConfig'])
const emit = defineEmits(['animation-data'])

const keyLength = ref(128)
const mode = ref('ECB')
const plaintext = ref('48656c6c6f20576f726c6421')
const key = ref('')
const ciphertext = ref('')
const processing = ref(false)
const result = ref(null)
const oracleResult = ref(null)

watch(() => props.scenarioConfig, (config) => {
  if (config?.type === 'aes-weak-key') {
    key.value = config.key || '0'.repeat(32)
    encrypt()
  } else if (config?.type === 'padding-oracle') {
    if (!key.value) generateRandomKey()
  }
}, { immediate: true })

function hexToText(hex) {
  if (!hex) return ''
  try {
    return hex.match(/.{2}/g)?.map(b => String.fromCharCode(parseInt(b, 16))).join('') || ''
  } catch {
    return ''
  }
}

function generateRandomKey() {
  const len = keyLength.value / 8
  let randomHex = ''
  for (let i = 0; i < len * 2; i++) {
    randomHex += Math.floor(Math.random() * 16).toString(16).toUpperCase()
  }
  key.value = randomHex
}

async function encrypt() {
  if (!plaintext.value || !key.value) return
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/aes/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintext: plaintext.value,
        key: key.value,
        mode: mode.value
      })
    })
    const json = await res.json()
    if (json.success) {
      ciphertext.value = json.data.ciphertext
      result.value = json.data
      
      emit('animation-data', {
        type: 'aes-rounds',
        action: 'encrypt',
        plaintext: plaintext.value,
        keySchedule: json.data.keySchedule,
        steps: json.data.steps,
        weakKeyIndicators: json.data.weakKeyIndicators
      })
    }
  } catch (e) {
    console.error('Encrypt error:', e)
  }
  processing.value = false
}

async function decrypt() {
  if (!ciphertext.value || !key.value) return
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/aes/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: ciphertext.value,
        key: key.value,
        mode: mode.value
      })
    })
    const json = await res.json()
    if (json.success) {
      plaintext.value = json.data.plaintext
      
      emit('animation-data', {
        type: 'particle-diffusion',
        action: 'decrypt',
        input: ciphertext.value,
        result: json.data.plaintext
      })
    }
  } catch (e) {
    console.error('Decrypt error:', e)
  }
  processing.value = false
}

async function runPaddingOracleAttack() {
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/aes/padding-oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: ciphertext.value || 'placeholder',
        key: key.value,
        simulateAttack: true
      })
    })
    const json = await res.json()
    if (json.success) {
      oracleResult.value = json.data
      
      emit('animation-data', {
        type: 'particle-diffusion',
        action: 'padding-oracle',
        paddingErrors: json.data.paddingErrors
      })
    }
  } catch (e) {
    console.error('Oracle attack error:', e)
  }
  processing.value = false
}
</script>

<style scoped>
.aes-control {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

h3 {
  color: var(--accent-purple);
  margin-bottom: 1rem;
  font-family: 'JetBrains Mono', monospace;
}

h4 {
  font-size: 0.9rem;
  color: var(--text-secondary);
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

input, select {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--accent-purple);
}

small {
  display: block;
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.weak-key-warning {
  padding: 0.75rem;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid var(--accent-orange);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.weak-key-warning p {
  font-size: 0.85rem;
  color: var(--accent-orange);
}

.warning-text {
  font-size: 0.75rem !important;
  color: var(--text-secondary) !important;
}

.btn-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-primary, .btn-secondary, .btn-danger {
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
  background: var(--accent-purple);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--glow-purple);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--accent-purple);
}

.btn-danger {
  background: var(--accent-orange);
  color: var(--bg-primary);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-section {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 0.75rem;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  color: var(--accent-purple);
}

.process-log {
  margin-top: 1rem;
}

.steps-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.step-item {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-size: 0.7rem;
}

.step-type {
  color: var(--accent-cyan);
  font-family: 'JetBrains Mono', monospace;
}

.step-round {
  color: var(--text-secondary);
}

.attack-section {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid var(--accent-orange);
  border-radius: 6px;
}

.attack-section h4 {
  color: var(--accent-orange);
}

.oracle-result {
  margin-top: 0.75rem;
}

.oracle-result p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.error-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.error-cell {
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 4px;
  text-align: center;
  font-size: 0.7rem;
}

.error-cell.vulnerable {
  background: rgba(255, 107, 53, 0.2);
  border: 1px solid var(--accent-orange);
}

.error-cell span {
  display: block;
  color: var(--text-secondary);
}
</style>
