import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Employee, Shift, Schedule } from '../../models';
import { ShiftDialogComponent } from '../shift-dialog/shift-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'shift-calendar',
  templateUrl: './shift-calendar.component.html',
  styleUrls: ['./shift-calendar.component.scss']
})
export class ShiftCalendarComponent implements OnInit {
  @Input() employees: Employee[] = [];
  @Input() shifts: Shift[] = [];
  @Input() schedules: Schedule[] = [];
  @Input() weekDays: Date[] = [];
  @Input() slideDirection = '';

  @Output() addSchedule = new EventEmitter<Schedule>();
  @Output() updateSchedule = new EventEmitter<Schedule>();
  @Output() deleteSchedule = new EventEmitter<number>();

  @ViewChild('calendarContainer') calendarContainer!: ElementRef;

  draggingShift: { schedule: Schedule; startX: number; startY: number; startDay: number; startEmployee: number } | null = null;
  dragOverDay: number | null = null;
  dragOverEmployee: number | null = null;

  private snapThreshold = 10;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  getSchedulesForDay(day: Date): Schedule[] {
    const dateStr = day.toISOString().split('T')[0];
    return this.schedules.filter(s => s.date === dateStr);
  }

  getSchedulesForEmployee(employeeId: number): Schedule[] {
    return this.schedules.filter(s => s.employeeId === employeeId);
  }

  getScheduleAtPosition(employeeId: number, day: Date): Schedule | undefined {
    const dateStr = day.toISOString().split('T')[0];
    return this.schedules.find(s => s.employeeId === employeeId && s.date === dateStr);
  }

  getShiftById(shiftId: number): Shift | undefined {
    return this.shifts.find(s => s.id === shiftId);
  }

  getEmployeeById(employeeId: number): Employee | undefined {
    return this.employees.find(e => e.id === employeeId);
  }

  isEmptySchedule(employeeId: number, day: Date): boolean {
    return !this.getScheduleAtPosition(employeeId, day);
  }

  hasViolation(schedule: Schedule): boolean {
    return schedule.violations && schedule.violations.length > 0;
  }

  getViolationClass(schedule: Schedule): string {
    if (!schedule.violations || schedule.violations.length === 0) return '';
    const hasError = schedule.violations.some(v => v.severity === 'error');
    return hasError ? 'animate-pulse-red' : '';
  }

  isOverlap(schedule: Schedule): boolean {
    return schedule.violations?.some(v => v.type === 'overlap') || false;
  }

  isCrossDay(schedule: Schedule): boolean {
    const shift = this.getShiftById(schedule.shiftId);
    return shift ? shift.isNightShift : false;
  }

  onDragStart(event: DragEvent, schedule: Schedule, dayIndex: number, employeeIndex: number): void {
    if (!event.dataTransfer) return;
    
    event.dataTransfer.setData('text/plain', JSON.stringify(schedule));
    event.dataTransfer.effectAllowed = 'move';
    
    this.draggingShift = {
      schedule: { ...schedule },
      startX: event.clientX,
      startY: event.clientY,
      startDay: dayIndex,
      startEmployee: employeeIndex
    };
  }

  onDragEnd(): void {
    this.draggingShift = null;
    this.dragOverDay = null;
    this.dragOverEmployee = null;
  }

  onDragOver(event: DragEvent, dayIndex: number, employeeIndex: number): void {
    event.preventDefault();
    if (!event.dataTransfer) return;
    event.dataTransfer.dropEffect = 'move';
    
    this.dragOverDay = dayIndex;
    this.dragOverEmployee = employeeIndex;
  }

  onDragLeave(): void {
    this.dragOverDay = null;
    this.dragOverEmployee = null;
  }

  onDrop(event: DragEvent, dayIndex: number, employeeIndex: number): void {
    event.preventDefault();
    if (!event.dataTransfer || !this.draggingShift) return;

    const droppedSchedule = this.draggingShift.schedule;
    const targetDay = this.weekDays[dayIndex];
    const targetEmployee = this.employees[employeeIndex];

    if (targetEmployee) {
      const snappedDayIndex = this.snapToNearestDay(event.clientX, dayIndex);
      const snappedDay = this.weekDays[snappedDayIndex];
      
      const updatedSchedule: Schedule = {
        ...droppedSchedule,
        employeeId: targetEmployee.id,
        date: snappedDay.toISOString().split('T')[0]
      };

      this.updateSchedule.emit(updatedSchedule);
    }

    this.draggingShift = null;
    this.dragOverDay = null;
    this.dragOverEmployee = null;
  }

  snapToNearestDay(clientX: number, currentDay: number): number {
    if (!this.calendarContainer) return currentDay;
    
    const container = this.calendarContainer.nativeElement;
    const dayWidth = container.offsetWidth / 7;
    const relativeX = clientX - container.getBoundingClientRect().left;
    const snappedIndex = Math.round(relativeX / dayWidth);
    
    return Math.max(0, Math.min(6, snappedIndex));
  }

  onEmptyCellClick(day: Date, employeeId: number): void {
    const dialogRef = this.dialog.open(ShiftDialogComponent, {
      width: '400px',
      data: {
        shifts: this.shifts,
        selectedDate: day,
        selectedEmployeeId: employeeId,
        schedule: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newSchedule: Schedule = {
          id: 0,
          employeeId: employeeId,
          shiftId: result.shiftId,
          date: day.toISOString().split('T')[0],
          violations: []
        };
        this.addSchedule.emit(newSchedule);
      }
    });
  }

  onShiftClick(schedule: Schedule): void {
    if (this.draggingShift) {
      return;
    }
    
    const dialogRef = this.dialog.open(ShiftDialogComponent, {
      width: '400px',
      data: {
        shifts: this.shifts,
        selectedDate: new Date(schedule.date),
        selectedEmployeeId: schedule.employeeId,
        schedule: schedule
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedSchedule: Schedule = {
          ...schedule,
          shiftId: result.shiftId,
          date: result.date
        };
        this.updateSchedule.emit(updatedSchedule);
      }
    });
  }

  onDeleteSchedule(id: number): void {
    if (confirm('确定要删除这个排班吗？')) {
      this.deleteSchedule.emit(id);
    }
  }

  getDayName(day: Date): string {
    const names = ['日', '一', '二', '三', '四', '五', '六'];
    return names[day.getDay()];
  }

  getDateLabel(day: Date): string {
    return `${day.getMonth() + 1}/${day.getDate()}`;
  }

  getSlideAnimationClass(): string {
    if (this.slideDirection === 'left') return 'animate-slide-left';
    if (this.slideDirection === 'right') return 'animate-slide-right';
    return '';
  }
}