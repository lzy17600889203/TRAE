<template>
  <div v-if="visible" class="warning-dialog" role="alert">
    <div class="warning-dialog__head">
      <div class="warning-dialog__icon">!</div>
      <div>
        <div style="font-size:16px;">缺货预警</div>
        <div style="font-size:12px;color:#fecaca;margin-top:2px;">实时同步 · 系统级提示</div>
      </div>
    </div>
    <div class="warning-dialog__body">
      <div v-for="a in alerts.slice(0, 3)" :key="a.warehouse + a.sku" style="margin-top:6px;">
        <b>{{ a.skuName }}</b>（{{ a.sku }}）· <span style="color:#fcd34d;">{{ a.warehouse }}</span>
        当前库存 <b>{{ a.current }}</b> / 安全阈值 {{ a.safety }}，
        <span style="color:#fecaca;">建议紧急补货！</span>
      </div>
      <div v-if="alerts.length > 3" style="margin-top:6px;color:#fecaca;">
        其余 {{ alerts.length - 3 }} 项 SKU 低于安全线，详见右侧热力图闪烁节点。
      </div>
    </div>
    <div class="warning-dialog__actions">
      <el-button size="small" @click="$emit('close')">稍后处理</el-button>
      <el-button size="small" type="danger" @click="$emit('dispatch')">一键调拨补货</el-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  alerts: { type: Array, default: () => [] }
})
defineEmits(['close', 'dispatch'])
</script>
