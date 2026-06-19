<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-title">
        <el-icon :size="26" color="#5b6cff"><MagicStick /></el-icon>
        <div>
          <h1>敏捷任务看板</h1>
          <div class="subtitle">
            Agile Kanban · Vue 3 + Element Plus + VueDraggable + ECharts
          </div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="stats">
          <div class="row"><span>总任务</span><b>{{ totalTasks }}</b></div>
          <div class="row"><span>已完成</span><b>{{ doneCount }}</b></div>
          <div class="row"><span>完成率</span><b>{{ completionRate }}%</b></div>
          <div class="row" style="color:#e83e3a"><span>停滞(&gt;3天)</span><b>{{ stuckCount }}</b></div>
        </div>
        <div class="chart-wrap">
          <v-chart :option="gaugeOption" autoresize />
        </div>
      </div>
    </header>

    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="showAdd = true">
        新建任务
      </el-button>
      <el-button :icon="Operation" @click="simulateStuck">
        演示：模拟一个停滞 3 天的任务
      </el-button>
      <el-button plain :icon="Refresh" @click="resetDemo">
        重置演示数据
      </el-button>
      <span class="banner-tip">
        💡 把任务拖到「已完成」列触发撒花 &amp; 进度条里程碑时播放 Level Up 音效
      </span>
    </div>

    <section class="kanban-board">
      <div
        v-for="col in columns"
        :key="col.key"
        class="kanban-col"
        :class="{
          'drop-target': dragOverColumn === col.key,
          completed: col.key === 'done'
        }"
      >
        <div class="col-title">
          <div class="left">
            <span class="dot" :style="{ background: col.color }"></span>
            {{ col.title }}
            <span class="count">{{ tasksByCol[col.key].length }}</span>
          </div>
          <el-icon :size="16" color="#9aa2b5"><component :is="col.icon" /></el-icon>
        </div>

        <draggable
          :list="tasksByCol[col.key]"
          group="kanban-tasks"
          item-key="id"
          class="col-body"
          ghost-class="sortable-ghost"
          drag-class="sortable-drag"
          chosen-class="sortable-chosen"
          animation="300"
          :data-col="col.key"
          @start="onDragStart"
          @change="(evt) => onDragChange(evt, col.key)"
          @end="(evt) => onDragEnd(evt, col.key)"
        >
          <template #item="{ element }">
            <div
              class="task-card"
              :class="{
                stuck: isStuck(element),
                'snap-in': snapIds.has(element.id)
              }"
              :data-id="element.id"
            >
              <el-tooltip
                v-if="isStuck(element)"
                effect="light"
                placement="top"
                :content="`此任务已停留 ${daysInProgress(element)} 天，请检查是否遇到阻塞`"
                visible-arrow
              >
                <div class="snail-badge">🐌</div>
              </el-tooltip>

              <div class="task-title">
                <el-tag
                  size="small"
                  :type="priorityTagType(element.priority)"
                  effect="light"
                  style="margin-right:6px"
                >
                  {{ element.priority === 'high' ? '高' : element.priority === 'mid' ? '中' : '低' }}
                </el-tag>
                {{ element.title }}
              </div>
              <div class="task-desc">{{ element.description }}</div>
              <div class="task-meta">
                <div class="tags">
                  <span class="tag-pill" v-for="t in element.tags" :key="t">#{{ t }}</span>
                </div>
                <div>
                  <el-icon :size="14" style="vertical-align:-2px"><User /></el-icon>
                  &nbsp;{{ element.owner }}
                  &nbsp;·&nbsp;
                  <el-tooltip content="删除任务" placement="top">
                    <el-icon
                      :size="14"
                      style="cursor:pointer;color:#c0392b;vertical-align:-2px"
                      @click.stop="removeTask(element.id)"
                    >
                      <Delete />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <div class="add-row">
          <el-input
            v-model="quickAddText[col.key]"
            placeholder="快速添加任务..."
            size="small"
            @keyup.enter="quickAdd(col.key)"
          />
          <el-button size="small" type="primary" @click="quickAdd(col.key)">
            添加
          </el-button>
        </div>
      </div>
    </section>

    <el-dialog v-model="showAdd" title="新建任务" width="480px">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="newTask.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newTask.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="newTask.owner" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="newTask.priority">
            <el-radio-button label="high">高</el-radio-button>
            <el-radio-button label="mid">中</el-radio-button>
            <el-radio-button label="low">低</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="所属列">
          <el-select v-model="newTask.column">
            <el-option
              v-for="c in columns"
              :key="c.key"
              :label="c.title"
              :value="c.key"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="submitNew">确定</el-button>
      </template>
    </el-dialog>

    <transition name="fade">
      <div v-if="showLevelUp" class="level-up-toast">🎉 Level Up · 团队效能提升！</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import draggable from 'vuedraggable'
import confetti from 'canvas-confetti'
import { ElMessage } from 'element-plus'
import {
  Plus, Operation, Refresh, User, Delete,
  MagicStick, Document, Loading, CircleCheck, Finished
} from '@element-plus/icons-vue'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const STUCK_DAYS = 3
const uid = () => 't_' + Math.random().toString(36).slice(2, 9)

const initialTasks = () => [
  { id: uid(), title: '设计登录页视觉稿', description: '产出登录/注册页 UI 稿及切图', owner: 'Amy',   priority: 'high', tags: ['设计', 'UI'], column: 'todo',       createdAt: Date.now() - 1 * MS_PER_DAY, movedInAt: Date.now() - 1 * MS_PER_DAY },
  { id: uid(), title: '搭建项目脚手架',   description: 'Vue3 + Vite + Element Plus 基础工程',  owner: 'Bob',   priority: 'mid',  tags: ['工程化'],     column: 'todo',       createdAt: Date.now() - 2 * MS_PER_DAY, movedInAt: Date.now() - 2 * MS_PER_DAY },
  { id: uid(), title: '后端接口文档对齐', description: '与后端同学对齐 REST 接口字段',          owner: 'Cathy', priority: 'mid',  tags: ['协作'],       column: 'inprogress', createdAt: Date.now() - 5 * MS_PER_DAY, movedInAt: Date.now() - 5 * MS_PER_DAY },
  { id: uid(), title: '登录/鉴权前端实现', description: '完成登录流程、Token 本地管理',          owner: 'David', priority: 'high', tags: ['前端'],       column: 'inprogress', createdAt: Date.now() - 2 * MS_PER_DAY, movedInAt: Date.now() - 2 * MS_PER_DAY },
  { id: uid(), title: '看板拖拽交互联调', description: '打通 VueDraggable 与数据层',             owner: 'Evan',  priority: 'high', tags: ['交互'],       column: 'testing',    createdAt: Date.now() - 1 * MS_PER_DAY, movedInAt: Date.now() - 1 * MS_PER_DAY },
  { id: uid(), title: '首屏加载性能优化', description: '首屏 < 2s，核心指标达标',                 owner: 'Fiona', priority: 'low',  tags: ['性能'],       column: 'done',       createdAt: Date.now() - 7 * MS_PER_DAY, movedInAt: Date.now() - 4 * MS_PER_DAY },
  { id: uid(), title: '埋点数据上报',     description: '完成关键用户行为事件上报',               owner: 'George',priority: 'low',  tags: ['数据'],       column: 'done',       createdAt: Date.now() - 10 * MS_PER_DAY, movedInAt: Date.now() - 6 * MS_PER_DAY }
]

const columns = [
  { key: 'todo',       title: '待办',   color: '#94a3b8', icon: Document },
  { key: 'inprogress', title: '进行中', color: '#5b6cff', icon: Loading },
  { key: 'testing',    title: '测试中', color: '#f6a723', icon: Finished },
  { key: 'done',       title: '已完成', color: '#2f9e44', icon: CircleCheck }
]
const COLUMN_KEYS = columns.map(c => c.key)

// ===== 唯一真实数据源：所有显示都从它派生 =====
const flatTasks = ref([])

// VueDraggable 需要可写数组（它会直接 push/splice），所以 tasksByCol 各列存真实数组
// 放在 reactive 容器中，并在 flatTasks 变化时由 syncColumnsFromFlat 统一重新填充。
// 列标题的 length 和仪表盘 doneCount 都从 tasksByCol 读取，保证二者一致。
const tasksByCol = reactive({
  todo:       [],
  inprogress: [],
  testing:    [],
  done:       []
})

// 把一列内容替换为新数组（保留响应式）
function setColumn(colKey, arr) {
  tasksByCol[colKey].length = 0
  for (const item of arr) tasksByCol[colKey].push(item)
}

// 按 flatTasks 中各任务对象的原始出现顺序分入各列
function syncColumnsFromFlat() {
  const buckets = { todo: [], inprogress: [], testing: [], done: [] }
  for (const t of flatTasks.value) {
    const key = buckets[t.column] ? t.column : 'todo'
    buckets[key].push(t)
  }
  for (const key of COLUMN_KEYS) {
    setColumn(key, buckets[key])
  }
}

// ===== 仪表盘统计 =====
// 仪表盘计数与列标题计数全部从 tasksByCol 读取，保持单一显示副本的一致性
const totalTasks   = computed(() => flatTasks.value.length)
const doneCount    = computed(() => tasksByCol.done.length)
const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((doneCount.value / totalTasks.value) * 100)
})
const stuckCount   = computed(() =>
  tasksByCol.inprogress.filter(t => isStuckByBase(t)).length
)

const gaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      radius: '95%',
      pointer: { show: false },
      progress: {
        show: true,
        width: 14,
        roundCap: true,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#5b6cff' },
              { offset: 1, color: '#26c6ff' }
            ]
          }
        }
      },
      axisLine: { lineStyle: { width: 14, color: [[1, '#eef1f9']] } },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      data: [{ value: completionRate.value }],
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        fontWeight: 700,
        offsetCenter: [0, '0%'],
        formatter: '{value}%',
        color: '#1f2230'
      }
    }
  ]
}))

// ===== 辅助函数 =====
function priorityTagType(p) {
  return p === 'high' ? 'danger' : p === 'mid' ? 'warning' : 'success'
}

function daysInProgress(task) {
  if (task.column !== 'inprogress') return 0
  const base = task.movedInAt || task.createdAt || Date.now()
  return Math.floor((Date.now() - base) / MS_PER_DAY)
}

function isStuckByBase(task) {
  const base = task.movedInAt || task.createdAt || Date.now()
  return Math.floor((Date.now() - base) / MS_PER_DAY) >= STUCK_DAYS
}

function isStuck(task) {
  return task.column === 'inprogress' && isStuckByBase(task)
}

function markSnap(id) {
  snapIds.value.add(id)
  setTimeout(() => snapIds.value.delete(id), 500)
}

// ===== 拖拽事件 =====
const dragOverColumn = ref(null)
const snapIds = ref(new Set())
const pendingMovedIds = ref(new Set()) // 在本列本轮 change 中新进入的任务 id

function onDragStart(/* evt */) {
  dragOverColumn.value = null
  pendingMovedIds.value = new Set()
}

function onDragChange(evt, colKey) {
  // 目标列高亮
  dragOverColumn.value = colKey

  // 记录本列被拖进来的任务 id，以便 onDragEnd 更新 flatTasks.column
  if (evt && evt.added && Array.isArray(evt.added.elements)) {
    for (const el of evt.added.elements) {
      const id = el && el.dataset && el.dataset.id
      if (id) pendingMovedIds.value.add(id)
    }
  }
  // 列内排序：VueDraggable 会直接调整 tasksByCol[colKey] 数组顺序
  // 我们也需要把这份新顺序写回 flatTasks（保持 flatTasks 的顺序为最终来源）
  if (evt && evt.moved !== undefined) {
    writeColumnOrderBackToFlat(colKey)
  }
}

function onDragEnd(evt, targetColKey) {
  const domId = evt && evt.item && evt.item.dataset && evt.item.dataset.id
  dragOverColumn.value = null

  // 1) 优先以 DOM dataset.id 为准
  const explicitId = domId || pickFromPending(targetColKey)

  if (explicitId) {
    applyColumnChange(explicitId, targetColKey)
  } else {
    // 2) 兜底：以 tasksByCol 当前内容为准对齐 flatTasks 的 column 字段
    for (const col of COLUMN_KEYS) {
      const idsInCol = new Set(tasksByCol[col].map(t => t.id))
      for (const t of flatTasks.value) {
        if (idsInCol.has(t.id) && t.column !== col) {
          t.column = col
          t.movedInAt = Date.now()
          markSnap(t.id)
        }
      }
    }
  }

  // 3) 统一重新同步：把 flatTasks 的最新顺序写入 tasksByCol
  syncColumnsFromFlat()

  pendingMovedIds.value = new Set()
  if (targetColKey === 'done') {
    fireConfetti()
    maybePlayLevelUp()
  }
}

// 把列内的新顺序写回 flatTasks：调整 flatTasks 中这些任务的顺序
function writeColumnOrderBackToFlat(colKey) {
  const colIds = tasksByCol[colKey].map(t => t.id)
  const orderIndex = new Map(colIds.map((id, i) => [id, i]))
  // 将 flatTasks 中属于此列的任务的位置按列数组新顺序调整
  const others = flatTasks.value.filter(t => t.column !== colKey)
  const inCol  = flatTasks.value.filter(t => t.column === colKey)
  inCol.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0))
  // 重新拼回 flatTasks：保持非此列任务的相对顺序，然后把列内任务按新顺序插入
  flatTasks.value = [...others, ...inCol]
}

function pickFromPending(targetColKey) {
  const ids = [...pendingMovedIds.value]
  if (ids.length === 0) return null
  if (ids.length === 1) return ids[0]
  for (const id of ids) {
    const t = flatTasks.value.find(x => x.id === id)
    if (t && t.column !== targetColKey) return id
  }
  return ids[0]
}

// 核心：把一个任务移到目标列，唯一要做的就是修改它的 column 字段
function applyColumnChange(taskId, targetColKey) {
  const task = flatTasks.value.find(t => t.id === taskId)
  if (!task) return
  if (task.column === targetColKey) {
    return
  }
  task.column = targetColKey
  task.movedInAt = Date.now()
  markSnap(task.id)
}

// ===== 特效 =====
let levelUpAudioCtx = null
function fireConfetti() {
  const duration = 1800
  const end = Date.now() + duration
  const colors = ['#5b6cff', '#26c6ff', '#f6a723', '#2f9e44', '#e53e3e', '#b37cff']
  const frame = () => {
    confetti({ particleCount: 5, angle: 60,  spread: 80, origin: { x: 0.0, y: 0.7 }, colors })
    confetti({ particleCount: 5, angle: 120, spread: 80, origin: { x: 1.0, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  confetti({ particleCount: 120, spread: 110, origin: { y: 0.6 }, colors })
  requestAnimationFrame(frame)
}

function playLevelUp() {
  try {
    if (!levelUpAudioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      levelUpAudioCtx = new AC()
    }
    const ctx = levelUpAudioCtx
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + i * 0.09)
      gain.gain.setValueAtTime(0.0001, now + i * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.09 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.09)
      osc.stop(now + i * 0.09 + 0.4)
    })
  } catch (e) { /* noop */ }
}

const showLevelUp = ref(false)
const prevCompletion = ref(0)

function maybePlayLevelUp() {
  const current = completionRate.value
  const prev = prevCompletion.value
  const thresholds = [25, 50, 75, 100]
  const crossed = thresholds.find(t => prev < t && current >= t)
  prevCompletion.value = current
  if (crossed !== undefined) {
    showLevelUp.value = true
    playLevelUp()
    setTimeout(() => { showLevelUp.value = false }, 1600)
    ElMessage.success(`达成 ${crossed}% 里程碑 · Level Up!`)
  }
}

// ===== CRUD 操作 =====
const quickAddText = reactive({ todo: '', inprogress: '', testing: '', done: '' })

function quickAdd(colKey) {
  const text = (quickAddText[colKey] || '').trim()
  if (!text) return
  flatTasks.value.push({
    id: uid(),
    title: text,
    description: '快速添加的任务',
    owner: 'Me',
    priority: 'mid',
    tags: ['新任务'],
    column: colKey,
    createdAt: Date.now(),
    movedInAt: Date.now()
  })
  quickAddText[colKey] = ''
  syncColumnsFromFlat()
}

const showAdd = ref(false)
const newTask = reactive({
  title: '',
  description: '',
  owner: 'Me',
  priority: 'mid',
  column: 'todo'
})

function submitNew() {
  if (!newTask.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  flatTasks.value.push({
    id: uid(),
    title: newTask.title.trim(),
    description: newTask.description.trim() || '（无描述）',
    owner: newTask.owner || 'Me',
    priority: newTask.priority,
    tags: ['手动创建'],
    column: newTask.column,
    createdAt: Date.now(),
    movedInAt: Date.now()
  })
  newTask.title = ''
  newTask.description = ''
  newTask.owner = 'Me'
  newTask.priority = 'mid'
  newTask.column = 'todo'
  showAdd.value = false
  syncColumnsFromFlat()
  ElMessage.success('任务已创建')
}

function removeTask(id) {
  flatTasks.value = flatTasks.value.filter(t => t.id !== id)
  syncColumnsFromFlat()
}

function simulateStuck() {
  const inprogress = flatTasks.value.filter(t => t.column === 'inprogress')
  if (inprogress.length === 0) {
    flatTasks.value.push({
      id: uid(),
      title: '遗留系统迁移评估',
      description: '这是一个演示用的停滞任务',
      owner: 'Alex',
      priority: 'high',
      tags: ['阻塞', '演示'],
      column: 'inprogress',
      createdAt: Date.now() - 10 * MS_PER_DAY,
      movedInAt: Date.now() - (STUCK_DAYS + 1) * MS_PER_DAY
    })
    syncColumnsFromFlat()
    ElMessage.info('已新建一个停滞 3+ 天的进行中任务')
    return
  }
  // 把第一个进行中任务改成停滞 3+ 天：需要触发 reactivity，所以整体替换一次
  flatTasks.value = flatTasks.value.map(t =>
    t.id === inprogress[0].id && t.column === 'inprogress'
      ? { ...t, movedInAt: Date.now() - (STUCK_DAYS + 1) * MS_PER_DAY }
      : t
  )
  syncColumnsFromFlat()
  ElMessage.info('已将一个进行中的任务模拟为停滞 3 天以上')
}

function resetDemo() {
  snapIds.value = new Set()
  flatTasks.value = initialTasks()
  syncColumnsFromFlat()
  prevCompletion.value = completionRate.value
  ElMessage.info('演示数据已重置')
}

// ===== 生命周期 =====
let staleTimer = null
onMounted(() => {
  resetDemo()
  prevCompletion.value = completionRate.value
  // 每分钟轻微刷新一次，让「停滞 3 天」的判断在长时间打开页面下自然生效
  staleTimer = setInterval(() => {
    flatTasks.value = [...flatTasks.value]
    syncColumnsFromFlat()
  }, 60 * 1000)
})
onBeforeUnmount(() => {
  if (staleTimer) clearInterval(staleTimer)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
