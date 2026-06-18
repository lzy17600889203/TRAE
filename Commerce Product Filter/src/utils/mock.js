const SKU_POOL = [
  { sku: 'SKU-88101', name: '无线降噪耳机 Pro', icon: '🎧' },
  { sku: 'SKU-88102', name: '智能手表 S9', icon: '⌚' },
  { sku: 'SKU-88103', name: '机械键盘 K3', icon: '⌨️' },
  { sku: 'SKU-88104', name: '人体工学办公椅', icon: '💺' },
  { sku: 'SKU-88105', name: '便携投影仪', icon: '📽️' },
  { sku: 'SKU-88106', name: '蓝牙音箱 Mini', icon: '🔊' },
  { sku: 'SKU-88107', name: '运动手环', icon: '📿' },
  { sku: 'SKU-88108', name: '空气净化器', icon: '🌀' }
]

const WAREHOUSES = ['北京仓', '上海仓', '广州仓', '成都仓', '杭州仓']

const STATUSES = [
  { key: 'pending', label: '待发货', color: '#f59e0b' },
  { key: 'shipped', label: '已发货', color: '#22c55e' },
  { key: 'abnormal', label: '异常', color: '#ef4444' }
]

const PLATFORMS = ['天猫', '京东', '抖音商城', '拼多多', '小红书']

const CUSTOMERS = ['张**', '李**', '王**', '陈**', '刘**', '杨**', '赵**', '黄**']

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[randInt(0, arr.length - 1)]
const pad = (n) => String(n).padStart(2, '0')

let orderSeq = 20260618001

export function createOrder() {
  const statusRoll = Math.random()
  const status =
    statusRoll < 0.55 ? 'pending' : statusRoll < 0.9 ? 'shipped' : 'abnormal'

  const skuInfo = pick(SKU_POOL)
  const qty = randInt(1, 3)
  const unitPrice = randInt(99, 2999)
  const now = new Date()

  return {
    id: `D${orderSeq++}`,
    platform: pick(PLATFORMS),
    customer: pick(CUSTOMERS),
    sku: skuInfo.sku,
    skuName: skuInfo.name,
    icon: skuInfo.icon,
    qty,
    amount: qty * unitPrice,
    warehouse: pick(WAREHOUSES),
    status,
    statusLabel: STATUSES.find((s) => s.key === status).label,
    createdAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    isNew: true
  }
}

export function initialOrders(n = 8) {
  const list = []
  for (let i = 0; i < n; i++) {
    const o = createOrder()
    o.isNew = false
    list.push(o)
  }
  return list
}

export function buildWarehouseInventory() {
  return WAREHOUSES.map((w) => {
    return SKU_POOL.map((s, idx) => {
      const base = randInt(40, 180)
      const safety = randInt(30, 60)
      // make some items low
      const current =
        idx % 5 === 0 ? Math.floor(safety * 0.6) - randInt(0, 5) : base
      return {
        warehouse: w,
        sku: s.sku,
        skuName: s.name,
        icon: s.icon,
        current: Math.max(3, current),
        safety,
        capacity: 300
      }
    })
  })
}

export function getStatusList() {
  return STATUSES
}

export function getWarehouses() {
  return WAREHOUSES
}

export function getSkuPool() {
  return SKU_POOL
}
