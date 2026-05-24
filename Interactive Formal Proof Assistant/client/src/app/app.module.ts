import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { ProofEditorComponent } from './components/proof-editor/proof-editor.component';
import { ProofTreeComponent } from './components/proof-tree/proof-tree.component';
import { ScenePanelComponent } from './components/scene-panel/scene-panel.component';
import { AxiomPanelComponent } from './components/axiom-panel/axiom-panel.component';
import { LogicRendererComponent } from './components/logic-renderer/logic-renderer.component';

import { ProofService } from './services/proof.service';
import { LogicRenderService } from './services/logic-render.service';
import { AnimationService } from './services/animation.service';

const routes: Routes = [
  { path: '', component: ProofEditorComponent, pathMatch: 'full' },
  { path: 'proof/:id', component: ProofEditorComponent }
];

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  declarations: [
    AppComponent,
    ProofEditorComponent,
    ProofTreeComponent,
    ScenePanelComponent,
    AxiomPanelComponent,
    LogicRendererComponent
  ],
  providers: [ProofService, LogicRenderService, AnimationService],
  bootstrap: [AppComponent]
})
export class AppModule {}
