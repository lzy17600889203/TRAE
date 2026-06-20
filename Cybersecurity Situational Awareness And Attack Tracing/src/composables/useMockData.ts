import { ref, onUnmounted } from 'vue';

export interface AttackLine {
  from: [number, number];
  to: [number, number];
  fromName: string;
  toName: string;
  isDDoS?: boolean;
}

export interface AlertItem {
  id: string;
  level: '高危' | '中危' | '低危';
  title: string;
  source: string;
  time: number;
  handled: boolean;
}

export interface ScoreItem {
  name: string;
  value: number;
  suggestion: string;
}

export interface DDoSEvent {
  active: boolean;
  targetName: string;
  targetCoord: [number, number];
  peakGbps: number;
  timestamp: number;
}

// 预定义攻击源城市坐标
const ATTACK_SOURCES: { name: string; coord: [number, number] }[] = [
  { name: 'Moscow', coord: [37.6173, 55.7558] },
  { name: 'Beijing', coord: [116.4074, 39.9042] },
  { name: 'Tokyo', coord: [139.6917, 35.6895] },
  { name: 'New York', coord: [-74.006, 40.7128] },
  { name: 'London', coord: [-0.1276, 51.5074] },
  { name: 'Sydney', coord: [151.2093, -33.8688] },
  { name: 'Sao Paulo', coord: [-46.6333, -23.5505] },
  { name: 'Cairo', coord: [31.2357, 30.0444] },
  { name: 'Mumbai', coord: [72.8777, 19.076] },
  { name: 'Seoul', coord: [126.978, 37.5665] },
  { name: 'Paris', coord: [2.3522, 48.8566] },
  { name: 'Dubai', coord: [55.2708, 25.2048] }
];

// 公司被攻击节点（目标）
const ATTACK_TARGETS: { name: string; coord: [number, number] }[] = [
  { name: 'HQ-Shanghai', coord: [121.4737, 31.2304] },
  { name: 'DC-Shenzhen', coord: [114.0579, 22.5431] },
  { name: 'DC-HongKong', coord: [114.1694, 22.3193] },
  { name: 'Branch-Singapore', coord: [103.8198, 1.3521] },
  { name: 'Branch-LosAngeles', coord: [-118.2437, 34.0522] },
  { name: 'Branch-Frankfurt', coord: [8.6821, 50.1109] }
];

const HIGH_ALERT_TITLES = [
  '检测到DDoS洪水攻击',
  'SQL注入尝试突破',
  '暴力破解登录',
  '勒索病毒特征码匹配',
  '异常流量峰值突破阈值'
];
const MEDIUM_ALERT_TITLES = ['端口扫描行为', '未授权API调用', '弱口令账户登录', '证书即将过期'];
const LOW_ALERT_TITLES = ['系统日志轮转完成', '备份任务完成', '防火墙策略变更', '常规巡检无异常'];

const SCORE_NAMES = [
  { name: '防火墙', suggestions: ['建议启用IPS深度检测', '规则库版本较旧，建议升级', '当前状态良好'] },
  { name: '入侵检测', suggestions: ['建议升级规则库至最新版本', '部分规则未启用', '建议增加威胁情报订阅'] },
  { name: '漏洞修复', suggestions: ['存在高危漏洞未修复', '扫描周期过长，建议缩短', '修复率良好'] },
  { name: '数据保护', suggestions: ['建议启用全盘加密', '敏感数据分类未完成', '备份频率不足'] },
  { name: '身份认证', suggestions: ['建议全面启用MFA', '密码策略强度不足', '单点登录配置需优化'] }
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function useMockData() {
  const attackLines = ref<AttackLine[]>([]);
  const alerts = ref<AlertItem[]>([]);
  const scores = ref<ScoreItem[]>(
    SCORE_NAMES.map((s) => ({
      name: s.name,
      value: Math.floor(randRange(55, 95)),
      suggestion: rand(s.suggestions)
    }))
  );
  const ddosEvent = ref<DDoSEvent>({
    active: false,
    targetName: '',
    targetCoord: [0, 0],
    peakGbps: 0,
    timestamp: 0
  });
  const stats = ref({ cpu: 35, bandwidth: 2.4, attackTotal: 0 });
  let alertCounter = 0;

  // 初始化一批攻击连线（不触发 DDoS）
  function seedInitialLines() {
    const seed: AttackLine[] = [];
    for (let i = 0; i < 10; i++) {
      const src = rand(ATTACK_SOURCES);
      const tgt = rand(ATTACK_TARGETS);
      seed.push({ from: src.coord, to: tgt.coord, fromName: src.name, toName: tgt.name });
    }
    attackLines.value = seed;
  }

  // 定时推入新攻击线
  const lineTimer = window.setInterval(() => {
    const src = rand(ATTACK_SOURCES);
    const tgt = rand(ATTACK_TARGETS);
    attackLines.value = [
      ...attackLines.value.slice(-40),
      { from: src.coord, to: tgt.coord, fromName: src.name, toName: tgt.name }
    ];
    stats.value.attackTotal += 1;
    stats.value.cpu = Math.max(15, Math.min(95, stats.value.cpu + (Math.random() - 0.5) * 8));
    stats.value.bandwidth = Math.max(0.5, Math.min(15, stats.value.bandwidth + (Math.random() - 0.5) * 1.2));
  }, 1200);

  // 每隔几秒推入一条告警
  const alertTimer = window.setInterval(() => {
    alertCounter += 1;
    const roll = Math.random();
    let level: AlertItem['level'] = '低危';
    if (roll < 0.35) level = '高危';
    else if (roll < 0.75) level = '中危';
    const titlePool = level === '高危' ? HIGH_ALERT_TITLES : level === '中危' ? MEDIUM_ALERT_TITLES : LOW_ALERT_TITLES;
    const src = rand(ATTACK_SOURCES);
    const newAlert: AlertItem = {
      id: `${Date.now()}-${alertCounter}`,
      level,
      title: rand(titlePool),
      source: `${src.name} / ${(Math.floor(Math.random() * 255) + 1)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      time: Date.now(),
      handled: false
    };
    alerts.value = [newAlert, ...alerts.value].slice(0, 30);
  }, 2500);

  // 每隔 3-8 秒切换 DDoS 状态
  let ddosTimer: number;
  function scheduleNextDDoS() {
    const delay = 3000 + Math.random() * 5000;
    ddosTimer = window.setTimeout(() => {
      if (ddosEvent.value.active) {
        ddosEvent.value = { ...ddosEvent.value, active: false };
      } else {
        const tgt = rand(ATTACK_TARGETS);
        ddosEvent.value = {
          active: true,
          targetName: tgt.name,
          targetCoord: tgt.coord,
          peakGbps: +randRange(5, 25).toFixed(1),
          timestamp: Date.now()
        };
        // 同时推入高危告警
        alertCounter += 1;
        const ddosAlert: AlertItem = {
          id: `ddos-${Date.now()}`,
          level: '高危',
          title: '检测到DDoS攻击，流量峰值' + ddosEvent.value.peakGbps + 'Gbps',
          source: `${tgt.name}`,
          time: Date.now(),
          handled: false
        };
        alerts.value = [ddosAlert, ...alerts.value].slice(0, 30);
        // 推入以 DDoS 目标为 to 的多条粗红连线
        const extras: AttackLine[] = [];
        for (let i = 0; i < 6; i++) {
          const src = rand(ATTACK_SOURCES);
          extras.push({
            from: src.coord,
            to: tgt.coord,
            fromName: src.name,
            toName: tgt.name,
            isDDoS: true
          });
        }
        attackLines.value = [...attackLines.value, ...extras].slice(-60);
      }
      scheduleNextDDoS();
    }, delay);
  }

  // 定时刷新评分（小波动）
  const scoreTimer = window.setInterval(() => {
    scores.value = scores.value.map((s, idx) => {
      const delta = Math.floor((Math.random() - 0.5) * 6);
      const next = Math.max(40, Math.min(100, s.value + delta));
      return {
        ...s,
        value: next,
        suggestion: next < 65 ? SCORE_NAMES[idx].suggestions[0] : rand(SCORE_NAMES[idx].suggestions)
      };
    });
  }, 5000);

  seedInitialLines();
  scheduleNextDDoS();

  onUnmounted(() => {
    clearInterval(lineTimer);
    clearInterval(alertTimer);
    clearInterval(scoreTimer);
    clearTimeout(ddosTimer);
  });

  function handleAlert(id: string) {
    const target = alerts.value.find((a) => a.id === id);
    if (target) target.handled = true;
  }

  return { attackLines, alerts, scores, ddosEvent, stats, handleAlert, ATTACK_TARGETS };
}
