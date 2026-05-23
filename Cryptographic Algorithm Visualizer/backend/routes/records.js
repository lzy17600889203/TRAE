const experiments = []
const rsaKeys = []
const aesConfigs = []
const dhSessions = []

let nextExpId = 1
let nextRsaKeyId = 1
let nextAesConfigId = 1
let nextDhSessionId = 1

export default async function recordsRoutes(fastify, options) {
  fastify.post('/save', async (request, reply) => {
    const { name, algorithm, config } = request.body
    
    if (!name || !algorithm) {
      reply.code(400)
      return { success: false, error: 'Missing name or algorithm' }
    }
    
    try {
      const experiment = {
        id: nextExpId++,
        name,
        algorithm,
        config: JSON.stringify(config || {}),
        created_at: new Date().toISOString()
      }
      experiments.push(experiment)
      
      return {
        success: true,
        data: { id: experiment.id, name, algorithm }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/save-rsa-key', async (request, reply) => {
    const { experimentId, publicKey, privateKey } = request.body
    
    try {
      rsaKeys.push({
        id: nextRsaKeyId++,
        experiment_id: experimentId,
        n: publicKey.n,
        e: publicKey.e,
        d: privateKey.d,
        p: privateKey.p,
        q: privateKey.q
      })
      
      return { success: true, data: { message: 'RSA key saved' } }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/save-aes-config', async (request, reply) => {
    const { experimentId, key, mode, weakKeyFlag = false } = request.body
    
    try {
      aesConfigs.push({
        id: nextAesConfigId++,
        experiment_id: experimentId,
        key,
        mode,
        weak_key_flag: weakKeyFlag ? 1 : 0
      })
      
      return { success: true, data: { message: 'AES config saved' } }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.post('/save-dh-session', async (request, reply) => {
    const { experimentId, p, g, alicePublic, bobPublic, mitmAttack = false } = request.body
    
    try {
      dhSessions.push({
        id: nextDhSessionId++,
        experiment_id: experimentId,
        p,
        g,
        alice_public: alicePublic,
        bob_public: bobPublic,
        mitm_attack: mitmAttack ? 1 : 0
      })
      
      return { success: true, data: { message: 'DH session saved' } }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.get('/list', async (request, reply) => {
    try {
      return { success: true, data: experiments }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.get('/experiment/:id', async (request, reply) => {
    const { id } = request.params
    const expId = parseInt(id)
    
    try {
      const experiment = experiments.find(e => e.id === expId)
      
      if (!experiment) {
        reply.code(404)
        return { success: false, error: 'Experiment not found' }
      }
      
      const rsa = rsaKeys.filter(k => k.experiment_id === expId)
      const aes = aesConfigs.filter(c => c.experiment_id === expId)
      const dh = dhSessions.filter(s => s.experiment_id === expId)
      
      return {
        success: true,
        data: {
          experiment,
          rsaKeys: rsa,
          aesConfigs: aes,
          dhSessions: dh
        }
      }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })

  fastify.delete('/experiment/:id', async (request, reply) => {
    const { id } = request.params
    const expId = parseInt(id)
    
    try {
      const expIdx = experiments.findIndex(e => e.id === expId)
      if (expIdx !== -1) {
        experiments.splice(expIdx, 1)
      }
      
      for (let i = rsaKeys.length - 1; i >= 0; i--) {
        if (rsaKeys[i].experiment_id === expId) rsaKeys.splice(i, 1)
      }
      for (let i = aesConfigs.length - 1; i >= 0; i--) {
        if (aesConfigs[i].experiment_id === expId) aesConfigs.splice(i, 1)
      }
      for (let i = dhSessions.length - 1; i >= 0; i--) {
        if (dhSessions[i].experiment_id === expId) dhSessions.splice(i, 1)
      }
      
      return { success: true, data: { message: 'Experiment deleted' } }
    } catch (error) {
      reply.code(500)
      return { success: false, error: error.message }
    }
  })
}
