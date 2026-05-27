const batchService = require('../services/batchService')

module.exports = async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    const { product_id } = request.query
    const batches = await batchService.getBatches(product_id)
    reply.send(batches)
  })

  fastify.get('/:id', async (request, reply) => {
    const batch = await batchService.getBatchById(request.params.id)
    if (batch) {
      reply.send(batch)
    } else {
      reply.status(404).send({ error: 'Batch not found' })
    }
  })

  fastify.post('/', async (request, reply) => {
    const { product_id, batch_no, quantity, cost, expiry_date } = request.body
    if (!product_id || !batch_no || !quantity || !cost) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }
    try {
      const batch = await batchService.createBatch({ product_id, batch_no, quantity, cost, expiry_date })
      reply.status(201).send(batch)
    } catch (error) {
      reply.status(400).send({ error: error.message })
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const success = await batchService.deleteBatch(request.params.id)
    if (success) {
      reply.send({ message: 'Batch deleted' })
    } else {
      reply.status(404).send({ error: 'Batch not found' })
    }
  })
}