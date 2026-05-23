<template>
  <div class="attack-scenarios">
    <h3>⚠️ 预设攻击场景</h3>
    <div class="scenario-grid">
      <button 
        class="scenario-btn" 
        @click="loadScenario('rsa-small-factor')"
        :class="{ active: activeScenario === 'rsa-small-factor' }"
      >
        <span class="scenario-icon">🔓</span>
        <span class="scenario-name">RSA小模数分解</span>
      </button>
      
      <button 
        class="scenario-btn" 
        @click="loadScenario('aes-weak-key')"
        :class="{ active: activeScenario === 'aes-weak-key' }"
      >
        <span class="scenario-icon">🔑</span>
        <span class="scenario-name">AES弱密钥攻击</span>
      </button>
      
      <button 
        class="scenario-btn" 
        @click="loadScenario('dh-mitm')"
        :class="{ active: activeScenario === 'dh-mitm' }"
      >
        <span class="scenario-icon">🕵️</span>
        <span class="scenario-name">中间人攻击</span>
      </button>
      
      <button 
        class="scenario-btn" 
        @click="loadScenario('padding-oracle')"
        :class="{ active: activeScenario === 'padding-oracle' }"
      >
        <span class="scenario-icon">📮</span>
        <span class="scenario-name">填充预言机攻击</span>
      </button>
    </div>
    
    <div v-if="activeScenario" class="scenario-info">
      <p class="scenario-desc">{{ currentScenario.description }}</p>
      <div class="scenario-badges">
        <span class="badge warning">⚠️ 存在安全漏洞</span>
        <span class="badge info">{{ currentScenario.difficulty }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['load-scenario'])
const activeScenario = ref(null)

const scenarios = {
  'rsa-small-factor': {
    name: 'RSA小模数分解',
    description: '使用小素数(p/q < 2^16)作为 RSA 密钥因子，导致模数 n 可在秒级时间内被分解，私钥 d 将被轻易获取。',
    difficulty: '入门级',
    algorithm: 'rsa',
    animationType: 'prime-sieve'
  },
  'aes-weak-key': {
    name: 'AES弱密钥攻击',
    description: '使用全零或重复字节作为密钥，导致密钥扩展产生的某些轮密钥相同，攻击者可以利用相关密钥攻击恢复明文。',
    difficulty: '进阶级',
    algorithm: 'aes',
    animationType: 'key-expansion'
  },
  'dh-mitm': {
    name: '中间人攻击',
    description: 'Diffie-Hellman 密钥交换缺乏身份验证，攻击者可以拦截并替换双方公钥，分别与 Alice 和 Bob 建立共享密钥。',
    difficulty: '入门级',
    algorithm: 'dh',
    animationType: 'mitm'
  },
  'padding-oracle': {
    name: '填充预言机攻击',
    description: 'CBC 模式加密中，服务器对无效 padding 返回不同错误，攻击者可通过 oracle 逐步解密任意密文块。',
    difficulty: '高级',
    algorithm: 'aes',
    animationType: 'particle-diffusion'
  }
}

const currentScenario = computed(() => {
  return scenarios[activeScenario.value] || {}
})

function loadScenario(id) {
  activeScenario.value = id
  const scenario = scenarios[id]
  
  if (scenario.algorithm === 'rsa' && id === 'rsa-small-factor') {
    emit('load-scenario', {
      type: 'rsa-small-factor',
      bits: 32,
      smallFactor: true,
      animationType: 'prime-sieve',
      description: scenario.description
    })
  } else if (scenario.algorithm === 'aes' && id === 'aes-weak-key') {
    emit('load-scenario', {
      type: 'aes-weak-key',
      key: '00000000000000000000000000000000',
      animationType: 'key-expansion',
      description: scenario.description
    })
  } else if (scenario.algorithm === 'dh' && id === 'dh-mitm') {
    emit('load-scenario', {
      type: 'dh-mitm',
      animationType: 'mitm',
      description: scenario.description
    })
  } else if (scenario.algorithm === 'aes' && id === 'padding-oracle') {
    emit('load-scenario', {
      type: 'padding-oracle',
      animationType: 'particle-diffusion',
      description: scenario.description
    })
  }
}
</script>

<style scoped>
.attack-scenarios {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--accent-orange);
}

.scenario-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.scenario-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.scenario-btn:hover {
  border-color: var(--accent-orange);
  transform: translateY(-2px);
}

.scenario-btn.active {
  border-color: var(--accent-orange);
  background: rgba(255, 107, 53, 0.1);
  box-shadow: 0 0 15px rgba(255, 107, 53, 0.3);
}

.scenario-icon {
  font-size: 1.5rem;
}

.scenario-name {
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
}

.scenario-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  border-left: 3px solid var(--accent-orange);
}

.scenario-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.scenario-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

.badge.warning {
  background: rgba(255, 107, 53, 0.2);
  color: var(--accent-orange);
}

.badge.info {
  background: rgba(0, 255, 242, 0.2);
  color: var(--accent-cyan);
}
</style>
