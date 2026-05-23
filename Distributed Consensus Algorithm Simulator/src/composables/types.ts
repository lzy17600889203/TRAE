import type { Node, LogEntry, ClusterEvent, AnimationEvent, ClusterConfig } from '../../../shared/types';

export interface ClusterState {
  clusterId: string | null;
  nodes: Node[];
  logs: Record<number, LogEntry[]>;
  events: ClusterEvent[];
  config: ClusterConfig;
  stats: Record<string, unknown>;
  isConnected: boolean;
  isRunning: boolean;
  isPaused: boolean;
  simulationSpeed: number;
  currentTerm: number;
  leaderId: number | null;
  animations: AnimationEvent[];
  scenarios: { name: string; description: string; icon: string }[];
}

export interface WSMessage {
  type: 'connected' | 'state_update' | 'event' | 'animation' | 'error';
  payload: unknown;
}

export type { Node, LogEntry, ClusterEvent, AnimationEvent, ClusterConfig };
