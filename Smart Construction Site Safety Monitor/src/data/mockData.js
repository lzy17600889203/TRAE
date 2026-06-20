export const dangerZones = [
  {
    id: 'hoist',
    name: '吊装区',
    type: 'hoist',
    x: 180,
    y: 140,
    w: 180,
    h: 140,
    color: '#ff7043'
  },
  {
    id: 'highAltitude',
    name: '高空作业区',
    type: 'highAltitude',
    x: 620,
    y: 90,
    w: 220,
    h: 180,
    color: '#ff3b4a'
  },
  {
    id: 'foundation',
    name: '深基坑',
    type: 'foundation',
    x: 120,
    y: 420,
    w: 260,
    h: 160,
    color: '#ffb74d'
  }
]

export const initialWorkers = [
  { id: 'w1', name: '张三', team: '一队', x: 260, y: 210, helmetWorn: false, harnessWorn: true },
  { id: 'w2', name: '李四', team: '一队', x: 320, y: 260, helmetWorn: true, harnessWorn: true },
  { id: 'w3', name: '王五', team: '二队', x: 680, y: 170, helmetWorn: true, harnessWorn: false },
  { id: 'w4', name: '赵六', team: '二队', x: 760, y: 220, helmetWorn: true, harnessWorn: true },
  { id: 'w5', name: '钱七', team: '三队', x: 230, y: 490, helmetWorn: false, harnessWorn: true },
  { id: 'w6', name: '孙八', team: '三队', x: 300, y: 520, helmetWorn: true, harnessWorn: true },
  { id: 'w7', name: '周九', team: '四队', x: 520, y: 360, helmetWorn: true, harnessWorn: true },
  { id: 'w8', name: '吴十', team: '四队', x: 580, y: 420, helmetWorn: true, harnessWorn: true },
  { id: 'w9', name: '郑十一', team: '一队', x: 460, y: 200, helmetWorn: true, harnessWorn: true },
  { id: 'w10', name: '冯十二', team: '三队', x: 200, y: 470, helmetWorn: true, harnessWorn: true }
]

export const initialTeamViolations = [
  { team: '一队', count: 12 },
  { team: '二队', count: 8 },
  { team: '三队', count: 15 },
  { team: '四队', count: 6 }
]
