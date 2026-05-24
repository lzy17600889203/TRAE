import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GraphCanvasComponent } from './graph/graph-canvas.component';
import { GraphService } from './graph/graph.service';
import { GraphData, QueryResult, Scene } from './graph/types';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

interface ErrorResp {
  error: string;
  kind: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, GraphCanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  sceneIds: string[] = ['friends', 'knowledge', 'recursion', 'cycle'];
  sceneNameMap: Record<string, string> = {
    friends: '社交网络好友推荐',
    knowledge: '知识图谱实体关联',
    recursion: '深层递归查询',
    cycle: '循环引用死锁',
  };
  currentScene: Scene | null = null;
  graph: GraphData = { nodes: [], edges: [] };
  highlightedNodeIds = new Set<string>();
  highlightedEdgeIds = new Set<string>();
  errorNodeIds = new Set<string>();
  errorEdgeIds = new Set<string>();
  pulsingNodeIds = new Set<string>();
  running = false;
  lastQuery: { cypher?: string; gremlin?: string } | null = null;
  lastResult: QueryResult['result'] | null = null;
  lastError: { message: string; kind: string } | null = null;

  constructor(private graphService: GraphService) {}

  ngOnInit() {
    this.loadScene('friends');
  }

  loadScene(id: string) {
    this.resetVisuals();
    this.graphService
      .getScene(id)
      .pipe(
        tap((scene) => {
          this.currentScene = scene;
          this.graph = JSON.parse(JSON.stringify(scene.graph));
        })
      )
      .subscribe();
  }

  onGraphChange(g: GraphData) {
    this.graph = g;
  }

  onExecute() {
    this.resetVisuals();
    this.running = true;
    this.lastError = null;
    this.lastResult = null;
    this.lastQuery = null;

    this.graphService
      .execute(this.graph)
      .pipe(
        finalize(() => {
          this.running = false;
        }),
        catchError((err) => {
          const body = err.error as ErrorResp | undefined;
          this.handleError(body?.error || err.message || '未知错误', body?.kind);
          return EMPTY;
        })
      )
      .subscribe((resp) => {
        if ('error' in resp) {
          this.handleError(resp.error, (resp as ErrorResp).kind);
          return;
        }
        const r = resp as QueryResult;
        this.lastQuery = { cypher: r.cypher, gremlin: r.gremlin };
        this.lastResult = r.result;
        if (r.result.status === 'ok') {
          this.highlightFirstPath(r.result.rows);
          this.pulseResults(r.result.rows);
        } else {
          this.shakeAll();
        }
      });
  }

  private highlightFirstPath(rows: QueryResult['result']['rows']) {
    if (rows.length === 0) return;
    const path = rows[0];
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const edge = this.graph.edges.find(
        (e) =>
          this.nodeMatchesGraphNode(a, e.source) &&
          this.nodeMatchesGraphNode(b, e.target)
      );
      if (edge) edgeIds.add(edge.id);
    }
    for (const n of path) {
      const gn = this.graph.nodes.find((gn) => this.nodeMatchesGraphNode(n, gn.id));
      if (gn) nodeIds.add(gn.id);
    }
    this.highlightedNodeIds = nodeIds;
    this.highlightedEdgeIds = edgeIds;
  }

  private pulseResults(rows: QueryResult['result']['rows']) {
    const ids = new Set<string>();
    for (const p of rows) {
      for (const n of p) {
        const gn = this.graph.nodes.find((gn) => this.nodeMatchesGraphNode(n, gn.id));
        if (gn) ids.add(gn.id);
      }
    }
    this.pulsingNodeIds = ids;
    setTimeout(() => {
      this.pulsingNodeIds = new Set();
    }, 3600);
  }

  private nodeMatchesGraphNode(
    dbNode: { id: string; label: string; props: Record<string, unknown> },
    graphNodeId: string
  ): boolean {
    const gn = this.graph.nodes.find((g) => g.id === graphNodeId);
    if (!gn) return false;
    if (gn.label && gn.label !== dbNode.label) return false;
    if (gn.name && (dbNode.props['name'] as string) !== gn.name) return false;
    if (gn.kind && (dbNode.props['kind'] as string) !== gn.kind) return false;
    return true;
  }

  private handleError(message: string, kind?: string) {
    this.lastError = { message, kind: kind || 'unknown' };
    this.shakeAll();
  }

  private shakeAll() {
    this.errorNodeIds = new Set(this.graph.nodes.map((n) => n.id));
    this.errorEdgeIds = new Set(this.graph.edges.map((e) => e.id));
    setTimeout(() => {
      this.errorNodeIds = new Set();
      this.errorEdgeIds = new Set();
    }, 1200);
  }

  private resetVisuals() {
    this.highlightedNodeIds = new Set();
    this.highlightedEdgeIds = new Set();
    this.errorNodeIds = new Set();
    this.errorEdgeIds = new Set();
    this.pulsingNodeIds = new Set();
  }
}
