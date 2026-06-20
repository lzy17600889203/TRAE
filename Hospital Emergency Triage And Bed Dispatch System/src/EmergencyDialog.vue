<template>
  <el-dialog
    v-model="visible"
    custom-class="emergency-dialog"
    width="480px"
    :close-on-click-modal="false"
    :show-close="true"
    title="🚨 紧急呼叫 · EMERGENCY"
    @open="$emit('opened')"
  >
    <div class="emergency-body">
      <div class="siren"></div>
      <div class="text-main">检测到高拥挤区域</div>
      <div
        v-for="zone in zones"
        :key="zone.id"
        style="margin:14px 0;padding:14px;background:#fef0f0;border:1px dashed #fbc4c4;border-radius:8px"
      >
        <div style="font-size:16px;font-weight:600;color:#c0392b;margin-bottom:6px">
          🚨 {{ zone.name }}
        </div>
        <div class="crowd-value">
          {{ Math.round((zone.used / zone.capacity) * 100) }}%
        </div>
        <div class="text-sub">
          当前占用 {{ zone.used }} / {{ zone.capacity }} 个床位<br/>
          建议：立即分流至邻近区域 / 启动应急预案
        </div>
      </div>
    </div>
    <template #footer>
      <el-button type="danger" size="large" @click="handleAck">
        <Bell /> 已收到呼叫 · 启动响应
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Bell } from '@element-plus/icons-vue'

const props = defineProps({
  crowdedZones: { type: Array, default: () => [] }
})
const emit = defineEmits(['opened'])

const visible = ref(false)
const zones = ref([])
let lastTrigger = 0

watch(
  () => props.crowdedZones,
  (next) => {
    if (next && next.length) {
      const now = Date.now()
      if (now - lastTrigger > 15000 || !visible.value) {
        zones.value = next
        visible.value = true
        lastTrigger = now
      }
    }
  },
  { immediate: true, deep: true }
)

function handleAck() {
  visible.value = false
}
</script>
