<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '紧急预警' },
  detail: { type: String, default: '' },
  level: { type: String, default: 'danger' }
})
const emit = defineEmits(['close'])
</script>

<template>
  <transition name="banner">
    <div v-if="show" class="alert-banner" :class="level">
      <span class="alert-icon blink">⚠️</span>
      <div class="alert-content">
        <div class="alert-title">{{ title }}</div>
        <div class="alert-detail" v-if="detail">{{ detail }}</div>
      </div>
      <div class="alert-actions">
        <el-button size="small" type="warning" plain @click="emit('close')">已阅处理</el-button>
        <el-button size="small" type="danger" @click="emit('close')">立即处置</el-button>
      </div>
      <span class="alert-close" @click="emit('close')">✕</span>
    </div>
  </transition>
</template>

<style scoped>
.alert-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  margin: 0 24px 16px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(90deg, #ff3b3b 0%, #ff6b6b 50%, #ff3b3b 100%);
  background-size: 200% 100%;
  animation: bannerSlide 4s ease-in-out infinite;
  box-shadow: 0 6px 24px #ff3b3b66;
  border: 1px solid #ff6b6b;
  position: relative;
  overflow: hidden;
}
.alert-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 12px,
    #ffffff14 12px,
    #ffffff14 24px
  );
  pointer-events: none;
}
@keyframes bannerSlide {
  0%, 100% { background-position: 0% 0; }
  50% { background-position: 100% 0; }
}

.alert-icon {
  font-size: 28px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 6px #fff);
}
.alert-icon.blink {
  animation: blink 1s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.7; }
}

.alert-content { flex: 1; min-width: 0; }
.alert-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.alert-detail {
  font-size: 13px;
  opacity: 0.95;
  margin-top: 4px;
}

.alert-actions { display: flex; gap: 8px; }
.alert-close {
  cursor: pointer;
  font-size: 16px;
  padding: 0 6px;
  opacity: 0.85;
  transition: opacity 0.2s;
}
.alert-close:hover { opacity: 1; }

.banner-enter-active, .banner-leave-active {
  transition: transform 0.45s ease, opacity 0.35s ease;
}
.banner-enter-from, .banner-leave-to {
  transform: translateY(-30px);
  opacity: 0;
}
</style>
