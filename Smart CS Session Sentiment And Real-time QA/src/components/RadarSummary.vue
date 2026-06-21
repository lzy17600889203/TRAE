<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { SessionSummary } from '@/types';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { RadarComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([RadarChart, RadarComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{ summary: SessionSummary }>();
const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function option() {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(17, 26, 46, 0.95)',
      borderColor: 'rgba(120,160,220,0.4)',
      textStyle: { color: '#e9f1ff', fontSize: 12 },
    },
    radar: {
      indicator: [
        { name: '响应速度', max: 100 },
        { name: '服务态度', max: 100 },
        { name: '问题解决率', max: 100 },
        { name: '专业知识', max: 100 },
        { name: '共情能力', max: 100 },
      ],
      center: ['50%', '55%'],
      radius: '72%',
      axisName: { color: '#aebcd6', fontSize: 12 },
      splitArea: { areaStyle: { color: ['rgba(53,194,255,0.04)', 'rgba(53,194,255,0.02)'] } },
      splitLine: { lineStyle: { color: 'rgba(120,160,220,0.25)' } },
      axisLine: { lineStyle: { color: 'rgba(120,160,220,0.25)' } },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#35c2ff' },
        itemStyle: { color: '#35c2ff' },
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
            { offset: 0, color: 'rgba(126,255,178,0.45)' },
            { offset: 1, color: 'rgba(53,194,255,0.15)' },
          ]),
        },
        data: [
          {
            name: 'AI 质检评分',
            value: [
              props.summary.responseSpeed,
              props.summary.serviceAttitude,
              props.summary.problemResolution,
              props.summary.professionalKnowledge,
              props.summary.emotionalIntelligence,
            ],
          },
        ],
      },
    ],
  };
}

function resize() { chart?.resize(); }

onMounted(() => {
  if (chartEl.value) {
    chart = echarts.init(chartEl.value);
    chart.setOption(option());
    window.addEventListener('resize', resize);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  chart?.dispose();
  chart = null;
});

watch(() => props.summary, () => chart?.setOption(option(), true), { deep: true });
</script>

<template>
  <div class="radar" ref="chartEl" />
</template>

<style scoped>
.radar { width: 100%; height: 320px; }
</style>
