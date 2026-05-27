import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { Batch } from '../../models/batch.model';

@Component({
  selector: 'app-batch-list',
  templateUrl: './batch-list.component.html',
  styleUrls: ['./batch-list.component.css']
})
export class BatchListComponent implements OnInit {
  batches: Batch[] = [];

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.inventoryService.getBatches().subscribe(data => {
      this.batches = data;
    });
  }

  isExpired(batch: Batch): boolean {
    return batch.expiry_date ? new Date(batch.expiry_date) < new Date() : false;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
}