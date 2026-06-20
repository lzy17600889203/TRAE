export const NODE_TYPES = [
  { key: 'pickup', label: '揽收', color: '#409EFF' },
  { key: 'domestic', label: '国内运输', color: '#67C23A' },
  { key: 'customs', label: '海关清关', color: '#E6A23C' },
  { key: 'international', label: '国际派送', color: '#909399' }
]

export const mockPackages = [
  {
    id: 'PKG-2026-0001',
    origin: '深圳',
    destination: '洛杉矶',
    product: '3C 电子配件',
    status: 'clearance_stuck',
    currentNode: 'customs',
    nodes: [
      { key: 'pickup', arrivedAt: '2026-06-16 09:12', note: '深圳仓库揽收完成' },
      { key: 'domestic', arrivedAt: '2026-06-17 14:05', note: '广州白云机场干线发出' },
      {
        key: 'customs',
        arrivedAt: '2026-06-18 06:40',
        note: '抵达洛杉矶 LAX 海关，等待人工核验',
        stuckHours: 62,
        inspection: {
          type: '人工查验',
          reason: '申报品名与X光影像不一致',
          officer: '海关专员 J.Martinez',
          documents: ['商业发票', '原产地证', '产品测试报告']
        }
      },
      { key: 'international', arrivedAt: null, note: null }
    ]
  },
  {
    id: 'PKG-2026-0002',
    origin: '上海',
    destination: '纽约',
    product: '家居用品',
    status: 'detained',
    currentNode: 'customs',
    nodes: [
      { key: 'pickup', arrivedAt: '2026-06-14 11:30', note: '上海浦东揽收' },
      { key: 'domestic', arrivedAt: '2026-06-15 20:18', note: '经仁川机场转运' },
      {
        key: 'customs',
        arrivedAt: '2026-06-17 02:10',
        note: 'JFK 海关扣留，等待收件人补充授权',
        stuckHours: 89,
        inspection: {
          type: '扣留',
          reason: '收件人身份信息缺失，需提供购买凭证',
          officer: 'CBP 现场组',
          documents: ['海关扣留单', '身份授权书']
        }
      },
      { key: 'international', arrivedAt: null, note: null }
    ]
  },
  {
    id: 'PKG-2026-0003',
    origin: '广州',
    destination: '伦敦',
    product: '服饰',
    status: 'in_transit',
    currentNode: 'international',
    nodes: [
      { key: 'pickup', arrivedAt: '2026-06-15 08:00', note: '广州白云揽收' },
      { key: 'domestic', arrivedAt: '2026-06-16 02:50', note: '南沙港海运出发' },
      { key: 'customs', arrivedAt: '2026-06-18 18:20', note: '南安普敦海关快速放行', stuckHours: 6 },
      { key: 'international', arrivedAt: '2026-06-19 10:12', note: '伦敦本地派送中' }
    ]
  },
  {
    id: 'PKG-2026-0004',
    origin: '杭州',
    destination: '悉尼',
    product: '美妆',
    status: 'clearance_stuck',
    currentNode: 'customs',
    nodes: [
      { key: 'pickup', arrivedAt: '2026-06-16 15:20', note: '杭州仓揽收' },
      { key: 'domestic', arrivedAt: '2026-06-17 22:10', note: '香港转运' },
      {
        key: 'customs',
        arrivedAt: '2026-06-18 23:45',
        note: '悉尼海关抽检中',
        stuckHours: 50,
        inspection: {
          type: '抽检',
          reason: '化妆品成分需二次核验',
          officer: 'ABF 检查小组',
          documents: ['成分检测报告', '进口许可']
        }
      },
      { key: 'international', arrivedAt: null, note: null }
    ]
  },
  {
    id: 'PKG-2026-0005',
    origin: '北京',
    destination: '东京',
    product: '母婴',
    status: 'delivered',
    currentNode: 'international',
    nodes: [
      { key: 'pickup', arrivedAt: '2026-06-13 10:00', note: '北京亦庄仓揽收' },
      { key: 'domestic', arrivedAt: '2026-06-14 06:30', note: '成田机场抵达' },
      { key: 'customs', arrivedAt: '2026-06-14 15:10', note: '日本海关电子放行', stuckHours: 4 },
      { key: 'international', arrivedAt: '2026-06-15 09:30', note: '东京收件人签收' }
    ]
  },
  {
    id: 'PKG-2026-0006',
    origin: '成都',
    destination: '迪拜',
    product: '数码',
    status: 'failed',
    currentNode: 'customs',
    nodes: [
      { key: 'pickup', arrivedAt: '2026-06-12 09:10', note: '成都双流揽收' },
      { key: 'domestic', arrivedAt: '2026-06-13 18:40', note: '迪拜 DXB 抵达' },
      {
        key: 'customs',
        arrivedAt: '2026-06-14 01:20',
        note: '清关失败，退回寄件人',
        stuckHours: 72,
        inspection: {
          type: '清关失败',
          reason: '缺少 GCC 符合性标识',
          officer: 'Dubai Customs',
          documents: ['退回通知', '查验报告']
        }
      },
      { key: 'international', arrivedAt: null, note: null }
    ]
  }
]