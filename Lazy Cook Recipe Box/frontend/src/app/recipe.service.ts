import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe, RecipeDetail } from './recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  listRecipes(scene: string): Observable<Recipe[]> {
    let params = new HttpParams();
    if (scene) params = params.set('scene', scene);
    return this.http.get<Recipe[]>(`${this.baseUrl}/recipes`, { params });
  }

  getRecipe(id: number, servings: number): Observable<RecipeDetail> {
    let params = new HttpParams();
    if (servings > 0) params = params.set('servings', String(servings));
    return this.http.get<RecipeDetail>(`${this.baseUrl}/recipes/${id}`, { params });
  }
}
