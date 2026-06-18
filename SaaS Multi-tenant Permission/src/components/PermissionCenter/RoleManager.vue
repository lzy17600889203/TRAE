<template>
  <el-dialog
    v-model="visibleState"
    :title="`角色管理（共 ${roleStore.roles.length} 个）`"
    width="900px"
    :close-on-click-modal="false"
    align-center
    destroy-on-close
  >
    <div class="role-toolbar">
      <el-button type="primary" size="large" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
      <span class="role-hint">可新增 / 编辑角色基础信息，角色的具体权限在主界面矩阵中调整。</span>
    </div>

    <el-table :data="roleStore.roles" border stripe style="margin-top: 14px">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column label="角色 ID" prop="id" width="210" show-overflow-tooltip>
        <template #default="{ row }">
          <code class="role-id-code">{{ row.id }}</code>
        </template>
      </el-table-column>
      <el-table-column label="角色名称" prop="name" min-width="160">
        <template #default="{ row }">
          <el-input
            v-if="editingId === row.id"
            v-model="rowForm.name"
            size="small"
            placeholder="请输入角色名称"
            @keyup.enter="saveRowEdit(row)"
          />
          <span v-else style="font-weight: 600; color: #1f2937">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所属租户" prop="tenant" min-width="150">
        <template #default="{ row }">
          <el-select
            v-if="editingId === row.id"
            v-model="rowForm.tenant"
            size="small"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入租户"
          >
            <el-option v-for="t in tenantOptions" :key="t" :value="t" :label="t" />
          </el-select>
          <el-tag v-else type="info" effect="plain">{{ row.tenant }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="描述" prop="description" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <el-input
            v-if="editingId === row.id"
            v-model="rowForm.description"
            size="small"
            placeholder="可填写角色职责描述"
            @keyup.enter="saveRowEdit(row)"
          />
          <span v-else style="color: #6b7280">{{ row.description || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="isRoleDirty(row.id) ? 'warning' : 'success'" effect="light" round>
            {{ isRoleDirty(row.id) ? '待保存' : '已生效' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="editingId === row.id">
            <el-button size="small" type="primary" @click="saveRowEdit(row)">保存</el-button>
            <el-button size="small" @click="cancelRowEdit">取消</el-button>
          </template>
          <template v-else>
            <el-button size="small" @click="startRowEdit(row)">编辑</el-button>
            <el-popconfirm
              title="删除后不可恢复，确认删除此角色吗？"
              confirm-button-text="删除"
              cancel-button-text="保留"
              confirm-button-type="danger"
              @confirm="handleRemove(row)"
            >
              <template #reference>
                <el-button size="small" type="danger" :disabled="roleStore.roles.length <= 1">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="roleStore.roles.length <= 1" class="role-tip">
      <el-icon><InfoFilled /></el-icon>
      至少需要保留一个角色，因此当前仅剩角色时不可删除。
    </div>

    <template #footer>
      <el-button size="large" @click="visibleState = false">关闭</el-button>
      <el-button
        size="large"
        type="success"
        :disabled="roleSummary.dirtyCount === 0"
        @click="goSave"
      >
        前往保存 {{ roleSummary.dirtyCount }} 个角色的权限变更
      </el-button>
    </template>
  </el-dialog>

  <!-- 新增角色：独立弹窗，避免与“编辑已有行”的编辑态冲突 -->
  <el-dialog
    v-model="addDialogVisible"
    title="新增角色"
    width="520px"
    align-center
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="addFormRef"
      :model="addForm"
      :rules="addRules"
      label-width="96px"
      size="large"
    >
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="addForm.name" placeholder="例如：审核员" maxlength="32" show-word-limit />
      </el-form-item>
      <el-form-item label="所属租户" prop="tenant">
        <el-select
          v-model="addForm.tenant"
          filterable
          allow-create
          default-first-option
          placeholder="选择或输入租户"
          style="width: 100%"
        >
          <el-option v-for="t in tenantOptions" :key="t" :value="t" :label="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="addForm.description"
          type="textarea"
          :rows="3"
          maxlength="120"
          show-word-limit
          placeholder="可填写角色职责描述（选填）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="large" @click="cancelAdd">取消</el-button>
      <el-button size="large" type="primary" @click="submitAdd">确认新增</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, reactive, nextTick } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  roleStore,
  addRole,
  updateRole,
  removeRole,
  isRoleDirty,
  roleSummary,
} from '../../data/permissions.js'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'save-changes'])

const visibleState = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const tenantOptions = computed(() => {
  const set = new Set(roleStore.roles.map((r) => r.tenant).filter(Boolean))
  return [...set]
})

// 行内编辑态：只保存一个处于编辑态的行
const editingId = ref('')
const rowForm = reactive({ name: '', tenant: '', description: '' })

function startRowEdit(row) {
  editingId.value = row.id
  rowForm.name = row.name
  rowForm.tenant = row.tenant
  rowForm.description = row.description || ''
}

function cancelRowEdit() {
  editingId.value = ''
  rowForm.name = ''
  rowForm.tenant = ''
  rowForm.description = ''
}

function saveRowEdit(row) {
  if (!rowForm.name.trim()) {
    ElMessage.warning('角色名称不能为空')
    return
  }
  if (!rowForm.tenant.trim()) {
    ElMessage.warning('请选择或填写所属租户')
    return
  }
  updateRole(row.id, {
    name: rowForm.name.trim(),
    tenant: rowForm.tenant.trim(),
    description: rowForm.description,
  })
  ElMessage.success('角色信息已更新')
  cancelRowEdit()
}

function handleRemove(row) {
  removeRole(row.id)
  if (editingId.value === row.id) {
    cancelRowEdit()
  }
  ElMessage.success(`已删除角色：${row.name}`)
}

// 新增角色（独立弹窗 + 表单校验）
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = reactive({ name: '', tenant: '', description: '' })
const addRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  tenant: [{ required: true, message: '请选择或输入所属租户', trigger: 'change' }],
}

function openAddDialog() {
  addForm.name = ''
  addForm.tenant = tenantOptions.value[0] || '默认租户'
  addForm.description = ''
  addDialogVisible.value = true
  nextTick(() => {
    addFormRef.value?.clearValidate?.()
  })
}

function cancelAdd() {
  addDialogVisible.value = false
}

async function submitAdd() {
  const valid = await addFormRef.value?.validate().catch(() => false)
  if (!valid) return
  addRole({
    name: addForm.name.trim(),
    tenant: addForm.tenant.trim(),
    description: addForm.description,
  })
  ElMessage.success(`角色「${addForm.name.trim()}」已创建，请在主界面为其分配权限`)
  addDialogVisible.value = false
}

function goSave() {
  visibleState.value = false
  emit('save-changes')
}
</script>

<style scoped>
.role-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.role-hint {
  color: #6b7280;
  font-size: 13px;
}
.role-tip {
  margin-top: 12px;
  color: #b45309;
  background: #fff7ed;
  border: 1px dashed #fbbf24;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.role-id-code {
  background: #eef2ff;
  color: #4f46e5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
