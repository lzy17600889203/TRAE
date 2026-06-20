import { ref, computed } from 'vue'

let _patientSeq = 100

export function nextPatientId() {
  _patientSeq += 1
  return `p${_patientSeq}`
}

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
  { id: 'p1', name: '张伟', age: 56, gender: '男', triage: 'critical', symptom: '急性胸痛', arrivalTime: '08:23',
    chiefComplaint: '胸骨后压榨性疼痛持续 2 小时，伴大汗、气短',
    heartRate: 118, bloodPressure: '168/102', spo2: 92, temperature: 37.3,
    respiratoryRate: 24, bloodGlucose: 7.8, consciousness: '清醒',
    weight: 78, height: 172, allergies: '青霉素', medicalHistory: '高血压 6 年 / 高脂血症' },
  { id: 'p2', name: '李娜', age: 34, gender: '女', triage: 'urgent', symptom: '剧烈腹痛', arrivalTime: '08:45',
    chiefComplaint: '右下腹持续疼痛 6 小时，伴恶心呕吐 2 次',
    heartRate: 102, bloodPressure: '128/82', spo2: 98, temperature: 37.9,
    respiratoryRate: 18, bloodGlucose: 5.6, consciousness: '清醒',
    weight: 56, height: 163, allergies: '', medicalHistory: '无特殊' },
  { id: 'p3', name: '王芳', age: 72, gender: '女', triage: 'critical', symptom: '脑卒中疑似', arrivalTime: '09:02',
    chiefComplaint: '突发左侧肢体无力、言语不清 1 小时',
    heartRate: 94, bloodPressure: '172/96', spo2: 95, temperature: 36.9,
    respiratoryRate: 20, bloodGlucose: 8.2, consciousness: '嗜睡',
    weight: 62, height: 158, allergies: '磺胺类', medicalHistory: '房颤 / 高血压' },
  { id: 'p4', name: '刘强', age: 28, gender: '男', triage: 'normal', symptom: '轻度外伤', arrivalTime: '09:10',
    chiefComplaint: '运动时摔倒，右前臂擦伤出血',
    heartRate: 82, bloodPressure: '118/76', spo2: 99, temperature: 36.6,
    respiratoryRate: 16, bloodGlucose: 5.1, consciousness: '清醒',
    weight: 72, height: 178, allergies: '', medicalHistory: '无' },
  { id: 'p5', name: '陈静', age: 45, gender: '女', triage: 'urgent', symptom: '呼吸困难', arrivalTime: '09:18',
    chiefComplaint: '活动后气促 2 天，今晨加重伴胸闷',
    heartRate: 108, bloodPressure: '138/88', spo2: 94, temperature: 37.2,
    respiratoryRate: 22, bloodGlucose: 6.4, consciousness: '清醒',
    weight: 66, height: 165, allergies: '阿司匹林', medicalHistory: '哮喘 10 年' }
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

  const defaults = generateVitals(patient.triage)
  bed.patient = {
    ...patient,
    assignedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    heartRate: patient.heartRate || defaults.heartRate,
    bloodPressure: patient.bloodPressure || defaults.bloodPressure,
    spo2: patient.spo2 != null ? patient.spo2 : defaults.spo2,
    temperature: patient.temperature || defaults.temperature,
    respiratoryRate: patient.respiratoryRate || null,
    bloodGlucose: patient.bloodGlucose || null,
    allergies: patient.allergies || null,
    heartWave: defaults.heartWave
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

export function addWaitingPatient(payload) {
  const now = new Date()
  const arrival = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const patient = {
    id: nextPatientId(),
    name: (payload.name || '').trim() || '未命名',
    age: Number(payload.age) || 0,
    gender: payload.gender || '男',
    triage: payload.triage || 'normal',
    symptom: (payload.symptom || '').trim() || '无',
    arrivalTime: payload.arrivalTime || arrival,
    heartRate: payload.heartRate ? Number(payload.heartRate) : null,
    bloodPressure: (payload.bloodPressure || '').trim() || null,
    spo2: payload.spo2 != null && payload.spo2 !== '' ? Number(payload.spo2) : null,
    temperature: payload.temperature != null && payload.temperature !== '' ? Number(payload.temperature) : null,
    respiratoryRate: payload.respiratoryRate ? Number(payload.respiratoryRate) : null,
    bloodGlucose: payload.bloodGlucose ? Number(payload.bloodGlucose) : null,
    weight: payload.weight ? Number(payload.weight) : null,
    height: payload.height ? Number(payload.height) : null,
    allergies: (payload.allergies || '').trim() || null,
    medicalHistory: (payload.medicalHistory || '').trim() || null,
    chiefComplaint: (payload.chiefComplaint || '').trim() || null,
    consciousness: payload.consciousness || '清醒',
    contact: (payload.contact || '').trim() || null
  }
  waitingPatients.value.unshift(patient)
  return patient
}

export function removeWaitingPatient(patientId) {
  const idx = waitingPatients.value.findIndex(p => p.id === patientId)
  if (idx >= 0) waitingPatients.value.splice(idx, 1)
}

export function triageSummary() {
  const total = waitingPatients.value.length
  const critical = waitingPatients.value.filter(p => p.triage === 'critical').length
  const urgent = waitingPatients.value.filter(p => p.triage === 'urgent').length
  const normal = total - critical - urgent
  return { total, critical, urgent, normal }
}
