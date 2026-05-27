const inventoryService = require('../services/inventoryService')

module.exports = async function (fastify, opts) {
  fastify.get('/snapshot', async (request, reply) => {
    const snapshots = await inventoryService.getInventorySnapshot()
    reply.send(snapshots)
  })

  fastify.get('/snapshot/:product_id', async (request, reply) => {
    const snapshot = await inventoryService.getProductSnapshot(request.params.product_id)
    if (snapshot) {
      reply.send(snapshot)
    } else {
      reply.status(404).send({ error: 'Snapshot not found' })
    }
  })

  fastify.post('/in', async (request, reply) => {
    const { product_id, batch_no, quantity, cost, expiry_date, remark } = request.body
    console.log('Stock In Request:', request.body)
    if (!product_id || !batch_no || !quantity || !cost) {
      return reply.status(400).send({ error: 'Missing required fields', received: { product_id, batch_no, quantity, cost } })
    }
    try {
      const result = inventoryService.stockIn({ product_id, batch_no, quantity, cost, expiry_date, remark })
      reply.status(201).send(result)
    } catch (error) {
      console.error('Stock In Error:', error)
      reply.status(400).send({ error: error.message })
    }
  })

  fastify.post('/out', async (request, reply) => {
    const { product_id, quantity, remark } = request.body
    if (!product_id || !quantity) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }
    try {
      const result = await inventoryService.stockOut({ product_id, quantity, remark })
      reply.status(201).send(result)
    } catch (error) {
      reply.status(400).send({ error: error.message })
    }
  })

  fastify.get('/transactions', async (request, reply) => {
    const { product_id, limit } = request.query
    const transactions = await inventoryService.getTransactions(product_id, limit)
    reply.send(transactions)
  })

  fastify.get('/export', async (request, reply) => {
    const data = await inventoryService.exportReport()
    reply.header('Content-Type', 'application/json')
    reply.header('Content-Disposition', 'attachment; filename=inventory_report.json')
    reply.send(data)
  })
}