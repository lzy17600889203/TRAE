<template>
  <div
    class="bed-card-flip"
    :class="{
      'is-occupied': !!bed.patient,
      'is-flipping': justFlipped,
      'triage-critical': bed.patient?.triage === 'critical',
      'triage-urgent': bed.patient?.triage === 'urgent',
      'triage-normal': bed.patient?.triage === 'normal'
    }"
  >
    <!-- 卡片翻转容器 -->
    <div class="bed-card-inner">
      <!-- 正面：空闲床位 (dragover 时绿色高亮) -->
      <div
        class="bed-face bed-face--front"
        :class="{
          'drag-over': dragOver,
          'drag-active': isDraggingPatient && !bed.patient
        }"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="bed-head">
          <span class="bed-id">
            <span class="zone-tag">{{ bed.zoneName }}</span>
            {{ bed.id }}
          </span>
          <span class="status status-free">空闲</span>
        </div>
        <div class="empty-bed">
          <div class="plus">+</div>
          <div>拖拽患者到此分配</div>
        </div>
      </div>

      <!-- 背面：占用床位 (显示患者信息) -->
      <div class="bed-face bed-face--back">
        <div class="bed-head">
          <span class="bed-id">
            <span class="zone-tag">{{ bed.zoneName }}</span>
            {{ bed.id }}
          </span>
          <span class="status status-occupied">占用中</span>
        </div>

        <div class="bed-patient">
          <span>{{ bed.patient?.name }} · {{ bed.patient?.age }}岁{{ bed.patient?.gender }}</span>
          <span
            class="tag"
            :class="'tag-' + (bed.patient?.triage || 'normal')"
          >{{ triageLabel }}</span>
        </div>
        <div v-if="bed.patient?.chiefComplaint" class="chief-complaint">
          📌 {{ bed.patient.chiefComplaint }}
        </div>
        <div class="bed-vitals">
          <div class="vital"><span class="label">心率</span><span class="value">{{ bed.patient?.heartRate }} bpm</span></div>
          <div class="vital"><span class="label">血压</span><span class="value">{{ bed.patient?.bloodPressure }}</span></div>
          <div class="vital"><span class="label">SpO₂</span><span class="value">{{ bed.patient?.spo2 }}%</span></div>
          <div class="vital"><span class="label">体温</span><span class="value">{{ bed.patient?.temperature }}°C</span></div>
          <div v-if="bed.patient?.respiratoryRate" class="vital"><span class="label">呼吸</span><span class="value">{{ bed.patient.respiratoryRate }}/分</span></div>
          <div v-if="bed.patient?.bloodGlucose" class="vital"><span class="label">血糖</span><span class="value">{{ bed.patient.bloodGlucose }} mmol/L</span></div>
        </div>
        <div v-if="bed.patient?.allergies" class="allergies">
          ⚠ 过敏：{{ bed.patient.allergies }}
        </div>
        <HeartChart v-if="bed.patient?.heartWave" :wave="bed.patient.heartWave" :color="heartColor" />
        <div class="bed-footer">
          <span>入床：{{ bed.patient?.assignedAt }}</span>
          <el-button size="small" type="danger" text @click.stop="$emit('release', bed.id)">办理出院</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import HeartChart from './HeartChart.vue'
import { isDraggingPatient } from './store.js'

const props = defineProps({
  bed: { type: Object, required: true }
})

const emit = defineEmits(['assign', 'release'])

const dragOver = ref(false)
const justFlipped = ref(false)
let flipTimer = null

// 当 bed.patient 从 null 变为有值时，触发一次"快速翻转"的附加动画
watch(
  () => !!props.bed.patient,
  (occupied, wasOccupied) => {
    if (occupied && !wasOccupied) {
      justFlipped.value = true
      clearTimeout(flipTimer)
      flipTimer = setTimeout(() => { justFlipped.value = false }, 900)
    }
  }
)

const triageLabel = computed(() => {
  if (!props.bed.patient) return ''
  return { critical: '危重', urgent: '急症', normal: '普通' }[props.bed.patient.triage]
})

const heartColor = computed(() => {
  if (!props.bed.patient) return '#409eff'
  return { critical: '#f56c6c', urgent: '#e6a23c', normal: '#67c23a' }[props.bed.patient.triage]
})

function handleDragOver(e) {
  if (!props.bed.patient) {
    dragOver.value = true
    e.dataTransfer.dropEffect = 'move'
  }
}
function handleDragLeave() { dragOver.value = false }
function handleDrop(e) {
  dragOver.value = false
  const patientId = e.dataTransfer.getData('text/plain')
  if (patientId) emit('assign', { patientId, bedId: props.bed.id })
}
</script>

<style scoped>
/* ===== 3D 翻转卡片根容器 ===== */
.bed-card-flip {
  perspective: 1400px;
  min-height: 260px;
  cursor: default;
}

.bed-card-inner {
  position: relative;
  width: 100%;
  min-height: 260px;
  transition: transform 0.85s cubic-bezier(0.32, 0.72, 0, 1);
  transform-style: preserve-3d;
  border-radius: 12px;
}

/* 翻转：占用态 -> 转到背面 */
.bed-card-flip.is-occupied .bed-card-inner {
  transform: rotateY(180deg);
}

/* 快速切换时的弹性增强 */
.bed-card-flip.is-flipping .bed-card-inner {
  transition: transform 0.6s cubic-bezier(0.2, 1.4, 0.4, 1);
  box-shadow: 0 20px 40px -12px rgba(64, 158, 255, 0.35);
}

/* 两面公共样式 */
.bed-face {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 14px 16px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: #fff;
  border: 2px solid #dcdfe6;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.bed-face--front { z-index: 2; }
.bed-face--back  { transform: rotateY(180deg); z-index: 1; }

/* 头部：区域标签 + 床位号 + 状态 */
.bed-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}
.bed-id {
  font-size: 15px;
  font-weight: 700;
  color: #1a3a5c;
  display: flex;
  align-items: center;
  gap: 6px;
}
.zone-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
.status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 500;
}
.status-free     { background: #f0f9eb; color: #67c23a; border: 1px solid #c2e7b0; }
.status-occupied { background: #ecf5ff; color: #409eff; border: 1px solid #a0cfff; }

/* 正面：空闲态样式 & 拖拽高亮 */
.empty-bed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 180px;
  color: #909399;
  font-size: 13px;
  transition: color 0.3s ease;
}
.empty-bed .plus {
  font-size: 52px;
  color: #dcdfe6;
  font-weight: 100;
  line-height: 1;
  transition: all 0.3s ease;
}

/* 拖拽正在进行 (全局) -> 所有空闲床位亮起绿色边框与阴影 */
.bed-face--front.drag-active {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9eb 0%, #e3f6d5 100%);
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.25), 0 8px 20px rgba(103, 194, 58, 0.15);
  animation: greenPulse 1.4s ease-in-out infinite;
}
.bed-face--front.drag-active .empty-bed { color: #529b2e; }
.bed-face--front.drag-active .plus {
  color: #67c23a;
  transform: scale(1.15);
  text-shadow: 0 0 12px rgba(103, 194, 58, 0.5);
}

/* dragover 命中具体床位 -> 更强烈的绿色与虚线 */
.bed-face--front.drag-over {
  border-color: #67c23a;
  border-style: dashed;
  background: linear-gradient(135deg, #e3f6d5 0%, #ccedb0 100%);
  transform: scale(1.04);
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.4), 0 18px 36px rgba(103, 194, 58, 0.25);
}

@keyframes greenPulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.25), 0 8px 20px rgba(103, 194, 58, 0.12); }
  50%      { box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.5),  0 12px 28px rgba(103, 194, 58, 0.22); }
}

/* 背面：占用态 — 根据分诊颜色 */
.bed-card-flip.triage-critical .bed-face--back {
  background: linear-gradient(135deg, #fff0f0 0%, #fde2e2 100%);
  border-color: #f56c6c;
  animation: criticalPulse 1.6s ease-in-out infinite;
}
.bed-card-flip.triage-urgent .bed-face--back {
  background: linear-gradient(135deg, #fff7e6 0%, #faecd8 100%);
  border-color: #e6a23c;
}
.bed-card-flip.triage-normal .bed-face--back {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-color: #409eff;
}

@keyframes criticalPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(245, 108, 108, 0.0); }
  50%      { box-shadow: 0 0 18px rgba(245, 108, 108, 0.45); }
}

.bed-patient {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bed-patient .tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.tag-critical { background: #f56c6c; color: #fff; }
.tag-urgent   { background: #e6a23c; color: #fff; }
.tag-normal   { background: #67c23a; color: #fff; }

.chief-complaint {
  font-size: 12px;
  color: #1a3a5c;
  background: #e6f1ff;
  padding: 5px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.bed-vitals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 10px;
  margin-bottom: 8px;
}
.bed-vitals .vital {
  background: rgba(255, 255, 255, 0.75);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
  display: flex;
  justify-content: space-between;
}
.bed-vitals .vital .label { color: #909399; }
.bed-vitals .vital .value { color: #303133; font-weight: 600; }

.allergies {
  margin-top: 4px;
  font-size: 12px;
  color: #c0392b;
}

.bed-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: #909399;
}
</style>
