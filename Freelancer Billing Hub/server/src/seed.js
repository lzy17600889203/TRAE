import db from './db.js';

const scenariosMeta = [
  { key: 'big-monthly',       title: '大客户按月结算',         description: '稳定的大客户，每月月底按小时数结算。' },
  { key: 'small-flat',        title: '小客户按件计费',         description: '小项目采用固定价格按件计费。' },
  { key: 'overtime-crazy',    title: '连续加班疯狂爆肝',       description: '连续多日高强度加班，单日工时高。' },
  { key: 'overdue-half-year', title: '客户拖欠尾款半年',       description: '多张账单长期未付状态的案例。' },
  { key: 'timezone-mistake',  title: '跨时区项目时间算错',     description: '跨时区项目导致日期/工时录入偏差场景。' }
];

function upsertScenario(meta) {
  const existing = db.prepare('SELECT id FROM scenarios WHERE key = ?').get(meta.key);
  if (existing) return existing.id;
  return db.prepare('INSERT INTO scenarios (key, title, description) VALUES (?, ?, ?)')
    .run(meta.key, meta.title, meta.description).lastInsertRowid;
}

function truncateAll() {
  db.prepare('DELETE FROM time_entries').run();
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM projects').run();
  db.prepare('DELETE FROM clients').run();
}

function seedScenarioBigMonthly() {
  const clientId = db.prepare('INSERT INTO clients (name, contact) VALUES (?, ?)')
    .run('星辰科技集团', '王经理 / stars@example.com').lastInsertRowid;
  const projectId = db.prepare('INSERT INTO projects (client_id, name, rate, billing_mode) VALUES (?, ?, ?, ?)')
    .run(clientId, '集团官网二期重构', 400, 'hourly').lastInsertRowid;

  for (let d = 1; d <= 22; d++) {
    const hours = 7 + Math.round(Math.random() * 2); // 7-9 小时
    const date = `2025-11-${String(d).padStart(2, '0')}`;
    db.prepare('INSERT INTO time_entries (project_id, work_date, hours, description) VALUES (?, ?, ?, ?)')
      .run(projectId, date, hours, `按客户需求推进功能开发 ${d}`);
  }
  db.prepare(`INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status)
              VALUES (?, 2025, 11, 176, 70400, 'paid')`).run(projectId);
  db.prepare(`INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status)
              VALUES (?, 2025, 12, 184, 73600, 'unpaid')`).run(projectId);
}

function seedScenarioSmallFlat() {
  const clientId = db.prepare('INSERT INTO clients (name, contact) VALUES (?, ?)')
    .run('街角咖啡店', '老板小李').lastInsertRowid;
  const p1 = db.prepare('INSERT INTO projects (client_id, name, rate, billing_mode) VALUES (?, ?, ?, ?)')
    .run(clientId, '小程序点单系统', 8000, 'flat').lastInsertRowid;
  const p2 = db.prepare('INSERT INTO projects (client_id, name, rate, billing_mode) VALUES (?, ?, ?, ?)')
    .run(clientId, '会员管理后台', 3500, 'flat').lastInsertRowid;

  for (let d = 1; d <= 5; d++) {
    db.prepare('INSERT INTO time_entries (project_id, work_date, hours, description) VALUES (?, ?, ?, ?)')
      .run(p1, `2025-11-0${d}`, 4 + d, '小程序开发');
  }
  db.prepare('INSERT INTO time_entries (project_id, work_date, hours, description) VALUES (?, ?, ?, ?)')
    .run(p2, '2025-12-05', 3, '后台原型');

  db.prepare(`INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status)
              VALUES (?, 2025, 11, 30, 8000, 'paid')`).run(p1);
  db.prepare(`INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status)
              VALUES (?, 2025, 12, 3, 3500, 'unpaid')`).run(p2);
}

function seedScenarioOvertimeCrazy() {
  const clientId = db.prepare('INSERT INTO clients (name, contact) VALUES (?, ?)')
    .run('紧急上线项目组', '加班狂魔 PM').lastInsertRowid;
  const projectId = db.prepare('INSERT INTO projects (client_id, name, rate, billing_mode) VALUES (?, ?, ?, ?)')
    .run(clientId, '双11大促活动页面', 600, 'hourly').lastInsertRowid;

  for (let d = 1; d <= 7; d++) {
    const hours = 12 + d; // 13~19 小时爆肝
    db.prepare('INSERT INTO time_entries (project_id, work_date, hours, description) VALUES (?, ?, ?, ?)')
      .run(projectId, `2025-11-0${d}`, hours, `双11冲刺第 ${d} 天`);
  }
  db.prepare(`INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status)
              VALUES (?, 2025, 11, 112, 67200, 'unpaid')`).run(projectId);
}

function seedScenarioOverdueHalfYear() {
  const clientId = db.prepare('INSERT INTO clients (name, contact) VALUES (?, ?)')
    .run('老牌设计公司（赖账王）', '张总 / 已失联').lastInsertRowid;
  const projectId = db.prepare('INSERT INTO projects (client_id, name, rate, billing_mode) VALUES (?, ?, ?, ?)')
    .run(clientId, '品牌官网改版', 350, 'hourly').lastInsertRowid;

  // 2025 年 3~8 月每月都有账单，均未付款
  for (let m = 3; m <= 8; m++) {
    const hours = 80 + m * 5;
    const amount = hours * 350;
    db.prepare(`INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status, note)
                VALUES (?, 2025, ?, ?, ?, 'unpaid', '客户已失联，已逾期半年以上')`)
      .run(projectId, m, hours, amount);
    for (let d = 1; d <= 5; d++) {
      db.prepare('INSERT INTO time_entries (project_id, work_date, hours, description) VALUES (?, ?, ?, ?)')
        .run(projectId, `2025-${String(m).padStart(2, '0')}-0${d}`, 4 + d, '历史工作记录');
    }
  }
}

function seedScenarioTimezoneMistake() {
  const clientId = db.prepare('INSERT INTO clients (name, contact) VALUES (?, ?)')
    .run('纽约海外客户', '跨时区协作 client').lastInsertRowid;
  const projectId = db.prepare('INSERT INTO projects (client_id, name, rate, billing_mode) VALUES (?, ?, ?, ?)')
    .run(clientId, '海外数据可视化项目', 500, 'hourly').lastInsertRowid;

  // 模拟跨时区导致的日期偏差：同一天被多次录入 / 日期错位
  const mistaken = [
    { date: '2025-11-10', hours: 8,  desc: '按北京时间记录，实际应为 11-09（纽约时差）' },
    { date: '2025-11-10', hours: 6,  desc: '纽约时间 11-10 又记了一条，导致同一天两条' },
    { date: '2025-11-11', hours: 10, desc: '正常工作' },
    { date: '2025-11-12', hours: 2,  desc: '沟通导致工时偏低' },
    { date: '2025-11-13', hours: 25, desc: '错误录入 25 小时（已被后端修正为 24）' }
  ];
  mistaken.forEach(r => {
    const safe = Math.max(0, Math.min(24, r.hours));
    db.prepare('INSERT INTO time_entries (project_id, work_date, hours, description) VALUES (?, ?, ?, ?)')
      .run(projectId, r.date, safe, r.desc);
  });
  db.prepare(`INSERT INTO invoices (project_id, year, month, total_hours, total_amount, status, note)
              VALUES (?, 2025, 11, 50, 25000, 'unpaid', '跨时区导致日期重复，需人工核对')`).run(projectId);
}

const scenarioMap = {
  'big-monthly':       seedScenarioBigMonthly,
  'small-flat':        seedScenarioSmallFlat,
  'overtime-crazy':    seedScenarioOvertimeCrazy,
  'overdue-half-year': seedScenarioOverdueHalfYear,
  'timezone-mistake':  seedScenarioTimezoneMistake
};

export default function seedScenarios(key) {
  // 先写入场景元信息
  scenariosMeta.forEach(upsertScenario);

  if (key === null) {
    // 首次启动或全局重置：清空数据并预置大客户场景作为默认展示
    truncateAll();
    scenariosMeta.forEach(upsertScenario);
    seedScenarioBigMonthly();
    return;
  }
  const fn = scenarioMap[key];
  if (!fn) throw new Error('未知的场景 key');
  truncateAll();
  scenariosMeta.forEach(upsertScenario);
  fn();
}
