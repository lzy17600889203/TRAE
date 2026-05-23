import Fastify from 'fastify'
import cors from '@fastify/cors'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import rsaRoutes from './routes/rsa.js'
import aesRoutes from './routes/aes.js'
import dhRoutes from './routes/dh.js'
import recordsRoutes from './routes/records.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({ logger: true })

await fastify.register(cors, { origin: true })

fastify.get('/', async () => ({ message: 'Crypto Visualizer API' }))

await fastify.register(rsaRoutes, { prefix: '/api/crypto/rsa' })
await fastify.register(aesRoutes, { prefix: '/api/crypto/aes' })
await fastify.register(dhRoutes, { prefix: '/api/crypto/dh' })
await fastify.register(recordsRoutes, { prefix: '/api/records' })

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server running at http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
