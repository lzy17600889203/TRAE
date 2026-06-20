<template>
  <div ref="chartRef" class="usage-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { AREAS } from '../data/parking.js'

const props = defineProps({
  spots: { type: Array, required: true }
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null
const statsRef = shallowRef([])

function computeStats () {
  return AREAS.map(area => {
    const list = props.spots.filter(s => s.area === area.id)
    const used = list.filter(s => s.status !== 'free').length
    const rate = list.length ? Math.round((used / list.length) * 100) : 0
    return { name: area.name + '区', value: rate, color: area.color, id: area.id, total: list.length, used }
  })
}

function renderChart () {
  if (!chart) return
  const data = computeStats()
  statsRef.value = data
  const hottest = data.reduce((a, b) => (a.value > b.value ? a : b))

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(25,33,72,0.95)',
      borderColor: 'rgba(170,200,255,0.3)',
      textStyle: { color: '#e8ecff' },
      formatter: (params) => {
        const p = params[0]
        const d = data[p.dataIndex]
        return d.name + '<br/>使用率：<b>' + d.value + '%</b><br/>占用 ' + d.used + ' / 总 ' + d.total
      }
    },
    grid: { left: 10, right: 20, top: 60, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: { lineStyle: { color: 'rgba(170,200,255,0.25)' } },
      axisTick: { show: false },
      axisLabel: { color: '#cfd6f2', fontWeight: 600, fontSize: 13 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#9aa7d8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(170,200,255,0.1)' } }
    },
    series: [
      {
        type: 'bar',
        data: data.map(d => ({
          value: d.value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: d.color },
              { offset: 1, color: d.color + '44' }
            ]),
            borderRadius: [8, 8, 2, 2],
            shadowColor: d.color,
            shadowBlur: d.id === hottest.id ? 22 : 10
          },
          label: {
            show: true,
            position: 'top',
            color: d.color,
            fontWeight: 700,
            fontSize: 13,
            formatter: '{c}%'
          }
        })),
        barWidth: 42,
        animationDuration: 900
      }
    ]
  }, true)

  // Render crown label as graphic elements positioned using pixel conversion
  chart.setOption({
    graphic: buildCrownGraphic(hottest)
  })
}

function buildCrownGraphic (hottest) {
  if (!chart || !hottest) return []
  const idx = statsRef.value.findIndex(x => x.id === hottest.id)
  const barTopPixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [idx, hottest.value])
  if (!barTopPixel) return []
  const x = barTopPixel[0]
  const y = barTopPixel[1]
  return [
    {
      type: 'text',
      position: [x, y - 44],
      style: {
        text: '👑',
        font: 'bold 24px sans-serif',
        textAlign: 'center',
        textVerticalAlign: 'middle'
      }
    },
    {
      type: 'text',
      position: [x, y - 22],
      style: {
        text: hottest.name + ' · 最热门',
        font: 'bold 12px sans-serif',
        fill: '#ffc94a',
        textAlign: 'center',
        textVerticalAlign: 'middle'
      }
    }
  ]
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  renderChart()
  resizeObserver = new ResizeObserver(() => {
    if (!chart) return
    chart.resize()
    const hottest = statsRef.value.reduce((a, b) => (a.value > b.value ? a : b), statsRef.value[0])
    chart.setOption({ graphic: buildCrownGraphic(hottest) })
  })
  resizeObserver.observe(chartRef.value)
})

watch(() => props.spots, () => renderChart(), { deep: true })

onBeforeUnmount(() => {
  resizeObserver && resizeObserver.disconnect()
  chart && chart.dispose()
  chart = null
})
</script>

<style scoped>
.usage-chart {
  width: 100%;
  height: 100%;
  min-height: 260px;
}
</style>
