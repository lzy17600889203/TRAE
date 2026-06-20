<template>
  <div class="app-container">
    <div class="header">
      <h1>🏥 急诊科床位实时调度系统</h1>
      <div class="subtitle">
        实时监测拥挤度 · 拖拽分配床位 · 体征波形监测
        <span style="margin-left:14px;color:#409eff">当前时间：{{ nowTime }}</span>
      </div>
    </div>

    <!-- 热力图 -->
    <div class="panel">
      <div class="panel-title">
        <TrendCharts /> 急诊大厅拥挤热力图
      </div>
      <div class="section-subtitle">
        每 4 秒自动刷新一次各区域占用情况；超过 80% 时触发紧急呼叫。
      </div>
      <div class="stat-bar">
        <div class="stat-item">
          <span class="label">总床位</span>
          <span class="value">{{ totalBeds }}</span>
        </div>
        <div class="stat-item">
          <span class="label">已占用</span>
          <span class="value warn">{{ occupiedBeds }}</span>
        </div>
        <div class="stat-item">
          <span class="label">空闲</span>
          <span class="value">{{ freeBeds }}</span>
        </div>
        <div class="stat-item">
          <span class="label">候诊患者</span>
          <span class="value" :class="{ danger: waitingPatients.length > 3 }">{{ waitingPatients.length }}</span>
        </div>
      </div>
      <HeatMap @crowded="handleCrowded" />
    </div>

    <!-- 床位调度 -->
    <div class="panel">
      <div class="panel-title">
        <FirstAidKit /> 床位分配与体征监测
      </div>
      <div class="section-subtitle">
        将左侧候诊卡片<b style="color:#409eff">拖拽</b>到右侧空闲床位，即可完成分配；床位状态会平滑过渡并展示患者心率等关键体征。
      </div>

      <div class="bed-layout">
        <!-- 候诊队列 -->
        <div class="patient-queue">
          <div style="font-size:15px;font-weight:600;color:#1a3a5c;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
            <span><UserFilled /> 候诊队列</span>
            <el-tag size="small" type="danger" effect="plain">共 {{ waitingPatients.length }} 人</el-tag>
          </div>
          <div class="queue-list">
            <PatientCard
              v-for="p in waitingPatients"
              :key="p.id"
              :patient="p"
            />
            <div v-if="!waitingPatients.length" style="text-align:center;color:#909399;padding:30px 0">
              🎉 暂无候诊患者
            </div>
          </div>
        </div>

        <!-- 床位列表 -->
        <div class="bed-area">
          <div style="margin-bottom:10px">
            <el-radio-group v-model="filterZone" size="default">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button
                v-for="z in zones"
                :key="z.id"
                :value="z.id"
              >{{ z.name }}</el-radio-button>
            </el-radio-group>
          </div>
          <div class="bed-grid">
            <BedCard
              v-for="b in filteredBeds"
              :key="b.id"
              :bed="b"
              @assign="handleAssign"
              @release="handleRelease"
            />
          </div>
        </div>
      </div>
    </div>

    <EmergencyDialog :crowded-zones="crowdedZones" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, FirstAidKit, UserFilled } from '@element-plus/icons-vue'
import HeatMap from './HeatMap.vue'
import BedCard from './BedCard.vue'
import PatientCard from './PatientCard.vue'
import EmergencyDialog from './EmergencyDialog.vue'
import {
  zones,
  beds,
  waitingPatients,
  crowdedZones,
  assignPatientToBed,
  releaseBed,
  updateHeartWave,
  syncZoneOccupancy
} from './store.js'

const nowTime = ref(new Date().toLocaleString('zh-CN', { hour12: false }))
const filterZone = ref('all')

const totalBeds = computed(() => beds.value.length)
const occupiedBeds = computed(() => beds.value.filter(b => b.patient).length)
const freeBeds = computed(() => totalBeds.value - occupiedBeds.value)

const filteredBeds = computed(() => {
  if (filterZone.value === 'all') return beds.value
  return beds.value.filter(b => b.zoneId === filterZone.value)
})

let clockTimer = null
let waveTimer = null

onMounted(() => {
  clockTimer = setInterval(() => {
    nowTime.value = new Date().toLocaleString('zh-CN', { hour12: false })
  }, 1000)
  waveTimer = setInterval(() => {
    beds.value.forEach(updateHeartWave)
  }, 700)
  syncZoneOccupancy()
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
  clearInterval(waveTimer)
})

function handleAssign({ patientId, bedId }) {
  const ok = assignPatientToBed(patientId, bedId)
  if (ok) {
    ElMessage.success(`患者已分配到床位 ${bedId}`)
  } else {
    ElMessage.warning('该床位已被占用')
  }
}

function handleRelease(bedId) {
  releaseBed(bedId)
  ElMessage.info(`床位 ${bedId} 已释放`)
}

function handleCrowded(zones) {
  // 仅触发内部事件，弹窗由 watch 自动显示
}
</script>
