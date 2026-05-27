import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { Snapshot } from '../../models/snapshot.model';

@Component({
  selector: 'app-inventory-snapshot',
  templateUrl: './inventory-snapshot.component.html',
  styleUrls: ['./inventory-snapshot.component.css']
})
export class InventorySnapshotComponent implements OnInit {
  snapshots: Snapshot[] = [];
  selectedProductId: number | null = null;

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.loadSnapshot();
  }

  loadSnapshot(): void {
    this.inventoryService.getInventorySnapshot().subscribe(data => {
      this.snapshots = data;
    });
  }

  isLowStock(snapshot: Snapshot): boolean {
    return snapshot.total_quantity > 0 && snapshot.total_quantity < snapshot.min_stock;
  }

  isNegativeStock(snapshot: Snapshot): boolean {
    return snapshot.total_quantity < 0;
  }

  onProductSelect(productId: number): void {
    this.selectedProductId = productId;
  }
}