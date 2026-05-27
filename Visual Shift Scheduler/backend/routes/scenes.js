const db = require('../database/db');

module.exports = async function (fastify, opts) {
  fastify.post('/scenes/:scene', async (request, reply) => {
    const { scene } = request.params;

    db.exec('DELETE FROM schedules');
    db.exec('DELETE FROM employees');

    let employees, schedules;

    switch (scene) {
      case 'standard':
        employees = [
          { name: '张三', department: '技术部', maxConsecutiveDays: 5, maxDailyHours: 8 },
          { name: '李四', department: '技术部', maxConsecutiveDays: 5, maxDailyHours: 8 },
          { name: '王五', department: '运营部', maxConsecutiveDays: 5, maxDailyHours: 8 },
          { name: '赵六', department: '运营部', maxConsecutiveDays: 5, maxDailyHours: 8 },
          { name: '钱七', department: '技术部', maxConsecutiveDays: 5, maxDailyHours: 8 }
        ];
        schedules = generateStandardSchedule();
        break;

      case 'shortage':
        employees = [
          { name: '张三', department: '技术部', maxConsecutiveDays: 7, maxDailyHours: 12 },
          { name: '李四', department: '技术部', maxConsecutiveDays: 7, maxDailyHours: 12 }
        ];
        schedules = generateShortageSchedule();
        break;

      case 'overtime':
        employees = [
          { name: '张三', department: '技术部', maxConsecutiveDays: 3, maxDailyHours: 8 },
          { name: '李四', department: '技术部', maxConsecutiveDays: 5, maxDailyHours: 8 },
          { name: '王五', department: '运营部', maxConsecutiveDays: 5, maxDailyHours: 8 }
        ];
        schedules = generateOvertimeSchedule();
        break;

      case 'conflict':
        employees = [
          { name: '张三', department: '技术部', maxConsecutiveDays: 5, maxDailyHours: 8 },
          { name: '李四', department: '技术部', maxConsecutiveDays: 5, maxDailyHours: 8 },
          { name: '王五', department: '运营部', maxConsecutiveDays: 5, maxDailyHours: 8 }
        ];
        schedules = generateConflictSchedule();
        break;

      default:
        reply.code(404);
        return { error: '场景不存在' };
    }

    const employeeIds = [];
    const insertEmp = db.prepare(
      'INSERT INTO employees (name, department, maxConsecutiveDays, maxDailyHours) VALUES (?, ?, ?, ?)'
    );
    for (const emp of employees) {
      const info = insertEmp.run(emp.name, emp.department, emp.maxConsecutiveDays, emp.maxDailyHours);
      employeeIds.push(info.lastInsertRowid);
    }

    const insertSched = db.prepare('INSERT INTO schedules (employeeId, shiftId, date) VALUES (?, ?, ?)');
    for (const schedule of schedules) {
      const empIndex = employees.findIndex(e => e.name === schedule.employeeName);
      const employeeId = employeeIds[empIndex] || 1;
      insertSched.run(employeeId, schedule.shiftId, schedule.date);
    }

    const allEmployees = db.prepare('SELECT * FROM employees').all();
    const allShifts = db.prepare('SELECT * FROM shifts').all();
    const allSchedules = db.prepare('SELECT * FROM schedules').all();

    return { employees: allEmployees, shifts: allShifts, schedules: allSchedules };
  });
};

function generateStandardSchedule() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  
  const schedules = [];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  days.forEach((_, dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    const dateStr = date.toISOString().split('T')[0];
    
    if (dayIndex < 5) {
      schedules.push(
        { employeeName: '张三', shiftId: 1, date: dateStr },
        { employeeName: '李四', shiftId: 2, date: dateStr },
        { employeeName: '王五', shiftId: 1, date: dateStr },
        { employeeName: '赵六', shiftId: 2, date: dateStr }
      );
    } else {
      schedules.push(
        { employeeName: '钱七', shiftId: 1, date: dateStr },
        { employeeName: '张三', shiftId: 3, date: dateStr }
      );
    }
  });
  
  return schedules;
}

function generateShortageSchedule() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  
  const schedules = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    schedules.push(
      { employeeName: '张三', shiftId: 1, date: dateStr },
      { employeeName: '张三', shiftId: 2, date: dateStr },
      { employeeName: '李四', shiftId: 1, date: dateStr },
      { employeeName: '李四', shiftId: 3, date: dateStr }
    );
  }
  
  return schedules;
}

function generateOvertimeSchedule() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  
  const schedules = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    schedules.push(
      { employeeName: '张三', shiftId: 1, date: dateStr },
      { employeeName: '李四', shiftId: 1, date: dateStr },
      { employeeName: '王五', shiftId: 1, date: dateStr }
    );
    
    if (i > 0) {
      schedules.push({ employeeName: '张三', shiftId: 3, date: dateStr });
    }
  }
  
  return schedules;
}

function generateConflictSchedule() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  
  const schedules = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    schedules.push(
      { employeeName: '张三', shiftId: 1, date: dateStr },
      { employeeName: '李四', shiftId: 2, date: dateStr }
    );
  }
  
  const wednesday = new Date(weekStart);
  wednesday.setDate(weekStart.getDate() + 2);
  const wednesdayStr = wednesday.toISOString().split('T')[0];
  
  schedules.push(
    { employeeName: '张三', shiftId: 2, date: wednesdayStr },
    { employeeName: '王五', shiftId: 1, date: wednesdayStr },
    { employeeName: '王五', shiftId: 2, date: wednesdayStr }
  );
  
  return schedules;
}
