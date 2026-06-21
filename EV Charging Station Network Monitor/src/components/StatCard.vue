<template>
  <div class="stat-card">
    <div class="stat-bg-line"></div>
    <div class="stat-icon" :style="{ color }">
      <component :is="iconComp" :size="28" />
    </div>
    <div class="stat-info">
      <div class="stat-title">{{ title }}</div>
      <div class="stat-value">
        <span class="num">{{ value }}</span>
        <span class="unit">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, markRaw } from 'vue'
import * as Icons from '@element-plus/icons-vue'

const props = defineProps({
  title: String,
  value: [String, Number],
  unit: String,
  icon: String,
  color: String
})

const iconComp = computed(() => markRaw(Icons[props.icon] || Icons.Location))
</script>

<style scoped>
.stat-card {
  position: relative;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(30, 136, 229, 0.15), rgba(13, 33, 61, 0.6));
  border: 1px solid rgba(79, 195, 247, 0.25);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 14px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(79, 195, 247, 0.08);
}
.stat-bg-line {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, #4fc3f7, transparent);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border: 1px solid currentColor;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
}
.stat-title {
  color: #8ab4d8;
  font-size: 13px;
  margin-bottom: 4px;
}
.stat-value .num {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Consolas', monospace;
  letter-spacing: 1px;
}
.stat-value .unit {
  margin-left: 6px;
  color: #8ab4d8;
  font-size: 13px;
}
</style>
