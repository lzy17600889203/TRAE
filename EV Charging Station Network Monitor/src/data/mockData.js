// 模拟充电站数据
export const stations = [
  {
    id: 'cyq-1',
    name: '朝阳区1号站',
    x: 320,
    y: 260,
    total: 10,
    idle: 2,
    queue: 8,
    todayKwh: 1280,
    faultRate: 2.4,
    power: '120kW',
    waitMinutes: 45,
    status: 'busy'
  },
  {
    id: 'cyq-2',
    name: '朝阳区2号站',
    x: 480,
    y: 320,
    total: 8,
    idle: 5,
    queue: 2,
    todayKwh: 960,
    faultRate: 1.2,
    power: '90kW',
    waitMinutes: 12,
    status: 'normal'
  },
  {
    id: 'cyq-3',
    name: '朝阳区3号站',
    x: 620,
    y: 200,
    total: 12,
    idle: 4,
    queue: 6,
    todayKwh: 1420,
    faultRate: 8.3,
    power: '150kW',
    waitMinutes: 32,
    status: 'warning'
  },
  {
    id: 'hdq-1',
    name: '海淀区1号站',
    x: 220,
    y: 420,
    total: 10,
    idle: 7,
    queue: 0,
    todayKwh: 820,
    faultRate: 0.8,
    power: '90kW',
    waitMinutes: 0,
    status: 'idle'
  },
  {
    id: 'hdq-2',
    name: '海淀区2号站',
    x: 380,
    y: 500,
    total: 16,
    idle: 3,
    queue: 9,
    todayKwh: 1680,
    faultRate: 3.1,
    power: '180kW',
    waitMinutes: 52,
    status: 'busy'
  },
  {
    id: 'xcq-1',
    name: '西城区1号站',
    x: 720,
    y: 400,
    total: 8,
    idle: 1,
    queue: 7,
    todayKwh: 1120,
    faultRate: 5.2,
    power: '120kW',
    waitMinutes: 38,
    status: 'busy'
  },
  {
    id: 'dcq-1',
    name: '东城区1号站',
    x: 820,
    y: 280,
    total: 10,
    idle: 6,
    queue: 1,
    todayKwh: 760,
    faultRate: 1.5,
    power: '90kW',
    waitMinutes: 6,
    status: 'normal'
  },
  {
    id: 'fsq-1',
    name: '丰台区1号站',
    x: 520,
    y: 560,
    total: 12,
    idle: 8,
    queue: 0,
    todayKwh: 640,
    faultRate: 0.5,
    power: '120kW',
    waitMinutes: 0,
    status: 'idle'
  }
]

// 设备离线告警事件流
export const alarmEvents = [
  {
    id: 'alarm-001',
    station: '朝阳区3号站',
    pile: '2号桩',
    message: '通信离线',
    level: 'critical',
    time: '10:42:16'
  },
  {
    id: 'alarm-002',
    station: '海淀区2号站',
    pile: '7号桩',
    message: '通信离线',
    level: 'critical',
    time: '10:38:02'
  }
]
