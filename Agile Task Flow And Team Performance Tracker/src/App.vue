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
          <div class="row" style="color:#e8833a"><span>停滞(&gt;3天)</span><b>{{ stuckCount }}</b></div>
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
          v-model="tasksByCol[col.key]"
          group="kanban-tasks"
          item-key="id"
          class="col-body"
          ghost-class="sortable-ghost"
          drag-class="sortable-drag"
          chosen-class="sortable-chosen"
          animation="300"
          @start="onDragStart"
          @change="(evt) => onDragChange(evt, col.key)"
          @end="onDragEnd"
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
  { id: uid(), title: '设计登录页视觉稿', description: '产出登录/注册页 UI 稿及切图', owner: 'Amy', priority: 'high', tags: ['设计', 'UI'], column: 'todo', createdAt: Date.now() - 1 * MS_PER_DAY, movedInAt: Date.now() - 1 * MS_PER_DAY },
  { id: uid(), title: '搭建项目脚手架', description: 'Vue3 + Vite + Element Plus 基础工程', owner: 'Bob', priority: 'mid', tags: ['工程化'], column: 'todo', createdAt: Date.now() - 2 * MS_PER_DAY, movedInAt: Date.now() - 2 * MS_PER_DAY },
  { id: uid(), title: '后端接口文档对齐', description: '与后端同学对齐 REST 接口字段', owner: 'Cathy', priority: 'mid', tags: ['协作'], column: 'inprogress', createdAt: Date.now() - 5 * MS_PER_DAY, movedInAt: Date.now() - 5 * MS_PER_DAY },
  { id: uid(), title: '登录/鉴权前端实现', description: '完成登录流程、Token 本地管理', owner: 'David', priority: 'high', tags: ['前端'], column: 'inprogress', createdAt: Date.now() - 2 * MS_PER_DAY, movedInAt: Date.now() - 2 * MS_PER_DAY },
  { id: uid(), title: '看板拖拽交互联调', description: '打通 VueDraggable 与数据层', owner: 'Evan', priority: 'high', tags: ['交互'], column: 'testing', createdAt: Date.now() - 1 * MS_PER_DAY, movedInAt: Date.now() - 1 * MS_PER_DAY },
  { id: uid(), title: '首屏加载性能优化', description: '首屏 < 2s，核心指标达标', owner: 'Fiona', priority: 'low', tags: ['性能'], column: 'done', createdAt: Date.now() - 7 * MS_PER_DAY, movedInAt: Date.now() - 4 * MS_PER_DAY },
  { id: uid(), title: '埋点数据上报', description: '完成关键用户行为事件上报', owner: 'George', priority: 'low', tags: ['数据'], column: 'done', createdAt: Date.now() - 10 * MS_PER_DAY, movedInAt: Date.now() - 6 * MS_PER_DAY }
]

const columns = [
  { key: 'todo', title: '待办', color: '#94a3b8', icon: Document },
  { key: 'inprogress', title: '进行中', color: '#5b6cff', icon: Loading },
  { key: 'testing', title: '测试中', color: '#f6a723', icon: Finished },
  { key: 'done', title: '已完成', color: '#2f9e44', icon: CircleCheck }
]

// 每列使用独立的 reactive 数组，直接绑定给 VueDraggable 的 v-model
const todoList = reactive([])
const inprogressList = reactive([])
const testingList = reactive([])
const doneList = reactive([])

const tasksByCol = reactive({
  todo: todoList,
  inprogress: inprogressList,
  testing: testingList,
  done: doneList
})

const dragOverColumn = ref(null)
const snapIds = ref(new Set())
const quickAddText = reactive({ todo: '', inprogress: '', testing: '', done: '' })

const showAdd = ref(false)
const newTask = reactive({
  title: '',
  description: '',
  owner: 'Me',
  priority: 'mid',
  column: 'todo'
})

const showLevelUp = ref(false)
const prevCompletion = ref(0)
let levelUpAudioCtx = null

const totalTasks = computed(() =>
  todoList.length + inprogressList.length + testingList.length + doneList.length
)
const doneCount = computed(() => doneList.length)
const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((doneList.length / totalTasks.value) * 100)
})
const stuckCount = computed(() => inprogressList.filter(t => isStuckByBase(t, t.column)).length)

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

function priorityTagType(p) {
  return p === 'high' ? 'danger' : p === 'mid' ? 'warning' : 'success'
}

function daysInProgress(task) {
  if (task.column !== 'inprogress') return 0
  const base = task.movedInAt || task.createdAt || Date.now()
  return Math.floor((Date.now() - base) / MS_PER_DAY)
}

function isStuckByBase(task, colKey) {
  if (colKey !== 'inprogress') return false
  const base = task.movedInAt || task.createdAt || Date.now()
  return Math.floor((Date.now() - base) / MS_PER_DAY) >= STUCK_DAYS
}

function isStuck(task) {
  return isStuckByBase(task, task.column)
}

function markSnap(id) {
  snapIds.value.add(id)
  setTimeout(() => snapIds.value.delete(id), 500)
}

function onDragStart(/* evt */) {
  dragOverColumn.value = null
}

function onDragChange(evt, colKey) {
  if (evt && (evt.added || evt.moved)) {
    dragOverColumn.value = colKey
  }
}

function onDragEnd(evt) {
  const id = evt && evt.item && evt.item.dataset && evt.item.dataset.id
  dragOverColumn.value = null
  if (!id) return

  const target = findColumnOfTask(id)
  if (!target) return
  const { colKey, task } = target

  // 同步 column 字段并刷新 movedInAt（进入新列时重置计时）
  task.column = colKey
  task.movedInAt = Date.now()
  markSnap(task.id)

  if (colKey === 'done') {
    fireConfetti()
    maybePlayLevelUp()
  }
}

function findColumnOfTask(id) {
  for (const colKey of ['todo', 'inprogress', 'testing', 'done']) {
    const list = tasksByCol[colKey]
    const t = list.find(x => x.id === id)
    if (t) return { colKey, task: t }
  }
  return null
}

function fireConfetti() {
  const duration = 1800
  const end = Date.now() + duration
  const colors = ['#5b6cff', '#26c6ff', '#f6a723', '#2f9e44', '#e53e3e', '#b37cff']
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 80, origin: { x: 0.0, y: 0.7 }, colors })
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

function quickAdd(colKey) {
  const text = (quickAddText[colKey] || '').trim()
  if (!text) return
  const t = {
    id: uid(),
    title: text,
    description: '快速添加的任务',
    owner: 'Me',
    priority: 'mid',
    tags: ['新任务'],
    column: colKey,
    createdAt: Date.now(),
    movedInAt: Date.now()
  }
  tasksByCol[colKey].push(t)
  quickAddText[colKey] = ''
  markSnap(t.id)
}

function submitNew() {
  if (!newTask.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  const t = {
    id: uid(),
    title: newTask.title.trim(),
    description: newTask.description.trim() || '（无描述）',
    owner: newTask.owner || 'Me',
    priority: newTask.priority,
    tags: ['手动创建'],
    column: newTask.column,
    createdAt: Date.now(),
    movedInAt: Date.now()
  }
  tasksByCol[newTask.column].push(t)
  markSnap(t.id)
  newTask.title = ''
  newTask.description = ''
  newTask.owner = 'Me'
  newTask.priority = 'mid'
  newTask.column = 'todo'
  showAdd.value = false
  ElMessage.success('任务已创建')
}

function removeTask(id) {
  for (const colKey of ['todo', 'inprogress', 'testing', 'done']) {
    const list = tasksByCol[colKey]
    const idx = list.findIndex(t => t.id === id)
    if (idx >= 0) {
      list.splice(idx, 1)
      return
    }
  }
}

function simulateStuck() {
  if (inprogressList.length === 0) {
    inprogressList.push({
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
    ElMessage.info('已新建一个停滞 3+ 天的进行中任务')
    return
  }
  // 把第一个进行中任务改成停滞 3+ 天
  const target = inprogressList[0]
  target.movedInAt = Date.now() - (STUCK_DAYS + 1) * MS_PER_DAY
  // 通过 splice 触发响应式刷新
  inprogressList.splice(0, 1, { ...target, column: 'inprogress' })
  ElMessage.info('已将一个进行中的任务模拟为停滞 3 天以上')
}

function resetDemo() {
  snapIds.value = new Set()
  const fresh = initialTasks()
  todoList.splice(0, todoList.length, ...fresh.filter(t => t.column === 'todo'))
  inprogressList.splice(0, inprogressList.length, ...fresh.filter(t => t.column === 'inprogress'))
  testingList.splice(0, testingList.length, ...fresh.filter(t => t.column === 'testing'))
  doneList.splice(0, doneList.length, ...fresh.filter(t => t.column === 'done'))
  prevCompletion.value = completionRate.value
  ElMessage.info('演示数据已重置')
}

let staleTimer = null
onMounted(() => {
  prevCompletion.value = completionRate.value
  // 初始化各列
  resetDemo()
  staleTimer = setInterval(() => {
    // 强制刷新停滞状态判断（重新分配一次 column 触发响应式）
    inprogressList.splice(0, inprogressList.length, ...inprogressList.map(t => ({ ...t })))
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
