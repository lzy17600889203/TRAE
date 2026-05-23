import { defineStore } from 'pinia'
import type { RegexAnalysisResult, MatchStep, RegexSnippet, DebugHistory, PresetScenario } from '@shared/types'
import { PRESET_SCENARIOS } from '@shared/types'

interface RegexState {
  pattern: string
  testString: string
  flags: string
  analysisResult: RegexAnalysisResult | null
  currentStepIndex: number
  isPlaying: boolean
  isAnalyzing: boolean
  snippets: RegexSnippet[]
  history: DebugHistory[]
  presets: PresetScenario[]
  expandedNodes: Set<string>
  animationSpeed: number
  showCatastrophicWarning: boolean
}

export const useRegexStore = defineStore('regex', {
  state: (): RegexState => ({
    pattern: '',
    testString: '',
    flags: '',
    analysisResult: null,
    currentStepIndex: 0,
    isPlaying: false,
    isAnalyzing: false,
    snippets: [],
    history: [],
    presets: PRESET_SCENARIOS,
    expandedNodes: new Set(),
    animationSpeed: 500,
    showCatastrophicWarning: false
  }),

  getters: {
    currentStep(): MatchStep | null {
      if (!this.analysisResult || this.currentStepIndex >= this.analysisResult.steps.length) {
        return null
      }
      return this.analysisResult.steps[this.currentStepIndex]
    },

    totalSteps(): number {
      return this.analysisResult?.steps.length || 0
    },

    activeNodes(): Set<string> {
      const step = this.currentStep
      return new Set(step?.nodesVisited || [])
    },

    hasCatastrophicWarning(): boolean {
      return this.analysisResult?.warnings.some(w => w.type === 'catastrophic-backtrack') || false
    }
  },

  actions: {
    async analyze() {
      if (!this.pattern || !this.testString) return

      this.isAnalyzing = true
      this.analysisResult = null
      this.currentStepIndex = 0

      try {
        const startTime = Date.now()
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pattern: this.pattern,
            testString: this.testString,
            flags: this.flags
          })
        })

        const elapsed = Date.now() - startTime
        if (elapsed > 2000) {
          this.showCatastrophicWarning = true
          setTimeout(() => {
            this.showCatastrophicWarning = false
          }, 5000)
        }

        if (!response.ok) {
          throw new Error('Analysis failed')
        }

        this.analysisResult = await response.json()
        this.expandAllNodes(this.analysisResult?.ast)
      } catch (error) {
        console.error('Analysis error:', error)
      } finally {
        this.isAnalyzing = false
      }
    },

    expandAllNodes(node: any) {
      if (!node) return
      this.expandedNodes.add(node.id)
      if (node.children) {
        node.children.forEach((child: any) => this.expandAllNodes(child))
      }
    },

    toggleNode(nodeId: string) {
      if (this.expandedNodes.has(nodeId)) {
        this.expandedNodes.delete(nodeId)
      } else {
        this.expandedNodes.add(nodeId)
      }
    },

    loadPreset(preset: PresetScenario) {
      this.pattern = preset.pattern
      this.testString = preset.testString
      this.flags = preset.flags
    },

    nextStep() {
      if (this.currentStepIndex < this.totalSteps - 1) {
        this.currentStepIndex++
      }
    },

    prevStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--
      }
    },

    resetSteps() {
      this.currentStepIndex = 0
    },

    play() {
      if (this.isPlaying) {
        this.isPlaying = false
        return
      }

      this.isPlaying = true
      const playNext = () => {
        if (!this.isPlaying) return
        if (this.currentStepIndex < this.totalSteps - 1) {
          this.currentStepIndex++
          setTimeout(playNext, this.animationSpeed)
        } else {
          this.isPlaying = false
        }
      }
      playNext()
    },

    pause() {
      this.isPlaying = false
    },

    async loadSnippets() {
      try {
        const response = await fetch('/api/snippets')
        const data = await response.json()
        this.snippets = data.snippets || []
      } catch (error) {
        console.error('Failed to load snippets:', error)
      }
    },

    async saveSnippet(name: string, description: string) {
      try {
        const response = await fetch('/api/snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            pattern: this.pattern,
            description,
            flags: this.flags
          })
        })
        const data = await response.json()
        if (data.snippet) {
          this.snippets.unshift(data.snippet)
        }
      } catch (error) {
        console.error('Failed to save snippet:', error)
      }
    },

    async deleteSnippet(id: number) {
      try {
        await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
        this.snippets = this.snippets.filter(s => s.id !== id)
      } catch (error) {
        console.error('Failed to delete snippet:', error)
      }
    },

    async loadHistory() {
      try {
        const response = await fetch('/api/history')
        const data = await response.json()
        this.history = data.history || []
      } catch (error) {
        console.error('Failed to load history:', error)
      }
    },

    loadFromSnippet(snippet: RegexSnippet) {
      this.pattern = snippet.pattern
      this.flags = snippet.flags
    }
  }
})
