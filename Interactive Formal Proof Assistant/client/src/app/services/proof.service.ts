import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProofStep {
  index: number;
  formula: string;
  justification: string;
  premiseRefs: string[];
}

export interface Proof {
  id: number;
  name: string;
  goal: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  steps: ProofStep[];
}

export interface StepValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  type: string | null;
  rule: string | null;
  axiom: string | null;
  unification: Record<string, string> | null;
}

export interface ProofAnalysis {
  issues: { type: string; message: string; step?: number }[];
  warnings: { type: string; message: string; step?: number }[];
}

export interface Axiom {
  id: string;
  name: string;
  formula: string;
  builtin: number;
  description: string;
}

export interface Rule {
  id: string;
  name: string;
  requires: number;
  schema: string[];
  conclusion: string;
}

export interface Scene {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  goal: string;
  steps?: ProofStep[];
}

const API = 'http://localhost:4000/api';

@Injectable({ providedIn: 'root' })
export class ProofService {
  constructor(private http: HttpClient) {}

  listProofs(): Observable<Proof[]> { return this.http.get<Proof[]>(`${API}/proofs`); }
  getProof(id: number): Observable<Proof> { return this.http.get<Proof>(`${API}/proofs/${id}`); }
  createProof(payload: { name: string; goal?: string; description?: string }): Observable<Proof> {
    return this.http.post<Proof>(`${API}/proofs`, payload);
  }
  updateProof(id: number, payload: { name: string; goal: string; description: string }): Observable<Proof> {
    return this.http.put<Proof>(`${API}/proofs/${id}`, payload);
  }
  deleteProof(id: number): Observable<any> { return this.http.delete(`${API}/proofs/${id}`); }
  saveSteps(id: number, steps: ProofStep[]): Observable<Proof> {
    return this.http.put<Proof>(`${API}/proofs/${id}/steps`, { steps });
  }
  validateStep(step: ProofStep, proof: Proof, checkProof = false): Observable<{ step: StepValidation; analysis: ProofAnalysis | null }> {
    return this.http.post<any>(`${API}/validate-step`, { step, proof, checkProof });
  }
  validateProof(proof: Proof): Observable<{ steps: StepValidation[]; analysis: ProofAnalysis }> {
    return this.http.post<any>(`${API}/validate-proof`, { proof });
  }
  parseFormula(formula: string): Observable<any> {
    return this.http.post(`${API}/parse`, { formula });
  }
  listAxioms(): Observable<Axiom[]> { return this.http.get<Axiom[]>(`${API}/axioms`); }
  addAxiom(a: { id: string; name: string; formula: string; description?: string }): Observable<Axiom> {
    return this.http.post<Axiom>(`${API}/axioms`, a);
  }
  deleteAxiom(id: string): Observable<any> { return this.http.delete(`${API}/axioms/${id}`); }
  listRules(): Observable<Rule[]> { return this.http.get<Rule[]>(`${API}/rules`); }
  listScenes(): Observable<Scene[]> { return this.http.get<Scene[]>(`${API}/scenes`); }
  getScene(id: string): Observable<Scene> { return this.http.get<Scene>(`${API}/scenes/${id}`); }
  loadScene(id: string): Observable<Proof> { return this.http.post<Proof>(`${API}/scenes/${id}/load`, {}); }
}
