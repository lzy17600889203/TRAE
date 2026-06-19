<template>
  <div class="app-container">
    <header class="app-header">
      <h1>
        <el-icon style="vertical-align: middle; margin-right: 8px;"><Share /></el-icon>
        自媒体多平台发布与数据聚合台
      </h1>
      <p>一次撰写，全网分发；支持自定义平台、账号绑定与多端数据聚合。</p>
    </header>

    <div class="main-grid">
      <div class="left-col">
        <section class="editor-card">
          <h3 class="card-title">
            <el-icon class="title-icon"><EditPen /></el-icon>
            内容编辑
          </h3>
          <div class="editor-wrapper">
            <Toolbar
              class="editor-toolbar"
              :editor="editorRef"
              :default-config="toolbarConfig"
              mode="default"
            />
            <Editor
              class="editor-content"
              v-model="valueHtml"
              :default-config="editorConfig"
              mode="default"
              @onCreated="handleCreated"
            />
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;">
            <h3 class="card-title" style="margin:0;">
              <el-icon class="title-icon"><Platform /></el-icon>
              选择分发平台
              <el-tag size="small" type="info" style="margin-left:8px;">点击卡片查看账号信息</el-tag>
            </h3>
            <el-button type="success" plain :disabled="publishing" @click="openCustomDialog(null)">
              <el-icon style="margin-right:4px;"><Plus /></el-icon>
              新增自定义平台
            </el-button>
          </div>

          <div class="platforms-list">
            <div
              v-for="p in platformsList"
              :key="p.key"
              class="platform-item"
              :class="{
                'is-selected': selectedPlatforms.has(p.key),
                'is-disabled': !selectedPlatforms.has(p.key) && publishing,
                'is-publishing': platformStatus[p.key] === 'publishing',
                'is-success': platformStatus[p.key] === 'success',
                'is-failed': platformStatus[p.key] === 'failed',
                'is-unbound': !bindings[p.key]
              }"
              @click="handlePlatformClick(p.key)"
            >
              <div class="platform-icon" :style="{ background: p.color }">
                {{ p.letter }}
              </div>
              <div class="platform-name">{{ p.short }}</div>
              <div class="platform-status">{{ getStatusText(p.key) }}</div>

              <div v-if="!bindings[p.key]" class="unbound-bubble">
                <el-icon><User /></el-icon>
                <span>未绑定</span>
              </div>

              <div v-if="platformStatus[p.key] === 'failed'" class="fail-bubble">
                <span>发布失败</span>
                <button @click.stop="retryPlatform(p.key)">重试</button>
                <button @click.stop="ignorePlatform(p.key)">忽略</button>
              </div>
            </div>
          </div>

          <div class="action-bar">
            <div class="summary-text">
              共 <span class="hl">{{ platformsList.length }}</span> 个平台 ·
              已绑定 <span class="hl">{{ boundCount }}</span> ·
              已选 <span class="hl">{{ selectedPlatforms.size }}</span> ·
              成功 <span class="hl" style="color:#67c23a;">{{ successCount }}</span> ·
              失败 <span class="hl" style="color:#f56c6c;">{{ failCount }}</span>
            </div>
            <div style="display:flex; gap:12px; align-items:center;">
              <el-button @click="resetAll">清空状态</el-button>
              <el-button
                type="primary"
                size="large"
                :disabled="publishing || selectedPlatforms.size === 0"
                @click="startPublish"
              >
                <el-icon style="margin-right:6px;"><Promotion /></el-icon>
                一键分发
              </el-button>
            </div>
          </div>
          <div v-if="publishing" class="progress-track">
            <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </section>
      </div>

      <aside class="dashboard-card">
        <h3 class="card-title">
          <el-icon class="title-icon"><DataAnalysis /></el-icon>
          数据聚合面板
        </h3>
        <p style="margin:0 0 12px; font-size:13px; color:#909399;">
          近 7 天各平台阅读量趋势（悬停节点查看当日各平台柱状图）
        </p>
        <div ref="chartRef" class="chart-container"></div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">全网总阅读量</div>
            <div class="stat-value">{{ totalViews.toLocaleString() }}</div>
            <div class="stat-trend up">↑ 较上周 +18.4%</div>
          </div>
          <div class="stat-item" style="border-left-color:#FE2C55;">
            <div class="stat-label">最高单日</div>
            <div class="stat-value">{{ peakViews.toLocaleString() }}</div>
            <div class="stat-trend up">↑ {{ peakDate }}</div>
          </div>
          <div class="stat-item" style="border-left-color:#07C160;">
            <div class="stat-label">已绑定平台</div>
            <div class="stat-value">{{ boundCount }} 个</div>
            <div class="stat-trend up">稳定增长</div>
          </div>
          <div class="stat-item" style="border-left-color:#0084FF;">
            <div class="stat-label">分发成功率</div>
            <div class="stat-value">{{ successRate }}%</div>
            <div class="stat-trend" :class="successRate >= 80 ? 'up' : 'down'">
              {{ successRate >= 80 ? '健康' : '需关注' }}
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 平台信息 & 账号绑定 抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerPlatform ? drawerPlatform.name : '平台信息'"
      direction="rtl"
      size="420px"
      :destroy-on-close="true"
    >
      <div v-if="drawerPlatform" class="drawer-body">
        <div class="drawer-hero" :style="{ background: drawerPlatform.color }">
          <div class="drawer-hero-icon">{{ drawerPlatform.letter }}</div>
          <div class="drawer-hero-text">
            <div class="drawer-hero-title">{{ drawerPlatform.name }}</div>
            <div class="drawer-hero-sub">
              {{ drawerPlatform.custom ? '自定义平台' : '内置平台' }} ·
              颜色 {{ drawerPlatform.color }}
            </div>
          </div>
        </div>

        <h4 style="margin:20px 0 10px; color:#303133;">
          <el-icon><UserFilled /></el-icon> 账号绑定信息
        </h4>

        <div v-if="bindings[drawerPlatform.key]" class="bind-info">
          <div class="bind-row">
            <span class="bind-label">登录账号</span>
            <span class="bind-value">{{ bindings[drawerPlatform.key].username }}</span>
          </div>
          <div class="bind-row">
            <span class="bind-label">登录密码</span>
            <span class="bind-value" :class="{ mask: !showPwd }">
              {{ showPwd ? bindings[drawerPlatform.key].password : '••••••••' }}
              <el-icon class="eye" @click="showPwd = !showPwd" style="cursor:pointer;">
                <component :is="showPwd ? 'Hide' : 'View'" />
              </el-icon>
            </span>
          </div>
          <div class="bind-row">
            <span class="bind-label">绑定时间</span>
            <span class="bind-value">{{ formatTime(bindings[drawerPlatform.key].boundAt) }}</span>
          </div>
          <div class="bind-row">
            <span class="bind-label">备注</span>
            <span class="bind-value">{{ bindings[drawerPlatform.key].remark || '—' }}</span>
          </div>
          <div class="bind-row" style="margin-top:6px;">
            <span class="bind-label">分发状态</span>
            <span class="bind-value">
              <el-tag size="small" :type="bindings[drawerPlatform.key].enabled ? 'success' : 'info'">
                {{ bindings[drawerPlatform.key].enabled ? '已启用' : '已停用' }}
              </el-tag>
            </span>
          </div>
        </div>
        <el-empty v-else description="尚未绑定该平台账号" :image-size="120" />

        <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
          <el-button type="primary" @click="openBindForm(drawerPlatform.key)">
            <el-icon><Edit /></el-icon>
            {{ bindings[drawerPlatform.key] ? '修改账号' : '立即绑定' }}
          </el-button>
          <el-button
            v-if="bindings[drawerPlatform.key]"
            type="warning"
            plain
            @click="toggleBindEnabled(drawerPlatform.key)"
          >
            {{ bindings[drawerPlatform.key].enabled ? '临时停用' : '启用账号' }}
          </el-button>
          <el-button
            v-if="bindings[drawerPlatform.key]"
            type="danger"
            plain
            @click="unbind(drawerPlatform.key)"
          >
            <el-icon><Delete /></el-icon>解绑
          </el-button>
          <el-button
            v-if="drawerPlatform.custom"
            plain
            @click="openCustomDialog(drawerPlatform.key)"
          >
            编辑平台信息
          </el-button>
          <el-button
            v-if="drawerPlatform.custom"
            type="danger"
            plain
            @click="deleteCustomPlatform(drawerPlatform.key)"
          >
            删除该平台
          </el-button>
        </div>

        <h4 style="margin:24px 0 10px; color:#303133;">
          <el-icon><Histogram /></el-icon> 近 7 天阅读量
        </h4>
        <div v-if="trendForDrawer.length" class="mini-stats">
          <div v-for="(item, idx) in trendForDrawer" :key="item.date" class="mini-stat">
            <div class="mini-stat-date">{{ item.date }}</div>
            <div class="mini-stat-bar" :style="{ height: item.barHeight + 'px', background: drawerPlatform.color }"></div>
            <div class="mini-stat-value">{{ item.value.toLocaleString() }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="90" />
      </div>
    </el-drawer>

    <!-- 绑定 / 修改账号 弹窗 -->
    <el-dialog v-model="bindDialogVisible" title="绑定平台账号" width="460px" :close-on-click-modal="false">
      <el-form
        ref="bindFormRef"
        :model="bindForm"
        :rules="bindRules"
        label-width="90px"
        label-position="right"
      >
        <el-form-item label="平台">
          <el-tag :color="bindForm.color" style="color:#fff;">
            {{ bindForm.letter }} {{ bindForm.platformName }}
          </el-tag>
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="bindForm.username" placeholder="请输入登录账号 / 手机号 / 邮箱" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="bindForm.password"
            type="password"
            show-password
            placeholder="请输入登录密码"
            clearable
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="bindForm.remark"
            type="textarea"
            :rows="2"
            placeholder="选填：比如小号、团队号、营销号等"
          />
        </el-form-item>
        <el-form-item label="启用分发">
          <el-switch v-model="bindForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBindForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增 / 编辑 自定义平台 弹窗 -->
    <el-dialog v-model="customDialogVisible" title="自定义平台" width="460px" :close-on-click-modal="false">
      <el-form
        ref="customFormRef"
        :model="customForm"
        :rules="customRules"
        label-width="90px"
        label-position="right"
      >
        <el-form-item label="平台名称" prop="name">
          <el-input v-model="customForm.name" placeholder="如：百度贴吧" clearable />
        </el-form-item>
        <el-form-item label="简称" prop="short">
          <el-input v-model="customForm.short" placeholder="如：贴吧" maxlength="6" clearable />
        </el-form-item>
        <el-form-item label="图标字母" prop="letter">
          <el-input v-model="customForm.letter" placeholder="如：贴" maxlength="2" clearable />
        </el-form-item>
        <el-form-item label="主题色" prop="color">
          <el-color-picker v-model="customForm.color" show-alpha />
          <span style="margin-left:10px; color:#909399; font-size:12px;">
            自定义的颜色会体现在卡片、折线图、迷你柱状图上
          </span>
        </el-form-item>
        <el-form-item label="提示">
          <span style="color:#909399; font-size:12px;">
            保存后，在平台卡片上点击即可填写账号密码完成绑定。
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="customDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCustomForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef, watch, nextTick } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  builtinPlatforms,
  loadCustomPlatforms,
  saveCustomPlatforms,
  loadBindings,
  saveBindings,
  generateTrendFor,
  genKey
} from './data/platforms.js'

const editorRef = shallowRef()
const valueHtml = ref(
  '<h2>欢迎使用多平台发布台 ✨</h2>' +
  '<p>在这里撰写内容，然后一键分发到微信公众号、小红书、知乎等多个平台。</p>' +
  '<p><b>使用提示：</b>点击下方平台卡片查看/绑定账号，或点击「新增自定义平台」添加贴吧、虎扑等社区。</p>' +
  '<ul><li>支持富文本、图片、列表</li><li>多米诺骨牌动画展示分发状态</li><li>失败平台可一键「重试」或「忽略」</li></ul>'
)
const toolbarConfig = { excludeKeys: [] }
const editorConfig = { placeholder: '请输入文章内容…' }
const handleCreated = (editor) => {
  editorRef.value = editor
}

// ============ 平台 & 自定义 ============
const customPlatforms = ref(loadCustomPlatforms())
const bindings = ref(loadBindings())

const platformsList = computed(() => {
  return [
    ...builtinPlatforms.map((p) => ({ ...p, builtin: true })),
    ...customPlatforms.value.map((p) => ({ ...p, custom: true }))
  ]
})

watch(
  platformsList,
  () => {
    nextTick(renderChart)
  },
  { deep: true }
)

const boundCount = computed(() => Object.values(bindings.value).filter(Boolean).length)

// ============ 分发相关 ============
const selectedPlatforms = ref(new Set())
const platformStatus = reactive({})
const publishing = ref(false)
const publishQueue = ref([])
const completedCount = ref(0)

const progressPercent = computed(() => {
  if (!publishing.value) return 0
  const total = publishQueue.value.length || 1
  return Math.round((completedCount.value / total) * 100)
})
const successCount = computed(() => Object.values(platformStatus).filter((s) => s === 'success').length)
const failCount = computed(() => Object.values(platformStatus).filter((s) => s === 'failed').length)
const successRate = computed(() => {
  const total = successCount.value + failCount.value
  if (total === 0) return 100
  return Math.round((successCount.value / total) * 100)
})

const handlePlatformClick = (key) => {
  if (publishing.value) {
    ElMessage.info('分发进行中，点击无效')
    return
  }
  // 未绑定的：直接打开抽屉让用户去绑
  if (!bindings.value[key]) {
    openDrawer(key)
    return
  }
  // 已绑定：先切换选中状态，再打开抽屉查看信息
  const next = new Set(selectedPlatforms.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selectedPlatforms.value = next
  openDrawer(key)
}

const getStatusText = (key) => {
  const s = platformStatus[key]
  const p = platformsList.value.find((pp) => pp.key === key)
  const name = p?.short || key
  if (s === 'publishing') return `正在同步至${name}…`
  if (s === 'success') return '发布成功 ✓'
  if (s === 'failed') return '发布失败 ✗'
  if (s === 'ignored') return '已忽略'
  if (!bindings.value[key]) return '点击绑定'
  return selectedPlatforms.value.has(key) ? '待发布' : '未选择'
}

const mockPublishCall = (key) => {
  return new Promise((resolve, reject) => {
    const delay = 900 + Math.random() * 1600
    setTimeout(() => {
      if (Math.random() < 0.18) reject(new Error(`${key} API 调用失败`))
      else resolve({ ok: true, key })
    }, delay)
  })
}

const startPublish = async () => {
  if (publishing.value) return
  const queue = platformsList.value.filter((p) => {
    if (!selectedPlatforms.value.has(p.key)) return false
    const bind = bindings.value[p.key]
    if (!bind || !bind.enabled) return false
    return true
  })
  if (queue.length === 0) {
    ElMessage.warning('请先选择并绑定至少一个启用中的平台')
    return
  }

  publishing.value = true
  publishQueue.value = queue
  completedCount.value = 0

  for (const p of queue) {
    if (platformStatus[p.key] === 'ignored') {
      completedCount.value += 1
      continue
    }
    platformStatus[p.key] = 'publishing'
    try {
      await mockPublishCall(p.key)
      platformStatus[p.key] = 'success'
    } catch {
      platformStatus[p.key] = 'failed'
    }
    completedCount.value += 1
  }

  publishing.value = false
  ElMessage.success('分发任务已完成')
}

const retryPlatform = async (key) => {
  if (!bindings.value[key]) {
    ElMessage.warning('该平台尚未绑定账号')
    return
  }
  platformStatus[key] = 'publishing'
  try {
    await mockPublishCall(key)
    platformStatus[key] = 'success'
    ElMessage.success(`${platformsList.value.find((p) => p.key === key)?.short} 重试成功`)
  } catch {
    platformStatus[key] = 'failed'
    ElMessage.error('重试失败，请稍后再试')
  }
}

const ignorePlatform = (key) => {
  platformStatus[key] = 'ignored'
}

const resetAll = () => {
  if (publishing.value) {
    ElMessage.warning('正在分发中，请等待完成')
    return
  }
  Object.keys(platformStatus).forEach((k) => delete platformStatus[k])
  completedCount.value = 0
  ElMessage.info('状态已清空')
}

// ============ 抽屉：平台详情 ============
const drawerVisible = ref(false)
const drawerKey = ref(null)
const showPwd = ref(false)

const drawerPlatform = computed(() => platformsList.value.find((p) => p.key === drawerKey.value))

const openDrawer = (key) => {
  drawerKey.value = key
  showPwd.value = false
  drawerVisible.value = true
}

const trendForDrawer = computed(() => {
  const p = drawerPlatform.value
  if (!p) return []
  const trend = generateTrendFor([p.key])
  const arr = trend.series[p.key] || []
  const max = Math.max(...arr, 1)
  return arr.map((v, i) => ({
    date: trend.dates[i],
    value: v,
    barHeight: Math.round((v / max) * 80) + 12
  }))
})

const formatTime = (ts) => {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const toggleBindEnabled = (key) => {
  const b = bindings.value[key]
  if (!b) return
  b.enabled = !b.enabled
  bindings.value = { ...bindings.value, [key]: { ...b } }
  saveBindings(bindings.value)
  ElMessage.success(b.enabled ? '已启用该账号分发' : '已停用该账号分发')
}

const unbind = async (key) => {
  try {
    await ElMessageBox.confirm('解绑后将无法分发到该平台，是否继续？', '确认解绑', {
      confirmButtonText: '解绑',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const next = { ...bindings.value }
    delete next[key]
    bindings.value = next
    saveBindings(next)
    // 同步移除选中状态
    const s = new Set(selectedPlatforms.value)
    s.delete(key)
    selectedPlatforms.value = s
    ElMessage.success('已解绑')
  } catch {}
}

// ============ 绑定表单弹窗 ============
const bindDialogVisible = ref(false)
const bindFormRef = ref()
const bindForm = reactive({ platformKey: '', platformName: '', letter: '', color: '', username: '', password: '', remark: '', enabled: true })
const bindRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const openBindForm = (key) => {
  const p = platformsList.value.find((pp) => pp.key === key)
  if (!p) return
  const exist = bindings.value[key]
  bindForm.platformKey = key
  bindForm.platformName = p.name
  bindForm.letter = p.letter
  bindForm.color = p.color
  bindForm.username = exist?.username || ''
  bindForm.password = exist?.password || ''
  bindForm.remark = exist?.remark || ''
  bindForm.enabled = exist ? !!exist.enabled : true
  bindDialogVisible.value = true
  nextTick(() => bindFormRef.value?.clearValidate())
}

const submitBindForm = async () => {
  try {
    await bindFormRef.value.validate()
  } catch {
    return
  }
  const key = bindForm.platformKey
  const next = { ...bindings.value }
  const existing = next[key]
  next[key] = {
    username: bindForm.username.trim(),
    password: bindForm.password,
    remark: bindForm.remark,
    enabled: bindForm.enabled,
    boundAt: existing?.boundAt || Date.now()
  }
  bindings.value = next
  saveBindings(next)
  // 如果绑定的是启用状态，默认选中它
  if (next[key].enabled) {
    const s = new Set(selectedPlatforms.value)
    s.add(key)
    selectedPlatforms.value = s
  }
  ElMessage.success(existing ? '账号信息已更新' : '绑定成功')
  bindDialogVisible.value = false
}

// ============ 自定义平台弹窗 ============
const customDialogVisible = ref(false)
const customFormRef = ref()
const customForm = reactive({ editKey: '', name: '', short: '', letter: '', color: '#409EFF' })
const customRules = {
  name: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  short: [{ required: true, message: '请输入简称', trigger: 'blur' }],
  letter: [{ required: true, message: '请输入 1-2 个字符的图标字母', trigger: 'blur' }],
  color: [{ required: true, message: '请选择主题色', trigger: 'change' }]
}

const openCustomDialog = (key) => {
  if (key) {
    const p = customPlatforms.value.find((pp) => pp.key === key)
    if (!p) return
    customForm.editKey = key
    customForm.name = p.name
    customForm.short = p.short
    customForm.letter = p.letter
    customForm.color = p.color
  } else {
    customForm.editKey = ''
    customForm.name = ''
    customForm.short = ''
    customForm.letter = ''
    customForm.color = '#409EFF'
  }
  customDialogVisible.value = true
  nextTick(() => customFormRef.value?.clearValidate())
}

const submitCustomForm = async () => {
  try {
    await customFormRef.value.validate()
  } catch {
    return
  }
  const letter = customForm.letter.trim().slice(0, 2)
  if (customForm.editKey) {
    const next = customPlatforms.value.map((p) =>
      p.key === customForm.editKey
        ? { ...p, name: customForm.name.trim(), short: customForm.short.trim(), letter, color: customForm.color }
        : p
    )
    customPlatforms.value = next
    saveCustomPlatforms(next)
    ElMessage.success('平台信息已更新')
  } else {
    const newP = {
      key: genKey('custom'),
      name: customForm.name.trim(),
      short: customForm.short.trim(),
      letter,
      color: customForm.color
    }
    const next = [...customPlatforms.value, newP]
    customPlatforms.value = next
    saveCustomPlatforms(next)
    ElMessage.success(`已新增平台 "${newP.name}"，现在点击它绑定账号即可分发`)
  }
  customDialogVisible.value = false
}

const deleteCustomPlatform = async (key) => {
  const p = customPlatforms.value.find((pp) => pp.key === key)
  if (!p) return
  try {
    await ElMessageBox.confirm(`确认删除自定义平台 "${p.name}"？相关的账号绑定也会一并清除。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    customPlatforms.value = customPlatforms.value.filter((pp) => pp.key !== key)
    saveCustomPlatforms(customPlatforms.value)
    const nextBind = { ...bindings.value }
    delete nextBind[key]
    bindings.value = nextBind
    saveBindings(nextBind)
    const s = new Set(selectedPlatforms.value)
    s.delete(key)
    selectedPlatforms.value = s
    drawerVisible.value = false
    ElMessage.success('已删除')
  } catch {}
}

// ============ 图表 ============
let chartInstance = null
const chartRef = ref(null)

const dashboardTrend = computed(() => generateTrendFor(platformsList.value.map((p) => p.key)))

const totalViews = computed(() => {
  return Object.values(dashboardTrend.value.series).reduce(
    (sum, arr) => sum + arr.reduce((a, b) => a + b, 0),
    0
  )
})

const peakViews = computed(() => {
  let peak = 0
  Object.values(dashboardTrend.value.series).forEach((arr) => {
    arr.forEach((v) => {
      if (v > peak) peak = v
    })
  })
  return peak
})

const peakDate = computed(() => {
  let peak = 0
  let peakIdx = 0
  Object.values(dashboardTrend.value.series).forEach((arr) => {
    arr.forEach((v, i) => {
      if (v > peak) {
        peak = v
        peakIdx = i
      }
    })
  })
  return dashboardTrend.value.dates[peakIdx] || '—'
})

const renderChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const list = platformsList.value
  const trend = dashboardTrend.value
  const series = list.map((p) => ({
    name: p.short,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    showSymbol: false,
    emphasis: { focus: 'series', scale: 1.6 },
    lineStyle: { width: 2.2 },
    itemStyle: { color: p.color },
    data: trend.series[p.key] || []
  }))

  const option = {
    color: list.map((p) => p.color),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#ebeef5',
      borderWidth: 1,
      textStyle: { color: '#303133' },
      extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.12); border-radius:8px;',
      formatter: (params) => {
        const date = trend.dates[params.dataIndex]
        const bars = list
          .map((p) => {
            const val = trend.series[p.key][params.dataIndex]
            const max = Math.max(...list.map((pp) => trend.series[pp.key][params.dataIndex]))
            const w = max ? Math.round((val / max) * 120) : 0
            return `
              <div style="display:flex;align-items:center;gap:8px;margin:4px 0;font-size:12px;">
                <span style="width:56px;color:#606266;">${p.short}</span>
                <div style="flex:1;background:#f0f2f5;border-radius:4px;overflow:hidden;height:10px;min-width:160px;">
                  <div style="width:${w}px;height:100%;background:${p.color};transition:width .3s;"></div>
                </div>
                <span style="width:56px;text-align:right;font-weight:600;color:#303133;">${val.toLocaleString()}</span>
              </div>
            `
          })
          .join('')
        return `
          <div style="padding:4px 2px;min-width:260px;">
            <div style="font-weight:600;margin-bottom:6px;color:#303133;">${date} 各平台阅读量</div>
            ${bars}
          </div>
        `
      }
    },
    legend: {
      data: list.map((p) => p.short),
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 12, color: '#606266' },
      type: 'scroll'
    },
    grid: { left: 48, right: 16, top: 24, bottom: 56 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.dates,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    series
  }

  chartInstance.setOption(option, true)
}

const handleResize = () => {
  chartInstance && chartInstance.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>
