<template>
  <div class="dashboard">
    <header class="top-bar">
      <div class="left">
        <el-icon :size="22" color="#00d4ff"><Promotion /></el-icon>
        <span class="title">智慧工地 · 安全合规看板</span>
        <span class="sub">实时监控 · {{ formattedTime }}</span>
      </div>
      <div class="right">
        <div class="legend">
          <span class="dot green"></span>正常
          <span class="dot yellow"></span>轻度违规
          <span class="dot red"></span>严重违规
        </div>
        <el-button type="danger" plain size="small" @click="simulateSevere">
          <el-icon><Warning /></el-icon>
          模拟严重违规
        </el-button>
      </div>
    </header>

    <main class="main-grid">
      <section class="map-panel panel">
        <div class="panel-title">
          <el-icon color="#00d4ff"><LocationFilled /></el-icon>
          <span>工地平面图 · 工人实时定位</span>
          <span class="hint">SVG 1000 × 650</span>
        </div>
        <SiteMap
          :workers="workers"
          :zones="zones"
          @incident="onIncident"
          @severe="onSevere"
        />
      </section>

      <section class="side-panel panel">
        <div class="panel-title">
          <el-icon color="#00d4ff"><DataAnalysis /></el-icon>
          <span>各施工队违规次数排行</span>
          <span class="hint">ECharts</span>
        </div>
        <ViolationBarChart :teamData="teamViolations" />
        <div class="alarm-list">
          <div class="list-title">
            <el-icon><Bell /></el-icon>
            实时告警日志
          </div>
          <div class="list-body">
            <div
              v-for="log in alarmLogs.slice(0, 10)"
              :key="log.id"
              class="log-item"
              :class="'level-' + log.level"
            >
              <span class="time">{{ log.time }}</span>
              <span class="msg">{{ log.message }}</span>
            </div>
            <div v-if="!alarmLogs.length" class="empty">暂无告警</div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="severeMask.visible" class="severe-mask">
      <div class="severe-content">
        <div class="icon-box">
          <el-icon :size="120" color="#fff"><Warning /></el-icon>
        </div>
        <div class="big-title">严 重 警 告</div>
        <div class="sub-title">CRITICAL SAFETY VIOLATION</div>

        <div class="detail-card">
          <div class="row">
            <span class="label">违规人员</span>
            <span class="value">{{ severeMask.worker?.name }}（{{ severeMask.worker?.team }}）</span>
          </div>
          <div class="row">
            <span class="label">所在区域</span>
            <span class="value">「{{ severeMask.zone?.name }}」</span>
          </div>
          <div class="row">
            <span class="label">违规类型</span>
            <span class="value danger-text">未系安全带 / 未佩戴高处作业防护</span>
          </div>
          <div class="row">
            <span class="label">发生时间</span>
            <span class="value">{{ severeMask.time }}</span>
          </div>
          <div class="advice">
            <el-icon><InfoFilled /></el-icon>
            请现场安全员立即处置，确认工人佩戴齐全防护装备后再放行。
          </div>
        </div>

        <el-button type="danger" size="large" class="confirm-btn" @click="confirmSevere">
          <el-icon><CircleCheck /></el-icon>
          确 认 知 晓
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SiteMap from './components/SiteMap.vue'
import ViolationBarChart from './components/ViolationBarChart.vue'
import { dangerZones, initialWorkers, initialTeamViolations } from './data/mockData.js'

const zones = ref(dangerZones)
const workers = ref(JSON.parse(JSON.stringify(initialWorkers)))
const teamViolations = ref(JSON.parse(JSON.stringify(initialTeamViolations)))
const alarmLogs = ref([])

const severeMask = ref({
  visible: false,
  worker: null,
  zone: null,
  time: '',
  reason: ''
})

const now = ref(new Date())
let tickTimer = null

const formattedTime = computed(() => {
  const d = now.value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

function formatTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function addLog(level, message) {
  alarmLogs.value.unshift({
    id: 'l' + Date.now() + Math.random().toString(36).slice(2, 6),
    level,
    time: formatTime(),
    message
  })
  if (alarmLogs.value.length > 50) alarmLogs.value.length = 50
}

function onIncident({ worker, zone, reason }) {
  addLog('warn', `${worker.name}（${worker.team}）在「${zone.name}」${reason}`)
  const idx = teamViolations.value.findIndex((t) => t.team === worker.team)
  if (idx > -1) teamViolations.value[idx].count += 1
  teamViolations.value.sort((a, b) => b.count - a.count)
}

function onSevere({ worker, zone, reason }) {
  severeMask.value = {
    visible: true,
    worker: { ...worker },
    zone: { ...zone },
    time: formattedTime.value,
    reason
  }
  addLog('danger', `${worker.name}（${worker.team}）在「${zone.name}」${reason}`)
  const idx = teamViolations.value.findIndex((t) => t.team === worker.team)
  if (idx > -1) teamViolations.value[idx].count += 2
  teamViolations.value.sort((a, b) => b.count - a.count)
}

function confirmSevere() {
  severeMask.value.visible = false
}

function simulateSevere() {
  onSevere({
    worker: { id: 'sim', name: '模拟员', team: '一队' },
    zone: { id: 'highAltitude', name: '高空作业区' },
    reason: '未系安全带'
  })
}

function tickWorkers() {
  workers.value.forEach((w) => {
    const dx = (Math.random() - 0.5) * 20
    const dy = (Math.random() - 0.5) * 20
    w.x = Math.max(60, Math.min(940, w.x + dx))
    w.y = Math.max(60, Math.min(600, w.y + dy))
  })
}

onMounted(() => {
  tickTimer = setInterval(() => {
    now.value = new Date()
    tickWorkers()
  }, 1800)
  addLog('info', '系统启动，定位服务已就绪')
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})
</script>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(0, 212, 255, 0.12), transparent 60%),
    radial-gradient(900px 500px at 90% 110%, rgba(18, 230, 168, 0.12), transparent 60%),
    linear-gradient(180deg, #0a1220, #0b1420);
}

.top-bar {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--panel-border);
  background: rgba(8, 18, 32, 0.6);
}
.top-bar .left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.top-bar .title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #00d4ff, #12e6a8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.top-bar .sub {
  color: var(--text-dim);
  font-size: 12px;
  margin-left: 8px;
}
.top-bar .right {
  display: flex;
  align-items: center;
  gap: 18px;
}
.legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--text-dim);
}
.legend .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
.legend .green { background: #12e6a8; box-shadow: 0 0 8px #12e6a8; }
.legend .yellow { background: #ffc042; box-shadow: 0 0 8px #ffc042; }
.legend .red { background: #ff3b4a; box-shadow: 0 0 8px #ff3b4a; }

.main-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  padding: 16px;
  min-height: 0;
}

.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: 0 0 24px rgba(0, 212, 255, 0.08) inset;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(0, 212, 255, 0.2);
  margin-bottom: 10px;
}
.panel-title .hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-dim);
  font-weight: 400;
}

.map-panel {
  min-height: 0;
}

.side-panel {
  gap: 12px;
  min-height: 0;
}

.alarm-list {
  flex: 1;
  border: 1px solid rgba(255, 59, 74, 0.2);
  border-radius: 8px;
  background: rgba(255, 59, 74, 0.05);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.list-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #ffc9cf;
  border-bottom: 1px solid rgba(255, 59, 74, 0.2);
}
.list-body {
  padding: 6px 10px 10px;
  flex: 1;
  overflow: auto;
  min-height: 0;
}
.log-item {
  display: flex;
  gap: 10px;
  padding: 5px 4px;
  font-size: 12px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
}
.log-item .time { color: var(--text-dim); font-variant-numeric: tabular-nums; }
.log-item.level-warn .msg { color: #ffc042; }
.log-item.level-danger .msg { color: #ff6b79; font-weight: 600; }
.log-item.level-info .msg { color: #9fd9ff; }
.empty { color: var(--text-dim); text-align: center; padding: 20px 0; font-size: 12px; }

.severe-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(600px 300px at 50% 35%, rgba(255, 0, 24, 0.35), transparent 60%),
    repeating-linear-gradient(
      135deg,
      rgba(255, 0, 24, 0.35),
      rgba(255, 0, 24, 0.35) 20px,
      rgba(180, 0, 12, 0.85) 20px,
      rgba(180, 0, 12, 0.85) 40px
    );
  animation: mask-flash 1s ease-in-out infinite alternate;
  backdrop-filter: blur(4px);
}

@keyframes mask-flash {
  from { filter: brightness(1); }
  to { filter: brightness(1.25); }
}

.severe-content {
  width: min(560px, 86vw);
  padding: 34px 36px;
  background: linear-gradient(180deg, rgba(15, 2, 4, 0.92), rgba(60, 6, 12, 0.92));
  border: 2px solid #ff3b4a;
  border-radius: 16px;
  box-shadow: 0 0 60px rgba(255, 0, 24, 0.6), 0 0 0 6px rgba(255, 59, 74, 0.2);
  text-align: center;
  color: #fff;
  animation: severe-in 0.35s cubic-bezier(.2,.9,.3,1.3);
}

@keyframes severe-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, #ff3b4a 0%, #b3000c 70%);
  box-shadow: 0 0 40px rgba(255, 59, 74, 0.7), inset 0 0 30px rgba(0, 0, 0, 0.4);
  animation: pulse-icon 1.2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(255, 59, 74, 0.7), inset 0 0 30px rgba(0,0,0,0.4); }
  50% { transform: scale(1.06); box-shadow: 0 0 60px rgba(255, 59, 74, 0.9), inset 0 0 30px rgba(0,0,0,0.4); }
}

.big-title {
  font-size: 46px;
  font-weight: 900;
  letter-spacing: 12px;
  margin-top: 18px;
  text-shadow: 0 0 20px rgba(255, 59, 74, 0.9);
}
.sub-title {
  font-size: 14px;
  letter-spacing: 6px;
  color: #ffd3d6;
  margin-top: 4px;
}

.detail-card {
  margin-top: 22px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 14px 18px;
  text-align: left;
}
.detail-card .row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  font-size: 14px;
}
.detail-card .row:last-of-type { border-bottom: none; }
.detail-card .label { color: #ffb7bf; }
.detail-card .value { font-weight: 700; }
.danger-text { color: #ffb0b6; }
.advice {
  margin-top: 10px;
  padding: 8px 10px;
  background: rgba(255, 59, 74, 0.15);
  border-left: 3px solid #ff3b4a;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.6;
}

.confirm-btn {
  margin-top: 22px;
  width: 100%;
  height: 54px;
  font-size: 18px;
  letter-spacing: 8px;
  font-weight: 800;
  box-shadow: 0 10px 30px rgba(255, 59, 74, 0.45);
}
</style>
