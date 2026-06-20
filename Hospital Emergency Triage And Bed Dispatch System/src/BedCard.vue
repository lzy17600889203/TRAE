<template>
  <div
    class="bed-card"
    :class="statusClass"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="bed-head">
      <span class="bed-id">
        <span class="zone-tag">{{ bed.zoneName }}</span>
        {{ bed.id }}
      </span>
      <span class="status" :class="'status-' + (bed.patient ? 'occupied' : 'free')">
        {{ bed.patient ? '占用中' : '空闲' }}
      </span>
    </div>

    <div class="bed-content">
      <template v-if="bed.patient">
        <div class="bed-patient">
          <span>{{ bed.patient.name }} · {{ bed.patient.age }}岁{{ bed.patient.gender }}</span>
          <span class="tag" :class="'tag-' + bed.patient.triage">{{ triageLabel }}</span>
        </div>
        <div v-if="bed.patient.chiefComplaint" style="font-size:12px;color:#1a3a5c;margin-bottom:8px;background:#e6f1ff;padding:4px 8px;border-radius:6px">
          📌 {{ bed.patient.chiefComplaint }}
        </div>
        <div class="bed-vitals">
          <div class="vital"><span class="label">心率</span><span class="value">{{ bed.patient.heartRate }} bpm</span></div>
          <div class="vital"><span class="label">血压</span><span class="value">{{ bed.patient.bloodPressure }}</span></div>
          <div class="vital"><span class="label">SpO₂</span><span class="value">{{ bed.patient.spo2 }}%</span></div>
          <div class="vital"><span class="label">体温</span><span class="value">{{ bed.patient.temperature }}°C</span></div>
          <div v-if="bed.patient.respiratoryRate" class="vital"><span class="label">呼吸</span><span class="value">{{ bed.patient.respiratoryRate }}/分</span></div>
          <div v-if="bed.patient.bloodGlucose" class="vital"><span class="label">血糖</span><span class="value">{{ bed.patient.bloodGlucose }} mmol/L</span></div>
        </div>
        <div v-if="bed.patient.allergies" style="margin-top:6px;font-size:12px;color:#c0392b">
          ⚠ 过敏：{{ bed.patient.allergies }}
        </div>
        <HeartChart :wave="bed.patient.heartWave" :color="heartColor" />
        <div style="text-align:right;margin-top:6px;font-size:11px;color:#909399">
          入床：{{ bed.patient.assignedAt }}
          <el-button
            size="small"
            type="danger"
            text
            style="margin-left:8px"
            @click.stop="$emit('release', bed.id)"
          >办理出院</el-button>
        </div>
      </template>

      <template v-else>
        <div class="empty-bed">
          <div class="plus">+</div>
          <div>拖拽患者到此分配</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import HeartChart from './HeartChart.vue'

const props = defineProps({
  bed: { type: Object, required: true }
})

const emit = defineEmits(['assign', 'release'])

const dragOver = ref(false)

const statusClass = computed(() => {
  const classes = []
  if (dragOver.value && !props.bed.patient) classes.push('drag-over')
  if (props.bed.patient) {
    if (props.bed.patient.triage === 'critical') classes.push('bed-critical')
    else if (props.bed.patient.triage === 'urgent') classes.push('bed-urgent')
    else classes.push('bed-occupied')
  }
  return classes
})

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
