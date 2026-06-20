<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AlertBanner from './components/AlertBanner.vue'
import GaugeDashboard from './components/GaugeDashboard.vue'
import GrowthTimeline from './components/GrowthTimeline.vue'
import AddEventDialog from './components/AddEventDialog.vue'

const STORAGE_KEY = 'gh_events_v1'
const DEFAULT_EVENTS = [
  { time: '2026-03-10 08:30', title: '播种', icon: '🌱', operator: '张伟', detail: '番茄种子（品种：金冠 1 号），播种深度 1.5cm，共 200 株。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato%20seeds%20sowing%20in%20greenhouse%20soil&image_size=square' },
  { time: '2026-03-25 10:00', title: '间苗', icon: '🌿', operator: '李娜', detail: '淘汰弱苗，保留壮苗，株距 40cm，行距 60cm。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20tomato%20seedlings%20in%20greenhouse&image_size=square' },
  { time: '2026-04-12 09:15', title: '施肥', icon: '🧪', operator: '王强', detail: '施复合肥 N-P-K 15-15-15，每亩 15kg，滴灌冲施。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fertilizer%20application%20in%20greenhouse&image_size=square', amount: '15kg/亩' },
  { time: '2026-05-08 14:20', title: '授粉', icon: '🌸', operator: '赵敏', detail: '采用熊蜂授粉，每棚放置 1 箱，开花率 85%。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato%20flowers%20blooming%20in%20greenhouse&image_size=square' },
  { time: '2026-06-01 07:40', title: '打药', icon: '💊', operator: '系统自动', detail: '检测到蚜虫风险，已推送预警，待人工复核并喷施农药。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=aphids%20pest%20on%20tomato%20leaf%20close%20up&image_size=square', amount: '吡虫啉 10% 2000 倍液' },
  { time: '2026-06-18 16:00', title: '采摘', icon: '🍅', operator: '孙丽', detail: '首批成熟果实采摘，产量约 120kg，糖度 5.2°Brix。', photo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ripe%20red%20tomatoes%20harvest%20in%20greenhouse&image_size=square', amount: '约 120kg' }
]

const envData = ref({
  temperature: { value: 36, unit: '°C', min: 10, max: 45, suitable: [18, 28], label: '温度', icon: '🌡️', action: '降温' },
  humidity: { value: 65, unit: '%', min: 0, max: 100, suitable: [50, 75], label: '湿度', icon: '💧', action: '通风除湿' },
  light: { value: 35000, unit: 'lx', min: 0, max: 80000, suitable: [20000, 60000], label: '光照', icon: '☀️', action: '遮阳' },
  co2: { value: 1200, unit: 'ppm', min: 0, max: 3000, suitable: [400, 1500], label: 'CO2', icon: '🫧', action: '通风' }
})

const alertInfo = ref({
  show: true,
  title: '检测到蚜虫风险，建议喷洒农药',
  detail: '传感器在 A3 区域监测到蚜虫种群密度超过阈值 0.8 只/叶，建议立即喷施 10% 吡虫啉可湿性粉剂 2000 倍液。请记录本次打药操作以避免重复用药。',
  level: 'danger'
})

const growthEvents = ref([...DEFAULT_EVENTS])
const dialogVisible = ref(false)

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) growthEvents.value = arr
    }
  } catch (e) { /* ignore */ }
}
function saveEvents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(growthEvents.value))
  } catch (e) { /* ignore */ }
}

onMounted(() => {
  loadEvents()
})

watch(growthEvents, saveEvents, { deep: true })

function handleAdd(payload) {
  growthEvents.value.push(payload)
  growthEvents.value.sort((a, b) => new Date(a.time.replace(' ', 'T')) - new Date(b.time.replace(' ', 'T')))
}

async function handleDelete(event) {
  try {
    await ElMessageBox.confirm(`确定要删除 ${event.time} 的「${event.title}」记录吗？`, '确认删除', { type: 'warning' })
    growthEvents.value = growthEvents.value.filter((e) => !(e.time === event.time && e.title === event.title && e.operator === event.operator))
    ElMessage.success('已删除')
  } catch (e) { /* cancel */ }
}

async function resetDefault() {
  try {
    await ElMessageBox.confirm('将恢复为初始示例数据，您的记录将被清空，继续？', '重置提醒', { type: 'warning' })
    growthEvents.value = [...DEFAULT_EVENTS]
    ElMessage.success('已恢复为默认数据')
  } catch (e) { /* cancel */ }
}

const TYPE_META = {
  '播种': { icon: '🌱', color: '#60a5fa', repeatDays: 30 },
  '施肥': { icon: '🧪', color: '#f59e0b', repeatDays: 7 },
  '打药': { icon: '💊', color: '#ef4444', repeatDays: 3 },
  '浇水': { icon: '💧', color: '#22d3ee', repeatDays: 2 },
  '间苗': { icon: '🌿', color: '#84cc16', repeatDays: 10 },
  '授粉': { icon: '🌸', color: '#ec4899', repeatDays: 15 },
  '采摘': { icon: '🍅', color: '#fb7185', repeatDays: 3 },
  '其他': { icon: '📝', color: '#94a3b8', repeatDays: 1 }
}

const typeStats = computed(() => {
  const map = {}
  growthEvents.value.forEach((e) => {
    const title = e.title || '其他'
    if (!map[title]) map[title] = { count: 0, last: null }
    map[title].count += 1
    if (!map[title].last || e.time > map[title].last.time) map[title].last = e
  })
  return map
})

const summaryCards = computed(() => {
  const now = Date.now()
  return Object.keys(TYPE_META).map((name) => {
    const meta = TYPE_META[name]
    const stat = typeStats.value[name] || { count: 0, last: null }
    const daysAgo = stat.last ? Math.round((now - new Date(stat.last.time.replace(' ', 'T')).getTime()) / 86400000) : null
    let status = 'normal'
    if (daysAgo === null) status = 'none'
    else if (name === '打药' || name === '施肥') {
      if (daysAgo < meta.repeatDays) status = 'recent'
      else if (daysAgo > meta.repeatDays * 1.5) status = 'due'
      else status = 'normal'
    } else {
      status = daysAgo < 3 ? 'recent' : 'normal'
    }
    return { name, meta, stat, daysAgo, status }
  })
})

const lastByType = computed(() => {
  const map = {}
  growthEvents.value.forEach((e) => {
    const title = e.title || '其他'
    if (!map[title] || e.time > map[title].time) map[title] = e
  })
  return map
})

const abnormalCount = computed(() => Object.values(envData.value).filter((v) => v.value < v.suitable[0] || v.value > v.suitable[1]).length)

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
</script>

<template>
  <div class="dashboard-wrapper">
    <header class="dashboard-header">
      <div class="brand">
        <span class="logo">🏡</span>
        <div class="title-block">
          <h1>智慧温室大棚 · 环境调控看板</h1>
          <p>棚区 A · 番茄种植区 · 实时监测 / 自动调控 / 农事记录</p>
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

        <div class="summary-section">
          <div class="section-head">
            <h3>🧾 农事操作 · 类型汇总（防重复）</h3>
            <div>
              <el-button size="small" @click="resetDefault">恢复默认</el-button>
              <el-button size="small" type="primary" @click="dialogVisible = true">➕ 新增记录</el-button>
            </div>
          </div>
          <div class="summary-grid">
            <div
              v-for="c in summaryCards"
              :key="c.name"
              class="summary-card"
              :class="[
                c.status === 'recent' ? 'recent' : '',
                c.status === 'due' ? 'due' : '',
                c.status === 'none' ? 'none' : ''
              ]"
              :style="{ '--accent': c.meta.color }"
            >
              <div class="sc-top">
                <span class="sc-icon">{{ c.meta.icon }}</span>
                <div class="sc-title">
                  <div class="sc-name">{{ c.name }}</div>
                  <div class="sc-sub">累计 {{ c.stat.count }} 次</div>
                </div>
                <el-tag
                  :type="c.status === 'recent' ? 'warning' : c.status === 'due' ? 'danger' : c.status === 'none' ? 'info' : 'success'"
                  size="small"
                  effect="plain"
                >
                  {{ c.status === 'recent' ? '近期操作' : c.status === 'due' ? '建议操作' : c.status === 'none' ? '尚无记录' : '正常' }}
                </el-tag>
              </div>
              <div class="sc-bottom">
                <span v-if="c.stat.last">最近：{{ c.stat.last.time }}（{{ c.daysAgo }} 天前）</span>
                <span v-else>建议首次记录：{{ c.meta.icon }} {{ c.name }}</span>
              </div>
              <div class="sc-bar">
                <div class="sc-bar-inner" :style="{ width: Math.min(100, (c.stat.count / 10) * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel timeline-panel">
        <div class="panel-head">
          <h2>🌾 作物生长时间轴</h2>
          <span class="hint">作物：番茄 · 共 {{ growthEvents.length }} 条记录</span>
        </div>
        <GrowthTimeline :events="growthEvents" @delete="handleDelete" />
      </section>
    </main>

    <footer class="dashboard-footer">
      <span>© 2026 Smart Agriculture Greenhouse · 数据本地保存（localStorage）</span>
    </footer>

    <AddEventDialog v-model="dialogVisible" :lastByType="lastByType" @submit="handleAdd" />
  </div>
</template>

<style scoped>
.summary-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed #334155;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-head h3 {
  margin: 0;
  font-size: 15px;
  color: #f1f5f9;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
@media (max-width: 1024px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .summary-grid { grid-template-columns: 1fr; } }

.summary-card {
  --accent: #3fa34d;
  background: #0e1a2c;
  border: 1px solid #243046;
  border-radius: 12px;
  padding: 12px 12px 10px;
  position: relative;
  transition: all 0.25s;
}
.summary-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 18px #00000055;
}
.summary-card.recent { border-color: #f59e0b77; background: linear-gradient(135deg, #1f1a0e, #0e1a2c); }
.summary-card.due { border-color: #ef444477; background: linear-gradient(135deg, #1f1313, #0e1a2c); animation: pulseDue 2s ease-in-out infinite; }
@keyframes pulseDue {
  0%, 100% { box-shadow: 0 0 0 #ef444400; }
  50% { box-shadow: 0 0 18px #ef444488; }
}

.sc-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.sc-icon {
  font-size: 22px;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px color-mix(in srgb, var(--accent) 60%, transparent);
}
.sc-title { flex: 1; min-width: 0; }
.sc-name { font-size: 14px; font-weight: 700; color: #f1f5f9; }
.sc-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.sc-bottom {
  font-size: 12px;
  color: #cbd5e1;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: #0b1321;
  border-radius: 8px;
  border: 1px dashed #243046;
}
.sc-bar {
  height: 4px;
  background: #1b2944;
  border-radius: 3px;
  overflow: hidden;
}
.sc-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #3fa34d);
  transition: width 0.4s;
}
</style>
