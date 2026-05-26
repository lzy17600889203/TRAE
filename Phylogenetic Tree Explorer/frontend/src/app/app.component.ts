import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';
import { TreeVisualizationComponent } from './components/tree-visualization/tree-visualization.component';
import { SpeciesPanelComponent } from './components/species-panel/species-panel.component';
import { FeaturePanelComponent } from './components/feature-panel/feature-panel.component';
import { ScenarioPanelComponent } from './components/scenario-panel/scenario-panel.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { Species, Feature, PresetScenario, PhylogenyResult, PhylogenyOptions, TreeNode, taxonomyLevels } from './models/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TreeVisualizationComponent,
    SpeciesPanelComponent,
    FeaturePanelComponent,
    ScenarioPanelComponent,
    InfoPanelComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  speciesList: Species[] = [];
  featureList: Feature[] = [];
  scenarios: PresetScenario[] = [];
  selectedSpecies: Species | null = null;
  tree: TreeNode | null = null;
  phylogenyResult: PhylogenyResult | null = null;
  highlightedFeatures: Set<string> = new Set();
  highlightedNodes: Set<string> = new Set();
  activeTaxonomyLevel: string | null = null;
  showDistances = true;
  currentScenario: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  taxonomyLevels = taxonomyLevels;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadScenarios();
    this.loadSpecies();
  }

  loadScenarios(): void {
    this.apiService.getScenarios().subscribe({
      next: (res) => {
        this.scenarios = res.data;
      },
      error: (err) => {
        console.error('加载场景失败:', err);
      },
    });
  }

  loadSpecies(): void {
    this.apiService.getSpecies().subscribe({
      next: (res) => {
        this.speciesList = res.data;
        if (this.speciesList.length > 0) {
          this.loadFeatures();
        }
      },
      error: (err) => {
        console.error('加载物种失败:', err);
      },
    });
  }

  loadFeatures(): void {
    this.apiService.getFeatures().subscribe({
      next: (res) => {
        this.featureList = res.data;
      },
      error: (err) => {
        console.error('加载特征失败:', err);
      },
    });
  }

  onScenarioLoaded(scenarioId: string): void {
    this.currentScenario = scenarioId;
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.apiService.loadScenario(scenarioId).subscribe({
      next: () => {
        this.loadSpecies();
        this.showSuccess('场景加载成功');
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = '场景加载失败: ' + (err.error?.message || err.message);
        this.isLoading = false;
      },
    });
  }

  onPhylogenyRequested(options: PhylogenyOptions): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.apiService.computePhylogeny(options).subscribe({
      next: (res) => {
        this.phylogenyResult = res.data;
        this.tree = res.data.tree;
        this.showSuccess(`使用${res.data.algorithm}算法构建完成`);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = '系统发育计算失败: ' + (err.error?.error || err.message);
        this.isLoading = false;
      },
    });
  }

  onSpeciesSelected(species: Species | null): void {
    this.selectedSpecies = species;
  }

  onSpeciesCreated(data: any): void {
    this.apiService.createSpecies(data).subscribe({
      next: () => {
        this.loadSpecies();
        this.showSuccess('物种添加成功');
      },
      error: (err) => {
        this.errorMessage = '物种添加失败: ' + (err.error?.error || err.message);
      },
    });
  }

  onSpeciesDeleted(id: number): void {
    this.apiService.deleteSpecies(id).subscribe({
      next: () => {
        if (this.selectedSpecies?.id === id) {
          this.selectedSpecies = null;
        }
        this.loadSpecies();
        this.showSuccess('物种删除成功');
      },
      error: (err) => {
        this.errorMessage = '物种删除失败: ' + (err.error?.message || err.message);
      },
    });
  }

  onFeaturesUpdated(data: any): void {
    this.apiService.getFeatures().subscribe();
    this.apiService
      .getFeatures()
      .subscribe((res) => (this.featureList = res.data));
  }

  onFeatureHighlighted(features: Set<string>): void {
    this.highlightedFeatures = features;
  }

  onTaxonomyLevelChanged(level: string | null): void {
    this.activeTaxonomyLevel = level;
  }

  onShowDistancesChanged(show: boolean): void {
    this.showDistances = show;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      if (this.successMessage === message) {
        this.successMessage = null;
      }
    }, 3000);
  }

  clearAll(): void {
    if (confirm('确定要清除所有数据吗？')) {
      this.apiService.clearAll().subscribe({
        next: () => {
          this.speciesList = [];
          this.featureList = [];
          this.tree = null;
          this.phylogenyResult = null;
          this.selectedSpecies = null;
          this.currentScenario = null;
          this.showSuccess('数据已清除');
        },
        error: (err) => {
          this.errorMessage = '清除失败: ' + (err.error?.message || err.message);
        },
      });
    }
  }
}
