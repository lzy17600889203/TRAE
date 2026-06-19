<template>
  <div class="cards-list">
    <div
      v-for="c in customers"
      :key="c.id"
      class="follow-card"
      :class="{ 'need-follow': isNeedFollowToday(c) }"
      @click="$emit('open-drawer', c)"
    >
      <div class="card-left">
        <!-- 闹钟 / 头像 -->
        <div class="alarm-wrap" v-if="isNeedFollowToday(c)">
          <el-icon :size="26" class="alarm-icon-shake"><AlarmClock /></el-icon>
        </div>
        <div class="customer-avatar" v-else>{{ c.short }}</div>

        <div class="info">
          <div class="name-row">
            <span class="name">{{ c.name }}</span>
            <el-tag v-if="isNeedFollowToday(c)" type="warning" size="small" effect="dark">
              今日需跟进
            </el-tag>
            <el-tag v-else :type="stageTagType(c.stage)" size="small" effect="plain">
              {{ stageName(c.stage) }}
            </el-tag>
          </div>
          <div class="time-row">
            <span class="time-item">
              <el-icon><Clock /></el-icon>
              上次跟进：{{ formatDate(c.lastFollow) }}
            </span>
            <span class="time-item" :class="{ 'is-today': isNeedFollowToday(c) }">
              <el-icon><Calendar /></el-icon>
              下次计划：{{ formatDate(c.nextFollow) }}
            </span>
            <span class="time-item">
              <el-icon><User /></el-icon>
              负责人：{{ c.operator }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-right">
        <el-button type="primary" link @click.stop="$emit('open-drawer', c)">
          跟进记录
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <el-empty v-if="!customers.length" description="暂无待跟进客户" />
  </div>
</template>

<script setup>
import { isNeedFollowToday, formatDate } from '../data/customers.js'

defineProps({
  customers: {
    type: Array,
    required: true
  }
})

defineEmits(['open-drawer'])

function stageName(key) {
  return (
    {
      lead: '线索',
      contact: '初步接触',
      proposal: '方案沟通',
      negotiate: '商务谈判',
      deal: '成交'
    }[key] || key
  )
}

function stageTagType(key) {
  return (
    {
      lead: 'info',
      contact: '',
      proposal: 'success',
      negotiate: 'warning',
      deal: 'danger'
    }[key] || ''
  )
}
</script>

<style scoped>
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.follow-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #ebeef5;
}

.follow-card.need-follow {
  background: linear-gradient(90deg, #fff7e6 0%, #fffdf8 100%);
  border-color: #ffd591;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.alarm-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff1e0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.time-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #909399;
  font-size: 13px;
}

.time-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.time-item.is-today {
  color: #e6a23c;
  font-weight: 600;
}

.card-right {
  flex-shrink: 0;
}
</style>
