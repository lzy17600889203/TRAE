<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Graph } from '@antv/x6';
import type { TraceRequest, ServiceNode } from '../types/trace';

const props = defineProps<{
  trace: TraceRequest;
}>();

const emit = defineEmits<{
  (e: 'node-click', node: ServiceNode): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let graph: Graph | null = null;
let flowTimer: number | null = null;
let dashOffset = 30;

const NODE_WIDTH = 170;
const NODE_HEIGHT = 78;
const NODE_GAP = 80;

function buildNodeShape(node: ServiceNode, index: number) {
  const x = 60 + index * (NODE_WIDTH + NODE_GAP);
  const y = 110;
  const fill = node.isBottleneck ? '#7F1D1D' : '#1E3A5F';
  const stroke = node.isBottleneck ? '#EF4444' : '#38BDF8';
  const strokeWidth = node.isBottleneck ? 3 : 1.5;
  const glow = node.isBottleneck ? '0 0 24px rgba(239,68,68,0.55)' : '0 0 14px rgba(56,189,248,0.25)';

  return {
    id: node.id,
    shape: 'rect',
    x,
    y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    attrs: {
      body: {
        fill,
        stroke,
        strokeWidth,
        rx: 10,
        ry: 10,
        filter: { name: 'dropShadow', args: { dx: 0, dy: 0, stdDeviation: 6, color: node.isBottleneck ? '#EF4444' : '#38BDF8' } },
      },
      label: {
        text: node.name,
        fill: '#E2E8F0',
        fontSize: 14,
        fontWeight: 600,
        textVerticalAnchor: 'top',
        refY: 16,
        textAnchor: 'middle',
        refX: '50%',
      },
      duration_label: {
        text: node.duration + ' ms',
        fill: node.isBottleneck ? '#FCA5A5' : '#7DD3FC',
        fontSize: 15,
        fontWeight: 700,
        textVerticalAnchor: 'bottom',
        refY: -16,
        textAnchor: 'middle',
        refX: '50%',
      },
      type_tag: {
        text: node.type.toUpperCase(),
        fill: node.isBottleneck ? '#FCA5A5' : '#7DD3FC',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textVerticalAnchor: 'top',
        refY: 38,
        textAnchor: 'middle',
        refX: '50%',
      },
    },
    data: node,
  };
}

function buildEdgeShape(edge: TraceRequest['edges'][number]) {
  const isBottleneck = edge.isBottleneckPath;
  return {
    source: edge.source,
    target: edge.target,
    router: { name: 'normal' },
    attrs: {
      line: {
        stroke: isBottleneck ? '#EF4444' : '#475569',
        strokeWidth: isBottleneck ? 4 : 2,
        targetMarker: {
          name: 'block',
          width: 10,
          height: 10,
          fill: isBottleneck ? '#EF4444' : '#475569',
        },
      },
    },
    smooth: true,
    zIndex: isBottleneck ? 2 : 1,
    labels: isBottleneck
      ? [
          {
            position: 0.5,
            attrs: {
              text: {
                text: '瓶颈链路',
                fill: '#FCA5A5',
                fontSize: 11,
                fontWeight: 600,
              },
              rect: {
                fill: '#7F1D1D',
                stroke: '#EF4444',
                strokeWidth: 1,
                rx: 6,
                ry: 6,
                padding: 6,
              },
            },
          },
        ]
      : [],
    isBottleneckPath: isBottleneck,
  };
}

function renderGraph() {
  if (!graph || !containerRef.value) return;

  graph.clearCells();
  const nodes = props.trace.nodes.map((n, i) => buildNodeShape(n, i));
  const edges = props.trace.edges.map(buildEdgeShape);

  graph.fromJSON({ cells: [...nodes, ...edges] });
  graph.centerContent();
  graph.zoom(0.95);

  // 给瓶颈边设置初始虚线
  graph.getEdges().forEach((e) => {
    const data = e.getData() as any;
    const cell = e as any;
    if (cell.store && cell.store.data) {
      // do nothing
    }
    if ((e as any).isBottleneckPath || props.trace.edges.find((ed) => ed.source === e.getSourceCellId() && ed.target === e.getTargetCellId())?.isBottleneckPath) {
      e.attr('line/strokeDasharray', '10 5');
      e.attr('line/strokeDashoffset', dashOffset);
    }
  });

  graph.on('node:click', ({ node }) => {
    const raw = node.getData() as ServiceNode | undefined;
    if (raw) emit('node-click', raw);
  });

  graph.on('node:mouseenter', ({ node, e }) => {
    const raw = node.getData() as ServiceNode | undefined;
    if (!raw) return;
    node.attr('body/strokeWidth', raw.isBottleneck ? 4.5 : 2.5);
  });
  graph.on('node:mouseleave', ({ node }) => {
    const raw = node.getData() as ServiceNode | undefined;
    if (!raw) return;
    node.attr('body/strokeWidth', raw.isBottleneck ? 3 : 1.5);
  });
}

function startFlowAnimation() {
  if (flowTimer) return;
  flowTimer = window.setInterval(() => {
    dashOffset = dashOffset <= 0 ? 30 : dashOffset - 1;
    if (!graph) return;
    graph.getEdges().forEach((e) => {
      const srcId = e.getSourceCellId();
      const tgtId = e.getTargetCellId();
      const edgeMeta = props.trace.edges.find((ed) => ed.source === srcId && ed.target === tgtId);
      if (edgeMeta?.isBottleneckPath) {
        e.attr('line/strokeDashoffset', dashOffset);
      }
    });
  }, 60);
}

function initGraph() {
  if (!containerRef.value) return;
  graph = new Graph({
    container: containerRef.value,
    background: { color: 'transparent' },
    grid: false,
    interacting: { nodeMovable: false, edgeMovable: false, edgeLabelMovable: false },
    connecting: { allowBlank: false, allowLoop: false },
    panning: { enabled: true, eventTypes: ['leftMouseDown'] },
    mousewheel: { enabled: true, modifiers: ['ctrl'], minScale: 0.4, maxScale: 2 },
  });
  renderGraph();
  startFlowAnimation();
}

watch(
  () => props.trace,
  () => renderGraph(),
  { deep: true },
);

onMounted(() => {
  initGraph();
  const onResize = () => {
    if (!graph || !containerRef.value) return;
    graph.resize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    graph.centerContent();
  };
  window.addEventListener('resize', onResize);
  onBeforeUnmountCleanup.push(() => window.removeEventListener('resize', onResize));
});

const onBeforeUnmountCleanup: (() => void)[] = [];

onBeforeUnmount(() => {
  if (flowTimer) {
    clearInterval(flowTimer);
    flowTimer = null;
  }
  onBeforeUnmountCleanup.forEach((fn) => fn());
  graph?.dispose();
  graph = null;
});
</script>

<template>
  <div class="topology-wrap">
    <div class="topology-legend">
      <div class="legend-item">
        <span class="dot dot-normal"></span>
        <span>正常节点</span>
      </div>
      <div class="legend-item">
        <span class="dot dot-danger"></span>
        <span>瓶颈节点 (>2s)</span>
      </div>
      <div class="legend-item">
        <span class="line line-normal"></span>
        <span>普通调用</span>
      </div>
      <div class="legend-item">
        <span class="line line-danger"></span>
        <span>瓶颈链路</span>
      </div>
    </div>
    <div ref="containerRef" class="graph-canvas"></div>
    <div class="hint">提示：点击节点查看慢 SQL 与堆栈，按住鼠标可拖动画布</div>
  </div>
</template>

<style scoped>
.topology-wrap {
  background:
    radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.08), transparent 45%),
    radial-gradient(circle at 80% 70%, rgba(239, 68, 68, 0.06), transparent 45%),
    var(--bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 360px;
}

.topology-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 12px;
  color: var(--color-text-dim);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid transparent;
}

.dot-normal {
  background: #1E3A5F;
  border-color: #38BDF8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.dot-danger {
  background: #7F1D1D;
  border-color: #EF4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.line {
  display: inline-block;
  width: 36px;
  height: 3px;
  border-radius: 2px;
}

.line-normal {
  background: #475569;
}

.line-danger {
  background: linear-gradient(90deg, #EF4444 0%, #FCA5A5 50%, #EF4444 100%);
  background-size: 20px 100%;
  animation: legend-flow 1.2s linear infinite;
}

@keyframes legend-flow {
  from { background-position: 0 0; }
  to   { background-position: 20px 0; }
}

.graph-canvas {
  flex: 1;
  min-height: 300px;
  background:
    linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px) 0 0 / 32px 32px,
    linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px) 0 0 / 32px 32px,
    #0B1020;
  border-radius: 10px;
  border: 1px solid var(--color-border);
}

.hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-dim);
  padding: 6px 0 0;
}
</style>
