import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Employee, Shift, Schedule } from '../../models';

@Component({
  selector: 'shift-block',
  templateUrl: './shift-block.component.html',
  styleUrls: ['./shift-block.component.scss']
})
export class ShiftBlockComponent {
  @Input() schedule: Schedule | null = null;
  @Input() employee: Employee | undefined;
  @Input() shift: Shift | undefined;
  @Input() isDragging = false;
  @Input() isDragOver = false;

  @Output() click = new EventEmitter<Schedule>();
  @Output() delete = new EventEmitter<number>();
  @Output() dragStart = new EventEmitter<{ schedule: Schedule; event: DragEvent }>();

  getBlockColor(): string {
    return this.shift?.color || '#3b82f6';
  }

  getShiftName(): string {
    return this.shift?.name || '';
  }

  hasViolation(): boolean {
    return !!(this.schedule?.violations && this.schedule.violations.length > 0);
  }

  getViolationClass(): string {
    if (!this.schedule?.violations || this.schedule.violations.length === 0) return '';
    const hasError = this.schedule.violations.some(v => v.severity === 'error');
    return hasError ? 'animate-pulse-red' : '';
  }

  isOverlap(): boolean {
    return !!(this.schedule?.violations?.some(v => v.type === 'overlap'));
  }

  onDragStart(event: DragEvent): void {
    if (this.schedule) {
      this.dragStart.emit({ schedule: this.schedule, event });
    }
  }

  onBlockClick(): void {
    if (this.schedule) {
      this.click.emit(this.schedule);
    }
  }

  onDelete(): void {
    if (this.schedule?.id) {
      this.delete.emit(this.schedule.id);
    }
  }
}
