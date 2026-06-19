const LS_CUSTOM = 'mpp.customPlatforms.v1'
const LS_BINDINGS = 'mpp.bindings.v1'

export const builtinPlatforms = [
  { key: 'wechat', name: '微信公众号', short: '微信', letter: '微', color: '#07C160', builtin: true },
  { key: 'xiaohongshu', name: '小红书', short: '小红书', letter: '红', color: '#FE2C55', builtin: true },
  { key: 'zhihu', name: '知乎', short: '知乎', letter: '知', color: '#0084FF', builtin: true },
  { key: 'weibo', name: '微博', short: '微博', letter: '博', color: '#E6162D', builtin: true },
  { key: 'bilibili', name: '哔哩哔哩', short: 'B站', letter: 'B', color: '#FB7299', builtin: true },
  { key: 'douyin', name: '抖音', short: '抖音', letter: '抖', color: '#161823', builtin: true },
  { key: 'toutiao', name: '今日头条', short: '头条', letter: '头', color: '#F04142', builtin: true },
  { key: 'csdn', name: 'CSDN', short: 'CSDN', letter: 'C', color: '#FC5531', builtin: true },
  { key: 'tieba', name: '百度贴吧', short: '贴吧', letter: '贴', color: '#2319DC', builtin: true },
  { key: 'tianya', name: '天涯论坛', short: '天涯', letter: '天', color: '#1D94D1', builtin: true },
  { key: 'hupu', name: '虎扑', short: '虎扑', letter: '虎', color: '#E60012', builtin: true },
  { key: 'douban', name: '豆瓣', short: '豆瓣', letter: '豆', color: '#2EA44F', builtin: true }
]

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function loadCustomPlatforms() {
  return safeRead(LS_CUSTOM, [])
}

export function saveCustomPlatforms(list) {
  safeWrite(LS_CUSTOM, list || [])
}

export function loadBindings() {
  return safeRead(LS_BINDINGS, {})
}

export function saveBindings(map) {
  safeWrite(LS_BINDINGS, map || {})
}

export function getAllPlatforms() {
  const customs = loadCustomPlatforms().map((p) => ({ ...p, custom: true }))
  return [...builtinPlatforms, ...customs]
}

export function generateTrendFor(keys) {
  const dates = ['06-13', '06-14', '06-15', '06-16', '06-17', '06-18', '06-19']
  const knownBase = {
    wechat: [1200, 1580, 1820, 2100, 2450, 2780, 3120],
    xiaohongshu: [820, 1100, 1450, 1820, 2260, 2510, 2930],
    zhihu: [640, 880, 1120, 1410, 1680, 1950, 2210],
    weibo: [980, 1260, 1480, 1760, 2020, 2180, 2340],
    bilibili: [560, 780, 1020, 1260, 1540, 1780, 2040],
    douyin: [1480, 1920, 2380, 2860, 3320, 3680, 4120],
    toutiao: [720, 920, 1160, 1420, 1680, 1860, 2120],
    csdn: [320, 450, 580, 720, 860, 980, 1120],
    tieba: [620, 780, 940, 1120, 1280, 1420, 1580],
    tianya: [180, 240, 300, 360, 420, 480, 540],
    hupu: [460, 580, 720, 860, 1020, 1180, 1320],
    douban: [380, 460, 560, 660, 780, 880, 1020]
  }

  const series = {}
  keys.forEach((k) => {
    if (knownBase[k]) {
      series[k] = knownBase[k]
    } else {
      const seed = (k.charCodeAt(0) || 50) + (k.length || 5)
      const base = 200 + (seed % 500)
      const step = 40 + (seed % 80)
      series[k] = dates.map((_, i) => Math.round(base + step * i * (0.8 + ((seed + i) % 5) / 10)))
    }
  })

  return { dates, series }
}

export function genKey(prefix = 'custom') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}
