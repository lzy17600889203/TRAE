<script setup lang="ts">
import { computed } from 'vue';
import { useCluster } from '../composables/useCluster';
import { Clock, Vote, Heart, FileText, AlertTriangle, Zap, Wifi, Skull, Activity } from 'lucide-vue-next';
import type { ClusterEvent } from '../../shared/types';

const { state } = useCluster();

const eventTypeConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  election_start: { icon: Zap, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50', label: '选举开始' },
  vote_cast: { icon: Vote, color: 'text-blue-400 bg-blue-500/20 border-blue-500/50', label: '投票' },
  election_win: { icon: Zap, color: 'text-green-400 bg-green-500/20 border-green-500/50', label: '选举成功' },
  election_fail: { icon: AlertTriangle, color: 'text-red-400 bg-red-500/20 border-red-500/50', label: '选举失败' },
  heartbeat_send: { icon: Heart, color: 'text-pink-400 bg-pink-500/20 border-pink-500/50', label: '心跳发送' },
  heartbeat_receive: { icon: Heart, color: 'text-pink-400 bg-pink-500/20 border-pink-500/50', label: '心跳接收' },
  heartbeat_timeout: { icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/20 border-orange-500/50', label: '心跳超时' },
  log_replicate: { icon: FileText, color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50', label: '日志复制' },
  log_commit: { icon: FileText, color: 'text-green-400 bg-green-500/20 border-green-500/50', label: '日志提交' },
  log_apply: { icon: Activity, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50', label: '日志应用' },
  state_change: { icon: Activity, color: 'text-purple-400 bg-purple-500/20 border-purple-500/50', label: '状态变更' },
  network_partition: { icon: Wifi, color: 'text-red-400 bg-red-500/20 border-red-500/50', label: '网络分区' },
  network_heal: { icon: Wifi, color: 'text-green-400 bg-green-500/20 border-green-500/50', label: '网络修复' },
  node_crash: { icon: Skull, color: 'text-red-400 bg-red-500/20 border-red-500/50', label: '节点崩溃' },
  node_recovery: { icon: Activity, color: 'text-green-400 bg-green-500/20 border-green-500/50', label: '节点恢复' },
  message_send: { icon: Zap, color: 'text-blue-400 bg-blue-500/20 border-blue-500/50', label: '消息发送' },
  message_receive: { icon: Zap, color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50', label: '消息接收' },
  client_request: { icon: FileText, color: 'text-violet-400 bg-violet-500/20 border-violet-500/50', label: '客户端请求' }
};

const filteredEvents = computed(() => {
  return state.events.slice(0, 50);
});

function getEventConfig(event: ClusterEvent) {
  return eventTypeConfig[event.type] || eventTypeConfig.message_send;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour12: false });
}

function getEventDescription(event: ClusterEvent): string {
  const data = event.data || {};
  
  switch (event.type) {
    case 'election_start':
      return `节点 ${event.nodeId} 发起选举 (任期 ${event.term})`;
    case 'vote_cast':
      return data.voteGranted ? `节点 ${data.voterId} 投票给节点 ${event.nodeId}` : `节点 ${data.voterId} 拒绝投票`;
    case 'election_win':
      return `节点 ${event.nodeId} 当选 Leader (任期 ${event.term})`;
    case 'election_fail':
      return `节点 ${event.nodeId} 选举失败，仅获 ${data.votes}/${data.needed} 票`;
    case 'log_replicate':
      return data.action === 'overwrite' ? `覆盖日志索引 ${data.logIndex}` : `复制日志索引 ${data.logIndex || '...'}`;
    case 'log_commit':
      return `提交日志索引 ${data.logIndex}`;
    case 'log_apply':
      return `应用日志: ${data.command}`;
    case 'node_crash':
      return `节点 ${event.nodeId} 崩溃`;
    case 'node_recovery':
      return `节点 ${event.nodeId} 恢复`;
    case 'network_partition':
      return `网络被分为 ${(data.groups || []).length} 个分区`;
    case 'network_heal':
      return `网络分区已修复`;
    case 'client_request':
      return data.rejected ? `请求被拒绝: ${data.reason}` : `处理请求: ${data.command}`;
    case 'heartbeat_send':
      return `Leader 发送心跳 (任期 ${event.term})`;
    case 'message_send':
      return data.dropped ? `消息丢失 (目标: 节点 ${data.targetId})` : `发送消息到节点 ${data.targetId}`;
    default:
      return `${event.type}`;
  }
}
</script>

<template>
  <div class="timeline-container bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-cyan-400 font-mono">事件时间线</h2>
      <span class="text-xs text-slate-500">{{ state.events.length }} 条事件</span>
    </div>

    <div class="timeline-list max-h-96 overflow-y-auto space-y-2 pr-2">
      <div
        v-for="event in filteredEvents"
        :key="event.id || event.timestamp"
        class="timeline-item"
      >
        <div class="flex items-start gap-3">
          <div class="timeline-icon flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border"
               :class="getEventConfig(event).color">
            <component :is="getEventConfig(event).icon" class="w-4 h-4" />
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-slate-300">{{ getEventConfig(event).label }}</span>
              <span class="text-xs text-slate-500">{{ formatTime(event.timestamp) }}</span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 truncate">{{ getEventDescription(event) }}</p>
            <div v-if="event.nodeId !== null && event.nodeId !== undefined" class="flex items-center gap-1 mt-1">
              <span class="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                节点 {{ event.nodeId }}
              </span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                任期 {{ event.term }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredEvents.length === 0" class="text-center py-8">
        <Clock class="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p class="text-sm text-slate-500">暂无事件记录</p>
        <p class="text-xs text-slate-600 mt-1">启动模拟后将显示事件时间线</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  width: 320px;
}

.timeline-item {
  padding: 0.5rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 0.375rem;
  border: 1px solid rgba(100, 116, 139, 0.2);
  transition: all 0.2s;
}

.timeline-item:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(100, 116, 139, 0.4);
}

.timeline-list::-webkit-scrollbar {
  width: 4px;
}

.timeline-list::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 2px;
}

.timeline-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 2px;
}

.timeline-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
