<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { TraceRequest } from '../types/trace';

const props = defineProps<{
  trace: TraceRequest;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function buildOption() {
  const nodes = props.trace.nodes;
  // 计算每个节点的累积起点（前缀和）
  const starts: number[] = [];
  let acc = 0;
  nodes.forEach((n) => {
    starts.push(acc);
    acc += n.duration;
  });
  const durations = nodes.map((n) => n.duration);
  const names = nodes.map((n) => n.name);
  const bottleneckFlags = nodes.map((n) => n.isBottleneck);
  const total = props.trace.totalDuration;

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0B1020',
      borderColor: 'rgba(56,189,248,0.4)',
      textStyle: { color: '#E2E8F0' },
      formatter: (params: any) => {
        const p = (params || []).find((it: any) => it.seriesName !== 'placeholder');
        if (!p) return '';
        const idx = p.dataIndex;
        const start = starts[idx];
        const dur = durations[idx];
        const pct = ((dur / total) * 100).toFixed(1);
        return `
          <div style="font-weight:600; padding-bottom:6px; border-bottom:1px solid #334155; margin-bottom:6px;">
            ${names[idx]}
          </div>
          <div>开始时间：<b style="color:#7DD3FC">${start} ms</b></div>
          <div>耗时：<b style="color:${bottleneckFlags[idx] ? '#FCA5A5' : '#86EFAC'}">${dur} ms</b></div>
          <div>占比：<b style="color:#FBBF24">${pct}%</b></div>
          ${bottleneckFlags[idx] ? '<div style="margin-top:4px;color:#FCA5A5">⚠ 瓶颈节点</div>' : ''}
        `;
      },
    },
    grid: { left: 110, right: 60, top: 30, bottom: 30 },
    xAxis: {
      type: 'value',
      name: 'ms',
      nameTextStyle: { color: '#94A3B8', padding: [0, 0, 0, -6] },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.5)', type: 'dashed' } },
      axisLabel: { color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' },
    },
    yAxis: {
      type: 'category',
      data: [...names].reverse(),
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#E2E8F0',
        fontWeight: 600,
        fontSize: 13,
        formatter: (val: string, idx: number) => {
          // 因为 reverse，所以取反
          const realIdx = names.length - 1 - idx;
          const danger = bottleneckFlags[realIdx];
          return danger ? `⚠ ${val}` : val;
        },
        rich: {},
      },
    },
    series: [
      {
        name: 'placeholder',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: 'transparent' },
        emphasis: { disabled: true },
        silent: true,
        data: [...starts].reverse(),
        barWidth: 22,
      },
      {
        name: '耗时',
        type: 'bar',
        stack: 'total',
        barWidth: 22,
        data: [...durations].reverse().map((d, idxRev) => {
          const realIdx = durations.length - 1 - idxRev;
          const isBn = bottleneckFlags[realIdx];
          return {
            value: d,
            itemStyle: {
              color: isBn
                ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#DC2626' },
                    { offset: 1, color: '#F97316' },
                  ])
                : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#0284C7' },
                    { offset: 1, color: '#38BDF8' },
                  ]),
              borderRadius: [0, 6, 6, 0],
              shadowColor: isBn ? 'rgba(239,68,68,0.55)' : 'rgba(56,189,248,0.35)',
              shadowBlur: 12,
            },
          };
        }),
        label: {
          show: true,
          position: 'right',
          color: '#E2E8F0',
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 600,
          fontSize: 12,
          formatter: (params: any) => {
            const realIdx = durations.length - 1 - params.dataIndex;
            const isBn = bottleneckFlags[realIdx];
            const pct = ((durations[realIdx] / total) * 100).toFixed(1);
            return `${params.value} ms  (${pct}%)${isBn ? ' ⚠' : ''}`;
          },
        },
      },
    ],
    animationDuration: 1200,
    animationEasing: 'cubicOut' as any,
  } as any;
}

function renderChart() {
  if (!chart) return;
  chart.setOption(buildOption(), true);
}

onMounted(async () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  renderChart();
  const onResize = () => chart?.resize();
  window.addEventListener('resize', onResize);
  onBeforeUnmountCleanup.push(() => window.removeEventListener('resize', onResize));
});

watch(
  () => props.trace,
  async () => {
    await nextTick();
    renderChart();
  },
  { deep: true },
);

const onBeforeUnmountCleanup: (() => void)[] = [];

onBeforeUnmount(() => {
  chart?.dispose();
  chart = null;
  onBeforeUnmountCleanup.forEach((fn) => fn());
});
</script>

<template>
  <div class="gantt-wrap">
    <div class="gantt-header">
      <div class="title-row">
        <span class="dot-indicator"></span>
        <span class="gantt-title">单次请求 · 各服务耗时分布</span>
        <span class="total-badge">总耗时 {{ trace.totalDuration }} ms</span>
      </div>
      <div class="subtitle">
        数据来源：Trace ID
        <span class="trace-id">{{ trace.requestId.slice(0, 20) }}…</span>
        · 时间戳
        <span class="timestamp">{{ trace.timestamp }}</span>
      </div>
    </div>
    <div ref="chartRef" class="gantt-chart"></div>
  </div>
</template>

<style scoped>
.gantt-wrap {
  background: var(--bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 18px 24px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.gantt-header {
  margin-bottom: 8px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 10px #38BDF8;
  animation: pulse-dot 1.8s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(1.3); }
}

.gantt-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.total-badge {
  margin-left: auto;
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.15);
  color: #FCA5A5;
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-dim);
}

.trace-id {
  color: #7DD3FC;
  font-family: 'JetBrains Mono', monospace;
  margin: 0 4px;
}

.timestamp {
  color: #C084FC;
  font-family: 'JetBrains Mono', monospace;
  margin: 0 4px;
}

.gantt-chart {
  flex: 1;
  min-height: 260px;
}
</style>
