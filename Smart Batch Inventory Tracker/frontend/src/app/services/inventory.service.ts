import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { Batch } from '../models/batch.model';
import { Snapshot } from '../models/snapshot.model';
import { Transaction } from '../models/transaction.model';
import { Scene } from '../models/scene.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(product: Omit<Product, 'id' | 'created_at'>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  getBatches(productId?: number): Observable<Batch[]> {
    const url = productId 
      ? `${this.baseUrl}/batches?product_id=${productId}`
      : `${this.baseUrl}/batches`;
    return this.http.get<Batch[]>(url);
  }

  getBatch(id: number): Observable<Batch> {
    return this.http.get<Batch>(`${this.baseUrl}/batches/${id}`);
  }

  createBatch(batch: Omit<Batch, 'id' | 'created_at' | 'archived'>): Observable<Batch> {
    return this.http.post<Batch>(`${this.baseUrl}/batches`, batch);
  }

  deleteBatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/batches/${id}`);
  }

  getInventorySnapshot(): Observable<Snapshot[]> {
    return this.http.get<Snapshot[]>(`${this.baseUrl}/inventory/snapshot`);
  }

  getProductSnapshot(productId: number): Observable<Snapshot> {
    return this.http.get<Snapshot>(`${this.baseUrl}/inventory/snapshot/${productId}`);
  }

  stockIn(data: {
    product_id: number;
    batch_no: string;
    quantity: number;
    cost: number;
    expiry_date?: string;
    remark?: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/inventory/in`, data);
  }

  stockOut(data: {
    product_id: number;
    quantity: number;
    remark?: string;
  }): Observable<{ success: boolean; message: string; remaining: number; transactions: any[] }> {
    return this.http.post<{ success: boolean; message: string; remaining: number; transactions: any[] }>(`${this.baseUrl}/inventory/out`, data);
  }

  getTransactions(productId?: number, limit = 100): Observable<Transaction[]> {
    const url = productId
      ? `${this.baseUrl}/inventory/transactions?product_id=${productId}&limit=${limit}`
      : `${this.baseUrl}/inventory/transactions?limit=${limit}`;
    return this.http.get<Transaction[]>(url);
  }

  exportReport(): Observable<any> {
    return this.http.get(`${this.baseUrl}/inventory/export`, { responseType: 'blob' });
  }

  getScenes(): Observable<Scene[]> {
    return this.http.get<Scene[]>(`${this.baseUrl}/scenes`);
  }

  loadScene(sceneId: string): Observable<{ message: string; product: Product }> {
    return this.http.post<{ message: string; product: Product }>(`${this.baseUrl}/scenes/load/${sceneId}`, {});
  }

  resetDatabase(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/scenes/reset`, {});
  }
}