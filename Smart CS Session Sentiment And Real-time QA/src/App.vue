<script setup lang="ts">
import { computed } from 'vue';
import { useSession } from '@/composables/useSession';
import ChatPanel from '@/components/ChatPanel.vue';
import SentimentChart from '@/components/SentimentChart.vue';
import KeywordCloud from '@/components/KeywordCloud.vue';
import RadarSummary from '@/components/RadarSummary.vue';

const {
  messages, currentTime, isFinished, showSummary, agentThinking,
  sentimentTime, sentimentScore, warningThreshold, supervisorTriggered,
  keywordFreq, totalMessages, negativeCount, keywordKinds,
  summary,
  sendCustomerMessage, sendAgentMessage,
  endSession, restart, closeSummary,
} = useSession();

const latestScore = computed(() => sentimentScore.value[sentimentScore.value.length - 1] ?? 70);
const sentimentLabel = computed(() => {
  if (supervisorTriggered.value) return { text: '极度不满 · 已触发主管介入', color: '#ff5d5d' };
  if (latestScore.value >= 70) return { text: '良好', color: '#7effb2' };
  if (latestScore.value >= 50) return { text: '平稳', color: '#35c2ff' };
  if (latestScore.value >= warningThreshold.value) return { text: '波动', color: '#ffb545' };
  return { text: '警告', color: '#ff5d5d' };
});
</script>

<template>
  <div class="workbench">
    <!-- 顶部标题栏 -->
    <header class="topbar">
      <div class="brand">
        <span class="logo-dot"></span>
        <div class="title-wrap">
          <span class="title">智能客服会话 · 实时质检工作台</span>
          <span class="sub">SmartCS · Real-time Sentiment Analysis System — 您是客户，系统扮演客服</span>
        </div>
      </div>
      <div class="top-stats">
        <div class="stat">
          <div class="k">{{ totalMessages }}</div>
          <div class="v">会话消息</div>
        </div>
        <div class="stat warn">
          <div class="k">{{ negativeCount }}</div>
          <div class="v">负面消息</div>
        </div>
        <div class="stat">
          <div class="k">{{ keywordKinds }}</div>
          <div class="v">敏感词种类</div>
        </div>
        <div class="stat score" :style="{ borderColor: sentimentLabel.color }">
          <div class="k" :style="{ color: sentimentLabel.color }">{{ latestScore }}</div>
          <div class="v">{{ sentimentLabel.text }}</div>
        </div>
        <div class="stat time">
          <div class="k">{{ currentTime }}</div>
          <div class="v">系统时间</div>
        </div>
      </div>
    </header>

    <!-- 主管介入横幅 -->
    <transition name="banner">
      <div v-if="supervisorTriggered && !isFinished" class="supervisor-banner">
        <span class="icon">⚠</span>
        <span class="txt-strong">客户情绪极度不满，建议主管介入</span>
        <span class="txt-sub">检测到客户连续发送 3 条以上包含负面关键词的消息，情绪指数跌破警戒线 {{ warningThreshold }}，请立即接管会话安抚客户。</span>
        <el-button type="warning" size="small" @click="endSession">结束会话并评分</el-button>
      </div>
    </transition>

    <!-- 主体网格 -->
    <section class="grid-main">
      <!-- 左侧：聊天 -->
      <div class="panel chat-panel">
        <div class="panel-head">
          <span class="panel-title"><span>会话实时监听</span></span>
          <div class="ctrl">
            <el-tag :type="isFinished ? 'info' : (supervisorTriggered ? 'danger' : 'success')" effect="dark" size="small">
              {{ isFinished ? '会话已结束' : (supervisorTriggered ? '触发主管介入' : '实时质检中') }}
            </el-tag>
            <el-button size="small" type="warning" :disabled="isFinished" @click="endSession">
              结束会话并评分
            </el-button>
            <el-button size="small" type="primary" @click="restart">重新开始</el-button>
          </div>
        </div>
        <ChatPanel
          :messages="messages"
          :agent-thinking="agentThinking"
          :is-finished="isFinished"
          :on-send-customer="sendCustomerMessage"
          :on-send-agent="sendAgentMessage"
        />
      </div>

      <!-- 右上：情绪折线图 -->
      <div class="panel chart-panel">
        <div class="panel-head">
          <span class="panel-title"><span>客户情绪波动曲线</span></span>
          <div class="legend">
            <span class="dot-demo good"></span>正常区间
            <span class="dot-demo warn"></span>警戒线 {{ warningThreshold }}
            <span class="dot-demo bad" :class="{ on: supervisorTriggered }"></span>危机状态
          </div>
        </div>
        <div class="chart-box">
          <SentimentChart
            :times="sentimentTime"
            :scores="sentimentScore"
            :threshold="warningThreshold"
            :supervisor-triggered="supervisorTriggered"
          />
        </div>
      </div>

      <!-- 底部：敏感词词云 -->
      <div class="panel cloud-panel">
        <div class="panel-head">
          <span class="panel-title"><span>高频敏感 / 负面关键词词云</span></span>
          <div class="sub-info">实时抓取客户消息中的高风险关键词 · 命中次数越多字号越大</div>
        </div>
        <div class="chart-box">
          <KeywordCloud :freq="keywordFreq" />
        </div>
      </div>
    </section>

    <!-- 会话结束：雷达图评分弹层 -->
    <transition name="fade">
      <div v-if="showSummary" class="summary-overlay" @click.self="closeSummary">
        <div class="summary-card">
          <div class="summary-head">
            <div>
              <div class="summary-title">会话质检报告 · AI 自动评分</div>
              <div class="summary-sub">共 {{ messages.length }} 条消息 · 客户负面消息 {{ negativeCount }} 条 · 命中敏感词 {{ keywordKinds }} 类</div>
            </div>
            <div class="overall">
              <div class="overall-score">{{ summary.overall }}</div>
              <div class="overall-level" :data-level="summary.level">{{ summary.level }} 级</div>
              <div class="overall-label">综合评分</div>
            </div>
          </div>
          <div class="summary-body">
            <RadarSummary :summary="summary" />
            <div class="summary-score-list">
              <div class="score-row"><span>响应速度</span><el-progress :percentage="summary.responseSpeed" color="#35c2ff" :stroke-width="10" /></div>
              <div class="score-row"><span>服务态度</span><el-progress :percentage="summary.serviceAttitude" color="#7effb2" :stroke-width="10" /></div>
              <div class="score-row"><span>问题解决率</span><el-progress :percentage="summary.problemResolution" color="#ffb545" :stroke-width="10" /></div>
              <div class="score-row"><span>专业知识</span><el-progress :percentage="summary.professionalKnowledge" color="#c89bff" :stroke-width="10" /></div>
              <div class="score-row"><span>共情能力</span><el-progress :percentage="summary.emotionalIntelligence" color="#ff9ecb" :stroke-width="10" /></div>
            </div>
          </div>
          <div class="summary-foot">
            <el-button type="primary" @click="restart">重新开始会话</el-button>
            <el-button @click="closeSummary">关闭</el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.workbench {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  gap: 10px;
  overflow: hidden;
}

/* ===== Topbar ===== */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(29, 45, 72, 0.8) 0%, rgba(17, 26, 46, 0.8) 100%);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  position: relative;
}
.topbar::before, .topbar::after {
  content: '';
  position: absolute;
  width: 20px; height: 20px;
  border: 2px solid var(--accent);
}
.topbar::before { top: -2px; left: -2px; border-right: none; border-bottom: none; }
.topbar::after  { bottom: -2px; right: -2px; border-left: none; border-top: none; }

.brand { display: flex; align-items: center; gap: 12px; }
.title-wrap { display: flex; flex-direction: column; gap: 2px; }
.logo-dot {
  width: 12px; height: 12px; background: var(--accent);
  box-shadow: 0 0 14px var(--accent); transform: rotate(45deg);
}
.title { font-size: 17px; font-weight: 700; letter-spacing: 0.08em; color: var(--text-1); }
.sub { font-size: 11px; color: var(--text-3); letter-spacing: 0.1em; }

.top-stats { display: flex; gap: 12px; }
.stat {
  min-width: 88px;
  padding: 5px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: rgba(17, 26, 46, 0.6);
  text-align: right;
}
.stat .k { font-size: 18px; font-weight: 700; color: var(--accent); line-height: 1.2; }
.stat .v { font-size: 10.5px; color: var(--text-3); letter-spacing: 0.1em; }
.stat.warn .k { color: var(--warn); }
.stat.score .k { text-shadow: 0 0 10px currentColor; }

/* ===== Supervisor banner ===== */
.supervisor-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  background: linear-gradient(90deg, rgba(255, 181, 69, 0.2) 0%, rgba(255, 93, 93, 0.18) 100%);
  border: 1.5px solid #ffb545;
  border-radius: 8px;
  box-shadow: 0 0 24px rgba(255, 181, 69, 0.3), inset 0 0 12px rgba(255, 181, 69, 0.1);
  animation: bannerFlash 1.2s ease-in-out infinite alternate;
}
.supervisor-banner .icon {
  font-size: 22px; color: #ffb545; text-shadow: 0 0 12px #ffb545;
}
.txt-strong { font-size: 15px; font-weight: 700; color: #ffd36a; letter-spacing: 0.08em; white-space: nowrap; }
.txt-sub { flex: 1; font-size: 12px; color: var(--text-2); }
@keyframes bannerFlash {
  0% { box-shadow: 0 0 24px rgba(255, 181, 69, 0.25), inset 0 0 12px rgba(255, 181, 69, 0.08); }
  100% { box-shadow: 0 0 40px rgba(255, 93, 93, 0.55), inset 0 0 18px rgba(255, 181, 69, 0.18); }
}
.banner-enter-active { animation: bannerIn 0.5s ease-out; }
.banner-leave-active { animation: bannerIn 0.3s ease-in reverse; }
@keyframes bannerIn {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ===== Main grid ===== */
.grid-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  min-height: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(29, 45, 72, 0.65) 0%, rgba(17, 26, 46, 0.8) 100%);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  min-height: 0;
}
.panel::before {
  content: '';
  position: absolute;
  top: 0; left: 16px;
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
  opacity: 0.55;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.ctrl { display: flex; gap: 8px; align-items: center; }

.chat-panel { grid-row: span 2; }
.chart-panel { grid-column: 2; grid-row: 1; }
.cloud-panel { grid-column: 2; grid-row: 2; }

.legend { display: flex; gap: 12px; font-size: 11px; color: var(--text-3); }
.dot-demo { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
.dot-demo.good { background: #35c2ff; box-shadow: 0 0 6px #35c2ff; }
.dot-demo.warn { background: #ffb545; box-shadow: 0 0 6px #ffb545; }
.dot-demo.bad { background: #4a2d3a; border: 1px solid #774058; }
.dot-demo.bad.on { background: #ff5d5d; box-shadow: 0 0 10px #ff5d5d; border: none; }

.chart-box {
  flex: 1;
  min-height: 0;
  padding: 6px 8px;
}
.sub-info { font-size: 11px; color: var(--text-3); }

/* ===== Summary overlay ===== */
.summary-overlay {
  position: fixed; inset: 0;
  background: rgba(5, 9, 18, 0.68);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 99;
}
.summary-card {
  width: min(820px, 92vw);
  max-height: 90vh;
  overflow: auto;
  background: linear-gradient(180deg, rgba(29, 45, 72, 0.95) 0%, rgba(17, 26, 46, 0.98) 100%);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(53, 194, 255, 0.2) inset;
}
.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid var(--line);
}
.summary-title { font-size: 18px; font-weight: 700; letter-spacing: 0.08em; }
.summary-sub { font-size: 12px; color: var(--text-3); margin-top: 4px; }
.overall { display: flex; flex-direction: column; align-items: center; min-width: 120px; padding-left: 20px; border-left: 1px dashed var(--line-strong); }
.overall-score { font-size: 42px; font-weight: 800; color: var(--gold); text-shadow: 0 0 18px rgba(255, 211, 106, 0.5); line-height: 1; }
.overall-level { font-size: 13px; letter-spacing: 0.2em; color: var(--gold); margin-top: 4px; }
.overall-label { font-size: 11px; color: var(--text-3); letter-spacing: 0.2em; margin-top: 2px; }

.summary-body {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 14px;
  padding: 18px 22px;
  align-items: center;
}
.summary-score-list { display: flex; flex-direction: column; gap: 14px; }
.score-row { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--text-2); }

.summary-foot {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 22px 18px;
  border-top: 1px solid var(--line);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.35s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 1080px) {
  .grid-main { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr 1fr; }
  .chat-panel { grid-row: auto; }
  .chart-panel, .cloud-panel { grid-column: auto; grid-row: auto; }
}
</style>
