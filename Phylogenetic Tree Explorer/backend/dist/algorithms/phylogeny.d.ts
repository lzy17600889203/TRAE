export interface TreeNode {
    id: string;
    name: string;
    speciesId?: number;
    children: TreeNode[];
    branchLength: number;
    distance?: number;
    isLeaf: boolean;
    collapsed?: boolean;
}
export interface DistanceMatrix {
    labels: string[];
    matrix: number[][];
    speciesIds: number[];
}
export interface PhylogenyResult {
    algorithm: string;
    tree: TreeNode;
    distanceMatrix: DistanceMatrix;
    warnings: string[];
    hasLongBranches: boolean;
    hasPolyphyletic: boolean;
    hasMissingData: boolean;
}
export declare function computeDistanceMatrix(speciesList: Array<{
    id: number;
    name: string;
}>, characteristics: Array<{
    species_id: number;
    feature_name: string;
    feature_value: number;
}>, hasMissingData?: boolean): DistanceMatrix;
export declare function detectLongBranches(tree: TreeNode, threshold?: number): {
    hasLong: boolean;
    nodes: string[];
};
export declare function detectPolyphyletic(tree: TreeNode, speciesGroups: Map<string, string[]>): boolean;
export declare function upgma(distanceMatrix: DistanceMatrix): TreeNode;
export declare function neighborJoining(distanceMatrix: DistanceMatrix): TreeNode;
export declare function buildPhylogeny(algorithm: 'upgma' | 'nj', species: Array<{
    id: number;
    name: string;
}>, characteristics: Array<{
    species_id: number;
    feature_name: string;
    feature_value: number;
}>, options?: {
    hasMissingData?: boolean;
    speciesGroups?: Map<string, string[]>;
    longBranchMultiplier?: number;
    polyphyleticForce?: boolean;
    circularDependency?: boolean;
}): PhylogenyResult;
//# sourceMappingURL=phylogeny.d.ts.map