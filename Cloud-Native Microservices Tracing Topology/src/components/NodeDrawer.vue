<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Copy, CheckCircle, Database, Bug, Clock, Table2 } from 'lucide-vue-next';
import hljs from 'highlight.js/lib/core';
import sqlLang from 'highlight.js/lib/languages/sql';
import type { ServiceNode } from '../types/trace';

hljs.registerLanguage('sql', sqlLang);

const props = defineProps<{
  visible: boolean;
  node: ServiceNode | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const copiedId = ref<string | null>(null);
const activeTab = ref('sql');

// 用 computed 桥接：get 读 props，set 时 emit('update:visible') 给父组件
const drawerVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

const drawerTitle = computed(() => props.node?.name ?? '节点详情');

function highlightSql(sql: string): string {
  try {
    return hljs.highlight(sql, { language: 'sql' }).value;
  } catch {
    return sql;
  }
}

async function copySql(sql: string, id: string) {
  try {
    await navigator.clipboard.writeText(sql);
    copiedId.value = id;
    ElMessage.success('SQL 已复制到剪贴板');
    setTimeout(() => (copiedId.value = null), 1800);
  } catch {
    ElMessage.error('复制失败，请手动选中复制');
  }
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return (ms / 1000).toFixed(2) + ' s';
  return ms + ' ms';
}
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    direction="rtl"
    size="640px"
    destroy-on-close
  >
    <template v-if="node">
      <div class="node-meta">
        <div class="meta-card" :class="{ danger: node.isBottleneck }">
          <div class="meta-icon">
            <Database v-if="node.type === 'db'" :size="22" />
            <Bug v-else-if="node.type === 'service'" :size="22" />
            <Table2 v-else :size="22" />
          </div>
          <div class="meta-info">
            <div class="meta-row">
              <span class="label">节点类型</span>
              <span class="value">{{ node.type.toUpperCase() }}</span>
            </div>
            <div class="meta-row">
              <span class="label">耗时</span>
              <span class="value" :class="{ highlight: node.isBottleneck }">
                {{ formatDuration(node.duration) }}
              </span>
            </div>
            <div class="meta-row">
              <span class="label">状态</span>
              <span class="value">
                <span v-if="node.isBottleneck" class="status danger">⚠ 瓶颈</span>
                <span v-else class="status normal">✓ 正常</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="node-tabs" stretch>
        <el-tab-pane label="慢 SQL 详情" name="sql">
          <div v-if="node.slowSqls.length === 0" class="empty-state">
            <CheckCircle :size="36" color="#22C55E" />
            <p>该节点暂无慢 SQL 记录</p>
          </div>
          <div v-else class="sql-list">
            <div v-for="sql in node.slowSqls" :key="sql.id" class="sql-card">
              <div class="sql-header">
                <div class="sql-info">
                  <Clock :size="14" color="#FCA5A5" />
                  <span class="sql-duration">{{ formatDuration(sql.duration) }}</span>
                  <span class="sql-sep">·</span>
                  <span class="sql-rows">扫描 {{ sql.rowsExamined.toLocaleString() }} 行</span>
                  <span class="sql-sep">·</span>
                  <span class="sql-time">{{ sql.executedAt }}</span>
                </div>
                <el-button
                  :type="copiedId === sql.id ? 'success' : 'primary'"
                  size="small"
                  text
                  @click="copySql(sql.sql, sql.id)"
                >
                  <component :is="copiedId === sql.id ? CheckCircle : Copy" :size="14" style="margin-right:4px" />
                  {{ copiedId === sql.id ? '已复制' : '一键复制' }}
                </el-button>
              </div>
              <pre class="sql-block"><code v-html="highlightSql(sql.sql)"></code></pre>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="调用堆栈" name="stack">
          <div v-if="node.stackTraces.length === 0" class="empty-state">
            <CheckCircle :size="36" color="#22C55E" />
            <p>该节点未记录调用堆栈</p>
          </div>
          <div v-else class="stack-list">
            <div v-for="(st, idx) in node.stackTraces" :key="st.id" class="stack-card">
              <span class="stack-index">#{{ idx + 1 }}</span>
              <div class="stack-main">
                <div class="stack-method">
                  <span class="pkg">{{ st.class }}</span>
                  <span class="dot2">→</span>
                  <span class="method">{{ st.method }}()</span>
                </div>
                <div class="stack-file">
                  {{ st.file }} : {{ st.line }}
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <template v-else>
      <div class="empty-state">
        <p>暂无节点信息</p>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.node-meta {
  margin-bottom: 20px;
}

.meta-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 22px;
  background: #0B1020;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.meta-card.danger {
  border-color: rgba(239, 68, 68, 0.5);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), #0B1020);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
}

.meta-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(56, 189, 248, 0.15);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-card.danger .meta-icon {
  background: rgba(239, 68, 68, 0.18);
  color: #EF4444;
}

.meta-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.meta-row .label {
  color: var(--color-text-dim);
}

.meta-row .value {
  color: var(--color-text);
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.meta-row .value.highlight {
  color: #FCA5A5;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.normal {
  background: rgba(34, 197, 94, 0.15);
  color: #86EFAC;
}

.status.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #FCA5A5;
}

.node-tabs {
  margin-top: 8px;
}

.empty-state {
  padding: 48px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-dim);
  font-size: 13px;
}

.sql-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.sql-card {
  background: #0B1020;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.sql-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(56, 189, 248, 0.08);
  border-bottom: 1px solid var(--color-border);
}

.sql-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-dim);
  flex-wrap: wrap;
}

.sql-duration {
  color: #FCA5A5;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.sql-sep {
  color: #334155;
}

.sql-rows {
  color: #FBBF24;
  font-family: 'JetBrains Mono', monospace;
}

.sql-time {
  color: #94A3B8;
  font-family: 'JetBrains Mono', monospace;
}

.stack-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.stack-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  background: #0B1020;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  border-radius: 8px;
}

.stack-index {
  color: #38BDF8;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 13px;
  min-width: 24px;
}

.stack-main {
  flex: 1;
}

.stack-method {
  font-size: 13px;
  color: var(--color-text);
  margin-bottom: 4px;
  word-break: break-all;
}

.stack-method .pkg {
  color: #C084FC;
  font-family: 'JetBrains Mono', monospace;
}

.stack-method .dot2 {
  color: #334155;
  margin: 0 4px;
}

.stack-method .method {
  color: #86EFAC;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.stack-file {
  font-size: 12px;
  color: var(--color-text-dim);
  font-family: 'JetBrains Mono', monospace;
}
</style>
