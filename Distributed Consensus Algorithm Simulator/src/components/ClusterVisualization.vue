<script setup lang="ts">
import { computed, reactive, ref, watch, onUnmounted } from 'vue';
import { useCluster } from '../composables/useCluster';
import type { Node, AnimationEvent } from '../../shared/types';

const { state, crashNode, restartNode, onAnimation } = useCluster();

const selectedNode = ref<number | null>(null);
const showNodeMenu = ref(false);

const nodeColors: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  follower: { bg: 'bg-blue-500/20', border: 'border-blue-400', glow: 'shadow-blue-500/50', text: 'text-blue-400' },
  candidate: { bg: 'bg-yellow-500/20', border: 'border-yellow-400', glow: 'shadow-yellow-500/50', text: 'text-yellow-400' },
  leader: { bg: 'bg-green-500/20', border: 'border-green-400', glow: 'shadow-green-500/50', text: 'text-green-400' },
  dead: { bg: 'bg-slate-500/20', border: 'border-slate-400', glow: 'shadow-slate-500/30', text: 'text-slate-400' }
};

const messageAnimations = reactive<Map<string, { x: number; y: number; progress: number; color: string }>>(new Map());
const heartbeatTimers = reactive<Map<number, number>>(new Map());
const nodeAnimations = reactive<Map<number, { type: string; startTime: number }>>(new Map());
const brokenConnections = reactive<Set<string>>(new Set());
const voteCounts = reactive<Map<number, number>>(new Map());
const processedAnimations = reactive<Set<string>>(new Set());

const unregisterAnimation = onAnimation((anim: AnimationEvent) => {
  console.log('Received animation:', anim.type, anim.sourceNodeId, anim.targetNodeId);
  const key = `${anim.type}_${anim.timestamp}`;
  if (!processedAnimations.has(key)) {
    processedAnimations.add(key);
    processAnimation(anim);
    
    setTimeout(() => {
      processedAnimations.delete(key);
    }, (anim.duration || 500) + 100);
  }
});

function processAnimation(anim: AnimationEvent): void {
  switch (anim.type) {
    case 'message_flow':
    case 'log_replicate':
      handleMessageAnimation(anim);
      break;
    case 'heartbeat_pulse':
      handleHeartbeatPulse(anim);
      break;
    case 'heartbeat_timeout':
      handleHeartbeatTimeout(anim);
      break;
    case 'election_start':
      handleElectionStart(anim);
      break;
    case 'vote_cast':
      handleVoteCast(anim);
      break;
    case 'election_win':
      handleElectionWin(anim);
      break;
    case 'election_fail':
      handleElectionFail(anim);
      break;
    case 'node_crash':
      handleNodeCrash(anim);
      break;
    case 'node_recovery':
      handleNodeRecovery(anim);
      break;
    case 'network_partition':
      handleNetworkPartition(anim);
      break;
    case 'network_heal':
      handleNetworkHeal(anim);
      break;
    case 'state_change':
      handleStateChange(anim);
      break;
    case 'client_request':
      handleClientRequest(anim);
      break;
  }
}

function handleMessageAnimation(anim: AnimationEvent): void {
  const sourceNode = state.nodes.find(n => n.id === anim.sourceNodeId);
  const targetNode = state.nodes.find(n => n.id === anim.targetNodeId);
  if (sourceNode && targetNode) {
    const key = `${anim.type}_${anim.timestamp}`;
    const color = anim.type === 'log_replicate' ? '#22c55e' : '#06b6d4';
    messageAnimations.set(key, {
      x: sourceNode.position.x,
      y: sourceNode.position.y,
      progress: 0,
      color
    });
    
    const duration = anim.duration || 500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentAnim = messageAnimations.get(key);
      if (currentAnim) {
        currentAnim.progress = progress;
        currentAnim.x = sourceNode.position.x + (targetNode.position.x - sourceNode.position.x) * progress;
        currentAnim.y = sourceNode.position.y + (targetNode.position.y - sourceNode.position.y) * progress;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        messageAnimations.delete(key);
      }
    };
    requestAnimationFrame(animate);
  }
}

function handleHeartbeatPulse(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    const key = `heartbeat_${anim.sourceNodeId}`;
    nodeAnimations.set(anim.sourceNodeId, { type: 'heartbeat', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
    }, anim.duration || 500);
  }
}

function handleHeartbeatTimeout(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    nodeAnimations.set(anim.sourceNodeId, { type: 'timeout', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
    }, anim.duration || 1000);
  }
}

function handleElectionStart(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    voteCounts.set(anim.sourceNodeId, 1);
    nodeAnimations.set(anim.sourceNodeId, { type: 'election_start', startTime: Date.now() });
  }
}

function handleVoteCast(anim: AnimationEvent): void {
  if (anim.targetNodeId !== undefined) {
    const current = voteCounts.get(anim.targetNodeId) || 0;
    const voteGranted = anim.data?.voteGranted as boolean;
    if (voteGranted) {
      voteCounts.set(anim.targetNodeId, current + 1);
    }
    
    nodeAnimations.set(anim.targetNodeId, { type: 'vote_received', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.targetNodeId!);
    }, 300);
  }
}

function handleElectionWin(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    nodeAnimations.set(anim.sourceNodeId, { type: 'election_win', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
      voteCounts.delete(anim.sourceNodeId!);
    }, 1000);
  }
}

function handleElectionFail(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    nodeAnimations.set(anim.sourceNodeId, { type: 'election_fail', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
      voteCounts.delete(anim.sourceNodeId!);
    }, 1000);
  }
}

function handleNodeCrash(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    nodeAnimations.set(anim.sourceNodeId, { type: 'crash', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
    }, 500);
  }
}

function handleNodeRecovery(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    nodeAnimations.set(anim.sourceNodeId, { type: 'recovery', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
    }, 500);
  }
}

function handleNetworkPartition(anim: AnimationEvent): void {
  const groups = anim.data?.groups as number[][];
  if (groups) {
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        groups[i].forEach(nodeA => {
          groups[j].forEach(nodeB => {
            const key1 = `${nodeA}-${nodeB}`;
            const key2 = `${nodeB}-${nodeA}`;
            brokenConnections.add(key1);
            brokenConnections.add(key2);
          });
        });
      }
    }
  }
}

function handleNetworkHeal(_anim: AnimationEvent): void {
  brokenConnections.clear();
}

function handleStateChange(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    nodeAnimations.set(anim.sourceNodeId, { type: 'state_change', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
    }, 500);
  }
}

function handleClientRequest(anim: AnimationEvent): void {
  if (anim.sourceNodeId !== undefined) {
    nodeAnimations.set(anim.sourceNodeId, { type: 'client_request', startTime: Date.now() });
    
    setTimeout(() => {
      nodeAnimations.delete(anim.sourceNodeId!);
    }, 500);
  }
}

function getNodeAnimationClass(nodeId: number): string {
  const anim = nodeAnimations.get(nodeId);
  if (!anim) return '';
  
  switch (anim.type) {
    case 'heartbeat':
      return 'animate-heartbeat-pulse';
    case 'timeout':
      return 'animate-timeout-flash';
    case 'election_start':
    case 'vote_received':
      return 'animate-election-glow';
    case 'election_win':
      return 'animate-election-win';
    case 'election_fail':
      return 'animate-election-fail';
    case 'crash':
      return 'animate-crash-shake';
    case 'recovery':
      return 'animate-recovery-glow';
    case 'state_change':
      return 'animate-state-transition';
    case 'client_request':
      return 'animate-client-request';
    default:
      return '';
  }
}

function getNodeStyle(node: Node) {
  const colors = nodeColors[node.state] || nodeColors.follower;
  const isLeader = node.state === 'leader';
  const isCandidate = node.state === 'candidate';
  const animationClass = getNodeAnimationClass(node.id);
  
  return {
    classes: [
      colors.bg,
      colors.border,
      isLeader ? 'leader-glow' : '',
      isCandidate ? 'candidate-bounce' : '',
      node.isPartitioned ? 'opacity-50' : '',
      node.state === 'dead' ? 'opacity-30' : '',
      animationClass
    ].join(' '),
    glow: colors.glow,
    text: colors.text
  };
}

function getNodePosition(node: Node) {
  return {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`
  };
}

function handleNodeClick(nodeId: number) {
  if (selectedNode.value === nodeId) {
    showNodeMenu.value = !showNodeMenu.value;
  } else {
    selectedNode.value = nodeId;
    showNodeMenu.value = true;
  }
}

function handleCrash(nodeId: number) {
  crashNode(nodeId);
  showNodeMenu.value = false;
}

function handleRestart(nodeId: number) {
  restartNode(nodeId);
  showNodeMenu.value = false;
}

function getConnectionPath(source: Node, target: Node) {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = 25;
  
  const startX = source.position.x + (dx / dist) * offset;
  const startY = source.position.y + (dy / dist) * offset;
  const endX = target.position.x - (dx / dist) * offset;
  const endY = target.position.y - (dy / dist) * offset;
  
  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

function isConnectionActive(source: Node, target: Node) {
  if (source.state === 'dead' || target.state === 'dead') return false;
  if (source.isPartitioned && target.isPartitioned && source.partitionGroup !== target.partitionGroup) return false;
  if (source.isPartitioned || target.isPartitioned) return false;
  return true;
}

function isConnectionBroken(source: Node, target: Node): boolean {
  const key1 = `${source.id}-${target.id}`;
  const key2 = `${target.id}-${source.id}`;
  return brokenConnections.has(key1) || brokenConnections.has(key2);
}

const svgConnections = computed(() => {
  const connections: { path: string; active: boolean; broken: boolean; key: string }[] = [];
  
  for (let i = 0; i < state.nodes.length; i++) {
    for (let j = i + 1; j < state.nodes.length; j++) {
      const source = state.nodes[i];
      const target = state.nodes[j];
      connections.push({
        path: getConnectionPath(source, target),
        active: isConnectionActive(source, target),
        broken: isConnectionBroken(source, target),
        key: `conn-${i}-${j}`
      });
    }
  }
  
  return connections;
});

onUnmounted(() => {
  unregisterAnimation();
  messageAnimations.clear();
  nodeAnimations.clear();
  heartbeatTimers.clear();
  voteCounts.clear();
  brokenConnections.clear();
  processedAnimations.clear();
});
</script>

<template>
  <div class="visualization-container relative w-full h-full bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
    <svg class="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:0.1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="strong-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g>
        <path
          v-for="conn in svgConnections"
          :key="conn.key"
          :d="conn.path"
          :class="[
            conn.broken ? 'connection-broken' : conn.active ? 'connection-active' : 'connection-inactive'
          ]"
          fill="none"
          stroke-width="2"
          stroke-linecap="round"
        />
      </g>
      
      <g v-for="anim in Array.from(messageAnimations.entries())" :key="anim[0]">
        <circle
          :cx="anim[1].x"
          :cy="anim[1].y"
          r="6"
          :fill="anim[1].color"
          opacity="0.8"
          filter="url(#glow)"
        >
          <animate
            attributeName="r"
            values="4;8;4"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>

    <div class="absolute inset-0">
      <div
        v-for="node in state.nodes"
        :key="node.id"
        :style="getNodePosition(node)"
        class="absolute transform -translate-x-1/2 -translate-y-1/2"
      >
        <div
          :class="[
            'node-container w-16 h-16 rounded-full border-2 cursor-pointer transition-all duration-300',
            'flex flex-col items-center justify-center backdrop-blur-sm',
            getNodeStyle(node).classes
          ]"
          :style="{ boxShadow: node.state === 'leader' ? '0 0 20px rgba(34, 197, 94, 0.5)' : '' }"
          @click="handleNodeClick(node.id)"
        >
          <span class="text-xs font-bold text-slate-300">节点</span>
          <span class="text-lg font-bold" :class="getNodeStyle(node).text">{{ node.id }}</span>
          
          <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span class="text-xs px-2 py-0.5 rounded" :class="getNodeStyle(node).bg">
              {{ node.state === 'follower' ? 'Follower' : node.state === 'candidate' ? 'Candidate' : node.state === 'leader' ? 'Leader' : 'Dead' }}
            </span>
          </div>
          
          <div v-if="node.state === 'candidate'" class="absolute -top-10 left-1/2 transform -translate-x-1/2">
            <div class="bg-yellow-500/20 border border-yellow-500/50 rounded px-2 py-1">
              <span class="text-xs text-yellow-400">投票中</span>
              <div class="flex gap-0.5 mt-0.5">
                <div v-for="i in state.nodes.length" :key="i" class="w-1.5 h-1.5 rounded-full"
                  :class="i <= (voteCounts.get(node.id) || 0) ? 'bg-yellow-400' : 'bg-yellow-900'">
                </div>
              </div>
              <span class="text-xs text-yellow-300">{{ voteCounts.get(node.id) || 0 }}/{{ state.nodes.length }}</span>
            </div>
          </div>
          
          <div v-if="node.state === 'leader'" class="absolute -top-2 -right-2">
            <div class="w-4 h-4 bg-green-500 rounded-full animate-ping leader-crown"></div>
          </div>
          
          <div v-if="node.isPartitioned" class="absolute -top-2 -left-2">
            <div class="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center partition-icon">
              <span class="text-xs">⚠</span>
            </div>
          </div>
          
          <div v-if="nodeAnimations.get(node.id)?.type === 'timeout'" class="absolute inset-0 rounded-full timeout-ring">
          </div>
        </div>
        
        <div v-if="selectedNode === node.id && showNodeMenu" 
             class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20">
          <div class="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 min-w-32">
            <button
              v-if="node.state !== 'dead'"
              @click.stop="handleCrash(node.id)"
              class="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-red-500/20 rounded transition-colors"
            >
              崩溃节点
            </button>
            <button
              v-else
              @click.stop="handleRestart(node.id)"
              class="w-full px-3 py-1.5 text-left text-sm text-green-400 hover:bg-green-500/20 rounded transition-colors"
            >
              重启节点
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700/50">
      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 rounded-full bg-blue-500/50 border border-blue-400"></div>
          <span class="text-slate-400">Follower</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-400"></div>
          <span class="text-slate-400">Candidate</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 rounded-full bg-green-500/50 border border-green-400"></div>
          <span class="text-slate-400">Leader</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 rounded-full bg-slate-500/50 border border-slate-400"></div>
          <span class="text-slate-400">Dead</span>
        </div>
      </div>
    </div>

    <div class="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700/50">
      <div class="text-xs text-slate-400 mb-1">当前 Term: <span class="text-cyan-400 font-bold">{{ state.currentTerm }}</span></div>
      <div class="text-xs text-slate-400">Leader: <span class="text-green-400 font-bold">{{ state.leaderId !== null ? '节点 ' + state.leaderId : '无' }}</span></div>
    </div>
  </div>
</template>

<style scoped>
.visualization-container {
  min-height: 500px;
}

.node-container {
  transition: all 0.3s ease;
}

.node-container:hover {
  transform: scale(1.1);
}

.connection-active {
  stroke: rgba(6, 182, 212, 0.3);
  transition: stroke 0.3s ease;
}

.connection-active:hover {
  stroke: rgba(6, 182, 212, 0.6);
}

.connection-inactive {
  stroke: rgba(239, 68, 68, 0.2);
  stroke-dasharray: 5, 5;
}

.connection-broken {
  stroke: rgba(239, 68, 68, 0.6);
  stroke-dasharray: 10, 5;
  animation: broken-line 0.5s ease-in-out infinite;
}

@keyframes broken-line {
  0%, 100% {
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dashoffset: 15;
  }
}

.leader-glow {
  animation: leader-pulse-glow 2s ease-in-out infinite;
}

@keyframes leader-pulse-glow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
  }
}

.candidate-bounce {
  animation: candidate-bounce 1s ease-in-out infinite;
}

@keyframes candidate-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-heartbeat-pulse {
  animation: heartbeat-pulse 0.5s ease-out;
}

@keyframes heartbeat-pulse {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.3);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

.animate-timeout-flash {
  animation: timeout-flash 1s ease-in-out infinite;
}

@keyframes timeout-flash {
  0%, 100% {
    filter: brightness(1) saturate(1);
  }
  50% {
    filter: brightness(1.5) saturate(1.5);
  }
}

.timeout-ring {
  border: 3px solid rgba(239, 68, 68, 0.8);
  animation: timeout-ring-pulse 0.5s ease-in-out infinite;
}

@keyframes timeout-ring-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.animate-election-glow {
  animation: election-glow 0.3s ease-out;
}

@keyframes election-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7);
  }
  100% {
    box-shadow: 0 0 20px 10px rgba(234, 179, 8, 0);
  }
}

.animate-election-win {
  animation: election-win 1s ease-out;
}

@keyframes election-win {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% {
    transform: scale(1.2);
    box-shadow: 0 0 40px 20px rgba(34, 197, 94, 0.5);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
  }
}

.animate-election-fail {
  animation: election-fail 0.5s ease-out;
}

@keyframes election-fail {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.animate-crash-shake {
  animation: crash-shake 0.5s ease-out;
}

@keyframes crash-shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.animate-recovery-glow {
  animation: recovery-glow 0.5s ease-out;
}

@keyframes recovery-glow {
  0% {
    box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
    transform: scale(0.8);
  }
  100% {
    box-shadow: 0 0 0 rgba(34, 197, 94, 0);
    transform: scale(1);
  }
}

.animate-state-transition {
  animation: state-transition 0.5s ease-out;
}

@keyframes state-transition {
  0% {
    filter: brightness(1.5) saturate(1.5);
    transform: scale(1.1);
  }
  100% {
    filter: brightness(1) saturate(1);
    transform: scale(1);
  }
}

.animate-client-request {
  animation: client-request 0.5s ease-out;
}

@keyframes client-request {
  0%, 100% {
    box-shadow: 0 0 0 rgba(6, 182, 212, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
  }
}

.leader-crown {
  animation: leader-crown 1.5s ease-in-out infinite;
}

@keyframes leader-crown {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.partition-icon {
  animation: partition-blink 1s ease-in-out infinite;
}

@keyframes partition-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
