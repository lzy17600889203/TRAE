import { RSACrypto } from '../crypto/rsaCore.js'

const rsa = new RSACrypto()

export default async function rsaRoutes(fastify, options) {
  fastify.post('/generate', async (request, reply) => {
    const { bits = 1024, smallFactor = false } = request.body || {}
    
    try {
      const keyPair = rsa.generateKeyPair(bits, smallFactor)
      return {
        success: true,
        data: keyPair
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/encrypt', async (request, reply) => {
    const { plaintext, publicKey } = request.body
    
    if (!plaintext || !publicKey) {
      reply.code(400)
      return { success: false, error: 'Missing plaintext or publicKey' }
    }
    
    try {
      const messageBigint = BigInt('0x' + Buffer.from(plaintext, 'utf-8').toString('hex'))
      const ciphertext = rsa.encrypt(messageBigint.toString(), publicKey)
      
      return {
        success: true,
        data: {
          ciphertext,
          plaintext,
          publicKey
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/decrypt', async (request, reply) => {
    const { ciphertext, privateKey } = request.body
    
    if (!ciphertext || !privateKey) {
      reply.code(400)
      return { success: false, error: 'Missing ciphertext or privateKey' }
    }
    
    try {
      const decrypted = rsa.decrypt(ciphertext, privateKey)
      const hexString = decrypted.replace('0x', '')
      const plaintext = Buffer.from(hexString, 'hex').toString('utf-8')
      
      return {
        success: true,
        data: {
          plaintext,
          ciphertext,
          privateKey
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/factor', async (request, reply) => {
    const { n } = request.body
    
    if (!n) {
      reply.code(400)
      return { success: false, error: 'Missing modulus n' }
    }
    
    try {
      const result = rsa.factorModulus(n, true)
      
      const p = result.factors[0]
      const q = result.factors[1]
      
      let derivedPrivateKey = null
      if (p && q) {
        derivedPrivateKey = rsa.derivePrivateKey(n, p, q, '65537')
      }
      
      return {
        success: true,
        data: {
          originalN: n,
          factors: result.factors,
          p,
          q,
          derivedPrivateKey,
          steps: result.steps,
          vulnerability: result.factors.length > 0 ? '小素数导致模数可被轻易分解' : '无法分解',
          attackSpeed: result.factors.length > 0 ? '极快 (<1秒)' : '失败'
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })
}
