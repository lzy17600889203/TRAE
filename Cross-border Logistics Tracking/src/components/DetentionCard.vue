<template>
  <div class="detention-card" :class="{ 'shake': isShaking }">
    <div class="detention-head">
      <div class="detention-title">
        <el-icon class="alarm"><Warning /></el-icon>
        <span>⚠️ 包裹被扣留</span>
      </div>
      <el-icon class="close" @click="$emit('close')"><Close /></el-icon>
    </div>

    <div class="detention-body">
      <div class="row">
        <span class="label">包裹号</span>
        <span class="value bold">{{ pkg.id }}</span>
      </div>
      <div class="row">
        <span class="label">路径</span>
        <span class="value">{{ pkg.origin }} → {{ pkg.destination }}</span>
      </div>
      <div class="row">
        <span class="label">原因</span>
        <span class="value warn">{{ customsNode?.inspection?.reason }}</span>
      </div>
      <div class="row">
        <span class="label">已滞留</span>
        <span class="value danger">{{ customsNode?.stuckHours }} 小时</span>
      </div>
    </div>

    <div class="detention-actions">
      <el-button size="small" type="danger" plain>立即处理</el-button>
      <el-button size="small" text @click="$emit('close')">稍后查看</el-button>
    </div>

    <div class="pulse-ring"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Warning, Close } from '@element-plus/icons-vue'

const props = defineProps({
  package: { type: Object, required: true }
})
defineEmits(['close'])

const pkg = props.package
const customsNode = pkg.nodes.find((n) => n.key === 'customs')
const isShaking = ref(true)

onMounted(() => {
  setTimeout(() => (isShaking.value = false), 700)
})
</script>

<style scoped>
.detention-card {
  position: fixed;
  right: 28px;
  bottom: 28px;
  width: 340px;
  background: linear-gradient(180deg, #2a1620 0%, #1a0f18 100%);
  border: 2px solid #F56C6C;
  border-radius: 14px;
  padding: 16px 18px 14px;
  box-shadow: 0 10px 40px rgba(245, 108, 108, 0.35), 0 0 0 4px rgba(245, 108, 108, 0.12);
  z-index: 2000;
  overflow: hidden;
}

.detention-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.detention-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffd1d1;
  font-weight: 700;
  font-size: 15px;
}

.alarm {
  color: #F56C6C;
}

.close {
  color: #ffb4b4;
  cursor: pointer;
}

.close:hover {
  color: #fff;
}

.detention-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 2px 4px;
  border-top: 1px dashed rgba(245, 108, 108, 0.3);
  border-bottom: 1px dashed rgba(245, 108, 108, 0.3);
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.label {
  color: #ffb4b4;
}

.value {
  color: #fff;
  text-align: right;
}

.value.bold {
  font-weight: 700;
}

.value.warn {
  color: #ffd591;
}

.value.danger {
  color: #F56C6C;
  font-weight: 700;
}

.detention-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6);
  animation: pulse 1.8s ease-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.55); }
  100% { box-shadow: 0 0 0 22px rgba(245, 108, 108, 0); }
}
</style>
