<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="(v) => $emit('update:visible', v)"
    title="海关查验详情"
    direction="rtl"
    size="480px"
    class="inspection-drawer"
  >
    <div v-if="pkg" class="drawer-content">
      <div class="pkg-summary">
        <el-tag type="warning" effect="dark" round>海关清关</el-tag>
        <span class="pkg-id">{{ pkg.id }}</span>
        <span class="pkg-route">{{ pkg.origin }} → {{ pkg.destination }}</span>
      </div>

      <el-descriptions :column="1" border size="default" class="desc">
        <el-descriptions-item label="查验类型">
          {{ inspection?.type || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="查验原因">
          {{ inspection?.reason || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="负责专员">
          {{ inspection?.officer || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="抵达时间">
          {{ customsNode?.arrivedAt || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="滞留时长">
          <b style="color:#E6A23C">{{ customsNode?.stuckHours || 0 }} 小时</b>
        </el-descriptions-item>
        <el-descriptions-item label="节点备注">
          {{ customsNode?.note || '—' }}
        </el-descriptions-item>
      </el-descriptions>

      <h4 class="section-title">需提交材料</h4>
      <el-timeline>
        <el-timeline-item
          v-for="(doc, i) in (inspection?.documents || [])"
          :key="doc"
          :timestamp="`第 ${i + 1} 项`"
          placement="top"
          color="#E6A23C"
        >
          {{ doc }}
        </el-timeline-item>
      </el-timeline>

      <div class="action-row">
        <el-button type="primary">联系海关专员</el-button>
        <el-button type="warning">上传补充材料</el-button>
        <el-button>标记已处理</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  package: { type: Object, default: null }
})
defineEmits(['update:visible'])

const pkg = computed(() => props.package)
const customsNode = computed(() => pkg.value?.nodes.find((n) => n.key === 'customs'))
const inspection = computed(() => customsNode.value?.inspection)
</script>

<style scoped>
.pkg-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.pkg-id {
  font-weight: 600;
  color: #1f2d3d;
}

.pkg-route {
  color: #606266;
  font-size: 13px;
}

.desc {
  margin-top: 8px;
}

.section-title {
  margin: 20px 0 10px;
  font-size: 15px;
  color: #303133;
  border-left: 3px solid #E6A23C;
  padding-left: 10px;
}

.action-row {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.drawer-content {
  padding-right: 4px;
}
</style>

<style>
.inspection-drawer .el-drawer__header {
  margin-bottom: 14px;
}
</style>
