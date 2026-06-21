<template>
  <el-dialog v-model="visible" :title="'&#128274; 安全审计确认 - 保存配置变更'" width="620px" :close-on-click-modal="false" destroy-on-close>
    <div class="audit-summary">
      <el-alert v-if="unmaskedCount > 0" :title="'仍有 ' + unmaskedCount + ' 条绑定未配置脱敏规则，建议处理后再提交'" type="warning" show-icon :closable="false" />
      <el-alert v-else title="本次变更已全部配置脱敏规则" type="success" show-icon :closable="false" />
    </div>

    <div class="audit-section-title">变更清单（共 {{ changeLog.length }} 条）</div>
    <el-table :data="changeLog" size="small" border stripe height="260">
      <el-table-column type="index" label="#" width="45" align="center" />
      <el-table-column label="字段" prop="fieldName" min-width="130">
        <template #default="{ row }">
          <span class="field-chip">{{ row.fieldName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="场景" prop="sceneName" min-width="110" />
      <el-table-column label="动作" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="actionType(row.action)" size="small">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="规则变更" min-width="180">
        <template #default="{ row }">
          <span v-if="row.action === '删除'">删除该绑定</span>
          <span v-else class="rule-change">
            <el-tag v-if="row.prevRule" size="small" type="info">{{ ruleLabel(row.prevRule) }}</el-tag>
            <span class="arrow">&rarr;</span>
            <el-tag :type="(!row.rule || row.rule === 'none') ? 'danger' : 'success'" size="small">{{ ruleLabel(row.rule) }}</el-tag>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="password-section">
      <el-form label-width="120px" size="default">
        <el-form-item :label="'管理员密码（演示 admin123）'">
          <el-input v-model="password" show-password :placeholder="'请输入管理员密码以授权变更'" style="width:100%" />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="confirming">确认并提交变更</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { maskingRules, findField, tableTree, sceneNodes } from '../data/mock.js'
import { useMaskingStore } from '../stores/mask.js'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'confirmed'])

const store = useMaskingStore()
const password = ref('')
const confirming = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const changeLog = computed(() => {
  return store.changeLog.map(c => {
    const f = findField(tableTree, c.fieldId) || { fieldName: c.fieldId, label: c.fieldId }
    const s = sceneNodes.find(x => x.id === c.sceneId) || { label: c.sceneId }
    return {
      ...c,
      fieldName: f.fieldName || f.label,
      sceneName: s.label
    }
  })
})

const unmaskedCount = computed(() => {
  return store.bindings.filter(b => !b.rule || b.rule === 'none').length
})

function ruleLabel (r) {
  if (!r || r === 'none') return '未脱敏'
  const item = maskingRules.find(x => x.key === r)
  return item ? item.label.split('(')[0] : r
}

function actionType (a) {
  if (a === '新增') return 'success'
  if (a === '修改') return 'warning'
  if (a === '删除') return 'danger'
  return 'info'
}

async function handleConfirm () {
  if (changeLog.value.length === 0) {
    ElMessage.warning('没有检测到任何变更')
    return
  }
  if (!password.value) {
    ElMessage.warning('请先输入管理员密码')
    return
  }
  confirming.value = true
  // 模拟网络请求
  setTimeout(() => {
    if (!store.verifyAdminPassword(password.value)) {
      ElMessage.error('管理员密码错误，变更未生效')
      confirming.value = false
      return
    }
    confirming.value = false
    ElMessage.success('配置变更已提交并生效，共 ' + changeLog.value.length + ' 条变更')
    store.clearChanges()
    password.value = ''
    visible.value = false
    emit('confirmed')
  }, 700)
}

function handleCancel () {
  visible.value = false
}

watch(visible, (v) => {
  if (v) password.value = ''
})
</script>

<style scoped>
.audit-summary { margin-bottom: 10px; }
.audit-section-title { font-size: 13px; font-weight: 600; color: #374151; margin: 6px 0 8px; }
.field-chip { background: #fff1f2; color: #9f1239; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.rule-change { display: inline-flex; align-items: center; gap: 4px; }
.arrow { color: #9ca3af; }
.password-section { margin-top: 12px; background: #f9fafb; padding: 10px; border-radius: 6px; }
</style>
