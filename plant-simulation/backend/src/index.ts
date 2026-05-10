import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { LSystemGenerator } from './lsystem';
import { ConfigService } from './config-service';
import { GenerateRequest, PlantGeneParameters, EnvironmentConfig } from './types';

console.log('========================================');
console.log('  🌱  Plant Growth Simulation Server');
console.log('  L-System Fractal Generator');
console.log('========================================');
console.log('');

class PlantSimulationServer {
  private server: FastifyInstance;
  private configService: ConfigService;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    
    try {
      console.log('[Server] Initializing ConfigService...');
      this.configService = new ConfigService();
      console.log('[Server] ConfigService initialized successfully');
    } catch (err) {
      console.error('[Server] Failed to initialize ConfigService:', err);
      throw err;
    }

    try {
      console.log('[Server] Creating Fastify server...');
      this.server = fastify({ 
        logger: true
      });
      console.log('[Server] Fastify server created');
    } catch (err) {
      console.error('[Server] Failed to create Fastify server:', err);
      throw err;
    }

    this.setupMiddlewares();
    this.setupRoutes();
  }

  private setupMiddlewares(): void {
    console.log('[Server] Setting up CORS middleware...');
    this.server.register(cors, {
      origin: true,
      credentials: true,
    });
  }

  private setupRoutes(): void {
    console.log('[Server] Setting up API routes...');

    this.server.get('/health', async () => {
      return { 
        status: 'ok', 
        timestamp: Date.now(),
        service: 'plant-simulation-backend'
      };
    });

    this.server.get('/', async () => {
      return {
        name: 'Plant Growth Simulation API',
        version: '1.0.0',
        endpoints: {
          health: 'GET /health',
          presets: 'GET /api/presets',
          preset: 'GET /api/presets/:id',
          applyPreset: 'POST /api/presets/:id/apply',
          defaults: 'GET /api/defaults',
          generate: 'POST /api/generate',
        }
      };
    });

    this.server.get('/api/presets', async () => {
      const presets = this.configService.getPresets();
      console.log('[API] GET /api/presets - returning', presets.length, 'presets');
      return { presets };
    });

    this.server.get('/api/presets/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const preset = this.configService.getPreset(id);
      if (!preset) {
        reply.status(404);
        return { error: 'Preset not found', id };
      }
      return preset;
    });

    this.server.get('/api/defaults', async () => {
      return {
        genes: this.configService.getDefaultGenes(),
        environment: this.configService.getDefaultEnvironment(),
      };
    });

    this.server.post('/api/generate', async (request, reply) => {
      console.log('[API] POST /api/generate - starting generation...');
      const startTime = Date.now();
      
      try {
        const body = request.body as GenerateRequest;

        const genes: PlantGeneParameters = {
          ...this.configService.getDefaultGenes(),
          ...body.genes,
        };

        const environment: EnvironmentConfig = {
          ...this.configService.getDefaultEnvironment(),
          ...body.environment,
        };

        console.log('[API] Parameters - iterations:', genes.iterations, 'angle:', genes.branchAngle);

        if (genes.iterations > 15) {
          reply.status(400);
          return {
            error: 'Iterations too high',
            message: 'Maximum supported iterations is 15 to prevent performance issues',
          };
        }

        const generator = new LSystemGenerator(genes, environment);
        const structure = generator.generate();

        const elapsed = Date.now() - startTime;
        console.log('[API] Generation completed in', elapsed, 'ms');
        console.log('[API] Branches:', structure.metadata.totalBranches, 
                    'Leaves:', structure.leaves.length,
                    'Flowers:', structure.flowers.length);

        return {
          structure,
          parameters: { genes, environment },
          generationTimeMs: elapsed,
        };
      } catch (error) {
        console.error('[API] Generation failed:', error);
        reply.status(500);
        return {
          error: 'Generation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    this.server.post('/api/defaults/genes', async (request) => {
      const genes = request.body as PlantGeneParameters;
      this.configService.saveGenes(genes);
      return { success: true, genes };
    });

    this.server.post('/api/defaults/environment', async (request) => {
      const environment = request.body as EnvironmentConfig;
      this.configService.saveEnvironment(environment);
      return { success: true, environment };
    });

    this.server.post('/api/presets/:id/apply', async (request, reply) => {
      const { id } = request.params as { id: string };
      console.log('[API] POST /api/presets/:id/apply - id:', id);
      
      const preset = this.configService.getPreset(id);
      if (!preset) {
        reply.status(404);
        return { error: 'Preset not found', id };
      }

      try {
        const generator = new LSystemGenerator(preset.genes, preset.environment);
        const structure = generator.generate();

        console.log('[API] Preset applied successfully:', preset.name);

        return {
          structure,
          preset,
          parameters: { genes: preset.genes, environment: preset.environment },
        };
      } catch (error) {
        console.error('[API] Preset application failed:', error);
        reply.status(500);
        return {
          error: 'Preset application failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    console.log('[Server] API routes setup complete');
  }

  public async start(): Promise<void> {
    try {
      console.log(`[Server] Attempting to start on port ${this.port}...`);
      await this.server.listen({ port: this.port, host: '0.0.0.0' });
      console.log('');
      console.log('========================================');
      console.log('  ✅ Server started successfully!');
      console.log('  📡 API: http://localhost:' + this.port);
      console.log('  🩺 Health: http://localhost:' + this.port + '/health');
      console.log('========================================');
      console.log('');
    } catch (err) {
      console.error('');
      console.error('========================================');
      console.error('  ❌ Failed to start server');
      console.error('========================================');
      console.error(err);
      console.error('');
      process.exit(1);
    }
  }
}

async function main() {
  try {
    const port = parseInt(process.env.PORT || '8080', 10);
    console.log('[Main] Starting server on port:', port);
    
    const server = new PlantSimulationServer(port);
    await server.start();
  } catch (err) {
    console.error('[Main] Fatal error during startup:', err);
    console.log('');
    console.log('💡 提示：端口被占用，请尝试以下步骤：');
    console.log('   1. 关闭其他占用该端口的程序');
    console.log('   2. 或者设置环境变量使用其他端口：');
    console.log('      set PORT=8081 && npm run dev');
    console.log('');
    process.exit(1);
  }
}

main();
