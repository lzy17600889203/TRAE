const db = require('../database/db');

function checkAllRules(schedule) {
  const violations = [];
  
  violations.push(...checkConsecutiveDays(schedule));
  violations.push(...checkOverlap(schedule));
  violations.push(...checkDailyHours(schedule));
  violations.push(...checkCrossDay(schedule));
  
  return violations;
}

function checkConsecutiveDays(schedule) {
  const violations = [];
  
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(schedule.employeeId) || { maxConsecutiveDays: 5 };
  
  const schedules = db.prepare(
    'SELECT date FROM schedules WHERE employeeId = ? ORDER BY date'
  ).all(schedule.employeeId);
  
  const dates = schedules.map(s => s.date).sort();
  let consecutiveCount = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      consecutiveCount++;
      if (consecutiveCount > employee.maxConsecutiveDays) {
        violations.push({
          type: 'consecutive',
          message: `连续工作${consecutiveCount}天，超过最大连续工作天数${employee.maxConsecutiveDays}天`,
          severity: 'error'
        });
      }
    } else {
      consecutiveCount = 1;
    }
  }
  
  return violations;
}

function checkOverlap(schedule) {
  const violations = [];
  
  const sameDaySchedules = db.prepare(
    'SELECT * FROM schedules WHERE employeeId = ? AND date = ? AND id != ?'
  ).all(schedule.employeeId, schedule.date, schedule.id || 0);
  
  if (sameDaySchedules.length > 0) {
    violations.push({
      type: 'overlap',
      message: `与${sameDaySchedules.length}个班次时间重叠`,
      severity: 'error'
    });
  }
  
  return violations;
}

function checkDailyHours(schedule) {
  const violations = [];
  
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(schedule.employeeId) || { maxDailyHours: 8 };
  
  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(schedule.shiftId);
  
  if (!shift) return violations;
  
  const [startHour, startMin] = shift.startTime.split(':').map(Number);
  const [endHour, endMin] = shift.endTime.split(':').map(Number);
  
  let hours = 0;
  if (endHour > startHour || (endHour === startHour && endMin > startMin)) {
    hours = (endHour - startHour) + (endMin - startMin) / 60;
  } else {
    hours = (24 - startHour + endHour) + (endMin - startMin) / 60;
  }
  
  if (hours > employee.maxDailyHours) {
    violations.push({
      type: 'hours',
      message: `工作${hours.toFixed(1)}小时，超过每日最大${employee.maxDailyHours}小时`,
      severity: 'error'
    });
  }
  
  const sameDaySchedules = db.prepare(
    'SELECT shiftId FROM schedules WHERE employeeId = ? AND date = ?'
  ).all(schedule.employeeId, schedule.date);
  
  if (sameDaySchedules.length > 1) {
    violations.push({
      type: 'hours',
      message: `当日有${sameDaySchedules.length}个班次，可能超过每日工作时长限制`,
      severity: 'warning'
    });
  }
  
  return violations;
}

function checkCrossDay(schedule) {
  const violations = [];
  
  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(schedule.shiftId);
  
  if (!shift) return violations;
  
  if (shift.isNightShift) {
    violations.push({
      type: 'crossDay',
      message: '跨天班次，注意休息时间',
      severity: 'warning'
    });
  }
  
  return violations;
}

module.exports = {
  checkAllRules,
  checkConsecutiveDays,
  checkOverlap,
  checkDailyHours,
  checkCrossDay
};
