import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TypesetOptions {
  columnWidth: number;
  wordSpacing: number;
  letterSpacing: number;
  hyphenationRules: string;
  ligatureMode: string;
  fontSize: number;
  tolerance: number;
  arabicBreakConnections: boolean;
  opticalMarginAlignment: boolean;
}

export interface TypesetLine {
  text: string;
  width: number;
  adjustRatio: number;
  glueCount: number;
  lineNumber: number;
  leftOffset?: number;
  rightOffset?: number;
}

export interface TypesetIssue {
  line: number;
  type: string;
  severity: number;
  message: string;
}

export interface TypesetResult {
  lines: TypesetLine[];
  totalDemerits: number;
  issues: TypesetIssue[];
  columnWidth: number;
  options: TypesetOptions;
}

export interface Preset {
  id: number;
  name: string;
  description: string;
  column_width: number;
  word_spacing: number;
  letter_spacing: number;
  hyphenation_rules: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class TypographyService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  getPresets(): Observable<{ success: boolean; data: Preset[] }> {
    return this.http.get<{ success: boolean; data: Preset[] }>(`${this.apiUrl}/presets`);
  }

  getPresetByName(name: string): Observable<{ success: boolean; data: Preset }> {
    return this.http.get<{ success: boolean; data: Preset }>(`${this.apiUrl}/presets/${encodeURIComponent(name)}`);
  }

  typeset(text: string, options: TypesetOptions): Observable<{ success: boolean; data: TypesetResult }> {
    return this.http.post<{ success: boolean; data: TypesetResult }>(`${this.apiUrl}/typeset`, { text, options });
  }

  measureText(text: string, fontSize: number, letterSpacing: number): Observable<{ success: boolean; data: { width: number } }> {
    return this.http.post<{ success: boolean; data: { width: number } }>(`${this.apiUrl}/measure`, { text, fontSize, letterSpacing });
  }
}
