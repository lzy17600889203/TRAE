export interface Employee {
  id: number;
  name: string;
  avatar: string;
  department: string;
  maxConsecutiveDays: number;
  maxDailyHours: number;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  isNightShift: boolean;
}

export interface Schedule {
  id: number;
  employeeId: number;
  shiftId: number;
  date: string;
  violations: Violation[];
}

export interface Violation {
  type: 'consecutive' | 'overlap' | 'hours' | 'crossDay';
  message: string;
  severity: 'warning' | 'error';
}

export interface SceneData {
  employees: Employee[];
  shifts: Shift[];
  schedules: Schedule[];
}

export interface RuleCheckResult {
  isValid: boolean;
  violations: Violation[];
}

export const SHIFT_TYPES = {
  MORNING: { name: '早班', start: '08:00', end: '16:00', color: '#3b82f6', isNight: false },
  AFTERNOON: { name: '中班', start: '16:00', end: '24:00', color: '#8b5cf6', isNight: false },
  NIGHT: { name: '晚班', start: '22:00', end: '06:00', color: '#1f2937', isNight: true }
};