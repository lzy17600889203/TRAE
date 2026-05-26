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

export function computeDistanceMatrix(
  speciesList: Array<{ id: number; name: string }>,
  characteristics: Array<{ species_id: number; feature_name: string; feature_value: number }>,
  hasMissingData: boolean = false
): DistanceMatrix {
  const featureNames = [...new Set(characteristics.map((c) => c.feature_name))];
  const n = speciesList.length;

  const speciesFeatures = new Map<number, Map<string, number>>();
  for (const s of speciesList) {
    speciesFeatures.set(s.id, new Map());
  }
  for (const c of characteristics) {
    const m = speciesFeatures.get(c.species_id);
    if (m) {
      m.set(c.feature_name, c.feature_value);
    }
  }

  const matrix: number[][] = [];
  const labels = speciesList.map((s) => s.name);
  const speciesIds = speciesList.map((s) => s.id);

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        let distance = 0;
        let validFeatures = 0;
        for (const f of featureNames) {
          const vi = speciesFeatures.get(speciesIds[i])?.get(f);
          const vj = speciesFeatures.get(speciesIds[j])?.get(f);
          if (vi !== undefined && vj !== undefined) {
            distance += Math.abs(vi - vj);
            validFeatures++;
          }
        }
        if (validFeatures > 0) {
          matrix[i][j] = distance / validFeatures;
          if (hasMissingData) {
            matrix[i][j] *= 1.15;
          }
        } else {
          matrix[i][j] = 5;
        }
      }
    }
  }

  return { labels, matrix, speciesIds };
}

export function detectLongBranches(tree: TreeNode, threshold: number = 3): { hasLong: boolean; nodes: string[] } {
  const longNodes: string[] = [];
  function traverse(node: TreeNode) {
    if (node.branchLength > threshold) {
      longNodes.push(node.name);
    }
    for (const child of node.children) {
      traverse(child);
    }
  }
  traverse(tree);
  return { hasLong: longNodes.length > 0, nodes: longNodes };
}

export function detectPolyphyletic(tree: TreeNode, speciesGroups: Map<string, string[]>): boolean {
  function getLeaves(node: TreeNode): string[] {
    if (node.isLeaf) return [node.name];
    return node.children.flatMap(getLeaves);
  }

  const groups = new Map<string, string[]>();
  for (const [group, members] of speciesGroups) {
    for (const member of members) {
      if (!groups.has(member)) groups.set(member, []);
      groups.get(member)!.push(group);
    }
  }

  function checkSubtree(node: TreeNode): string[] {
    if (node.isLeaf) {
      return groups.get(node.name) || [];
    }
    const childGroups = node.children.flatMap(checkSubtree);
    const uniqueGroups = [...new Set(childGroups)];
    if (uniqueGroups.length > 1 && node.children.length > 1) {
      return uniqueGroups;
    }
    return uniqueGroups;
  }

  const result = checkSubtree(tree);
  return result.length > 1;
}

export function upgma(distanceMatrix: DistanceMatrix): TreeNode {
  const { labels, matrix, speciesIds } = distanceMatrix;
  const n = labels.length;

  const clusters: TreeNode[] = labels.map((name, i) => ({
    id: `leaf-${i}`,
    name,
    speciesId: speciesIds[i],
    children: [],
    branchLength: 0,
    isLeaf: true,
  }));

  const clusterSizes = new Array(n).fill(1);
  const activeClusters = new Array(n).fill(true);

  let currentMatrix: number[][] = matrix.map((row) => [...row]);
  let nextNodeId = n;

  while (activeClusters.filter(Boolean).length > 1) {
    let minDist = Infinity;
    let minI = -1;
    let minJ = -1;

    for (let i = 0; i < clusters.length; i++) {
      if (!activeClusters[i]) continue;
      for (let j = i + 1; j < clusters.length; j++) {
        if (!activeClusters[j]) continue;
        if (currentMatrix[i][j] < minDist) {
          minDist = currentMatrix[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    if (minI === -1 || minJ === -1) break;

    const newClusterSize = clusterSizes[minI] + clusterSizes[minJ];
    const branchHalf = minDist / 2;

    const leftChild = { ...clusters[minI], branchLength: branchHalf - clusters[minI].branchLength };
    const rightChild = { ...clusters[minJ], branchLength: branchHalf - clusters[minJ].branchLength };

    const newNode: TreeNode = {
      id: `node-${nextNodeId++}`,
      name: `Internal-${nextNodeId - 1}`,
      children: [leftChild, rightChild],
      branchLength: branchHalf,
      isLeaf: false,
    };

    clusters.push(newNode);
    clusterSizes.push(newClusterSize);
    activeClusters.push(true);

    const newSize = clusters.length;
    const newRow: number[] = new Array(newSize).fill(0);
    for (let k = 0; k < newSize - 1; k++) {
      if (activeClusters[k]) {
        const weightedDist =
          (currentMatrix[minI][k] * clusterSizes[minI] + currentMatrix[minJ][k] * clusterSizes[minJ]) /
          newClusterSize;
        newRow[k] = weightedDist;
      } else {
        newRow[k] = 0;
      }
    }

    for (let k = 0; k < newSize - 1; k++) {
      if (currentMatrix[k]) {
        currentMatrix[k].push(newRow[k]);
      }
    }
    currentMatrix.push([...newRow]);

    activeClusters[minI] = false;
    activeClusters[minJ] = false;
  }

  const root = clusters[clusters.length - 1];
  root.branchLength = 0;
  return root;
}

export function neighborJoining(distanceMatrix: DistanceMatrix): TreeNode {
  const { labels, matrix, speciesIds } = distanceMatrix;
  const n = labels.length;

  if (n <= 1) {
    return {
      id: 'root',
      name: labels[0] || 'Root',
      speciesId: speciesIds[0],
      children: [],
      branchLength: 0,
      isLeaf: true,
    };
  }

  const nodes: TreeNode[] = labels.map((name, i) => ({
    id: `leaf-${i}`,
    name,
    speciesId: speciesIds[i],
    children: [],
    branchLength: 0,
    isLeaf: true,
  }));

  let currentMatrix: number[][] = matrix.map((row) => [...row]);
  const activeNodes = new Set([...Array(n).keys()]);
  let nextNodeId = n;

  function computeQ(m: number[][], active: Set<number>): { q: number[][]; u: number[] } {
    const activeArr = [...active];
    const size = m.length;
    const u = new Array(size).fill(0);

    for (const i of activeArr) {
      let sum = 0;
      for (const k of activeArr) {
        if (k !== i) sum += m[i][k];
      }
      u[i] = sum / Math.max(1, active.size - 2);
    }

    const q: number[][] = [];
    for (let i = 0; i < size; i++) {
      q[i] = new Array(size).fill(Infinity);
    }
    for (let idx = 0; idx < activeArr.length; idx++) {
      for (let jdx = idx + 1; jdx < activeArr.length; jdx++) {
        const i = activeArr[idx];
        const j = activeArr[jdx];
        q[i][j] = m[i][j] - u[i] - u[j];
        q[j][i] = q[i][j];
      }
    }
    return { q, u };
  }

  while (activeNodes.size > 2) {
    const { q, u } = computeQ(currentMatrix, activeNodes);
    let minQ = Infinity;
    let minI = -1;
    let minJ = -1;

    const activeArr = [...activeNodes];
    for (let idx = 0; idx < activeArr.length; idx++) {
      for (let jdx = idx + 1; jdx < activeArr.length; jdx++) {
        const i = activeArr[idx];
        const j = activeArr[jdx];
        if (q[i][j] < minQ) {
          minQ = q[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    if (minI === -1 || minJ === -1) break;

    const newNodeId = nextNodeId++;
    const delta = (currentMatrix[minI][minJ] + u[minI] - u[minJ]) / 2;
    const branchI = Math.max(0.01, delta);
    const branchJ = Math.max(0.01, currentMatrix[minI][minJ] - delta);

    const childI = { ...nodes[minI], branchLength: branchI };
    const childJ = { ...nodes[minJ], branchLength: branchJ };

    nodes.push({
      id: `node-${newNodeId}`,
      name: `Internal-${newNodeId}`,
      children: [childI, childJ],
      branchLength: 0,
      isLeaf: false,
    });

    const newSize = nodes.length;
    const newRow = new Array(newSize).fill(0);
    for (const k of activeNodes) {
      if (k !== minI && k !== minJ) {
        newRow[k] = (currentMatrix[minI][k] + currentMatrix[minJ][k] - currentMatrix[minI][minJ]) / 2;
        newRow[k] = Math.max(0, newRow[k]);
      }
    }
    for (let k = 0; k < newSize - 1; k++) {
      if (currentMatrix[k]) {
        currentMatrix[k].push(newRow[k]);
      }
    }
    currentMatrix.push([...newRow]);

    activeNodes.delete(minI);
    activeNodes.delete(minJ);
    activeNodes.add(newNodeId);
  }

  const remaining = [...activeNodes];
  if (remaining.length === 2) {
    const [a, b] = remaining;
    const branchLen = Math.max(0.01, currentMatrix[a][b] / 2);
    const root: TreeNode = {
      id: 'root',
      name: 'Root',
      children: [
        { ...nodes[a], branchLength: branchLen },
        { ...nodes[b], branchLength: branchLen },
      ],
      branchLength: 0,
      isLeaf: false,
    };
    return root;
  }

  return nodes[remaining[0]] || nodes[0];
}

export function buildPhylogeny(
  algorithm: 'upgma' | 'nj',
  species: Array<{ id: number; name: string }>,
  characteristics: Array<{ species_id: number; feature_name: string; feature_value: number }>,
  options: {
    hasMissingData?: boolean;
    speciesGroups?: Map<string, string[]>;
    longBranchMultiplier?: number;
    polyphyleticForce?: boolean;
    circularDependency?: boolean;
  } = {}
): PhylogenyResult {
  const warnings: string[] = [];
  const distMatrix = computeDistanceMatrix(species, characteristics, options.hasMissingData);

  if (options.longBranchMultiplier && options.longBranchMultiplier > 1) {
    for (let i = 0; i < distMatrix.matrix.length; i++) {
      for (let j = 0; j < distMatrix.matrix[i].length; j++) {
        if (i !== j) {
          distMatrix.matrix[i][j] *= options.longBranchMultiplier;
        }
      }
    }
    warnings.push('超长分支：部分分类单元的演化距离被放大，可能导致布局溢出');
  }

  let tree: TreeNode;
  if (algorithm === 'upgma') {
    tree = upgma(distMatrix);
  } else {
    tree = neighborJoining(distMatrix);
  }

  if (options.polyphyleticForce) {
    warnings.push('多系群检测：树结构中存在交叉分支，可能由趋同演化或分类错误导致');
  }

  if (options.circularDependency) {
    warnings.push('循环依赖：检测到分类层级中存在循环引用，分类逻辑存在错误');
  }

  if (options.hasMissingData) {
    warnings.push('缺失数据：部分物种特征数据缺失，可能导致聚类偏差');
  }

  const longBranchDetect = detectLongBranches(tree);
  const polyphyleticDetect = options.speciesGroups
    ? detectPolyphyletic(tree, options.speciesGroups)
    : false;

  return {
    algorithm: algorithm === 'upgma' ? 'UPGMA' : 'Neighbor-Joining',
    tree,
    distanceMatrix: distMatrix,
    warnings,
    hasLongBranches: longBranchDetect.hasLong,
    hasPolyphyletic: polyphyleticDetect || options.polyphyleticForce === true,
    hasMissingData: options.hasMissingData === true,
  };
}
