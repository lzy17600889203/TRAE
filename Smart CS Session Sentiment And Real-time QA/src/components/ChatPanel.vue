<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ChatMessage } from '@/types';
import { highlightNegative } from '@/composables/useSession';

const props = defineProps<{
  messages: ChatMessage[];
  agentThinking: boolean;
  isFinished: boolean;
  onSendCustomer: (text: string) => void;
  onSendAgent?: (text: string) => void;
}>();

const inputText = ref('');
const agentText = ref('');
const mode = ref<'customer' | 'agent'>('customer'); // 默认扮演客户

function submit() {
  const text = inputText.value.trim();
  if (!text) return;
  props.onSendCustomer(text);
  inputText.value = '';
}

function submitAgent() {
  if (!props.onSendAgent) return;
  const text = agentText.value.trim();
  if (!text) return;
  props.onSendAgent(text);
  agentText.value = '';
}

// 回车发送，Shift+回车换行
function onKey(e: KeyboardEvent, which: 'customer' | 'agent') {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (which === 'customer') submit();
    else submitAgent();
  }
}

// 自动滚动
watch(
  () => props.messages.length,
  () => {
    const el = document.querySelector('.chat-scroll-container') as HTMLElement | null;
    if (el) el.scrollTop = el.scrollHeight;
  }
);
</script>

<template>
  <div class="chat-panel-wrap">
    <div class="chat-scroll-container">
      <div v-if="messages.length === 0" class="chat-empty">
        <div class="hint-card">
          <div class="hint-title">👋 欢迎进入实时质检工作台</div>
          <div class="hint-line">· 您当前扮演 <b>客户</b>；在下方输入框里打字发送，系统会自动扮演客服回复。</div>
          <div class="hint-line">· 右侧面板会实时绘制情绪曲线，底部展示敏感词云。</div>
          <div class="hint-line">· 当检测到您连续发送 <b>3 条</b> 含负面词汇的消息时，顶部会弹出"主管介入"横幅。</div>
          <div class="hint-line">· 会话结束后，点右上角的 <b>结束会话并评分</b> 可弹出五维雷达图质检报告。</div>
          <div class="hint-examples">试试这样说："你好，我的订单什么时候发货？" → "太慢了，等一周了" → "骗子公司！我要退款投诉 315！"</div>
        </div>
      </div>
      <div
        v-for="m in messages"
        :key="m.id"
        class="chat-msg"
        :class="[m.sender === 'agent' ? 'agent-side' : 'customer-side', { negative: m.negative }]"
      >
        <div class="avatar" :class="m.sender">{{ m.avatar }}</div>
        <div class="bubble-wrap">
          <div class="meta">
            <span class="name">{{ m.name }}</span>
            <span class="time">{{ m.time }}</span>
            <span v-if="m.negative" class="neg-tag">⚠ 负面</span>
            <span v-else-if="m.hitKeywords.length > 0 && m.sender === 'agent'" class="pos-tag">♥ 命中关键词</span>
          </div>
          <div class="bubble" v-html="highlightNegative(m.text)"></div>
        </div>
      </div>
      <div v-if="agentThinking" class="chat-msg agent-side thinking">
        <div class="avatar agent">👩‍💼</div>
        <div class="bubble-wrap">
          <div class="meta"><span class="name">客服·林小夏</span><span class="time">正在输入</span></div>
          <div class="bubble thinking-bubble">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="role-switch">
        <button :class="{ active: mode === 'customer' }" @click="mode = 'customer'">🙍‍♂ 我是客户</button>
        <button :class="{ active: mode === 'agent' }" @click="mode = 'agent'">👩‍💼 我是客服</button>
      </div>

      <div v-if="mode === 'customer'" class="input-row">
        <textarea
          v-model="inputText"
          :disabled="isFinished"
          placeholder="以客户身份输入消息，回车发送 / Shift+回车换行，系统会自动扮演客服回复…"
          rows="2"
          @keydown="onKey($event, 'customer')"
        />
        <button class="send-btn customer" :disabled="isFinished || !inputText.trim()" @click="submit">
          发送 <span class="kbd">↵</span>
        </button>
      </div>

      <div v-else class="input-row">
        <textarea
          v-model="agentText"
          :disabled="isFinished"
          placeholder="手动扮演客服回复 — 适合演示/教学场景（发送后不会再触发系统自动回复）"
          rows="2"
          @keydown="onKey($event, 'agent')"
        />
        <button class="send-btn agent" :disabled="isFinished || !agentText.trim()" @click="submitAgent">
          以客服身份发送 <span class="kbd">↵</span>
        </button>
      </div>

      <div v-if="isFinished" class="finished-banner">⚠ 会话已结束，点右上角"重新开始"开启新一轮质检。</div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.chat-empty {
  margin: auto;
  max-width: 520px;
}
.hint-card {
  background: linear-gradient(180deg, rgba(29, 45, 72, 0.85), rgba(17, 26, 46, 0.85));
  border: 1px dashed rgba(120, 160, 220, 0.4);
  border-radius: 12px;
  padding: 18px 20px;
  color: var(--text-2);
}
.hint-title { font-size: 15px; color: var(--text-1); margin-bottom: 10px; }
.hint-line { font-size: 12.5px; line-height: 1.9; }
.hint-examples {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(53, 194, 255, 0.06);
  border: 1px solid rgba(53, 194, 255, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: #8fd9ff;
}

.chat-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  max-width: 92%;
}
.agent-side { align-self: flex-start; }
.customer-side { align-self: flex-end; flex-direction: row-reverse; }

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: linear-gradient(135deg, #1d2d48 0%, #284774 100%);
  border: 1px solid var(--line-strong);
  flex-shrink: 0;
}
.avatar.customer { background: linear-gradient(135deg, #3a1f2b 0%, #6b2f3f 100%); }

.bubble-wrap { display: flex; flex-direction: column; gap: 6px; max-width: 100%; }
.meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-3); }
.customer-side .meta { flex-direction: row-reverse; }
.meta .name { color: var(--text-2); font-weight: 600; letter-spacing: 0.05em; }
.neg-tag {
  color: #ffd36a;
  background: rgba(255, 181, 69, 0.12);
  border: 1px solid rgba(255, 181, 69, 0.4);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  letter-spacing: 0.05em;
}
.pos-tag {
  color: #7effb2;
  background: rgba(126, 255, 178, 0.1);
  border: 1px solid rgba(126, 255, 178, 0.4);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  background: linear-gradient(135deg, rgba(53, 194, 255, 0.12) 0%, rgba(53, 194, 255, 0.04) 100%);
  border: 1px solid rgba(53, 194, 255, 0.28);
  color: var(--text-1);
  word-break: break-word;
  white-space: pre-wrap;
}
.customer-side .bubble {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-color: var(--line-strong);
}
.chat-msg.negative .bubble {
  border-color: rgba(255, 93, 93, 0.55);
  background: linear-gradient(135deg, rgba(255, 93, 93, 0.14) 0%, rgba(255, 93, 93, 0.04) 100%);
  box-shadow: 0 0 14px rgba(255, 93, 93, 0.12);
}
.bubble :deep(.neg-word) {
  color: #ff6b6b;
  text-decoration: underline;
  text-decoration-color: #ff6b6b;
  text-underline-offset: 3px;
  background: rgba(255, 107, 107, 0.12);
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 600;
}

.thinking .thinking-bubble {
  background: rgba(255, 255, 255, 0.03);
  border-style: dashed;
  min-width: 80px;
}
.dot {
  display: inline-block;
  width: 6px; height: 6px;
  background: var(--text-3);
  border-radius: 50%;
  margin: 0 3px;
  animation: blink 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

.chat-input-area {
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(17, 26, 46, 0.7), rgba(10, 15, 28, 0.85));
  padding: 12px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-switch {
  display: flex;
  gap: 6px;
}
.role-switch button {
  padding: 6px 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.role-switch button:hover { border-color: rgba(53, 194, 255, 0.5); color: var(--text-1); }
.role-switch button.active {
  background: rgba(53, 194, 255, 0.15);
  border-color: var(--accent);
  color: #e5f6ff;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}
.input-row textarea {
  flex: 1;
  padding: 10px 12px;
  background: rgba(10, 15, 28, 0.7);
  color: var(--text-1);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-row textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(53, 194, 255, 0.15);
}
.input-row textarea:disabled { opacity: 0.5; cursor: not-allowed; }

.send-btn {
  min-width: 120px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  color: #fff;
  transition: all 0.15s;
}
.send-btn.customer { background: linear-gradient(135deg, #35c2ff, #0079bf); box-shadow: 0 4px 14px rgba(53, 194, 255, 0.25); }
.send-btn.agent { background: linear-gradient(135deg, #6b2f3f, #b55); box-shadow: 0 4px 14px rgba(187, 85, 85, 0.25); }
.send-btn:hover { transform: translateY(-1px); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
.kbd {
  display: inline-block;
  margin-left: 4px;
  padding: 1px 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-size: 11px;
}

.finished-banner {
  text-align: center;
  font-size: 12px;
  color: #ffd36a;
  background: rgba(255, 181, 69, 0.1);
  border: 1px solid rgba(255, 181, 69, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
}
</style>
