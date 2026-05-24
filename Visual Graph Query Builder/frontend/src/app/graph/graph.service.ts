import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GraphData, QueryResult, Scene } from './types';

@Injectable({ providedIn: 'root' })
export class GraphService {
  private base = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  listScenes(): Observable<{ scenes: string[] }> {
    return this.http.get<{ scenes: string[] }>(`${this.base}/scenes`);
  }

  getScene(id: string): Observable<Scene> {
    return this.http.get<Scene>(`${this.base}/scenes/${id}`);
  }

  execute(graph: GraphData): Observable<QueryResult | { error: string; kind: string }> {
    return this.http.post<QueryResult>(`${this.base}/execute`, { graph });
  }

  translate(graph: GraphData): Observable<{ query: string }> {
    return this.http.post<{ query: string }>(`${this.base}/translate`, {
      graph,
    });
  }
}
