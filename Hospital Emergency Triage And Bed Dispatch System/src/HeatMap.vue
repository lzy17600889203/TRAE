<template>
  <div ref="chartRef" class="heatmap-wrap"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { zones, simulateCrowd } from './store.js'

const chartRef = ref(null)
let chart = null
let timer = null

const emit = defineEmits(['crowded'])

const crowdedData = computed(() => {
  return zones.value.map(z => ({
    name: z.name,
    value: [
      zones.value.indexOf(z),
      0,
      Math.round((z.used / z.capacity) * 100)
    ],
    used: z.used,
    capacity: z.capacity,
    raw: z
  }))
})

function crowdColor(percent) {
  if (percent >= 80) return '#c0392b'
  if (percent >= 60) return '#e67e22'
  if (percent >= 40) return '#f1c40f'
  if (percent >= 20) return '#27ae60'
  return '#3498db'
}

function render() {
  if (!chart) return
  const labels = zones.value.map(z => z.name)
  const data = crowdedData.value
  const crowded = data.filter(d => d.value[2] > 80)

  chart.setOption({
    title: {
      text: crowded.length
        ? `⚠ 拥挤区域：${crowded.map(d => d.name).join('、')}`
        : '各区域拥挤程度实时监测',
      left: 'center',
      top: 6,
      textStyle: {
        color: crowded.length ? '#c0392b' : '#1a3a5c',
        fontSize: 14,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const d = data[params.dataIndex]
        return `
          <div style="padding:6px;min-width:160px">
            <div style="font-weight:700;color:#1a3a5c;margin-bottom:6px">${d.name}</div>
            <div style="color:#606266;font-size:12px;line-height:1.8">
              占用床位：<b>${d.used}</b> / ${d.capacity}<br/>
              拥挤度：<b style="color:${crowdColor(d.value[2])}">${d.value[2]}%</b>
            </div>
          </div>
        `
      }
    },
    grid: {
      left: 60,
      right: 40,
      top: 60,
      bottom: 60,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: labels,
      splitArea: { show: true },
      axisLabel: {
        color: '#606266',
        fontSize: 12,
        interval: 0,
        rotate: 0
      },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    yAxis: {
      type: 'category',
      data: ['拥挤度'],
      splitArea: { show: true },
      axisLabel: { color: '#606266' },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    visualMap: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      min: 0,
      max: 100,
      text: ['高拥挤', '空闲'],
      textStyle: { color: '#606266' },
      inRange: {
        color: ['#3498db', '#27ae60', '#f1c40f', '#e67e22', '#c0392b']
      },
      calculable: true
    },
    series: [
      {
        name: '拥挤度',
        type: 'heatmap',
        data: data.map(d => ({
          ...d,
          itemStyle: {
            color: crowdColor(d.value[2]),
            shadowBlur: d.value[2] > 80 ? 20 : 0,
            shadowColor: d.value[2] > 80 ? '#c0392b' : 'transparent'
          }
        })),
        label: {
          show: true,
          formatter: (params) => {
            const d = data[params.dataIndex]
            return `{val|${d.value[2]}%}\n{sub|${d.used}/${d.capacity}}`
          },
          rich: {
            val: {
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 24
            },
            sub: {
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              lineHeight: 16
            }
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 24,
            shadowColor: 'rgba(0,0,0,0.35)',
            borderColor: '#fff',
            borderWidth: 2
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 3,
          borderRadius: 8
        }
      }
    ]
  })
}

function tick() {
  simulateCrowd()
  render()
  const crowded = zones.value.filter(z => (z.used / z.capacity) > 0.8)
  if (crowded.length) {
    emit('crowded', crowded)
  }
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  render()
  timer = setInterval(tick, 4000)
  window.addEventListener('resize', resize)
})

function resize() {
  chart && chart.resize()
}

onBeforeUnmount(() => {
  clearInterval(timer)
  chart && chart.dispose()
  window.removeEventListener('resize', resize)
})

watch(zones, render, { deep: true })
</script>
