<template>
  <div ref="chartRef" class="heart-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  wave: { type: Array, default: () => [] },
  color: { type: String, default: '#f56c6c' }
})

const chartRef = ref(null)
let chart = null
let timer = null

function render() {
  if (!chart || !props.wave.length) return
  const x = props.wave.map((_, i) => i)
  chart.setOption({
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', data: x, show: false },
    yAxis: { type: 'value', show: false, min: 40, max: 100 },
    series: [
      {
        type: 'line',
        data: props.wave,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: props.color, width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: props.color + '55' },
            { offset: 1, color: props.color + '05' }
          ])
        },
        animation: false
      }
    ]
  })
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  render()
})

onBeforeUnmount(() => {
  clearInterval(timer)
  chart && chart.dispose()
})

watch(
  () => props.wave,
  render,
  { deep: true }
)
</script>
