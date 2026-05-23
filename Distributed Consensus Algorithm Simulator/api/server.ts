import Fastify from 'fastify';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { DatabaseService } from './database/DatabaseService.js';
import { RaftEngine } from './engine/RaftEngine.js';
import { DEFAULT_CONFIG, PRESET_SCENARIOS, getScenario } from './config/scenarios.js';
import type { ClusterConfig, ClusterEvent, AnimationEvent, Node } from '../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

interface ClusterInstance {
  id: string;
  engine: RaftEngine;
  db: DatabaseService;
  clients: Set<WebSocket>;
}

class Server {
  private app: FastifyInstance;
  private clusters: Map<string, ClusterInstance> = new Map();

  constructor(options?: FastifyServerOptions) {
    this.app = Fastify(options || { logger: false });
    
    this.app.register(cors, {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });
    
    this.app.register(fastifyWebsocket);
    
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/api/health', async () => {
      return { status: 'ok', timestamp: Date.now() };
    });

    this.app.post('/api/cluster', async (request, reply) => {
      const body = request.body as { nodeCount?: number; config?: Partial<ClusterConfig> };
      const nodeCount = body.nodeCount || 5;
      const config: ClusterConfig = {
        ...DEFAULT_CONFIG,
        ...body.config,
        nodeCount
      };
      
      console.log('Creating cluster with config:', config);
      
      const clusterId = uuidv4();
      console.log('Generated clusterId:', clusterId);
      
      const db = new DatabaseService();
      await db.initialize();
      
      const now = Date.now();
      db.saveCluster(clusterId, config, 'idle', now);
      
      const engine = new RaftEngine(
        clusterId,
        config,
        {
          onEvent: (event: ClusterEvent) => this.broadcastEvent(clusterId, event),
          onAnimation: (animation: AnimationEvent) => this.broadcastAnimation(clusterId, animation),
          onStateChange: (nodes: Node[]) => this.broadcastState(clusterId, nodes)
        },
        db
      );
      
      engine.initializeNodes();
      
      this.clusters.set(clusterId, {
        id: clusterId,
        engine,
        db,
        clients: new Set()
      });
      
      console.log('Cluster created successfully, total clusters:', this.clusters.size);
      
      return { clusterId, nodes: engine.getNodes(), config };
    });

    this.app.put('/api/cluster/:id/config', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as Partial<ClusterConfig>;
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.updateConfig(body);
      return { success: true, config: cluster.engine.getConfig() };
    });

    this.app.post('/api/cluster/:id/start', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.start();
      cluster.db.updateClusterStatus(id, 'running');
      return { success: true };
    });

    this.app.post('/api/cluster/:id/pause', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.pause();
      cluster.db.updateClusterStatus(id, 'paused');
      return { success: true };
    });

    this.app.post('/api/cluster/:id/resume', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.resume();
      cluster.db.updateClusterStatus(id, 'running');
      return { success: true };
    });

    this.app.post('/api/cluster/:id/reset', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.reset();
      cluster.engine.initializeNodes();
      cluster.db.updateClusterStatus(id, 'idle');
      return { success: true, nodes: cluster.engine.getNodes() };
    });

    this.app.post('/api/cluster/:id/speed', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { speed: number };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.setSpeed(body.speed);
      return { success: true };
    });

    this.app.post('/api/cluster/:id/send', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { command: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.sendClientRequest(body.command || `cmd-${Date.now()}`);
      return { success: true };
    });

    this.app.post('/api/scenario/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      const body = request.body as { clusterId?: string };
      
      const scenario = getScenario(name);
      if (!scenario) {
        return reply.code(404).send({ error: 'Scenario not found' });
      }
      
      if (body.clusterId) {
        const cluster = this.clusters.get(body.clusterId);
        if (cluster) {
          cluster.engine.reset();
          cluster.engine.updateConfig(scenario.config);
          
          if (scenario.partitions) {
            cluster.engine.setPartitionGroups(scenario.partitions);
          }
          if (scenario.crashSchedule) {
            cluster.engine.setCrashSchedule(scenario.crashSchedule);
          }
          if (scenario.messageDelay) {
            cluster.engine.setMessageDelay(scenario.messageDelay);
          }
          if (scenario.inconsistentLogs) {
            cluster.engine.setInconsistentLogs(scenario.inconsistentLogs);
          }
          
          cluster.engine.initializeNodes();
          
          return { 
            success: true, 
            scenario, 
            nodes: cluster.engine.getNodes(),
            config: cluster.engine.getConfig()
          };
        }
      }
      
      const clusterId = uuidv4();
      const db = new DatabaseService();
      await db.initialize();
      
      const config: ClusterConfig = {
        ...DEFAULT_CONFIG,
        ...scenario.config
      };
      
      db.saveCluster(clusterId, config, 'idle', Date.now());
      
      const engine = new RaftEngine(
        clusterId,
        config,
        {
          onEvent: (event: ClusterEvent) => this.broadcastEvent(clusterId, event),
          onAnimation: (animation: AnimationEvent) => this.broadcastAnimation(clusterId, animation),
          onStateChange: (nodes: Node[]) => this.broadcastState(clusterId, nodes)
        },
        db
      );
      
      engine.initializeNodes();
      
      if (scenario.partitions) {
        engine.setPartitionGroups(scenario.partitions);
      }
      if (scenario.crashSchedule) {
        engine.setCrashSchedule(scenario.crashSchedule);
      }
      if (scenario.messageDelay) {
        engine.setMessageDelay(scenario.messageDelay);
      }
      if (scenario.inconsistentLogs) {
        engine.setInconsistentLogs(scenario.inconsistentLogs);
      }
      
      this.clusters.set(clusterId, {
        id: clusterId,
        engine,
        db,
        clients: new Set()
      });
      
      return { clusterId, scenario, nodes: engine.getNodes(), config };
    });

    this.app.get('/api/scenarios', async () => {
      return { scenarios: PRESET_SCENARIOS.map(s => ({
        name: s.name,
        description: s.description,
        icon: s.icon
      }))};
    });

    this.app.get('/api/clusters/:id/nodes', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      return { nodes: cluster.engine.getNodes() };
    });

    this.app.get('/api/clusters/:id/nodes/:nodeId', async (request, reply) => {
      const { id, nodeId } = request.params as { id: string; nodeId: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      const nodeIdNum = parseInt(nodeId);
      const node = cluster.engine.getNode(nodeIdNum);
      
      if (!node) {
        return reply.code(404).send({ error: 'Node not found' });
      }
      
      const logs = cluster.engine.getLogs(nodeIdNum);
      return { node, logs, stats: cluster.engine.getStats() };
    });

    this.app.post('/api/clusters/:id/nodes/:nodeId/crash', async (request, reply) => {
      const { id, nodeId } = request.params as { id: string; nodeId: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.crashNode(parseInt(nodeId));
      return { success: true };
    });

    this.app.post('/api/clusters/:id/nodes/:nodeId/restart', async (request, reply) => {
      const { id, nodeId } = request.params as { id: string; nodeId: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.restartNode(parseInt(nodeId));
      return { success: true };
    });

    this.app.post('/api/clusters/:id/network/heal', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      cluster.engine.healNetwork();
      return { success: true };
    });

    this.app.get('/api/clusters/:id/logs', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      const nodes = cluster.engine.getNodes();
      const allLogs: Record<number, unknown[]> = {};
      nodes.forEach(node => {
        allLogs[node.id] = cluster.engine.getLogs(node.id);
      });
      
      return { logs: allLogs };
    });

    this.app.get('/api/clusters/:id/events', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      const events = cluster.db.getEvents(id, 200);
      return { events };
    });

    this.app.get('/api/clusters/:id/stats', async (request, reply) => {
      const { id } = request.params as { id: string };
      const cluster = this.clusters.get(id);
      
      if (!cluster) {
        return reply.code(404).send({ error: 'Cluster not found' });
      }
      
      return cluster.engine.getStats();
    });

    this.app.register(async (instance) => {
      instance.get('/ws/:clusterId', { websocket: true }, (connection, request) => {
        const { clusterId } = request.params as { clusterId: string };
        console.log('WebSocket connection request for cluster:', clusterId);
        console.log('Connection object keys:', Object.keys(connection));
        console.log('Socket:', (connection as any).socket);
        
        const ws = (connection as any).socket as WebSocket || (connection as any);
        console.log('WS object:', typeof ws, ws?.readyState);
        
        const cluster = this.clusters.get(clusterId);
        
        if (!cluster) {
          console.log('Cluster not found, sending error and closing connection');
          try {
            if (ws && typeof ws.send === 'function') {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Cluster not found' }
              }));
            }
          } catch (e) {
            console.error('Failed to send error message:', e);
          }
          if (ws && typeof ws.close === 'function') {
            ws.close();
          }
          return;
        }
        
        console.log('Adding client to cluster, current clients:', cluster.clients.size);
        cluster.clients.add(ws);
        console.log('Clients after add:', cluster.clients.size);
        
        if (ws && typeof ws.on === 'function') {
          ws.on('close', () => {
            console.log('WebSocket connection closed');
            cluster.clients.delete(ws);
          });
          
          ws.on('message', (message: Buffer | string) => {
            try {
              const data = JSON.parse(message.toString());
              console.log('Received WebSocket message:', data);
              this.handleWebSocketMessage(clusterId, ws, data);
            } catch (e) {
              console.error('WebSocket message error:', e);
            }
          });
        }
        
        console.log('Sending connected message to client');
        const connectedMessage = {
          type: 'connected',
          payload: {
            clusterId,
            nodes: cluster.engine.getNodes(),
            config: cluster.engine.getConfig(),
            stats: cluster.engine.getStats()
          }
        };
        console.log('Connected message:', JSON.stringify(connectedMessage));
        this.sendToClient(ws, connectedMessage);
        console.log('Connected message sent');
      });
    });
  }

  private handleWebSocketMessage(clusterId: string, client: WebSocket, data: Record<string, unknown>): void {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;
    
    const action = data.action as string;
    
    switch (action) {
      case 'start':
        cluster.engine.start();
        break;
      case 'pause':
        cluster.engine.pause();
        break;
      case 'resume':
        cluster.engine.resume();
        break;
      case 'reset':
        cluster.engine.reset();
        cluster.engine.initializeNodes();
        break;
      case 'send':
        cluster.engine.sendClientRequest(data.command as string || `cmd-${Date.now()}`);
        break;
      case 'crash':
        cluster.engine.crashNode(data.nodeId as number);
        break;
      case 'restart':
        cluster.engine.restartNode(data.nodeId as number);
        break;
      case 'heal':
        cluster.engine.healNetwork();
        break;
      case 'setSpeed':
        cluster.engine.setSpeed(data.speed as number);
        break;
    }
  }

  private broadcastEvent(clusterId: string, event: ClusterEvent): void {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;
    
    this.broadcastToClients(clusterId, {
      type: 'event',
      payload: event
    });
  }

  private broadcastAnimation(clusterId: string, animation: AnimationEvent): void {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;
    
    this.broadcastToClients(clusterId, {
      type: 'animation',
      payload: animation
    });
  }

  private broadcastState(clusterId: string, nodes: Node[]): void {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;
    
    this.broadcastToClients(clusterId, {
      type: 'state_update',
      payload: { nodes, stats: cluster.engine.getStats() }
    });
  }

  private broadcastToClients(clusterId: string, message: Record<string, unknown>): void {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;
    
    console.log(`Broadcasting to ${cluster.clients.size} clients:`, message.type);
    
    const clientsToRemove: WebSocket[] = [];
    cluster.clients.forEach(client => {
      try {
        if (client && typeof client.send === 'function' && client.readyState === 1) {
          client.send(JSON.stringify(message));
        } else {
          clientsToRemove.push(client);
        }
      } catch (e) {
        console.error('WebSocket send error:', e);
        clientsToRemove.push(client);
      }
    });
    
    clientsToRemove.forEach(client => {
      cluster.clients.delete(client);
    });
  }

  private sendToClient(client: WebSocket, message: Record<string, unknown>): void {
    try {
      console.log('Sending message to client, readyState:', client?.readyState);
      if (client && typeof client.send === 'function' && client.readyState === 1) {
        client.send(JSON.stringify(message));
        console.log('Message sent successfully');
      } else {
        console.log('Client not ready, readyState:', client?.readyState);
      }
    } catch (e) {
      console.error('WebSocket send error:', e);
    }
  }

  async start(port: number): Promise<void> {
    try {
      await this.app.listen({ port, host: '0.0.0.0' });
      console.log(`Server listening on port ${port}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    this.clusters.forEach(cluster => {
      cluster.engine.stop();
      cluster.db.close();
    });
    this.clusters.clear();
    await this.app.close();
  }
}

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = new Server();

async function start(): Promise<void> {
  try {
    await server.start(PORT);
    console.log(`Raft Consensus Simulator server running on port ${PORT}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

start();
