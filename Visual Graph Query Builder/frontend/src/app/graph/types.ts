export interface GraphNode {
  id: string;
  label: string;
  name?: string;
  kind?: string;
  city?: string;
  country?: string;
  id_?: string;
  x: number;
  y: number;
  color: string;
  start?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  min?: number;
  max?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  query: string;
  graph: GraphData;
  expected: string[];
}

export interface QueryResult {
  cypher: string;
  gremlin: string;
  result: {
    rows: Array<Array<{ id: string; label: string; props: Record<string, unknown> }>>;
    count: number;
    note: string;
    status: 'ok' | 'empty';
  };
}
