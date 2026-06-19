<template>
  <div class="funnel-container">
    <div ref="chartRef" class="chart"></div>

    <!-- 悬停浮层：通过定位在图表下方显示当前 hover 阶段的明细 -->
    <div
      v-if="hoverStage"
      class="funnel-popover"
      :style="{ top: popoverPos.y + 'px', left: popoverPos.x + 'px' }"
    >
      <h4>
        阶段：{{ hoverStage.name }} · 共 {{ hoverStage.count }} 家
        <span class="rate">转化率 {{ conversionRate(hoverStage) }}%</span>
      </h4>
      <div style="color:#909399; font-size:12px; margin-top:4px;">
        相对上一层：{{ stageDelta(hoverStage) }}
      </div>
      <ul>
        <li v-for="(name, i) in stageList(hoverStage.key)" :key="i">
          {{ i + 1 }}. {{ name }}
        </li>
      </ul>
    </div>

    <div class="funnel-summary">
      <div v-for="(s, i) in funnelStages" :key="s.key" class="stage-chip">
        <span class="dot" :style="{ background: colorList[i] }"></span>
        <span>{{ s.name }}（{{ s.count }}）</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { funnelStages, stageCustomers } from '../data/customers.js'

const chartRef = ref(null)
let chart = null

const colorList = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']

const hoverStage = ref(null)
const popoverPos = ref({ x: 20, y: 360 })

function stageList(key) {
  return stageCustomers[key] || []
}

// 相对顶层（线索）的转化率
function conversionRate(stage) {
  const total = funnelStages[0].count
  if (!total) return 0
  return ((stage.count / total) * 100).toFixed(1)
}

// 相对上一层的变化
function stageDelta(stage) {
  const idx = funnelStages.findIndex((s) => s.key === stage.key)
  if (idx <= 0) return '起始阶段'
  const prev = funnelStages[idx - 1].count
  const drop = prev - stage.count
  const keep = ((stage.count / prev) * 100).toFixed(1)
  return `流失 ${drop} 家，留存 ${keep}%`
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        const stage = funnelStages.find((s) => s.name === params.name)
        const total = funnelStages[0].count
        const rate = stage ? ((stage.count / total) * 100).toFixed(1) : 0
        return `
          <div style="font-weight:600; margin-bottom:4px;">${params.name}</div>
          <div>客户数：${params.value} 家</div>
          <div>整体转化率：${rate}%</div>
          <div style="color:#909399; font-size:12px; margin-top:4px;">
            详见下方明细列表
          </div>
        `
      }
    },
    series: [
      {
        name: '客户转化漏斗',
        type: 'funnel',
        top: 10,
        bottom: 10,
        left: '8%',
        right: '8%',
        minSize: '20%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}：{c} 家',
          color: '#fff',
          fontWeight: 600
        },
        labelLine: { length: 0 },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          label: { fontSize: 16 }
        },
        data: funnelStages.map((s, i) => ({
          name: s.name,
          value: s.count,
          itemStyle: { color: colorList[i] },
          _key: s.key
        }))
      }
    ]
  }
  chart.setOption(option)

  // 悬停事件：弹出详细客户列表
  chart.on('mouseover', (params) => {
    const stage = funnelStages.find((s) => s.name === params.name)
    if (!stage) return
    hoverStage.value = stage
    // 根据鼠标在 DOM 中的位置定位浮层
    const rect = chartRef.value.getBoundingClientRect()
    const parentRect = chartRef.value.parentElement.getBoundingClientRect()
    popoverPos.value = {
      x: rect.left - parentRect.left + 20,
      y: rect.bottom - parentRect.top + 10
    }
  })

  chart.on('mouseout', () => {
    // 延迟隐藏，给用户视觉停留
    setTimeout(() => {
      hoverStage.value = null
    }, 120)
  })
}

function handleResize() {
  chart && chart.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart && chart.dispose()
})
</script>

<style scoped>
.funnel-container {
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart {
  width: 100%;
  height: 440px;
}

.funnel-popover {
  position: absolute;
  z-index: 10;
}

.funnel-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 12px 4px 4px;
  font-size: 13px;
  color: #606266;
  border-top: 1px dashed #ebeef5;
  margin-top: 14px;
}

.stage-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
</style>
