<template>
  <div
    class="patient-card"
    :class="'triage-' + patient.triage"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="$emit('dragend')"
  >
    <div class="name">
      <span>{{ patient.name }} · {{ patient.age }}岁{{ patient.gender }}</span>
      <span class="tag" :class="'tag-' + patient.triage">{{ triageLabel }}</span>
    </div>
    <div class="meta">
      <div v-if="patient.chiefComplaint" style="color:#1a3a5c;font-weight:500;margin-bottom:4px">
        📌 {{ patient.chiefComplaint }}
      </div>
      <div>🩺 到达：{{ patient.arrivalTime }}</div>
      <div class="vitals-row">
        <template v-if="hasVitals">
          <el-tag size="small" v-if="patient.heartRate" :color="tagColor('hr')" effect="light" style="margin-right:4px">
            心率 {{ patient.heartRate }}
          </el-tag>
          <el-tag size="small" v-if="patient.bloodPressure" effect="light" style="margin-right:4px">
            BP {{ patient.bloodPressure }}
          </el-tag>
          <el-tag size="small" v-if="patient.spo2 != null" :color="tagColor('spo2')" effect="light" style="margin-right:4px">
            SpO₂ {{ patient.spo2 }}%
          </el-tag>
          <el-tag size="small" v-if="patient.temperature" :color="tagColor('temp')" effect="light" style="margin-right:4px">
            {{ patient.temperature }}℃
          </el-tag>
          <el-tag size="small" v-if="patient.respiratoryRate" effect="light" style="margin-right:4px">
            R {{ patient.respiratoryRate }}
          </el-tag>
          <el-tag size="small" v-if="patient.bloodGlucose" effect="light" style="margin-right:4px">
            糖 {{ patient.bloodGlucose }}
          </el-tag>
          <el-tag size="small" v-if="patient.consciousness && patient.consciousness !== '清醒'" type="warning" effect="light" style="margin-right:4px">
            意识：{{ patient.consciousness }}
          </el-tag>
        </template>
        <template v-else>
          <span style="color:#909399;font-size:12px">（登记时未采集生命体征）</span>
        </template>
      </div>
      <div v-if="patient.allergies" style="margin-top:6px;font-size:12px;color:#c0392b">
        ⚠ 过敏：{{ patient.allergies }}
      </div>
      <div v-if="patient.medicalHistory" style="margin-top:2px;font-size:12px;color:#7a8b9c">
        既往：{{ patient.medicalHistory }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ patient: { type: Object, required: true } })
defineEmits(['dragend'])

const triageLabel = computed(() => ({
  critical: '一级·危重',
  urgent: '二级·急症',
  normal: '三级·普通'
}[props.patient.triage]))

const hasVitals = computed(() => {
  const p = props.patient
  return !!(p.heartRate || p.bloodPressure || p.spo2 != null ||
    p.temperature || p.respiratoryRate || p.bloodGlucose ||
    (p.consciousness && p.consciousness !== '清醒'))
})

function tagColor(field) {
  const p = props.patient
  if (field === 'hr') {
    if (p.heartRate > 110 || p.heartRate < 60) return '#fde2e2'
    return '#ecf5ff'
  }
  if (field === 'spo2') {
    if (p.spo2 < 95) return '#fdf6ec'
    return '#f0f9eb'
  }
  if (field === 'temp') {
    if (p.temperature >= 38) return '#fdf6ec'
    if (p.temperature < 36) return '#e6f1ff'
    return '#f0f9eb'
  }
  return '#ecf5ff'
}

function handleDragStart(e) {
  e.dataTransfer.setData('text/plain', props.patient.id)
  e.dataTransfer.effectAllowed = 'move'
}
</script>
