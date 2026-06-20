<template>
  <div
    class="patient-card"
    :class="'triage-' + patient.triage"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="$emit('dragend')"
  >
    <div class="name">
      <span>{{ patient.name }} · {{ patient.age }}{{ patient.gender }}</span>
      <span class="tag" :class="'tag-' + patient.triage">{{ triageLabel }}</span>
    </div>
    <div class="meta">
      主诉：{{ patient.symptom }}<br/>
      到达：{{ patient.arrivalTime }}
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

function handleDragStart(e) {
  e.dataTransfer.setData('text/plain', props.patient.id)
  e.dataTransfer.effectAllowed = 'move'
}
</script>
