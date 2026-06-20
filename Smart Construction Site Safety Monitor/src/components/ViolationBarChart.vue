<template>
  <div class="chart-wrap">
    <div ref="chartRef" class="chart"></div>
    <div class="side-stats">
      <div class="stat">
        <div class="stat-label">总违规次数</div>
        <div class="stat-value">{{ total }}</div>
      </div>
      <div class="stat">
        <div class="stat-label">施工队数</div>
        <div class="stat-value">{{ teamData.length }}</div>
      </div>
      <div class="stat danger">
        <div class="stat-label">
          <span class="king">👑 违规王</span>
        </div>
        <div class="stat-value">{{ king.team || '—' }}</div>
        <div class="stat-sub">{{ king.count }} 次</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  teamData: { type: Array, required: true }
})

const chartRef = ref(null)
let chartInstance = null
let resizeObs = null

const total = computed(() => props.teamData.reduce((a, b) => a + b.count, 0))
const king = computed(() => [...props.teamData].sort((a, b) => b.count - a.count)[0] || {})

function buildOption() {
  const sorted = [...props.teamData].sort((a, b) => b.count - a.count)
  const names = sorted.map((t) => t.team)
  const counts = sorted.map((t) => t.count)
  const labels = sorted.map((t, i) => (i === 0 ? '👑 违规王' : ''))

  return {
    backgroundColor: 'transparent',
    grid: { top: 30, left: 60, right: 40, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(0,212,255,0.4)',
      textStyle: { color: '#e6f1ff' }
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: 'rgba(0,212,255,0.4)' } },
      axisLabel: { color: '#8aa2c0', fontSize: 13, fontWeight: 600 }
    },
    yAxis: {
      type: 'value',
      name: '违规次数',
      nameTextStyle: { color: '#8aa2c0' },
      axisLine: { lineStyle: { color: 'rgba(0,212,255,0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(0,212,255,0.12)', type: 'dashed' } },
      axisLabel: { color: '#8aa2c0' }
    },
    series: [
      {
        name: '违规次数',
        type: 'bar',
        barWidth: 28,
        data: counts.map((c, i) => ({
          value: c,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: i === 0
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ff3b4a' },
                  { offset: 1, color: '#ff8a00' }
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#00d4ff' },
                  { offset: 1, color: '#12e6a8' }
                ])
          }
        })),
        label: {
          show: true,
          position: 'top',
          color: '#e6f1ff',
          fontWeight: 700,
          formatter: (p) => (p.dataIndex === 0 ? `${p.value} 👑` : `${p.value}`)
        },
        animationDuration: 800,
        animationEasing: 'cubicOut',
        markPoint: {
          symbol: 'pin',
          symbolSize: [0, 0],
          label: {
            show: true,
            formatter: (p) => labels[p.dataIndex] || '',
            color: '#ff3b4a',
            fontWeight: 800,
            fontSize: 14,
            padding: [4, 6],
            backgroundColor: 'rgba(255, 228, 230, 0.9)',
            borderColor: '#ff3b4a',
            borderWidth: 1,
            borderRadius: 6
          },
          data: counts.map((c, i) => ({ name: labels[i], coord: [i, c + 0.5] })).filter((x) => x.name)
        }
      }
    ]
  }
}

function render() {
  if (!chartInstance) return
  chartInstance.setOption(buildOption(), true)
}

onMounted(() => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  render()
  resizeObs = new ResizeObserver(() => chartInstance && chartInstance.resize())
  resizeObs.observe(chartRef.value)
})

onUnmounted(() => {
  if (resizeObs) resizeObs.disconnect()
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(() => props.teamData, render, { deep: true })
</script>

<style scoped>
.chart-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 280px;
}
.chart {
  height: 280px;
  width: 100%;
}
.side-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.stat {
  background: rgba(0, 212, 255, 0.06);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
}
.stat.danger {
  background: linear-gradient(135deg, rgba(255, 59, 74, 0.12), rgba(255, 140, 0, 0.08));
  border-color: rgba(255, 59, 74, 0.4);
}
.stat-label {
  font-size: 12px;
  color: var(--text-dim);
}
.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #00d4ff;
  margin-top: 4px;
}
.stat.danger .stat-value { color: #ff3b4a; }
.stat-sub {
  font-size: 12px;
  color: var(--text-dim);
}
.king {
  color: #ff3b4a;
  font-weight: 700;
}
</style>
