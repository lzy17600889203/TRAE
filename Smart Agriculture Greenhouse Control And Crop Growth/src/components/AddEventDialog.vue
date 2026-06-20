<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 最近一次各类型操作记录，用于间隔/重复提醒 */
  lastByType: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const EVENT_TYPES = [
  { value: '播种', icon: '🌱', repeatDays: 30, minGapDays: 1, color: '#60a5fa' },
  { value: '施肥', icon: '🧪', repeatDays: 7, minGapDays: 3, color: '#f59e0b' },
  { value: '打药', icon: '💊', repeatDays: 3, minGapDays: 3, color: '#ef4444' },
  { value: '浇水', icon: '💧', repeatDays: 1, minGapDays: 1, color: '#22d3ee' },
  { value: '间苗', icon: '🌿', repeatDays: 10, minGapDays: 2, color: '#84cc16' },
  { value: '授粉', icon: '🌸', repeatDays: 15, minGapDays: 1, color: '#ec4899' },
  { value: '采摘', icon: '🍅', repeatDays: 3, minGapDays: 1, color: '#fb7185' },
  { value: '其他', icon: '📝', repeatDays: 1, minGapDays: 0, color: '#94a3b8' }
]

const nowStr = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const form = reactive({
  type: '打药',
  operator: '',
  time: nowStr(),
  detail: '',
  photo: '',
  amount: ''
})

const submitting = ref(false)
const tip = computed(() => {
  const meta = EVENT_TYPES.find((t) => t.value === form.type)
  if (!meta) return null
  const last = props.lastByType[form.type]
  if (!last) return { level: 'info', text: `尚未有「${form.type}」记录，这将是首次操作。` }
  const days = diffDays(last.time, form.time || nowStr())
  if (days < meta.minGapDays) {
    return { level: 'danger', text: `⚠ 上次「${form.type}」发生在 ${last.time}（距今仅 ${days} 天），建议间隔至少 ${meta.minGapDays} 天以避免重复施肥/打药造成药害。` }
  }
  if (days < meta.repeatDays / 2) {
    return { level: 'warn', text: `上次「${form.type}」发生在 ${last.time}（距今 ${days} 天），请确认确实需要再次操作。` }
  }
  return { level: 'ok', text: `上次「${form.type}」发生在 ${last.time}（距今 ${days} 天），本次记录合理。` }
})

function diffDays(a, b) {
  const d1 = new Date(a.replace(' ', 'T'))
  const d2 = new Date((b || '').replace(' ', 'T'))
  if (isNaN(d1) || isNaN(d2)) return 0
  return Math.round((d2 - d1) / 86400000)
}

function resetForm() {
  form.type = '打药'
  form.operator = ''
  form.time = nowStr()
  form.detail = ''
  form.photo = ''
  form.amount = ''
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.time = nowStr()
    }
  }
)

function handleClose() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  if (!form.operator) return ElMessage.warning('请填写操作人姓名')
  if (!form.detail) return ElMessage.warning('请填写操作详情，例如农药名称、用量等')
  if (!form.time) return ElMessage.warning('请选择操作时间')

  const meta = EVENT_TYPES.find((t) => t.value === form.type)
  const last = props.lastByType[form.type]
  if (last && meta && diffDays(last.time, form.time) < meta.minGapDays) {
    try {
      await ElMessageBox.confirm(
        `检测到「${form.type}」距上次仅 ${diffDays(last.time, form.time)} 天，可能造成重复施肥/药害，是否仍然提交？`,
        '重复操作提醒',
        { type: 'warning', confirmButtonText: '仍然提交', cancelButtonText: '取消' }
      )
    } catch (e) {
      return
    }
  }

  submitting.value = true
  const payload = {
    time: form.time,
    title: form.type,
    icon: meta ? meta.icon : '📝',
    operator: form.operator,
    detail: form.amount ? `${form.detail}（用量：${form.amount}）` : form.detail,
    photo: form.photo || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=greenhouse%20farming%20operation&image_size=square',
    amount: form.amount,
    userAdded: true
  }
  emit('submit', payload)
  submitting.value = false
  resetForm()
  handleClose()
  ElMessage.success('记录已保存到时间轴 ✅')
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="📒 新增农事操作记录"
    width="560px"
    :close-on-click-modal="false"
    class="add-event-dialog"
    @closed="handleClose"
  >
    <el-alert
      v-if="tip"
      :title="tip.text"
      :type="tip.level"
      :closable="false"
      show-icon
      style="margin-bottom: 14px;"
    />

    <el-form label-position="top" :model="form">
      <el-row :gutter="14">
        <el-col :span="12">
          <el-form-item label="操作类型">
            <el-select v-model="form.type" style="width:100%;">
              <el-option
                v-for="t in EVENT_TYPES"
                :key="t.value"
                :value="t.value"
                :label="`${t.icon} ${t.value}`"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="操作时间">
            <el-date-picker
              v-model="form.time"
              type="datetime"
              placeholder="选择操作时间"
              value-format="YYYY-MM-DD HH:mm"
              style="width:100%;"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="操作人">
            <el-input v-model="form.operator" placeholder="请填写姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用量 / 面积（可选）">
            <el-input v-model="form.amount" placeholder="例如：15kg / 2 亩 / 1000 倍液 50L" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="操作详情">
        <el-input
          v-model="form.detail"
          type="textarea"
          :rows="3"
          :placeholder="form.type === '打药' ? '例如：喷施 10% 吡虫啉可湿性粉剂 2000 倍液，针对蚜虫，A3 区域' : '请描述本次操作的内容'"
        />
      </el-form-item>

      <el-form-item label="现场照片链接（可选）">
        <el-input v-model="form.photo" placeholder="https://... 若留空将使用默认占位图" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存记录</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.add-event-dialog :deep(.el-dialog) {
  border-radius: 14px;
  overflow: hidden;
}
</style>
