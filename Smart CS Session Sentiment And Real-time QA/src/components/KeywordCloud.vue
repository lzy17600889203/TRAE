<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from 'vue';
import * as echarts from 'echarts/core';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-wordcloud';

echarts.use([TooltipComponent, TitleComponent, CanvasRenderer]);

const props = defineProps<{ freq: Record<string, number> }>();

const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const PALETTE = ['#ff5d5d', '#ffb545', '#ffd36a', '#35c2ff', '#7effb2', '#c89bff', '#ff9ecb'];

function buildData() {
  const entries = Object.entries(props.freq);
  if (entries.length === 0) {
    // 占位词，保持画面不空
    return [
      { name: '等待消息…', value: 8 },
      { name: '实时检测', value: 6 },
      { name: '情绪识别', value: 5 },
    ];
  }
  return entries
    .map(([name, count]) => ({ name, value: count * 12 }))
    .sort((a, b) => b.value - a.value);
}

function render() {
  if (!chart) return;
  chart.setOption(
    {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(17, 26, 46, 0.95)',
        borderColor: 'rgba(255, 181, 69, 0.4)',
        textStyle: { color: '#e9f1ff', fontSize: 12 },
        formatter: (p: any) => `<div>${p.name}</div><div>命中次数：<b style="color:#ffb545">${Math.round(p.value / 12)}</b></div>`,
      },
      series: [
        {
          type: 'wordCloud',
          left: 'center',
          top: 'center',
          width: '95%',
          height: '95%',
          sizeRange: [14, 58],
          rotationRange: [-15, 15],
          rotationStep: 15,
          gridSize: 8,
          shape: 'circle',
          drawOutOfBound: false,
          textStyle: {
            fontFamily: 'PingFang SC, sans-serif',
            fontWeight: 600,
            color: () => PALETTE[Math.floor(Math.random() * PALETTE.length)],
            textShadowBlur: 8,
            textShadowColor: 'rgba(0,0,0,0.4)',
          },
          emphasis: {
            textStyle: { fontWeight: 800, color: '#ff5d5d' },
          },
          data: buildData(),
        },
      ],
    },
    true
  );
}

function resize() { chart?.resize(); }

onMounted(() => {
  if (chartEl.value) {
    chart = echarts.init(chartEl.value);
    render();
    window.addEventListener('resize', resize);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  chart?.dispose();
  chart = null;
});

watch(() => props.freq, () => render(), { deep: true });
</script>

<template>
  <div class="wc" ref="chartEl" />
</template>

<style scoped>
.wc { width: 100%; height: 100%; min-height: 240px; }
</style>
