<template>
  <div class="funnel-panel">
    <div class="panel-head">
      <div>
        <h3>清关漏斗分析</h3>
        <p class="sub">基于 {{ packages.length }} 单跨境包裹数据</p>
      </div>
      <el-tag :type="funnelFilter ? 'warning' : 'info'" size="small" round>
        {{ funnelFilter ? `筛选: ${statusLabel(funnelFilter)}` : '全量展示' }}
      </el-tag>
    </div>

    <div class="charts">
      <div ref="funnelRef" class="chart"></div>
      <div ref="barRef" class="chart-small"></div>
    </div>

    <div class="summary">
      <div class="metric">
        <span class="metric-label">整体清关通过率</span>
        <span class="metric-value">{{ rate.passRate }}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">平均滞留时长</span>
        <span class="metric-value">{{ rate.avgStuck }} 小时</span>
      </div>
      <div class="metric">
        <span class="metric-label">扣留/失败单数</span>
        <span class="metric-value danger">{{ rate.detained + rate.failed }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  packages: { type: Array, required: true }
})
const emit = defineEmits(['hover-node'])

const funnelRef = ref(null)
const barRef = ref(null)
let funnelChart = null
let barChart = null

const funnelFilter = ref(null)

const funnelData = computed(() => {
  const total = props.packages.length
  const stuck = props.packages.filter((p) => p.status === 'clearance_stuck').length
  const detained = props.packages.filter((p) => p.status === 'detained').length
  const failed = props.packages.filter((p) => p.status === 'failed').length
  const passed = total - detained - failed
  return [
    { value: total, name: '进入海关', status: null, color: '#409EFF' },
    { value: passed + stuck, name: '材料受理', status: null, color: '#67C23A' },
    { value: passed, name: '清关通过', status: 'delivered', color: '#79c267' },
    { value: stuck, name: '滞留核查', status: 'clearance_stuck', color: '#E6A23C' },
    { value: detained + failed, name: '清关失败', status: 'failed', color: '#F56C6C' }
  ]
})

const rate = computed(() => {
  const list = props.packages
  const total = list.length
  const passed = list.filter((p) => p.status !== 'failed' && p.status !== 'detained').length
  const stuckHours = list
    .flatMap((p) => p.nodes.filter((n) => n.key === 'customs').map((n) => n.stuckHours || 0))
  const avg = stuckHours.length
    ? (stuckHours.reduce((a, b) => a + b, 0) / stuckHours.length).toFixed(1)
    : 0
  return {
    passRate: total ? ((passed / total) * 100).toFixed(1) : 0,
    avgStuck: avg,
    detained: list.filter((p) => p.status === 'detained').length,
    failed: list.filter((p) => p.status === 'failed').length
  }
})

const barSeries = computed(() => {
  return props.packages.map((p) => {
    const customsNode = p.nodes.find((n) => n.key === 'customs')
    return {
      name: p.id,
      value: customsNode?.stuckHours || 0,
      status: p.status
    }
  })
})

function statusLabel(key) {
  const map = {
    clearance_stuck: '清关滞留',
    detained: '海关扣留',
    failed: '清关失败',
    delivered: '已签收'
  }
  return map[key] || key
}

function initFunnel() {
  funnelChart = echarts.init(funnelRef.value)
  renderFunnel()
  funnelChart.on('mouseover', (params) => {
    const status = params.data?.status
    funnelFilter.value = status || null
    emit('hover-node', status || null)
  })
  funnelChart.on('mouseout', () => {
    funnelFilter.value = null
    emit('hover-node', null)
  })
}

function renderFunnel() {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const base = `<b>${p.name}</b><br/>单数: ${p.value}<br/>占比: ${p.percent}%`
        if (p.data?.status) {
          return base + `<br/><span style="color:#ffd591">鼠标悬停 → 左侧自动筛选</span>`
        }
        return base
      },
      backgroundColor: 'rgba(22,28,50,0.95)',
      borderColor: 'rgba(255,255,255,0.12)',
      textStyle: { color: '#e8ecf5' }
    },
    legend: { show: false },
    series: [
      {
        name: '清关漏斗',
        type: 'funnel',
        left: '8%',
        top: 10,
        bottom: 10,
        width: '84%',
        minSize: '20%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c} 单',
          color: '#fff',
          fontWeight: 600
        },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#0f1320',
          borderWidth: 2
        },
        emphasis: {
          label: { fontSize: 16, fontWeight: 700 }
        },
        data: funnelData.value.map((d) => ({
          value: d.value,
          name: d.name,
          status: d.status,
          itemStyle: { color: d.color }
        }))
      }
    ]
  }
  funnelChart.setOption(option)
}

function initBar() {
  barChart = echarts.init(barRef.value)
  renderBar()
}

function renderBar() {
  const colorMap = {
    in_transit: '#409EFF',
    clearance_stuck: '#E6A23C',
    detained: '#F56C6C',
    failed: '#909399',
    delivered: '#67C23A'
  }
  const option = {
    backgroundColor: 'transparent',
    grid: { left: 80, right: 20, top: 10, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(22,28,50,0.95)',
      borderColor: 'rgba(255,255,255,0.12)',
      textStyle: { color: '#e8ecf5' },
      formatter: (params) => {
        const p = params[0]
        return `<b>${p.name}</b><br/>海关滞留: ${p.value} 小时`
      }
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#8c97b0' }
    },
    yAxis: {
      type: 'category',
      data: barSeries.value.map((b) => b.name),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#a7b0c7', fontSize: 11 }
    },
    series: [
      {
        type: 'bar',
        data: barSeries.value.map((b) => ({
          value: b.value,
          itemStyle: { color: colorMap[b.status] || '#409EFF', borderRadius: [0, 6, 6, 0] }
        })),
        barWidth: 12
      }
    ]
  }
  barChart.setOption(option)
}

function handleResize() {
  funnelChart?.resize()
  barChart?.resize()
}

watch(() => props.packages, () => {
  renderFunnel()
  renderBar()
}, { deep: true })

onMounted(() => {
  initFunnel()
  initBar()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  funnelChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
.funnel-panel {
  background: linear-gradient(180deg, #161c32 0%, #141a2e 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.panel-head h3 {
  margin: 0;
  font-size: 17px;
  color: #e8ecf5;
}

.sub {
  margin: 4px 0 0;
  color: #8c97b0;
  font-size: 12px;
}

.charts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart {
  height: 300px;
}

.chart-small {
  height: 240px;
}

.summary {
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 12px;
  border-radius: 10px;
}

.metric-label {
  font-size: 12px;
  color: #8c97b0;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #67C23A;
}

.metric-value.danger {
  color: #F56C6C;
}
</style>
