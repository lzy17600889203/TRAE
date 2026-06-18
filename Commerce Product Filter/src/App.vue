<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <div class="dashboard__title">
        <span class="dot"></span>
        <span>订单 &amp; 库存协同看板</span>
      </div>
      <div class="dashboard__meta">
        <el-tag type="success" effect="dark">实时链路正常</el-tag>
        <span>当前时间：{{ nowTime }}</span>
        <span>新增订单：<b style="color:#22d3ee;">+{{ newCount }}</b></span>
      </div>
    </div>

    <div class="dashboard__main">
      <!-- 左侧：实时订单流 -->
      <div class="panel">
        <div class="panel__header">
          <div class="panel__title">
            <el-icon><DataLine /></el-icon>
            <span>实时订单流</span>
            <span class="tag">{{ filteredOrders.length }} / {{ orders.length }}</span>
          </div>
        </div>

        <div class="filter-bar">
          <el-button
            v-for="s in statuses"
            :key="s.key"
            :type="activeFilters.includes(s.key) ? 'primary' : 'default'"
            size="small"
            round
            @click="toggleFilter(s.key)"
          >
            {{ s.label }}
            <el-badge v-if="statusCount[s.key]" :value="statusCount[s.key]" class="ml-1" />
          </el-button>
          <el-button size="small" round plain @click="resetFilter">全部</el-button>
          <el-input
            v-model="keyword"
            size="small"
            placeholder="搜索 SKU / 客户"
            clearable
            style="width:200px;margin-left:auto;"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <div v-if="filteredOrders.length === 0" class="order-list">
          <div class="empty-state">
            <EmptyRobot />
            <div class="empty-text">一切顺利，暂无{{ activeFiltersLabel }}订单 🎉</div>
            <div class="empty-sub">系统将在新订单到达时自动提示。</div>
          </div>
        </div>

        <transition-group v-else tag="div" name="slide" class="order-list">
          <div v-for="o in filteredOrders" :key="o.id" class="order-card">
            <div :class="['order-card__icon', '--' + o.status]">{{ o.icon }}</div>
            <div class="order-card__body">
              <div class="order-card__title">
                {{ o.skuName }}
                <el-tag size="small" :type="statusTagType(o.status)" effect="dark" style="margin-left:6px;">
                  {{ o.statusLabel }}
                </el-tag>
                <span v-if="o.isNew" class="new-badge"><el-icon><Bell /></el-icon>New</span>
              </div>
              <div class="order-card__meta">
                <span>订单号 {{ o.id }}</span>
                <span>{{ o.platform }}</span>
                <span>{{ o.customer }} · x{{ o.qty }}</span>
                <span>{{ o.warehouse }}</span>
                <span>{{ o.createdAt }}</span>
              </div>
            </div>
            <div class="order-card__right">
              <div class="amount">¥ {{ o.amount.toLocaleString() }}</div>
              <el-button size="small" text type="primary" @click="openOrder(o)">查看详情</el-button>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 右侧：库存 + 预警 -->
      <div class="panel" style="position:relative;">
        <div class="panel__header">
          <div class="panel__title">
            <el-icon><PieChart /></el-icon>
            <span>各仓库库存水位</span>
            <span class="tag">SKU: {{ skuNames.length }} · 仓库: {{ warehouses.length }}</span>
          </div>
          <div>
            <el-button size="small" type="warning" @click="manualTriggerAlert">
              <el-icon><Warning /></el-icon>模拟触发预警
            </el-button>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat">
            <div class="stat__label">总库存</div>
            <div class="stat__value">{{ totalStock }}</div>
          </div>
          <div class="stat">
            <div class="stat__label">平均水位</div>
            <div class="stat__value">{{ avgLevel }}%</div>
          </div>
          <div class="stat :class="alertCount > 0 ? '--alert' : ''">
            <div class="stat__label">预警 SKU</div>
            <div class="stat__value">{{ alertCount }}</div>
          </div>
          <div class="stat">
            <div class="stat__label">异常订单</div>
            <div class="stat__value">{{ abnormalOrderCount }}</div>
          </div>
        </div>

        <div style="height:8px;"></div>

        <InventoryChart
          :warehouses="warehouses"
          :sku-names="skuNames"
          :matrix="matrix"
          :alerts="alerts"
        />

        <StockWarning
          :visible="showWarning"
          :alerts="alerts"
          @close="showWarning = false"
          @dispatch="dispatchOrder"
        />
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="`订单详情 · ${currentOrder?.id ?? ''}`"
      width="760px"
      top="6vh"
      destroy-on-close
    >
        <template v-if="currentOrder">
          <div class="order-detail__header">
            <div class="order-detail__emoji">{{ currentOrder.icon }}</div>
            <div style="flex:1;">
              <div class="order-detail__title">
                {{ currentOrder.skuName }}
                <el-tag size="small" effect="dark" :type="statusTagType(currentOrder.status)">
                  {{ currentOrder.statusLabel }}
                </el-tag>
              </div>
              <div class="order-detail__sub">
                SKU: {{ currentOrder.sku }} · 规格：{{ currentOrder.spec }} · 颜色：{{ currentOrder.color }}
              </div>
            </div>
            <div class="order-detail__amount">
              <div class="order-detail__amount-label">应付金额</div>
              <div class="order-detail__amount-value">
                ¥ {{ (currentOrder.amount + currentOrder.freight).toLocaleString() }}
              </div>
            </div>
          </div>

          <el-divider content-position="left">买家 & 收货信息</el-divider>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="客户">{{ currentOrder.customer }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentOrder.phone }}</el-descriptions-item>
            <el-descriptions-item label="所在城市">{{ currentOrder.city }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">
              {{ currentOrder.address }}
            </el-descriptions-item>
            <el-descriptions-item label="下单平台">{{ currentOrder.platform }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ currentOrder.payment }}</el-descriptions-item>
            <el-descriptions-item label="买家备注">
              <span v-if="currentOrder.remark">{{ currentOrder.remark }}</span>
              <span v-else style="color:#909399;">—</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">商品明细</el-divider>
          <el-table :data="[currentOrder]" size="default" border stripe>
            <el-table-column prop="sku" label="SKU" width="130" />
            <el-table-column prop="skuName" label="商品名称" />
            <el-table-column label="规格">
              <template #default="{ row }">
                {{ row.spec }} / {{ row.color }}
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价(¥)" width="100" align="right">
              <template #default="{ row }">
                {{ Number(row.unitPrice).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="qty" label="数量" width="80" align="right" />
            <el-table-column label="小计(¥)" width="110" align="right">
              <template #default="{ row }">
                {{ (row.unitPrice * row.qty).toLocaleString() }}
              </template>
            </el-table-column>
          </el-table>

          <el-divider content-position="left">物流 & 财务</el-divider>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="发货仓库">{{ currentOrder.warehouse }}</el-descriptions-item>
            <el-descriptions-item label="承运商">
              <span v-if="currentOrder.carrier">{{ currentOrder.carrier }}</span>
              <span v-else style="color:#909399;">未发货</span>
            </el-descriptions-item>
            <el-descriptions-item label="运单号" :span="2">
              <el-tooltip content="点击复制" placement="top">
                <span style="cursor:copy;" @click="copyText(currentOrder.trackingNo)">
                  <el-icon style="vertical-align:-2px;"><Document /></el-icon>
                  {{ currentOrder.trackingNo }}
                </span>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item label="商品金额">¥ {{ currentOrder.amount.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="运费">
              {{ currentOrder.freight === 0 ? '包邮' : '¥ ' + currentOrder.freight }}
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ currentOrder.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ currentOrder.payTime }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">
              <span v-if="currentOrder.status === 'shipped'">{{ currentOrder.shipTime }}</span>
              <span v-else style="color:#909399;">未发货</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-alert
            v-if="currentOrder.status === 'abnormal'"
            :title="'异常原因：' + (currentOrder.remark || '未填写')"
            type="error"
            show-icon
            :closable="false"
            style="margin-top:16px;"
          />
        </template>

        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button
            type="warning"
            :disabled="currentOrder?.status === 'shipped'"
            @click="markShipped"
          >
            标记已发货
          </el-button>
          <el-button type="primary" @click="printOrder">打印面单</el-button>
        </template>
      </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, DataLine, Document, PieChart, Search, Warning, Printer } from '@element-plus/icons-vue'
import InventoryChart from './components/InventoryChart.vue'
import StockWarning from './components/StockWarning.vue'
import EmptyRobot from './components/EmptyRobot.vue'
import {
  initialOrders,
  createOrder,
  buildWarehouseInventory,
  getStatusList,
  getWarehouses,
  getSkuPool
} from './utils/mock'
import { playAlertSound } from './utils/sound'

const statuses = getStatusList()
const warehouses = getWarehouses()
const skuPool = getSkuPool()
const skuNames = skuPool.map((s) => s.name)

const orders = ref(initialOrders(10))
const activeFilters = ref(['pending', 'shipped', 'abnormal'])
const keyword = ref('')
const nowTime = ref('')
const showWarning = ref(false)
const detailVisible = ref(false)
const currentOrder = ref(null)

// 二维库存矩阵 [warehouseIdx][skuIdx]
const matrix = ref(buildWarehouseInventory())

// 预警列表（当前库存 < 安全阈值）
const alerts = computed(() => {
  const list = []
  matrix.value.forEach((wh) => {
    wh.forEach((cell) => {
      if (cell.current < cell.safety) list.push(cell)
    })
  })
  return list.sort((a, b) => a.current / a.safety - b.current / b.safety)
})

const totalStock = computed(() =>
  matrix.value.flat().reduce((s, c) => s + c.current, 0)
)
const avgLevel = computed(() => {
  const cells = matrix.value.flat()
  if (!cells.length) return 0
  const total = cells.reduce((s, c) => s + (c.current / c.capacity) * 100, 0)
  return Math.round(total / cells.length)
})
const alertCount = computed(() => alerts.value.length)
const abnormalOrderCount = computed(
  () => orders.value.filter((o) => o.status === 'abnormal').length
)

const statusCount = computed(() => {
  const map = { pending: 0, shipped: 0, abnormal: 0 }
  orders.value.forEach((o) => (map[o.status] += 1))
  return map
})

const newCount = computed(() => orders.value.filter((o) => o.isNew).length)

const filteredOrders = computed(() =>
  orders.value
    .filter((o) => activeFilters.value.includes(o.status))
    .filter((o) => {
      if (!keyword.value.trim()) return true
      const k = keyword.value.trim().toLowerCase()
      return (
        o.sku.toLowerCase().includes(k) ||
        o.skuName.toLowerCase().includes(k) ||
        o.customer.toLowerCase().includes(k) ||
        o.id.toLowerCase().includes(k)
      )
    })
)

const activeFiltersLabel = computed(() => {
  if (activeFilters.value.length === statuses.length) return ''
  return activeFilters.value
    .map((k) => statuses.find((s) => s.key === k)?.label || k)
    .join(' / ')
})

const toggleFilter = (key) => {
  const i = activeFilters.value.indexOf(key)
  if (i > -1) activeFilters.value.splice(i, 1)
  else activeFilters.value.push(key)
}
const resetFilter = () => {
  activeFilters.value = statuses.map((s) => s.key)
  keyword.value = ''
}
const statusTagType = (k) =>
  k === 'pending' ? 'warning' : k === 'shipped' ? 'success' : 'danger'

const openOrder = (o) => {
  currentOrder.value = o
  detailVisible.value = true
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制：' + text)
  } catch {
    ElMessage.warning('当前环境不支持剪贴板 API')
  }
}

const markShipped = () => {
  if (!currentOrder.value) return
  const o = orders.value.find((x) => x.id === currentOrder.value.id)
  if (!o) return
  o.status = 'shipped'
  o.statusLabel = '已发货'
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  o.shipTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  o.carrier = o.carrier || '顺丰速运'
  o.trackingNo = `SF${Math.floor(Math.random() * 1e12)}`
  ElMessage.success(`${o.id} 已标记为已发货`)
}

const printOrder = () => {
  if (!currentOrder.value) return
  ElMessage.info(`正在为 ${currentOrder.value.id} 打印面单（演示）`)
}

const dispatchOrder = () => {
  ElMessage.success(`已为 ${alerts.value.length} 个 SKU 创建紧急调拨单`)
  showWarning.value = false
}

const manualTriggerAlert = () => {
  // 随机降低某个 SKU 的库存到阈值以下
  const wh = matrix.value[Math.floor(Math.random() * matrix.value.length)]
  const cell = wh[Math.floor(Math.random() * wh.length)]
  cell.current = Math.max(1, Math.floor(cell.safety * 0.4))
  showWarning.value = true
  playAlertSound()
}

// --- 定时器：实时刷新 ---
let orderTimer = null
let clockTimer = null
let stockTimer = null
let alertSoundTimer = null

const updateClock = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  nowTime.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)

  orderTimer = setInterval(() => {
    const o = createOrder()
    orders.value.unshift(o)
    if (orders.value.length > 60) orders.value.length = 60
    // 3 秒后去掉 New 标
    setTimeout(() => {
      o.isNew = false
    }, 3500)

    // 根据订单扣减仓库库存（模拟真实出库）
    const wh = matrix.value[warehouses.indexOf(o.warehouse)]
    if (wh) {
      const cell = wh.find((c) => c.sku === o.sku)
      if (cell) {
        cell.current = Math.max(0, cell.current - o.qty)
      }
    }
  }, 2800)

  stockTimer = setInterval(() => {
    // 每 6 秒对部分仓库补货/消耗
    matrix.value.forEach((wh) => {
      wh.forEach((cell) => {
        const delta = Math.floor(Math.random() * 11) - 3 // -3 ~ +7
        cell.current = Math.min(cell.capacity, Math.max(0, cell.current + delta))
      })
    })
  }, 6000)

  // 启动即检查一次预警
  if (alerts.value.length > 0) {
    showWarning.value = true
    playAlertSound()
  }

  alertSoundTimer = setInterval(() => {
    if (alerts.value.length > 0 && !showWarning.value) {
      showWarning.value = true
      playAlertSound()
    }
  }, 18000)
})

watch(
  () => alerts.value.length,
  (now, prev) => {
    if (now > prev) {
      showWarning.value = true
      playAlertSound()
    }
  }
)

onBeforeUnmount(() => {
  if (orderTimer) clearInterval(orderTimer)
  if (clockTimer) clearInterval(clockTimer)
  if (stockTimer) clearInterval(stockTimer)
  if (alertSoundTimer) clearInterval(alertSoundTimer)
})
</script>
