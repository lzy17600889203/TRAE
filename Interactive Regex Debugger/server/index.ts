import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { RegexParser } from './regexParser'
import { FSMBuilder } from './fsmBuilder'
import { RegexMatcher } from './regexMatcher'
import { DatabaseManager } from './database'
import type { RegexAnalysisResult, RegexSnippet, DebugHistory } from '../shared/types'

const fastify: FastifyInstance = Fastify({ logger: true })

fastify.register(cors, {
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: Date.now() }
})

fastify.post('/api/analyze', async (request, reply) => {
  try {
    const body = request.body as { pattern: string; testString: string; flags: string }

    if (!body.pattern) {
      return reply.code(400).send({ error: 'Pattern is required' })
    }

    if (!body.testString) {
      return reply.code(400).send({ error: 'Test string is required' })
    }

    const parser = new RegexParser(body.pattern)
    const { ast, warnings: parseWarnings } = parser.parse()

    const fsmBuilder = new FSMBuilder()
    const fsm = fsmBuilder.build(ast)

    const matcher = new RegexMatcher(ast, fsm, body.pattern, body.testString, body.flags || '')
    const { steps, finalResult, warnings: matchWarnings } = matcher.match()

    const result: RegexAnalysisResult = {
      ast,
      fsm,
      steps,
      finalResult,
      warnings: [...parseWarnings, ...matchWarnings]
    }

    const db = DatabaseManager.getInstance()
    await db.addHistory({
      pattern: body.pattern,
      testString: body.testString,
      flags: body.flags || '',
      result: JSON.stringify(finalResult)
    })

    return result
  } catch (error: any) {
    fastify.log.error(error)
    return reply.code(500).send({ error: error.message || 'Internal server error' })
  }
})

fastify.get('/api/snippets', async () => {
  try {
    const db = DatabaseManager.getInstance()
    const snippets = await db.getSnippets()
    return { snippets }
  } catch (error: any) {
    fastify.log.error(error)
    return { error: error.message || 'Failed to fetch snippets' }
  }
})

fastify.post('/api/snippets', async (request, reply) => {
  try {
    const body = request.body as Omit<RegexSnippet, 'id' | 'createdAt' | 'updatedAt'>

    if (!body.name || !body.pattern) {
      return reply.code(400).send({ error: 'Name and pattern are required' })
    }

    const db = DatabaseManager.getInstance()
    const snippet = await db.addSnippet(body)
    return { snippet }
  } catch (error: any) {
    fastify.log.error(error)
    return reply.code(500).send({ error: error.message || 'Failed to create snippet' })
  }
})

fastify.put('/api/snippets/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<Omit<RegexSnippet, 'id' | 'createdAt'>>

    const db = DatabaseManager.getInstance()
    await db.updateSnippet(parseInt(id), body)
    return { success: true }
  } catch (error: any) {
    fastify.log.error(error)
    return reply.code(500).send({ error: error.message || 'Failed to update snippet' })
  }
})

fastify.delete('/api/snippets/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string }

    const db = DatabaseManager.getInstance()
    await db.deleteSnippet(parseInt(id))
    return { success: true }
  } catch (error: any) {
    fastify.log.error(error)
    return reply.code(500).send({ error: error.message || 'Failed to delete snippet' })
  }
})

fastify.get('/api/history', async () => {
  try {
    const db = DatabaseManager.getInstance()
    const history = await db.getHistory()
    return { history }
  } catch (error: any) {
    fastify.log.error(error)
    return { error: error.message || 'Failed to fetch history' }
  }
})

fastify.delete('/api/history', async () => {
  try {
    const db = DatabaseManager.getInstance()
    await db.clearHistory()
    return { success: true }
  } catch (error: any) {
    fastify.log.error(error)
    return { error: error.message || 'Failed to clear history' }
  }
})

const start = async () => {
  try {
    const db = DatabaseManager.getInstance()
    await db.initialize()
    fastify.log.info('Database initialized')

    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    fastify.log.info('Server listening on port 3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
