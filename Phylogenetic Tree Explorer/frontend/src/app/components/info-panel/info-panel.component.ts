import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Species, PhylogenyResult, TreeNode, taxonomyLevels } from '../../models/index';

@Component({
  selector: 'app-info-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-panel.component.html',
  styleUrl: './info-panel.component.css',
})
export class InfoPanelComponent implements OnChanges {
  @Input() phylogenyResult: PhylogenyResult | null = null;
  @Input() selectedSpecies: Species | null = null;
  @Input() speciesList: Species[] = [];
  @Input() totalDistance: number = 0;

  maxBranchLength = 0;
  avgBranchLength = 0;
  leafCount = 0;
  internalNodeCount = 0;
  taxonomyDistribution: Array<{ level: string; count: number; color: string }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['phylogenyResult'] && this.phylogenyResult) {
      this.calculateStats(this.phylogenyResult.tree);
    }
    if (changes['speciesList']) {
      this.calculateTaxonomyDistribution();
    }
  }

  private calculateStats(tree: TreeNode): void {
    let totalBranch = 0;
    let branchCount = 0;
    this.maxBranchLength = 0;
    this.leafCount = 0;
    this.internalNodeCount = 0;

    const traverse = (node: TreeNode) => {
      if (node.branchLength > 0) {
        totalBranch += node.branchLength;
        branchCount++;
        if (node.branchLength > this.maxBranchLength) {
          this.maxBranchLength = node.branchLength;
        }
      }
      if (node.isLeaf) {
        this.leafCount++;
      } else if (node.children.length > 0) {
        this.internalNodeCount++;
      }
      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(tree);
    this.avgBranchLength = branchCount > 0 ? totalBranch / branchCount : 0;
  }

  private calculateTaxonomyDistribution(): void {
    this.taxonomyDistribution = [];
    for (const level of taxonomyLevels) {
      const values = new Set<string>();
      for (const sp of this.speciesList) {
        const val = (sp as any)[level.key];
        if (val) values.add(val);
      }
      if (values.size > 0) {
        this.taxonomyDistribution.push({
          level: level.label,
          count: values.size,
          color: level.color,
        });
      }
    }
  }

  getWarnings(): string[] {
    return this.phylogenyResult?.warnings || [];
  }

  getTaxonomyRows(): Array<{ label: string; value: string; color: string }> {
    if (!this.selectedSpecies) return [];
    return taxonomyLevels
      .map((level) => ({
        label: level.label,
        value: (this.selectedSpecies as any)[level.key] || '',
        color: level.color,
      }))
      .filter((row) => row.value);
  }
}
