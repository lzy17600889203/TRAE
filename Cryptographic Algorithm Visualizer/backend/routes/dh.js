import { DHCrypto } from '../crypto/dhCore.js'

const dh = new DHCrypto()

export default async function dhRoutes(fastify, options) {
  fastify.post('/generate-params', async (request, reply) => {
    const { bits = 256 } = request.body || {}
    
    try {
      const params = dh.generateParams(bits)
      return {
        success: true,
        data: params
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/key-exchange', async (request, reply) => {
    const { p, g } = request.body
    
    if (!p || !g) {
      reply.code(400)
      return { success: false, error: 'Missing p or g parameters' }
    }
    
    try {
      const alice = dh.generateKeyPair(p, g)
      const bob = dh.generateKeyPair(p, g)
      
      const aliceSharedSecret = dh.deriveSharedSecret(alice.privateKey, bob.publicKey, p)
      const bobSharedSecret = dh.deriveSharedSecret(bob.privateKey, alice.publicKey, p)
      
      return {
        success: true,
        data: {
          params: { p, g },
          alice: {
            privateKey: alice.privateKey,
            publicKey: alice.publicKey
          },
          bob: {
            privateKey: bob.privateKey,
            publicKey: bob.publicKey
          },
          sharedSecrets: {
            alice: aliceSharedSecret,
            bob: bobSharedSecret,
            match: aliceSharedSecret === bobSharedSecret
          },
          explanation: 'Diffie-Hellman 密钥交换成功，双方得到相同的共享密钥'
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/mitm', async (request, reply) => {
    const { p, g, alicePublic, bobPublic } = request.body
    
    if (!p || !g || !alicePublic || !bobPublic) {
      reply.code(400)
      return { success: false, error: 'Missing parameters' }
    }
    
    try {
      const result = dh.mitmAttack(p, g, alicePublic, bobPublic, true)
      
      return {
        success: true,
        data: {
          ...result,
          p,
          g,
          originalAlicePublic: alicePublic,
          originalBobPublic: bobPublic
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/demo-mitm', async (request, reply) => {
    try {
      const params = dh.generateParams(128)
      
      const alice = dh.generateKeyPair(params.p, params.g)
      const bob = dh.generateKeyPair(params.p, params.g)
      
      const mitmResult = dh.mitmAttack(
        params.p,
        params.g,
        alice.publicKey,
        bob.publicKey,
        true
      )
      
      return {
        success: true,
        data: {
          params,
          alicePublicKey: alice.publicKey,
          bobPublicKey: bob.publicKey,
          mitmResult,
          vulnerability: 'DH 协议缺乏身份验证，攻击者可以拦截并替换公钥',
          mitigation: '使用 DH 与数字签名结合，或使用 ECDHE 等前向安全的算法'
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })
}
