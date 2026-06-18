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

const CUSTOMERS = [
  { name: '张**', phone: '138****1234', city: '北京' },
  { name: '李**', phone: '139****5678', city: '上海' },
  { name: '王**', phone: '137****9012', city: '广州' },
  { name: '陈**', phone: '136****3456', city: '深圳' },
  { name: '刘**', phone: '135****7890', city: '成都' },
  { name: '杨**', phone: '158****2345', city: '杭州' },
  { name: '赵**', phone: '159****6789', city: '武汉' },
  { name: '黄**', phone: '186****0123', city: '南京' }
]

const CARRIERS = ['顺丰速运', '京东物流', '中通快递', '圆通速递', '韵达快递']
const PAYMENTS = ['支付宝', '微信支付', '银行卡', '花呗分期']
const ABNORMAL_REASONS = ['库存不足', '地址异常', '支付超时', '买家取消', '快递丢失']

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
  const customer = pick(CUSTOMERS)
  const payTime = new Date(now.getTime() - randInt(30, 600) * 1000)
  const shipTime =
    status === 'shipped'
      ? new Date(payTime.getTime() + randInt(60, 1800) * 1000)
      : null

  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

  return {
    id: `D${orderSeq++}`,
    platform: pick(PLATFORMS),
    customer: customer.name,
    phone: customer.phone,
    city: customer.city,
    address: `${customer.city}市某某区幸福小区 ${randInt(1, 30)}号楼 ${randInt(101, 3000)}室`,
    sku: skuInfo.sku,
    skuName: skuInfo.name,
    icon: skuInfo.icon,
    spec: ['标准版', '高配版', '尊享版', 'Pro 版'][randInt(0, 3)],
    color: ['曜石黑', '星河银', '极光蓝', '云雾白', '玫瑰金'][randInt(0, 4)],
    qty,
    unitPrice,
    amount: qty * unitPrice,
    freight: randInt(0, 1) ? 0 : randInt(8, 25),
    payment: pick(PAYMENTS),
    warehouse: pick(WAREHOUSES),
    carrier: status === 'shipped' ? pick(CARRIERS) : '',
    trackingNo:
      status === 'shipped'
        ? `SF${Math.floor(Math.random() * 1e12)}`
        : status === 'pending'
        ? '待生成'
        : '—',
    remark:
      status === 'abnormal'
        ? pick(ABNORMAL_REASONS)
        : ['请尽快发货', '包装请加固', '送货前电话联系', ''][randInt(0, 3)],
    status,
    statusLabel: STATUSES.find((s) => s.key === status).label,
    payTime: fmt(payTime),
    shipTime: shipTime ? fmt(shipTime) : '—',
    createdAt: fmt(now),
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
