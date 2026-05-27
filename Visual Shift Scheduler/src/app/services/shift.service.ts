import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, Shift, Schedule, SceneData } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`);
  }

  createEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/employees`, employee);
  }

  updateEmployee(employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${employee.id}`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/${id}`);
  }

  getShifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.baseUrl}/shifts`);
  }

  getSchedules(weekStart: Date): Observable<Schedule[]> {
    const startStr = weekStart.toISOString().split('T')[0];
    return this.http.get<Schedule[]>(`${this.baseUrl}/schedules?weekStart=${startStr}`);
  }

  createSchedule(schedule: Omit<Schedule, 'id' | 'violations'>): Observable<Schedule> {
    return this.http.post<Schedule>(`${this.baseUrl}/schedules`, schedule);
  }

  updateSchedule(schedule: Schedule): Observable<Schedule> {
    return this.http.put<Schedule>(`${this.baseUrl}/schedules/${schedule.id}`, schedule);
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/schedules/${id}`);
  }

  loadScene(scene: string): Observable<SceneData> {
    return this.http.post<SceneData>(`${this.baseUrl}/scenes/${scene}`, {});
  }

  checkRules(schedule: Schedule): Observable<{ isValid: boolean; violations: any[] }> {
    return this.http.post<{ isValid: boolean; violations: any[] }>(`${this.baseUrl}/rules/check`, schedule);
  }
}