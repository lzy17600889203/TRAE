export const conflictRules = [
  {
    id: 'delete-without-edit',
    detect: (row) => row.delete === true && row.edit === false,
    message: '无法在禁止修改时开放删除：删除操作依赖修改权限才能合理生效',
    cells: [{ action: 'delete' }, { action: 'edit' }],
  },
  {
    id: 'approve-without-view',
    detect: (row) => row.approve === true && row.view === false,
    message: '无法在禁止查看时开放审批：审批前必须能查看内容',
    cells: [{ action: 'approve' }, { action: 'view' }],
  },
  {
    id: 'export-without-view',
    detect: (row) => row.export === true && row.view === false,
    message: '无法在禁止查看时开放导出：导出需要先有查看权限',
    cells: [{ action: 'export' }, { action: 'view' }],
  },
  {
    id: 'edit-without-view',
    detect: (row) => row.edit === true && row.view === false,
    message: '无法在禁止查看时开放修改：修改前必须能查看内容',
    cells: [{ action: 'edit' }, { action: 'view' }],
  },
]

export function detectConflicts(matrixRow) {
  const active = []
  for (const rule of conflictRules) {
    if (rule.detect(matrixRow || {})) {
      active.push({ ruleId: rule.id, message: rule.message, cells: rule.cells })
    }
  }
  return active
}

export function buildMatrixChangeDiff(currentMatrix, originalMatrix, menuNodes, actionTypes) {
  const changes = []
  const byId = Object.fromEntries(menuNodes.map((n) => [n.id, n]))
  const actionLabel = Object.fromEntries(actionTypes.map((a) => [a.key, a.label]))

  const allKeys = new Set([...Object.keys(originalMatrix || {}), ...Object.keys(currentMatrix || {})])
  for (const menuKey of allKeys) {
    const current = currentMatrix[menuKey] || {}
    const original = originalMatrix[menuKey] || {}
    const node = byId[menuKey]
    for (const action of actionTypes.map((a) => a.key)) {
      const cur = !!current[action]
      const orig = !!original[action]
      if (cur !== orig) {
        const conflicts = detectConflicts(current)
        changes.push({
          key: `${menuKey}::${action}`,
          menuKey,
          action,
          menuTitle: node ? `${node.parentTitle ? node.parentTitle + ' / ' : ''}${node.title}` : menuKey,
          actionLabel: actionLabel[action],
          changeType: orig === false && cur === true ? 'added' : 'removed',
          oldValue: orig,
          newValue: cur,
          conflict: conflicts.length > 0 ? { message: conflicts[0].message } : null,
        })
      }
    }
  }
  return changes
}
