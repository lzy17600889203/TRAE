// 模拟数据库表结构：财务 + HR 相关
export const tableTree = [
  {
    id: 'fin',
    label: 'finance_db（财务库）',
    children: [
      {
        id: 'fin_user',
        label: 't_user（用户表）',
        children: [
          { id: 'fin_user_phone', label: 'phone', type: 'varchar(20)', sensitive: true, fieldName: '手机号' },
          { id: 'fin_user_email', label: 'email', type: 'varchar(64)', sensitive: true, fieldName: '邮箱' },
          { id: 'fin_user_idcard', label: 'id_card', type: 'varchar(18)', sensitive: true, fieldName: '身份证号' },
          { id: 'fin_user_name', label: 'real_name', type: 'varchar(32)', sensitive: true, fieldName: '姓名' }
        ]
      },
      {
        id: 'fin_pay',
        label: 't_payment（支付表）',
        children: [
          { id: 'fin_pay_card', label: 'bank_card', type: 'varchar(24)', sensitive: true, fieldName: '银行卡号' },
          { id: 'fin_pay_amount', label: 'amount', type: 'decimal(18,2)', sensitive: false, fieldName: '金额' }
        ]
      }
    ]
  },
  {
    id: 'hr',
    label: 'hr_db（HR库）',
    children: [
      {
        id: 'hr_emp',
        label: 't_employee（员工表）',
        children: [
          { id: 'hr_emp_phone', label: 'mobile', type: 'varchar(20)', sensitive: true, fieldName: '手机号' },
          { id: 'hr_emp_salary', label: 'salary', type: 'decimal(18,2)', sensitive: true, fieldName: '工资' },
          { id: 'hr_emp_dept', label: 'department', type: 'varchar(32)', sensitive: false, fieldName: '部门' }
        ]
      }
    ]
  }
]

// 脱敏规则字典
export const maskingRules = [
  { key: 'mask', label: '掩码（Mask）', desc: '保留部分字符，其余用*替代，如 138****1234' },
  { key: 'hash', label: '哈希（Hash）', desc: '单向不可逆哈希，适合存储比对场景' },
  { key: 'empty', label: '置空（Empty）', desc: '输出 null 或 空字符串，完全丢弃原值' },
  { key: 'none', label: '不脱敏', desc: '原始数据透传（敏感字段不推荐）' }
]

// 场景节点（X6 画布的右侧目标节点）
export const sceneNodes = [
  { id: 'scene_frontend', label: '前端展示', color: '#2563eb' },
  { id: 'scene_report', label: '数据报表', color: '#16a34a' },
  { id: 'scene_api', label: 'API 导出', color: '#db2777' },
  { id: 'scene_backup', label: '备份同步', color: '#9333ea' }
]

// 初始演示连线（变更历史）
export const initialBindings = [
  // 每个绑定: { fieldId, sceneId, rule }
  { fieldId: 'fin_user_email', sceneId: 'scene_frontend', rule: 'mask' },
  { fieldId: 'fin_user_idcard', sceneId: 'scene_frontend', rule: 'mask' },
  { fieldId: 'fin_user_phone', sceneId: 'scene_report', rule: 'hash' },
  { fieldId: 'fin_pay_card', sceneId: 'scene_api', rule: 'empty' },
  { fieldId: 'hr_emp_phone', sceneId: 'scene_frontend', rule: 'none' },
  { fieldId: 'hr_emp_salary', sceneId: 'scene_report', rule: 'hash' }
]

// 查找字段工具
export function findField (tree, fieldId) {
  for (const top of tree) {
    for (const table of top.children || []) {
      for (const field of table.children || []) {
        if (field.id === fieldId) return field
      }
    }
  }
  return null
}
