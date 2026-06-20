<script setup>
defineProps({
  events: { type: Array, default: () => [] }
})
</script>

<template>
  <el-timeline class="growth-timeline">
    <el-timeline-item
      v-for="(event, idx) in events"
      :key="idx"
      :timestamp="event.time"
      placement="top"
      :color="event.icon === '⚠️' ? '#ff3b3b' : '#3fa34d'"
      size="large"
    >
      <el-tooltip placement="top" :show-after="200">
        <template #content>
          <div class="tip-content">
            <img :src="event.photo" alt="event" class="tip-photo" />
            <div class="tip-meta">
              <div class="tip-title">{{ event.icon }} {{ event.title }}</div>
              <div class="tip-sub">操作人：{{ event.operator }}</div>
              <div class="tip-detail">{{ event.detail }}</div>
            </div>
          </div>
        </template>

        <el-card class="event-card" shadow="hover">
          <div class="event-row">
            <span class="event-icon">{{ event.icon }}</span>
            <div class="event-body">
              <div class="event-title">
                {{ event.title }}
                <el-tag v-if="event.icon === '⚠️'" type="danger" size="small" effect="dark" style="margin-left:8px;">紧急</el-tag>
              </div>
              <div class="event-detail">{{ event.detail }}</div>
              <div class="event-foot">
                <span>👤 {{ event.operator }}</span>
                <el-image
                  :src="event.photo"
                  :preview-src-list="[event.photo]"
                  fit="cover"
                  class="event-photo"
                  preview-teleported
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-tooltip>
    </el-timeline-item>
  </el-timeline>
</template>

<style scoped>
.growth-timeline {
  padding: 8px 4px 8px 16px;
}
.event-card {
  background: #111b2e;
  border: 1px solid #243046;
  border-radius: 12px;
  margin-bottom: 4px;
}
.event-card :deep(.el-card__body) {
  padding: 14px 16px;
  background: transparent;
}
.event-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.event-icon {
  font-size: 26px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px #00000044;
}
.event-body { flex: 1; min-width: 0; }
.event-title {
  color: #f1f5f9;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
}
.event-detail {
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 8px;
}
.event-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #64748b;
  font-size: 12px;
}
.event-photo {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid #334155;
  cursor: zoom-in;
}

.tip-content {
  display: flex;
  gap: 10px;
  max-width: 320px;
  padding: 4px;
}
.tip-photo {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #334155;
}
.tip-meta { color: #e2e8f0; }
.tip-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
.tip-sub { color: #94a3b8; font-size: 12px; margin-bottom: 6px; }
.tip-detail { color: #cbd5e1; font-size: 12px; line-height: 1.6; }
</style>
