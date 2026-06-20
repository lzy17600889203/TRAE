<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle, ShieldAlert, Info, Clock, Zap } from 'lucide-vue-next';
import type { AlertItem } from '@/composables/useMockData';

const props = defineProps<{ alerts: AlertItem[] }>();
const emit = defineEmits<{ (e: 'handle', id: string): void }>();

function formatTime(t: number) {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const levelMeta: Record<AlertItem['level'], { color: string; bg: string; border: string; glow: string; icon: any; tag: string }> = {
  '高危': {
    color: '#ff3b3b',
    bg: 'rgba(255,59,59,0.10)',
    border: 'rgba(255,59,59,0.45)',
    glow: '0 0 16px rgba(255,59,59,0.35)',
    icon: AlertTriangle,
    tag: 'danger'
  },
  '中危': {
    color: '#ffb347',
    bg: 'rgba(255,179,71,0.10)',
    border: 'rgba(255,179,71,0.35)',
    glow: '0 0 10px rgba(255,179,71,0.2)',
    icon: ShieldAlert,
    tag: 'warning'
  },
  '低危': {
    color: '#00d4ff',
    bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.3)',
    glow: 'none',
    icon: Info,
    tag: 'info'
  }
};

const unhandledCount = computed(() => props.alerts.filter((a) => a.level === '高危' && !a.handled).length);
</script>

<template>
  <section class="alert-list">
    <header class="alerts-header">
      <div class="header-left">
        <Zap :size="18" color="#00d4ff" />
        <span class="title">实时告警</span>
      </div>
      <div class="header-right">
        <span v-if="unhandledCount > 0" class="pulse-badge">高危 {{ unhandledCount }}</span>
        <span class="total">共 {{ alerts.length }} 条</span>
      </div>
    </header>

    <div class="alerts-scroll">
      <transition-group name="alert-pop">
        <div
          v-for="item in alerts"
          :key="item.id"
          class="alert-card"
          :class="[`level-${item.level}`, { handled: item.handled }]"
          :style="{
            '--lv-color': levelMeta[item.level].color,
            '--lv-bg': levelMeta[item.level].bg,
            '--lv-border': levelMeta[item.level].border,
            '--lv-glow': levelMeta[item.level].glow
          }"
        >
          <div class="card-icon">
            <component :is="levelMeta[item.level].icon" :size="18" />
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <span class="card-title">{{ item.title }}</span>
              <span class="card-tag">{{ item.level }}</span>
            </div>
            <div class="card-meta">
              <span class="meta-item">
                <ShieldAlert :size="11" />
                {{ item.source }}
              </span>
              <span class="meta-item">
                <Clock :size="11" />
                {{ formatTime(item.time) }}
              </span>
            </div>
          </div>
          <button
            v-if="item.level === '高危' && !item.handled"
            class="handle-btn"
            @click="emit('handle', item.id)"
          >
            立即处理
          </button>
          <span v-else-if="item.handled" class="handled-tag">已处理</span>
        </div>
      </transition-group>

      <div v-if="alerts.length === 0" class="empty">暂无告警</div>
    </div>
  </section>
</template>

<style scoped>
.alert-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(12, 30, 58, 0.7), rgba(6, 18, 37, 0.7));
  border: 1px solid #1e4d80;
  border-radius: 10px;
  overflow: hidden;
}
.alerts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(30, 77, 128, 0.6);
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.08), transparent);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  color: #e6f1ff;
  font-weight: 700;
  letter-spacing: 2px;
  font-size: 15px;
}
.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: #9fc2e8;
}
.pulse-badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 59, 59, 0.2);
  color: #ff5a5a;
  border: 1px solid rgba(255, 59, 59, 0.5);
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  animation: pulseRed 1.2s ease-in-out infinite;
}
@keyframes pulseRed {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 59, 59, 0.4); }
  50% { box-shadow: 0 0 16px rgba(255, 59, 59, 0.6); }
}

.alerts-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.alerts-scroll::-webkit-scrollbar {
  width: 6px;
}
.alerts-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.25);
  border-radius: 3px;
}

.alert-card {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 10px 12px;
  background: var(--lv-bg);
  border: 1px solid var(--lv-border);
  border-left: 3px solid var(--lv-color);
  border-radius: 6px;
  box-shadow: var(--lv-glow);
  transition: transform 0.2s ease, box-shadow 0.3s ease;
}
.alert-card.level-高危 {
  animation: dangerPulse 1.8s ease-in-out infinite;
}
@keyframes dangerPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 59, 59, 0.25); }
  50% { box-shadow: 0 0 18px rgba(255, 59, 59, 0.55); }
}
.alert-card.handled {
  opacity: 0.55;
  filter: grayscale(0.3);
}

.card-icon {
  color: var(--lv-color);
  padding-top: 2px;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card-title {
  color: #e6f1ff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-tag {
  flex-shrink: 0;
  padding: 1px 8px;
  font-size: 10px;
  border-radius: 999px;
  color: var(--lv-color);
  border: 1px solid var(--lv-color);
  font-family: 'Orbitron', monospace;
  font-weight: 700;
}
.card-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #8fb3d8;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.handle-btn {
  flex-shrink: 0;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #fff;
  background: linear-gradient(135deg, #ff3b3b, #c21e1e);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(255, 59, 59, 0.45);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.handle-btn:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 0 18px rgba(255, 59, 59, 0.8);
}
.handled-tag {
  flex-shrink: 0;
  font-size: 11px;
  color: #5a8cc0;
  align-self: center;
}

.empty {
  color: #5a8cc0;
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  letter-spacing: 2px;
}

/* 动画 */
.alert-pop-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}
.alert-pop-enter-active {
  transition: all 0.35s ease;
}
.alert-pop-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
.alert-pop-leave-active {
  transition: all 0.25s ease;
}
</style>
