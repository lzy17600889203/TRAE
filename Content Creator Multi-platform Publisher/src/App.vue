<template>
  <div class="app-container">
    <header class="app-header">
      <h1>
        <el-icon style="vertical-align: middle; margin-right: 8px;"><Share /></el-icon>
        自媒体多平台发布与数据聚合台
      </h1>
      <p>一次撰写，全网分发；实时聚合各大平台阅读量趋势。</p>
    </header>

    <div class="main-grid">
      <div class="left-col">
        <section class="editor-card">
          <h3 class="card-title">
            <el-icon class="title-icon"><EditPen /></el-icon>
            内容编辑
          </h3>
          <div class="editor-wrapper">
            <Toolbar
              class="editor-toolbar"
              :editor="editorRef"
              :default-config="toolbarConfig"
              mode="default"
            />
            <Editor
              class="editor-content"
              v-model="valueHtml"
              :default-config="editorConfig"
              mode="default"
              @onCreated="handleCreated"
            />
          </div>

          <h3 class="card-title">
            <el-icon class="title-icon"><Platform /></el-icon>
            选择分发平台
          </h3>
          <div class="platforms-list">
            <div
              v-for="(p, idx) in platformsList"
              :key="p.key"
              class="platform-item"
              :class="{
                'is-selected': selectedPlatforms.has(p.key),
                'is-disabled': !selectedPlatforms.has(p.key) && publishing,
                'is-publishing': platformStatus[p.key] === 'publishing',
                'is-success': platformStatus[p.key] === 'success',
                'is-failed': platformStatus[p.key] === 'failed'
              }"
              @click="togglePlatform(p.key)"
            >
              <div class="platform-icon" :style="{ background: p.color }">
                {{ p.letter }}
              </div>
              <div class="platform-name">{{ p.short }}</div>
              <div class="platform-status">{{ getStatusText(p.key) }}</div>

              <div v-if="platformStatus[p.key] === 'failed'" class="fail-bubble">
                <span>发布失败</span>
                <button @click.stop="retryPlatform(p.key)">重试</button>
                <button @click.stop="ignorePlatform(p.key)">忽略</button>
              </div>
            </div>
          </div>

          <div class="action-bar">
            <div class="summary-text">
              已选择 <span class="hl">{{ selectedPlatforms.size }}</span> 个平台 ·
              成功 <span class="hl" style="color:#67c23a;">{{ successCount }}</span> ·
              失败 <span class="hl" style="color:#f56c6c;">{{ failCount }}</span>
            </div>
            <div style="display:flex; gap:12px; align-items:center;">
              <el-button @click="resetAll">清空状态</el-button>
              <el-button
                type="primary"
                size="large"
                :disabled="publishing || selectedPlatforms.size === 0"
                @click="startPublish"
              >
                <el-icon style="margin-right:6px;"><Promotion /></el-icon>
                一键分发
              </el-button>
            </div>
          </div>
          <div v-if="publishing" class="progress-track">
            <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </section>
      </div>

      <aside class="dashboard-card">
        <h3 class="card-title">
          <el-icon class="title-icon"><DataAnalysis /></el-icon>
          数据聚合面板
        </h3>
        <p style="margin:0 0 12px; font-size:13px; color:#909399;">
          近 7 天各平台阅读量趋势（悬停节点查看当日各平台柱状图）
        </p>
        <div ref="chartRef" class="chart-container"></div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">全网总阅读量</div>
            <div class="stat-value">{{ totalViews.toLocaleString() }}</div>
            <div class="stat-trend up">↑ 较上周 +18.4%</div>
          </div>
          <div class="stat-item" style="border-left-color:#FE2C55;">
            <div class="stat-label">最高单日</div>
            <div class="stat-value">{{ peakViews.toLocaleString() }}</div>
            <div class="stat-trend up">↑ 06-19 抖音</div>
          </div>
          <div class="stat-item" style="border-left-color:#07C160;">
            <div class="stat-label">活跃平台</div>
            <div class="stat-value">{{ activePlatformCount }} 个</div>
            <div class="stat-trend up">稳定增长</div>
          </div>
          <div class="stat-item" style="border-left-color:#0084FF;">
            <div class="stat-label">分发成功率</div>
            <div class="stat-value">{{ successRate }}%</div>
            <div class="stat-trend" :class="successRate >= 80 ? 'up' : 'down'">
              {{ successRate >= 80 ? '健康' : '需关注' }}
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef, h } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { platforms, dashboardTrend } from './data/platforms.js'

const platformsList = platforms

const editorRef = shallowRef()
const valueHtml = ref(
  '<h2>欢迎使用多平台发布台 ✨</h2>' +
  '<p>在这里撰写你的内容，然后一键分发到微信公众号、小红书、知乎等多个平台。</p>' +
  '<p><b>使用提示：</b>先在下方勾选需要发布的平台，然后点击「一键分发」即可。</p>' +
  '<ul><li>支持富文本、图片、列表</li><li>多米诺骨牌动画展示分发状态</li><li>失败平台可一键「重试」或「忽略」</li></ul>'
)

const toolbarConfig = { excludeKeys: [] }
const editorConfig = { placeholder: '请输入文章内容…' }

const handleCreated = (editor) => {
  editorRef.value = editor
}

const selectedPlatforms = ref(new Set(platforms.map((p) => p.key)))
const platformStatus = reactive({})

const publishing = ref(false)
const publishQueue = ref([])
const completedCount = ref(0)

const progressPercent = computed(() => {
  if (!publishing.value) return 0
  const total = publishQueue.value.length || 1
  return Math.round((completedCount.value / total) * 100)
})

const successCount = computed(
  () => Object.values(platformStatus).filter((s) => s === 'success').length
)
const failCount = computed(
  () => Object.values(platformStatus).filter((s) => s === 'failed').length
)

const togglePlatform = (key) => {
  if (publishing.value) return
  const next = new Set(selectedPlatforms.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selectedPlatforms.value = next
}

const getStatusText = (key) => {
  const s = platformStatus[key]
  const name = platformsList.find((p) => p.key === key)?.short || key
  if (s === 'publishing') return `正在同步至${name}…`
  if (s === 'success') return '发布成功 ✓'
  if (s === 'failed') return '发布失败 ✗'
  if (s === 'ignored') return '已忽略'
  return selectedPlatforms.value.has(key) ? '待发布' : '未选择'
}

const mockPublishCall = (key) => {
  return new Promise((resolve, reject) => {
    const delay = 900 + Math.random() * 1600
    setTimeout(() => {
      const roll = Math.random()
      if (roll < 0.2) reject(new Error(`${key} API 调用失败`))
      else resolve({ ok: true, key })
    }, delay)
  })
}

const startPublish = async () => {
  if (publishing.value) return
  if (selectedPlatforms.value.size === 0) {
    ElMessage.warning('请至少选择一个平台')
    return
  }
  publishing.value = true
  publishQueue.value = platformsList.filter((p) => selectedPlatforms.value.has(p.key))
  completedCount.value = 0

  for (const p of publishQueue.value) {
    if (platformStatus[p.key] === 'ignored') {
      completedCount.value += 1
      continue
    }
    platformStatus[p.key] = 'publishing'
    try {
      await mockPublishCall(p.key)
      platformStatus[p.key] = 'success'
    } catch (err) {
      platformStatus[p.key] = 'failed'
    }
    completedCount.value += 1
  }

  publishing.value = false
  ElMessage.success('分发任务已完成')
}

const retryPlatform = async (key) => {
  platformStatus[key] = 'publishing'
  try {
    await mockPublishCall(key)
    platformStatus[key] = 'success'
    ElMessage.success(`${platformsList.find((p) => p.key === key)?.short} 重试成功`)
  } catch {
    platformStatus[key] = 'failed'
    ElMessage.error('重试失败，请稍后再试')
  }
}

const ignorePlatform = (key) => {
  platformStatus[key] = 'ignored'
}

const resetAll = () => {
  if (publishing.value) {
    ElMessage.warning('正在分发中，请等待完成')
    return
  }
  Object.keys(platformStatus).forEach((k) => delete platformStatus[k])
  completedCount.value = 0
  ElMessage.info('状态已清空')
}

const totalViews = computed(() => {
  return Object.values(dashboardTrend.series).reduce(
    (sum, arr) => sum + arr.reduce((a, b) => a + b, 0),
    0
  )
})

const peakViews = computed(() => {
  let peak = 0
  Object.values(dashboardTrend.series).forEach((arr) => {
    arr.forEach((v) => {
      if (v > peak) peak = v
    })
  })
  return peak
})

const activePlatformCount = computed(() => {
  return Object.values(dashboardTrend.series).filter((arr) => arr.some((v) => v > 0)).length
})

const successRate = computed(() => {
  const total = successCount.value + failCount.value
  if (total === 0) return 100
  return Math.round((successCount.value / total) * 100)
})

let chartInstance = null
const chartRef = ref(null)

const renderChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const legendData = platformsList.map((p) => p.short)
  const series = platformsList.map((p) => ({
    name: p.short,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    showSymbol: false,
    emphasis: { focus: 'series', scale: 1.6 },
    lineStyle: { width: 2.2 },
    itemStyle: { color: p.color },
    data: dashboardTrend.series[p.key] || []
  }))

  const option = {
    color: platformsList.map((p) => p.color),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#ebeef5',
      borderWidth: 1,
      textStyle: { color: '#303133' },
      extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.12); border-radius:8px;',
      formatter: (params) => {
        const date = dashboardTrend.dates[params.dataIndex]
        const bars = platformsList
          .map((p) => {
            const val = dashboardTrend.series[p.key][params.dataIndex]
            const max = Math.max(...platformsList.map((pp) => dashboardTrend.series[pp.key][params.dataIndex]))
            const w = max ? Math.round((val / max) * 120) : 0
            return `
              <div style="display:flex;align-items:center;gap:8px;margin:4px 0;font-size:12px;">
                <span style="width:48px;color:#606266;">${p.short}</span>
                <div style="flex:1;background:#f0f2f5;border-radius:4px;overflow:hidden;height:10px;min-width:160px;">
                  <div style="width:${w}px;height:100%;background:${p.color};transition:width .3s;"></div>
                </div>
                <span style="width:56px;text-align:right;font-weight:600;color:#303133;">${val.toLocaleString()}</span>
              </div>
            `
          })
          .join('')
        return `
          <div style="padding:4px 2px;min-width:260px;">
            <div style="font-weight:600;margin-bottom:6px;color:#303133;">${date} 各平台阅读量</div>
            ${bars}
          </div>
        `
      }
    },
    legend: {
      data: legendData,
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 12, color: '#606266' },
      type: 'scroll'
    },
    grid: { left: 48, right: 16, top: 24, bottom: 56 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dashboardTrend.dates,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    series
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance && chartInstance.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>
