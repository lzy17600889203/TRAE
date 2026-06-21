<template>
  <div class="app-root">
    <header class="app-header">
      <div class="brand">
        <span class="logo">&#128737;</span>
        <span class="title">数据脱敏配置中心</span>
        <span class="sub">Data Masking &amp; Permission Config Platform</span>
      </div>
      <div class="actions">
        <el-tag type="info" size="small">管理员视角</el-tag>
        <el-tag type="warning" size="small">财务/HR 敏感数据</el-tag>
      </div>
    </header>

    <section class="app-main">
      <aside class="tree-pane">
        <LeftTree />
      </aside>
      <section class="canvas-pane">
        <X6Canvas @save="showAudit = true" />
      </section>
    </section>

    <footer class="app-footer">
      <RulePie />
    </footer>

    <AuditDialog v-model="showAudit" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LeftTree from './components/LeftTree.vue'
import X6Canvas from './components/X6Canvas.vue'
import AuditDialog from './components/AuditDialog.vue'
import RulePie from './components/RulePie.vue'

const showAudit = ref(false)
</script>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 12px;
  gap: 12px;
  box-sizing: border-box;
  background: #f3f4f6;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #06b6d4 100%);
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(30,58,138,0.2);
}
.brand { display: flex; align-items: center; gap: 12px; }
.logo { font-size: 22px; }
.title { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
.sub { font-size: 12px; opacity: 0.85; }
.actions { display: flex; gap: 8px; }

.app-main {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
}
.tree-pane {
  width: 340px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: auto;
}
.canvas-pane {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-footer {
  min-height: 320px;
}
</style>
