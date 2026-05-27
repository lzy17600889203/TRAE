import { Component, OnInit } from '@angular/core';
import { ShiftService } from './services/shift.service';
import { Employee, Shift, Schedule } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = '员工周排班管理工具';
  employees: Employee[] = [];
  shifts: Shift[] = [];
  schedules: Schedule[] = [];
  currentWeekStart: Date = this.getWeekStart(new Date());
  showSuccess = false;
  slideDirection = '';

  constructor(private shiftService: ShiftService) {}

  ngOnInit(): void {
    this.loadData();
  }

  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  async loadData(): Promise<void> {
    try {
      this.employees = await this.shiftService.getEmployees().toPromise() || [];
      this.shifts = await this.shiftService.getShifts().toPromise() || [];
      this.schedules = await this.shiftService.getSchedules(this.currentWeekStart).toPromise() || [];
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }

  prevWeek(): void {
    this.slideDirection = 'left';
    const newStart = new Date(this.currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    this.currentWeekStart = newStart;
    setTimeout(() => {
      this.loadWeekData();
      this.slideDirection = '';
    }, 300);
  }

  nextWeek(): void {
    this.slideDirection = 'right';
    const newStart = new Date(this.currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    this.currentWeekStart = newStart;
    setTimeout(() => {
      this.loadWeekData();
      this.slideDirection = '';
    }, 300);
  }

  async loadWeekData(): Promise<void> {
    try {
      this.schedules = await this.shiftService.getSchedules(this.currentWeekStart).toPromise() || [];
    } catch (error) {
      console.error('加载排班数据失败:', error);
    }
  }

  async loadScene(scene: string): Promise<void> {
    try {
      await this.shiftService.loadScene(scene).toPromise();
      await this.loadData();
      this.showSuccessNotification();
    } catch (error) {
      console.error('加载场景失败:', error);
    }
  }

  async addEmployee(employee: Employee): Promise<void> {
    try {
      await this.shiftService.createEmployee(employee).toPromise();
      await this.loadData();
      this.showSuccessNotification();
    } catch (error) {
      console.error('添加员工失败:', error);
    }
  }

  async updateEmployee(employee: Employee): Promise<void> {
    try {
      await this.shiftService.updateEmployee(employee).toPromise();
      await this.loadData();
      this.showSuccessNotification();
    } catch (error) {
      console.error('更新员工失败:', error);
    }
  }

  async deleteEmployee(id: number): Promise<void> {
    try {
      await this.shiftService.deleteEmployee(id).toPromise();
      await this.loadData();
      this.showSuccessNotification();
    } catch (error) {
      console.error('删除员工失败:', error);
    }
  }

  async addSchedule(schedule: Schedule): Promise<void> {
    try {
      await this.shiftService.createSchedule(schedule).toPromise();
      await this.loadData();
      this.showSuccessNotification();
    } catch (error) {
      console.error('添加排班失败:', error);
    }
  }

  async updateSchedule(schedule: Schedule): Promise<void> {
    try {
      await this.shiftService.updateSchedule(schedule).toPromise();
      await this.loadData();
      this.showSuccessNotification();
    } catch (error) {
      console.error('更新排班失败:', error);
    }
  }

  async deleteSchedule(id: number): Promise<void> {
    try {
      await this.shiftService.deleteSchedule(id).toPromise();
      await this.loadData();
      this.showSuccessNotification();
    } catch (error) {
      console.error('删除排班失败:', error);
    }
  }

  showSuccessNotification(): void {
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
    }, 2000);
  }

  getWeekDays(): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(this.currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }

  getWeekLabel(): string {
    const end = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${this.currentWeekStart.getMonth() + 1}/${this.currentWeekStart.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  }
}