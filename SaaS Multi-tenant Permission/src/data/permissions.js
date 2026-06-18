export const roles = [
  { id: 'admin', name: '超级管理员', tenant: 'Acme Corp' },
  { id: 'operator', name: '运营人员', tenant: 'Acme Corp' },
  { id: 'finance', name: '财务人员', tenant: 'Globex Inc' },
  { id: 'support', name: '客服人员', tenant: 'Initech LLC' },
]

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

export const initialPermissionMatrix = {
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
    'system.user': { view: true, edit: false, delete: false, export: false, approve: false },
    'system.role': { view: false, edit: false, delete: false, export: false, approve: false },
    'system.dict': { view: true, edit: false, delete: false, export: false, approve: false },
    'business.order': { view: true, edit: true, delete: false, export: true, approve: true },
    'business.customer': { view: true, edit: true, delete: false, export: true, approve: false },
    'business.product': { view: true, edit: true, delete: false, export: true, approve: false },
    'finance.bill': { view: false, edit: false, delete: false, export: false, approve: false },
    'finance.receipt': { view: false, edit: false, delete: false, export: false, approve: false },
    'finance.report': { view: false, edit: false, delete: false, export: false, approve: false },
    'data.dashboard': { view: true, edit: false, delete: false, export: false, approve: false },
    'data.report': { view: true, edit: false, delete: false, export: false, approve: false },
  },
  finance: {
    'system.user': { view: false, edit: false, delete: false, export: false, approve: false },
    'system.role': { view: false, edit: false, delete: false, export: false, approve: false },
    'system.dict': { view: false, edit: false, delete: false, export: false, approve: false },
    'business.order': { view: true, edit: false, delete: false, export: true, approve: false },
    'business.customer': { view: true, edit: false, delete: false, export: true, approve: false },
    'business.product': { view: false, edit: false, delete: false, export: false, approve: false },
    'finance.bill': { view: true, edit: true, delete: false, export: true, approve: true },
    'finance.receipt': { view: true, edit: true, delete: false, export: true, approve: true },
    'finance.report': { view: true, edit: false, delete: false, export: true, approve: false },
    'data.dashboard': { view: true, edit: false, delete: false, export: true, approve: false },
    'data.report': { view: true, edit: false, delete: false, export: true, approve: false },
  },
  support: {
    'system.user': { view: true, edit: false, delete: false, export: false, approve: false },
    'system.role': { view: false, edit: false, delete: false, export: false, approve: false },
    'system.dict': { view: false, edit: false, delete: false, export: false, approve: false },
    'business.order': { view: true, edit: true, delete: false, export: false, approve: false },
    'business.customer': { view: true, edit: true, delete: false, export: false, approve: false },
    'business.product': { view: true, edit: false, delete: false, export: false, approve: false },
    'finance.bill': { view: false, edit: false, delete: false, export: false, approve: false },
    'finance.receipt': { view: false, edit: false, delete: false, export: false, approve: false },
    'finance.report': { view: false, edit: false, delete: false, export: false, approve: false },
    'data.dashboard': { view: true, edit: false, delete: false, export: false, approve: false },
    'data.report': { view: false, edit: false, delete: false, export: false, approve: false },
  },
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
