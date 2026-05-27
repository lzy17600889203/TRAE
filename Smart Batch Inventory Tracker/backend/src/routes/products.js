const productService = require('../services/productService')

module.exports = async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    const products = productService.getAllProducts()
    reply.send(products)
  })

  fastify.get('/:id', async (request, reply) => {
    const product = productService.getProductById(request.params.id)
    if (product) {
      reply.send(product)
    } else {
      reply.status(404).send({ error: 'Product not found' })
    }
  })

  fastify.post('/', async (request, reply) => {
    const { code, name, unit, min_stock, max_stock } = request.body
    if (!code || !name || !unit) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }
    try {
      const product = productService.createProduct({ code, name, unit, min_stock: min_stock || 0, max_stock: max_stock || 99999 })
      reply.status(201).send(product)
    } catch (error) {
      reply.status(400).send({ error: error.message })
    }
  })

  fastify.put('/:id', async (request, reply) => {
    const { code, name, unit, min_stock, max_stock } = request.body
    try {
      const product = productService.updateProduct(request.params.id, { code, name, unit, min_stock, max_stock })
      reply.send(product)
    } catch (error) {
      reply.status(400).send({ error: error.message })
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const success = productService.deleteProduct(request.params.id)
    if (success) {
      reply.send({ message: 'Product deleted' })
    } else {
      reply.status(404).send({ error: 'Product not found' })
    }
  })
}