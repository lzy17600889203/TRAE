export interface Batch {
  id: number;
  product_id: number;
  batch_no: string;
  quantity: number;
  cost: number;
  expiry_date?: string;
  created_at: string;
  archived: number;
}