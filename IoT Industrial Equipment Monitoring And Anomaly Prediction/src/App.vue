<template>
  <div class="dashboard-container">
    <!-- 顶部预测维护横幅 -->
    <transition name="banner">
      <div v-if="prediction.hasPrediction" class="predict-banner">
        <div class="banner-left">
          <span class="banner-icon">⚠️</span>
          <span>
            <b>{{ prediction.targetMachine?.name }}</b> 预测将在
            <b>{{ formatCountdown(prediction.remainSeconds) }}</b> 内出现故障，
            置信度 <b>{{ (prediction.confidence * 100).toFixed(0) }}%</b>，
            建议立即安排预防性维护！
          </span>
        </div>
        <div class="banner-right">
          <span class="countdown-box">故障倒计时: {{ formatCountdown(prediction.remainSeconds) }}</span>
          <el-button type="danger" size="small" @click="showDrawerFor(prediction.targetMachine?.id)">
            查看详情
          </el-button>
          <el-button size="small" text @click="dismissBanner">关闭</el-button>
        </div>
      </div>
    </transition>

    <!-- 标题栏 -->
    <div class="dashboard-header">
      <div class="header-title">🏭 工业设备监控与异常预测看板</div>
      <div class="header-info">
        <span><span class="status-dot normal"></span>正常设备: {{ statCounts.ok }}</span>
        <span><span class="status-dot warn"></span>预警设备: {{ statCounts.warn }}</span>
        <span><span class="status-dot error"></span>异常设备: {{ statCounts.error }}</span>
        <span>系统时间: {{ currentTime }}</span>
      </div>
    </div>

    <!-- 主体：左侧统计 + 中央拓扑图 -->
    <div class="dashboard-main">
      <!-- 左侧状态面板 -->
      <div class="stat-panel">
        <div class="stat-card">
          <h3>设备实时状态</h3>
          <div class="equipment-list">
            <div
              v-for="eq in equipmentList"
              :key="eq.id"
              class="equipment-item"
              :class="{ clickable: eq.type !== 'center' }"
              @click="eq.type !== 'center' && openDrawer(eq.id)"
            >
              <div class="equipment-name">
                <span
                  class="status-dot"
                  :class="readings[eq.id]?.status"
                ></span>
                {{ eq.name }}
              </div>
              <div class="equipment-value" :class="readings[eq.id]?.status">
                {{ readings[eq.id]?.temperature }}℃
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <h3>异常告警日志</h3>
          <div style="max-height:200px;overflow:auto">
            <div
              v-for="(log, idx) in alarmLogs.slice().reverse()"
              :key="idx"
              class="equipment-item"
              style="font-size:12px;line-height:1.6"
            >
              <div style="color:#f56c6c">● {{ log.device }}</div>
              <div style="color:#7a8a9e">{{ log.time }}</div>
              <div style="color:#e0e6ed;width:100%;margin-top:2px">{{ log.msg }}</div>
            </div>
            <div v-if="alarmLogs.length === 0" style="color:#7a8a9e;font-size:12px;padding:8px 0">
              暂无告警
            </div>
          </div>
        </div>

        <div class="stat-card">
          <h3>系统运行</h3>
          <div class="stat-number" style="color:#67c23a">{{ runDays }}</div>
          <div style="color:#7a8a9e;font-size:12px;margin-top:4px">连续运行天数</div>
          <div style="margin-top:12px;color:#7a8a9e;font-size:12px">
            数据刷新周期: 3 秒 / 次
          </div>
        </div>
      </div>

      <!-- 中央拓扑图 -->
      <div class="topology-wrapper">
        <div class="topology-title">
          <span>设备网络拓扑图 · 实时监测</span>
          <div class="topology-tips">
            <span class="tip-item"><span class="tip-dot ok"></span>正常</span>
            <span class="tip-item"><span class="tip-dot warn"></span>预警</span>
            <span class="tip-item"><span class="tip-dot error"></span>异常</span>
          </div>
        </div>
        <EquipmentTopology
          :equipment-list="equipmentList"
          :links="equipmentLinks"
          :readings="readings"
          @select-node="handleNodeClick"
        />
        <div style="position:absolute;bottom:10px;left:16px;color:#7a8a9e;font-size:11px">
          💡 提示：点击任意节点可查看该设备过去 24 小时的传感器趋势
        </div>
      </div>
    </div>

    <!-- 右侧抽屉：设备详情 -->
    <el-drawer
      v-model="drawerVisible"
      :title="selectedEquipment?.name + ' · 设备详情'"
      direction="rtl"
      size="640px"
      :with-header="true"
    >
      <template v-if="selectedEquipment">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">当前温度</div>
            <div class="info-value" :class="readings[selectedEquipment.id]?.status">
              {{ readings[selectedEquipment.id]?.temperature }} ℃
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">当前震动</div>
            <div class="info-value" :class="readings[selectedEquipment.id]?.status">
              {{ readings[selectedEquipment.id]?.vibration?.toFixed(2) }} mm/s
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">设备类型</div>
            <div class="info-value">{{ equipmentTypeName(selectedEquipment.type) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">运行状态</div>
            <div class="info-value" :class="readings[selectedEquipment.id]?.status">
              {{ statusText(readings[selectedEquipment.id]?.status) }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">温度警告阈值</div>
            <div class="info-value">{{ selectedEquipment.warningTemp }} ℃</div>
          </div>
          <div class="info-item">
            <div class="info-label">震动警告阈值</div>
            <div class="info-value">{{ selectedEquipment.warningVibration }} mm/s</div>
          </div>
        </div>

        <el-divider content-position="left">过去 24 小时趋势</el-divider>

        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="height:300px">
            <SensorChart
              title="温度曲线"
              unit="℃"
              :data="history.temperature"
              :warning-line="selectedEquipment.warningTemp"
              color="#f56c6c"
              :abnormal-ranges="history.abnormalRanges"
            />
          </div>
          <div style="height:300px">
            <SensorChart
              title="震动曲线"
              unit="mm/s"
              :data="history.vibration"
              :warning-line="selectedEquipment.warningVibration"
              color="#409eff"
              :abnormal-ranges="history.abnormalRanges"
            />
          </div>
        </div>

        <el-divider content-position="left">异常分析</el-divider>
        <el-alert
          v-if="readings[selectedEquipment.id]?.status === 'error'"
          :title="readings[selectedEquipment.id]?.anomalyMsg || '设备当前处于异常状态'"
          type="error"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else-if="readings[selectedEquipment.id]?.status === 'warn'"
          title="设备接近预警阈值，建议加强监测"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-alert v-else title="设备运行正常，各项指标在设计范围内" type="success" :closable="false" show-icon />

        <el-divider content-position="left">维护建议</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="下次例行检查">
            {{ addDays(7) }}
          </el-descriptions-item>
          <el-descriptions-item label="历史故障次数">
            {{ Math.floor(Math.random() * 5) + 1 }} 次
          </el-descriptions-item>
          <el-descriptions-item label="AI 预测">
            <span style="color:#f56c6c" v-if="prediction.hasPrediction && prediction.targetMachine?.id === selectedEquipment.id">
              ⚠️ 预测 {{ formatCountdown(prediction.remainSeconds) }} 内发生故障
            </span>
            <span v-else style="color:#67c23a">✓ 未来 2 小时内运行正常</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import EquipmentTopology from './components/EquipmentTopology.vue'
import SensorChart from './components/SensorChart.vue'
import {
  equipmentList,
  equipmentLinks,
  generate24HourHistory,
  getCurrentReadings,
  getPredictionResult
} from './mockData'

// 当前时间
const currentTime = ref(formatDateTime(new Date()))
const runDays = ref(Math.floor(Math.random() * 200) + 120)

// 实时读数
const readings = reactive({})
function refreshReadings() {
  equipmentList.forEach(eq => {
    readings[eq.id] = getCurrentReadings(eq)
  })
}

// 统计
const statCounts = computed(() => {
  let ok = 0, warn = 0, error = 0
  equipmentList.forEach(eq => {
    const s = readings[eq.id]?.status
    if (s === 'error') error++
    else if (s === 'warn') warn++
    else ok++
  })
  return { ok, warn, error }
})

// 告警日志
const alarmLogs = ref([])
watch(
  () => statCounts.value.error,
  (newVal, oldVal) => {
    if (newVal > (oldVal ?? 0)) {
      equipmentList.forEach(eq => {
        if (readings[eq.id]?.status === 'error') {
          const lastLog = alarmLogs.value[alarmLogs.value.length - 1]
          if (!lastLog || lastLog.device !== eq.name || Date.now() - lastLog.timestamp > 5000) {
            alarmLogs.value.push({
              device: eq.name,
              msg: readings[eq.id].anomalyMsg,
              time: formatDateTime(new Date()),
              timestamp: Date.now()
            })
            if (alarmLogs.value.length > 30) alarmLogs.value.shift()
          }
        }
      })
    }
  }
)

// 预测维护
const prediction = reactive({
  hasPrediction: false,
  targetMachine: null,
  predictMinutes: 0,
  confidence: 0,
  remainSeconds: 0
})
function refreshPrediction() {
  const r = getPredictionResult()
  if (r.hasPrediction) {
    prediction.hasPrediction = true
    prediction.targetMachine = r.targetMachine
    prediction.predictMinutes = r.predictMinutes
    prediction.confidence = r.confidence
    prediction.remainSeconds = r.predictMinutes * 60
  }
}
function dismissBanner() {
  prediction.hasPrediction = false
  ElMessage.info('已暂时隐藏预测维护提示')
}

// 右侧抽屉
const drawerVisible = ref(false)
const selectedEquipmentId = ref(null)
const selectedEquipment = computed(() =>
  equipmentList.find(e => e.id === selectedEquipmentId.value)
)
const history = reactive({ temperature: [], vibration: [], abnormalRanges: [] })

function openDrawer(id) {
  selectedEquipmentId.value = id
  const eq = selectedEquipment.value
  if (!eq) return
  const h = generate24HourHistory(eq)
  history.temperature = h.temperature
  history.vibration = h.vibration
  history.abnormalRanges = h.abnormalRanges
  drawerVisible.value = true
}

function handleNodeClick(id) {
  const eq = equipmentList.find(e => e.id === id)
  if (!eq || eq.type === 'center') {
    if (eq?.type === 'center') ElMessage.info('中央控制中心为汇总节点，点击设备查看详情')
    return
  }
  openDrawer(id)
}

function showDrawerFor(id) {
  if (id) openDrawer(id)
}

// 辅助函数
function formatDateTime(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function formatCountdown(secs) {
  if (!secs || secs <= 0) return '0 分 0 秒'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h} 小时 ${m % 60} 分`
  }
  return `${m} 分 ${String(s).padStart(2, '0')} 秒`
}
function equipmentTypeName(type) {
  return { cnc: '数控机台', press: '冲压设备', conveyor: '传送系统', robot: '焊接机器人', center: '控制中心' }[type] || type
}
function statusText(s) {
  return s === 'error' ? '⚠ 异常' : s === 'warn' ? '! 预警' : '✓ 正常'
}
function addDays(n) {
  const d = new Date(Date.now() + n * 86400000)
  return formatDateTime(d).slice(0, 10)
}

// 定时刷新
let refreshTimer = null
let countdownTimer = null
let clockTimer = null

onMounted(() => {
  refreshReadings()
  refreshPrediction()
  // 初始就强制至少一个设备进入异常，便于演示（不影响真实数据生成随机性）
  // 3 秒刷新一次实时读数
  refreshTimer = setInterval(refreshReadings, 3000)
  // 每 25 秒重新评估一次预测
  setInterval(refreshPrediction, 25000)
  // 倒计时
  countdownTimer = setInterval(() => {
    if (prediction.hasPrediction && prediction.remainSeconds > 0) {
      prediction.remainSeconds -= 1
    }
  }, 1000)
  // 时钟
  clockTimer = setInterval(() => {
    currentTime.value = formatDateTime(new Date())
  }, 1000)
})

onUnmounted(() => {
  clearInterval(refreshTimer)
  clearInterval(countdownTimer)
  clearInterval(clockTimer)
})
</script>

<style scoped>
.banner-enter-active, .banner-leave-active {
  transition: all 0.4s ease;
}
.banner-enter-from, .banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.equipment-item.clickable {
  cursor: pointer;
  transition: background 0.2s;
  padding: 8px 6px;
  border-radius: 4px;
}
.equipment-item.clickable:hover {
  background: rgba(64, 158, 255, 0.15);
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
</style>
