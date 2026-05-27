import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Employee } from '../../models';

@Component({
  selector: 'employee-dialog',
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss']
})
export class EmployeeDialogComponent {
  form: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee | null }
  ) {
    this.isEdit = !!data.employee;
    this.form = this.fb.group({
      id: [data.employee?.id || 0],
      name: [data.employee?.name || '', Validators.required],
      avatar: [data.employee?.avatar || ''],
      department: [data.employee?.department || '', Validators.required],
      maxConsecutiveDays: [data.employee?.maxConsecutiveDays || 5, [Validators.required, Validators.min(1), Validators.max(7)]],
      maxDailyHours: [data.employee?.maxDailyHours || 8, [Validators.required, Validators.min(1), Validators.max(24)]]
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}