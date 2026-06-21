<template>
  <div class="chart-panel">
    <div class="chart-head">
      <div class="title-left">
        <el-icon><PieChart /></el-icon>
        <span>脱敏规则使用占比</span>
      </div>
      <div class="title-right">
        <el-tag type="info" size="small">总绑定数：{{ total }}</el-tag>
        <el-tag type="warning" size="small">未脱敏：{{ unmasked }}</el-tag>
      </div>
    </div>
    <div ref="chartRef" class="chart-body"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { PieChart } from '@element-plus/icons-vue'
import { useMaskingStore } from '../stores/mask.js'

const store = useMaskingStore()
const chartRef = ref(null)
let chart = null

const stats = computed(() => store.ruleStats)
const total = computed(() => store.bindings.length)
const unmasked = computed(() => store.bindings.filter(b => !b.rule || b.rule === 'none').length)

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

function buildOption () {
  const data = stats.value.map((s, i) => ({
    name: s.name,
    value: s.value,
    itemStyle: { color: COLORS[i % COLORS.length] }
  }))
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>数量：{c} <br/>占比：{d}%'
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#374151', fontSize: 12 }
    },
    series: [
      {
        name: '规则占比',
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#4b5563',
          fontSize: 12
        },
        labelLine: { length: 8, length2: 10, smooth: true },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
          label: { fontSize: 13, fontWeight: 600 }
        },
        data
      }
    ]
  }
}

function render () {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

function resize () {
  if (chart) chart.resize()
}

onMounted(async () => {
  await nextTick()
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  render()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (chart) { chart.dispose(); chart = null }
})

watch(() => stats.value.map(s => s.name + ':' + s.value).join(','), () => {
  nextTick(() => render())
}, { deep: true })
</script>

<style scoped>
.chart-panel {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  min-height: 320px;
}
.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
  margin-bottom: 4px;
}
.title-left { display: flex; align-items: center; gap: 6px; color: #1e3a8a; font-weight: 600; font-size: 13px; }
.title-right { display: flex; gap: 6px; }
.chart-body { flex: 1; width: 100%; min-height: 260px; }
</style>
