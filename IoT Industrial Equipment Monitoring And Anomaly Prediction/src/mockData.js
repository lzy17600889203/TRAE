// 设备基础信息 & 初始状态
export const equipmentList = [
  {
    id: 'machine-1',
    name: '1号机床',
    type: 'cnc',
    x: 150,
    y: 200,
    normalTemp: [40, 65],
    normalVibration: [0.2, 1.2],
    warningTemp: 85,
    warningVibration: 2.5
  },
  {
    id: 'machine-2',
    name: '2号冲压机',
    type: 'press',
    x: 400,
    y: 120,
    normalTemp: [35, 55],
    normalVibration: [0.5, 1.8],
    warningTemp: 75,
    warningVibration: 3.2
  },
  {
    id: 'machine-3',
    name: '3号机床',
    type: 'cnc',
    x: 650,
    y: 200,
    normalTemp: [40, 65],
    normalVibration: [0.2, 1.2],
    warningTemp: 85,
    warningVibration: 2.5
  },
  {
    id: 'machine-4',
    name: '4号传送带',
    type: 'conveyor',
    x: 280,
    y: 380,
    normalTemp: [30, 45],
    normalVibration: [0.1, 0.6],
    warningTemp: 60,
    warningVibration: 1.5
  },
  {
    id: 'machine-5',
    name: '5号焊接机器人',
    type: 'robot',
    x: 520,
    y: 380,
    normalTemp: [50, 80],
    normalVibration: [0.3, 1.0],
    warningTemp: 110,
    warningVibration: 2.0
  },
  {
    id: 'control-center',
    name: '中央控制中心',
    type: 'center',
    x: 400,
    y: 260,
    normalTemp: [25, 35],
    normalVibration: [0, 0.1],
    warningTemp: 45,
    warningVibration: 0.5
  }
]

// 设备之间的连线（拓扑关系）
export const equipmentLinks = [
  { source: 'control-center', target: 'machine-1' },
  { source: 'control-center', target: 'machine-2' },
  { source: 'control-center', target: 'machine-3' },
  { source: 'control-center', target: 'machine-4' },
  { source: 'control-center', target: 'machine-5' },
  { source: 'machine-1', target: 'machine-4' },
  { source: 'machine-2', target: 'machine-5' },
  { source: 'machine-3', target: 'machine-5' }
]

// 生成 24 小时历史数据（每 10 分钟一个点 = 144 个点）
export function generate24HourHistory(equipment) {
  const points = 144
  const now = Date.now()
  const interval = 10 * 60 * 1000

  const temperature = []
  const vibration = []
  const abnormalRanges = []

  // 随机制造 1-2 段异常区间用于演示高亮
  const abnormalCount = Math.random() > 0.5 ? 2 : 1
  for (let i = 0; i < abnormalCount; i++) {
    const startIdx = Math.floor(20 + Math.random() * (points - 60))
    const length = Math.floor(5 + Math.random() * 15)
    abnormalRanges.push({ startIdx, endIdx: Math.min(startIdx + length, points - 1) })
  }

  let prevTemp = (equipment.normalTemp[0] + equipment.normalTemp[1]) / 2
  let prevVib = (equipment.normalVibration[0] + equipment.normalVibration[1]) / 2

  for (let i = 0; i < points; i++) {
    const time = now - (points - 1 - i) * interval

    const isAbnormal = abnormalRanges.some(r => i >= r.startIdx && i <= r.endIdx)

    let temp, vib
    if (isAbnormal) {
      temp = equipment.warningTemp + Math.random() * 25 + Math.sin(i / 3) * 5
      vib = equipment.warningVibration + Math.random() * 1.8 + Math.cos(i / 4) * 0.4
    } else {
      const tempNoise = (Math.random() - 0.5) * 6
      const vibNoise = (Math.random() - 0.5) * 0.4
      temp = prevTemp + tempNoise
      vib = Math.max(0, prevVib + vibNoise)
      temp = Math.max(equipment.normalTemp[0] - 5, Math.min(equipment.warningTemp - 5, temp))
      vib = Math.min(equipment.warningVibration - 0.3, vib)
    }

    prevTemp = temp
    prevVib = vib

    temperature.push({ time, value: Number(temp.toFixed(1)) })
    vibration.push({ time, value: Number(vib.toFixed(2)) })
  }

  return { temperature, vibration, abnormalRanges }
}

// 为每台设备维护一个"隐式状态机"，确保温度/震动会自然爬升 → 触发预警 → 触发异常 → 回落恢复
// 这样"异常节点变红 + 波纹扩散 + 告警日志"的演示效果就能稳定复现
const deviceState = {}
function ensureState(id, equipment) {
  if (!deviceState[id]) {
    // 启动时随机决定是否初始就处于异常态（概率约 35%）
    // 这样页面一打开就可能看到红色波纹，演示效果更明显
    const startAbnormal = equipment.type !== 'center' && Math.random() < 0.35
    const initialTemp = startAbnormal
      ? equipment.warningTemp + 5 + Math.random() * 10
      : (equipment.normalTemp[0] + equipment.normalTemp[1]) / 2
    const initialVib = startAbnormal
      ? equipment.warningVibration + Math.random() * 1.2
      : (equipment.normalVibration[0] + equipment.normalVibration[1]) / 2
    deviceState[id] = {
      temp: initialTemp,
      vib: initialVib,
      drift: startAbnormal ? 0.8 : 0,
      abnormalCounter: startAbnormal ? 10 + Math.floor(Math.random() * 15) : 0,
      lastTick: Date.now()
    }
  }
  return deviceState[id]
}

// 实时模拟：给定时间点，返回所有设备的最新传感器状态
export function getCurrentReadings(equipment) {
  const s = ensureState(equipment.id, equipment)
  const now = Date.now()
  const dt = Math.min((now - s.lastTick) / 1000, 10) // 秒
  s.lastTick = now

  const tempMid = (equipment.normalTemp[0] + equipment.normalTemp[1]) / 2
  const vibMid = (equipment.normalVibration[0] + equipment.normalVibration[1]) / 2

  // 每 ~8 秒重新评估"故障倾向"：
  //  - 15% 概率触发异常（直接向 warning 以上爬升）
  //  - 20% 概率触发预警（向 warning*0.9 附近爬升）
  //  - 其余时间朝 mid 回归
  if (Math.random() < 0.12) {
    if (s.abnormalCounter > 0) {
      // 已经在异常态，有 55% 概率开始回落
      s.drift = -1 * (0.6 + Math.random() * 0.8)
      s.abnormalCounter = Math.max(0, s.abnormalCounter - 1)
    } else if (Math.random() < 0.35) {
      // 35% * 12% ≈ 4% 概率触发异常
      s.drift = 0.8 + Math.random() * 1.2
      s.abnormalCounter = 8 + Math.floor(Math.random() * 10) // 持续多个 tick
    } else if (Math.random() < 0.5) {
      // 约 6% 概率触发预警
      s.drift = 0.3 + Math.random() * 0.5
      s.abnormalCounter = 0
    } else {
      // 其余回归正常
      s.drift = (Math.random() - 0.5) * 0.3
      s.abnormalCounter = 0
    }
  }

  // 温度演化：按 drift 做小幅布朗运动，并被 tempMid / warningTemp 约束
  s.temp += s.drift * (1.2 + Math.random()) + (Math.random() - 0.5) * 1.2
  // 自然回归力：离 mid 越远，回拉越强
  s.temp += (tempMid - s.temp) * 0.04

  // 震动演化：与温度正相关 + 随机噪声
  const tempRatio = Math.max(0, (s.temp - tempMid) / (equipment.warningTemp - tempMid))
  s.vib = vibMid + tempRatio * (equipment.warningVibration - vibMid) * 0.9 + (Math.random() - 0.5) * 0.3
  s.vib = Math.max(equipment.normalVibration[0] - 0.2, s.vib)

  // 异常时维持足够高（让红色不会只闪一下）
  if (s.abnormalCounter > 0 && s.temp < equipment.warningTemp + 3) {
    s.temp = equipment.warningTemp + 3 + Math.random() * 10
    s.vib = equipment.warningVibration + Math.random() * 1.5
  }

  // 边界兜底
  s.temp = Math.max(equipment.normalTemp[0] - 5, Math.min(equipment.warningTemp + 25, s.temp))
  s.vib = Math.max(0, Math.min(equipment.warningVibration + 3, s.vib))

  const temp = s.temp
  const vib = s.vib
  const tempAbnormal = temp > equipment.warningTemp
  const vibAbnormal = vib > equipment.warningVibration

  let status = 'ok'
  let anomalyMsg = null
  if (tempAbnormal || vibAbnormal) {
    status = 'error'
    if (tempAbnormal && temp > vib * 10) anomalyMsg = `温度异常：${temp.toFixed(0)}℃`
    else if (tempAbnormal) anomalyMsg = `温度异常：${temp.toFixed(0)}℃`
    else anomalyMsg = `震动异常：${vib.toFixed(2)}mm/s`
  } else if (temp > equipment.warningTemp * 0.85 || vib > equipment.warningVibration * 0.85) {
    status = 'warn'
  }

  return {
    temperature: Number(temp.toFixed(1)),
    vibration: Number(vib.toFixed(2)),
    status,
    anomalyMsg
  }
}

// 模拟 AI 故障预测：随机返回"将在 N 分钟内故障"的预测
export function getPredictionResult() {
  // 30% 概率出现预测维护
  if (Math.random() > 0.7) {
    const machines = equipmentList.filter(e => e.type !== 'center')
    const target = machines[Math.floor(Math.random() * machines.length)]
    const minutes = Math.floor(45 + Math.random() * 75) // 45-120 分钟
    return {
      hasPrediction: true,
      targetMachine: target,
      predictMinutes: minutes,
      confidence: Number((0.78 + Math.random() * 0.18).toFixed(2))
    }
  }
  return { hasPrediction: false }
}
