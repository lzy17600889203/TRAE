import { defineStore } from 'pinia'
import { initialBindings, maskingRules, findField, tableTree, sceneNodes } from '../data/mock.js'

const ADMIN_PASSWORD = 'admin123'

export const useMaskingStore = defineStore('masking', {
  state: () => ({
    bindings: JSON.parse(JSON.stringify(initialBindings)),
    changeLog: [],
    adminPassword: ADMIN_PASSWORD
  }),
  getters: {
    ruleStats () {
      const counter = { mask: 0, hash: 0, empty: 0, none: 0 }
      for (const b of this.bindings) {
        const key = b.rule || 'none'
        if (counter[key] !== undefined) counter[key]++
        else counter[key] = 1
      }
      return Object.entries(counter).map(([k, v]) => {
        const rule = maskingRules.find(r => r.key === k)
        return { name: rule ? rule.label : k, value: v }
      })
    },
    unmaskedBindings () {
      return this.bindings.filter(b => !b.rule || b.rule === 'none')
    },
    getBinding: (state) => (fieldId, sceneId) => {
      return state.bindings.find(b => b.fieldId === fieldId && b.sceneId === sceneId)
    }
  },
  actions: {
    setBinding ({ fieldId, sceneId, rule }) {
      const existing = this.bindings.find(b => b.fieldId === fieldId && b.sceneId === sceneId)
      if (existing) {
        if (existing.rule === rule) return
        existing.rule = rule
      } else {
        this.bindings.push({ fieldId, sceneId, rule })
      }
      this.changeLog.push({ fieldId, sceneId, rule, action: existing ? '修改' : '新增' })
    },
    updateBindingRule (fieldId, sceneId, rule) {
      const existing = this.bindings.find(b => b.fieldId === fieldId && b.sceneId === sceneId)
      if (!existing) return false
      if (existing.rule === rule) return false
      existing.rule = rule
      this.changeLog.push({ fieldId, sceneId, rule, action: '修改' })
      return true
    },
    removeBinding (fieldId, sceneId) {
      const idx = this.bindings.findIndex(b => b.fieldId === fieldId && b.sceneId === sceneId)
      if (idx >= 0) {
        const b = this.bindings[idx]
        this.bindings.splice(idx, 1)
        this.changeLog.push({ fieldId, sceneId, rule: b.rule, action: '删除' })
        return true
      }
      return false
    },
    clearChanges () {
      this.changeLog = []
    },
    verifyAdminPassword (pwd) {
      return pwd === this.adminPassword
    },
    findFieldInfo (fieldId) {
      return findField(tableTree, fieldId)
    },
    findSceneInfo (sceneId) {
      return sceneNodes.find(s => s.id === sceneId)
    }
  }
})