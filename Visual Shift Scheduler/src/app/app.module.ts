import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AppComponent } from './app.component';
import { ShiftCalendarComponent } from './components/shift-calendar/shift-calendar.component';
import { ShiftBlockComponent } from './components/shift-block/shift-block.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { SceneButtonsComponent } from './components/scene-buttons/scene-buttons.component';
import { EmployeeDialogComponent } from './components/employee-dialog/employee-dialog.component';
import { ShiftDialogComponent } from './components/shift-dialog/shift-dialog.component';
import { SuccessNotificationComponent } from './components/success-notification/success-notification.component';

import { ShiftService } from './services/shift.service';

@NgModule({
  declarations: [
    AppComponent,
    ShiftCalendarComponent,
    ShiftBlockComponent,
    EmployeeListComponent,
    SceneButtonsComponent,
    EmployeeDialogComponent,
    ShiftDialogComponent,
    SuccessNotificationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule
  ],
  providers: [ShiftService],
  bootstrap: [AppComponent]
})
export class AppModule { }