const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')
const { initDB, saveDB } = require('./src/db/database')

const start = async () => {
  await initDB()
  
  await fastify.register(cors, { origin: '*' })

  const productRoutes = require('./src/routes/products')
  const batchRoutes = require('./src/routes/batches')
  const inventoryRoutes = require('./src/routes/inventory')
  const sceneRoutes = require('./src/routes/scenes')

  fastify.register(productRoutes, { prefix: '/api/products' })
  fastify.register(batchRoutes, { prefix: '/api/batches' })
  fastify.register(inventoryRoutes, { prefix: '/api/inventory' })
  fastify.register(sceneRoutes, { prefix: '/api/scenes' })

  try {
    await fastify.listen({ port: 3001 })
    console.log('Server running on http://localhost:3001')
    
    process.on('SIGINT', () => {
      saveDB()
      process.exit(0)
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()