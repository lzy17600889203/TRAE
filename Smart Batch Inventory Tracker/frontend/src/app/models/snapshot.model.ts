export interface Snapshot {
  id: number;
  product_id: number;
  total_quantity: number;
  avg_cost: number;
  updated_at: string;
  code: string;
  name: string;
  unit: string;
  min_stock: number;
}