import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Species, Feature, Characteristic, PresetScenario, PhylogenyResult, PhylogenyOptions } from '../models/index';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  getSpecies(): Observable<{ data: Species[] }> {
    return this.http.get<{ data: Species[] }>(`${this.baseUrl}/species`);
  }

  getSpeciesById(id: number): Observable<{ data: Species }> {
    return this.http.get<{ data: Species }>(`${this.baseUrl}/species/${id}`);
  }

  createSpecies(species: Partial<Species> & { taxonomy: Record<string, string> }): Observable<any> {
    return this.http.post(`${this.baseUrl}/species`, species);
  }

  updateSpecies(id: number, species: Partial<Species> & { taxonomy: Record<string, string> }): Observable<any> {
    return this.http.put(`${this.baseUrl}/species/${id}`, species);
  }

  deleteSpecies(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/species/${id}`);
  }

  getSpeciesFeatures(id: number): Observable<{ data: Feature[] }> {
    return this.http.get<{ data: Feature[] }>(`${this.baseUrl}/species/${id}/features`);
  }

  getSpeciesCharacteristics(id: number): Observable<{ data: Characteristic[] }> {
    return this.http.get<{ data: Characteristic[] }>(`${this.baseUrl}/species/${id}/characteristics`);
  }

  getFeatures(): Observable<{ data: Feature[] }> {
    return this.http.get<{ data: Feature[] }>(`${this.baseUrl}/features`);
  }

  getCharacteristics(): Observable<{ data: Characteristic[] }> {
    return this.http.get<{ data: Characteristic[] }>(`${this.baseUrl}/characteristics`);
  }

  getScenarios(): Observable<{ data: PresetScenario[] }> {
    return this.http.get<{ data: PresetScenario[] }>(`${this.baseUrl}/scenarios`);
  }

  loadScenario(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/scenarios/${id}/load`, {});
  }

  clearAll(): Observable<any> {
    return this.http.post(`${this.baseUrl}/scenarios/clear`, {});
  }

  computePhylogeny(options: PhylogenyOptions): Observable<{ data: PhylogenyResult; resultId: number }> {
    return this.http.post<{ data: PhylogenyResult; resultId: number }>(
      `${this.baseUrl}/phylogeny/compute`,
      options
    );
  }

  getDistanceMatrix(): Observable<any> {
    return this.http.get(`${this.baseUrl}/phylogeny/distance-matrix`);
  }
}
