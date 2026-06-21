<template>
  <div class="left-tree">
    <div class="tree-title">
      <el-icon><DataLine /></el-icon>
      <span>数据库表结构</span>
    </div>
    <el-tree
      :data="tableTree"
      node-key="id"
      default-expand-all
      :expand-on-click-node="false"
      :render-content="renderContent"
    >
      <template #empty>
        <div style="color:#9ca3af;font-size:12px;padding:10px;">暂无数据</div>
      </template>
    </el-tree>

    <div class="legend">
      <div class="legend-item"><span class="dot dot-sens"></span>敏感字段（可拖拽到右侧场景）</div>
      <div class="legend-item"><span class="dot dot-normal"></span>普通字段</div>
    </div>

    <div class="tip">
      <el-tag size="small" type="warning">提示</el-tag>
      <span>将字段节点拖拽到右侧「场景节点」完成绑定</span>
    </div>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { ElTag } from 'element-plus'
import { DataLine } from '@element-plus/icons-vue'
import { tableTree } from '../data/mock.js'

const emit = defineEmits(['drag-start'])

function renderContent (h2, { node, data }) {
  // 叶子节点是字段 -> 可拖拽
  if (data.type) {
    return h('div', {
      class: ['field-node-wrap', data.sensitive ? 'is-sensitive' : ''],
      draggable: true,
      onDragstart: (e) => {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('application/x-masking-field', JSON.stringify({
          id: data.id, label: data.label, fieldName: data.fieldName, type: data.type, sensitive: data.sensitive
        }))
        emit('drag-start', data)
      }
    }, [
      h('span', { class: 'field-label' }, data.label),
      h('span', { class: 'field-meta' }, data.type),
      data.sensitive ? h(ElTag, { size: 'small', type: 'danger', effect: 'light', class: 'mtag' }, { default: () => data.fieldName }) : null
    ])
  }
  // 非叶子节点（库/表）
  return h('span', { class: 'tree-branch' }, node.label)
}
</script>

<style scoped>
.left-tree { height: 100%; display: flex; flex-direction: column; }
.tree-title {
  display: flex; align-items: center; gap: 6px;
  color: #1e3a8a; font-weight: 600; font-size: 13px;
  padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 6px;
}
.field-node-wrap {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 2px 6px; border-radius: 4px; cursor: grab; user-select: none;
  transition: background 0.15s;
}
.field-node-wrap:hover { background: #eff6ff; }
.field-node-wrap:active { cursor: grabbing; }
.field-node-wrap.is-sensitive { background: #fef2f2; }
.field-label { font-weight: 500; color: #111827; }
.field-meta { font-size: 11px; color: #6b7280; }
.mtag { margin-left: auto; }
.tree-branch { font-weight: 500; color: #374151; }
.legend {
  margin-top: 10px; padding: 8px; border: 1px dashed #e5e7eb; border-radius: 4px;
  font-size: 12px; color: #4b5563;
}
.legend-item { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-sens { background: #ef4444; }
.dot-normal { background: #6b7280; }
.tip {
  margin-top: 8px; padding: 8px; background: #fffbeb; border: 1px solid #fcd34d;
  border-radius: 4px; font-size: 12px; color: #92400e; display: flex; gap: 6px; align-items: center;
}
:deep(.el-tree-node__content) { height: 28px; }
</style>
