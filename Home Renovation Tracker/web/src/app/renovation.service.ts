import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Scenario {
  id: number;
  key: string;
  name: string;
  description: string;
}

export interface Stage {
  id: number;
  scenario_id: number;
  name: string;
  planned_amount: number;
  actual_amount: number;
  progress: number;
  status: string;
  order_index: number;
  notes: string;
}

export interface Expense {
  id: number;
  stage_id: number;
  item_name: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
  quantity: number;
  unit: string;
  paid: number;
  refunded: number;
  supplier: string;
  notes: string;
}

export interface ScenarioDetail {
  scenario: Scenario;
  stages: Stage[];
  expenses: Expense[];
}

@Injectable({ providedIn: 'root' })
export class RenovationService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  listScenarios(): Promise<Scenario[]> {
    return firstValueFrom(this.http.get<Scenario[]>(`${this.base}/scenarios`));
  }

  getScenario(key: string): Promise<ScenarioDetail> {
    return firstValueFrom(this.http.get<ScenarioDetail>(`${this.base}/scenarios/${key}`));
  }

  reseed(): Promise<any> {
    return firstValueFrom(this.http.post(`${this.base}/seed`, {}));
  }

  addStage(scenarioKey: string, payload: any): Promise<any> {
    return firstValueFrom(this.http.post(`${this.base}/scenarios/${scenarioKey}/stages`, payload));
  }

  updateStage(id: number, payload: any): Promise<any> {
    return firstValueFrom(this.http.put(`${this.base}/stages/${id}`, payload));
  }

  deleteStage(id: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.base}/stages/${id}`));
  }

  addExpense(stageId: number, payload: any): Promise<any> {
    return firstValueFrom(this.http.post(`${this.base}/stages/${stageId}/expenses`, payload));
  }

  updateExpense(id: number, payload: any): Promise<any> {
    return firstValueFrom(this.http.put(`${this.base}/expenses/${id}`, payload));
  }

  deleteExpense(id: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.base}/expenses/${id}`));
  }
}
