import { ref, computed, nextTick } from 'vue';
import type { ChatMessage, SessionSummary } from '@/types';

// 预设敏感 / 负面词库（按强度分级）
const NEGATIVE_WORDS: { word: string; weight: number }[] = [
  { word: '骗子', weight: 1.0 },
  { word: '欺诈', weight: 1.0 },
  { word: '骗', weight: 0.9 },
  { word: '退款', weight: 0.6 },
  { word: '退货', weight: 0.5 },
  { word: '投诉', weight: 0.9 },
  { word: '315', weight: 1.0 },
  { word: '垃圾', weight: 0.8 },
  { word: '差劲', weight: 0.8 },
  { word: '太慢', weight: 0.5 },
  { word: '太慢了', weight: 0.6 },
  { word: '慢死', weight: 0.7 },
  { word: '没用', weight: 0.7 },
  { word: '无语', weight: 0.5 },
  { word: '什么鬼', weight: 0.6 },
  { word: '气死', weight: 0.9 },
  { word: '再也不', weight: 0.7 },
  { word: '倒闭', weight: 1.0 },
  { word: '骗子公司', weight: 1.0 },
  { word: '态度差', weight: 0.8 },
  { word: '服务差', weight: 0.8 },
  { word: '不解决', weight: 0.7 },
  { word: '敷衍', weight: 0.7 },
  { word: '虚假', weight: 0.9 },
  { word: '假货', weight: 0.9 },
  { word: '太差了', weight: 0.7 },
  { word: '烂', weight: 0.6 },
  { word: '滚', weight: 1.0 },
  { word: '差评', weight: 0.9 },
  { word: '举报', weight: 0.9 },
  { word: '不负责任', weight: 0.8 },
  { word: '骗人', weight: 0.9 },
  { word: '失望', weight: 0.5 },
  { word: '非常失望', weight: 0.8 },
  { word: '垃圾客服', weight: 1.0 },
];

// 正面词（用于情绪恢复）
const POSITIVE_HINTS = ['谢谢', '好的', '满意', '解决了', '辛苦', '不错', '可以了', '明白'];

function detectKeywords(text: string): { hits: string[]; negativeScore: number; positive: number } {
  const hits = new Set<string>();
  let negativeScore = 0;
  for (const entry of NEGATIVE_WORDS) {
    if (text.includes(entry.word)) {
      hits.add(entry.word);
      negativeScore = Math.max(negativeScore, entry.weight);
    }
  }
  let positive = 0;
  for (const p of POSITIVE_HINTS) {
    if (text.includes(p)) positive += 0.25;
  }
  positive = Math.min(positive, 1);
  return { hits: Array.from(hits), negativeScore, positive };
}

export function highlightNegative(text: string): string {
  let out = text;
  // 按长度倒序替换，避免短词优先替换
  const sorted = [...NEGATIVE_WORDS].sort((a, b) => b.word.length - a.word.length);
  for (const entry of sorted) {
    if (!out.includes(entry.word)) continue;
    const safe = entry.word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    out = out.replace(new RegExp(safe, 'g'), `<u class="neg-word">${entry.word}</u>`);
  }
  return out;
}

// 模拟会话脚本（真实项目里可以替换为 WebSocket / 事件流）
const SCRIPT: { delay: number; sender: 'agent' | 'customer'; text: string }[] = [
  { delay: 400, sender: 'customer', text: '你好，我昨天买的那个耳机，到现在还没发货，什么情况啊？' },
  { delay: 1500, sender: 'agent', text: '您好！非常抱歉让您久等了，请提供一下您的订单号，我马上帮您查询。' },
  { delay: 1800, sender: 'customer', text: '订单号 8823719123，你们也太慢了吧，我朋友比我晚买都到了！' },
  { delay: 1600, sender: 'agent', text: '查询到您的订单目前处于备货状态，预计今天下午会发出，预计 2-3 天到达，请您谅解。' },
  { delay: 2000, sender: 'customer', text: '又是"预计"，你们只会说这两个字吗？我上周五下单，现在已经周日晚上了！' },
  { delay: 1600, sender: 'agent', text: '真的非常抱歉，我这边帮您加急催一下仓库，并帮您申请一张 20 元无门槛优惠券作为补偿，您看可以吗？' },
  { delay: 2200, sender: 'customer', text: '20 元？你们打发叫花子呢？我不要什么优惠券，我要退款，我要退款，我要退款！' },
  { delay: 1700, sender: 'agent', text: '抱歉让您这么生气，马上帮您走退款流程，同时也会同步您的诉求给我们主管，您可以在 24 小时内到账。' },
  { delay: 2200, sender: 'customer', text: '你们就是个骗子公司，我要投诉你们，315 举报！态度差，服务差，不解决问题！' },
  { delay: 1800, sender: 'agent', text: '非常抱歉给您带来这样的体验。我立刻请主管介入，他会在 5 分钟内致电您，为您做专门跟进。' },
  { delay: 2400, sender: 'customer', text: '行，我等他电话，解决不了我直接投诉到平台！' },
  { delay: 1800, sender: 'agent', text: '好的，已为您标记为重点跟进订单。如有任何问题您随时和我说，辛苦您了。' },
  { delay: 2200, sender: 'customer', text: '行吧，等你们电话。' },
];

const AGENT_NAME = '客服·林小夏';
const CUSTOMER_NAME = '客户·周先生';

export function useSession() {
  const messages = ref<ChatMessage[]>([]);
  const currentTime = ref('');
  const isPlaying = ref(true);
  const isFinished = ref(false);
  const showSummary = ref(false);
  const summary = ref<SessionSummary>({
    responseSpeed: 82,
    serviceAttitude: 74,
    problemResolution: 60,
    professionalKnowledge: 85,
    emotionalIntelligence: 68,
    overall: 74,
    level: 'B',
  });

  // 情绪曲线数据：时间标签 vs 情绪分（基线 70，区间 0-100）
  const sentimentTime = ref<string[]>(['开始']);
  const sentimentScore = ref<number[]>([78]);
  const warningThreshold = 35;
  const supervisorTriggered = ref(false);

  // 敏感词词频
  const keywordFreq = ref<Record<string, number>>({});

  // 统计
  const totalMessages = computed(() => messages.value.length);
  const negativeCount = computed(() => messages.value.filter((m) => m.negative).length);
  const keywordKinds = computed(() => Object.keys(keywordFreq.value).length);

  // 连续负面消息计数（只看 customer 侧）
  let _consecutiveNegative = 0;

  let _timerId: number | null = null;
  let _cursor = 0;
  let _idSeq = 1;

  function tickTime() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    currentTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tickTime();
  const _clockTimer = window.setInterval(tickTime, 1000);

  function formatTime() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function appendMessage(sender: 'agent' | 'customer', text: string) {
    const { hits, negativeScore, positive } = detectKeywords(text);
    let sentimentDelta = 0;
    let isNegative = false;
    if (sender === 'customer') {
      // 基础随机波动 + 负面词惩罚 + 正面词奖励
      const base = (Math.random() - 0.5) * 4;
      const penalty = negativeScore > 0 ? -(15 + negativeScore * 28) : 0;
      const bonus = positive > 0 ? positive * 12 : 0;
      sentimentDelta = base + penalty + bonus;
      isNegative = negativeScore > 0;
      if (isNegative) {
        _consecutiveNegative += 1;
        if (_consecutiveNegative >= 3) {
          // 触发：情绪暴跌 + 主管介入
          supervisorTriggered.value = true;
          sentimentDelta = Math.min(sentimentDelta, -40);
        }
      } else {
        _consecutiveNegative = 0;
      }
    } else {
      // 客服消息对情绪曲线的轻微缓和
      sentimentDelta = Math.random() * 3 + 1;
    }

    const lastScore = sentimentScore.value[sentimentScore.value.length - 1] ?? 70;
    const nextScore = Math.max(5, Math.min(100, lastScore + sentimentDelta));
    sentimentScore.value.push(nextScore);
    sentimentTime.value.push(formatTime());

    // 累加高频词
    for (const w of hits) {
      keywordFreq.value[w] = (keywordFreq.value[w] ?? 0) + 1;
    }

    messages.value.push({
      id: _idSeq++,
      sender,
      name: sender === 'agent' ? AGENT_NAME : CUSTOMER_NAME,
      avatar: sender === 'agent' ? '👩‍💼' : '🙍‍♂️',
      time: formatTime(),
      text,
      hitKeywords: hits,
      sentiment: Number(sentimentDelta.toFixed(2)),
      negative: isNegative,
    });

    nextTick(() => {
      const el = document.querySelector('.chat-scroll-container');
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  function playNext() {
    if (!isPlaying.value) return;
    if (_cursor >= SCRIPT.length) {
      isPlaying.value = false;
      isFinished.value = true;
      // 结束后 1.5s 弹出评分
      window.setTimeout(() => {
        showSummary.value = true;
      }, 1500);
      return;
    }
    const step = SCRIPT[_cursor++];
    _timerId = window.setTimeout(() => {
      appendMessage(step.sender, step.text);
      playNext();
    }, step.delay);
  }

  // 启动
  playNext();

  function pauseToggle() {
    if (isFinished.value) return;
    isPlaying.value = !isPlaying.value;
    if (isPlaying.value) playNext();
  }

  function restart() {
    if (_timerId) window.clearTimeout(_timerId);
    messages.value = [];
    keywordFreq.value = {};
    sentimentTime.value = ['开始'];
    sentimentScore.value = [78];
    supervisorTriggered.value = false;
    showSummary.value = false;
    isFinished.value = false;
    _consecutiveNegative = 0;
    _cursor = 0;
    _idSeq = 1;
    isPlaying.value = true;
    playNext();
  }

  function closeSummary() {
    showSummary.value = false;
  }

  return {
    messages,
    currentTime,
    isPlaying,
    isFinished,
    sentimentTime,
    sentimentScore,
    warningThreshold,
    supervisorTriggered,
    keywordFreq,
    totalMessages,
    negativeCount,
    keywordKinds,
    summary,
    showSummary,
    pauseToggle,
    restart,
    closeSummary,
  };
}
