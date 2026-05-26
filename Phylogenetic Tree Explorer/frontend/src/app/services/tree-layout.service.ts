import { Injectable } from '@angular/core';
import { TreeNode } from '../models/index';

@Injectable({ providedIn: 'root' })
export class TreeLayoutService {
  layoutTree(
    tree: TreeNode,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ): TreeNode {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const leafCount = this.countLeaves(tree);
    const leafSpacing = innerHeight / Math.max(leafCount, 1);
    let leafIndex = 0;
    const maxDepth = this.getMaxDepth(tree);

    const assignPositions = (node: TreeNode, depth: number, parentX: number, parentY: number): void => {
      node.depth = depth;
      node.parentX = parentX;
      node.parentY = parentY;

      if (node.isLeaf || (node.collapsed && node.children.length > 0)) {
        node.x = margin.left + innerWidth;
        node.y = margin.top + leafIndex * leafSpacing + leafSpacing / 2;
        leafIndex++;
      } else {
        const childYs: number[] = [];
        for (const child of node.children) {
          assignPositions(child, depth + 1, 0, 0);
          childYs.push(child.y!);
        }
        node.x = margin.left + (depth / maxDepth) * innerWidth;
        node.y = childYs.reduce((a, b) => a + b, 0) / childYs.length;
      }
    };

    assignPositions(tree, 0, margin.left, height / 2);

    return tree;
  }

  private countLeaves(node: TreeNode): number {
    if (node.isLeaf || (node.collapsed && node.children.length > 0)) {
      return 1;
    }
    return node.children.reduce((sum, child) => sum + this.countLeaves(child), 0);
  }

  private getMaxDepth(node: TreeNode, currentDepth: number = 0): number {
    if (node.children.length === 0 || node.collapsed) {
      return currentDepth;
    }
    return Math.max(...node.children.map((child) => this.getMaxDepth(child, currentDepth + 1)));
  }

  getTreeDimensions(tree: TreeNode): { width: number; height: number } {
    const maxDepth = this.getMaxDepth(tree);
    const leafCount = this.countLeaves(tree);
    return {
      width: Math.max(maxDepth * 100 + 200, 600),
      height: Math.max(leafCount * 60 + 100, 400),
    };
  }

  generateSmoothPath(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): string {
    const midX = (x0 + x1) / 2;
    return `M ${x0},${y0} C ${midX},${y0} ${midX},${y1} ${x1},${y1}`;
  }

  generateStepPath(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): string {
    const midX = (x0 + x1) / 2;
    return `M ${x0},${y0} H ${midX} V ${y1} H ${x1}`;
  }

  collapseNode(node: TreeNode, nodeId: string): TreeNode {
    if (node.id === nodeId) {
      node.collapsed = !node.collapsed;
      return node;
    }
    for (const child of node.children) {
      this.collapseNode(child, nodeId);
    }
    return node;
  }

  expandAll(node: TreeNode): void {
    node.collapsed = false;
    for (const child of node.children) {
      this.expandAll(child);
    }
  }

  collapseAll(node: TreeNode): void {
    if (node.children.length > 0 && !node.isLeaf) {
      node.collapsed = true;
      for (const child of node.children) {
        this.collapseAll(child);
      }
    }
  }
}
