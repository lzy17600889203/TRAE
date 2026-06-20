<template>
  <div ref="chartRef" class="map-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { AREAS } from '../data/parking.js'

echarts.use([CanvasRenderer, CustomChart, GridComponent, TooltipComponent])

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

const DESIGN_W = 780
const DESIGN_H = 620
const AREA_W = 320
const AREA_H = 240
const ROWS_PER_AREA = 3
const COLS_PER_AREA = 6
const SPOT_W = 42
const SPOT_H = 62

function areaBox (a) {
  const areaGapX = (DESIGN_W - 2 * AREA_W) / 3
  const areaGapY = (DESIGN_H - 2 * AREA_H) / 3
  return {
    x: areaGapX + a.col * (AREA_W + areaGapX),
    y: areaGapY + a.row * (AREA_H + areaGapY)
  }
}

function spotCenter (spot) {
  const a = AREAS.find(x => x.id === spot.area)
  const box = areaBox(a)
  const padX = (AREA_W - COLS_PER_AREA * SPOT_W) / 2
  const padY = (AREA_H - ROWS_PER_AREA * SPOT_H) / 2
  return {
    x: box.x + padX + spot.col * SPOT_W + SPOT_W / 2,
    y: box.y + padY + spot.row * SPOT_H + SPOT_H / 2
  }
}

function textSize (base, scale) {
  return Math.max(8, Math.round(base * scale)) + 'px sans-serif'
}

function renderChart () {
  if (!chart) return
  spotsRef.value = props.spots

  const decorative = []
  AREAS.forEach(a => {
    const box = areaBox(a)
    decorative.push({
      name: '__area_box_' + a.id,
      value: [box.x + AREA_W / 2, box.y + AREA_H / 2],
      _role: 'area-box',
      _area: { ...a, box }
    })
    decorative.push({
      name: '__area_title_' + a.id,
      value: [box.x + AREA_W / 2, box.y - 10],
      _role: 'area-title',
      _area: a
    })
  })
  decorative.push({
    name: '__entrance',
    value: [DESIGN_W / 2, 20],
    _role: 'entrance'
  })

  const dataPoints = props.spots.map(spot => ({
    name: spot.id,
    value: [spotCenter(spot).x, spotCenter(spot).y],
    _role: 'spot',
    _spot: spot
  }))

  chart.setOption({
    backgroundColor: 'transparent',
    animationDuration: 600,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(25,33,72,0.96)',
      borderColor: 'rgba(170,200,255,0.3)',
      textStyle: { color: '#e8ecff', fontSize: 13 },
      formatter: function (p) {
        const s = p.data && p.data._spot
        if (!s) return ''
        const stateText = s.status === 'free' ? '空闲' : s.status === 'reserved' ? '预留' : '占用'
        return '<b>' + s.id + '</b><br/>状态：' + stateText + (s.plate ? '<br/>车牌：' + s.plate + '<br/>入场：' + s.inTime : '')
      }
    },
    grid: { left: 10, right: 10, top: 40, bottom: 10 },
    xAxis: { type: 'value', show: false, min: 0, max: DESIGN_W },
    yAxis: { type: 'value', show: false, inverse: true, min: 0, max: DESIGN_H },
    series: [
      {
        type: 'custom',
        coordinateSystem: 'cartesian2d',
        encode: { x: 0, y: 1 },
        renderItem: function (params, api) {
          const cx = api.coord([api.value(0), api.value(1)])[0]
          const cy = api.coord([api.value(0), api.value(1)])[1]
          const scaleX = api.getWidth() / DESIGN_W
          const scaleY = api.getHeight() / DESIGN_H
          const scale = Math.min(scaleX, scaleY)
          const role = params.data._role

          if (role === 'entrance') {
            return {
              type: 'text',
              silent: true,
              style: {
                text: '▼ 车辆入口 · ENTRANCE ▼',
                x: cx,
                y: cy,
                fill: '#7ad9ff',
                font: 'bold ' + textSize(13, scale),
                textAlign: 'center',
                textVerticalAlign: 'middle'
              }
            }
          }
          if (role === 'area-box') {
            const info = params.data._area
            return {
              type: 'rect',
              silent: true,
              shape: {
                x: cx - (AREA_W + 20) * scale / 2,
                y: cy - (AREA_H + 26) * scale / 2,
                width: (AREA_W + 20) * scale,
                height: (AREA_H + 26) * scale,
                r: 12 * scale
              },
              style: {
                fill: 'rgba(255,255,255,0.02)',
                stroke: info.color + '88',
                lineWidth: 1.5 * scale,
                lineDash: [6 * scale, 4 * scale]
              }
            }
          }
          if (role === 'area-title') {
            const info = params.data._area
            return {
              type: 'text',
              silent: true,
              style: {
                text: info.name + ' 停车区',
                x: cx,
                y: cy,
                fill: info.color,
                font: 'bold ' + textSize(14, scale),
                textAlign: 'center',
                textVerticalAlign: 'middle'
              }
            }
          }
          // spot
          const spot = params.data._spot
          if (!spot) return
          const color = STATUS_COLOR[spot.status]
          const statusText = spot.status === 'free' ? '空闲' : spot.status === 'reserved' ? '预留' : '占用'
          const w = SPOT_W * scale
          const h = SPOT_H * scale
          return {
            type: 'group',
            children: [
              {
                type: 'rect',
                shape: { x: cx - w / 2, y: cy - h / 2, width: w, height: h, r: 6 * scale },
                style: {
                  fill: color + '44',
                  stroke: color,
                  lineWidth: Math.max(1.5, 2 * scale),
                  shadowColor: color,
                  shadowBlur: 12 * scale
                },
                styleEmphasis: {
                  fill: color + 'cc',
                  shadowBlur: 22 * scale,
                  lineWidth: Math.max(2, 3 * scale)
                }
              },
              {
                type: 'text',
                style: {
                  text: spot.id,
                  x: cx,
                  y: cy - 2 * scale,
                  fill: color,
                  font: 'bold ' + textSize(11, scale),
                  textAlign: 'center',
                  textVerticalAlign: 'middle'
                },
                silent: true
              },
              {
                type: 'text',
                style: {
                  text: statusText,
                  x: cx,
                  y: cy + 12 * scale,
                  fill: color,
                  font: textSize(10, scale),
                  textAlign: 'center',
                  textVerticalAlign: 'middle'
                },
                silent: true
              }
            ]
          }
        },
        data: [...decorative, ...dataPoints]
      }
    ]
  }, true)
}

function onChartClick (params) {
  const data = params.data
  if (!data || data._role !== 'spot' || !data._spot) return
  emit('spotClick', { spot: data._spot, event: params.event })
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  renderChart()
  chart.on('click', onChartClick)
  resizeObserver = new ResizeObserver(function () {
    chart && chart.resize()
  })
  resizeObserver.observe(chartRef.value)
})

watch(function () { return props.spots }, function () { renderChart() }, { deep: true })

onBeforeUnmount(function () {
  resizeObserver && resizeObserver.disconnect()
  chart && chart.dispose()
  chart = null
})
</script>

<style scoped>
.map-chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
