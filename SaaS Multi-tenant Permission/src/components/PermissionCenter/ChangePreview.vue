<template>
  <el-dialog
    v-model="visibleState"
    :title="`变更预览 · ${roleName}`"
    width="780px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="preview-dialog"
  >
    <div class="preview-header">
      <el-icon :size="20"><Document /></el-icon>
      <span>请确认以下 <strong>{{ changes.length }}</strong> 项权限变更。绿色为新增授权，红色为移除授权。</span>
      <el-tag :type="hasConflict ? 'warning' : 'success'" effect="light" size="large" round>
        {{ hasConflict ? '⚠ 存在冲突项，提交前请人工核实' : '✓ 未检测到冲突' }}
      </el-tag>
    </div>

    <el-scrollbar height="360px" class="preview-scroll">
      <el-empty v-if="changes.length === 0" description="暂无变更" />
      <div v-else class="change-list">
        <div
          v-for="item in changes"
          :key="item.key"
          class="change-item"
          :class="item.changeType"
        >
          <div class="change-main">
            <div class="change-title">
              <el-tag
                :type="item.changeType === 'added' ? 'success' : item.changeType === 'removed' ? 'danger' : 'info'"
                effect="dark"
                round
                size="small"
              >
                {{ item.changeType === 'added' ? '+ 新增' : item.changeType === 'removed' ? '− 移除' : '~ 修改' }}
              </el-tag>
              <span class="change-path">{{ item.menuTitle }}</span>
              <el-tag effect="plain" size="small">{{ item.actionLabel }}</el-tag>
              <span v-if="item.conflict" class="conflict-tag">
                <ScaleIcon :size="16" :tilting="true" /> 冲突
              </span>
            </div>
            <div class="change-diff">
              <span class="diff-old">
                {{ item.oldValue ? '✓ 允许' : '✗ 禁止' }}
              </span>
              <el-icon class="diff-arrow"><Right /></el-icon>
              <span class="diff-new">
                {{ item.newValue ? '✓ 允许' : '✗ 禁止' }}
              </span>
            </div>
            <div v-if="item.conflict" class="conflict-note">
              提示：{{ item.conflict.message }}
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <template #footer>
      <el-button @click="handleClose">返回修改</el-button>
      <el-button type="warning" @click="handleIgnoreAndSave" v-if="hasConflict">
        忽略冲突，继续保存
      </el-button>
      <el-button type="primary" @click="handleSave" :disabled="changes.length === 0">
        进入保险箱二次确认
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Right, Document } from '@element-plus/icons-vue'
import ScaleIcon from './ScaleIcon.vue'

const props = defineProps({
  modelValue: Boolean,
  roleName: { type: String, default: '角色' },
  changes: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save', 'ignore-and-save'])

const visibleState = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const hasConflict = computed(() => props.changes.some((c) => c.conflict))

function handleClose() {
  emit('update:modelValue', false)
}

function handleSave() {
  emit('save')
}

function handleIgnoreAndSave() {
  emit('ignore-and-save')
}
</script>

<style scoped>
.preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 10px;
  margin-bottom: 12px;
  color: #4b5563;
  font-size: 14px;
}
.preview-scroll {
  background: #fafbfd;
  border-radius: 10px;
  padding: 6px;
}
.change-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px;
}
.change-item {
  display: flex;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  transition: all 0.2s;
}
.change-item.added {
  border-left: 4px solid #10b981;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.08), #fff);
}
.change-item.removed {
  border-left: 4px solid #ef4444;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.08), #fff);
}
.change-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.change-main {
  flex: 1;
}
.change-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.change-path {
  font-weight: 600;
  color: #1f2937;
}
.change-diff {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.diff-old {
  color: #9ca3af;
  text-decoration: line-through;
}
.diff-new {
  color: #111827;
  font-weight: 600;
}
.diff-arrow {
  color: #9ca3af;
}
.conflict-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #fff7cd;
  color: #92400e;
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid #fde68a;
}
.conflict-note {
  margin-top: 8px;
  padding: 8px 10px;
  background: #fffbeb;
  border: 1px dashed #f59e0b;
  color: #92400e;
  font-size: 13px;
  border-radius: 6px;
}
</style>
