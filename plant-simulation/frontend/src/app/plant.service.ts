import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Preset,
  PlantGeneParameters,
  EnvironmentConfig,
  GenerateResponse,
  PresetApplyResponse,
  AnimationConfig,
} from './types';

@Injectable({
  providedIn: 'root',
})
export class PlantService {
  private apiBase = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getPresets(): Observable<Preset[]> {
    return this.http
      .get<{ presets: Preset[] }>(`${this.apiBase}/presets`)
      .pipe(map((res) => res.presets));
  }

  getPreset(id: string): Observable<Preset> {
    return this.http.get<Preset>(`${this.apiBase}/presets/${id}`);
  }

  getDefaults(): Observable<{
    genes: PlantGeneParameters;
    environment: EnvironmentConfig;
  }> {
    return this.http.get<{
      genes: PlantGeneParameters;
      environment: EnvironmentConfig;
    }>(`${this.apiBase}/defaults`);
  }

  generate(
    genes: PlantGeneParameters,
    environment: EnvironmentConfig
  ): Observable<GenerateResponse> {
    return this.http.post<GenerateResponse>(`${this.apiBase}/generate`, {
      genes,
      environment,
    });
  }

  applyPreset(presetId: string): Observable<PresetApplyResponse> {
    return this.http.post<PresetApplyResponse>(
      `${this.apiBase}/presets/${presetId}/apply`,
      {}
    );
  }

  saveDefaults(
    genes: PlantGeneParameters,
    environment: EnvironmentConfig
  ): Observable<void> {
    return new Observable((subscriber) => {
      this.http
        .post(`${this.apiBase}/defaults/genes`, genes)
        .subscribe(() => {
          this.http
            .post(`${this.apiBase}/defaults/environment`, environment)
            .subscribe(
              () => {
                subscriber.next();
                subscriber.complete();
              },
              (err) => subscriber.error(err)
            );
        }, (err) => subscriber.error(err));
    });
  }

  getDefaultAnimationConfig(): AnimationConfig {
    return {
      branchGrowthSpeed: 1.0,
      leafUnfurlSpeed: 1.0,
      photosynthesisSpeed: 1.0,
      flowerBloomSpeed: 1.0,
      diseaseSpreadSpeed: 0.0,
    };
  }
}
