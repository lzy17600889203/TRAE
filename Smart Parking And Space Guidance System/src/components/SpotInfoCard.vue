<template>
  <div v-if="visible" class="info-card" :style="positionStyle">
    <div class="row">
      <div class="spot-id">车位编号 · {{ spot.id }}</div>
      <span class="close-x" @click="$emit('close')">✕</span>
    </div>
    <div class="plate" v-if="spot.plate">{{ spot.plate }}</div>
    <div class="plate" v-else style="color:#67e8a8">—— 空闲 ——</div>
    <div class="time">
      <el-icon><Clock /></el-icon>
      &nbsp;入场时间：{{ spot.inTime || '--:--' }}
    </div>
    <div class="btn-row">
      <el-button type="primary" size="default" :icon="Location" @click="onFind">寻车导航</el-button>
      <el-button size="default" :icon="Close" @click="$emit('close')">关闭</el-button>
    </div>
    <div class="empty-hint" v-if="!spot.plate">
      此车位目前空闲，可直接驶入停放。
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, Close, Clock } from '@element-plus/icons-vue'

const props = defineProps({
  spot: { type: Object, required: true },
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 100, y: 100 }) }
})

defineEmits(['close'])

const positionStyle = computed(() => ({
  left: Math.min(props.position.x, window.innerWidth - 340) + 'px',
  top: Math.min(props.position.y, window.innerHeight - 280) + 'px'
}))

function onFind () {
  if (props.spot.plate) {
    ElMessage.success(`已为 ${props.spot.plate} 规划导航路线 → ${props.spot.id}`)
  } else {
    ElMessage.info(`正在为您导航至空闲车位 ${props.spot.id}`)
  }
}
</script>
