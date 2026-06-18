<template>
  <div ref="chartRef" class="chart-box chart-box--tall"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  warehouses: { type: Array, required: true },
  skuNames: { type: Array, required: true },
  matrix: { type: Array, required: true },
  alerts: { type: Array, default: () => [] }
})

const chartRef = ref(null)
let chart = null
let resizeHandler = null
let alertAnimHandle = null
let alertPhase = 0

const getOption = () => {
  const alertSet = new Set(props.alerts.map((a) => `${a.warehouse}-${a.sku}`))
  const seriesData = []
  for (let w = 0; w < props.warehouses.length; w++) {
    for (let s = 0; s < props.skuNames.length; s++) {
      const cell = props.matrix[w][s]
      const isAlert = alertSet.has(`${cell.warehouse}-${cell.sku}`)
      seriesData.push({
        value: [s, w, cell.current],
        itemStyle: isAlert
          ? { borderColor: '#fca5a5', borderWidth: 2, shadowBlur: 12, shadowColor: 'rgba(239, 68, 68, 0.9)' }
          : { borderColor: '#0f172a', borderWidth: 2 },
        emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 20, shadowColor: 'rgba(255,255,255,0.6)' } }
      })
    }
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (p) => {
        const cell = props.matrix[p.value[1]][p.value[0]]
        const ratio = ((cell.current / cell.capacity) * 100).toFixed(1)
        const isAlert = alertSet.has(`${cell.warehouse}-${cell.sku}`)
        return `
          <div style="font-weight:700;margin-bottom:4px;">${cell.warehouse} · ${cell.skuName}</div>
          <div style="color:#94a3b8;font-size:12px;">SKU: ${cell.sku}</div>
          <div style="margin-top:6px;">当前库存: <b style="color:#f8fafc;">${cell.current}</b></div>
          <div>安全阈值: <b style="color:#fbbf24;">${cell.safety}</b></div>
          <div>仓容: ${cell.capacity} (${ratio}%)</div>
          ${isAlert ? '<div style="color:#fca5a5;margin-top:4px;font-weight:700;">⚠ 库存预警</div>' : ''}
        `
      }
    },
    grid: { left: 80, right: 30, top: 30, bottom: 70 },
    xAxis: {
      type: 'category',
      data: props.skuNames,
      splitArea: { show: true },
      axisLabel: { color: '#cbd5e1', fontSize: 11, interval: 0, rotate: 18 },
      axisLine: { lineStyle: { color: '#475569' } }
    },
    yAxis: {
      type: 'category',
      data: props.warehouses,
      splitArea: { show: true },
      axisLabel: { color: '#cbd5e1', fontSize: 12 },
      axisLine: { lineStyle: { color: '#475569' } }
    },
    visualMap: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 6,
      min: 0,
      max: 220,
      itemWidth: 10,
      itemHeight: 120,
      textStyle: { color: '#cbd5e1' },
      calculable: true,
      inRange: { color: ['#0ea5e9', '#22c55e', '#eab308', '#ef4444'] }
    },
    series: [
      {
        name: '库存',
        type: 'heatmap',
        data: seriesData,
        label: { show: true, color: '#0b1220', fontWeight: 700, fontSize: 11, formatter: (p) => p.value[2] },
        progressive: 1000,
        animation: true
      }
    ]
  }
}

const refreshAlertHighlight = () => {
  if (!chart) return
  alertPhase = (alertPhase + 1) % 2
  const alertSet = new Set(props.alerts.map((a) => `${a.warehouse}-${a.sku}`))
  const data = []
  for (let w = 0; w < props.warehouses.length; w++) {
    for (let s = 0; s < props.skuNames.length; s++) {
      const cell = props.matrix[w][s]
      const isAlert = alertSet.has(`${cell.warehouse}-${cell.sku}`)
      data.push({
        value: [s, w, cell.current],
        itemStyle: isAlert
          ? alertPhase === 0
            ? { borderColor: '#fca5a5', borderWidth: 2, shadowBlur: 12, shadowColor: 'rgba(239, 68, 68, 0.9)' }
            : { borderColor: '#ffffff', borderWidth: 3, shadowBlur: 28, shadowColor: 'rgba(239, 68, 68, 1)' }
          : { borderColor: '#0f172a', borderWidth: 2 }
      })
    }
  }
  chart.setOption({ series: [{ data }] })
}

watch(
  () => [props.matrix, props.alerts],
  () => {
    if (chart) chart.setOption(getOption(), { notMerge: false })
  },
  { deep: true }
)

onMounted(() => {
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  chart.setOption(getOption())
  resizeHandler = () => chart && chart.resize()
  window.addEventListener('resize', resizeHandler)
  alertAnimHandle = setInterval(refreshAlertHighlight, 600)
})

onBeforeUnmount(() => {
  if (alertAnimHandle) clearInterval(alertAnimHandle)
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>
