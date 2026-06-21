export interface SlowSqlItem {
  id: string;
  sql: string;
  duration: number;
  rowsExamined: number;
  executedAt: string;
}

export interface StackTraceItem {
  id: string;
  file: string;
  line: number;
  method: string;
  class: string;
}

export interface ServiceNode {
  id: string;
  name: string;
  type: 'gateway' | 'service' | 'db';
  duration: number;
  isBottleneck: boolean;
  slowSqls: SlowSqlItem[];
  stackTraces: StackTraceItem[];
}

export interface CallEdge {
  source: string;
  target: string;
  duration: number;
  isBottleneckPath: boolean;
}

export interface TraceRequest {
  requestId: string;
  timestamp: string;
  totalDuration: number;
  status: 'normal' | 'slow';
  nodes: ServiceNode[];
  edges: CallEdge[];
}
