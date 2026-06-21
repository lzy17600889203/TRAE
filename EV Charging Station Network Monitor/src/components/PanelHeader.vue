<template>
  <div class="panel-header">
    <div class="panel-title">
      <span class="title-bar"></span>
      <span class="title-text">{{ title }}</span>
      <span class="title-sub">{{ subtitle }}</span>
    </div>
    <div class="panel-line"></div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String
})
</script>

<style scoped>
.panel-header {
  padding: 14px 18px 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(79, 195, 247, 0.15);
}
.panel-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.title-bar {
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #4fc3f7, #1e88e5);
  border-radius: 2px;
}
.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #e6f1ff;
  letter-spacing: 1px;
}
.title-sub {
  color: #8ab4d8;
  font-size: 12px;
}
.panel-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(79, 195, 247, 0.5), transparent);
}
</style>
