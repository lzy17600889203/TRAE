<template>
  <div ref="chartRef" class="map-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { AREAS } from '../data/parking.js'

const props = defineProps({
  spots: { type: Array, required: true }
})
const emit = defineEmits(['spotClick'])

const chartRef = ref(null)
let chart = null
let resizeObserver = null
const spotsRef = shallowRef([])

const STATUS_COLOR = {
  free: '#67e8a8',
  used: '#ff6b8a',
  reserved: '#ffc94a'
}

const areaW = 320
const areaH = 240
const gap = 80
const totalW = 2 * areaW + gap + 60
const totalH = 2 * areaH + gap + 40
const rowsPerArea = 3
const colsPerArea = 6
const spotW = 42
const spotH = 62

function areaBox (a) {
  return {
    x: 30 + a.col * (areaW + gap),
    y: 30 + a.row * (areaH + gap)
  }
}

function padX () { return (areaW - colsPerArea * spotW) / 2 }
function padY () { return (areaH - rowsPerArea * spotH) / 2 }

function spotCenter (spot) {
  const a = AREAS.find(x => x.id === spot.area)
  const box = areaBox(a)
  return {
    x: box.x + padX() + spot.col * spotW + spotW / 2,
    y: box.y + padY() + spot.row * spotH + spotH / 2
  }
}

function renderChart () {
  if (!chart) return
  spotsRef.value = props.spots

  const groupElements = []

  AREAS.forEach(a => {
    const box = areaBox(a)
    groupElements.push({
      type: 'rect',
      shape: { x: box.x - 14, y: box.y - 28, width: areaW + 28, height: areaH + 34 },
      style: {
        fill: 'rgba(255,255,255,0.02)',
        stroke: a.color + '66',
        lineWidth: 1.5,
        lineDash: [6, 4]
      },
      z: 1
    })
    groupElements.push({
      type: 'text',
      style: {
        text: a.name + ' 停车区',
        x: box.x + areaW / 2,
        y: box.y - 12,
        fill: a.color,
        font: 'bold 14px sans-serif',
        textAlign: 'center',
        textVerticalAlign: 'middle'
      },
      z: 3
    })
  })

  groupElements.push({
    type: 'text',
    style: {
      text: '▼ 车辆入口 ENTRANCE ▼',
      x: totalW / 2,
      y: 18,
      fill: '#7ad9ff',
      font: 'bold 13px sans-serif',
      textAlign: 'center',
      textVerticalAlign: 'middle'
    },
    z: 5
  })

  const dataPoints = props.spots.map((spot, idx) => ({
    name: spot.id,
    value: [idx, 1],
    spot: spot,
    itemStyle: { color: STATUS_COLOR[spot.status] }
  }))

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(25,33,72,0.95)',
      borderColor: 'rgba(170,200,255,0.3)',
      textStyle: { color: '#e8ecff' },
      formatter: (p) => {
        const s = p.data.spot
        const stateText = s.status === 'free' ? '空闲' : s.status === 'reserved' ? '预留' : '占用'
        return `<b>${s.id}</b><br/>状态：${stateText}<br/>${s.plate ? '车牌：' + s.plate + '<br/>入场：' + s.inTime : ''}`
      }
    },
    xAxis: { show: false, min: 0, max: totalW },
    yAxis: { show: false, min: 0, max: totalH, inverse: true },
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    series: [
      {
        type: 'custom',
        coordinateSystem: null,
        renderItem: function (params) {
          const spot = spotsRef.value[params.dataIndex]
          if (!spot) return
          const c = spotCenter(spot)
          const color = STATUS_COLOR[spot.status]
          const statusText = spot.status === 'free' ? '空闲' : spot.status === 'reserved' ? '预留' : '占用'
          return {
            type: 'group',
            children: [
              {
                type: 'rect',
                shape: { x: c.x - spotW / 2, y: c.y - spotH / 2, width: spotW, height: spotH, r: 6 },
                style: {
                  fill: color + '44',
                  stroke: color,
                  lineWidth: 2,
                  shadowColor: color,
                  shadowBlur: 12
                },
                styleEmphasis: {
                  fill: color + 'cc',
                  shadowBlur: 22,
                  lineWidth: 3
                }
              },
              {
                type: 'text',
                style: {
                  text: spot.id,
                  x: c.x,
                  y: c.y - 2,
                  fill: color,
                  font: 'bold 11px sans-serif',
                  textAlign: 'center',
                  textVerticalAlign: 'middle'
                }
              },
              {
                type: 'text',
                style: {
                  text: statusText,
                  x: c.x,
                  y: c.y + 12,
                  fill: color,
                  font: '10px sans-serif',
                  textAlign: 'center',
                  textVerticalAlign: 'middle'
                }
              }
            ]
          }
        },
        data: dataPoints,
        animationDuration: 700
      }
    ],
    graphic: { elements: groupElements }
  }, true)
}

function onChartClick (params) {
  const spot = spotsRef.value[params.dataIndex]
  if (spot) {
    emit('spotClick', { spot: spot, event: params.event })
  }
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  renderChart()
  chart.on('click', onChartClick)
  resizeObserver = new ResizeObserver(() => chart && chart.resize())
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
.map-chart {
  width: 100%;
  height: 100%;
  min-height: 480px;
}
</style>
