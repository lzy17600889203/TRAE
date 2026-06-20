<template>
  <div class="package-card" :class="{ 'is-detained': pkg.status === 'detained' }">
    <div class="package-head">
      <div class="pkg-identity">
        <el-tag :type="statusTag.type" effect="dark" size="small" round>
          {{ statusTag.label }}
        </el-tag>
        <span class="pkg-id">{{ pkg.id }}</span>
        <span class="pkg-route">{{ pkg.origin }} → {{ pkg.destination }}</span>
      </div>
      <span class="pkg-product">{{ pkg.product }}</span>
    </div>

    <div class="timeline-wrap">
      <div
        v-for="(node, idx) in timelineNodes" :key="node.key" class="timeline-node"
        :class="nodeClass(node)"
      >
        <div class="node-dot">
          <el-icon v-if="node.key === 'customs' && isStuck(node)" class="magnifier spin" @click.stop="$emit('inspect', pkg)">
            <ZoomIn />
          </el-icon>
          <el-icon v-else-if="node.isDone">
            <CircleCheck />
          </el-icon>
          <el-icon v-else-if="node.isCurrent">
            <Loading />
          </el-icon>
        </div>

        <div class="node-line" v-if="idx < timelineNodes.length - 1"></div>

        <el-tooltip
          v-if="node.key === 'customs' && isStuck(node)" placement="top" effect="dark">
          <template #content>
            <div>
              <b>已滞留 {{ node.stuckHours }} 小时</b>
              <div style="margin-top:4px;color:#ffd591">等待人工核验</div>
            </div>
          </template>
          <div class="node-info">
            <div class="node-title">{{ node.label }}</div>
            <div class="node-meta">{{ node.arrivedAt || '—' }}</div>
            <div class="node-note">{{ node.note || '—' }}</div>
          </div>
        </el-tooltip>

        <div v-else class="node-info">
          <div class="node-title">{{ node.label }}</div>
          <div class="node-meta">{{ node.arrivedAt || '待抵达' }}</div>
          <div class="node-note">{{ node.note || '—' }}</div>
        </div>
      </div>
    </div>

    <div v-if="hasStuck" class="stuck-actions">
      <el-button size="small" type="warning" plain @click="$emit('inspect', pkg)">
        <el-icon><ZoomIn /></el-icon>
        查看海关查验详情
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ZoomIn, CircleCheck, Loading } from '@element-plus/icons-vue'
import { NODE_TYPES } from '../mock/packages.js'

const props = defineProps({
  package: { type: Object, required: true }
})
defineEmits(['inspect'])

const pkg = computed(() => props.package)

const statusTag = computed(() => {
  const map = {
    in_transit: { label: '运输中', type: 'primary' },
    clearance_stuck: { label: '清关滞留', type: 'warning' },
    detained: { label: '海关扣留', type: 'danger' },
    failed: { label: '清关失败', type: 'info' },
    delivered: { label: '已签收', type: 'success' }
  }
  return map[pkg.value.status] || { label: '未知', type: 'info' }
})

const timelineNodes = computed(() => {
  return NODE_TYPES.map((t) => {
    const nodeData = pkg.value.nodes.find((n) => n.key === t.key)
    const isCurrent = pkg.value.currentNode === t.key
    const nodeIndex = NODE_TYPES.findIndex((n) => n.key === t.key)
    const currentIndex = NODE_TYPES.findIndex((n) => n.key === pkg.value.currentNode)
    const isDone = nodeIndex < currentIndex
    return {
      ...t,
      arrivedAt: nodeData?.arrivedAt,
      note: nodeData?.note,
      stuckHours: nodeData?.stuckHours || 0,
      isCurrent,
      isDone
    }
  })
})

const hasStuck = computed(() =>
  timelineNodes.value.some((n) => n.key === 'customs' && isStuck(n))
)

function isStuck(node) {
  return node.stuckHours && node.stuckHours >= 48
}

function nodeClass(node) {
  const classes = []
  if (node.isDone) classes.push('is-done')
  if (node.isCurrent) classes.push('is-current')
  if (node.key === 'customs' && isStuck(node)) classes.push('is-stuck')
  if (
    node.key === 'customs' &&
    (pkg.value.status === 'detained' || pkg.value.status === 'failed')
  ) {
    classes.push('is-detained')
  }
  return classes.join(' ')
}
</script>

<style scoped>
.package-card {
  background: linear-gradient(180deg, #161c32 0%, #141a2e 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 18px 20px 14px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}

.package-card.is-detained {
  border-color: rgba(245, 108, 108);
  box-shadow: 0 0 0 1px rgba(245, 108, 108, 0.25), 0 8px 30px rgba(245, 108, 108, 0.15);
}

.package-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.pkg-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pkg-id {
  font-weight: 600;
  color: #e8ecf5;
  font-size: 15px;
  letter-spacing: 1px;
}

.pkg-route {
  color: #8c97b0;
  font-size: 13px;
}

.pkg-product {
  color: #b3d8ff;
  background: rgba(64, 158, 255, 0.12);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.timeline-wrap {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.timeline-node {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.node-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1f2640;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c97b0;
  position: relative;
  z-index: 2;
}

.timeline-node.is-done .node-dot {
  border-color: #67C23A;
  color: #67C23A;
  background: rgba(103, 194, 58, 0.18);
}

.timeline-node.is-current .node-dot {
  border-color: #409EFF;
  color: #409EFF;
  background: rgba(64, 158, 255, 0.22);
  box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.18);
}

.timeline-node.is-stuck .node-dot {
  border-color: #E6A23C;
  color: #E6A23C;
  background: rgba(230, 162, 60, 0.22);
  box-shadow: 0 0 0 6px rgba(230, 162, 60, 0.22);
  cursor: pointer;
}

.timeline-node.is-detained .node-dot {
  border-color: #F56C6C;
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.22);
}

.node-line {
  position: absolute;
  top: 17px;
  left: 36px;
  right: -100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05));
  z-index: 1;
}

.timeline-node.is-done .node-line {
  background: linear-gradient(90deg, #67C23A, rgba(103, 194, 58, 0.4));
}

.timeline-node.is-current .node-line {
  background: linear-gradient(90deg, #67C23A, rgba(64, 158, 255, 0.5));
}

.timeline-node.is-stuck .node-line {
  background: linear-gradient(90deg, #67C23A, #E6A23C);
}

.magnifier {
  font-size: 18px;
}

.node-info {
  margin-top: 10px;
  padding-right: 10px;
}

.node-title {
  font-size: 13px;
  color: #e8ecf5;
  margin-bottom: 4px;
  font-weight: 500;
}

.node-meta {
  font-size: 12px;
  color: #8c97b0;
}

.node-note {
  font-size: 12px;
  color: #a7b0c7;
  margin-top: 4px;
  line-height: 1.5;
}

.stuck-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.timeline-node.is-stuck .node-title {
  color: #ffd591;
}

.timeline-node.is-detained .node-title {
  color: #ffb4b4;
}
</style>
