<script setup lang="ts">
import type { ChatMessage } from '@/types';
import { highlightNegative } from '@/composables/useSession';

defineProps<{
  messages: ChatMessage[];
}>();
</script>

<template>
  <div class="chat-scroll-container">
    <div v-if="messages.length === 0" class="chat-empty">
      <div class="dot-pulse" />
      <span>正在接入会话…</span>
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
        </div>
        <div class="bubble" v-html="highlightNegative(m.text)"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-empty {
  margin: auto;
  color: var(--text-3);
  display: flex;
  gap: 10px;
  align-items: center;
}

.dot-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
  animation: pulse 1.6s infinite ease-in-out;
}
@keyframes pulse {
  0%, 100% { transform: scale(0.85); opacity: 0.55; }
  50% { transform: scale(1.15); opacity: 1; }
}

.chat-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  max-width: 85%;
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

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  background: linear-gradient(135deg, rgba(53, 194, 255, 0.12) 0%, rgba(53, 194, 255, 0.04) 100%);
  border: 1px solid rgba(53, 194, 255, 0.28);
  color: var(--text-1);
  word-break: break-word;
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
</style>
