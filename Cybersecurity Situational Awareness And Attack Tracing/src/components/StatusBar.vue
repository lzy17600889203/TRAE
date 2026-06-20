<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Activity, Cpu, Wifi, Zap } from 'lucide-vue-next';
import type { DDoSEvent } from '@/composables/useMockData';

const props = defineProps<{
  stats: { cpu: number; bandwidth: number; attackTotal: number };
  ddosEvent: DDoSEvent;
}>();

const now = ref(new Date());
let t: number;
onMounted(() => {
  t = window.setInterval(() => (now.value = new Date()), 1000);
});
onBeforeUnmount(() => clearInterval(t));

function fmt(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
</script>

<template>
  <header class="status-bar">
    <div class="brand">
      <div class="brand-logo">
        <Zap :size="22" color="#00d4ff" />
      </div>
      <div class="brand-text">
        <div class="brand-name">安全态势感知 · 指挥中心</div>
        <div class="brand-sub">SECURITY SITUATIONAL AWARENESS DASHBOARD</div>
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-icon"><Cpu :size="16" /></div>
        <div class="metric-body">
          <div class="metric-label">CPU 负载</div>
          <div class="metric-value" :class="{ warn: stats.cpu > 80 }">{{ stats.cpu.toFixed(1) }}%</div>
        </div>
      </div>
      <div class="metric">
        <div class="metric-icon"><Wifi :size="16" /></div>
        <div class="metric-body">
          <div class="metric-label">出口带宽</div>
          <div class="metric-value">{{ stats.bandwidth.toFixed(2) }} Gbps</div>
        </div>
      </div>
      <div class="metric">
        <div class="metric-icon"><Activity :size="16" /></div>
        <div class="metric-body">
          <div class="metric-label">攻击总数</div>
          <div class="metric-value attack">{{ stats.attackTotal }}</div>
        </div>
      </div>
    </div>

    <div class="right-area">
      <div class="clock">{{ fmt(now) }}</div>
      <div v-if="ddosEvent.active" class="ddos-banner">
        <span class="ddos-icon">⚠</span>
        <span class="ddos-text">
          检测到 DDoS 攻击 · 目标：<b>{{ ddosEvent.targetName }}</b> · 流量峰值
          <b>{{ ddosEvent.peakGbps }} Gbps</b>
        </span>
      </div>
      <div v-else class="ddos-banner idle">
        <span>● 系统正常 · 威胁监视中</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.status-bar {
  display: grid;
  grid-template-columns: 280px 1fr 1fr;
  gap: 20px;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(180deg, rgba(10, 25, 49, 0.9), rgba(6, 18, 37, 0.7));
  border: 1px solid #1e4d80;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 212, 255, 0.08);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.04));
  border: 1px solid rgba(0, 212, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 14px rgba(0, 212, 255, 0.35);
}
.brand-name {
  color: #e6f1ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
}
.brand-sub {
  font-family: 'Orbitron', monospace;
  color: #00d4ff;
  font-size: 10px;
  letter-spacing: 2px;
  margin-top: 2px;
  opacity: 0.85;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.metric {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
}
.metric-icon {
  color: #00d4ff;
}
.metric-label {
  font-size: 11px;
  color: #9fc2e8;
  letter-spacing: 1px;
}
.metric-value {
  font-family: 'Orbitron', monospace;
  font-size: 17px;
  font-weight: 700;
  color: #00d4ff;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}
.metric-value.warn {
  color: #ffb347;
  text-shadow: 0 0 8px rgba(255, 179, 71, 0.6);
}
.metric-value.attack {
  color: #ff7a7a;
  text-shadow: 0 0 8px rgba(255, 59, 59, 0.6);
}

.right-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
.clock {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  color: #9fc2e8;
  letter-spacing: 2px;
}

.ddos-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  background: linear-gradient(90deg, rgba(255, 59, 59, 0.25), rgba(255, 59, 59, 0.08));
  border: 1px solid rgba(255, 59, 59, 0.6);
  color: #ff5a5a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  animation: bannerPulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(255, 59, 59, 0.35);
}
.ddos-banner b {
  color: #fff;
  font-family: 'Orbitron', monospace;
}
.ddos-icon {
  font-size: 14px;
}
@keyframes bannerPulse {
  0%, 100% { box-shadow: 0 0 18px rgba(255, 59, 59, 0.3); }
  50% { box-shadow: 0 0 28px rgba(255, 59, 59, 0.6); }
}
.ddos-banner.idle {
  background: rgba(0, 212, 255, 0.06);
  border-color: rgba(0, 212, 255, 0.4);
  color: #55c7e8;
  animation: none;
  box-shadow: none;
  font-weight: 500;
}
</style>
