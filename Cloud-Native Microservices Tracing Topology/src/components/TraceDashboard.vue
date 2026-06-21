<script setup lang="ts">
import { ref, computed } from 'vue';
import { Activity, AlertTriangle, Database, Server, Clock, GitBranch } from 'lucide-vue-next';
import TopologyGraph from './TopologyGraph.vue';
import GanttChart from './GanttChart.vue';
import NodeDrawer from './NodeDrawer.vue';
import { buildMockTrace } from '../mock/mockData';
import type { ServiceNode } from '../types/trace';

const trace = ref(buildMockTrace());

const drawerVisible = ref(false);
const selectedNode = ref<ServiceNode | null>(null);

const statusLabel = computed(() => trace.value.status === 'slow' ? '异常' : '正常');
const statusClass = computed(() => trace.value.status === 'slow' ? 'status-danger' : 'status-normal');

const bottleneckCount = computed(() => trace.value.nodes.filter((n) => n.isBottleneck).length);

function onNodeClick(node: ServiceNode) {
  selectedNode.value = node;
  drawerVisible.value = true;
}
</script>

<template>
  <div class="dashboard">
    <!-- ============ 页头信息栏 ============ -->
    <header class="dashboard-header">
      <div class="brand">
        <div class="logo">
          <Activity :size="22" color="#38BDF8" />
        </div>
        <div class="brand-text">
          <h1>微服务全链路追踪看板</h1>
          <p>Distributed Tracing · Root Cause Analysis</p>
        </div>
      </div>

      <div class="info-cards">
        <div class="info-card">
          <span class="info-label">Trace ID</span>
          <span class="info-value mono">{{ trace.requestId }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">
            <Clock :size="12" style="vertical-align:-2px; margin-right:4px" />
            时间戳
          </span>
          <span class="info-value mono">{{ trace.timestamp }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">
            <GitBranch :size="12" style="vertical-align:-2px; margin-right:4px" />
            调用节点
          </span>
          <span class="info-value">{{ trace.nodes.length }} 个</span>
        </div>
        <div class="info-card danger-card">
          <span class="info-label">总耗时</span>
          <span class="info-value mono duration">{{ trace.totalDuration }} ms</span>
        </div>
        <div class="info-card status-card" :class="statusClass">
          <span class="info-label">状态</span>
          <span class="info-value">
            <AlertTriangle v-if="trace.status === 'slow'" :size="12" style="vertical-align:-2px; margin-right:4px" />
            {{ statusLabel }}
          </span>
        </div>
      </div>
    </header>

    <!-- ============ 瓶颈摘要条 ============ -->
    <section v-if="bottleneckCount > 0" class="bottleneck-banner">
      <AlertTriangle :size="18" color="#FCA5A5" />
      <span>
        检测到
        <b class="danger-text">{{ bottleneckCount }}</b>
        个瓶颈节点，其中
        <b class="danger-text">库存服务</b>
        响应耗时
        <b class="danger-text">2400 ms</b>
        超过阈值 2000 ms，建议优先排查。
      </span>
    </section>

    <!-- ============ 中部拓扑图区 ============ -->
    <section class="section-topology">
      <div class="section-label">
        <Server :size="14" />
        <span>调用链路拓扑图</span>
      </div>
      <TopologyGraph :trace="trace" @node-click="onNodeClick" />
    </section>

    <!-- ============ 底部甘特图区 ============ -->
    <section class="section-gantt">
      <div class="section-label">
        <Database :size="14" />
        <span>耗时分布甘特图</span>
      </div>
      <GanttChart :trace="trace" />
    </section>

    <!-- ============ 右侧抽屉 ============ -->
    <NodeDrawer v-model:visible="drawerVisible" :node="selectedNode" />
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 20px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background:
    radial-gradient(ellipse at 10% 0%, rgba(56, 189, 248, 0.08), transparent 50%),
    radial-gradient(ellipse at 90% 100%, rgba(239, 68, 68, 0.06), transparent 50%),
    var(--bg-primary);
}

/* ----------- 页头 ----------- */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 16px 22px;
  background: var(--bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(56, 189, 248, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
}

.brand-text h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-dim);
  letter-spacing: 1px;
}

.info-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  min-width: 120px;
}

.info-label {
  font-size: 11px;
  color: var(--color-text-dim);
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 600;
}

.info-value.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.danger-card {
  border-color: rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), #0B1020);
}

.danger-card .duration {
  color: #FCA5A5;
  font-size: 15px;
}

.status-card {
  border-color: rgba(34, 197, 94, 0.4);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), #0B1020);
}

.status-card.status-danger {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), #0B1020);
  animation: pulse-danger-badge 1.8s ease-in-out infinite;
}

@keyframes pulse-danger-badge {
  0%, 100% { box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
  50%      { box-shadow: 0 0 18px rgba(239, 68, 68, 0.45); }
}

/* ----------- 瓶颈摘要条 ----------- */
.bottleneck-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-left: 4px solid #EF4444;
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.6;
}

.danger-text {
  color: #FCA5A5;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
}

/* ----------- 区块标签 ----------- */
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-dim);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.section-topology {
  flex: 1;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.section-gantt {
  min-height: 340px;
  display: flex;
  flex-direction: column;
}
</style>
