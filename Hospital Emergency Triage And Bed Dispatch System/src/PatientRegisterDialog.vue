<template>
  <el-dialog
    v-model="visible"
    title="📝 急诊患者登记 · 身体指标采集"
    width="720px"
    :close-on-click-modal="false"
    top="6vh"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
      label-position="right"
    >
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="14">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入患者姓名" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="form.gender" placeholder="性别">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="年龄" prop="age">
            <el-input-number
              v-model="form.age"
              :min="0"
              :max="150"
              :step="1"
              controls-position="right"
              placeholder="请输入年龄"
              style="width:100%;min-width:140px;font-size:14px"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :span="12">
          <el-form-item label="分诊等级" prop="triage">
            <el-radio-group v-model="form.triage">
              <el-radio-button value="critical">
                <span style="color:#f56c6c">⚠ 一级·危重</span>
              </el-radio-button>
              <el-radio-button value="urgent">
                <span style="color:#e6a23c">二级·急症</span>
              </el-radio-button>
              <el-radio-button value="normal">
                <span style="color:#67c23a">三级·普通</span>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="到达时间" prop="arrivalTime">
            <el-time-picker
              v-model="form.arrivalTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择时间，默认当前"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :span="24">
          <el-form-item label="主诉" prop="chiefComplaint">
            <el-input
              v-model="form.chiefComplaint"
              type="textarea"
              :rows="2"
              placeholder="患者主要不适（如：剧烈胸痛 2 小时）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">生命体征</el-divider>
      <el-row :gutter="14">
        <el-col :span="8">
          <el-form-item label="心率 (bpm)" prop="heartRate">
            <el-input-number
              v-model="form.heartRate"
              :min="30"
              :max="220"
              :step="1"
              controls-position="right"
              style="width:100%"
              placeholder="例：96"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="血压 (mmHg)" prop="bloodPressure">
            <el-input
              v-model="form.bloodPressure"
              placeholder="例：120/80"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="血氧 SpO₂ (%)" prop="spo2">
            <el-input-number
              v-model="form.spo2"
              :min="50"
              :max="100"
              :step="1"
              controls-position="right"
              style="width:100%"
              placeholder="例：98"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :span="8">
          <el-form-item label="体温 (℃)" prop="temperature">
            <el-input-number
              v-model="form.temperature"
              :min="34"
              :max="42"
              :step="0.1"
              :precision="1"
              controls-position="right"
              style="width:100%"
              placeholder="例：36.8"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="呼吸频率" prop="respiratoryRate">
            <el-input-number
              v-model="form.respiratoryRate"
              :min="6"
              :max="60"
              :step="1"
              controls-position="right"
              style="width:100%"
              placeholder="次/分，例：18"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="血糖 (mmol/L)" prop="bloodGlucose">
            <el-input-number
              v-model="form.bloodGlucose"
              :min="2"
              :max="30"
              :step="0.1"
              :precision="1"
              controls-position="right"
              style="width:100%"
              placeholder="例：5.6"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :span="8">
          <el-form-item label="意识状态" prop="consciousness">
            <el-select v-model="form.consciousness" placeholder="选择">
              <el-option label="清醒" value="清醒" />
              <el-option label="嗜睡" value="嗜睡" />
              <el-option label="昏睡" value="昏睡" />
              <el-option label="昏迷" value="昏迷" />
              <el-option label="躁动" value="躁动" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="体重 (kg)" prop="weight">
            <el-input-number
              v-model="form.weight"
              :min="1"
              :max="200"
              :step="0.1"
              :precision="1"
              controls-position="right"
              style="width:100%"
              placeholder="例：65"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="身高 (cm)" prop="height">
            <el-input-number
              v-model="form.height"
              :min="30"
              :max="230"
              :step="1"
              controls-position="right"
              style="width:100%"
              placeholder="例：170"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">病史与过敏</el-divider>
      <el-row :gutter="14">
        <el-col :span="12">
          <el-form-item label="过敏史" prop="allergies">
            <el-input
              v-model="form.allergies"
              placeholder="如：青霉素、海鲜、花粉，无则留空"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系人" prop="contact">
            <el-input
              v-model="form.contact"
              placeholder="家属/紧急联系人电话"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="14">
        <el-col :span="24">
          <el-form-item label="既往病史" prop="medicalHistory">
            <el-input
              v-model="form.medicalHistory"
              type="textarea"
              :rows="2"
              placeholder="高血压 / 糖尿病 / 冠心病 / 手术史 等"
              maxlength="300"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <el-button @click="fillDemo">快速填充示例</el-button>
        <div>
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            <CircleCheck /> 登记并加入候诊队列
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'submit'])

const visible = ref(props.modelValue)
watch(() => props.modelValue, v => (visible.value = v))
watch(visible, v => emit('update:modelValue', v))

const formRef = ref(null)

function emptyForm() {
  return {
    name: '',
    gender: '男',
    age: null,
    triage: 'normal',
    arrivalTime: new Date().toTimeString().slice(0, 5),
    chiefComplaint: '',
    heartRate: null,
    bloodPressure: '',
    spo2: null,
    temperature: null,
    respiratoryRate: null,
    bloodGlucose: null,
    consciousness: '清醒',
    weight: null,
    height: null,
    allergies: '',
    medicalHistory: '',
    contact: ''
  }
}

const form = reactive(emptyForm())

const rules = {
  name: [{ required: true, message: '请输入患者姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    {
      validator: (rule, value, cb) => {
        if (value === '' || value === null || value === undefined) return cb()
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 150) {
          cb(new Error('请输入 0~150 之间的有效年龄'))
        } else {
          cb()
        }
      },
      trigger: 'blur'
    }
  ],
  triage: [{ required: true, message: '请选择分诊等级', trigger: 'change' }],
  chiefComplaint: [{ required: true, message: '请输入主诉', trigger: 'blur' }]
}

function fillDemo() {
  const samples = [
    { name: '赵明', gender: '男', age: 61, triage: 'critical',
      chiefComplaint: '持续性胸痛 3 小时，伴大汗',
      heartRate: 118, bloodPressure: '165/98', spo2: 93, temperature: 37.2,
      respiratoryRate: 22, bloodGlucose: 7.8, consciousness: '清醒',
      weight: 78, height: 172, allergies: '青霉素', medicalHistory: '高血压 5 年',
      contact: '13900001111' },
    { name: '孙婷', gender: '女', age: 29, triage: 'urgent',
      chiefComplaint: '右下腹痛伴恶心半天',
      heartRate: 96, bloodPressure: '130/82', spo2: 98, temperature: 37.8,
      respiratoryRate: 18, bloodGlucose: 5.4, consciousness: '清醒',
      weight: 56, height: 163, allergies: '', medicalHistory: '无',
      contact: '13900002222' }
  ]
  const pick = samples[Math.floor(Math.random() * samples.length)]
  Object.keys(pick).forEach(k => { form[k] = pick[k] })
  ElMessage.info('已填充示例数据，可继续编辑后提交')
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    ElMessage.warning('请完整填写必填项')
    return
  }
  emit('submit', { ...form })
  visible.value = false
}

function handleClosed() {
  Object.assign(form, emptyForm())
  if (formRef.value) formRef.value.clearValidate()
}
</script>

<style scoped>
/* 确保数字输入框在窄列中仍能清晰显示数字与占位符 */
:deep(.el-input-number) {
  width: 100% !important;
  min-width: 160px;
}
:deep(.el-input-number .el-input__inner) {
  text-align: left;
  font-size: 14px;
  padding-left: 12px;
  padding-right: 64px; /* 给右侧 +/− 控件留出足够空间，避免遮挡数字 */
  height: 32px;
  line-height: 32px;
}
:deep(.el-input-number .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.el-input-number.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #409eff inset;
}
:deep(.el-input-number .el-input-number__decrease),
:deep(.el-input-number .el-input-number__increase) {
  width: 28px;
  font-size: 16px;
  color: #606266;
}
</style>