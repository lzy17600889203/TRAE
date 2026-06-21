<template>
  <div class="dashboard">
    <!-- 顶部标题栏 -->
    <header class="dashboard-header">
      <div class="header-decor left"></div>
      <div class="header-title">
        <Lightning class="title-icon" />
        <span>电动车充电站调度监控大屏</span>
      </div>
      <div class="header-time">
        <span class="time-label">系统时间</span>
        <span class="time-value">{{ currentTime }}</span>
      </div>
      <div class="header-decor right"></div>
    </header>

    <!-- 顶部统计卡片 -->
    <section class="stat-row">
      <StatCard
        title="站点总数"
        :value="stations.length"
        unit="座"
        icon="Location"
        color="#4fc3f7"
      />
      <StatCard
        title="充电枪总数"
        :value="totalGuns"
        unit="把"
        icon="Lightning"
        color="#81c784"
      />
      <StatCard
        title="当前排队"
        :value="totalQueue"
        unit="辆"
        icon="Warning"
        color="#ff8a65"
      />
      <StatCard
        title="今日充电量"
        :value="totalKwh"
        unit="kWh"
        icon="DataAnalysis"
        color="#ba68c8"
      />
      <StatCard
        title="设备故障率"
        :value="avgFaultRate"
        unit="%"
        icon="Cpu"
        color="#ffb74d"
      />
      <StatCard
        title="离线设备"
        :value="offlineCount"
        unit="台"
        icon="CircleClose"
        color="#e57373"
      />
    </section>

    <main class="dashboard-main">
      <!-- 左侧：地图区 -->
      <section class="map-panel">
        <PanelHeader title="城市充电站分布地图" subtitle="实时状态 · 点击查看详情" />

        <!-- 地图 SVG 画布 -->
        <div class="map-canvas" ref="mapCanvas">
          <!-- 装饰性城市轮廓 -->
          <svg class="city-bg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stop-color="#1e3a5f" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#0b1a2d" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="roadGrad" x1="0%" x2="100%">
                <stop offset="0%" stop-color="#1e88e5" stop-opacity="0.1" />
                <stop offset="50%" stop-color="#1e88e5" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#1e88e5" stop-opacity="0.1" />
              </linearGradient>
            </defs>

            <circle cx="500" cy="350" r="420" fill="url(#glow)" />

            <!-- 城市区域多边形 -->
            <g fill="none" stroke="#2a6fa8" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7">
              <polygon points="180,180 420,140 560,220 620,380 500,520 280,500 160,360" />
              <polygon points="300,260 460,220 520,320 460,430 320,420" fill="#12304c" fill-opacity="0.5" />
              <polygon points="560,280 720,240 820,340 780,480 640,480" fill="#143650" fill-opacity="0.5" />
              <polygon points="200,400 380,420 420,560 240,580" fill="#12304c" fill-opacity="0.5" />
              <polygon points="640,180 820,200 880,300 760,280" fill="#113149" fill-opacity="0.5" />
            </g>

            <!-- 主路 -->
            <g stroke="url(#roadGrad)" stroke-width="3" fill="none" opacity="0.9">
              <path d="M 100 350 Q 350 280 500 360 T 900 300" />
              <path d="M 200 120 Q 380 300 500 400 T 820 620" />
              <path d="M 500 100 L 520 600" />
            </g>

            <!-- 河流 -->
            <path
              d="M 50 200 Q 300 260 520 220 T 980 260"
              stroke="#1565c0"
              stroke-width="6"
              fill="none"
              opacity="0.35"
            />

            <!-- 扫描雷达圈 -->
            <g fill="none" stroke="#4fc3f7" opacity="0.4">
              <circle cx="500" cy="350" r="180" stroke-dasharray="4 6" />
              <circle cx="500" cy="350" r="280" stroke-dasharray="2 8" opacity="0.25" />
              <circle cx="500" cy="350" r="380" stroke-dasharray="2 10" opacity="0.15" />
            </g>

            <line x1="80" y1="350" x2="920" y2="350" stroke="#1e88e5" stroke-width="1" opacity="0.15" />
            <line x1="500" y1="40" x2="500" y2="660" stroke="#1e88e5" stroke-width="1" opacity="0.15" />
          </svg>

          <!-- 充电站图标点 -->
          <div
            v-for="station in stations"
            :key="station.id"
            class="station-marker"
            :class="{
              'is-busy': isBusy(station),
              'is-warning': station.status === 'warning',
              'is-selected': selected && selected.id === station.id
            }"
            :style="{ left: station.x + 'px', top: station.y + 'px' }"
            @click="selectStation(station)"
          >
            <div class="marker-pulse" v-if="isBusy(station)"></div>
            <div class="marker-pulse delay" v-if="isBusy(station)"></div>

            <div class="marker-icon">
              <el-badge
                v-if="station.queue > 0"
                :value="'排队 ' + station.queue"
                class="marker-badge"
                :type="isBusy(station) ? 'danger' : 'warning'"
                :max="999"
              >
                <div class="icon-core">
                  <component :is="stationIcon(station)" />
                </div>
              </el-badge>
              <div v-else class="icon-core">
                <component :is="stationIcon(station)" />
              </div>
            </div>

            <el-tooltip
              effect="dark"
              placement="top"
              :show-after="150"
            >
              <template #content>
                <div class="tip">
                  <div class="tip-name">{{ station.name }}</div>
                  <div>空闲枪：{{ station.idle }}/{{ station.total }}</div>
                  <div v-if="station.queue > 0">排队车辆：{{ station.queue }} 辆</div>
                  <div>预计等待：{{ station.waitMinutes || 0 }} 分钟</div>
                  <div>额定功率：{{ station.power }}</div>
                </div>
              </template>
              <div class="marker-label">{{ station.name }}</div>
            </el-tooltip>
          </div>

          <!-- 右下角告警卡片 -->
          <div class="alarm-card" v-if="activeAlarm" :key="activeAlarm.id">
            <div class="alarm-strip"></div>
            <div class="alarm-body">
              <div class="alarm-icon">
                <CircleClose />
              </div>
              <div class="alarm-text">
                <div class="alarm-title">设备离线告警</div>
                <div class="alarm-content">
                  {{ activeAlarm.station }} · {{ activeAlarm.pile }}{{ activeAlarm.message }}
                </div>
                <div class="alarm-time">{{ activeAlarm.time }} · 等级：严重</div>
              </div>
              <el-button
                class="alarm-close"
                type="danger"
                plain
                size="small"
                round
                @click="dismissAlarm"
              >
                关闭
              </el-button>
            </div>
          </div>
        </div>

        <!-- 站点详情弹层 -->
        <Transition name="scale">
          <div v-if="selected" class="station-detail" :style="detailPosition">
            <div class="detail-header">
              <div class="detail-title">
                <Location class="loc-icon" />
                <span>{{ selected.name }}</span>
              </div>
              <el-button class="detail-close" circle size="small" @click="selected = null">
                <Close />
              </el-button>
            </div>

            <div class="detail-grid">
              <div class="detail-cell">
                <div class="cell-label">空闲枪</div>
                <div class="cell-value highlight">
                  {{ selected.idle }}<span class="unit">/{{ selected.total }}</span>
                </div>
              </div>
              <div class="detail-cell">
                <div class="cell-label">排队车辆</div>
                <div class="cell-value">{{ selected.queue }} 辆</div>
              </div>
              <div class="detail-cell">
                <div class="cell-label">预计等待</div>
                <div class="cell-value">{{ selected.waitMinutes }} 分钟</div>
              </div>
              <div class="detail-cell">
                <div class="cell-label">额定功率</div>
                <div class="cell-value">{{ selected.power }}</div>
              </div>
              <div class="detail-cell">
                <div class="cell-label">今日充电</div>
                <div class="cell-value">{{ selected.todayKwh }} kWh</div>
              </div>
              <div class="detail-cell">
                <div class="cell-label">故障率</div>
                <div class="cell-value">{{ selected.faultRate }}%</div>
              </div>
            </div>

            <div class="detail-actions">
              <el-button type="primary" size="default" round @click="handleNavigate">
                <LocationFilled />
                导航到此站
              </el-button>
              <el-button type="warning" plain size="default" round @click="handleReserve">
                <Tickets />
                预约充电
              </el-button>
            </div>
          </div>
        </Transition>
      </section>

      <!-- 右侧：图表区 -->
      <section class="chart-panel">
        <PanelHeader title="充电站运营数据分析" subtitle="ECharts 实时看板" />

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-left">
              <DataAnalysis class="chart-icon" /> 今日充电量
            </span>
            <span class="title-sub">单位：kWh</span>
          </div>
          <div ref="chartKwh" class="chart-box"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-left">
              <TrendCharts class="chart-icon" /> 设备故障率
            </span>
            <span class="title-sub">单位：%</span>
          </div>
          <div ref="chartFault" class="chart-box"></div>
        </div>

        <div class="chart-card alarm-list-card">
          <div class="chart-title">
            <span class="title-left">
              <Bell class="chart-icon" /> 实时告警流
            </span>
            <span class="title-sub">近 10 条</span>
          </div>
          <ul class="alarm-list">
            <li v-for="a in alarms" :key="a.id" class="alarm-item">
              <span class="dot"></span>
              <span class="al-time">{{ a.time }}</span>
              <span class="al-station">{{ a.station }}</span>
              <span class="al-pile">{{ a.pile }}</span>
              <span class="al-msg">{{ a.message }}</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  Location,
  LocationFilled,
  Lightning,
  Warning,
  DataAnalysis,
  Cpu,
  CircleClose,
  TrendCharts,
  Bell,
  Close,
  Tickets
} from '@element-plus/icons-vue'
import { stations as stationsRaw, alarmEvents } from './data/mockData.js'
import PanelHeader from './components/PanelHeader.vue'
import StatCard from './components/StatCard.vue'

const stations = ref(stationsRaw)
const alarms = ref([...alarmEvents])
const activeAlarm = ref(alarmEvents[0])
const selected = ref(null)
const detailPosition = ref({ left: '50%', top: '220px' })
const currentTime = ref('')

const chartKwh = ref(null)
const chartFault = ref(null)
const resizeObserverRef = ref(null)
let chart1 = null
let chart2 = null
let clockTimer = null
let alarmTimer = null

const totalGuns = computed(() => stations.value.reduce((s, x) => s + x.total, 0))
const totalQueue = computed(() => stations.value.reduce((s, x) => s + x.queue, 0))
const totalKwh = computed(() => stations.value.reduce((s, x) => s + x.todayKwh, 0))
const avgFaultRate = computed(
  () => (stations.value.reduce((s, x) => s + x.faultRate, 0) / stations.value.length).toFixed(1)
)
const offlineCount = computed(() => 2)

function isBusy(station) {
  return station.queue > 5
}

function stationIcon(station) {
  if (station.queue > 5) return markRaw(Warning)
  if (station.idle === 0) return markRaw(CircleClose)
  return markRaw(Lightning)
}

function selectStation(station) {
  selected.value = station
  const canvasWidth = 1000
  const px = station.x
  detailPosition.value = {
    left: px + 60 > canvasWidth - 320 ? px - 340 + 'px' : px + 60 + 'px',
    top: Math.max(40, station.y - 40) + 'px'
  }
}

function handleNavigate() {
  ElMessage.success(`正在为您导航至「${selected.value.name}」`)
}
function handleReserve() {
  ElMessage.info(`已在「${selected.value.name}」发起预约`)
}
function dismissAlarm() {
  const idx = alarms.value.indexOf(activeAlarm.value)
  alarms.value = alarms.value.filter((a) => a.id !== activeAlarm.value.id)
  if (alarms.value.length > 0) {
    activeAlarm.value = alarms.value[(idx + 1) % alarms.value.length]
  } else {
    activeAlarm.value = null
  }
}

function updateClock() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  currentTime.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function initKwhChart() {
  if (!chartKwh.value) return
  chart1 = echarts.init(chartKwh.value)
  const names = stations.value.map((s) => s.name)
  const data = stations.value.map((s) => s.todayKwh)
  const max = Math.max.apply(null, data)
  chart1.setOption({
    backgroundColor: 'transparent',
    grid: { left: 96, right: 64, top: 24, bottom: 16, containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(79,195,247,0.12)' } },
      backgroundColor: 'rgba(10,30,52,0.95)',
      borderColor: '#1e88e5',
      textStyle: { color: '#e6f1ff' },
      valueFormatter: (v) => `${v} kWh`
    },
    xAxis: {
      type: 'value',
      max: Math.ceil((max * 1.15) / 100) * 100,
      axisLine: { lineStyle: { color: '#2a6fa8' } },
      splitLine: { lineStyle: { color: 'rgba(42,111,168,0.2)', type: 'dashed' } },
      axisLabel: {
        color: '#8ab4d8',
        fontSize: 11,
        formatter: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)
      }
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true,
      axisLine: { lineStyle: { color: '#2a6fa8' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#c7e0ff',
        fontSize: 12,
        margin: 12,
        width: 82,
        overflow: 'truncate',
        ellipsis: '…'
      }
    },
    series: [
      {
        name: '今日充电量',
        type: 'bar',
        data,
        barWidth: 12,
        barGap: 0,
        barCategoryGap: '40%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1e88e5' },
            { offset: 1, color: '#4fc3f7' }
          ])
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#4fc3f7' },
              { offset: 1, color: '#b3e5fc' }
            ])
          }
        },
        label: {
          show: true,
          position: 'right',
          color: '#e6f1ff',
          fontSize: 11,
          fontWeight: 500
        }
      }
    ]
  })
}

function initFaultChart() {
  if (!chartFault.value) return
  chart2 = echarts.init(chartFault.value)
  const names = stations.value.map((s) => s.name)
  const values = stations.value.map((s) => s.faultRate)
  const data = stations.value.map((s) => ({
    value: s.faultRate,
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
      color:
        s.faultRate > 5
          ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ef5350' },
              { offset: 1, color: '#b71c1c' }
            ])
          : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ffb74d' },
              { offset: 1, color: '#f57c00' }
            ])
    }
  }))
  chart2.setOption({
    backgroundColor: 'transparent',
    grid: { left: 48, right: 24, top: 32, bottom: 64, containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(239,83,80,0.12)' } },
      backgroundColor: 'rgba(10,30,52,0.95)',
      borderColor: '#ef5350',
      textStyle: { color: '#e6f1ff' },
      formatter: (p) => `${p[0].name}<br/>故障率：${p[0].value}%`
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#2a6fa8' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#c7e0ff',
        fontSize: 11,
        margin: 10,
        hideOverlap: true,
        interval: 0,
        rotate: 28,
        width: 68,
        overflow: 'truncate',
        ellipsis: '…'
      }
    },
    yAxis: {
      type: 'value',
      max: Math.max(10, Math.ceil((Math.max.apply(null, values) * 1.3))),
      axisLine: { lineStyle: { color: '#2a6fa8' } },
      splitLine: { lineStyle: { color: 'rgba(42,111,168,0.2)', type: 'dashed' } },
      axisLabel: { color: '#8ab4d8', fontSize: 11, formatter: '{value}%' }
    },
    series: [
      {
        name: '故障率',
        type: 'bar',
        data,
        barWidth: 20,
        barCategoryGap: '45%',
        label: {
          show: true,
          position: 'top',
          color: '#ffd54f',
          fontSize: 11,
          fontWeight: 500,
          formatter: '{c}%'
        }
      }
    ]
  })
}

function handleResize() {
  chart1 && chart1.resize()
  chart2 && chart2.resize()
}

onMounted(async () => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)

  alarmTimer = setInterval(() => {
    if (alarms.value.length === 0) return
    const currentIdx = alarms.value.findIndex((a) => a.id === activeAlarm.value?.id)
    activeAlarm.value = alarms.value[(currentIdx + 1) % alarms.value.length]
  }, 6000)

  await nextTick()
  // 用 rAF 等待一帧，避免 DOM 尺寸未就绪造成图表被压缩
  requestAnimationFrame(() => {
    try {
      initKwhChart()
      initFaultChart()
      // ResizeObserver 精准监测每个图表容器尺寸变化
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => handleResize())
        if (chartKwh.value) ro.observe(chartKwh.value)
        if (chartFault.value) ro.observe(chartFault.value)
        resizeObserverRef.value = ro
      } else {
        window.addEventListener('resize', handleResize)
      }
    } catch (err) {
      console.error('图表初始化失败：', err)
    }
  })
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
  clearInterval(alarmTimer)
  if (resizeObserverRef.value) {
    resizeObserverRef.value.disconnect()
    resizeObserverRef.value = null
  } else {
    window.removeEventListener('resize', handleResize)
  }
  chart1 && chart1.dispose()
  chart2 && chart2.dispose()
})
</script>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  background:
    radial-gradient(circle at 20% 10%, #102847 0%, transparent 45%),
    radial-gradient(circle at 85% 80%, #0d213d 0%, transparent 45%),
    linear-gradient(180deg, #0b1a2d 0%, #071322 100%);
  display: flex;
  flex-direction: column;
  padding: 14px 22px 18px;
  position: relative;
  overflow: hidden;
}

/* 顶部标题 */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 58px;
  position: relative;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(180deg, #ffffff 20%, #64b5f6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 18px rgba(79, 195, 247, 0.25);
}
.title-icon {
  color: #4fc3f7;
  font-size: 30px;
}
.header-decor {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1e88e5, transparent);
  position: relative;
}
.header-decor.left {
  margin-right: 40px;
}
.header-decor.right {
  margin-left: 40px;
}
.header-time {
  color: #8ab4d8;
  font-size: 14px;
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.time-value {
  color: #4fc3f7;
  font-family: 'Consolas', monospace;
  font-size: 18px;
  letter-spacing: 2px;
}

/* 统计卡片 */
.stat-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin: 12px 0;
}
.stat-card {
  position: relative;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(30, 136, 229, 0.15), rgba(13, 33, 61, 0.6));
  border: 1px solid rgba(79, 195, 247, 0.25);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 14px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(79, 195, 247, 0.08);
}
.stat-bg-line {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, #4fc3f7, transparent);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border: 1px solid currentColor;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
}
.stat-title {
  color: #8ab4d8;
  font-size: 13px;
  margin-bottom: 4px;
}
.stat-value .num {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Consolas', monospace;
  letter-spacing: 1px;
}
.stat-value .unit {
  margin-left: 6px;
  color: #8ab4d8;
  font-size: 13px;
}

/* 主体区域 */
.dashboard-main {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 520px;
  gap: 18px;
  min-height: 0;
}

.map-panel,
.chart-panel {
  position: relative;
  background: linear-gradient(180deg, rgba(20, 50, 84, 0.55), rgba(10, 26, 45, 0.6));
  border: 1px solid rgba(79, 195, 247, 0.25);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(30, 136, 229, 0.08);
}

.map-panel::before,
.map-panel::after,
.chart-panel::before,
.chart-panel::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: #4fc3f7;
  border-style: solid;
  pointer-events: none;
}
.map-panel::before {
  top: 0;
  left: 0;
  border-width: 2px 0 0 2px;
}
.map-panel::after {
  top: 0;
  right: 0;
  border-width: 2px 2px 0 0;
}
.chart-panel::before {
  bottom: 0;
  left: 0;
  border-width: 0 0 2px 2px;
}
.chart-panel::after {
  bottom: 0;
  right: 0;
  border-width: 0 2px 2px 0;
}

/* 面板头部 */
.panel-header {
  padding: 14px 18px 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(79, 195, 247, 0.15);
}
.panel-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.title-bar {
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #4fc3f7, #1e88e5);
  border-radius: 2px;
}
.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #e6f1ff;
  letter-spacing: 1px;
}
.title-sub {
  color: #8ab4d8;
  font-size: 12px;
}
.panel-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(79, 195, 247, 0.5), transparent);
}

/* 地图 */
.map-canvas {
  flex: 1;
  position: relative;
  min-height: 0;
  margin: 10px;
  border-radius: 6px;
  background:
    radial-gradient(circle at 50% 50%, rgba(30, 136, 229, 0.08), transparent 70%),
    linear-gradient(180deg, #0a1d33, #071524);
  overflow: hidden;
}
.city-bg {
  width: 100%;
  height: 100%;
  display: block;
}

.station-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
}
.marker-pulse {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #ef5350;
  animation: pulse 1.6s ease-out infinite;
  z-index: 0;
}
.marker-pulse.delay {
  animation-delay: 0.8s;
}
@keyframes pulse {
  0% {
    transform: translateX(-50%) scale(0.6);
    opacity: 0.8;
  }
  100% {
    transform: translateX(-50%) scale(2.2);
    opacity: 0;
  }
}

.marker-icon {
  position: relative;
  z-index: 2;
}
.icon-core {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle, #4fc3f7 0%, #1565c0 100%);
  border: 2px solid #bbdefb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 14px rgba(79, 195, 247, 0.7);
  font-size: 16px;
  transition: transform 0.2s;
}
.station-marker:hover .icon-core {
  transform: scale(1.12);
}
.station-marker.is-busy .icon-core {
  background: radial-gradient(circle, #ef5350 0%, #b71c1c 100%);
  border-color: #ffcdd2;
  box-shadow: 0 0 16px rgba(239, 83, 80, 0.8);
}
.station-marker.is-warning .icon-core {
  background: radial-gradient(circle, #ffb74d 0%, #ef6c00 100%);
  border-color: #ffe0b2;
  box-shadow: 0 0 14px rgba(255, 183, 77, 0.7);
}
.station-marker.is-selected .icon-core {
  transform: scale(1.18);
  box-shadow: 0 0 22px rgba(255, 255, 255, 0.8);
}

.marker-label {
  margin-top: 6px;
  font-size: 12px;
  color: #c7e0ff;
  background: rgba(11, 26, 45, 0.75);
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid rgba(79, 195, 247, 0.3);
  white-space: nowrap;
}
.marker-badge {
  :deep(.el-badge__content) {
    padding: 2px 8px;
    height: auto;
    font-size: 11px;
    border-radius: 10px;
    top: 2px;
    right: 2px;
    white-space: nowrap;
    box-shadow: 0 0 8px currentColor;
  }
}

.tip {
  line-height: 1.8;
  font-size: 12px;
  min-width: 180px;
}
.tip-name {
  color: #4fc3f7;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

/* 告警卡片 */
.alarm-card {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 340px;
  background: linear-gradient(135deg, rgba(239, 83, 80, 0.95), rgba(183, 28, 28, 0.9));
  border: 1px solid #ef5350;
  border-radius: 6px;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 6px 30px rgba(239, 83, 80, 0.45);
  animation: slideIn 0.4s ease-out;
  z-index: 10;
}
.alarm-strip {
  height: 4px;
  background: linear-gradient(90deg, #ffeb3b, #ef5350, #ffeb3b);
  animation: strip 1.2s linear infinite;
  background-size: 200% 100%;
}
@keyframes strip {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.alarm-body {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.alarm-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  animation: shake 0.8s ease-in-out infinite;
}
@keyframes shake {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}
.alarm-text {
  flex: 1;
  min-width: 0;
}
.alarm-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.alarm-content {
  font-size: 13px;
  line-height: 1.5;
}
.alarm-time {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 4px;
  font-family: 'Consolas', monospace;
}
.alarm-close {
  flex-shrink: 0;
}

/* 站点详情 */
.station-detail {
  position: absolute;
  width: 320px;
  background: linear-gradient(180deg, rgba(15, 40, 70, 0.98), rgba(10, 26, 45, 0.98));
  border: 1px solid #4fc3f7;
  border-radius: 6px;
  box-shadow: 0 10px 40px rgba(79, 195, 247, 0.25);
  z-index: 8;
  padding: 16px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(79, 195, 247, 0.2);
  margin-bottom: 12px;
}
.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #e6f1ff;
}
.loc-icon {
  color: #4fc3f7;
}
.detail-close {
  background: rgba(239, 83, 80, 0.15);
  border-color: rgba(239, 83, 80, 0.3);
  color: #ef5350;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
.detail-cell {
  background: rgba(79, 195, 247, 0.08);
  border: 1px solid rgba(79, 195, 247, 0.15);
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}
.cell-label {
  font-size: 11px;
  color: #8ab4d8;
  margin-bottom: 4px;
}
.cell-value {
  font-size: 15px;
  color: #e6f1ff;
  font-family: 'Consolas', monospace;
  font-weight: 600;
}
.cell-value.highlight {
  color: #81c784;
  font-size: 18px;
}
.cell-value .unit {
  color: #8ab4d8;
  font-size: 12px;
  font-weight: 400;
}
.detail-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.25s ease;
}
.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

/* 右侧图表 */
.chart-panel {
  padding: 0;
  gap: 0;
  overflow-y: auto;
}
.chart-panel::-webkit-scrollbar {
  width: 6px;
}
.chart-panel::-webkit-scrollbar-thumb {
  background: rgba(79, 195, 247, 0.3);
  border-radius: 3px;
}
.chart-card {
  padding: 16px 20px 12px;
  border-bottom: 1px dashed rgba(79, 195, 247, 0.15);
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
}
.chart-card:last-child {
  border-bottom: none;
}
.chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #c7e0ff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.chart-title .title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chart-title .title-sub {
  color: #8ab4d8;
  font-size: 12px;
  font-weight: 400;
}
.chart-icon {
  color: #4fc3f7;
}
.chart-box {
  width: 100%;
  height: 260px;
}
.alarm-list-card {
  flex: 0 0 auto;
}
.alarm-list {
  list-style: none;
  max-height: 180px;
  overflow-y: auto;
  font-size: 12px;
}
.alarm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: rgba(239, 83, 80, 0.08);
  border-left: 3px solid #ef5350;
  border-radius: 3px;
  color: #e6f1ff;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef5350;
  box-shadow: 0 0 6px #ef5350;
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
.al-time {
  color: #8ab4d8;
  font-family: 'Consolas', monospace;
  min-width: 64px;
}
.al-station {
  color: #4fc3f7;
  font-weight: 600;
}
.al-pile {
  color: #ffb74d;
}
.al-msg {
  color: #ef5350;
  font-weight: 600;
}
</style>
