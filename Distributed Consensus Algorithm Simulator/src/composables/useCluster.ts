import { ref, reactive, computed, onUnmounted } from 'vue';
import type { Node, LogEntry, ClusterEvent, AnimationEvent, ClusterConfig, WSMessage } from './types';

const DEFAULT_CONFIG: ClusterConfig = {
  nodeCount: 5,
  minLatency: 50,
  maxLatency: 200,
  failureProbability: 0.0,
  heartbeatInterval: 150,
  electionTimeoutMin: 300,
  electionTimeoutMax: 600
};

const state = reactive({
  clusterId: null as string | null,
  nodes: [] as Node[],
  logs: {} as Record<number, LogEntry[]>,
  events: [] as ClusterEvent[],
  config: { ...DEFAULT_CONFIG } as ClusterConfig,
  stats: {} as Record<string, unknown>,
  isConnected: false,
  isRunning: false,
  isPaused: false,
  simulationSpeed: 1,
  currentTerm: 0,
  leaderId: null as number | null,
  animations: [] as AnimationEvent[],
  scenarios: [] as { name: string; description: string; icon: string }[]
});

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let animationCallbacks: Set<(animation: AnimationEvent) => void> = new Set();
let isReconnecting = false;
let shouldReconnect = true;
let animationTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function useCluster() {
  const leader = computed(() => state.nodes.find(n => n.id === state.leaderId));
  const followers = computed(() => state.nodes.filter(n => n.state === 'follower'));
  const candidates = computed(() => state.nodes.filter(n => n.state === 'candidate'));
  const deadNodes = computed(() => state.nodes.filter(n => n.state === 'dead'));
  const partitionedNodes = computed(() => state.nodes.filter(n => n.isPartitioned));
  
  const isRunning = computed(() => state.isRunning);
  const isPaused = computed(() => state.isPaused);
  const isConnected = computed(() => state.isConnected);
  
  const totalNodes = computed(() => state.nodes.length);
  const aliveNodes = computed(() => state.nodes.filter(n => n.state !== 'dead').length);

  async function createCluster(nodeCount: number = 5, config?: Partial<ClusterConfig>): Promise<void> {
    try {
      if (ws) {
        shouldReconnect = false;
        ws.close();
        ws = null;
      }
      
      state.clusterId = null;
      state.isConnected = false;
      
      const response = await fetch('/api/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeCount, config })
      });
      const data = await response.json();
      state.clusterId = data.clusterId;
      state.nodes = data.nodes;
      state.config = data.config;
      state.currentTerm = 0;
      state.leaderId = null;
      state.events = [];
      state.animations = [];
      
      shouldReconnect = true;
      console.log('Created cluster with ID:', state.clusterId);
      connectWebSocket();
    } catch (error) {
      console.error('Failed to create cluster:', error);
    }
  }

  async function loadScenario(name: string): Promise<void> {
    try {
      const response = await fetch(`/api/scenario/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusterId: state.clusterId })
      });
      const data = await response.json();
      
      if (data.clusterId) {
        state.clusterId = data.clusterId;
        connectWebSocket();
      }
      
      if (data.nodes) {
        state.nodes = data.nodes;
      }
      if (data.config) {
        state.config = { ...state.config, ...data.config };
      }
      if (data.scenario) {
        console.log('Loaded scenario:', data.scenario.name);
      }
    } catch (error) {
      console.error('Failed to load scenario:', error);
    }
  }

  async function fetchScenarios(): Promise<void> {
    try {
      const response = await fetch('/api/scenarios');
      const data = await response.json();
      state.scenarios = data.scenarios || [];
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  }

  function connectWebSocket(): void {
    if (ws) {
      ws.close();
    }
    
    if (!state.clusterId) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${state.clusterId}`;
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        state.isConnected = true;
        isReconnecting = false;
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSMessage;
          handleMessage(data);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };
      
      ws.onclose = () => {
        state.isConnected = false;
        console.log('WebSocket disconnected, shouldReconnect:', shouldReconnect);
        
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
        }
        
        if (shouldReconnect && state.clusterId) {
          reconnectTimer = setTimeout(() => {
            if (shouldReconnect && state.clusterId) {
              console.log('Reconnecting WebSocket...');
              connectWebSocket();
            }
          }, 3000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  function handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'connected': {
        const payload = message.payload as { nodes: Node[]; config: ClusterConfig; stats: Record<string, unknown> };
        state.nodes = payload.nodes;
        state.config = payload.config;
        state.stats = payload.stats;
        console.log('Connected to cluster, nodes:', state.nodes.length);
        break;
      }
      case 'error': {
        console.log('Received error from server:', message.payload);
        if ((message.payload as { message?: string }).message === 'Cluster not found') {
          console.log('Cluster not found, creating new cluster');
          shouldReconnect = false;
          if (ws) {
            ws.close();
            ws = null;
          }
          state.clusterId = null;
          createCluster(5);
        }
        break;
      }
      case 'state_update': {
        const payload = message.payload as { nodes: Node[]; stats: Record<string, unknown> };
        state.nodes = payload.nodes;
        state.stats = payload.stats;
        const leaderNode = payload.nodes.find(n => n.state === 'leader');
        state.leaderId = leaderNode?.id ?? null;
        state.currentTerm = leaderNode?.currentTerm ?? state.currentTerm;
        break;
      }
      case 'event': {
        const event = message.payload as ClusterEvent;
        state.events.unshift(event);
        if (state.events.length > 200) {
          state.events.pop();
        }
        break;
      }
      case 'animation': {
        const animation = message.payload as AnimationEvent;
        console.log('Received animation message:', animation.type, animation.sourceNodeId, animation.targetNodeId);
        triggerAnimation(animation);
        break;
      }
    }
  }

  function triggerAnimation(animation: AnimationEvent): void {
    state.animations.push(animation);
    
    animationCallbacks.forEach(callback => {
      try {
        callback(animation);
      } catch (e) {
        console.error('Animation callback error:', e);
      }
    });
    
    const timerKey = `${animation.type}_${animation.timestamp}`;
    const timer = setTimeout(() => {
      const index = state.animations.indexOf(animation);
      if (index > -1) {
        state.animations.splice(index, 1);
      }
      animationTimers.delete(timerKey);
    }, animation.duration || 500);
    
    animationTimers.set(timerKey, timer);
  }

  function onAnimation(callback: (animation: AnimationEvent) => void): () => void {
    animationCallbacks.add(callback);
    return () => {
      animationCallbacks.delete(callback);
    };
  }

  function sendAction(action: string, data?: Record<string, unknown>): void {
    console.log('sendAction called:', action, 'ws:', ws?.readyState);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action, ...data });
      console.log('Sending message:', message);
      ws.send(message);
    } else {
      console.log('WebSocket not ready, readyState:', ws?.readyState);
    }
  }

  function start(): void {
    sendAction('start');
    state.isRunning = true;
    state.isPaused = false;
  }

  function pause(): void {
    sendAction('pause');
    state.isPaused = true;
  }

  function resume(): void {
    sendAction('resume');
    state.isPaused = false;
  }

  function reset(): void {
    sendAction('reset');
    state.isRunning = false;
    state.isPaused = false;
    state.currentTerm = 0;
    state.leaderId = null;
    state.events = [];
    state.animations = [];
  }

  function sendCommand(command?: string): void {
    const cmd = command || `cmd-${Date.now()}`;
    sendAction('send', { command: cmd });
  }

  function crashNode(nodeId: number): void {
    sendAction('crash', { nodeId });
  }

  function restartNode(nodeId: number): void {
    sendAction('restart', { nodeId });
  }

  function healNetwork(): void {
    sendAction('heal');
  }

  function setSpeed(speed: number): void {
    state.simulationSpeed = speed;
    sendAction('setSpeed', { speed });
  }

  async function fetchLogs(): Promise<void> {
    if (!state.clusterId) return;
    try {
      const response = await fetch(`/api/clusters/${state.clusterId}/logs`);
      const data = await response.json();
      state.logs = data.logs || {};
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }

  async function fetchEvents(): Promise<void> {
    if (!state.clusterId) return;
    try {
      const response = await fetch(`/api/clusters/${state.clusterId}/events`);
      const data = await response.json();
      state.events = data.events || [];
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }

  function getNodeLogs(nodeId: number): LogEntry[] {
    return state.logs[nodeId] || [];
  }

  function disconnect(): void {
    if (ws) {
      ws.close();
      ws = null;
    }
    state.isConnected = false;
  }

  onUnmounted(() => {
    disconnect();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    animationTimers.forEach(timer => clearTimeout(timer));
    animationTimers.clear();
  });

  return {
    state,
    leader,
    followers,
    candidates,
    deadNodes,
    partitionedNodes,
    isRunning,
    isPaused,
    isConnected,
    totalNodes,
    aliveNodes,
    createCluster,
    loadScenario,
    fetchScenarios,
    connectWebSocket,
    start,
    pause,
    resume,
    reset,
    sendCommand,
    crashNode,
    restartNode,
    healNetwork,
    setSpeed,
    fetchLogs,
    fetchEvents,
    getNodeLogs,
    disconnect,
    onAnimation
  };
}
