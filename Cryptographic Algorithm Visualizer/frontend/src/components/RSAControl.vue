<template>
  <div class="rsa-control">
    <h3>RSA 加密演示</h3>
    
    <div class="control-group">
      <label>密钥位数</label>
      <select v-model="keyBits">
        <option :value="32">32位 (不安全)</option>
        <option :value="64">64位 (不安全)</option>
        <option :value="256">256位</option>
        <option :value="1024">1024位 (标准)</option>
      </select>
    </div>
    
    <div class="control-group">
      <label>输入明文</label>
      <textarea v-model="plaintext" placeholder="输入要加密的文本..." rows="3"></textarea>
    </div>
    
    <div v-if="keyPair.publicKey" class="key-display">
      <div class="key-section">
        <h4>公钥 (n, e)</h4>
        <code>n: {{ truncate(keyPair.publicKey.n, 40) }}...</code>
        <code>e: {{ keyPair.publicKey.e }}</code>
      </div>
      <div class="key-section">
        <h4>私钥 (d)</h4>
        <code class="private">d: {{ truncate(keyPair.privateKey.d, 40) }}...</code>
      </div>
    </div>
    
    <div class="btn-group">
      <button class="btn-primary" @click="generateKeys" :disabled="processing">
        {{ processing ? '生成中...' : '生成密钥对' }}
      </button>
      <button class="btn-secondary" @click="encrypt" :disabled="!keyPair.publicKey || processing">
        加密
      </button>
      <button class="btn-secondary" @click="decrypt" :disabled="!ciphertext || processing">
        解密
      </button>
    </div>
    
    <div v-if="ciphertext" class="result-section">
      <h4>加密结果</h4>
      <code class="ciphertext">{{ truncate(ciphertext, 80) }}</code>
    </div>
    
    <div v-if="decryptedText" class="result-section success">
      <h4>解密结果</h4>
      <p>{{ decryptedText }}</p>
    </div>
    
    <div v-if="scenarioConfig?.type === 'rsa-small-factor'" class="attack-warning">
      <h4>⚠️ 小模数分解攻击演示</h4>
      <p>当前使用 {{ keyBits }} 位小素数，攻击者可轻易分解模数 n</p>
      <button class="btn-danger" @click="runFactorAttack">
        执行分解攻击
      </button>
      
      <div v-if="factorResult" class="attack-result">
        <h5>攻击结果</h5>
        <div class="factor-display">
          <code>n = p × q</code>
          <code>p = {{ factorResult.p }}</code>
          <code>q = {{ factorResult.q }}</code>
          <code>d (推导) = {{ factorResult.derivedPrivateKey?.slice(0, 20) }}...</code>
        </div>
        <p class="warning-text">{{ factorResult.vulnerability }}</p>
        <p class="speed-text">攻击耗时: {{ factorResult.attackSpeed }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps(['scenarioConfig'])
const emit = defineEmits(['animation-data'])

const keyBits = ref(1024)
const plaintext = ref('Hello, World!')
const keyPair = ref({ publicKey: null, privateKey: null })
const ciphertext = ref('')
const decryptedText = ref('')
const processing = ref(false)
const factorResult = ref(null)

watch(() => props.scenarioConfig, (config) => {
  if (config?.type === 'rsa-small-factor') {
    keyBits.value = config.bits || 32
    runFactorAttack()
  }
}, { immediate: true })

async function generateKeys() {
  processing.value = true
  try {
    const res = await fetch('/api/crypto/rsa/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bits: keyBits.value, smallFactor: keyBits.value < 128 })
    })
    const json = await res.json()
    if (json.success) {
      keyPair.value = json.data
      
      emit('animation-data', {
        type: 'prime-sieve',
        action: 'generate-keys',
        bits: keyBits.value
      })
    }
  } catch (e) {
    console.error('Generate keys error:', e)
  }
  processing.value = false
}

async function encrypt() {
  if (!plaintext.value || !keyPair.value.publicKey) return
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/rsa/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintext: plaintext.value,
        publicKey: keyPair.value.publicKey
      })
    })
    const json = await res.json()
    if (json.success) {
      ciphertext.value = json.data.ciphertext
      
      emit('animation-data', {
        type: 'modular',
        action: 'encrypt',
        input: plaintext.value,
        result: ciphertext.value
      })
    }
  } catch (e) {
    console.error('Encrypt error:', e)
  }
  processing.value = false
}

async function decrypt() {
  if (!ciphertext.value || !keyPair.value.privateKey) return
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/rsa/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: ciphertext.value,
        privateKey: keyPair.value.privateKey
      })
    })
    const json = await res.json()
    if (json.success) {
      decryptedText.value = json.data.plaintext
      
      emit('animation-data', {
        type: 'bitflip',
        action: 'decrypt',
        input: ciphertext.value,
        result: decryptedText.value
      })
    }
  } catch (e) {
    console.error('Decrypt error:', e)
  }
  processing.value = false
}

async function runFactorAttack() {
  if (!keyPair.value.publicKey?.n) {
    await generateKeys()
  }
  
  if (!keyPair.value.publicKey?.n) return
  
  processing.value = true
  
  try {
    const res = await fetch('/api/crypto/rsa/factor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n: keyPair.value.publicKey.n })
    })
    const json = await res.json()
    if (json.success) {
      factorResult.value = json.data
      
      emit('animation-data', {
        type: 'prime-sieve',
        action: 'factor-attack',
        n: keyPair.value.publicKey.n,
        factors: json.data.factors,
        steps: json.data.steps
      })
    }
  } catch (e) {
    console.error('Factor attack error:', e)
  }
  processing.value = false
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}
</script>

<style scoped>
.rsa-control {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

h3 {
  color: var(--accent-cyan);
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

select, textarea, input {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
}

select:focus, textarea:focus, input:focus {
  outline: none;
  border-color: var(--accent-cyan);
}

textarea {
  resize: vertical;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
}

.key-display {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.key-section {
  margin-bottom: 0.5rem;
}

.key-section h4 {
  font-size: 0.8rem;
  color: var(--accent-green);
}

code {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
  word-break: break-all;
  padding: 0.25rem 0;
}

code.private {
  color: var(--accent-orange);
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
  background: var(--accent-cyan);
  color: var(--bg-primary);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--glow-cyan);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--accent-cyan);
}

.btn-danger {
  background: var(--accent-orange);
  color: var(--bg-primary);
}

.btn-danger:hover {
  box-shadow: 0 0 15px rgba(255, 107, 53, 0.5);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-section {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.result-section.success {
  border-left: 3px solid var(--accent-green);
}

.ciphertext {
  font-size: 0.7rem;
  word-break: break-all;
}

.attack-warning {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid var(--accent-orange);
  border-radius: 6px;
}

.attack-warning h4 {
  color: var(--accent-orange);
}

.attack-result {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.factor-display code {
  display: block;
  color: var(--accent-cyan);
  margin: 0.25rem 0;
}

.warning-text {
  color: var(--accent-orange);
  font-weight: bold;
  margin-top: 0.5rem;
}

.speed-text {
  color: var(--accent-green);
  font-size: 0.85rem;
}
</style>
