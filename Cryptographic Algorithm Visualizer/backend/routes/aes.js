import { AESCrypto } from '../crypto/aesCore.js'

const aes = new AESCrypto()

export default async function aesRoutes(fastify, options) {
  fastify.post('/encrypt', async (request, reply) => {
    const { plaintext, key, mode = 'ECB', iv = null, returnSteps = true } = request.body
    
    if (!plaintext || !key) {
      reply.code(400)
      return { success: false, error: 'Missing plaintext or key' }
    }
    
    try {
      const result = aes.encrypt(plaintext, key, mode, iv, returnSteps)
      
      const weakKeyIndicators = checkWeakKey(key)
      
      return {
        success: true,
        data: {
          ...result,
          weakKeyIndicators,
          mode,
          vulnerability: weakKeyIndicators.isWeak ? '弱密钥导致密钥扩展模式重复' : null
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/decrypt', async (request, reply) => {
    const { ciphertext, key, mode = 'ECB', iv = null } = request.body
    
    if (!ciphertext || !key) {
      reply.code(400)
      return { success: false, error: 'Missing ciphertext or key' }
    }
    
    try {
      const result = aes.decrypt(ciphertext, key, mode, iv)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/weak-key', async (request, reply) => {
    const { type = 'all-zeros' } = request.body
    
    try {
      const weakKey = aes.generateWeakKey(type)
      
      const result = aes.encrypt('00112233445566778899aabbccddeeff', weakKey, 'ECB', null, true)
      
      return {
        success: true,
        data: {
          weakKey,
          type,
          keySchedule: result.keySchedule,
          vulnerability: '弱密钥导致密钥扩展中某些轮密钥相同，攻击者可利用相关密钥攻击',
          attackScenario: '相关密钥攻击: 攻击者知道 (K, K⊕C) 的加密结果，可以推导出 K'
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/ecb-pattern', async (request, reply) => {
    const { plaintext, key } = request.body
    
    if (!plaintext || !key) {
      reply.code(400)
      return { success: false, error: 'Missing plaintext or key' }
    }
    
    try {
      const repeatedBlock = '41424344454647484142434445464748'
      const testPlaintext = repeatedBlock + repeatedBlock + repeatedBlock
      
      const result = aes.encrypt(testPlaintext, key, 'ECB', null, false)
      
      const blocks = []
      for (let i = 0; i < result.ciphertext.length; i += 32) {
        blocks.push(result.ciphertext.slice(i, i + 32))
      }
      
      const uniqueBlocks = [...new Set(blocks)]
      
      return {
        success: true,
        data: {
          plaintext: testPlaintext,
          ciphertext: result.ciphertext,
          blocks,
          uniqueBlockCount: uniqueBlocks.length,
          totalBlockCount: blocks.length,
          vulnerability: uniqueBlocks.length < blocks.length ? 'ECB 模式泄露明文结构' : null,
          explanation: '相同明文块产生相同密文块，攻击者可以从密文观察到明文模式'
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/padding-oracle', async (request, reply) => {
    const { ciphertext, key, simulateAttack = true } = request.body
    
    try {
      if (simulateAttack) {
        const paddingErrors = []
        
        for (let i = 0; i < 16; i++) {
          const errorRate = 0.3 + Math.random() * 0.5
          paddingErrors.push({
            position: i,
            errorRate,
            description: errorRate > 0.7 ? '高频错误' : '低频错误',
            exploitability: errorRate > 0.6 ? '易受攻击' : '较安全'
          })
        }
        
        return {
          success: true,
          data: {
            vulnerability: 'Padding Oracle 攻击可行',
            description: '服务器对无效 padding 返回不同错误，攻击者可通过 oracle 逐步解密',
            attackSteps: [
              '攻击者修改密文最后一块的某一字节',
              '发送修改后的密文给 oracle',
              '根据返回的 padding 错误判断该字节正确值',
              '重复直到解密出完整明文'
            ],
            paddingErrors,
            mitigation: '使用 GCM/CCM 等认证加密模式，或确保 padding 验证错误与成功返回相同信息'
          }
        }
      }
      
      return {
        success: true,
        data: { message: 'Padding oracle simulation disabled' }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })
}

function checkWeakKey(key) {
  const isAllZeros = key === '0'.repeat(32)
  const isAllOnes = key === 'f'.repeat(32)
  const isHalfZeros = key.startsWith('0'.repeat(16)) && key.endsWith('f'.repeat(16))
  const isRepeatingByte = /^([0-9a-f])\1{31}$/i.test(key)
  
  return {
    isWeak: isAllZeros || isAllOnes || isHalfZeros || isRepeatingByte,
    indicators: {
      allZeros: isAllZeros,
      allOnes: isAllOnes,
      halfZeros: isHalfZeros,
      repeatingByte: isRepeatingByte
    }
  }
}
