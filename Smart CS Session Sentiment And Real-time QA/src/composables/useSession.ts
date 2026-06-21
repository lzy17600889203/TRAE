import { ref, computed, nextTick } from 'vue';
import type { ChatMessage, SessionSummary } from '@/types';

// ================= 负面 / 敏感词库（按强度分级） =================
const NEGATIVE_WORDS: { word: string; weight: number }[] = [
  { word: '骗子公司', weight: 1.0 }, { word: '垃圾客服', weight: 1.0 },
  { word: '骗子', weight: 1.0 }, { word: '欺诈', weight: 1.0 },
  { word: '315', weight: 1.0 }, { word: '倒闭', weight: 1.0 },
  { word: '滚', weight: 1.0 }, { word: '骗', weight: 0.9 },
  { word: '投诉', weight: 0.9 }, { word: '差评', weight: 0.9 },
  { word: '举报', weight: 0.9 }, { word: '骗人', weight: 0.9 },
  { word: '虚假', weight: 0.9 }, { word: '假货', weight: 0.9 },
  { word: '气死', weight: 0.9 }, { word: '垃圾', weight: 0.8 },
  { word: '差劲', weight: 0.8 }, { word: '态度差', weight: 0.8 },
  { word: '服务差', weight: 0.8 }, { word: '不解决', weight: 0.7 },
  { word: '敷衍', weight: 0.7 }, { word: '太差了', weight: 0.7 },
  { word: '慢死', weight: 0.7 }, { word: '没用', weight: 0.7 },
  { word: '再也不', weight: 0.7 }, { word: '不负责任', weight: 0.8 },
  { word: '什么鬼', weight: 0.6 }, { word: '退款', weight: 0.6 },
  { word: '太慢了', weight: 0.6 }, { word: '退货', weight: 0.5 },
  { word: '太慢', weight: 0.5 }, { word: '无语', weight: 0.5 },
  { word: '失望', weight: 0.5 }, { word: '非常失望', weight: 0.8 },
  { word: '烂', weight: 0.6 },
];

// 正面词（用于情绪恢复 + 客服自动应答触发）
const POSITIVE_HINTS = ['谢谢', '好的', '满意', '解决了', '辛苦', '不错', '可以了', '明白', '感谢', 'OK', 'ok'];

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
  return { hits: Array.from(hits), negativeScore, positive: Math.min(positive, 1) };
}

export function highlightNegative(text: string): string {
  let out = text;
  const sorted = [...NEGATIVE_WORDS].sort((a, b) => b.word.length - a.word.length);
  for (const entry of sorted) {
    if (!out.includes(entry.word)) continue;
    const safe = entry.word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    out = out.replace(new RegExp(safe, 'g'), `<u class="neg-word">${entry.word}</u>`);
  }
  return out;
}

// ================= 客服自动应答引擎（关键词匹配） =================
// 返回一条与当前客户语义大致匹配的客服回复。
// 为避免"机械式"重复，每个关键词下提供多条候选，随机取一条。
const AGENT_REPLY_RULES: { match: RegExp; replies: string[] }[] = [
  {
    match: /(订单号|单号|订单)/,
    replies: [
      '好的，麻烦提供一下您的订单号，我立刻为您查询。',
      '收到，请告知订单号，我来帮您跟进。',
    ],
  },
  {
    match: /(发货|没发货|没发|发货慢|快递|物流)/,
    replies: [
      '非常抱歉让您久等，我这里帮您加急催一下仓库，今天内会为您发出，物流信息稍后会同步到您的订单页。',
      '理解您的着急，我马上联系仓库优先处理，并给您发送一张 10 元无门槛券作为补偿，您看可以吗？',
    ],
  },
  {
    match: /(退款|退货|退钱|不要了|取消)/,
    replies: [
      '好的，我现在为您发起退款流程，款项将在 24 小时内原路退回，请稍候。',
      '已为您记录退款需求，如您方便的话也可以直接在订单页点击"申请退款"，退款会在 1-2 个工作日到账。',
    ],
  },
  {
    match: /(投诉|315|举报|差评)/,
    replies: [
      '非常抱歉让您产生这样的感受，我马上请主管介入处理，稍后 5 分钟内会有同事电话联系您，为您提供专属跟进。',
      '理解您的不满，我已将您的诉求升级为高级别工单，客服主管会优先处理，您可以留下电话号码以便回电。',
    ],
  },
  {
    match: /(骗子|骗人|欺诈|假货|虚假|骗子公司)/,
    replies: [
      '非常抱歉给您带来这样的误解，我们所有商品均为官方正品，支持 7 天无理由退换。如您方便，我可以马上提供货源凭证或为您安排全额退款。',
      '真的非常抱歉，我们是正规品牌直营店。为表达歉意，我将为您全额退款并赠送一张 50 元优惠券，希望能重新获得您的信任。',
    ],
  },
  {
    match: /(慢|太慢|等很久|很久|延迟|拖延)/,
    replies: [
      '真的非常抱歉让您等这么久，我这边为您设置了加急标签，并把您的情况同步给主管，保证今天之内有明确进展。',
      '理解您的不快，我们确实在流程上有待改进。我会督促相关同事优先处理，并为您提供优先客服通道，后续您随时可以直接找我。',
    ],
  },
  {
    match: /(价格|贵|便宜|优惠|券|多少钱)/,
    replies: [
      '目前这款商品正在做限时活动，我可以给您赠送一张价值 20 元的专属优惠券，请您稍等片刻，我马上发放到您的账户。',
      '我来帮您查看一下当前优惠：商品本身已经是活动价 ￥299，再叠加平台满减券后是 ￥259，性价比非常高，建议您尽快下单哦。',
    ],
  },
  {
    match: /(质量|坏|故障|不能用|坏了|瑕疵|做工)/,
    replies: [
      '非常抱歉商品出现问题，我们支持 7 天无理由退换，并承担往返运费。麻烦您拍照反馈，我会立即为您开启售后流程。',
      '我们非常重视品质问题，我马上让质检同事跟进，并为您安排快速换货或全额退款，由您来选择。',
    ],
  },
  {
    match: /(你好|您好|在吗|在不在|HI|hello)/i,
    replies: [
      '您好！很高兴为您服务，请问有什么可以帮到您？',
      '您好，我是客服小林，请问需要咨询订单、售后还是活动信息呢？',
    ],
  },
  {
    match: /(谢谢|感谢|辛苦)/,
    replies: [
      '不客气，能帮到您是我的荣幸，祝您购物愉快！',
      '感谢您的理解与支持，如有任何问题欢迎随时找我。',
    ],
  },
  {
    match: /(电话|回电|联系我|号码|手机号)/,
    replies: [
      '好的，已经记录下您的联系方式，我们同事会在 10 分钟内致电您，请保持电话畅通。',
    ],
  },
];

const AGENT_FALLBACK = [
  '好的，我已记下您的情况，正在核实信息，稍后给您一个明确答复。',
  '感谢您提供的信息，我们会在 24 小时内给出处理方案，期间您可随时来问我进展。',
  '明白您的意思，我先去和相关同事同步一下，马上回来给您答复。',
];

function generateAgentReply(customerText: string, prevMessages: ChatMessage[]): string {
  for (const rule of AGENT_REPLY_RULES) {
    if (rule.match.test(customerText)) {
      return rule.replies[Math.floor(Math.random() * rule.replies.length)];
    }
  }
  // 如之前客服已经连续用 fallback 兜底 2 次以上，则换个更主动的说法
  const recentAgent = prevMessages.filter((m) => m.sender === 'agent').slice(-2);
  if (recentAgent.length >= 2 && recentAgent.every((m) => AGENT_FALLBACK.some((f) => f === m.text))) {
    return '为了更好地帮您，方便补充一下订单号或具体问题描述吗？我一定给您一个明确的方案。';
  }
  return AGENT_FALLBACK[Math.floor(Math.random() * AGENT_FALLBACK.length)];
}

// ================= 常量 / 角色配置 =================
const AGENT_NAME = '客服·林小夏';
const CUSTOMER_NAME = '客户·您';

// ================= 主 composable =================
export function useSession() {
  const messages = ref<ChatMessage[]>([]);
  const currentTime = ref('');
  const isFinished = ref(false);
  const showSummary = ref(false);
  const agentThinking = ref(false); // 客服"正在输入"状态

  const summary = ref<SessionSummary>({
    responseSpeed: 85,
    serviceAttitude: 80,
    problemResolution: 70,
    professionalKnowledge: 85,
    emotionalIntelligence: 75,
    overall: 79,
    level: 'B',
  });

  const sentimentTime = ref<string[]>(['开始']);
  const sentimentScore = ref<number[]>([78]);
  const warningThreshold = 35;
  const supervisorTriggered = ref(false);

  const keywordFreq = ref<Record<string, number>>({});

  const totalMessages = computed(() => messages.value.length);
  const negativeCount = computed(() => messages.value.filter((m) => m.negative).length);
  const keywordKinds = computed(() => Object.keys(keywordFreq.value).length);

  let _consecutiveNegative = 0;
  let _idSeq = 1;
  let _lastAgentReplyAt = 0;

  function tickTime() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    currentTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tickTime();
  window.setInterval(tickTime, 1000);

  function formatTime() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function appendMessage(sender: 'agent' | 'customer', text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { hits, negativeScore, positive } = detectKeywords(trimmed);
    let sentimentDelta = 0;
    let isNegative = false;

    if (sender === 'customer') {
      const base = (Math.random() - 0.5) * 3;
      const penalty = negativeScore > 0 ? -(12 + negativeScore * 28) : 0;
      const bonus = positive > 0 ? positive * 12 : 0;
      sentimentDelta = base + penalty + bonus;
      isNegative = negativeScore > 0;
      if (isNegative) {
        _consecutiveNegative += 1;
        if (_consecutiveNegative >= 3) {
          supervisorTriggered.value = true;
          sentimentDelta = Math.min(sentimentDelta, -40);
        }
      } else {
        _consecutiveNegative = 0;
      }
    } else {
      // 客服回复：轻微拉高情绪；若包含抱歉/补偿字眼，多一些恢复
      const good = /(抱歉|不好意思|马上|立即|优惠券|补偿|优先|主管)/.test(trimmed) ? 6 : 2;
      sentimentDelta = good + Math.random() * 2;
      _lastAgentReplyAt = Date.now();
    }

    const lastScore = sentimentScore.value[sentimentScore.value.length - 1] ?? 70;
    const nextScore = Math.max(5, Math.min(100, lastScore + sentimentDelta));
    sentimentScore.value.push(nextScore);
    sentimentTime.value.push(formatTime());

    for (const w of hits) {
      keywordFreq.value[w] = (keywordFreq.value[w] ?? 0) + 1;
    }

    messages.value.push({
      id: _idSeq++,
      sender,
      name: sender === 'agent' ? AGENT_NAME : CUSTOMER_NAME,
      avatar: sender === 'agent' ? '👩‍💼' : '🙍‍♂️',
      time: formatTime(),
      text: trimmed,
      hitKeywords: hits,
      sentiment: Number(sentimentDelta.toFixed(2)),
      negative: isNegative,
    });

    nextTick(() => {
      const el = document.querySelector('.chat-scroll-container') as HTMLElement | null;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  // ========== 用户触发的公开方法 ==========
  function sendCustomerMessage(text: string) {
    if (isFinished.value) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    appendMessage('customer', trimmed);
    // 让客服自动回复（带"正在输入"的延迟），让体验像真实对话
    agentThinking.value = true;
    const delay = 700 + Math.min(2200, trimmed.length * 40) + Math.random() * 600;
    window.setTimeout(() => {
      const reply = generateAgentReply(trimmed, messages.value);
      appendMessage('agent', reply);
      agentThinking.value = false;
    }, delay);
  }

  // 也允许手动扮演客服（例如用户想自己发客服消息）
  function sendAgentMessage(text: string) {
    if (isFinished.value) return;
    if (!text.trim()) return;
    appendMessage('agent', text);
  }

  function endSession() {
    if (isFinished.value) return;
    isFinished.value = true;
    // 依据会话数据动态计算质检评分
    const total = messages.value.length;
    const agentMsgs = messages.value.filter((m) => m.sender === 'agent');
    const customerMsgs = messages.value.filter((m) => m.sender === 'customer');
    const neg = customerMsgs.filter((m) => m.negative).length;
    const negRatio = customerMsgs.length > 0 ? neg / customerMsgs.length : 0;

    // 响应速度：客服消息越多 / 平均响应间隔越短 越高
    const responseSpeed = Math.max(
      30,
      Math.min(100, Math.round(60 + agentMsgs.length * 3 - Math.min(neg, 5) * 6))
    );
    // 服务态度：负面消息比例越高越低
    const serviceAttitude = Math.max(20, Math.min(100, Math.round(90 - negRatio * 90)));
    // 问题解决率：会话末尾是否有"谢谢/可以了/满意"等信号
    const tail = customerMsgs.slice(-2).map((m) => m.text).join(' ');
    const resolved = /(谢谢|好的|满意|解决了|可以了|明白|感谢)/.test(tail) ? 1 : 0;
    const problemResolution = Math.max(20, Math.min(100, Math.round(50 + resolved * 30 + (1 - negRatio) * 20)));
    // 专业知识：客服消息数量与长度（近似代表信息量）
    const agentInfo = agentMsgs.reduce((sum, m) => sum + m.text.length, 0);
    const professionalKnowledge = Math.max(40, Math.min(100, Math.round(60 + Math.min(agentInfo / 60, 35))));
    // 共情能力：客服回复中出现"抱歉/理解/马上"等字眼的比例
    const empathyHits = agentMsgs.filter((m) => /(抱歉|理解|非常|马上|立即|主管|您的|辛苦)/.test(m.text)).length;
    const emotionalIntelligence = Math.max(30, Math.min(100, Math.round(
      50 + (agentMsgs.length ? empathyHits / agentMsgs.length : 0) * 50 - negRatio * 20
    )));

    const overall = Math.round(
      (responseSpeed * 0.2 + serviceAttitude * 0.25 + problemResolution * 0.25
       + professionalKnowledge * 0.15 + emotionalIntelligence * 0.15)
    );
    const level: SessionSummary['level'] =
      overall >= 90 ? 'S' : overall >= 80 ? 'A' : overall >= 70 ? 'B' : overall >= 55 ? 'C' : 'D';

    summary.value = {
      responseSpeed,
      serviceAttitude,
      problemResolution,
      professionalKnowledge,
      emotionalIntelligence,
      overall,
      level,
    };

    window.setTimeout(() => {
      showSummary.value = true;
    }, 700);
  }

  function restart() {
    messages.value = [];
    keywordFreq.value = {};
    sentimentTime.value = ['开始'];
    sentimentScore.value = [78];
    supervisorTriggered.value = false;
    showSummary.value = false;
    isFinished.value = false;
    agentThinking.value = false;
    _consecutiveNegative = 0;
    _idSeq = 1;
    _lastAgentReplyAt = 0;
  }

  function closeSummary() {
    showSummary.value = false;
  }

  return {
    messages,
    currentTime,
    isFinished,
    showSummary,
    agentThinking,
    sentimentTime,
    sentimentScore,
    warningThreshold,
    supervisorTriggered,
    keywordFreq,
    totalMessages,
    negativeCount,
    keywordKinds,
    summary,
    sendCustomerMessage,
    sendAgentMessage,
    endSession,
    restart,
    closeSummary,
  };
}
