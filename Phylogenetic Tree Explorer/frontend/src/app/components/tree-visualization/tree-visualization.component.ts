import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeNode, Species, Feature } from '../../models/index';
import { TreeLayoutService } from '../../services/tree-layout.service';

interface BranchAnimation {
  nodeId: string;
  path: string;
  length: number;
  progress: number;
  color: string;
  width: number;
  highlighted: boolean;
  distance: number;
}

interface NodeAnimation {
  nodeId: string;
  x: number;
  y: number;
  name: string;
  isLeaf: boolean;
  collapsed: boolean;
  hasChildren: boolean;
  children: string[];
  depth: number;
  branchLength: number;
  speciesId?: number;
  highlighted: boolean;
  expandProgress: number;
}

@Component({
  selector: 'app-tree-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tree-visualization.component.html',
  styleUrl: './tree-visualization.component.css',
})
export class TreeVisualizationComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() tree: TreeNode | null = null;
  @Input() speciesList: Species[] = [];
  @Input() featureList: Feature[] = [];
  @Input() highlightedFeatures: Set<string> = new Set();
  @Input() highlightedNodes: Set<string> = new Set();
  @Input() activeTaxonomyLevel: string | null = null;
  @Input() showDistances: boolean = false;
  @Input() algorithm: string = '';
  @Input() warnings: string[] = [];

  @ViewChild('svgContainer') svgContainer!: ElementRef<SVGSVGElement>;

  branches: BranchAnimation[] = [];
  nodes: NodeAnimation[] = [];
  svgWidth = 800;
  svgHeight = 500;
  isGrowing = false;
  growthProgress = 0;
  selectedNode: string | null = null;
  tooltipText = '';
  tooltipX = 0;
  tooltipY = 0;
  showTooltip = false;
  animationFrameId: number | null = null;
  currentTree: TreeNode | null = null;

  private readonly MARGIN = { top: 40, right: 150, bottom: 40, left: 60 };

  constructor(
    private layoutService: TreeLayoutService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.tree) {
      this.renderTree(this.tree);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tree'] && this.tree) {
      this.renderTree(this.tree);
    }
    if (changes['highlightedFeatures'] || changes['highlightedNodes'] || changes['activeTaxonomyLevel']) {
      this.updateHighlights();
    }
  }

  private renderTree(tree: TreeNode): void {
    this.currentTree = JSON.parse(JSON.stringify(tree));
    if (!this.currentTree) return;
    this.branches = [];
    this.nodes = [];

    const dims = this.layoutService.getTreeDimensions(this.currentTree);
    this.svgWidth = Math.max(dims.width, 800);
    this.svgHeight = Math.max(dims.height, 500);

    this.layoutService.layoutTree(this.currentTree, this.svgWidth, this.svgHeight, this.MARGIN);

    this.collectBranches(this.currentTree);
    this.collectNodes(this.currentTree);

    this.startGrowthAnimation();
  }

  private collectBranches(node: TreeNode): void {
    if (node.children && node.children.length > 0 && !node.collapsed) {
      for (const child of node.children) {
        const path = this.layoutService.generateSmoothPath(
          node.x!,
          node.y!,
          child.x!,
          child.y!
        );
        const length = this.calculatePathLength(node.x!, node.y!, child.x!, child.y!);

        this.branches.push({
          nodeId: child.id,
          path,
          length,
          progress: 0,
          color: this.getBranchColor(node, child),
          width: this.getBranchWidth(child.branchLength),
          highlighted: false,
          distance: child.branchLength,
        });

        this.collectBranches(child);
      }
    }
  }

  private collectNodes(node: TreeNode): void {
    this.nodes.push({
      nodeId: node.id,
      x: node.x!,
      y: node.y!,
      name: node.name,
      isLeaf: node.isLeaf,
      collapsed: node.collapsed || false,
      hasChildren: node.children && node.children.length > 0,
      children: node.children ? node.children.map((c) => c.id) : [],
      depth: node.depth || 0,
      branchLength: node.branchLength,
      speciesId: node.speciesId,
      highlighted: false,
      expandProgress: 0,
    });

    if (node.children && node.children.length > 0 && !node.collapsed) {
      for (const child of node.children) {
        this.collectNodes(child);
      }
    }
  }

  private calculatePathLength(x0: number, y0: number, x1: number, y1: number): number {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getBranchColor(parent: TreeNode, child: TreeNode): string {
    if (child.branchLength > 3) {
      return '#FF5252';
    }
    if (child.branchLength > 1.5) {
      return '#FFB74D';
    }
    return 'rgba(0, 255, 255, 0.7)';
  }

  private getBranchWidth(branchLength: number): number {
    const baseWidth = 2;
    const scale = Math.max(0.5, Math.min(3, 3 - branchLength * 0.5));
    return baseWidth * scale;
  }

  private startGrowthAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.isGrowing = true;
    this.growthProgress = 0;
    const startTime = performance.now();
    const duration = 2000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      this.growthProgress = Math.min(elapsed / duration, 1);

      for (const branch of this.branches) {
        branch.progress = this.growthProgress;
      }

      this.cdr.detectChanges();

      if (this.growthProgress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.isGrowing = false;
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private updateHighlights(): void {
    for (const node of this.nodes) {
      node.highlighted = this.highlightedNodes.has(node.nodeId) ||
        (this.activeTaxonomyLevel !== null && this.isNodeAtLevel(node, this.activeTaxonomyLevel));
    }

    for (const branch of this.branches) {
      branch.highlighted = this.highlightedFeatures.size > 0 ||
        this.highlightedNodes.has(branch.nodeId);
    }

    this.cdr.detectChanges();
  }

  private isNodeAtLevel(node: NodeAnimation, level: string): boolean {
    if (!node.speciesId || !this.activeTaxonomyLevel) return false;
    const species = this.speciesList.find((s) => s.id === node.speciesId);
    if (!species) return false;
    const levelValue = (species as any)[this.activeTaxonomyLevel];
    return levelValue && levelValue.length > 0;
  }

  onNodeClick(node: NodeAnimation): void {
    if (node.hasChildren) {
      if (this.currentTree) {
        this.layoutService.collapseNode(this.currentTree, node.nodeId);
        this.renderTree(this.currentTree);
      }
    }
    this.selectedNode = node.nodeId;
  }

  onNodeMouseEnter(event: MouseEvent, node: NodeAnimation): void {
    const species = this.speciesList.find((s) => s.id === node.speciesId);
    if (species) {
      this.tooltipText = `${species.name} (${species.latin_name})\n${this.getTaxonomyString(species)}`;
    } else {
      this.tooltipText = node.name;
      if (this.showDistances) {
        this.tooltipText += `\n分支长度: ${node.branchLength.toFixed(3)}`;
      }
    }
    this.tooltipX = event.clientX + 10;
    this.tooltipY = event.clientY + 10;
    this.showTooltip = true;
  }

  onNodeMouseLeave(): void {
    this.showTooltip = false;
  }

  private getTaxonomyString(species: Species): string {
    const parts: string[] = [];
    const levels = ['界', '门', '纲', '目', '科', '属', '种'];
    const keys = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];

    for (let i = 0; i < levels.length; i++) {
      const value = (species as any)[keys[i]];
      if (value) {
        parts.push(`${levels[i]}: ${value}`);
      }
    }
    return parts.join(' | ');
  }

  expandAll(): void {
    if (this.currentTree) {
      this.layoutService.expandAll(this.currentTree);
      this.renderTree(this.currentTree);
    }
  }

  collapseAll(): void {
    if (this.currentTree) {
      this.layoutService.collapseAll(this.currentTree);
      this.renderTree(this.currentTree);
    }
  }

  getBranchPath(branch: BranchAnimation): string {
    if (branch.progress < 1) {
      return branch.path + `; stroke-dasharray: ${branch.length}; stroke-dashoffset: ${branch.length * (1 - branch.progress)}`;
    }
    return branch.path;
  }

  getBranchStyle(branch: BranchAnimation): string {
    const dashOffset = branch.length * (1 - branch.progress);
    return `stroke-dasharray: ${branch.length}; stroke-dashoffset: ${dashOffset};`;
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
