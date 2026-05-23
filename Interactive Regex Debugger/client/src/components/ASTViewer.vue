<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <h2 class="text-lg font-semibold text-cyber-blue mb-4">语法树 (AST)</h2>

    <div v-if="!store.analysisResult" class="text-center text-gray-500 py-8">
      等待分析结果...
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center gap-4 mb-4">
        <button
          @click="expandAll"
          class="px-3 py-1 text-sm bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded transition-colors"
        >
          全部展开
        </button>
        <button
          @click="collapseAll"
          class="px-3 py-1 text-sm bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded transition-colors"
        >
          全部折叠
        </button>
      </div>

      <div class="font-mono text-sm bg-cyber-dark/50 p-4 rounded border border-cyber-blue/20 overflow-x-auto">
        <ASTNode :node="astRoot" :level="0" />
      </div>

      <div class="mt-4 p-3 bg-cyber-dark/50 border border-cyber-blue/20 rounded">
        <h3 class="text-sm font-semibold text-cyber-blue mb-2">节点类型说明</h3>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-gray-700 rounded">literal</span>
            <span class="text-gray-400">字面量字符</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-blue-900 rounded">group</span>
            <span class="text-gray-400">捕获组</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-yellow-900 rounded non-capture-error">non-capture</span>
            <span class="text-gray-400">非捕获组</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-purple-900 rounded">lookaround</span>
            <span class="text-gray-400">零宽断言</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-orange-900 rounded">quantifier</span>
            <span class="text-gray-400">量词</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-cyan-900 rounded">alternation</span>
            <span class="text-gray-400">分支</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRegexStore } from '../stores/regex'
import ASTNode from './ASTNode.vue'

const store = useRegexStore()

const astRoot = computed(() => store.analysisResult?.ast)

function expandAll() {
  function expand(node: any) {
    if (!node) return
    store.expandedNodes.add(node.id)
    if (node.children) {
      node.children.forEach((child: any) => expand(child))
    }
  }
  expand(astRoot.value)
}

function collapseAll() {
  store.expandedNodes.clear()
}
</script>
