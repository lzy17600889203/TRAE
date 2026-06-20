<template>
  <div class="topology-chart-wrapper">
    <div ref="chartRef" class="chart-container"></div>
    <div
      v-for="node in abnormalNodes"
      :key="node.id"
      class="ripple-overlay"
      :style="nodeStyle(node)"
    >
      <div class="ripple ripple-1"></div>
      <div class="ripple ripple-2"></div>
      <div class="ripple ripple-3"></div>
      <div class="anomaly-tag">{{ node.anomalyMsg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  equipmentList: { type: Array, required: true },
  links: { type: Array, required: true },
  readings: { type: Object, required: true }
})

const emit = defineEmits(['select-node'])

const chartRef = ref(null)
let chartInstance = null

function statusColor(status) {
  if (status === 'error') return '#f56c6c'
  if (status === 'warn') return '#e6a23c'
  return '#67c23a'
}

const abnormalNodes = computed(() => {
  return props.equipmentList
    .map(eq => {
      const r = props.readings[eq.id]
      if (!r || r.status !== 'error') return null
      return {
        id: eq.id,
        x: eq.x,
        y: eq.y,
        anomalyMsg: r.anomalyMsg || '异常'
      }
    })
    .filter(Boolean)
})

function nodeStyle(node) {
  // 坐标以容器的百分比对齐；这里以 800x500 的逻辑坐标系为基准
  return {
    left: `${(node.x / 800) * 100}%`,
    top: `${(node.y / 500) * 100}%`
  }
}

function buildOption() {
  const nodes = props.equipmentList.map(eq => {
    const r = props.readings[eq.id] || { status: 'ok', temperature: 0, vibration: 0 }
    const color = statusColor(r.status)
    const isAbnormal = r.status === 'error'
    const isWarn = r.status === 'warn'
    const isCenter = eq.type === 'center'
    return {
      id: eq.id,
      name: eq.name,
      x: eq.x,
      y: eq.y,
      symbolSize: isCenter ? 60 : isAbnormal ? 52 : 44,
      symbol: 'circle',
      itemStyle: {
        color: color,
        borderColor: isAbnormal ? '#ffffff' : color,
        borderWidth: isAbnormal ? 4 : 2,
        shadowColor: isAbnormal ? 'rgba(245, 108, 108, 0.95)' : `${color}88`,
        shadowBlur: isAbnormal ? 25 : 12
      },
      label: {
        show: true,
        position: 'bottom',
        distance: 16,
        formatter: `{name|${eq.name}}\n{val|${r.temperature}℃  ${r.vibration.toFixed(2)}mm/s}`,
        rich: {
          name: { color: '#e0e6ed', fontSize: 13, fontWeight: 'bold', lineHeight: 20 },
          val: {
            color: r.status === 'error' ? '#f56c6c' : '#7a8a9e',
            fontSize: 11,
            lineHeight: 18
          }
        }
      },
      emphasis: {
        scale: 1.35,
        itemStyle: { shadowColor: color, shadowBlur: 30, borderColor: '#ffffff', borderWidth: 3 }
      },
      _status: r.status,
      _anomalyMsg: r.anomalyMsg,
      _type: eq.type,
      _center: isCenter
    }
  })

  const edges = props.links.map(link => {
    const srcNode = nodes.find(n => n.id === link.source)
    const tgtNode = nodes.find(n => n.id === link.target)
    const hasError =
      srcNode?._status === 'error' || tgtNode?._status === 'error'
    return {
      source: link.source,
      target: link.target,
      lineStyle: {
        color: hasError ? 'rgba(245, 108, 108, 0.65)' : 'rgba(64, 158, 255, 0.45)',
        width: hasError ? 2.8 : 1.6,
        curveness: 0.08,
        opacity: 0.95
      }
    }
  })

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#409eff',
      borderWidth: 1,
      textStyle: { color: '#e0e6ed', fontSize: 12 },
      formatter: (params) => {
        if (params.seriesType !== 'graph' || !params.data) return ''
        const d = params.data
        const r = props.readings[d.id] || {}
        const statusText =
          d._status === 'error' ? '⚠ 异常' : d._status === 'warn' ? '! 预警' : '✓ 正常'
        const color = statusColor(d._status)
        return `
          <div style="font-weight:bold;font-size:14px;margin-bottom:6px;color:${color}">
            ● ${d.name}
          </div>
          <div style="font-size:12px;line-height:1.9">
            温度: <b>${r.temperature}℃</b><br/>
            震动: <b>${r.vibration}mm/s</b><br/>
            状态: <b>${statusText}</b>
            ${d._anomalyMsg ? `<br/><span style="color:#f56c6c">${d._anomalyMsg}</span>` : ''}
            <br/><small style="color:#7a8a9e">点击查看 24h 趋势</small>
          </div>
        `
      }
    },
    animationDurationUpdate: 600,
    animationEasingUpdate: 'cubicOut',
    series: [
      {
        type: 'graph',
        layout: 'none',
        roam: true,
        draggable: true,
        focusNodeAdjacency: true,
        data: nodes,
        links: edges,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 8,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3, color: '#409eff' }
        }
      }
    ]
  }
}

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildOption())

  chartInstance.on('click', (params) => {
    if (params.seriesType === 'graph' && params.data && params.data.id) {
      emit('select-node', params.data.id)
    }
  })
}

function refreshChart() {
  if (!chartInstance) return
  chartInstance.setOption(buildOption(), true)
}

watch(
  () => [props.readings, props.equipmentList],
  () => nextTick(refreshChart),
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

defineExpose({ refreshChart })
</script>

<style scoped>
.topology-chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.ripple-overlay {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52px;
  height: 52px;
  margin-left: -26px;
  margin-top: -26px;
  border-radius: 50%;
  border: 2px solid rgba(245, 108, 108, 0.7);
  background: radial-gradient(
    circle,
    rgba(245, 108, 108, 0.25) 0%,
    rgba(245, 108, 108, 0) 70%
  );
  animation: rippleExpand 2.2s ease-out infinite;
  opacity: 0;
}

.ripple-1 { animation-delay: 0s; }
.ripple-2 { animation-delay: 0.7s; }
.ripple-3 { animation-delay: 1.4s; }

@keyframes rippleExpand {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
    border-width: 3px;
  }
  100% {
    transform: scale(3.5);
    opacity: 0;
    border-width: 1px;
  }
}

.anomaly-tag {
  position: absolute;
  left: 50%;
  top: -52px;
  transform: translateX(-50%);
  padding: 5px 12px;
  background: rgba(245, 108, 108, 0.95);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.5);
  animation: tagBlink 1.4s ease-in-out infinite;
}

.anomaly-tag::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(245, 108, 108, 0.95);
}

@keyframes tagBlink {
  0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.75; transform: translateX(-50%) scale(1.05); }
}
</style>
