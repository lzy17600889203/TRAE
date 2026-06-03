'use strict';

const { getDb } = require('./db');

function getAllScenarios() {
  const db = getDb();
  return db.prepare('SELECT * FROM scenarios ORDER BY id ASC').all();
}

function getScenarioWithDetails(key) {
  const db = getDb();
  const scenario = db.prepare('SELECT * FROM scenarios WHERE key = ? OR id = ?').get(key, key);
  if (!scenario) return null;

  const stages = db
    .prepare('SELECT * FROM stages WHERE scenario_id = ? ORDER BY order_index ASC, id ASC')
    .all(scenario.id);

  const stageIds = stages.map((s) => s.id);
  const expenses =
    stageIds.length > 0
      ? db
          .prepare(
            `SELECT * FROM expenses WHERE stage_id IN (${stageIds.map(() => '?').join(',')}) ORDER BY id ASC`
          )
          .all(...stageIds)
      : [];

  return {
    scenario,
    stages,
    expenses
  };
}

function createEmptyScenario(name, description) {
  const db = getDb();
  const key = `custom_${Date.now()}`;
  const result = db
    .prepare('INSERT INTO scenarios (key, name, description) VALUES (?, ?, ?)')
    .run(key, name || '新建装修项目', description || '');
  return { id: result.lastInsertRowid, key };
}

function addStage(scenarioKey, payload) {
  const db = getDb();
  const scenario = db.prepare('SELECT id FROM scenarios WHERE key = ? OR id = ?').get(scenarioKey, scenarioKey);
  if (!scenario) return null;

  const { name, planned_amount = 0, status = 'active', notes = '' } = payload || {};
  const order = db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM stages WHERE scenario_id = ?').get(scenario.id).next;

  const actual = 0;
  const progress = 0;
  const result = db
    .prepare(
      'INSERT INTO stages (scenario_id, name, planned_amount, actual_amount, progress, status, order_index, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(scenario.id, name, planned_amount, actual, progress, status, order, notes);

  return { id: result.lastInsertRowid };
}

function updateStage(stageId, payload) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM stages WHERE id = ?').get(stageId);
  if (!existing) return null;

  const merged = { ...existing, ...payload };
  db.prepare(
    'UPDATE stages SET name = ?, planned_amount = ?, actual_amount = ?, progress = ?, status = ?, notes = ? WHERE id = ?'
  ).run(
    merged.name,
    merged.planned_amount,
    merged.actual_amount,
    merged.progress,
    merged.status,
    merged.notes,
    stageId
  );
  return { id: stageId };
}

function deleteStage(stageId) {
  const db = getDb();
  db.prepare('DELETE FROM stages WHERE id = ?').run(stageId);
  return { ok: true };
}

function addExpense(stageId, payload) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM stages WHERE id = ?').get(stageId);
  if (!existing) return null;

  const {
    item_name = '未命名项目',
    category = '其他',
    planned_amount = 0,
    actual_amount = 0,
    quantity = 1,
    unit = '项',
    paid = 0,
    refunded = 0,
    supplier = '',
    notes = ''
  } = payload || {};

  const result = db
    .prepare(
      'INSERT INTO expenses (stage_id, item_name, category, planned_amount, actual_amount, quantity, unit, paid, refunded, supplier, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(stageId, item_name, category, planned_amount, actual_amount, quantity, unit, paid, refunded, supplier, notes);

  recalcStage(stageId);
  return { id: result.lastInsertRowid };
}

function updateExpense(expenseId, payload) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
  if (!existing) return null;

  const merged = { ...existing, ...payload };
  db.prepare(
    'UPDATE expenses SET item_name = ?, category = ?, planned_amount = ?, actual_amount = ?, quantity = ?, unit = ?, paid = ?, refunded = ?, supplier = ?, notes = ? WHERE id = ?'
  ).run(
    merged.item_name,
    merged.category,
    merged.planned_amount,
    merged.actual_amount,
    merged.quantity,
    merged.unit,
    merged.paid,
    merged.refunded,
    merged.supplier,
    merged.notes,
    expenseId
  );

  recalcStage(merged.stage_id);
  return { id: expenseId };
}

function deleteExpense(expenseId) {
  const db = getDb();
  const existing = db.prepare('SELECT stage_id FROM expenses WHERE id = ?').get(expenseId);
  if (!existing) return { ok: false };
  db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);
  recalcStage(existing.stage_id);
  return { ok: true };
}

function recalcStage(stageId) {
  const db = getDb();
  const stats = db
    .prepare(
      'SELECT COALESCE(SUM(planned_amount),0) AS planned, COALESCE(SUM(actual_amount),0) AS actual, COUNT(*) AS cnt FROM expenses WHERE stage_id = ?'
    )
    .get(stageId);

  const planned = stats.planned || 0;
  const actual = stats.actual || 0;
  const progress = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0;

  db.prepare('UPDATE stages SET actual_amount = ?, progress = ? WHERE id = ?').run(actual, progress, stageId);
  return { planned, actual, progress };
}

module.exports = {
  getAllScenarios,
  getScenarioWithDetails,
  createEmptyScenario,
  addStage,
  updateStage,
  deleteStage,
  addExpense,
  updateExpense,
  deleteExpense,
  recalcStage
};
