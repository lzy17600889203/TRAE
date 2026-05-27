const sceneService = require('../services/sceneService')

module.exports = async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    const scenes = sceneService.getScenes()
    reply.send(scenes)
  })

  fastify.post('/load/:sceneId', async (request, reply) => {
    try {
      const result = await sceneService.loadScene(request.params.sceneId)
      reply.send(result)
    } catch (error) {
      reply.status(400).send({ error: error.message })
    }
  })

  fastify.post('/reset', async (request, reply) => {
    await sceneService.resetDatabase()
    reply.send({ message: 'Database reset successfully' })
  })
}