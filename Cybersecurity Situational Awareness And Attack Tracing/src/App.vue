<script setup lang="ts">
import { onMounted } from 'vue';
import { useMockData } from '@/composables/useMockData';
import StatusBar from '@/components/StatusBar.vue';
import AttackMap from '@/components/AttackMap.vue';
import AlertList from '@/components/AlertList.vue';
import SecurityRadar from '@/components/SecurityRadar.vue';

const { attackLines, alerts, scores, ddosEvent, stats, handleAlert, ATTACK_TARGETS } = useMockData();

// 让 Element Plus 暗色主题立即生效（避免默认亮色闪烁）
onMounted(() => {
  document.documentElement.classList.add('dark');
});
</script>

<template>
  <div class="dashboard-root">
    <div class="grid-bg"></div>
    <StatusBar :stats="stats" :ddos-event="ddosEvent" />
    <main class="dashboard-main">
      <aside class="col col-left">
        <AlertList :alerts="alerts" @handle="handleAlert" />
      </aside>
      <section class="col col-center">
        <AttackMap :attack-lines="attackLines" :ddos-event="ddosEvent" :targets="ATTACK_TARGETS" />
      </section>
      <aside class="col col-right">
        <SecurityRadar :scores="scores" />
      </aside>
    </main>
    <footer class="dashboard-footer">
      <span>SOC · Real-time Threat Monitor</span>
      <span>© 2026 Security Ops Center</span>
    </footer>
  </div>
</template>

<style scoped>
.dashboard-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  min-height: 680px;
  padding: 14px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  overflow: hidden;
}
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}
.dashboard-main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(520px, 2.3fr) minmax(300px, 1.1fr);
  gap: 12px;
  z-index: 1;
}
.col {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.dashboard-footer {
  display: flex;
  justify-content: space-between;
  color: #5a8cc0;
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  z-index: 1;
  padding: 0 4px;
}
</style>
