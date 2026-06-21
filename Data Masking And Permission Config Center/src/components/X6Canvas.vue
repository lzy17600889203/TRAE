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
      <!-- 全局醒目告警条：只要存在未脱敏绑定就持续显示 -->
      <transition name="fade">
        <div v-if="warnCount > 0" class="global-warn-banner">
          <span class="gw-icon">&#9888;</span>
          <span class="gw-text">
            当前有 <strong>{{ warnCount }}</strong> 条字段 → 场景绑定<strong>未配置脱敏规则</strong>，存在隐私泄露风险！
            请在下方画布中点击橙色虚线或使用右侧按钮选择脱敏规则。
          </span>
          <el-button size="small" type="warning" @click="firstWarnEdgeToDialog">立即处理第一条</el-button>
        </div>
      </transition>
      <div class="canvas-inner">
        <div ref="canvasRef" class="x6-graph"></div>
        <transition name="fade">
          <div v-if="warningBubble.visible" class="warning-bubble" :style="{ left: warningBubble.x + 'px', top: warningBubble.y + 'px' }">
            <span class="close" @click="warningBubble.visible = false">&times;</span>
            <div class="title">&#9888;&#9888;&#9888; 未脱敏警告 · 存在隐私泄露风险</div>
            <div class="msg">{{ warningBubble.message }}</div>
            <div class="meta">
              <span class="meta-item"><i class="dot"></i>字段：{{ warningBubble.fieldName }}</span>
              <span class="meta-item"><i class="dot scene"></i>场景：{{ warningBubble.sceneName }}</span>
            </div>
            <div class="btns">
              <el-button size="small" @click="warningBubble.visible = false">稍后处理</el-button>
              <el-button size="small" type="warning" @click="bindRuleFromWarn">立即选择脱敏规则</el-button>
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

const warningBubble = reactive({ visible: false, message: '', x: 0, y: 0, fieldId: null, sceneId: null, fieldName: '', sceneName: '' })
const ruleDialog = reactive({ visible: false, fieldId: null, sceneId: null, fieldName: '', selectedRule: 'mask' })

const warnCount = ref(0)

function computeLayout () {
  const width = canvasRef.value ? canvasRef.value.clientWidth : 900
  const nodes = []
  const fieldIds = [...new Set(store.bindings.map(b => b.fieldId))]
  fieldIds.forEach((fid, idx) => {
    const info = findField(tableTree, fid) || { label: fid, fieldName: fid }
    const hasWarn = store.bindings.some(b => b.fieldId === fid && (!b.rule || b.rule === 'none'))
    nodes.push({
      id: 'field:' + fid,
      shape: 'rect',
      x: 40,
      y: 40 + idx * 90,
      width: 180,
      height: 54,
      label: (hasWarn ? '⚠ ' : '') + (info.fieldName || info.label) + ' [' + info.label + ']',
      data: { kind: 'field', fieldId: fid },
      attrs: {
        body: {
          fill: hasWarn ? '#fef2f2' : '#fff1f2',
          stroke: hasWarn ? '#dc2626' : '#f43f5e',
          strokeWidth: hasWarn ? 3 : 1.5,
          rx: 6,
          ry: 6
        },
        label: {
          fill: hasWarn ? '#7f1d1d' : '#881337',
          fontSize: 12,
          fontWeight: hasWarn ? 700 : 500,
          textWrap: { width: 160, ellipsis: true },
          refX: 0.5,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        }
      }
    })
  })
  sceneNodes.forEach((s, idx) => {
    const hasWarn = store.bindings.some(b => b.sceneId === s.id && (!b.rule || b.rule === 'none'))
    nodes.push({
      id: 'scene:' + s.id,
      shape: 'rect',
      x: width - 230,
      y: 40 + idx * 90,
      width: 180,
      height: 56,
      label: (hasWarn ? '⚠ ' : '') + s.label,
      data: { kind: 'scene', sceneId: s.id },
      attrs: {
        body: {
          fill: hasWarn ? '#fffbeb' : '#eff6ff',
          stroke: hasWarn ? '#dc2626' : s.color,
          strokeWidth: hasWarn ? 3 : 2,
          rx: 8,
          ry: 8
        },
        label: {
          fill: hasWarn ? '#92400e' : '#1e3a8a',
          fontSize: 13,
          fontWeight: 700,
          textWrap: { width: 160, ellipsis: true },
          refX: 0.5,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        }
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
          stroke: warn ? '#dc2626' : '#10b981',
          strokeWidth: warn ? 3 : 2,
          strokeDasharray: warn ? '8,5' : '0',
          targetMarker: { name: 'block', size: 8 }
        }
      },
      labels: [{
        attrs: {
          text: { text: (warn ? '⚠ ' : '') + ruleLabel(b.rule), fill: warn ? '#b91c1c' : '#047857', fontSize: 12, fontWeight: 700 },
          rect: { fill: warn ? '#fee2e2' : '#dcfce7', stroke: warn ? '#b91c1c' : '#047857', strokeWidth: 1, rx: 4, ry: 4 }
        },
        position: 0.5
      }],
      router: { name: 'manhattan', args: { padding: 12 } },
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

  const fieldInfo = findField(tableTree, field.id)
  const sceneInfo = store.findSceneInfo(targetScene)
  warningBubble.message = (field.fieldName || field.label) + ' 直接暴露到场景「' + (sceneInfo ? sceneInfo.label : targetScene) + '」！'
  warningBubble.fieldId = field.id
  warningBubble.sceneId = targetScene
  warningBubble.fieldName = fieldInfo ? (fieldInfo.fieldName || fieldInfo.label) : field.fieldName || field.label
  warningBubble.sceneName = sceneInfo ? sceneInfo.label : targetScene
  const edge = graph.getEdges().find(ed => {
    const d = ed.getData()
    return d && d.fieldId === field.id && d.sceneId === targetScene
  })
  if (edge) {
    const p = edge.getBBox()
    const cw = canvasRef.value.clientWidth || 900
    const ch = canvasRef.value.clientHeight || 400
    let bx = p.x + p.width / 2 - 170
    let by = p.y - 140
    if (bx < 8) bx = 8
    if (by < 8) by = p.y + 40
    if (bx > cw - 348) bx = cw - 348
    if (by > ch - 148) by = ch - 148
    warningBubble.x = bx
    warningBubble.y = by
  } else {
    warningBubble.x = 40
    warningBubble.y = 40
  }
  warningBubble.visible = true
  ElMessage.warning((field.fieldName || field.label) + ' 与「' + (sceneInfo ? sceneInfo.label : targetScene) + '」绑定 — 未脱敏')
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
  const sceneInfo = store.findSceneInfo(sceneId)
  ruleDialog.fieldId = fieldId
  ruleDialog.sceneId = sceneId
  ruleDialog.fieldName = (info ? (info.fieldName || info.label) : fieldId) + ' → ' + (sceneInfo ? sceneInfo.label : sceneId)
  ruleDialog.selectedRule = 'mask'
  ruleDialog.visible = true
  warningBubble.visible = false
}

// 点击「立即处理第一条」：直接打开第一条未脱敏连线的规则对话框
function firstWarnEdgeToDialog () {
  const first = store.bindings.find(b => !b.rule || b.rule === 'none')
  if (!first) return
  const info = findField(tableTree, first.fieldId)
  const sceneInfo = store.findSceneInfo(first.sceneId)
  ruleDialog.fieldId = first.fieldId
  ruleDialog.sceneId = first.sceneId
  ruleDialog.fieldName = (info ? (info.fieldName || info.label) : first.fieldId) + ' → ' + (sceneInfo ? sceneInfo.label : first.sceneId)
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
.line-warn { background: #dc2626; }
.global-warn-banner {
  display: flex; align-items: center; gap: 12px;
  background: linear-gradient(90deg, #fef2f2 0%, #fef3c7 100%);
  border: 2px solid #f59e0b;
  border-left: 6px solid #dc2626;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.18);
  animation: gw-pulse 2.5s ease-in-out infinite;
}
.gw-icon {
  color: #dc2626;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
  display: inline-block;
  animation: shake 1.2s ease-in-out infinite;
}
.gw-text {
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  flex: 1;
}
.gw-text strong { color: #dc2626; font-size: 14px; }
@keyframes gw-pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(220, 38, 38, 0.18); }
  50% { box-shadow: 0 4px 18px rgba(220, 38, 38, 0.35); }
}
@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
.canvas-inner { position: relative; flex: 1; min-height: 380px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; background: #fff; }
.x6-graph { position: absolute; inset: 0; }
.warning-bubble {
  position: absolute; z-index: 20;
  min-width: 320px; max-width: 420px;
  background: linear-gradient(180deg, #fffbeb 0%, #fff1f2 100%);
  border: 2px solid #dc2626;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.35), 0 0 0 4px rgba(245, 158, 11, 0.15);
}
.warning-bubble .title {
  font-weight: 700;
  color: #991b1b;
  margin-bottom: 6px;
  font-size: 14px;
  letter-spacing: 0.5px;
}
.warning-bubble .msg {
  color: #78350f;
  margin-bottom: 8px;
  line-height: 1.5;
  background: #fff;
  border: 1px dashed #fbbf24;
  padding: 6px 8px;
  border-radius: 4px;
}
.warning-bubble .meta {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #92400e;
}
.warning-bubble .meta-item {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(251, 191, 36, 0.18);
  padding: 2px 8px; border-radius: 999px;
}
.warning-bubble .meta-item .dot {
  width: 8px; height: 8px; background: #dc2626; border-radius: 50%; display: inline-block;
}
.warning-bubble .meta-item .dot.scene { background: #f59e0b; }
.warning-bubble .btns { display: flex; justify-content: flex-end; gap: 6px; }
.warning-bubble .close {
  position: absolute; top: 4px; right: 8px; cursor: pointer; color: #991b1b;
  font-size: 20px; font-weight: 700; line-height: 1;
}
.warning-bubble .close:hover { color: #dc2626; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
.rule-list { display: flex; flex-direction: column; gap: 8px; }
.rule-head { margin-bottom: 2px; }
.rule-desc { color: #6b7280; font-size: 12px; padding-left: 24px; }
</style>
