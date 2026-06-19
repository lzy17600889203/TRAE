<template>
  <div class="app-container">
    <!-- 顶栏 -->
    <header class="app-header">
      <div class="title">
        <el-icon :size="20" color="#409eff"><DataLine /></el-icon>
        <span>B2B 客户生命周期 CRM</span>
      </div>
      <div class="subtitle">
        <el-tag type="info" effect="plain">今日：{{ todayText }}</el-tag>
        <el-tag type="warning" effect="dark">待跟进：{{ needFollowCount }} 家</el-tag>
      </div>
    </header>

    <main class="app-main">
      <section class="left-panel">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">
                <el-icon :size="18"><AlarmClock /></el-icon>
                今日待跟进
              </span>
              <span class="panel-tip">今日需跟进的客户，卡片左侧会震动提醒</span>
            </div>
          </template>

          <FollowUpCards :customers="customers" @open-drawer="handleOpenDrawer" />
        </el-card>
      </section>

      <aside class="right-panel">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">
                <el-icon :size="18"><TrendCharts /></el-icon>
                客户转化漏斗
              </span>
              <span class="panel-tip">鼠标悬停查看各阶段客户明细</span>
            </div>
          </template>
          <FunnelChart ref="funnelRef" />
        </el-card>
      </aside>
    </main>

    <FollowDrawer
      v-model:visible="drawerVisible"
      :customer="currentCustomer"
      @add-record="handleAddRecord"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FollowUpCards from './components/FollowUpCards.vue'
import FollowDrawer from './components/FollowDrawer.vue'
import FunnelChart from './components/FunnelChart.vue'
import { customers as seedCustomers, isNeedFollowToday } from './data/customers.js'

const customers = ref([...seedCustomers])

const drawerVisible = ref(false)
const currentCustomer = ref(null)

const todayText = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
})

const needFollowCount = computed(() =>
  customers.value.filter((c) => isNeedFollowToday(c)).length
)

function handleOpenDrawer(customer) {
  currentCustomer.value = customer
  drawerVisible.value = true
}

function handleAddRecord({ customerId, record }) {
  const target = customers.value.find((c) => c.id === customerId)
  if (target) {
    target.records.unshift(record)
    target.lastFollow = record.time
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #fff;
  padding: 16px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  display: flex;
  gap: 10px;
}

.app-main {
  flex: 1;
  padding: 20px;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

.left-panel,
.right-panel {
  min-width: 0;
}

.panel-card {
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
}

.panel-tip {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 960px) {
  .app-main {
    grid-template-columns: 1fr;
  }
}
</style>
