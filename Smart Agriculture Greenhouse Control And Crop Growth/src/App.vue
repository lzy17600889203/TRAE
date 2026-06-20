<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AlertBanner from './components/AlertBanner.vue'
import GaugeDashboard from './components/GaugeDashboard.vue'
import GrowthTimeline from './components/GrowthTimeline.vue'

const envData = ref({
  temperature: { value: 36, unit: '°C', min: 10, max: 45, suitable: [18, 28], label: '温度', icon: '🌡️', action: '降温' },
  humidity: { value: 65, unit: '%', min: 0, max: 100, suitable: [50, 75], label: '湿度', icon: '💧', action: '通风除湿' },
  light: { value: 35000, unit: 'lx', min: 0, max: 80000, suitable: [20000, 60000], label: '光照', icon: '☀️', action: '遮阳' },
  co2: { value: 1200, unit: 'ppm', min: 0, max: 3000, suitable: [400, 1500], label: 'CO2', icon: '🫧', action: '通风' }
})

const alertInfo = ref({
  show: true,
  title: '检测到蚜虫风险，建议喷洒农药',
  detail: '传感器在 A3 区域监测到蚜虫种群密度超过阈值 0.8 只/叶，建议立即喷施 10% 吡虫啉可湿性粉剂 2000 倍液。',
  level: 'danger'
})

const growthEvents = ref([
  { time: '2026-03-10 08:30', title: '播种', icon: '🌱', operator: '张伟', detail: '番茄种子（品种：金冠 1 号），播种深度 1.5cm，共 200 株。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato%20seeds%20sowing%20in%20greenhouse%20soil&image_size=square' },
  { time: '2026-03-25 10:00', title: '间苗 / 补苗', icon: '🌿', operator: '李娜', detail: '淘汰弱苗，保留壮苗，株距 40cm，行距 60cm。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20tomato%20seedlings%20in%20greenhouse&image_size=square' },
  { time: '2026-04-12 09:15', title: '首次施肥', icon: '🧪', operator: '王强', detail: '施复合肥 N-P-K 15-15-15，每亩 15kg，滴灌冲施。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fertilizer%20application%20in%20greenhouse&image_size=square' },
  { time: '2026-05-08 14:20', title: '开花期授粉', icon: '🌸', operator: '赵敏', detail: '采用熊蜂授粉，每棚放置 1 箱，开花率 85%。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato%20flowers%20blooming%20in%20greenhouse&image_size=square' },
  { time: '2026-06-01 07:40', title: '病虫害预警', icon: '⚠️', operator: '系统自动', detail: '检测到蚜虫风险，已推送预警，待人工复核并喷施农药。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=aphids%20pest%20on%20tomato%20leaf%20close%20up&image_size=square' },
  { time: '2026-06-18 16:00', title: '首次采摘', icon: '🍅', operator: '孙丽', detail: '首批成熟果实采摘，产量约 120kg，糖度 5.2°Brix。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ripe%20red%20tomatoes%20harvest%20in%20greenhouse&image_size=square' }
])

let timer = null
onMounted(() => {
  timer = setInterval(() => {
    const keys = Object.keys(envData.value)
    keys.forEach((k) => {
      const item = envData.value[k]
      const range = (item.max - item.min) * 0.08
      let next = item.value + (Math.random() - 0.45) * range
      next = Math.max(item.min, Math.min(item.max, next))
      item.value = Number(next.toFixed(k === 'light' || k === 'co2' ? 0 : 1))
    })
  }, 2500)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const isOutOfRange = (item) => item.value < item.suitable[0] || item.value > item.suitable[1]

const abnormalCount = computed(() => Object.values(envData.value).filter(isOutOfRange).length)
</script>

<template>
  <div class="dashboard-wrapper">
    <header class="dashboard-header">
      <div class="brand">
        <span class="logo">🏡</span>
        <div class="title-block">
          <h1>智慧温室大棚 · 环境调控看板</h1>
          <p>棚区 A · 番茄种植区 · 实时监测 / 自动调控</p>
        </div>
      </div>
      <div class="header-meta">
        <span class="badge normal">在线传感器：12 / 12</span>
        <span class="badge" :class="abnormalCount > 0 ? 'warn' : 'ok'">异常指标：{{ abnormalCount }}</span>
      </div>
    </header>

    <AlertBanner
      :show="alertInfo.show"
      :title="alertInfo.title"
      :detail="alertInfo.detail"
      :level="alertInfo.level"
      @close="alertInfo.show = false"
    />

    <main class="dashboard-body">
      <section class="panel gauge-panel">
        <div class="panel-head">
          <h2>🌐 实时环境仪表盘</h2>
          <span class="hint">每 2.5 秒刷新一次 · 超出阈值自动触发调控</span>
        </div>
        <div class="gauge-grid">
          <GaugeDashboard
            v-for="(item, key) in envData"
            :key="key"
            :label="item.label"
            :icon="item.icon"
            :value="item.value"
            :unit="item.unit"
            :min="item.min"
            :max="item.max"
            :suitable="item.suitable"
            :action="item.action"
          />
        </div>
      </section>

      <section class="panel timeline-panel">
        <div class="panel-head">
          <h2>🌾 作物生长时间轴</h2>
          <span class="hint">作物：番茄 · 生长阶段：坐果期</span>
        </div>
        <GrowthTimeline :events="growthEvents" />
      </section>
    </main>

    <footer class="dashboard-footer">
      <span>© 2026 Smart Agriculture Greenhouse · 智慧农业物联网平台</span>
    </footer>
  </div>
</template>
