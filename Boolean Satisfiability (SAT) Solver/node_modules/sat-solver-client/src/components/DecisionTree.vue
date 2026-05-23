<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useSolverStore } from '@/stores/solverStore';
import { useAnimationStore } from '@/stores/animationStore';
import type { TreeNode } from '@/types';

const solverStore = useSolverStore();
const animationStore = useAnimationStore();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const viewBox = ref({ x: 0, y: 0, width: 800, height: 600 });
const scale = ref(1);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const nodes = computed(() => solverStore.treeNodes);
const events = computed(() => animationStore.currentEvents);

const maxTreeHeight = computed(() => {
  if (nodes.value.length === 0) return 400;
  return Math.max(...nodes.value.map(n => n.y)) + 100;
});

function getNodeColor(node: TreeNode): string {
  if (animationStore.pendingAnimations.some(a => a.target === `variable-${node.variable}`)) {
    return node.type === 'conflict' ? 'var(--color-conflict)' : 'var(--color-satisfy)';
  }
  
  switch (node.type) {
    case 'decision':
      return 'var(--color-node-decision)';
    case 'propagation':
      return 'var(--color-node-propagation)';
    case 'conflict':
      return 'var(--color-node-conflict)';
    default:
      return 'var(--color-accent)';
  }
}

function getNodeLabel(node: TreeNode): string {
  if (node.type === 'conflict') return '✕';
  if (node.variable === 0) return 'Root';
  const sign = node.value === 1 ? '' : '¬';
  return `${sign}x${node.variable}`;
}

function getEdgePath(parent: TreeNode, child: TreeNode): string {
  const startX = parent.x;
  const startY = parent.y + 20;
  const endX = child.x;
  const endY = child.y - 20;
  const midY = (startY + endY) / 2;
  
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
}

function getEdgeColor(node: TreeNode): string {
  if (node.type === 'conflict') return 'var(--color-conflict)';
  if (node.type === 'propagation') return 'var(--color-node-propagation)';
  return node.value === 1 ? 'var(--color-satisfy)' : 'var(--color-conflict)';
}

function isNodeAnimating(node: TreeNode): boolean {
  return animationStore.pendingAnimations.some(
    a => a.target === `variable-${node.variable}` && a.type === 'variable_switch'
  );
}

function isNodeFlashing(node: TreeNode): boolean {
  return animationStore.pendingAnimations.some(
    a => a.target === `variable-${node.variable}` && a.type === 'conflict_flash'
  );
}

function isNodeSatisfying(node: TreeNode): boolean {
  return animationStore.pendingAnimations.some(
    a => a.target === `variable-${node.variable}` && a.type === 'satisfaction_check'
  );
}

function isBacktracking(node: TreeNode): boolean {
  return animationStore.pendingAnimations.some(
    a => a.target === `variable-${node.variable}` && a.type === 'backtrack_erase'
  );
}

function getAnimationClass(node: TreeNode): string {
  if (isNodeFlashing(node)) return 'node--flash';
  if (isNodeSatisfying(node)) return 'node--satisfy';
  if (isBacktracking(node)) return 'node--backtrack';
  if (isNodeAnimating(node)) return 'node--animating';
  return '';
}

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  
  const dx = (e.clientX - dragStart.value.x) / scale.value;
  const dy = (e.clientY - dragStart.value.y) / scale.value;
  
  viewBox.value.x -= dx;
  viewBox.value.y -= dy;
  
  dragStart.value = { x: e.clientX, y: e.clientY };
}

function handleMouseUp() {
  isDragging.value = false;
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 1.1 : 0.9;
  scale.value = Math.max(0.3, Math.min(3, scale.value * delta));
}

function centerView() {
  viewBox.value = {
    x: -viewBox.value.width / 2,
    y: 0,
    width: 800,
    height: 600
  };
  scale.value = 1;
}

function zoomIn() {
  scale.value = Math.min(3, scale.value * 1.2);
}

function zoomOut() {
  scale.value = Math.max(0.3, scale.value / 1.2);
}

watch(nodes, () => {
  if (nodes.value.length > 0) {
    const xs = nodes.value.map(n => n.x);
    const ys = nodes.value.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    
    viewBox.value = {
      x: minX - 100,
      y: -50,
      width: maxX - minX + 200,
      height: maxY + 150
    };
  }
}, { deep: true });

onMounted(() => {
  centerView();
});
</script>

<template>
  <div class="decision-tree" ref="containerRef">
    <div class="tree-toolbar">
      <span class="toolbar-title">决策树可视化</span>
      <div class="toolbar-actions">
        <button class="btn btn--ghost btn--icon" @click="zoomOut" title="缩小">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
        <button class="btn btn--ghost btn--icon" @click="centerView" title="居中">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
        <button class="btn btn--ghost btn--icon" @click="zoomIn" title="放大">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="tree-legend">
      <div class="legend-item">
        <span class="legend-dot" style="background: var(--color-node-decision)"></span>
        决策
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: var(--color-node-propagation)"></span>
        传播
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: var(--color-node-conflict)"></span>
        冲突
      </div>
    </div>

    <div 
      class="tree-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @wheel="handleWheel"
    >
      <svg
        ref="svgRef"
        :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width / scale} ${viewBox.height / scale}`"
        class="tree-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: var(--color-accent); stop-opacity: 0.6" />
            <stop offset="100%" style="stop-color: var(--color-accent-light); stop-opacity: 0.3" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="conflictGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feFlood flood-color="#ff4757" flood-opacity="0.5"/>
            <feComposite in2="coloredBlur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g v-if="nodes.length > 0">
          <g v-for="node in nodes.filter(n => n.parent)" :key="`edge-${node.id}`">
            <path
              :d="getEdgePath(node.parent!, node)"
              :stroke="getEdgeColor(node)"
              stroke-width="2"
              fill="none"
              class="tree-edge"
              :class="{ 'edge--conflict': node.type === 'conflict' }"
            />
          </g>

          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
          >
            <circle
              r="22"
              :fill="getNodeColor(node)"
              class="tree-node"
              :class="getAnimationClass(node)"
              :filter="node.type === 'conflict' ? 'url(#conflictGlow)' : ''"
            />
            
            <text
              y="5"
              text-anchor="middle"
              class="node-label"
              :fill="node.type === 'conflict' ? 'white' : 'white'"
            >
              {{ getNodeLabel(node) }}
            </text>

            <text
              y="36"
              text-anchor="middle"
              class="level-label"
              fill="var(--color-text-muted)"
            >
              L{{ node.level }}
            </text>
          </g>
        </g>

        <g v-else class="empty-state">
          <text
            x="0"
            y="0"
            text-anchor="middle"
            class="empty-text"
            fill="var(--color-text-muted)"
          >
            选择预设或输入公式开始
          </text>
          <text
            x="0"
            y="30"
            text-anchor="middle"
            class="empty-hint"
            fill="var(--color-text-muted)"
          >
            决策树将在此可视化
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped lang="scss">
.decision-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
}

.tree-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.tree-legend {
  display: flex;
  gap: 20px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--color-border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tree-canvas {
  flex: 1;
  overflow: hidden;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.tree-svg {
  width: 100%;
  height: 100%;
}

.tree-node {
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    filter: brightness(1.2);
  }

  &.node--animating {
    animation: nodePulse 0.25s ease-out;
  }

  &.node--flash {
    animation: conflictFlash 0.45s ease-in-out 3;
  }

  &.node--satisfy {
    animation: satisfyPulse 0.2s ease-out;
  }

  &.node--backtrack {
    animation: backtrackFade 0.4s ease-out forwards;
  }
}

.node-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}

.level-label {
  font-family: var(--font-mono);
  font-size: 9px;
  pointer-events: none;
}

.tree-edge {
  transition: all 0.3s ease;

  &.edge--conflict {
    stroke-dasharray: 5, 5;
    animation: dashMove 0.5s linear infinite;
  }
}

.empty-state {
  transform: translate(-100px, -30px);
}

.empty-text {
  font-size: 16px;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.7;
}

@keyframes nodePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes conflictFlash {
  0%, 100% {
    fill: var(--color-accent);
    filter: none;
  }
  50% {
    fill: var(--color-conflict);
    filter: url(#conflictGlow);
  }
}

@keyframes satisfyPulse {
  0% { 
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.3);
    filter: brightness(1.5) drop-shadow(0 0 10px var(--color-satisfy));
  }
  100% { 
    transform: scale(1);
    filter: brightness(1);
  }
}

@keyframes backtrackFade {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}

@keyframes dashMove {
  to {
    stroke-dashoffset: -10;
  }
}
</style>
