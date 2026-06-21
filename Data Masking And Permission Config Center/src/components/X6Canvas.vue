<template>
  <div class="masking-canvas">
    <div class="toolbar">
      <div class="toolbar-title">
        <el-icon><Connection /></el-icon>
        <span>脱敏规则矩阵（X6）</span>
      </div>
      <div class="toolbar-actions">
        <el-tag size="small" type="warning" v-if="warnCount > 0">
          &#9888; {{ warnCount }} 条未脱敏绑定
        </el-tag>
        <el-button size="small" @click="$emit('save')" type="primary" :icon="Check">保存配置</el-button>
        <el-button size="small" @click="resetLayout" :icon="Refresh">重置布局</el-button>
      </div>
    </div>
    <div class="canvas-wrap">
      <div class="legend-strip">
        <span><i class="line-line line-normal"></i>已脱敏</span>
        <span><i class="line-line line-warn"></i>未脱敏</span>
      </div>
      <div class="canvas-inner">
        <div ref="canvasRef" class="x6-graph"></div>
        <transition name="fade">
          <div v-if="warningBubble.visible" class="warning-bubble" :style="{ left: warningBubble.x + 'px', top: warningBubble.y + 'px' }">
            <span class="close" @click="warningBubble.visible = false">&times;</span>
            <div class="title">&#9888; 未脱敏警告</div>
            <div class="msg">{{ warningBubble.message }}</div>
            <div class="btns">
              <el-button size="small" type="warning" @click="bindRuleFromWarn">选择脱敏规则</el-button>
            </div>
          </div>
        </transition>

        <el-dialog v-model="ruleDialog.visible" :title="'为「' + (ruleDialog.fieldName || '') + '」选择脱敏规则'" width="460px" destroy-on-close>
          <el-radio-group v-model="ruleDialog.selectedRule" class="rule-list">
            <el-radio v-for="r in maskingRules" :key="r.key" :value="r.key" :border="true" class="rule-item">
              <div class="rule-head"><strong>{{ r.label }}</strong></div>
              <div class="rule-desc">{{ r.desc }}</div>
            </el-radio>
          </el-radio-group>
          <template #footer>
            <el-button @click="ruleDialog.visible = false">取消</el-button>
            <el-button type="primary" @click="confirmRule">确认</el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, reactive } from 'vue'
import { Graph } from '@antv/x6'
import { Connection, Check, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sceneNodes, maskingRules, findField, tableTree } from '../data/mock.js'
import { useMaskingStore } from '../stores/mask.js'

const emit = defineEmits(['save', 'rule-changed'])

const store = useMaskingStore()
const canvasRef = ref(null)
let graph = null

const warningBubble = reactive({ visible: false, message: '', x: 0, y: 0, fieldId: null, sceneId: null })
const ruleDialog = reactive({ visible: false, fieldId: null, sceneId: null, fieldName: '', selectedRule: 'mask' })

const warnCount = ref(0)

function computeLayout () {
  const width = canvasRef.value ? canvasRef.value.clientWidth : 900
  const nodes = []
  const fieldIds = [...new Set(store.bindings.map(b => b.fieldId))]
  fieldIds.forEach((fid, idx) => {
    const info = findField(tableTree, fid) || { label: fid, fieldName: fid }
    nodes.push({
      id: 'field:' + fid,
      shape: 'rect',
      x: 40,
      y: 40 + idx * 80,
      width: 160,
      height: 48,
      label: (info.fieldName || info.label) + ' [' + info.label + ']',
      data: { kind: 'field', fieldId: fid },
      attrs: {
        body: { fill: '#fff1f2', stroke: '#f43f5e', strokeWidth: 1.5, rx: 6, ry: 6 },
        label: { fill: '#881337', fontSize: 12, textWrap: { width: 150, ellipsis: true }, refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      }
    })
  })
  sceneNodes.forEach((s, idx) => {
    nodes.push({
      id: 'scene:' + s.id,
      shape: 'rect',
      x: width - 200,
      y: 40 + idx * 90,
      width: 150,
      height: 56,
      label: s.label,
      data: { kind: 'scene', sceneId: s.id },
      attrs: {
        body: { fill: '#eff6ff', stroke: s.color, strokeWidth: 2, rx: 8, ry: 8 },
        label: { fill: '#1e3a8a', fontSize: 13, fontWeight: 600, textWrap: { width: 130, ellipsis: true }, refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      }
    })
  })
  const edges = store.bindings.map(b => {
    const warn = !b.rule || b.rule === 'none'
    return {
      source: 'field:' + b.fieldId,
      target: 'scene:' + b.sceneId,
      data: { fieldId: b.fieldId, sceneId: b.sceneId, rule: b.rule, warn },
      attrs: {
        line: {
          stroke: warn ? '#f59e0b' : '#10b981',
          strokeWidth: 2,
          strokeDasharray: warn ? '6,4' : '0',
          targetMarker: { name: 'block', size: 7 }
        }
      },
      labels: [{ attrs: { text: { text: ruleLabel(b.rule), fill: warn ? '#b45309' : '#047857', fontSize: 11 } }, position: 0.5 }],
      router: { name: 'manhattan', args: { padding: 10 } },
      connector: { name: 'rounded', args: { radius: 8 } }
    }
  })
  return { nodes, edges }
}

function ruleLabel (rule) {
  if (!rule || rule === 'none') return '未绑定'
  const r = maskingRules.find(x => x.key === rule)
  return r ? r.label.split('(')[0] : rule
}

function renderGraph () {
  if (!graph || !canvasRef.value) return
  const { nodes, edges } = computeLayout()
  graph.resetCells([])
  graph.addNodes(nodes)
  graph.addEdges(edges)
  updateWarnCount()
}

function updateWarnCount () {
  warnCount.value = store.bindings.filter(b => !b.rule || b.rule === 'none').length
}

function onCanvasDrop (e) {
  e.preventDefault()
  const raw = e.dataTransfer.getData('application/x-masking-field')
  if (!raw) return
  const field = JSON.parse(raw)
  const rect = canvasRef.value.getBoundingClientRect()
  const localPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  const nodes = graph.getNodes()
  let targetScene = null
  for (const n of nodes) {
    const b = n.getBBox()
    if (localPoint.x >= b.x && localPoint.x <= b.x + b.width && localPoint.y >= b.y && localPoint.y <= b.y + b.height) {
      if (n.getData() && n.getData().kind === 'scene') {
        targetScene = n.getData().sceneId
        break
      }
    }
  }
  if (!targetScene) {
    ElMessage.warning('请将字段拖到右侧具体「场景节点」上方')
    return
  }
  const existing = store.getBinding(field.id, targetScene)
  if (existing) {
    ElMessage.info('该字段已与当前场景绑定，可点击连线修改规则')
    const edge = graph.getEdges().find(ed => {
      const d = ed.getData()
      return d && d.fieldId === field.id && d.sceneId === targetScene
    })
    if (edge) highlightEdge(edge)
    return
  }
  store.setBinding({ fieldId: field.id, sceneId: targetScene, rule: 'none' })
  renderGraph()
  emit('rule-changed')

  const info = store.findSceneInfo(targetScene)
  warningBubble.message = (field.fieldName || field.label) + ' 未绑定脱敏规则，存在隐私泄露风险！'
  warningBubble.fieldId = field.id
  warningBubble.sceneId = targetScene
  const edge = graph.getEdges().find(ed => {
    const d = ed.getData()
    return d && d.fieldId === field.id && d.sceneId === targetScene
  })
  if (edge) {
    const p = edge.getBBox()
    warningBubble.x = Math.max(0, p.x + p.width / 2 - 120)
    warningBubble.y = Math.max(0, p.y - 70)
  } else {
    warningBubble.x = 300
    warningBubble.y = 50
  }
  warningBubble.visible = true
  ElMessage.warning((field.fieldName || field.label) + ' 与「' + (info ? info.label : targetScene) + '」绑定 — 未脱敏')
}

function onCanvasDragOver (e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function highlightEdge (edge) {
  edge.attr('line/strokeWidth', 4)
  setTimeout(() => edge.attr('line/strokeWidth', 2), 600)
}

function bindRuleFromWarn () {
  const fieldId = warningBubble.fieldId
  const sceneId = warningBubble.sceneId
  if (!fieldId || !sceneId) return
  const info = findField(tableTree, fieldId)
  ruleDialog.fieldId = fieldId
  ruleDialog.sceneId = sceneId
  ruleDialog.fieldName = info ? (info.fieldName || info.label) : fieldId
  ruleDialog.selectedRule = 'mask'
  ruleDialog.visible = true
  warningBubble.visible = false
}

function confirmRule () {
  if (!ruleDialog.fieldId || !ruleDialog.sceneId) return
  store.setBinding({ fieldId: ruleDialog.fieldId, sceneId: ruleDialog.sceneId, rule: ruleDialog.selectedRule })
  renderGraph()
  ruleDialog.visible = false
  emit('rule-changed')
  ElMessage.success('脱敏规则已更新')
}

function resetLayout () {
  renderGraph()
  ElMessage.info('画布已重置布局')
}

function onEdgeClick ({ edge }) {
  const d = edge.getData()
  if (!d) return
  const info = findField(tableTree, d.fieldId)
  const sceneInfo = store.findSceneInfo(d.sceneId)
  ruleDialog.fieldId = d.fieldId
  ruleDialog.sceneId = d.sceneId
  ruleDialog.fieldName = (info ? (info.fieldName || info.label) : d.fieldId) + ' -> ' + (sceneInfo ? sceneInfo.label : d.sceneId)
  ruleDialog.selectedRule = d.rule || 'none'
  ruleDialog.visible = true
}

onMounted(async () => {
  await nextTick()
  if (!canvasRef.value) return
  graph = new Graph({
    container: canvasRef.value,
    background: { color: '#fafafa' },
    grid: { visible: true, type: 'dot', args: { color: '#d1d5db', thickness: 1 } },
    panning: { enabled: true, eventTypes: ['leftMouseDown'] },
    mousewheel: { enabled: true, modifiers: ['ctrl'], minScale: 0.4, maxScale: 2 },
    interacting: { nodeMovable: false, edgeMovable: false }
  })
  canvasRef.value.addEventListener('drop', onCanvasDrop)
  canvasRef.value.addEventListener('dragover', onCanvasDragOver)
  graph.on('edge:click', onEdgeClick)
  renderGraph()
  window.addEventListener('resize', handleResize)
})

function handleResize () {
  if (!graph || !canvasRef.value) return
  graph.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
  renderGraph()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (graph) { graph.dispose(); graph = null }
})

watch(() => store.bindings.length, () => { nextTick(() => renderGraph()) })
watch(() => store.bindings.map(b => b.rule).join(','), () => { nextTick(() => renderGraph()) })
</script>

<style scoped>
.masking-canvas { display: flex; flex-direction: column; height: 100%; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 4px 8px 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;
}
.toolbar-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #1e3a8a; font-size: 13px; }
.toolbar-actions { display: flex; gap: 8px; align-items: center; }
.canvas-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.legend-strip { display: flex; gap: 16px; font-size: 12px; color: #4b5563; padding: 2px 4px 6px 4px; }
.line-line { display: inline-block; width: 24px; height: 2px; margin-right: 4px; vertical-align: middle; }
.line-normal { background: #10b981; }
.line-warn { background: #f59e0b; }
.canvas-inner { position: relative; flex: 1; min-height: 380px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; background: #fff; }
.x6-graph { position: absolute; inset: 0; }
.warning-bubble { position: absolute; z-index: 20; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 8px 12px; font-size: 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25); max-width: 260px; }
.warning-bubble .title { font-weight: 600; color: #92400e; margin-bottom: 4px; }
.warning-bubble .msg { color: #78350f; margin-bottom: 6px; }
.warning-bubble .btns { display: flex; justify-content: flex-end; }
.warning-bubble .close { position: absolute; top: 2px; right: 6px; cursor: pointer; color: #b45309; font-size: 16px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.rule-list { display: flex; flex-direction: column; gap: 8px; }
.rule-head { margin-bottom: 2px; }
.rule-desc { color: #6b7280; font-size: 12px; padding-left: 24px; }
</style>
