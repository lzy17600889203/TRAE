<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent, MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, TitleComponent, TooltipComponent, GridComponent, MarkLineComponent, CanvasRenderer]);

const props = defineProps<{
  times: string[];
  scores: number[];
  threshold: number;
  supervisorTriggered: boolean;
}>();

const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function buildOption() {
  const triggered = props.supervisorTriggered;
  const minScore = Math.min(props.threshold - 10, ...props.scores) - 5;
  return {
    backgroundColor: 'transparent',
    grid: { left: 42, right: 20, top: 28, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 26, 46, 0.95)',
      borderColor: 'rgba(53, 194, 255, 0.4)',
      textStyle: { color: '#e9f1ff', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-size:11px;opacity:.7">${p.axisValue}</div><div>情绪指数：<b style="color:#35c2ff">${p.value}</b></div>`;
      },
    },
    xAxis: {
      type: 'category',
      data: props.times,
      axisLine: { lineStyle: { color: 'rgba(120,160,220,0.35)' } },
      axisTick: { show: false },
      axisLabel: { color: '#aebcd6', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: Math.max(0, minScore),
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(120,160,220,0.1)' } },
      axisLabel: { color: '#aebcd6', fontSize: 11 },
    },
    series: [
      {
        name: '情绪指数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: props.scores,
        itemStyle: { color: '#35c2ff', shadowBlur: 10, shadowColor: '#35c2ff' },
        lineStyle: {
          width: 2.5,
          color: triggered ? '#ff5d5d' : '#35c2ff',
          shadowBlur: 8,
          shadowColor: triggered ? '#ff5d5d' : '#35c2ff',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: triggered ? 'rgba(255,93,93,0.45)' : 'rgba(53,194,255,0.35)' },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ]),
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#ffb545', type: 'dashed', width: 1.5 },
          label: { formatter: `警戒线 · ${props.threshold}`, color: '#ffb545', fontSize: 11 },
          data: [{ yAxis: props.threshold }],
        },
      },
    ],
  };
}

function render() {
  if (!chart) return;
  chart.setOption(buildOption(), true);
}

onMounted(() => {
  if (chartEl.value) {
    chart = echarts.init(chartEl.value);
    render();
    window.addEventListener('resize', resize);
  }
});

function resize() { chart?.resize(); }

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  chart?.dispose();
  chart = null;
});

watch(() => [props.scores, props.times, props.supervisorTriggered], () => {
  render();
}, { deep: true });

defineExpose({ resize });
</script>

<template>
  <div class="line-chart" ref="chartEl" />
</template>

<style scoped>
.line-chart { width: 100%; height: 100%; min-height: 240px; }
</style>
