<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { GaugeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'

echarts.use([GaugeChart, CanvasRenderer, GridComponent, TooltipComponent, TitleComponent])

const props = defineProps({
  label: { type: String, default: '指标' },
  icon: { type: String, default: '📊' },
  value: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  suitable: { type: Array, default: () => [20, 30] },
  action: { type: String, default: '调控' }
})

const chartRef = ref(null)
let instance = null

const isAbnormal = computed(() => props.value < props.suitable[0] || props.value > props.suitable[1])
const pointerColor = computed(() => (isAbnormal.value ? '#ff3b3b' : '#3fa34d'))
const axisLineColor = computed(() => (isAbnormal.value ? '#ff3b3b' : '#3fa34d'))

const progressPercent = computed(() => {
  const v = Math.max(props.min, Math.min(props.max, props.value))
  return ((v - props.min) / (props.max - props.min)) * 100
})

const actionTip = computed(() => {
  if (!isAbnormal.value) return '环境适宜，设备待机'
  if (props.value > props.suitable[1]) return `${props.label}过高，已启动${props.action}`
  return `${props.label}过低，已启动${props.action === '通风' ? '加热/加湿' : props.action}`
})

function renderChart() {
  if (!instance) return
  const lowZone = [props.suitable[0] / props.max, 0]
  const highZone = [1, props.suitable[1] / props.max]

  const option = {
    series: [
      {
        type: 'gauge',
        min: props.min,
        max: props.max,
        startAngle: 210,
        endAngle: -30,
        radius: '92%',
        center: ['50%', '58%'],
        progress: {
          show: true,
          width: 10,
          itemStyle: { color: axisLineColor.value, shadowBlur: 8, shadowColor: axisLineColor.value + '66' }
        },
        axisLine: {
          lineStyle: {
            width: 10,
            color: [
              [Math.max(0, (props.suitable[0] - props.min) / (props.max - props.min)), '#ffb020'],
              [Math.min(1, (props.suitable[1] - props.min) / (props.max - props.min)), '#3fa34d'],
              [1, '#ff3b3b']
            ]
          }
        },
        pointer: {
          icon: 'path://M2,0 L-2,0 L-0.4,-60 L0.4,-60 Z',
          length: '68%',
          width: 4,
          itemStyle: { color: pointerColor.value, shadowBlur: 10, shadowColor: pointerColor.value }
        },
        axisTick: { length: 6, lineStyle: { color: '#ffffff88', width: 1 }, distance: -14 },
        splitLine: { length: 12, lineStyle: { color: '#ffffff', width: 2 }, distance: -16 },
        axisLabel: { color: '#cbd5e1', distance: -32, fontSize: 10 },
        anchor: {
          show: true,
          showAbove: true,
          size: 12,
          itemStyle: { borderWidth: 3, borderColor: pointerColor.value, color: '#0f172a' }
        },
        title: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 26,
          fontWeight: 700,
          color: pointerColor.value,
          formatter: `{value} ${props.unit}`,
          offsetCenter: [0, '35%']
        },
        data: [{ value: props.value }]
      }
    ]
  }
  instance.setOption(option, true)
}

function handleResize() {
  instance && instance.resize()
}

onMounted(async () => {
  await nextTick()
  if (!chartRef.value) return
  instance = echarts.init(chartRef.value)
  renderChart()
  window.addEventListener('resize', handleResize)
})

watch(
  () => [props.value, props.suitable[0], props.suitable[1]],
  () => renderChart(),
  { deep: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  instance && instance.dispose()
  instance = null
})
</script>

<template>
  <div class="gauge-card" :class="{ abnormal: isAbnormal }">
    <div class="gauge-head">
      <span class="gauge-icon">{{ icon }}</span>
      <span class="gauge-label">{{ label }}</span>
      <el-tag :type="isAbnormal ? 'danger' : 'success'" size="small" effect="dark">
        {{ isAbnormal ? '超限' : '正常' }}
      </el-tag>
    </div>

    <div class="gauge-chart" ref="chartRef"></div>

    <div class="gauge-meta">
      <div class="range-row">
        <span>适宜范围</span>
        <span class="range-value">{{ suitable[0] }} ~ {{ suitable[1] }} {{ unit }}</span>
      </div>
      <div class="range-bar">
        <div class="range-fill" :style="{ width: progressPercent + '%', background: pointerColor }"></div>
      </div>
    </div>

    <div class="gauge-action" :class="{ active: isAbnormal }">
      <span class="fan" :class="{ spinning: isAbnormal }">✈</span>
      <div class="action-text">
        <div class="line-1">{{ isAbnormal ? '⚡ 自动调控中' : '✔ 环境稳定' }}</div>
        <div class="line-2">{{ actionTip }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gauge-card {
  background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 18px 16px 14px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.gauge-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, #3fa34d22, transparent 60%);
  pointer-events: none;
}
.gauge-card.abnormal {
  border-color: #ff3b3b;
  box-shadow: 0 0 24px #ff3b3b55, inset 0 0 20px #ff3b3b22;
  animation: abnormalPulse 2s ease-in-out infinite;
}
@keyframes abnormalPulse {
  0%, 100% { box-shadow: 0 0 16px #ff3b3b55, inset 0 0 18px #ff3b3b22; }
  50% { box-shadow: 0 0 32px #ff3b3b88, inset 0 0 28px #ff3b3b33; }
}

.gauge-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.gauge-icon {
  font-size: 20px;
}
.gauge-label {
  color: #e2e8f0;
  font-size: 15px;
  font-weight: 600;
  flex: 1;
}
.gauge-chart {
  width: 100%;
  height: 200px;
}
.gauge-meta {
  padding: 0 4px 6px;
}
.range-row {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 6px;
}
.range-value { color: #e2e8f0; font-weight: 600; }
.range-bar {
  height: 6px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
}
.range-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease, background 0.3s;
}

.gauge-action {
  margin-top: 10px;
  background: #0b1220;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
}
.gauge-action.active {
  border-color: #ff3b3b66;
  background: linear-gradient(90deg, #ff3b3b22, #0b1220);
}
.fan {
  font-size: 28px;
  color: #3fa34d;
  display: inline-block;
  transform-origin: center;
}
.gauge-action.active .fan {
  color: #ff9f1c;
  animation: none;
}
.fan.spinning {
  animation: fanSpin 0.8s linear infinite;
  color: #ff3b3b !important;
  text-shadow: 0 0 10px #ff3b3b;
}
@keyframes fanSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.action-text .line-1 {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
}
.gauge-action.active .line-1 { color: #ff6b6b; }
.action-text .line-2 {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}
</style>
