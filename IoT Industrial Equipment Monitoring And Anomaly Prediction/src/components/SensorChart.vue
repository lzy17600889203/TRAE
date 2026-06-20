<template>
  <div ref="chartRef" class="sensor-chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  title: { type: String, default: '' },
  unit: { type: String, default: '' },
  data: { type: Array, required: true },
  warningLine: { type: Number, default: 80 },
  color: { type: String, default: '#409eff' },
  abnormalRanges: { type: Array, default: () => [] }
})

const chartRef = ref(null)
let chartInstance = null

function formatTime(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildOption() {
  const timeData = props.data.map(p => formatTime(p.time))
  const valueData = props.data.map(p => p.value)

  // 异常区间标记（markArea）
  const markAreas = props.abnormalRanges.map(r => [
    {
      xAxis: timeData[r.startIdx],
      itemStyle: { color: 'rgba(245, 108, 108, 0.25)' }
    },
    { xAxis: timeData[r.endIdx] }
  ])

  // 异常点高亮（高于阈值的点）
  const markPoints = props.data
    .map((p, i) => (p.value > props.warningLine ? { name: '异常', coord: [timeData[i], p.value] } : null))
    .filter(Boolean)
    .slice(0, 20)

  return {
    backgroundColor: 'transparent',
    title: {
      text: props.title,
      left: 0,
      textStyle: { fontSize: 14, color: '#303133', fontWeight: 600 }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: props.color,
      borderWidth: 1,
      textStyle: { color: '#e0e6ed' },
      formatter: (params) => {
        const p = params[0]
        return `
          <div style="font-size:12px">
            <b>时间:</b> ${p.axisValue}<br/>
            <b>${props.title}:</b> ${p.value}${props.unit}
          </div>
        `
      }
    },
    grid: { left: 50, right: 20, top: 45, bottom: 40 },
    xAxis: {
      type: 'category',
      data: timeData,
      axisLabel: {
        color: '#606266',
        fontSize: 11,
        interval: Math.floor(timeData.length / 8),
        rotate: 0
      },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    yAxis: {
      type: 'value',
      name: props.unit,
      nameTextStyle: { color: '#909399', fontSize: 11 },
      axisLabel: { color: '#606266', fontSize: 11 },
      splitLine: { lineStyle: { color: '#ebeef5', type: 'dashed' } }
    },
    series: [
      {
        name: props.title,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: valueData,
        lineStyle: {
          width: 2.5,
          color: props.color,
          shadowColor: props.color,
          shadowBlur: 8,
          shadowOffsetY: 3
        },
        itemStyle: {
          color: props.color,
          borderColor: '#ffffff',
          borderWidth: 1.5
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(props.color, 0.5) },
            { offset: 0.5, color: hexToRgba(props.color, 0.2) },
            { offset: 1, color: hexToRgba(props.color, 0.02) }
          ])
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#f56c6c', type: 'dashed', width: 1.5 },
          label: {
            formatter: `警告阈值: ${props.warningLine}${props.unit}`,
            color: '#f56c6c',
            fontSize: 11
          },
          data: [{ yAxis: props.warningLine }]
        },
        markArea: {
          silent: true,
          itemStyle: { borderColor: '#f56c6c', borderWidth: 0.5 },
          data: markAreas
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 30,
          itemStyle: { color: '#f56c6c' },
          label: { color: '#ffffff', fontSize: 10 },
          data: markPoints.map(p => ({
            coord: p.coord,
            value: p.coord[1]
          })).slice(0, 6)
        }
      }
    ]
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildOption())
}

function refresh() {
  if (!chartInstance) return
  chartInstance.setOption(buildOption(), true)
}

watch(
  () => [props.data, props.warningLine, props.abnormalRanges],
  () => {
    nextTick(refresh)
  },
  { deep: true }
)

const handleResize = () => chartInstance && chartInstance.resize()

onMounted(() => {
  nextTick(initChart)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

defineExpose({ refresh })
</script>

<style scoped>
.sensor-chart {
  width: 100%;
  height: 100%;
  min-height: 280px;
}
</style>
