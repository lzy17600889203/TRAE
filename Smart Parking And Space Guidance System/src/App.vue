<template>
  <div class="app-shell">
    <div class="app-header">
      <div style="display:flex; align-items:center;">
        <el-icon :size="24" color="#7ad9ff"><SuitcaseLine /></el-icon>
        <span class="title" style="margin-left:10px;">智慧停车场 · 车位引导系统</span>
        <span class="subtitle">Smart Parking Guidance</span>
      </div>
      <div class="stat-chips">
        <div class="stat-chip free">
          <div class="num">{{ freeCount }}</div>
          <div class="label">空闲车位</div>
        </div>
        <div class="stat-chip used">
          <div class="num">{{ usedCount }}</div>
          <div class="label">已占用</div>
        </div>
        <div class="stat-chip reserved">
          <div class="num">{{ reservedCount }}</div>
          <div class="label">预留中</div>
        </div>
      </div>
    </div>

    <div class="app-main">
      <div class="left-panel">
        <div class="entrance-board" :class="{ tight: isTight, normal: !isTight }">
          <div class="entrance-title">🅿 ENTRANCE · 入口指示牌</div>
          <div class="entrance-msg">
            <span class="big">{{ isTight ? `⚠ 车位紧张 · 仅剩 ${freeCount} 个车位` : `✓ 车位充足 · 剩余 ${freeCount} 个车位` }}</span>
            <span class="hint">{{ isTight ? '建议前往 ' + recommendArea + ' 区停放' : '欢迎光临，请减速慢行' }}</span>
          </div>
        </div>

        <div class="map-card">
          <div class="card-title">
            <span><el-icon><LocationFilled /></el-icon>&nbsp;B1 停车场平面图</span>
            <span class="legend">
              <span class="free">空闲</span>
              <span class="used">占用</span>
              <span class="reserved">预留</span>
            </span>
          </div>
          <div class="map-container">
            <ParkingMap :spots="spots" @spot-click="onSpotClick" />
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="chart-card full">
          <div class="card-title"><el-icon><DataAnalysis /></el-icon>&nbsp;各区域车位使用率</div>
          <UsageChart :spots="spots" />
        </div>
        <div class="chart-card">
          <div class="card-title"><el-icon><Bell /></el-icon>&nbsp;实时播报</div>
          <el-timeline style="padding: 8px 6px 2px;">
            <el-timeline-item v-for="(log, idx) in logs" :key="idx" :color="log.color" :timestamp="log.time" placement="top">
              {{ log.text }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>

    <SpotInfoCard
      v-if="currentSpot"
      :spot="currentSpot"
      :visible="!!currentSpot"
      :position="cardPosition"
      @close="currentSpot = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { SuitcaseLine, LocationFilled, DataAnalysis, Bell } from '@element-plus/icons-vue'
import ParkingMap from './components/ParkingMap.vue'
import SpotInfoCard from './components/SpotInfoCard.vue'
import UsageChart from './components/UsageChart.vue'
import { generateParking, AREAS } from './data/parking.js'

const spots = ref([])
const currentSpot = ref(null)
const cardPosition = ref({ x: 100, y: 100 })
const logs = ref([])

const freeCount = computed(() => spots.value.filter(s => s.status === 'free').length)
const usedCount = computed(() => spots.value.filter(s => s.status === 'used').length)
const reservedCount = computed(() => spots.value.filter(s => s.status === 'reserved').length)
const isTight = computed(() => freeCount.value < 10)

const recommendArea = computed(() => {
  const stats = AREAS.map(a => {
    const list = spots.value.filter(s => s.area === a.id)
    const free = list.filter(s => s.status === 'free').length
    return { id: a.id, free }
  }).sort((a, b) => b.free - a.free)
  return stats[0]?.id || 'A'
})

function onSpotClick ({ spot, event }) {
  currentSpot.value = spot
  const x = event ? event.clientX + 16 : 200
  const y = event ? event.clientY + 16 : 200
  cardPosition.value = { x, y }
}

function pushRandomLog () {
  const candidates = spots.value.filter(s => s.status === 'used')
  const lucky = candidates[Math.floor(Math.random() * candidates.length)]
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  if (Math.random() > 0.5 && lucky) {
    lucky.status = 'free'
    lucky.plate = ''
    lucky.inTime = ''
    logs.value.unshift({ time, color: '#67e8a8', text: `车辆 ${lucky.id} 已离开停车场` })
  } else {
    const freeList = spots.value.filter(s => s.status === 'free')
    if (freeList.length) {
      const newCar = freeList[Math.floor(Math.random() * freeList.length)]
      newCar.status = 'used'
      newCar.plate = '京A·' + (10000 + Math.floor(Math.random() * 89999))
      newCar.inTime = time.slice(0, 5)
      logs.value.unshift({ time, color: '#7ad9ff', text: `新车辆驶入 ${newCar.id} 车位` })
    }
  }
  if (logs.value.length > 8) logs.value.pop()
  // 强制触发视图更新
  spots.value = [...spots.value]
}

onMounted(() => {
  spots.value = generateParking(3, 6)
  if (isTight.value) {
    setTimeout(() => ElMessage.warning('⚠ 当前车位紧张，请引导车辆前往 ' + recommendArea.value + ' 区'), 600)
  }
  logs.value.push({
    time: '系统启动',
    color: '#b58bff',
    text: '停车场引导系统已上线'
  })
  setInterval(pushRandomLog, 4500)
})
</script>
