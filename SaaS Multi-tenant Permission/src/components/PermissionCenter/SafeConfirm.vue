<template>
  <transition name="safe-fade" @after-leave="$emit('closed')">
    <div v-if="visible" class="safe-mask" @click.self="handleCancel">
      <div class="safe-dialog" :class="{ locked: locked }">
        <div class="safe-visual">
          <div class="safe-body">
            <div class="safe-door" :class="{ open: !locked }">
              <div class="safe-handle">
                <div class="dial" :style="{ transform: `rotate(${dial}deg)` }">
                  <span>◆</span>
                </div>
              </div>
              <div class="safe-lines">
                <div v-for="i in 3" :key="i" />
              </div>
              <div class="safe-brand">SAAS VAULT</div>
              <div class="safe-lock" :class="{ unlocked: !locked }">
                <span class="lock-shackle" />
                <span class="lock-body">{{ !locked ? '🔓' : '🔒' }}</span>
              </div>
            </div>
            <div class="safe-content">
              <div class="keyhole" />
              <div class="keyhole-lines">
                <div v-for="i in 6" :key="i" />
              </div>
            </div>
          </div>
          <div class="safe-shake-layer" />
        </div>

        <div class="safe-form">
          <h3>
            <el-icon :size="22"><Lock /></el-icon>
            解锁保险箱：确认权限变更
          </h3>
          <p class="safe-desc">
            请输入二级授权码完成保存。变更将覆盖
            <strong>{{ roleName }}</strong> 角色当前的权限配置。
          </p>

          <el-form :model="form" label-position="top" size="large" @submit.prevent="handleConfirm">
            <el-form-item label="二次授权码">
              <el-input
                v-model="form.code"
                placeholder="输入 AUTH-<strong>2026</strong> 解锁（示意）"
                show-password
                clearable
                maxlength="24"
                @keyup.enter="handleConfirm"
              />
              <small style="color:#8592a6">提示：任意内容均可通过（演示模式）</small>
            </el-form-item>

            <el-form-item label="变更说明（可选）">
              <el-input
                v-model="form.reason"
                type="textarea"
                :rows="2"
                placeholder="例如：根据工单 #882 调整运营权限"
              />
            </el-form-item>
          </el-form>

          <div class="safe-footer">
            <el-button size="large" @click="handleCancel">取消</el-button>
            <el-button type="danger" size="large" :loading="confirming" @click="handleConfirm">
              确认解锁并写入
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Lock } from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean,
  roleName: { type: String, default: '当前角色' },
})

const emit = defineEmits(['confirm', 'cancel', 'closed'])

const locked = ref(true)
const confirming = ref(false)
const dial = ref(0)
const form = reactive({ code: '', reason: '' })

watch(
  () => props.visible,
  (v) => {
    if (v) {
      locked.value = true
      confirming.value = false
      form.code = ''
      form.reason = ''
      dial.value = 0
      const spin = window.setInterval(() => {
        dial.value += 12
      }, 60)
      window.setTimeout(() => window.clearInterval(spin), 1800)
    }
  },
)

function playClick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.value = 1400
    g.gain.value = 0.08
    o.connect(g).connect(ctx.destination)
    o.start()
    o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
    o.stop(ctx.currentTime + 0.16)
  } catch (e) {
    // 忽略音频播放失败
  }
}

function handleConfirm() {
  if (confirming.value) return
  confirming.value = true
  playClick()
  window.setTimeout(() => {
    locked.value = false
    playClick()
    window.setTimeout(() => {
      emit('confirm', { reason: form.reason, code: form.code })
    }, 500)
  }, 600)
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.safe-mask {
  position: fixed;
  inset: 0;
  background: rgba(9, 16, 32, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2010;
}

.safe-dialog {
  display: flex;
  width: 760px;
  max-width: calc(100vw - 32px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.safe-visual {
  flex: 0 0 320px;
  background: linear-gradient(160deg, #1e2746 0%, #303f7b 60%, #4b5db0 100%);
  padding: 28px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #fff;
}

.safe-body {
  width: 240px;
  position: relative;
}

.safe-door {
  position: relative;
  height: 260px;
  background: linear-gradient(145deg, #4a5aa0, #2a3666);
  border: 4px solid #6e7fbe;
  border-radius: 14px;
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.45), 0 10px 24px rgba(0, 0, 0, 0.35);
  transform-origin: left center;
  transition: transform 0.9s cubic-bezier(0.68, 0, 0.27, 1), box-shadow 0.4s;
}

.safe-door.open {
  transform: perspective(900px) rotateY(-74deg);
  box-shadow: 40px 0 40px rgba(0, 0, 0, 0.4);
}

.safe-handle {
  position: absolute;
  top: 28px;
  right: 24px;
  width: 70px;
  height: 70px;
  background: radial-gradient(circle at 30% 30%, #c9d4f6, #7685bf 70%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.dial {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: repeating-conic-gradient(#3a4a85 0deg 10deg, #25305e 10deg 20deg);
  color: #ffd34d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: transform 0.1s linear;
}

.safe-lines {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 70px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.safe-lines > div {
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}

.safe-brand {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18px;
  text-align: center;
  font-size: 14px;
  letter-spacing: 4px;
  color: #ffd34d;
  font-weight: 600;
}

.safe-lock {
  position: absolute;
  left: 28px;
  top: 38px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ffd34d;
}

.lock-shackle {
  width: 24px;
  height: 20px;
  border: 3px solid #ffd34d;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  transition: transform 0.5s ease;
}
.lock-body {
  font-size: 20px;
  margin-top: 2px;
}
.safe-lock.unlocked .lock-shackle {
  transform: translateY(-8px) translateX(10px) rotate(28deg);
}

.safe-content {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
  width: 200px;
  z-index: -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffd34d;
  gap: 12px;
}

.keyhole {
  width: 36px;
  height: 60px;
  background: #1a2346;
  clip-path: polygon(30% 0, 70% 0, 70% 20%, 100% 40%, 100% 80%, 50% 100%, 0 80%, 0 40%, 30% 20%);
}
.keyhole-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 60%;
}
.keyhole-lines > div {
  height: 4px;
  background: rgba(255, 211, 77, 0.25);
  border-radius: 2px;
}

.safe-form {
  flex: 1;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
}
.safe-form h3 {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
}
.safe-desc {
  margin: 0 0 18px;
  color: #6b7280;
  font-size: 14px;
}

.safe-footer {
  margin-top: auto;
  padding-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.safe-fade-enter-active,
.safe-fade-leave-active {
  transition: opacity 0.25s ease;
}
.safe-fade-enter-from,
.safe-fade-leave-to {
  opacity: 0;
}
.safe-fade-enter-active .safe-dialog,
.safe-fade-leave-active .safe-dialog {
  transition: transform 0.3s ease;
}
.safe-fade-enter-from .safe-dialog,
.safe-fade-leave-to .safe-dialog {
  transform: translateY(20px) scale(0.97);
}
</style>
