export interface TreeNode {
  id: string;
  name: string;
  speciesId?: number;
  children: TreeNode[];
  branchLength: number;
  distance?: number;
  isLeaf: boolean;
  collapsed?: boolean;
  depth?: number;
  x?: number;
  y?: number;
  parentX?: number;
  parentY?: number;
}

export interface Species {
  id: number;
  name: string;
  latin_name: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  parent_id: number | null;
  created_at: string;
}

export interface Feature {
  id: number;
  species_id: number;
  feature_name: string;
  feature_value: string;
  category: string;
}

export interface Characteristic {
  id: number;
  species_id: number;
  feature_name: string;
  feature_value: number;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface PhylogenyResult {
  algorithm: string;
  tree: TreeNode;
  distanceMatrix: {
    labels: string[];
    matrix: number[][];
    speciesIds: number[];
  };
  warnings: string[];
  hasLongBranches: boolean;
  hasPolyphyletic: boolean;
  hasMissingData: boolean;
}

export interface PhylogenyOptions {
  algorithm: 'upgma' | 'nj';
  hasMissingData?: boolean;
  longBranchMultiplier?: number;
  polyphyleticForce?: boolean;
  circularDependency?: boolean;
}

export interface HighlightState {
  highlightedNodes: Set<string>;
  highlightedFeatures: Set<string>;
  highlightMode: 'feature' | 'distance' | 'taxonomy' | null;
}

export interface AnimationState {
  isGrowing: boolean;
  growthProgress: number;
  isExpanding: boolean;
  isCollapsing: boolean;
  highlightedNode: string | null;
  highlightedFeature: string | null;
  activeTaxonomyLevel: string | null;
}

export const taxonomyLevels = [
  { key: 'kingdom', label: '界', color: '#E91E63' },
  { key: 'phylum', label: '门', color: '#9C27B0' },
  { key: 'class', label: '纲', color: '#3F51B5' },
  { key: 'order', label: '目', color: '#2196F3' },
  { key: 'family', label: '科', color: '#00BCD4' },
  { key: 'genus', label: '属', color: '#4CAF50' },
  { key: 'species', label: '种', color: '#8BC34A' },
];
