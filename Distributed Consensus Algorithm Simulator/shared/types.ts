export enum NodeState {
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
  LEADER = 'leader',
  DEAD = 'dead'
}

export interface Node {
  id: number;
  clusterId: string;
  state: NodeState;
  currentTerm: number;
  votedFor: number | null;
  commitIndex: number;
  lastApplied: number;
  nextIndex: Record<number, number>;
  matchIndex: Record<number, number>;
  lastHeartbeat: number;
  electionTimeout: number;
  electionDeadline: number;
  isPartitioned: boolean;
  partitionGroup: number;
  votesReceived: Set<number>;
  position: { x: number; y: number };
}

export interface LogEntry {
  id?: number;
  nodeId: number;
  logIndex: number;
  term: number;
  command: string;
  committed: boolean;
  applied: boolean;
  timestamp: number;
}

export interface ClusterEvent {
  id?: number;
  clusterId: string;
  type: EventType;
  nodeId: number | null;
  term: number;
  data: Record<string, unknown>;
  timestamp: number;
}

export type EventType = 
  | 'election_start'
  | 'vote_cast'
  | 'election_win'
  | 'election_fail'
  | 'heartbeat_send'
  | 'heartbeat_receive'
  | 'heartbeat_timeout'
  | 'log_replicate'
  | 'log_commit'
  | 'log_apply'
  | 'state_change'
  | 'network_partition'
  | 'network_heal'
  | 'node_crash'
  | 'node_recovery'
  | 'message_send'
  | 'message_receive'
  | 'client_request';

export interface ClusterConfig {
  nodeCount: number;
  minLatency: number;
  maxLatency: number;
  failureProbability: number;
  heartbeatInterval: number;
  electionTimeoutMin: number;
  electionTimeoutMax: number;
}

export interface PresetScenario {
  name: string;
  description: string;
  icon: string;
  config: Partial<ClusterConfig>;
  partitions?: number[][];
  crashSchedule?: { nodeId: number; delay: number }[];
  messageDelay?: { min: number; max: number; disorderRate: number };
  inconsistentLogs?: { nodeId: number; missingEntries: number }[];
}

export interface Message {
  id: string;
  type: MessageType;
  sourceId: number;
  targetId: number;
  term: number;
  payload: Record<string, unknown>;
  sendTime: number;
  receiveTime: number;
  delivered: boolean;
  dropped: boolean;
}

export enum MessageType {
  REQUEST_VOTE = 'request_vote',
  REQUEST_VOTE_RESPONSE = 'request_vote_response',
  APPEND_ENTRIES = 'append_entries',
  APPEND_ENTRIES_RESPONSE = 'append_entries_response',
  CLIENT_REQUEST = 'client_request',
  HEARTBEAT = 'heartbeat'
}

export interface AnimationEvent {
  type: AnimationEventType;
  sourceNodeId?: number;
  targetNodeId?: number;
  data: Record<string, unknown>;
  duration: number;
  timestamp: number;
}

export type AnimationEventType =
  | 'election_start'
  | 'vote_cast'
  | 'election_win'
  | 'election_fail'
  | 'heartbeat_pulse'
  | 'heartbeat_timeout'
  | 'log_replicate'
  | 'log_commit'
  | 'state_change'
  | 'network_partition'
  | 'network_heal'
  | 'node_crash'
  | 'node_recovery'
  | 'message_flow'
  | 'client_request';

export interface Cluster {
  id: string;
  config: ClusterConfig;
  status: 'idle' | 'running' | 'paused';
  nodes: Node[];
  logs: Map<number, LogEntry[]>;
  events: ClusterEvent[];
  currentTerm: number;
  leaderId: number | null;
  startTime: number;
  simulationSpeed: number;
}
