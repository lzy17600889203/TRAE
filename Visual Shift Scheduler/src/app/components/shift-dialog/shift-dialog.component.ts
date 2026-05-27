import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Shift, Schedule } from '../../models';

@Component({
  selector: 'shift-dialog',
  templateUrl: './shift-dialog.component.html',
  styleUrls: ['./shift-dialog.component.scss']
})
export class ShiftDialogComponent {
  form: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ShiftDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      shifts: Shift[], 
      selectedDate: Date, 
      selectedEmployeeId: number,
      schedule: Schedule | null 
    }
  ) {
    this.isEdit = !!data.schedule;
    this.form = this.fb.group({
      id: [data.schedule?.id || 0],
      shiftId: [data.schedule?.shiftId || '', Validators.required],
      date: [data.selectedDate.toISOString().split('T')[0], Validators.required]
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

  getShiftColor(shiftId: number): string {
    const shift = this.data.shifts.find(s => s.id === shiftId);
    return shift?.color || '#3b82f6';
  }
}