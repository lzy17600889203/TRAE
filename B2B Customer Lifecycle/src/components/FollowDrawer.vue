<template>
  <el-drawer
    v-model="innerVisible"
    :title="customer ? `跟进记录 · ${customer.name}` : '跟进记录'"
    direction="rtl"
    size="520px"
    :close-on-click-modal="false"
  >
    <template v-if="customer">
      <div class="drawer-meta">
        <el-tag :type="stageTagType(customer.stage)" effect="plain">
          阶段：{{ stageName(customer.stage) }}
        </el-tag>
        <el-tag type="info" effect="plain">负责人：{{ customer.operator }}</el-tag>
        <el-tag type="warning" effect="plain">
          下次计划：{{ formatDate(customer.nextFollow) }}
        </el-tag>
      </div>

      <!-- 时间轴 / 聊天气泡 -->
      <div class="timeline-wrap" ref="timelineRef">
        <div
          v-for="(r, idx) in localRecords"
          :key="r.time.getTime() + '-' + idx"
          class="timeline-bubble bubble-slide-in"
        >
          <div class="avatar">{{ r.user.slice(0, 1) }}</div>
          <div class="content">
            <div class="meta">
              {{ r.user }} · {{ formatDate(r.time) }}
            </div>
            <div v-if="r.text" class="text">{{ r.text }}</div>
            <div
              v-for="(f, j) in r.files"
              :key="j"
              class="attachment"
              @click.prevent.stop="downloadFile(f)"
            >
              <el-icon><Download /></el-icon>
              {{ f.name }}
              <span style="color:#909399; margin-left:6px;">({{ f.size }})</span>
            </div>
          </div>
        </div>
        <el-empty
          v-if="!localRecords.length"
          description="暂无跟进记录，快添加第一条吧～"
        />
      </div>
    </template>

    <template #footer>
      <div class="drawer-footer">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          multiple
        >
          <el-button type="primary" plain>
            <el-icon><Paperclip /></el-icon>
            附件
          </el-button>
        </el-upload>

        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          placeholder="输入跟进备注，回车发送，Shift+回车换行"
          resize="none"
          @keydown.enter.exact.prevent="sendRecord"
        />

        <el-button type="primary" :disabled="!canSend" @click="sendRecord">
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>
      </div>

      <div v-if="pendingFiles.length" class="pending-files">
        待发送附件：
        <el-tag
          v-for="(f, i) in pendingFiles"
          :key="i"
          closable
          type="info"
          style="margin-right: 6px;"
          @close="removeFile(i)"
        >
          {{ f.name }}
        </el-tag>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { formatDate } from '../data/customers.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  customer: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'add-record'])

const innerVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
})

// 本地深拷贝的记录，用于驱动气泡动画
const localRecords = ref([])
const inputText = ref('')
const pendingFiles = ref([])
const timelineRef = ref(null)

watch(
  () => props.customer,
  (c) => {
    if (c) {
      localRecords.value = c.records.map((r) => ({ ...r, files: [...(r.files || [])] }))
    } else {
      localRecords.value = []
    }
  },
  { immediate: true }
)

watch(innerVisible, async (v) => {
  if (v) {
    await nextTick()
    scrollToBottom()
  }
})

const canSend = computed(() => inputText.value.trim() || pendingFiles.value.length)

function stageName(key) {
  return (
    {
      lead: '线索',
      contact: '初步接触',
      proposal: '方案沟通',
      negotiate: '商务谈判',
      deal: '成交'
    }[key] || key
  )
}
function stageTagType(key) {
  return (
    {
      lead: 'info',
      contact: '',
      proposal: 'success',
      negotiate: 'warning',
      deal: 'danger'
    }[key] || ''
  )
}

function handleFileChange(file) {
  if (!file || !file.raw) return
  const rawFile = file.raw
  // 同时保存真实 File 对象（raw），用于后续下载
  pendingFiles.value.push({
    name: file.name,
    size: humanSize(file.size || 0),
    raw: rawFile
  })
}

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function removeFile(idx) {
  const f = pendingFiles.value[idx]
  if (f && f._blobUrl) URL.revokeObjectURL(f._blobUrl)
  pendingFiles.value.splice(idx, 1)
}

function sendRecord() {
  if (!canSend.value || !props.customer) return
  const record = {
    time: new Date(),
    user: '我',
    text: inputText.value.trim(),
    // 发送时保留 raw，供点击下载使用
    files: pendingFiles.value.slice()
  }
  localRecords.value.unshift(record)
  emit('add-record', { customerId: props.customer.id, record })
  inputText.value = ''
  pendingFiles.value = []
}

function scrollToBottom() {
  if (timelineRef.value) {
    timelineRef.value.scrollTop = 0
  }
}

function downloadFile(f) {
  if (!f) return
  try {
    let url = f._blobUrl
    if (!url) {
      if (f.raw instanceof Blob || f.raw instanceof File) {
        url = URL.createObjectURL(f.raw)
      } else if (f.url) {
        url = f.url
      } else {
        // 历史 mock 附件：生成一段演示文本作为下载占位
        const content =
          '演示附件：' + f.name + '\n' +
          '大小：' + (f.size || '未知') + '\n' +
          '对接真实后端后，此处应改为调用下载接口拿到 Blob。\n'
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        url = URL.createObjectURL(blob)
      }
      f._blobUrl = url
    }

    const a = document.createElement('a')
    a.href = url
    const hasRealFile = f.raw instanceof Blob || f.raw instanceof File || f.url
    a.download = hasRealFile ? f.name : f.name.replace(/\.[^.]+$/, '') + '.txt'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 200)
  } catch (e) {
    window.alert('附件下载失败：' + f.name + '\n' + (e.message || e))
  }
}
</script>

<style scoped>
.drawer-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.timeline-wrap {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding-right: 6px;
}

.drawer-footer {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.drawer-footer .el-input {
  flex: 1;
}

.pending-files {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
