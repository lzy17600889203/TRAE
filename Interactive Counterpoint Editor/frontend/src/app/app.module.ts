import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { StaffEditorComponent } from './staff-editor/staff-editor.component';
import { IssuesPanelComponent } from './issues-panel/issues-panel.component';
import { PresetButtonsComponent } from './preset-buttons/preset-buttons.component';
import { PlaybackControlsComponent } from './playback-controls/playback-controls.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  declarations: [
    AppComponent,
    StaffEditorComponent,
    IssuesPanelComponent,
    PresetButtonsComponent,
    PlaybackControlsComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
