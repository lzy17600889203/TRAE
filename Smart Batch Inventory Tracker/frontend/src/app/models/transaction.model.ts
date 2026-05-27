export interface Transaction {
  id: number;
  product_id: number;
  batch_id: number;
  type: 'IN' | 'OUT';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  transaction_date: string;
  remark: string;
  batch_no: string;
  code: string;
  name: string;
}