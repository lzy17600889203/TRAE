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
    animationDuration: 900,
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
    grid: { left: 24, right: 16, top: 56, bottom: 36, containLabel: true },
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
            shadowBlur: d.id === hottest.id ? 20 : 10
          },
          label: {
            show: true,
            position: 'top',
            color: d.color,
            fontWeight: 700,
            fontSize: 13,
            formatter: (d.id === hottest.id ? '👑 ' : '') + '{c}%'
          },
          _area: d
        })),
        barWidth: 42,
        emphasis: {
          focus: 'series',
          itemStyle: { shadowBlur: 28 }
        }
      },
      {
        type: 'custom',
        coordinateSystem: null,
        renderItem: function () { return null },
        data: []
      }
    ],
    graphic: buildCrownGraphic(hottest, data)
  }, true)
}

function buildCrownGraphic (hottest, data) {
  if (!chart || !hottest) return []
  // 把最热区的标签放到该柱子顶部偏上
  const idx = data.findIndex(x => x.id === hottest.id)
  const pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [idx, hottest.value])
  if (!pixel || pixel[0] == null || pixel[1] == null) return []
  return [
    {
      type: 'text',
      left: pixel[0],
      top: pixel[1] - 12,
      style: {
        text: '👑 ' + hottest.name + ' 最热门',
        fill: '#ffc94a',
        font: 'bold 12px sans-serif',
        textAlign: 'center',
        textVerticalAlign: 'bottom'
      },
      silent: true
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
    if (hottest) chart.setOption({ graphic: buildCrownGraphic(hottest, statsRef.value) })
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
  min-height: 0;
}
</style>
