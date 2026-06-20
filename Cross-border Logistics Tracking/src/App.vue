<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="title-block">
        <h1>跨境物流全链路追踪看板</h1>
        <p class="subtitle">
          实时监控 {{ packages.length }} 个跨境包裹 · 清关滞留 {{ stuckCount }} 单 · 扣留 {{ detainedCount }} 单
        </p>
      </div>
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索包裹号 / 始发地 / 目的地"
          clearable
          style="width: 280px"
          :prefix-icon="Search"
        />
        <el-select v-model="statusFilter" placeholder="全部状态" style="width: 140px" clearable>
          <el-option label="运输中" value="in_transit" />
          <el-option label="清关滞留" value="clearance_stuck" />
          <el-option label="海关扣留" value="detained" />
          <el-option label="清关失败" value="failed" />
          <el-option label="已签收" value="delivered" />
        </el-select>
      </div>
    </header>

    <main class="dashboard-body">
      <section class="left-panel">
        <PackageTimeline
          v-for="pkg in filteredPackages"
          :key="pkg.id"
          :package="pkg"
          @inspect="handleInspect"
        />
        <el-empty
          v-if="filteredPackages.length === 0"
          description="没有匹配的包裹"
          :image-size="120"
        />
      </section>

      <section class="right-panel">
        <ClearanceFunnel
          :packages="packages"
          @hover-node="handleFunnelHover"
        />
      </section>
    </main>

    <InspectionDrawer
      v-model:visible="drawerVisible"
      :package="currentPackage"
    />

    <DetentionCard
      v-if="activeDetention"
      :package="activeDetention"
      @close="activeDetention = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { mockPackages } from './mock/packages.js'
import PackageTimeline from './components/PackageTimeline.vue'
import ClearanceFunnel from './components/ClearanceFunnel.vue'
import InspectionDrawer from './components/InspectionDrawer.vue'
import DetentionCard from './components/DetentionCard.vue'

const packages = ref(mockPackages)
const keyword = ref('')
const statusFilter = ref('')
const funnelFilter = ref(null)
const drawerVisible = ref(false)
const currentPackage = ref(null)
const activeDetention = ref(null)

const stuckCount = computed(() =>
  packages.value.filter((p) => p.status === 'clearance_stuck').length
)
const detainedCount = computed(() =>
  packages.value.filter((p) => p.status === 'detained').length
)

const filteredPackages = computed(() => {
  return packages.value.filter((p) => {
    const kw = keyword.value.trim().toLowerCase()
    const matchKw =
      !kw ||
      p.id.toLowerCase().includes(kw) ||
      p.origin.includes(keyword.value.trim()) ||
      p.destination.includes(keyword.value.trim())
    const matchStatus = !statusFilter.value || p.status === statusFilter.value
    const matchFunnel = !funnelFilter.value || p.status === funnelFilter.value
    return matchKw && matchStatus && matchFunnel
  })
})

const handleInspect = (pkg) => {
  currentPackage.value = pkg
  drawerVisible.value = true
}

const handleFunnelHover = (statusKey) => {
  funnelFilter.value = statusKey || null
}

onMounted(() => {
  const detained = packages.value.find((p) => p.status === 'detained')
  if (detained) {
    setTimeout(() => {
      activeDetention.value = detained
      document.body.classList.add('shake')
      setTimeout(() => document.body.classList.remove('shake'), 700)
      ElNotification({
        title: '海关扣留告警',
        message: `包裹 ${detained.id} 被扣留，需尽快处理`,
        type: 'warning',
        duration: 4500,
        customClass: 'detention-notification'
      })
    }, 800)
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1200px 400px at 20% -10%, rgba(64, 158, 255, 0.15), transparent 60%),
    radial-gradient(800px 300px at 120% 10%, rgba(230, 162, 60, 0.12), transparent 60%),
    #0f1320;
  padding: 24px 28px 48px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.title-block h1 {
  margin: 0 0 6px;
  font-size: 24px;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #66b1ff, #b3d8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  margin: 0;
  color: #8c97b0;
  font-size: 13px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dashboard-body {
  flex: 1;
  margin-top: 20px;
  display: grid;
  grid-template-columns: minmax(520px, 1.35fr) minmax(360px, 1fr);
  gap: 20px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
