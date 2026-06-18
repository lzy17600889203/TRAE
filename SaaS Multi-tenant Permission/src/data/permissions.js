import { reactive, computed } from 'vue'

export const actionTypes = [
  { key: 'view', label: '查看', color: 'primary' },
  { key: 'edit', label: '修改', color: 'warning' },
  { key: 'delete', label: '删除', color: 'danger' },
  { key: 'export', label: '导出', color: 'success' },
  { key: 'approve', label: '审批', color: 'info' },
]

export const menuTree = [
  {
    id: 'system',
    title: '系统管理',
    icon: 'Setting',
    children: [
      { id: 'system.user', title: '用户管理', children: [] },
      { id: 'system.role', title: '角色管理', children: [] },
      { id: 'system.dict', title: '字典管理', children: [] },
    ],
  },
  {
    id: 'business',
    title: '业务运营',
    icon: 'TrendCharts',
    children: [
      { id: 'business.order', title: '订单管理', children: [] },
      { id: 'business.customer', title: '客户管理', children: [] },
      { id: 'business.product', title: '商品管理', children: [] },
    ],
  },
  {
    id: 'finance',
    title: '财务中心',
    icon: 'Money',
    children: [
      { id: 'finance.bill', title: '账单管理', children: [] },
      { id: 'finance.receipt', title: '收款管理', children: [] },
      { id: 'finance.report', title: '财务报表', children: [] },
    ],
  },
  {
    id: 'data',
    title: '数据分析',
    icon: 'DataAnalysis',
    children: [
      { id: 'data.dashboard', title: '仪表盘', children: [] },
      { id: 'data.report', title: '报表中心', children: [] },
    ],
  },
]

const defaultRoleList = [
  { id: 'admin', name: '超级管理员', tenant: 'Acme Corp', description: '拥有全部模块的最高权限' },
  { id: 'operator', name: '运营人员', tenant: 'Acme Corp', description: '负责业务运营与订单处理' },
  { id: 'finance', name: '财务人员', tenant: 'Globex Inc', description: '负责账单、收款与财务报表' },
  { id: 'support', name: '客服人员', tenant: 'Initech LLC', description: '负责客户咨询与工单跟进' },
]

function buildEmptyMatrix() {
  return Object.fromEntries(
    flattenMenu(menuTree).map((m) => [
      m.id,
      Object.fromEntries(actionTypes.map((a) => [a.key, false])),
    ]),
  )
}

function buildInitialMatrix() {
  const viewOnly = (menuKey, extra = {}) => {
    const base = Object.fromEntries(actionTypes.map((a) => [a.key, false]))
    base.view = true
    return { ...base, ...extra }
  }

  return {
    admin: {
      'system.user': { view: true, edit: true, delete: true, export: true, approve: true },
      'system.role': { view: true, edit: true, delete: true, export: true, approve: true },
      'system.dict': { view: true, edit: true, delete: false, export: true, approve: false },
      'business.order': { view: true, edit: true, delete: true, export: true, approve: true },
      'business.customer': { view: true, edit: true, delete: false, export: true, approve: false },
      'business.product': { view: true, edit: true, delete: true, export: true, approve: false },
      'finance.bill': { view: true, edit: true, delete: false, export: true, approve: true },
      'finance.receipt': { view: true, edit: true, delete: false, export: true, approve: true },
      'finance.report': { view: true, edit: false, delete: false, export: true, approve: false },
      'data.dashboard': { view: true, edit: false, delete: false, export: true, approve: false },
      'data.report': { view: true, edit: false, delete: false, export: true, approve: false },
    },
    operator: {
      ...buildEmptyMatrix(),
      'system.user': viewOnly('system.user'),
      'system.dict': viewOnly('system.dict'),
      'business.order': { view: true, edit: true, delete: false, export: true, approve: true },
      'business.customer': { view: true, edit: true, delete: false, export: true, approve: false },
      'business.product': { view: true, edit: true, delete: false, export: true, approve: false },
      'data.dashboard': viewOnly('data.dashboard'),
      'data.report': viewOnly('data.report'),
    },
    finance: {
      ...buildEmptyMatrix(),
      'business.order': { view: true, edit: false, delete: false, export: true, approve: false },
      'business.customer': { view: true, edit: false, delete: false, export: true, approve: false },
      'finance.bill': { view: true, edit: true, delete: false, export: true, approve: true },
      'finance.receipt': { view: true, edit: true, delete: false, export: true, approve: true },
      'finance.report': { view: true, edit: false, delete: false, export: true, approve: false },
      'data.dashboard': { view: true, edit: false, delete: false, export: true, approve: false },
      'data.report': { view: true, edit: false, delete: false, export: true, approve: false },
    },
    support: {
      ...buildEmptyMatrix(),
      'system.user': viewOnly('system.user'),
      'business.order': { view: true, edit: true, delete: false, export: false, approve: false },
      'business.customer': { view: true, edit: true, delete: false, export: false, approve: false },
      'business.product': viewOnly('business.product'),
      'data.dashboard': viewOnly('data.dashboard'),
    },
  }
}

export function flattenMenu(tree) {
  const result = []
  const walk = (nodes, parent = null) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        walk(node.children, node)
      } else {
        result.push({ id: node.id, title: node.title, parentTitle: parent?.title })
      }
    })
  }
  walk(tree)
  return result
}

function cloneMatrix(matrix) {
  return JSON.parse(JSON.stringify(matrix))
}

export const roleStore = reactive({
  /** 当前选中的角色 id */
  currentRoleId: 'admin',

  /** 角色列表 */
  roles: defaultRoleList.map((r) => ({ ...r })),

  /** 权限矩阵：{ [roleId]: { [menuId]: { view, edit, delete, export, approve } } } */
  matrix: buildInitialMatrix(),

  /** 已保存的"基线"权限矩阵，用于 diff 计算 */
  savedMatrix: cloneMatrix(buildInitialMatrix()),
})

export function selectRole(roleId) {
  if (roleStore.roles.some((r) => r.id === roleId)) {
    roleStore.currentRoleId = roleId
  }
}

export function getCurrentRole() {
  return roleStore.roles.find((r) => r.id === roleStore.currentRoleId) || null
}

export function addRole({ name, tenant, description }) {
  const id = `role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  roleStore.roles.push({ id, name, tenant, description: description || '' })
  roleStore.matrix[id] = buildEmptyMatrix()
  roleStore.savedMatrix[id] = cloneMatrix(roleStore.matrix[id])
  roleStore.currentRoleId = id
  return id
}

export function updateRole(roleId, patch) {
  const role = roleStore.roles.find((r) => r.id === roleId)
  if (!role) return
  Object.assign(role, patch)
}

export function removeRole(roleId) {
  const idx = roleStore.roles.findIndex((r) => r.id === roleId)
  if (idx === -1) return
  roleStore.roles.splice(idx, 1)
  delete roleStore.matrix[roleId]
  delete roleStore.savedMatrix[roleId]
  if (roleStore.currentRoleId === roleId) {
    roleStore.currentRoleId = roleStore.roles[0]?.id || ''
  }
}

export function setPermission(roleId, menuId, action, value) {
  if (!roleStore.matrix[roleId]) return
  if (!roleStore.matrix[roleId][menuId]) {
    roleStore.matrix[roleId][menuId] = Object.fromEntries(actionTypes.map((a) => [a.key, false]))
  }
  roleStore.matrix[roleId][menuId][action] = !!value
}

export function getPermission(roleId, menuId, action) {
  return !!(roleStore.matrix?.[roleId]?.[menuId]?.[action])
}

export function commitRoleMatrix(roleId) {
  if (!roleStore.matrix[roleId]) return
  roleStore.savedMatrix[roleId] = cloneMatrix(roleStore.matrix[roleId])
}

export function resetRoleToSaved(roleId) {
  if (!roleStore.savedMatrix[roleId]) return
  roleStore.matrix[roleId] = cloneMatrix(roleStore.savedMatrix[roleId])
}

export function isRoleDirty(roleId) {
  const cur = roleStore.matrix[roleId] || {}
  const saved = roleStore.savedMatrix[roleId] || {}
  const keys = new Set([...Object.keys(cur), ...Object.keys(saved)])
  for (const menuId of keys) {
    const a = cur[menuId] || {}
    const b = saved[menuId] || {}
    for (const action of actionTypes.map((x) => x.key)) {
      if (!!a[action] !== !!b[action]) return true
    }
  }
  return false
}

export const roleSummary = computed(() => ({
  total: roleStore.roles.length,
  dirtyCount: roleStore.roles.filter((r) => isRoleDirty(r.id)).length,
}))

export function flattenMenuNodes() {
  return flattenMenu(menuTree)
}
