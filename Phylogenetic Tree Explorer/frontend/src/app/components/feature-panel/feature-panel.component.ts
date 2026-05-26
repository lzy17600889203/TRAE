import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Species, Feature } from '../../models/index';

@Component({
  selector: 'app-feature-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feature-panel.component.html',
  styleUrl: './feature-panel.component.css',
})
export class FeaturePanelComponent implements OnChanges {
  @Input() selectedSpecies: Species | null = null;
  @Input() features: Feature[] = [];
  @Input() highlightedFeatures: Set<string> = new Set();
  @Output() featuresUpdated = new EventEmitter<any>();
  @Output() featureHighlighted = new EventEmitter<Set<string>>();

  newFeatureName = '';
  newFeatureValue = '';
  newFeatureCategory = '解剖学';
  categories = ['解剖学', '形态', '生理', '生殖', '感知', '运动器官', '呼吸', '运动能力'];
  featureMatrix: Array<{ name: string; values: Array<{ speciesId: number; speciesName: string; value: string }> }> = [];
  speciesFeatures: Feature[] = [];
  allFeatureNames: string[] = [];
  matrixView = true;
  Array = Array;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['features'] || changes['selectedSpecies']) {
      this.buildFeatureMatrix();
    }
  }

  private buildFeatureMatrix(): void {
    const speciesIds = [...new Set(this.features.map((f) => f.species_id))];
    const featureNames = [...new Set(this.features.map((f) => f.feature_name))];
    this.allFeatureNames = featureNames;

    if (this.selectedSpecies) {
      this.speciesFeatures = this.features.filter(
        (f) => f.species_id === this.selectedSpecies!.id
      );
    }

    this.featureMatrix = featureNames.map((name) => ({
      name,
      values: speciesIds.map((sid) => {
        const feature = this.features.find((f) => f.species_id === sid && f.feature_name === name);
        return {
          speciesId: sid,
          speciesName: this.getSpeciesName(sid),
          value: feature?.feature_value || 'N/A',
        };
      }),
    }));
  }

  private getSpeciesName(id: number): string {
    const speciesMap: Record<number, string> = {};
    this.features.forEach((f) => {
      const sp = this.selectedSpecies && f.species_id === this.selectedSpecies.id
        ? this.selectedSpecies.name
        : '';
      if (sp) speciesMap[f.species_id] = sp;
    });
    return speciesMap[id] || `物种${id}`;
  }

  addFeature(): void {
    if (!this.selectedSpecies || !this.newFeatureName.trim()) return;

    this.featuresUpdated.emit({
      species_id: this.selectedSpecies.id,
      feature_name: this.newFeatureName,
      feature_value: this.newFeatureValue,
      category: this.newFeatureCategory,
    });

    this.newFeatureName = '';
    this.newFeatureValue = '';
  }

  toggleFeatureHighlight(featureName: string): void {
    const newSet = new Set(this.highlightedFeatures);
    if (newSet.has(featureName)) {
      newSet.delete(featureName);
    } else {
      newSet.add(featureName);
    }
    this.highlightedFeatures = newSet;
    this.featureHighlighted.emit(newSet);
  }

  isHighlighted(featureName: string): boolean {
    return this.highlightedFeatures.has(featureName);
  }

  getFeatureCategory(featureName: string): string {
    const feature = this.features.find((f) => f.feature_name === featureName);
    return feature?.category || '';
  }
}
