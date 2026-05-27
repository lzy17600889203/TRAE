import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Employee } from '../../models';
import { EmployeeDialogComponent } from '../employee-dialog/employee-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent {
  @Input() employees: Employee[] = [];
  @Output() add = new EventEmitter<Employee>();
  @Output() update = new EventEmitter<Employee>();
  @Output() delete = new EventEmitter<number>();

  constructor(private dialog: MatDialog) {}

  openAddDialog(): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '400px',
      data: { employee: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.add.emit(result);
      }
    });
  }

  openEditDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '400px',
      data: { employee: employee }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.update.emit(result);
      }
    });
  }

  onDelete(id: number): void {
    if (confirm('确定要删除该员工吗？删除后相关排班也会被移除。')) {
      this.delete.emit(id);
    }
  }
}