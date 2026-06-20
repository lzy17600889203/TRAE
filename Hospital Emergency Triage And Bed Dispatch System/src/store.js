import { ref, computed } from 'vue'

export const zones = ref([
  { id: 'resuscitation', name: '抢救室', capacity: 10, used: 5 },
  { id: 'observation', name: '观察区', capacity: 20, used: 12 },
  { id: 'treatment',   name: '诊疗区', capacity: 15, used: 8 },
  { id: 'surgery',     name: '手术室', capacity: 6,  used: 2 },
  { id: 'pediatrics',  name: '儿科急诊', capacity: 8, used: 3 },
  { id: 'psych',       name: '精神急诊', capacity: 5, used: 1 }
])

export const beds = ref([
  { id: 'R01', zoneId: 'resuscitation', zoneName: '抢救室', patient: null },
  { id: 'R02', zoneId: 'resuscitation', zoneName: '抢救室', patient: null },
  { id: 'R03', zoneId: 'resuscitation', zoneName: '抢救室', patient: null },
  { id: 'O01', zoneId: 'observation',   zoneName: '观察区', patient: null },
  { id: 'O02', zoneId: 'observation',   zoneName: '观察区', patient: null },
  { id: 'O03', zoneId: 'observation',   zoneName: '观察区', patient: null },
  { id: 'O04', zoneId: 'observation',   zoneName: '观察区', patient: null },
  { id: 'T01', zoneId: 'treatment',     zoneName: '诊疗区', patient: null },
  { id: 'T02', zoneId: 'treatment',     zoneName: '诊疗区', patient: null },
  { id: 'T03', zoneId: 'treatment',     zoneName: '诊疗区', patient: null },
  { id: 'S01', zoneId: 'surgery',       zoneName: '手术室', patient: null },
  { id: 'P01', zoneId: 'pediatrics',    zoneName: '儿科急诊', patient: null },
  { id: 'P02', zoneId: 'pediatrics',    zoneName: '儿科急诊', patient: null },
  { id: 'Y01', zoneId: 'psych',         zoneName: '精神急诊', patient: null }
])

export const waitingPatients = ref([
  { id: 'p1', name: '张伟', age: 56, gender: '男', triage: 'critical', symptom: '急性胸痛',   arrivalTime: '08:23' },
  { id: 'p2', name: '李娜', age: 34, gender: '女', triage: 'urgent',   symptom: '剧烈腹痛',   arrivalTime: '08:45' },
  { id: 'p3', name: '王芳', age: 72, gender: '女', triage: 'critical', symptom: '脑卒中疑似', arrivalTime: '09:02' },
  { id: 'p4', name: '刘强', age: 28, gender: '男', triage: 'normal',   symptom: '轻度外伤',   arrivalTime: '09:10' },
  { id: 'p5', name: '陈静', age: 45, gender: '女', triage: 'urgent',   symptom: '呼吸困难',   arrivalTime: '09:18' }
])

export const crowdedZones = computed(() => {
  return zones.value
    .map(z => ({ ...z, crowd: Math.round((z.used / z.capacity) * 100) }))
    .filter(z => z.crowd > 80)
})

export function syncZoneOccupancy() {
  zones.value.forEach(z => {
    const inBeds = beds.value.filter(b => b.zoneId === z.id && b.patient).length
    z.used = Math.max(z.used, inBeds)
    if (inBeds > z.used) z.used = inBeds
  })
}

export function simulateCrowd() {
  zones.value.forEach(z => {
    const delta = Math.floor(Math.random() * 5) - 2
    z.used = Math.max(0, Math.min(z.capacity, z.used + delta))
  })
}

export function assignPatientToBed(patientId, bedId) {
  const patient = waitingPatients.value.find(p => p.id === patientId)
  const bed = beds.value.find(b => b.id === bedId)
  if (!patient || !bed || bed.patient) return false

  const vitals = generateVitals(patient.triage)
  bed.patient = {
    ...patient,
    assignedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    heartRate: vitals.heartRate,
    bloodPressure: vitals.bloodPressure,
    spo2: vitals.spo2,
    temperature: vitals.temperature,
    heartWave: vitals.heartWave
  }
  const idx = waitingPatients.value.findIndex(p => p.id === patientId)
  waitingPatients.value.splice(idx, 1)
  syncZoneOccupancy()
  return true
}

export function releaseBed(bedId) {
  const bed = beds.value.find(b => b.id === bedId)
  if (!bed || !bed.patient) return
  bed.patient = null
  syncZoneOccupancy()
}

export function generateVitals(triage) {
  let hr, bp, spo2, temp
  if (triage === 'critical') {
    hr = 110 + Math.floor(Math.random() * 30)
    bp = '160/95'
    spo2 = 91 + Math.floor(Math.random() * 4)
    temp = (38.3 + Math.random() * 1).toFixed(1)
  } else if (triage === 'urgent') {
    hr = 90 + Math.floor(Math.random() * 25)
    bp = '140/88'
    spo2 = 94 + Math.floor(Math.random() * 3)
    temp = (37.5 + Math.random() * 0.8).toFixed(1)
  } else {
    hr = 70 + Math.floor(Math.random() * 20)
    bp = '120/80'
    spo2 = 97 + Math.floor(Math.random() * 3)
    temp = (36.5 + Math.random() * 0.6).toFixed(1)
  }
  return {
    heartRate: hr,
    bloodPressure: bp,
    spo2,
    temperature: temp,
    heartWave: Array.from({ length: 40 }, () =>
      Math.round(Math.random() * 10) + 50
    )
  }
}

export function updateHeartWave(bed) {
  if (!bed.patient) return
  const wave = bed.patient.heartWave
  wave.shift()
  const base = 50 + Math.round(Math.random() * 8)
  const spike = Math.random() < 0.15 ? 30 + Math.floor(Math.random() * 20) : 0
  wave.push(base + spike)
  if (Math.random() < 0.2) {
    bed.patient.heartRate = bed.patient.heartRate + (Math.random() < 0.5 ? -1 : 1)
  }
}
