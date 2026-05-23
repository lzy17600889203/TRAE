<template>
  <div class="bg-cyber-dark/80 rounded-lg p-4 glow-border">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-cyber-blue">正则片段库</h2>
      <button
        @click="showSaveDialog = true"
        :disabled="!store.pattern"
        class="px-3 py-1 text-sm bg-cyber-green/20 hover:bg-cyber-green/30 text-cyber-green rounded transition-colors disabled:opacity-50"
      >
        保存当前
      </button>
    </div>

    <div v-if="showSaveDialog" class="mb-4 p-3 bg-cyber-dark/50 border border-cyber-blue/30 rounded">
      <input
        v-model="newSnippetName"
        type="text"
        placeholder="片段名称"
        class="w-full mb-2 px-2 py-1 bg-cyber-dark border border-cyber-blue/30 rounded text-sm focus:outline-none focus:border-cyber-blue"
      />
      <textarea
        v-model="newSnippetDescription"
        placeholder="描述（可选）"
        rows="2"
        class="w-full mb-2 px-2 py-1 bg-cyber-dark border border-cyber-blue/30 rounded text-sm focus:outline-none focus:border-cyber-blue resize-none"
      />
      <div class="flex gap-2">
        <button
          @click="saveSnippet"
          class="flex-1 px-3 py-1 text-sm bg-cyber-green text-cyber-dark rounded hover:bg-cyber-green/80"
        >
          保存
        </button>
        <button
          @click="showSaveDialog = false"
          class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500"
        >
          取消
        </button>
      </div>
    </div>

    <div v-if="store.snippets.length === 0" class="text-center text-gray-500 py-4">
      暂无保存的正则片段
    </div>

    <div v-else class="space-y-2 max-h-48 overflow-y-auto">
      <div
        v-for="snippet in store.snippets"
        :key="snippet.id"
        class="p-2 bg-cyber-dark/50 border border-cyber-blue/20 rounded hover:border-cyber-blue/50 transition-colors"
      >
        <div class="flex items-center justify-between">
          <span class="font-medium text-cyber-blue">{{ snippet.name }}</span>
          <div class="flex gap-1">
            <button
              @click="store.loadFromSnippet(snippet)"
              class="text-xs px-2 py-1 bg-cyber-blue/20 text-cyber-blue rounded hover:bg-cyber-blue/30"
            >
              加载
            </button>
            <button
              @click="deleteSnippet(snippet.id)"
              class="text-xs px-2 py-1 bg-cyber-red/20 text-cyber-red rounded hover:bg-cyber-red/30"
            >
              删除
            </button>
          </div>
        </div>
        <p class="text-xs font-mono text-cyber-green mt-1">
          /{{ snippet.pattern }}/{{ snippet.flags }}
        </p>
        <p v-if="snippet.description" class="text-xs text-gray-400 mt-1">
          {{ snippet.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRegexStore } from '../stores/regex'

const store = useRegexStore()
const showSaveDialog = ref(false)
const newSnippetName = ref('')
const newSnippetDescription = ref('')

async function saveSnippet() {
  if (!newSnippetName.value.trim()) return
  await store.saveSnippet(newSnippetName.value, newSnippetDescription.value)
  newSnippetName.value = ''
  newSnippetDescription.value = ''
  showSaveDialog.value = false
}

async function deleteSnippet(id: number) {
  await store.deleteSnippet(id)
}
</script>
