import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PresetScenario, PhylogenyOptions, taxonomyLevels } from '../../models/index';

@Component({
  selector: 'app-scenario-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scenario-panel.component.html',
  styleUrl: './scenario-panel.component.css',
})
export class ScenarioPanelComponent implements OnInit {
  @Input() scenarios: PresetScenario[] = [];
  @Input() currentScenario: string | null = null;
  @Output() scenarioLoaded = new EventEmitter<string>();
  @Output() phylogenyRequested = new EventEmitter<PhylogenyOptions>();
  @Output() taxonomyLevelChanged = new EventEmitter<string | null>();
  @Output() showDistancesChanged = new EventEmitter<boolean>();

  algorithm: 'upgma' | 'nj' = 'upgma';
  hasMissingData = false;
  longBranchMultiplier = 1;
  polyphyleticForce = false;
  circularDependency = false;
  activeTaxonomyLevel: string | null = null;
  showDistances = true;
  taxonomyLevels = taxonomyLevels;

  ngOnInit(): void {}

  loadScenario(id: string): void {
    this.currentScenario = id;
    this.scenarioLoaded.emit(id);
  }

  computePhylogeny(): void {
    this.phylogenyRequested.emit({
      algorithm: this.algorithm,
      hasMissingData: this.hasMissingData,
      longBranchMultiplier: this.longBranchMultiplier,
      polyphyleticForce: this.polyphyleticForce,
      circularDependency: this.circularDependency,
    });
  }

  onTaxonomyLevelChange(): void {
    this.taxonomyLevelChanged.emit(this.activeTaxonomyLevel);
  }

  onShowDistancesChange(): void {
    this.showDistancesChanged.emit(this.showDistances);
  }

  getScenarioClass(id: string): string {
    const classMap: Record<string, string> = {
      'standard-vertebrate': 'standard',
      'convergent-evolution': 'convergent',
      'missing-fossil-data': 'missing',
      'polyphyletic-group': 'polyphyletic',
    };
    return classMap[id] || '';
  }

  isScenarioActive(id: string): boolean {
    return this.currentScenario === id;
  }
}
