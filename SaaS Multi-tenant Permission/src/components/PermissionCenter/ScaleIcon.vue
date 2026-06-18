<template>
  <span class="scale-icon" :title="title" :style="{ width: size + 'px', height: size + 'px' }">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" :class="{ tilting: tilting }">
      <rect x="30" y="12" width="4" height="40" fill="#ad6800" rx="1" />
      <rect x="8" y="52" width="48" height="6" fill="#7c4d00" rx="2" />
      <ellipse cx="32" cy="58" rx="24" ry="2" fill="#ad6800" opacity="0.5" />
      <g class="scale-beam">
        <rect x="8" y="14" width="48" height="4" fill="#ad6800" rx="1" />
        <g class="left-pan">
          <line x1="14" y1="18" x2="8" y2="34" stroke="#ad6800" stroke-width="1.5" />
          <line x1="14" y1="18" x2="20" y2="34" stroke="#ad6800" stroke-width="1.5" />
          <ellipse cx="14" cy="36" rx="10" ry="3" fill="#e6a800" />
        </g>
        <g class="right-pan">
          <line x1="50" y1="18" x2="44" y2="34" stroke="#ad6800" stroke-width="1.5" />
          <line x1="50" y1="18" x2="56" y2="34" stroke="#ad6800" stroke-width="1.5" />
          <ellipse cx="50" cy="36" rx="10" ry="3" fill="#e6a800" />
        </g>
      </g>
      <circle cx="32" cy="14" r="3" fill="#e6a800" stroke="#7c4d00" stroke-width="1" />
    </svg>
  </span>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 22 },
  tilting: { type: Boolean, default: false },
  title: { type: String, default: '权限冲突' },
})
</script>

<style scoped>
.scale-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.scale-icon svg {
  width: 100%;
  height: 100%;
  transform-origin: 50% 50%;
}
.scale-icon svg.tilting .scale-beam {
  transform-origin: 32px 16px;
  animation: tilt-shake 1.1s ease-in-out infinite;
}
@keyframes tilt-shake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-14deg); }
  40% { transform: rotate(12deg); }
  60% { transform: rotate(-8deg); }
  80% { transform: rotate(6deg); }
}
</style>
