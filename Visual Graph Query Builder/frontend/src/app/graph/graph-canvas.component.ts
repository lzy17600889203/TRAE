import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphData, GraphEdge, GraphNode } from './types';

type Mode = 'idle' | 'connect' | 'drag';

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

interface ConnectState {
  sourceId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

@Component({
  selector: 'app-graph-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-canvas.component.html',
  styleUrl: './graph-canvas.component.css',
})
export class GraphCanvasComponent implements OnChanges {
  @Input() graph: GraphData = { nodes: [], edges: [] };
  @Input() highlightedNodeIds: Set<string> = new Set();
  @Input() highlightedEdgeIds: Set<string> = new Set();
  @Input() dataFlowPaths: Array<{ edgeId: string; delay: number }> = [];
  @Input() errorNodeIds: Set<string> = new Set();
  @Input() errorEdgeIds: Set<string> = new Set();
  @Input() pulsingNodeIds: Set<string> = new Set();
  @Input() running = false;

  @Output() graphChange = new EventEmitter<GraphData>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<SVGSVGElement>;

  mode: Mode = 'idle';
  private drag: DragState | null = null;
  private connect: ConnectState | null = null;
  snapThreshold = 40;
  snapLines: Array<{ axis: 'x' | 'y'; value: number }> = [];
  hoverTargetId: string | null = null;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['graph'] && this.graph) {
      this.snapLines = [];
    }
  }

  onNodeMouseDown(e: MouseEvent, node: GraphNode) {
    if ((e.target as HTMLElement).dataset['port'] === 'out') {
      this.startConnect(node, e);
    } else {
      this.startDrag(node, e);
    }
  }

  onNodeMouseUp(e: MouseEvent, node: GraphNode) {
    if (this.mode === 'connect' && this.connect && this.connect.sourceId !== node.id) {
      this.finishConnect(node);
    }
  }

  onMouseMove(e: MouseEvent) {
    const svg = this.canvasRef.nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    if (this.mode === 'drag' && this.drag) {
      const dx = p.x - this.drag.startX;
      const dy = p.y - this.drag.startY;
      let nx = this.drag.origX + dx;
      let ny = this.drag.origY + dy;
      let snappedX: number | null = null;
      let snappedY: number | null = null;
      for (const other of this.graph.nodes) {
        if (other.id === this.drag.nodeId) continue;
        if (Math.abs(other.x - nx) < this.snapThreshold) {
          nx = other.x;
          snappedX = other.x;
        }
        if (Math.abs(other.y - ny) < this.snapThreshold) {
          ny = other.y;
          snappedY = other.y;
        }
      }
      this.snapLines = [
        ...(snappedX !== null ? [{ axis: 'x' as const, value: snappedX }] : []),
        ...(snappedY !== null ? [{ axis: 'y' as const, value: snappedY }] : []),
      ];
      this.updateNode(this.drag.nodeId, { x: nx, y: ny });
    } else if (this.mode === 'connect' && this.connect) {
      let snappedNode: GraphNode | null = null;
      for (const n of this.graph.nodes) {
        if (n.id === this.connect.sourceId) continue;
        const d = Math.sqrt((n.x - p.x) ** 2 + (n.y - p.y) ** 2);
        if (d < 48) {
          snappedNode = n;
          break;
        }
      }
      if (snappedNode) {
        this.connect.currentX = snappedNode.x;
        this.connect.currentY = snappedNode.y;
        this.hoverTargetId = snappedNode.id;
      } else {
        this.connect.currentX = p.x;
        this.connect.currentY = p.y;
        this.hoverTargetId = null;
      }
    }
  }

  onMouseUp() {
    if (this.mode === 'connect') {
      this.connect = null;
      this.mode = 'idle';
      this.hoverTargetId = null;
    }
    if (this.mode === 'drag') {
      this.drag = null;
      this.mode = 'idle';
      this.snapLines = [];
    }
  }

  onCanvasClick(e: MouseEvent) {
    if ((e.target as HTMLElement).tagName === 'svg') {
      // empty click - ignore
    }
  }

  toggleStart(nodeId: string) {
    const node = this.graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    node.start = !node.start;
    this.emit();
  }

  deleteNode(nodeId: string) {
    const nodes = this.graph.nodes.filter((n) => n.id !== nodeId);
    const edges = this.graph.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    this.graph = { nodes, edges };
    this.emit();
  }

  deleteEdge(edgeId: string) {
    this.graph = {
      ...this.graph,
      edges: this.graph.edges.filter((e) => e.id !== edgeId),
    };
    this.emit();
  }

  addNode() {
    const id = 'N' + Date.now().toString(36);
    const palette = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee'];
    const color = palette[Math.floor(Math.random() * palette.length)];
    const x = 200 + Math.random() * 400;
    const y = 200 + Math.random() * 200;
    this.graph = {
      nodes: [
        ...this.graph.nodes,
        { id, label: 'Node', x, y, color } as GraphNode,
      ],
      edges: this.graph.edges,
    };
    this.emit();
  }

  clearGraph() {
    this.graph = { nodes: [], edges: [] };
    this.emit();
  }

  private startDrag(node: GraphNode, e: MouseEvent) {
    this.mode = 'drag';
    const svg = this.canvasRef.nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    this.drag = {
      nodeId: node.id,
      startX: p.x,
      startY: p.y,
      origX: node.x,
      origY: node.y,
    };
  }

  private startConnect(node: GraphNode, e: MouseEvent) {
    this.mode = 'connect';
    const svg = this.canvasRef.nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    this.connect = {
      sourceId: node.id,
      startX: node.x + 38,
      startY: node.y,
      currentX: p.x,
      currentY: p.y,
    };
    this.hoverTargetId = null;
  }

  private finishConnect(target: GraphNode) {
    if (!this.connect) return;
    const id = 'E' + Date.now().toString(36);
    const newEdge: GraphEdge = {
      id,
      source: this.connect.sourceId,
      target: target.id,
      type: 'CONNECTS',
    };
    this.graph = {
      nodes: this.graph.nodes,
      edges: [...this.graph.edges, newEdge],
    };
    this.connect = null;
    this.mode = 'idle';
    this.hoverTargetId = null;
    this.emit();
  }

  private updateNode(id: string, patch: Partial<GraphNode>) {
    this.graph = {
      nodes: this.graph.nodes.map((n) =>
        n.id === id ? { ...n, ...patch } : n
      ),
      edges: this.graph.edges,
    };
    this.emit();
  }

  private emit() {
    this.graphChange.emit(this.graph);
  }

  nodeById(id: string): GraphNode | undefined {
    return this.graph.nodes.find((n) => n.id === id);
  }

  connectPreview() {
    return this.connect;
  }

  trackNode(_: number, n: GraphNode) {
    return n.id;
  }

  trackEdge(_: number, e: GraphEdge) {
    return e.id;
  }

  edgePath(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const r = 38;
    const sx = x1 + ux * r;
    const sy = y1 + uy * r;
    const ex = x2 - ux * r;
    const ey = y2 - uy * r;
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2 - 30;
    return `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
  }

  midX(x1: number, x2: number) {
    return (x1 + x2) / 2;
  }
  midY(y1: number, y2: number) {
    return (y1 + y2) / 2 - 30;
  }
}
