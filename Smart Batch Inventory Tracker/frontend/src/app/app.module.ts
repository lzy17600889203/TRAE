import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InventorySnapshotComponent } from './components/inventory-snapshot/inventory-snapshot.component';
import { StockFormComponent } from './components/stock-form/stock-form.component';
import { BatchListComponent } from './components/batch-list/batch-list.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { ScenePresetComponent } from './components/scene-preset/scene-preset.component';

@NgModule({
  declarations: [
    AppComponent,
    InventorySnapshotComponent,
    StockFormComponent,
    BatchListComponent,
    TransactionListComponent,
    ScenePresetComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }