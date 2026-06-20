<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, RadarComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ScoreItem } from '@/composables/useMockData';

echarts.use([RadarChart, TitleComponent, TooltipComponent, LegendComponent, RadarComponent, CanvasRenderer]);

const props = defineProps<{ scores: ScoreItem[] }>();

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObs: ResizeObserver | null = null;

function renderChart() {
  if (!chartInstance) return;
  const indicators = props.scores.map((s) => ({ name: s.name, max: 100 }));
  const values = props.scores.map((s) => s.value);
  const minScore = Math.min(...values);
  const worst = props.scores.find((s) => s.value === minScore);

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,25,49,0.92)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#e6f1ff' },
      formatter: () => {
        const lines = props.scores
          .map((s) => {
            const low = s.value < 65;
            return `<div style="margin:4px 0;display:flex;justify-content:space-between;gap:16px">
              <span>${low ? '⚠ ' : ''}${s.name}</span>
              <span style="color:${low ? '#ff3b3b' : '#00d4ff'};font-weight:700;font-family:'Orbitron',monospace">${s.value}</span>
            </div>
            <div style="font-size:11px;color:#9fc2e8;margin-bottom:4px">建议: ${s.suggestion}</div>`;
          })
          .join('');
        return `<div style="min-width:220px">
          <div style="font-weight:700;color:#00d4ff;letter-spacing:2px;margin-bottom:6px">安全评分维度</div>
          ${lines}
          ${worst ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(0,212,255,0.25);color:#ff5a5a;font-size:11px">最低项：${worst.name} ${worst.value}分</div>` : ''}
        </div>`;
      }
    },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#9fc2e8',
        fontSize: 12
      },
      splitLine: {
        lineStyle: { color: 'rgba(30,77,128,0.5)' }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(0,212,255,0.02)', 'rgba(0,212,255,0.04)']
        }
      },
      axisLine: {
        lineStyle: { color: '#1e4d80' }
      }
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#00d4ff',
          width: 2,
          shadowColor: '#00d4ff',
          shadowBlur: 8
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: 'rgba(0,212,255,0.35)' },
            { offset: 1, color: 'rgba(0,120,200,0.15)' }
          ])
        },
        itemStyle: {
          color: '#00d4ff',
          borderColor: '#fff',
          borderWidth: 1
        },
        data: [
          {
            value: values,
            name: '当前评分'
          }
        ]
      }
    ]
  });
}

onMounted(() => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value, undefined, { renderer: 'canvas' });
  renderChart();
  resizeObs = new ResizeObserver(() => chartInstance?.resize());
  resizeObs.observe(chartRef.value);
});

watch(() => props.scores, renderChart, { deep: true });

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  chartInstance?.dispose();
});
</script>

<template>
  <div class="radar-wrap">
    <header class="radar-header">
      <span class="title">安全评分雷达</span>
      <span class="subtitle">SECURITY RADAR</span>
    </header>
    <div ref="chartRef" class="radar-chart"></div>
    <div class="score-list">
      <div
        v-for="s in scores"
        :key="s.name"
        class="score-row"
        :class="{ low: s.value < 65 }"
      >
        <span class="score-name">{{ s.name }}</span>
        <div class="score-bar">
          <div class="score-bar-fill" :style="{ width: s.value + '%' }"></div>
        </div>
        <span class="score-value">{{ s.value }}</span>
      </div>
      <div v-if="scores.some((s) => s.value < 65)" class="warning-tip">
        <span>⚠</span>
        存在低分项：{{ scores.find((s) => s.value < 65)?.name }}，建议查看悬停提示。
      </div>
    </div>
  </div>
</template>

<style scoped>
.radar-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(12, 30, 58, 0.7), rgba(6, 18, 37, 0.7));
  border: 1px solid #1e4d80;
  border-radius: 10px;
  overflow: hidden;
}
.radar-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(30, 77, 128, 0.6);
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.08), transparent);
}
.title {
  color: #e6f1ff;
  font-weight: 700;
  letter-spacing: 2px;
  font-size: 15px;
}
.subtitle {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  color: #00d4ff;
  letter-spacing: 2px;
  opacity: 0.8;
}
.radar-chart {
  width: 100%;
  min-height: 0;
  flex: 1 1 55%;
}
.score-list {
  flex: 1 1 45%;
  padding: 8px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}
.score-row {
  display: grid;
  grid-template-columns: 64px 1fr 32px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.score-name {
  color: #9fc2e8;
}
.score-bar {
  height: 6px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}
.score-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0082c8);
  border-radius: 3px;
  transition: width 0.6s ease;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
}
.score-row.low .score-bar-fill {
  background: linear-gradient(90deg, #ff3b3b, #c21e1e);
  box-shadow: 0 0 8px rgba(255, 59, 59, 0.55);
}
.score-row.low .score-name {
  color: #ff7a7a;
}
.score-value {
  text-align: right;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  color: #00d4ff;
}
.score-row.low .score-value {
  color: #ff5a5a;
}
.warning-tip {
  margin-top: 4px;
  padding: 8px 10px;
  font-size: 11px;
  color: #ff7a7a;
  background: rgba(255, 59, 59, 0.08);
  border: 1px dashed rgba(255, 59, 59, 0.3);
  border-radius: 6px;
  display: flex;
  gap: 6px;
  align-items: center;
  line-height: 1.5;
}
</style>
