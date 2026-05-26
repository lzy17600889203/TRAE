import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Species, taxonomyLevels } from '../../models/index';

@Component({
  selector: 'app-species-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './species-panel.component.html',
  styleUrl: './species-panel.component.css',
})
export class SpeciesPanelComponent implements OnInit {
  @Input() speciesList: Species[] = [];
  @Input() selectedSpecies: Species | null = null;
  @Output() speciesSelected = new EventEmitter<Species | null>();
  @Output() speciesCreated = new EventEmitter<any>();
  @Output() speciesDeleted = new EventEmitter<number>();

  newSpeciesName = '';
  newLatinName = '';
  taxonomyInputs: Record<string, string> = {};
  showAddForm = false;
  taxonomyLevels = taxonomyLevels;

  ngOnInit(): void {
    for (const level of taxonomyLevels) {
      this.taxonomyInputs[level.key] = '';
    }
  }

  selectSpecies(species: Species | null): void {
    this.speciesSelected.emit(species);
    this.selectedSpecies = species;
  }

  addSpecies(): void {
    if (!this.newSpeciesName.trim()) return;

    const taxonomy: Record<string, string> = {};
    for (const level of taxonomyLevels) {
      taxonomy[level.key] = this.taxonomyInputs[level.key] || '';
    }

    this.speciesCreated.emit({
      name: this.newSpeciesName,
      latinName: this.newLatinName,
      taxonomy,
    });

    this.newSpeciesName = '';
    this.newLatinName = '';
    for (const level of taxonomyLevels) {
      this.taxonomyInputs[level.key] = '';
    }
    this.showAddForm = false;
  }

  deleteSpecies(id: number): void {
    if (confirm('确定要删除此物种吗？')) {
      this.speciesDeleted.emit(id);
    }
  }

  getTaxonomyTag(level: string, value: string): { label: string; color: string } | null {
    const levelInfo = taxonomyLevels.find((l) => l.key === level);
    if (!levelInfo || !value) return null;
    return { label: `${levelInfo.label}: ${value}`, color: levelInfo.color };
  }

  getTags(sp: Species): { label: string; color: string }[] {
    const tags: { label: string; color: string }[] = [];
    for (const level of taxonomyLevels) {
      const value = (sp as any)[level.key];
      if (value) {
        tags.push({ label: `${level.label}: ${value}`, color: level.color });
      }
    }
    return tags.slice(0, 4);
  }
}
