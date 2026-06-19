// 模拟客户数据：跟进卡片 + 阶段分布
// today = 2026-06-19（系统日期）
const today = new Date()

function daysAgo(d) {
  const t = new Date(today)
  t.setDate(t.getDate() - d)
  return t
}
function daysLater(d) {
  const t = new Date(today)
  t.setDate(t.getDate() + d)
  return t
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

// 漏斗阶段
export const funnelStages = [
  { key: 'lead', name: '线索', count: 120 },
  { key: 'contact', name: '初步接触', count: 86 },
  { key: 'proposal', name: '方案沟通', count: 54 },
  { key: 'negotiate', name: '商务谈判', count: 32 },
  { key: 'deal', name: '成交', count: 18 }
]

// 每个阶段下的示例客户（用于 hover 弹出）
export const stageCustomers = {
  lead: ['云端科技', '蓝海数据', '新视野咨询', '智联工业', '启航教育', '星光传媒'],
  contact: ['云端科技', '蓝海数据', '新视野咨询', '智联工业', '启航教育'],
  proposal: ['云端科技', '蓝海数据', '智联工业', '启航教育'],
  negotiate: ['云端科技', '智联工业', '启航教育'],
  deal: ['云端科技', '智联工业']
}

// 今日待跟进的客户列表
export const customers = [
  {
    id: 1,
    name: '云端科技有限公司',
    short: '云',
    stage: 'negotiate',
    lastFollow: daysAgo(2),
    nextFollow: today, // 今天需要跟进
    operator: '张三',
    records: [
      {
        time: daysAgo(2),
        user: '张三',
        text: '与客户 CTO 沟通了核心功能清单，对方希望下周三给出报价单。',
        files: []
      },
      {
        time: daysAgo(5),
        user: '张三',
        text: '发送了初步方案 PPT，客户反馈整体满意，但对价格比较敏感。',
        files: [{ name: '方案_v1.pptx', size: '2.1 MB' }]
      }
    ]
  },
  {
    id: 2,
    name: '蓝海数据服务',
    short: '蓝',
    stage: 'proposal',
    lastFollow: daysAgo(1),
    nextFollow: today,
    operator: '李四',
    records: [
      {
        time: daysAgo(1),
        user: '李四',
        text: '客户希望看到 SaaS 版本的演示，约好今天下午线上演示。',
        files: []
      }
    ]
  },
  {
    id: 3,
    name: '智联工业集团',
    short: '智',
    stage: 'deal',
    lastFollow: daysAgo(3),
    nextFollow: daysLater(1),
    operator: '王五',
    records: [
      {
        time: daysAgo(3),
        user: '王五',
        text: '合同进入法务审核，预计 2 个工作日内可回签。',
        files: [{ name: '合同草稿.pdf', size: '850 KB' }]
      }
    ]
  },
  {
    id: 4,
    name: '启航教育咨询',
    short: '启',
    stage: 'contact',
    lastFollow: daysAgo(0),
    nextFollow: daysLater(3),
    operator: '赵六',
    records: [
      {
        time: daysAgo(0),
        user: '赵六',
        text: '初次电话沟通，客户有意向约线下会面。',
        files: []
      }
    ]
  },
  {
    id: 5,
    name: '新视野咨询事务所',
    short: '新',
    stage: 'lead',
    lastFollow: daysAgo(4),
    nextFollow: today,
    operator: '孙七',
    records: [
      {
        time: daysAgo(4),
        user: '孙七',
        text: '通过官网表单留资，已发送公司介绍邮件。',
        files: []
      }
    ]
  }
]

export function isNeedFollowToday(c) {
  const n = c.nextFollow
  return (
    n.getFullYear() === today.getFullYear() &&
    n.getMonth() === today.getMonth() &&
    n.getDate() === today.getDate()
  )
}

export { formatDate }
