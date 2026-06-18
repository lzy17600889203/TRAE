<template>
  <div class="permission-center">
    <div class="pc-header">
      <div class="pc-title">
        <el-icon :size="26" class="brand-icon"><UserFilled /></el-icon>
        <div>
          <h2>可视化权限配置中心</h2>
          <p>为 SaaS 多租户系统 · 按角色精细分配菜单与操作权限</p>
        </div>
      </div>
      <div class="pc-role">
        <span class="role-label">当前角色</span>
        <el-select v-model="currentRoleId" size="large" style="width: 230px" @change="handleRoleChange">
          <el-option
            v-for="r in roles"
            :key="r.id"
            :value="r.id"
            :label="r.name"
          >
            <span style="float: left">{{ r.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 12px">{{ r.tenant }}</span>
          </el-option>
        </el-select>
      </div>
    </div>

    <el-row :gutter="16" class="pc-body">
      <el-col :span="6">
        <el-card class="tree-card" shadow="hover">
          <template #header>
            <div class="card-title">
              <el-icon><Menu /></el-icon>
              菜单树 · {{ filteredNodes.length }} 项
            </div>
          </template>
          <el-input
            v-model="filterKeyword"
            placeholder="搜索菜单..."
            clearable
            style="margin-bottom: 10px"
            size="small"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-scrollbar height="calc(100vh - 320px)">
            <el-tree
              :data="menuTree"
              node-key="id"
              :default-expand-all="true"
              :highlight-current="true"
              :current-node-key="activeMenuParent"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <el-icon v-if="data.icon"><component :is="data.icon" /></el-icon>
                  <span :class="{ 'tree-leaf': !data.children.length }">{{ data.title }}</span>
                  <el-tag
                    v-if="!data.children.length && isDirtyForMenu(data.id)"
                    size="small"
                    type="danger"
                    effect="dark"
                    round
                    style="margin-left: 6px"
                  >
                    变更
                  </el-tag>
                </span>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card class="matrix-card" shadow="hover">
          <template #header>
            <div class="matrix-header">
              <div class="card-title">
                <el-icon><Grid /></el-icon>
                权限矩阵 · {{ currentRoleName }}
              </div>
              <div class="matrix-actions">
                <el-badge v-if="pendingCount > 0" :value="pendingCount" class="pending-badge">
                  <el-button type="success" size="large" @click="triggerSave">
                    <el-icon><DocumentChecked /></el-icon>
                    保存权限变更
                  </el-button>
                </el-badge>
                <el-button v-else size="large" disabled>无待保存变更</el-button>
                <el-button size="large" @click="resetToOriginal">
                  <el-icon><RefreshLeft /></el-icon>
                  还原
                </el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="hasAnyConflict"
            type="warning"
            :closable="false"
            show-icon
            class="conflict-alert"
          >
            <template #title>
              <span>
                <el-icon style="vertical-align: middle"><Warning /></el-icon>
                检测到 <strong>{{ conflictCount }}</strong> 处权限冲突，请点击黄色格子查看提示或直接忽略后保存。
              </span>
            </template>
          </el-alert>

          <el-table
            :data="visibleRows"
            border
            stripe
            size="default"
            style="width: 100%; margin-top: 12px"
            :row-class-name="rowClassName"
            :header-cell-style="{ background: '#f9fafb', color: '#374151' }"
          >
            <el-table-column label="所属分组" prop="parentTitle" width="140" fixed />
            <el-table-column label="菜单" prop="title" min-width="180" fixed>
              <template #default="{ row }">
                <strong>{{ row.title }}</strong>
                <span v-if="row.hasConflict" class="row-conflict">
                  <ScaleIcon :size="18" :tilting="true" />
                </span>
              </template>
            </el-table-column>
            <el-table-column
              v-for="action in actionTypes"
              :key="action.key"
              :label="action.label"
              align="center"
              width="130"
            >
              <template #default="{ row }">
                <div
                  class="matrix-cell"
                  :class="{
                    'cell-conflict': row.conflictActions?.includes(action.key),
                    'cell-changed': row.changedActions?.includes(action.key),
                  }"
                  :title="cellTooltip(row, action.key)"
                >
                  <el-checkbox
                    :model-value="getPermission(row.id, action.key)"
                    @change="(v) => togglePermission(row.id, action.key, v)"
                  />
                  <ScaleIcon
                    v-if="row.conflictActions?.includes(action.key)"
                    :size="16"
                    :tilting="true"
                    title="点击查看冲突详情"
                    @click.stop="showConflictDialog(row)"
                    style="cursor: pointer; margin-left: 4px"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.hasConflict ? 'warning' : row.isDirty ? 'success' : 'info'"
                  effect="light"
                  round
                >
                  {{ row.hasConflict ? '⚠ 冲突' : row.isDirty ? '● 待保存' : '— 未修改' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="legend">
            <span><i class="dot dot-conflict"></i>冲突项</span>
            <span><i class="dot dot-changed"></i>变更项</span>
            <span>点击天平图标查看冲突规则</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <ChangePreview
      v-model="previewVisible"
      :role-name="currentRoleName"
      :changes="pendingChanges"
      @save="openSafeConfirm(false)"
      @ignore-and-save="openSafeConfirm(true)"
    />

    <SafeConfirm
      :visible="safeVisible"
      :role-name="currentRoleName"
      @confirm="commitChanges"
      @cancel="safeVisible = false"
    />

    <el-dialog
      v-model="conflictDialogVisible"
      title="权限冲突详情"
      width="520px"
      align-center
    >
      <div v-if="conflictDialogRow">
        <div class="conflict-dialog-title">
          <el-icon :size="22" color="#d97706"><Warning /></el-icon>
          <strong>{{ conflictDialogRow.title }}</strong>
        </div>
        <el-timeline style="margin-top: 8px">
          <el-timeline-item
            v-for="(c, idx) in conflictDialogRow.conflicts"
            :key="idx"
            :color="'#f59e0b'"
            timestamp="已触发冲突规则"
            placement="top"
          >
            <div class="conflict-dialog-msg">{{ c.message }}</div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <template #footer>
        <el-button @click="conflictDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>

    <transition name="slide-top">
      <div v-if="saveSuccess" class="success-banner">
        <el-icon :size="20"><CircleCheckFilled /></el-icon>
        <span>配置已生效 · {{ currentRoleName }} 的权限已更新</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  UserFilled,
  Menu,
  Search,
  Grid,
  DocumentChecked,
  RefreshLeft,
  Warning,
  CircleCheckFilled,
  Setting,
  TrendCharts,
  Money,
  DataAnalysis,
} from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import ScaleIcon from './ScaleIcon.vue'
import ChangePreview from './ChangePreview.vue'
import SafeConfirm from './SafeConfirm.vue'
import { roles, actionTypes, menuTree, initialPermissionMatrix, flattenMenu } from '../../data/permissions.js'
import { detectConflicts, buildMatrixChangeDiff } from './conflicts.js'

const iconMap = { Setting, TrendCharts, Money, DataAnalysis }
const normalizedTree = menuTree.map((node) => ({
  ...node,
  icon: node.icon ? iconMap[node.icon] || null : null,
}))
const menuTreeRef = normalizedTree

const currentRoleId = ref('admin')
const filterKeyword = ref('')
const activeMenuParent = ref(null)

const flatMenus = flattenMenu(menuTreeRef)

const originalMatrix = reactive(
  Object.fromEntries(roles.map((r) => [r.id, JSON.parse(JSON.stringify(initialPermissionMatrix[r.id] || {}))])),
)

const currentMatrix = reactive(
  Object.fromEntries(roles.map((r) => [r.id, JSON.parse(JSON.stringify(initialPermissionMatrix[r.id] || {}))])),
)

const currentRoleName = computed(() => roles.find((r) => r.id === currentRoleId.value)?.name || '')

function getPermission(menuId, action) {
  return !!(currentMatrix[currentRoleId.value]?.[menuId]?.[action])
}

function togglePermission(menuId, action, value) {
  if (!currentMatrix[currentRoleId.value]) return
  if (!currentMatrix[currentRoleId.value][menuId]) {
    currentMatrix[currentRoleId.value][menuId] = {}
  }
  currentMatrix[currentRoleId.value][menuId][action] = !!value
}

function roleMatrix(roleId) {
  return currentMatrix[roleId] || {}
}
function origRoleMatrix(roleId) {
  return originalMatrix[roleId] || {}
}

function rowForMenu(menuNode) {
  const row = roleMatrix(currentRoleId.value)[menuNode.id] || {}
  const origRow = origRoleMatrix(currentRoleId.value)[menuNode.id] || {}
  const conflicts = detectConflicts(row)
  const conflictActions = new Set()
  conflicts.forEach((c) => c.cells.forEach((cell) => conflictActions.add(cell.action)))
  const changedActions = actionTypes
    .filter((a) => !!row[a.key] !== !!origRow[a.key])
    .map((a) => a.key)
  return {
    id: menuNode.id,
    title: menuNode.title,
    parentTitle: menuNode.parentTitle,
    isDirty: changedActions.length > 0,
    hasConflict: conflicts.length > 0,
    conflictActions: [...conflictActions],
    changedActions,
    conflicts,
  }
}

const visibleRows = computed(() => {
  const kw = (filterKeyword.value || '').trim().toLowerCase()
  const base = flatMenus.map(rowForMenu)
  if (!kw) return base
  return base.filter(
    (r) =>
      r.title.toLowerCase().includes(kw) ||
      (r.parentTitle || '').toLowerCase().includes(kw),
  )
})

const filteredNodes = computed(() => flatMenus.length)

const pendingChanges = computed(() =>
  buildMatrixChangeDiff(
    roleMatrix(currentRoleId.value),
    origRoleMatrix(currentRoleId.value),
    flatMenus,
    actionTypes,
  ),
)

const pendingCount = computed(() => pendingChanges.value.length)
const hasAnyConflict = computed(() => visibleRows.value.some((r) => r.hasConflict))
const conflictCount = computed(() => visibleRows.value.filter((r) => r.hasConflict).length)

const previewVisible = ref(false)
const safeVisible = ref(false)
const saveSuccess = ref(false)

const conflictDialogVisible = ref(false)
const conflictDialogRow = ref(null)

function isDirtyForMenu(menuId) {
  const orig = origRoleMatrix(currentRoleId.value)[menuId] || {}
  const cur = roleMatrix(currentRoleId.value)[menuId] || {}
  return actionTypes.some((a) => !!cur[a.key] !== !!orig[a.key])
}

function rowClassName() {
  return ''
}

function cellTooltip(row, action) {
  if (row.conflictActions?.includes(action)) {
    const msg = (row.conflicts || []).map((c) => c.message).join('；')
    return '⚠ 冲突：' + msg
  }
  if (row.changedActions?.includes(action)) {
    return '● 已修改，未保存'
  }
  return `${row.title} · ${actionTypes.find((a) => a.key === action)?.label}`
}

function handleNodeClick(data) {
  if (data.children && data.children.length > 0) {
    activeMenuParent.value = data.id
    filterKeyword.value = data.title
  } else {
    filterKeyword.value = data.title
  }
}

function handleRoleChange() {
  filterKeyword.value = ''
}

function triggerSave() {
  if (pendingCount.value === 0) {
    ElMessage.info('当前没有待保存的变更')
    return
  }
  previewVisible.value = true
}

function openSafeConfirm() {
  previewVisible.value = false
  safeVisible.value = true
}

function commitChanges() {
  const matrix = roleMatrix(currentRoleId.value)
  const orig = origRoleMatrix(currentRoleId.value)
  // 写入 originalMatrix，标记“已保存”
  Object.keys(matrix).forEach((key) => {
    orig[key] = JSON.parse(JSON.stringify(matrix[key]))
  })
  safeVisible.value = false
  saveSuccess.value = true
  ElNotification({
    title: '保存成功',
    message: `${currentRoleName.value} 的权限配置已写入系统，共 ${pendingChanges.value.length} 项变更`,
    type: 'success',
    duration: 3000,
  })
  window.setTimeout(() => {
    saveSuccess.value = false
  }, 3200)
}

function resetToOriginal() {
  const orig = origRoleMatrix(currentRoleId.value)
  const cur = roleMatrix(currentRoleId.value)
  Object.keys(cur).forEach((key) => {
    if (orig[key]) {
      cur[key] = JSON.parse(JSON.stringify(orig[key]))
    } else {
      cur[key] = {}
    }
  })
  ElMessage.success('已还原为上次保存的配置')
}

function showConflictDialog(row) {
  conflictDialogRow.value = row
  conflictDialogVisible.value = true
}

watch(
  hasAnyConflict,
  (v, old) => {
    if (v && !old) {
      ElMessage.warning('检测到权限冲突，请在矩阵或下方变更预览中核实')
    }
  },
)
</script>

<style scoped>
.permission-center {
  padding: 18px 22px;
  background: #f3f5fb;
  min-height: 100vh;
  position: relative;
}

.pc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 18px 22px;
  border-radius: 14px;
  margin-bottom: 18px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}
.pc-title {
  display: flex;
  align-items: center;
  gap: 14px;
}
.pc-title h2 {
  margin: 0;
  color: #111827;
  font-size: 20px;
}
.pc-title p {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 13px;
}
.brand-icon {
  color: #4f46e5;
  background: #eef2ff;
  padding: 10px;
  border-radius: 14px;
}
.pc-role {
  display: flex;
  align-items: center;
  gap: 12px;
}
.role-label {
  color: #6b7280;
  font-size: 13px;
}

.tree-card :deep(.el-card__body),
.matrix-card :deep(.el-card__body) {
  padding: 14px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
  font-weight: 600;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.tree-leaf {
  color: #111827;
}

.matrix-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.matrix-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.pending-badge :deep(.el-badge__content) {
  border-radius: 10px;
}

.matrix-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.25s, transform 0.25s;
  min-height: 32px;
}
.matrix-cell.cell-conflict {
  background: #fef3c7;
  animation: pulse-warn 2s ease-in-out infinite;
}
.matrix-cell.cell-changed {
  background: #ecfdf5;
  outline: 1px dashed #10b981;
}
.row-conflict {
  margin-left: 8px;
  display: inline-flex;
  vertical-align: middle;
}
.conflict-alert {
  margin-bottom: 4px;
}
.legend {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 18px;
  color: #6b7280;
  font-size: 13px;
}
.legend i.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}
.legend i.dot-conflict {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}
.legend i.dot-changed {
  background: #ecfdf5;
  border: 1px dashed #10b981;
}

.success-banner {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #10b981, #059669);
  color: #fff;
  padding: 12px 22px;
  border-radius: 999px;
  box-shadow: 0 16px 40px rgba(16, 185, 129, 0.4);
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2200;
}

.slide-top-enter-active,
.slide-top-leave-active {
  transition: all 0.4s ease;
}
.slide-top-enter-from {
  opacity: 0;
  transform: translate(-50%, -30px);
}
.slide-top-leave-to {
  opacity: 0;
  transform: translate(-50%, -30px);
}

.conflict-dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}
.conflict-dialog-msg {
  color: #374151;
  font-size: 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 8px 10px;
  border-radius: 6px;
}

@keyframes pulse-warn {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.25); }
  50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
}
</style>
