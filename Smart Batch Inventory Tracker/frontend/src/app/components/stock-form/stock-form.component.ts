import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { Product } from '../../models/product.model';
import { Batch } from '../../models/batch.model';

@Component({
  selector: 'app-stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.css']
})
export class StockFormComponent implements OnInit {
  mode: 'in' | 'out' = 'in';
  stockForm: FormGroup;
  products: Product[] = [];
  batches: Batch[] = [];
  showSuccess = false;
  successMessage = '';
  errors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService
  ) {
    this.stockForm = this.fb.group({
      product_id: ['', Validators.required],
      batch_no: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      cost: ['', [Validators.required, Validators.min(0.01)]],
      expiry_date: [''],
      remark: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.inventoryService.getProducts().subscribe(data => {
      this.products = data;
    });
  }

  onProductChange(): void {
    const productId = this.stockForm.get('product_id')?.value;
    if (productId) {
      this.inventoryService.getBatches(productId).subscribe(data => {
        this.batches = data;
      });
    }
  }

  switchMode(mode: 'in' | 'out'): void {
    this.mode = mode;
    this.stockForm.reset();
    this.errors = {};
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    const quantity = this.stockForm.get('quantity')?.value;
    const cost = this.stockForm.get('cost')?.value;
    const batchNo = this.stockForm.get('batch_no')?.value;

    if (!quantity) {
      this.errors['quantity'] = '数量不能为空';
      isValid = false;
    } else if (isNaN(quantity) || quantity <= 0) {
      this.errors['quantity'] = '数量必须是大于0的数字';
      isValid = false;
    } else if (!/^\d+$/.test(quantity.toString())) {
      this.errors['quantity'] = '数量只能包含数字';
      isValid = false;
    }

    if (this.mode === 'in') {
      if (!cost) {
        this.errors['cost'] = '成本不能为空';
        isValid = false;
      } else if (isNaN(cost) || cost <= 0) {
        this.errors['cost'] = '成本必须是大于0的数字';
        isValid = false;
      }

      if (!batchNo) {
        this.errors['batch_no'] = '批次号不能为空';
        isValid = false;
      } else if (!/^[A-Za-z0-9-]+$/.test(batchNo)) {
        this.errors['batch_no'] = '批次号只能包含字母、数字和连字符';
        isValid = false;
      }
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    if (this.mode === 'in') {
      const data = {
        product_id: this.stockForm.get('product_id')?.value,
        batch_no: this.stockForm.get('batch_no')?.value,
        quantity: parseInt(this.stockForm.get('quantity')?.value),
        cost: parseFloat(this.stockForm.get('cost')?.value),
        expiry_date: this.stockForm.get('expiry_date')?.value || undefined,
        remark: this.stockForm.get('remark')?.value || undefined
      };

      this.inventoryService.stockIn(data).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.showSuccess = true;
          setTimeout(() => {
            this.showSuccess = false;
            this.stockForm.reset();
          }, 3000);
        },
        error: (err) => {
          this.errors['server'] = err.error?.error || '操作失败';
        }
      });
    } else {
      const data = {
        product_id: this.stockForm.get('product_id')?.value,
        quantity: parseInt(this.stockForm.get('quantity')?.value),
        remark: this.stockForm.get('remark')?.value || undefined
      };

      this.inventoryService.stockOut(data).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          if (response.remaining > 0) {
            this.successMessage += ` (部分出库，剩余待出: ${response.remaining})`;
          }
          this.showSuccess = true;
          setTimeout(() => {
            this.showSuccess = false;
            this.stockForm.reset();
          }, 3000);
        },
        error: (err) => {
          this.errors['server'] = err.error?.error || '操作失败';
        }
      });
    }
  }
}