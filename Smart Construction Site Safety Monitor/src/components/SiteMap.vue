<template>
  <div class="site-map-wrap">
    <svg class="site-map" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,212,255,0.1)" stroke-width="1" />
        </pattern>
        <radialGradient id="dangerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,59,74,0.55)" />
          <stop offset="70%" stop-color="rgba(255,59,74,0.18)" />
          <stop offset="100%" stop-color="rgba(255,59,74,0.02)" />
        </radialGradient>
        <radialGradient id="dangerGradOrange" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,112,67,0.45)" />
          <stop offset="70%" stop-color="rgba(255,112,67,0.15)" />
          <stop offset="100%" stop-color="rgba(255,112,67,0.02)" />
        </radialGradient>
        <radialGradient id="dangerGradYellow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,183,77,0.45)" />
          <stop offset="70%" stop-color="rgba(255,183,77,0.15)" />
          <stop offset="100%" stop-color="rgba(255,183,77,0.02)" />
        </radialGradient>
        <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="1000" height="650" fill="url(#grid)" />

      <g class="site-outline">
        <rect x="30" y="30" width="940" height="590" fill="rgba(0,212,255,0.03)"
          stroke="rgba(0,212,255,0.4)" stroke-dasharray="6 4" rx="12" />
        <text x="48" y="55" fill="#8aa2c0" font-size="12">工地边界 · A3 地块</text>
        <text x="48" y="635" fill="#8aa2c0" font-size="11">N ↑</text>
      </g>

      <g class="buildings">
        <rect x="380" y="300" width="160" height="160" rx="6"
          fill="rgba(18,230,168,0.08)" stroke="rgba(18,230,168,0.45)" />
        <text x="400" y="385" fill="#12e6a8" font-size="14" font-weight="700">主体楼</text>
        <rect x="740" y="380" width="120" height="120" rx="6"
          fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.4)" />
        <text x="760" y="445" fill="#00d4ff" font-size="12" font-weight="700">办公楼</text>
        <rect x="420" y="500" width="180" height="80" rx="6"
          fill="rgba(255,192,66,0.08)" stroke="rgba(255,192,66,0.4)" />
        <text x="450" y="545" fill="#ffc042" font-size="12" font-weight="700">材料堆放区</text>
      </g>

      <g class="danger-zones">
        <g v-for="z in zones" :key="z.id" class="zone" :class="'zone-' + z.type">
          <rect :x="z.x" :y="z.y" :width="z.w" :height="z.h" rx="8"
            :fill="
              z.type === 'highAltitude' ? 'url(#dangerGrad)' :
              z.type === 'hoist' ? 'url(#dangerGradOrange)' : 'url(#dangerGradYellow)'
            "
            :stroke="z.color" stroke-width="2" stroke-dasharray="8 4"
            filter="url(#glowRed)" />
          <text :x="z.x + 10" :y="z.y + 22" :fill="z.color" font-size="13" font-weight="700">
            ⚠ {{ z.name }}
          </text>
          <text :x="z.x + 10" :y="z.y + z.h - 10" fill="#ffd6d6" font-size="11">
            危险区域 · 禁未佩戴防护用品
          </text>
        </g>
      </g>

      <g class="workers">
        <g v-for="w in enrichedWorkers" :key="w.id"
           class="worker" :class="{ danger: w.danger, severe: w.severe }">
          <g v-if="w.danger || w.severe" class="radar-wrap" :transform="`translate(${w.x}, ${w.y})`">
            <circle class="radar r1" :r="18" />
            <circle class="radar r2" :r="28" />
            <circle class="radar r3" :r="38" />
          </g>
          <circle :cx="w.x" :cy="w.y" r="9"
            :fill="w.severe ? '#ff3b4a' : (w.danger ? '#ff3b4a' : '#12e6a8')"
            stroke="#fff" stroke-width="2" filter="url(#glowRed)" />
          <circle :cx="w.x" :cy="w.y" r="14" fill="none"
            :stroke="w.severe ? '#ff3b4a' : (w.danger ? '#ff3b4a' : 'rgba(18,230,168,0.4)')"
            stroke-width="1" opacity="0.6" />
          <text :x="w.x + 14" :y="w.y - 10" class="worker-label"
            :fill="w.severe ? '#ff9aa4' : (w.danger ? '#ffb6b6' : '#c8ffec')" font-size="11">
            {{ w.name }} · {{ w.team }}{{ w.group ? '·' + w.group : '' }}
          </text>
        </g>
      </g>
    </svg>

    <div
      v-for="w in bubbles"
      :key="w.id"
      class="bubble"
      :class="{ severe: w.severe }"
      :style="{ left: `calc(${(w.x / 1000) * 100}% + 14px)`, top: `calc(${(w.y / 650) * 100}% - 8px)` }"
    >
      <span class="icon">{{ w.severe ? '🚨' : '⚠️' }}</span>
      <span class="name">{{ w.name }}（{{ w.team }}{{ w.group ? '·' + w.group : '' }}）</span>
      <span class="text">
        {{ w.severe ? '未系安全带进入高空作业区' : '未戴安全帽进入' + w.zone.name }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'

const props = defineProps({
  workers: { type: Array, required: true },
  zones: { type: Array, required: true }
})
const emit = defineEmits(['incident', 'severe'])

const reportedIds = ref(new Set())

const enrichedWorkers = computed(() =>
  props.workers.map((w) => {
    const zone = props.zones.find((z) =>
      w.x >= z.x && w.x <= z.x + z.w && w.y >= z.y && w.y <= z.y + z.h
    )
    let danger = false
    let severe = false
    if (zone) {
      if (zone.type === 'highAltitude' && !w.harnessWorn) severe = true
      else if (!w.helmetWorn) danger = true
    }
    return { ...w, zone, danger, severe }
  })
)

const bubbles = computed(() =>
  enrichedWorkers.value.filter((w) => w.danger || w.severe)
)

watch(
  enrichedWorkers,
  (list) => {
    list.forEach((w) => {
      const key = `${w.id}-${w.zone?.id}-${w.severe ? 's' : 'd'}`
      if ((w.danger || w.severe) && !reportedIds.value.has(key)) {
        reportedIds.value.add(key)
        if (w.severe) {
          emit('severe', {
            worker: { id: w.id, name: w.name, team: w.team, group: w.group },
            zone: w.zone,
            reason: '未系安全带'
          })
        } else {
          emit('incident', {
            worker: { id: w.id, name: w.name, team: w.team, group: w.group },
            zone: w.zone,
            reason: '未戴安全帽'
          })
        }
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
.site-map-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  background: radial-gradient(600px 400px at 30% 20%, rgba(0,212,255,0.08), transparent 60%), #0a1628;
}
.site-map {
  width: 100%;
  height: 100%;
  display: block;
}

.zone rect {
  animation: zone-pulse 2.4s ease-in-out infinite;
}
@keyframes zone-pulse {
  0%, 100% { stroke-opacity: 0.9; }
  50% { stroke-opacity: 0.4; }
}

.worker .radar {
  fill: none;
  stroke: #ff3b4a;
  stroke-width: 2;
  opacity: 0;
  transform-origin: center;
  transform-box: fill-box;
}
.worker .radar.r1 { animation: radar 2s ease-out infinite; }
.worker .radar.r2 { animation: radar 2s ease-out 0.6s infinite; }
.worker .radar.r3 { animation: radar 2s ease-out 1.2s infinite; }

@keyframes radar {
  0% { r: 10; opacity: 0.9; stroke-width: 3; }
  100% { r: 60; opacity: 0; stroke-width: 1; }
}

.worker.severe .radar { stroke: #ff0018; }
.worker.danger circle:nth-child(2),
.worker.severe circle:nth-child(2) {
  animation: ring-pulse 1.6s ease-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes ring-pulse {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}

.bubble {
  position: absolute;
  transform: translateY(-100%);
  background: linear-gradient(135deg, rgba(255, 59, 74, 0.95), rgba(255, 89, 100, 0.85));
  color: #fff;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(255, 59, 74, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.25);
  pointer-events: none;
  animation: bubble-in 0.3s ease-out;
  z-index: 5;
}
.bubble.severe {
  background: linear-gradient(135deg, #b3000c, #ff3b4a);
  box-shadow: 0 0 28px rgba(255, 0, 24, 0.7);
}
.bubble::after {
  content: '';
  position: absolute;
  left: 10px;
  bottom: -6px;
  width: 10px;
  height: 10px;
  background: inherit;
  transform: rotate(45deg);
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}
.bubble .icon { margin-right: 4px; }
.bubble .name { font-weight: 700; margin-right: 4px; }

.worker-label {
  font-weight: 600;
  paint-order: stroke fill;
  stroke: rgba(10, 22, 40, 0.8);
  stroke-width: 3;
  user-select: none;
}

.worker.danger .worker-label,
.worker.severe .worker-label {
  stroke: rgba(40, 0, 8, 0.85);
  stroke-width: 3;
}

@keyframes bubble-in {
  from { opacity: 0; transform: translateY(-80%) scale(0.8); }
  to { opacity: 1; transform: translateY(-100%) scale(1); }
}
</style>
