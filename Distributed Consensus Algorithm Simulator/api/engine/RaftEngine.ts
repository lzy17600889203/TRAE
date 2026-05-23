import { NodeState, MessageType } from '../../shared/types.js';
import type { 
  Node, LogEntry, ClusterEvent, EventType, ClusterConfig, Message, AnimationEvent, AnimationEventType 
} from '../../shared/types.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { v4 as uuidv4 } from 'uuid';

export interface EngineCallbacks {
  onEvent: (event: ClusterEvent) => void;
  onAnimation: (animation: AnimationEvent) => void;
  onStateChange: (nodes: Node[]) => void;
}

export class RaftEngine {
  private nodes: Map<number, Node> = new Map();
  private logs: Map<number, LogEntry[]> = new Map();
  private messageQueue: Message[] = [];
  private pendingTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: ClusterConfig;
  private clusterId: string;
  private currentTerm: number = 0;
  private leaderId: number | null = null;
  private running: boolean = false;
  private paused: boolean = false;
  private simulationSpeed: number = 1;
  private callbacks: EngineCallbacks;
  private dbService: DatabaseService;
  private messageDelayConfig: { min: number; max: number; disorderRate: number } | null = null;
  private partitionGroups: number[][] = [];
  private crashSchedule: { nodeId: number; delay: number }[] = [];
  private inconsistentLogNodes: { nodeId: number; missingEntries: number }[] = [];
  private logCounter: number = 0;

  constructor(
    clusterId: string,
    config: ClusterConfig,
    callbacks: EngineCallbacks,
    dbService: DatabaseService
  ) {
    this.clusterId = clusterId;
    this.config = { ...config };
    this.callbacks = callbacks;
    this.dbService = dbService;
  }

  initializeNodes(): void {
    this.nodes.clear();
    this.logs.clear();
    this.currentTerm = 0;
    this.leaderId = null;

    const nodeCount = this.config.nodeCount;
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const electionTimeout = this.getRandomElectionTimeout();
      const now = Date.now();

      const node: Node = {
        id: i,
        clusterId: this.clusterId,
        state: NodeState.FOLLOWER,
        currentTerm: 0,
        votedFor: null,
        commitIndex: 0,
        lastApplied: 0,
        nextIndex: {},
        matchIndex: {},
        lastHeartbeat: now,
        electionTimeout,
        electionDeadline: now + electionTimeout,
        isPartitioned: false,
        partitionGroup: 0,
        votesReceived: new Set(),
        position: { x, y }
      };

      for (let j = 0; j < nodeCount; j++) {
        if (i !== j) {
          node.nextIndex[j] = 0;
          node.matchIndex[j] = -1;
        }
      }

      this.nodes.set(i, node);
      this.logs.set(i, []);
      this.dbService.saveNode(node);
    }

    this.callbacks.onStateChange(Array.from(this.nodes.values()));
  }

  setPartitionGroups(groups: number[][]): void {
    this.partitionGroups = groups;
    this.nodes.forEach((node, nodeId) => {
      let groupId = 0;
      for (let g = 0; g < groups.length; g++) {
        if (groups[g].includes(nodeId)) {
          groupId = g;
          break;
        }
      }
      node.partitionGroup = groupId;
      if (groups.length > 1) {
        node.isPartitioned = true;
      }
      this.dbService.updateNodeState(node);
    });

    if (groups.length > 1) {
      this.emitEvent('network_partition', null, { groups });
      this.emitAnimation('network_partition', undefined, undefined, { groups });
    }

    this.callbacks.onStateChange(Array.from(this.nodes.values()));
  }

  setMessageDelay(config: { min: number; max: number; disorderRate: number }): void {
    this.messageDelayConfig = config;
  }

  setCrashSchedule(schedule: { nodeId: number; delay: number }[]): void {
    this.crashSchedule = [...schedule];
  }

  setInconsistentLogs(inconsistent: { nodeId: number; missingEntries: number }[]): void {
    this.inconsistentLogNodes = [...inconsistent];
  }

  applyInconsistentLogs(): void {
    if (this.inconsistentLogNodes.length === 0) return;
    
    for (const config of this.inconsistentLogNodes) {
      const node = this.nodes.get(config.nodeId);
      if (!node) continue;
      
      for (let i = 0; i < config.missingEntries; i++) {
        const entry: LogEntry = {
          nodeId: config.nodeId,
          logIndex: i,
          term: i % 3,
          command: `old-command-${i}`,
          committed: i < Math.floor(config.missingEntries / 2),
          applied: false,
          timestamp: Date.now() - (config.missingEntries - i) * 1000
        };
        const logs = this.logs.get(config.nodeId) || [];
        logs.push(entry);
        this.dbService.saveLogEntry(entry);
      }
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    
    this.applyInconsistentLogs();
    this.startElectionTimer(0);
    this.startCrashScheduler();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.running) return;
    this.paused = false;
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.pendingTimers.forEach(timer => clearTimeout(timer));
    this.pendingTimers.clear();
    this.messageQueue = [];
  }

  setSpeed(speed: number): void {
    this.simulationSpeed = speed;
  }

  isRunning(): boolean {
    return this.running && !this.paused;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getNode(id: number): Node | undefined {
    return this.nodes.get(id);
  }

  getLogs(nodeId: number): LogEntry[] {
    return this.logs.get(nodeId) || [];
  }

  getCurrentTerm(): number {
    return this.currentTerm;
  }

  getLeaderId(): number | null {
    return this.leaderId;
  }

  getConfig(): ClusterConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ClusterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  crashNode(nodeId: number): void {
    const node = this.nodes.get(nodeId);
    if (!node || node.state === NodeState.DEAD) return;

    const oldState = node.state;
    node.state = NodeState.DEAD;
    this.dbService.updateNodeState(node);
    this.dbService.saveNodeStateSnapshot(nodeId, NodeState.DEAD, node.currentTerm, (this.logs.get(nodeId)?.length || 1) - 1);

    if (this.leaderId === nodeId) {
      this.leaderId = null;
    }

    this.emitEvent('node_crash', nodeId, {});
    this.emitAnimation('node_crash', nodeId, undefined, {});
    this.emitAnimation('state_change', nodeId, undefined, { from: oldState, to: NodeState.DEAD });
    this.callbacks.onStateChange(Array.from(this.nodes.values()));

    const timerKey = `election_${nodeId}`;
    if (this.pendingTimers.has(timerKey)) {
      clearTimeout(this.pendingTimers.get(timerKey)!);
      this.pendingTimers.delete(timerKey);
    }

    const aliveNodes = Array.from(this.nodes.values()).filter(n => n.state !== NodeState.DEAD && !n.isPartitioned);
    if (this.leaderId === null && aliveNodes.length > 0) {
      this.scheduleElectionForRandomNode();
    }
  }

  restartNode(nodeId: number): void {
    const node = this.nodes.get(nodeId);
    if (!node || node.state !== NodeState.DEAD) return;

    const now = Date.now();
    const electionTimeout = this.getRandomElectionTimeout();
    
    node.state = NodeState.FOLLOWER;
    node.currentTerm = this.currentTerm;
    node.votedFor = null;
    node.lastHeartbeat = now;
    node.electionTimeout = electionTimeout;
    node.electionDeadline = now + electionTimeout;
    node.votesReceived = new Set();

    this.dbService.updateNodeState(node);
    this.dbService.saveNodeStateSnapshot(nodeId, NodeState.FOLLOWER, node.currentTerm, (this.logs.get(nodeId)?.length || 1) - 1);

    this.emitEvent('node_recovery', nodeId, {});
    this.emitAnimation('node_recovery', nodeId, undefined, {});
    this.emitAnimation('state_change', nodeId, undefined, { from: NodeState.DEAD, to: NodeState.FOLLOWER });
    this.callbacks.onStateChange(Array.from(this.nodes.values()));

    this.startElectionTimer(nodeId);
  }

  healNetwork(): void {
    this.partitionGroups = [];
    this.nodes.forEach(node => {
      node.isPartitioned = false;
      node.partitionGroup = 0;
      this.dbService.updateNodeState(node);
    });

    this.emitEvent('network_heal', null, {});
    this.emitAnimation('network_heal', undefined, undefined, {});
    this.callbacks.onStateChange(Array.from(this.nodes.values()));

    if (this.leaderId === null) {
      this.scheduleElectionForRandomNode();
    }
  }

  sendClientRequest(command: string): void {
    if (this.leaderId === null) {
      this.emitEvent('client_request', null, { command, rejected: true, reason: 'No leader' });
      return;
    }

    const leader = this.nodes.get(this.leaderId);
    if (!leader || leader.state !== NodeState.LEADER) {
      this.emitEvent('client_request', null, { command, rejected: true, reason: 'Leader invalid' });
      return;
    }

    const logIndex = this.logs.get(this.leaderId)!.length;
    const entry: LogEntry = {
      nodeId: this.leaderId,
      logIndex,
      term: this.currentTerm,
      command,
      committed: false,
      applied: false,
      timestamp: Date.now()
    };

    const leaderLogs = this.logs.get(this.leaderId)!;
    leaderLogs.push(entry);
    this.dbService.saveLogEntry(entry);

    this.emitEvent('client_request', this.leaderId, { command, logIndex });
    this.emitAnimation('client_request', this.leaderId, undefined, { command, logIndex });

    this.replicateLog(this.leaderId, entry);
  }

  private getRandomElectionTimeout(): number {
    const { electionTimeoutMin, electionTimeoutMax } = this.config;
    return Math.floor(Math.random() * (electionTimeoutMax - electionTimeoutMin + 1)) + electionTimeoutMin;
  }

  private canCommunicate(nodeA: number, nodeB: number): boolean {
    const a = this.nodes.get(nodeA);
    const b = this.nodes.get(nodeB);
    if (!a || !b) return false;
    if (a.state === NodeState.DEAD || b.state === NodeState.DEAD) return false;
    if (a.isPartitioned && b.isPartitioned && a.partitionGroup !== b.partitionGroup) return false;
    return true;
  }

  private startElectionTimer(nodeId: number): void {
    const timerKey = `election_${nodeId}`;
    if (this.pendingTimers.has(timerKey)) {
      clearTimeout(this.pendingTimers.get(timerKey)!);
    }

    const node = this.nodes.get(nodeId);
    if (!node || node.state === NodeState.DEAD) return;

    const timeout = node.electionTimeout / this.simulationSpeed;
    
    this.emitAnimation('heartbeat_timeout', nodeId, undefined, { 
      duration: node.electionTimeout,
      deadline: node.electionDeadline
    });

    const timer = setTimeout(() => {
      this.pendingTimers.delete(timerKey);
      if (!this.isRunning()) return;
      
      const n = this.nodes.get(nodeId);
      if (!n || n.state === NodeState.DEAD) return;
      
      if (Date.now() >= n.electionDeadline) {
        if (n.state === NodeState.FOLLOWER || n.state === NodeState.CANDIDATE) {
          this.startElection(nodeId);
        }
      }
    }, timeout);

    this.pendingTimers.set(timerKey, timer);
  }

  private startElection(candidateId: number): void {
    const candidate = this.nodes.get(candidateId);
    if (!candidate || candidate.state === NodeState.DEAD) return;

    this.currentTerm++;
    candidate.state = NodeState.CANDIDATE;
    candidate.currentTerm = this.currentTerm;
    candidate.votedFor = candidateId;
    candidate.votesReceived = new Set([candidateId]);
    candidate.lastHeartbeat = Date.now();
    
    this.dbService.updateNodeState(candidate);
    this.dbService.saveNodeStateSnapshot(candidateId, NodeState.CANDIDATE, this.currentTerm, (this.logs.get(candidateId)?.length || 1) - 1);

    this.emitEvent('election_start', candidateId, { term: this.currentTerm });
    this.emitAnimation('election_start', candidateId, undefined, { term: this.currentTerm });
    this.emitAnimation('state_change', candidateId, undefined, { from: NodeState.FOLLOWER, to: NodeState.CANDIDATE });
    this.callbacks.onStateChange(Array.from(this.nodes.values()));

    const aliveNodes = Array.from(this.nodes.values()).filter(n => 
      n.id !== candidateId && n.state !== NodeState.DEAD && this.canCommunicate(candidateId, n.id)
    );

    const candidateLogs = this.logs.get(candidateId) || [];
    const lastLogIndex = candidateLogs.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? candidateLogs[lastLogIndex].term : 0;

    aliveNodes.forEach(targetNode => {
      const requestVote: Message = {
        id: uuidv4(),
        type: MessageType.REQUEST_VOTE,
        sourceId: candidateId,
        targetId: targetNode.id,
        term: this.currentTerm,
        payload: {
          lastLogIndex,
          lastLogTerm
        },
        sendTime: Date.now(),
        receiveTime: Date.now() + this.getMessageDelay(),
        delivered: false,
        dropped: Math.random() < this.config.failureProbability
      };

      if (!requestVote.dropped) {
        this.queueMessage(requestVote);
        this.emitAnimation('message_flow', candidateId, targetNode.id, { 
          type: 'request_vote', 
          term: this.currentTerm 
        });
      } else {
        this.emitEvent('message_send', candidateId, { targetId: targetNode.id, type: 'request_vote', dropped: true });
      }
    });

    const electionTimeout = this.getRandomElectionTimeout();
    candidate.electionTimeout = electionTimeout;
    candidate.electionDeadline = Date.now() + electionTimeout;
    
    setTimeout(() => {
      if (!this.isRunning()) return;
      const n = this.nodes.get(candidateId);
      if (n && n.state === NodeState.CANDIDATE && n.currentTerm === this.currentTerm) {
        const votes = n.votesReceived.size;
        if (!this.hasMajority(votes)) {
          this.emitEvent('election_fail', candidateId, { term: this.currentTerm, votes, needed: Math.floor(this.nodes.size / 2) + 1 });
          this.emitAnimation('election_fail', candidateId, undefined, { term: this.currentTerm });
          this.emitAnimation('state_change', candidateId, undefined, { from: NodeState.CANDIDATE, to: NodeState.FOLLOWER });
          n.state = NodeState.FOLLOWER;
          n.votesReceived = new Set();
          this.dbService.updateNodeState(n);
          this.callbacks.onStateChange(Array.from(this.nodes.values()));
          this.startElectionTimer(candidateId);
        }
      }
    }, electionTimeout / this.simulationSpeed);
  }

  private handleRequestVote(msg: Message): void {
    const target = this.nodes.get(msg.targetId);
    const source = this.nodes.get(msg.sourceId);
    
    if (!target || !source || target.state === NodeState.DEAD) return;

    this.emitEvent('message_receive', msg.targetId, { sourceId: msg.sourceId, type: 'request_vote' });

    if (msg.term < target.currentTerm) {
      this.sendVoteResponse(msg.targetId, msg.sourceId, msg.term, false, 'Stale term');
      return;
    }

    if (msg.term > target.currentTerm) {
      this.currentTerm = msg.term;
      target.currentTerm = msg.term;
      target.state = NodeState.FOLLOWER;
      target.votedFor = null;
      this.dbService.updateNodeState(target);
    }

    const targetLogs = this.logs.get(msg.targetId) || [];
    const lastLogIndex = targetLogs.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? targetLogs[lastLogIndex].term : 0;

    const candidateLastLogIndex = msg.payload.lastLogIndex as number;
    const candidateLastLogTerm = msg.payload.lastLogTerm as number;

    const logIsUpToDate = 
      candidateLastLogTerm > lastLogTerm || 
      (candidateLastLogTerm === lastLogTerm && candidateLastLogIndex >= lastLogIndex);

    const canVote = (target.votedFor === null || target.votedFor === msg.sourceId) && logIsUpToDate;

    if (canVote) {
      target.votedFor = msg.sourceId;
      target.lastHeartbeat = Date.now();
      this.dbService.updateNodeState(target);
    }

    this.sendVoteResponse(msg.targetId, msg.sourceId, msg.term, canVote, canVote ? '' : 'Log not up to date or already voted');
  }

  private sendVoteResponse(sourceId: number, targetId: number, term: number, voteGranted: boolean, reason: string): void {
    const response: Message = {
      id: uuidv4(),
      type: MessageType.REQUEST_VOTE_RESPONSE,
      sourceId,
      targetId,
      term,
      payload: { voteGranted, reason },
      sendTime: Date.now(),
      receiveTime: Date.now() + this.getMessageDelay(),
      delivered: false,
      dropped: Math.random() < this.config.failureProbability
    };

    if (!response.dropped) {
      this.queueMessage(response);
      this.emitAnimation('message_flow', sourceId, targetId, { 
        type: 'vote_response', 
        voteGranted,
        term 
      });
    }
  }

  private handleVoteResponse(msg: Message): void {
    const candidate = this.nodes.get(msg.targetId);
    if (!candidate || candidate.state !== NodeState.CANDIDATE || candidate.currentTerm !== msg.term) return;

    const voteGranted = msg.payload.voteGranted as boolean;
    this.emitEvent('vote_cast', msg.targetId, { voterId: msg.sourceId, voteGranted, term: msg.term });
    this.emitAnimation('vote_cast', msg.sourceId, msg.targetId, { voteGranted });

    if (voteGranted) {
      candidate.votesReceived.add(msg.sourceId);
      
      if (this.hasMajority(candidate.votesReceived.size)) {
        this.becomeLeader(msg.targetId);
      }
    }
  }

  private becomeLeader(leaderId: number): void {
    const leader = this.nodes.get(leaderId);
    if (!leader) return;

    this.leaderId = leaderId;
    leader.state = NodeState.LEADER;
    leader.votesReceived = new Set();

    const otherNodes = Array.from(this.nodes.values()).filter(n => n.id !== leaderId);
    otherNodes.forEach(node => {
      const logs = this.logs.get(leaderId) || [];
      leader.nextIndex[node.id] = logs.length;
      leader.matchIndex[node.id] = -1;
    });

    this.dbService.updateNodeState(leader);
    this.dbService.saveNodeStateSnapshot(leaderId, NodeState.LEADER, this.currentTerm, (this.logs.get(leaderId)?.length || 1) - 1);

    this.emitEvent('election_win', leaderId, { term: this.currentTerm });
    this.emitAnimation('election_win', leaderId, undefined, { term: this.currentTerm });
    this.emitAnimation('state_change', leaderId, undefined, { from: NodeState.CANDIDATE, to: NodeState.LEADER });
    this.callbacks.onStateChange(Array.from(this.nodes.values()));

    const timerKey = `heartbeat_${leaderId}`;
    if (this.pendingTimers.has(timerKey)) {
      clearTimeout(this.pendingTimers.get(timerKey)!);
    }
    
    this.sendHeartbeats(leaderId);
    this.scheduleHeartbeat(leaderId);
  }

  private scheduleHeartbeat(leaderId: number): void {
    const timerKey = `heartbeat_${leaderId}`;
    if (this.pendingTimers.has(timerKey)) {
      clearTimeout(this.pendingTimers.get(timerKey)!);
    }

    const interval = this.config.heartbeatInterval / this.simulationSpeed;
    const timer = setTimeout(() => {
      this.pendingTimers.delete(timerKey);
      if (!this.isRunning()) return;
      
      const leader = this.nodes.get(leaderId);
      if (leader && leader.state === NodeState.LEADER && this.leaderId === leaderId) {
        this.sendHeartbeats(leaderId);
        this.scheduleHeartbeat(leaderId);
      }
    }, interval);

    this.pendingTimers.set(timerKey, timer);
  }

  private sendHeartbeats(leaderId: number): void {
    const leader = this.nodes.get(leaderId);
    if (!leader || leader.state !== NodeState.LEADER) return;

    const otherNodes = Array.from(this.nodes.values()).filter(n => 
      n.id !== leaderId && n.state !== NodeState.DEAD && this.canCommunicate(leaderId, n.id)
    );

    this.emitAnimation('heartbeat_pulse', leaderId, undefined, { 
      term: this.currentTerm,
      targets: otherNodes.map(n => n.id)
    });

    otherNodes.forEach(follower => {
      const leaderLogs = this.logs.get(leaderId) || [];
      const prevLogIndex = (leader.nextIndex[follower.id] || 0) - 1;
      const prevLogTerm = prevLogIndex >= 0 ? leaderLogs[prevLogIndex]?.term || 0 : 0;
      
      const entriesToSend = leaderLogs.slice(leader.nextIndex[follower.id] || 0);

      const appendEntries: Message = {
        id: uuidv4(),
        type: MessageType.APPEND_ENTRIES,
        sourceId: leaderId,
        targetId: follower.id,
        term: this.currentTerm,
        payload: {
          prevLogIndex,
          prevLogTerm,
          entries: entriesToSend,
          leaderCommit: leader.commitIndex
        },
        sendTime: Date.now(),
        receiveTime: Date.now() + this.getMessageDelay(),
        delivered: false,
        dropped: Math.random() < this.config.failureProbability
      };

      if (!appendEntries.dropped) {
        this.queueMessage(appendEntries);
        this.emitAnimation('message_flow', leaderId, follower.id, { 
          type: 'append_entries', 
          term: this.currentTerm,
          entriesCount: entriesToSend.length
        });
      }
    });

    this.emitEvent('heartbeat_send', leaderId, { term: this.currentTerm });
  }

  private handleAppendEntries(msg: Message): void {
    const follower = this.nodes.get(msg.targetId);
    const leader = this.nodes.get(msg.sourceId);
    
    if (!follower || follower.state === NodeState.DEAD) return;

    this.emitEvent('message_receive', msg.targetId, { sourceId: msg.sourceId, type: 'append_entries' });

    if (msg.term < this.currentTerm) {
      this.sendAppendEntriesResponse(msg.targetId, msg.sourceId, msg.term, false, 0, 'Stale term');
      return;
    }

    if (msg.term > this.currentTerm || (follower.state === NodeState.CANDIDATE && msg.term === this.currentTerm)) {
      this.currentTerm = msg.term;
      this.leaderId = msg.sourceId;
    }

    if (follower.state !== NodeState.FOLLOWER) {
      this.emitAnimation('state_change', follower.id, undefined, { from: follower.state, to: NodeState.FOLLOWER });
      follower.state = NodeState.FOLLOWER;
      this.dbService.saveNodeStateSnapshot(follower.id, NodeState.FOLLOWER, this.currentTerm, (this.logs.get(follower.id)?.length || 1) - 1);
    }

    follower.currentTerm = msg.term;
    follower.lastHeartbeat = Date.now();
    follower.electionTimeout = this.getRandomElectionTimeout();
    follower.electionDeadline = Date.now() + follower.electionTimeout;
    this.dbService.updateNodeState(follower);

    this.startElectionTimer(follower.id);

    const prevLogIndex = msg.payload.prevLogIndex as number;
    const prevLogTerm = msg.payload.prevLogTerm as number;
    const entries = msg.payload.entries as LogEntry[];
    const leaderCommit = msg.payload.leaderCommit as number;

    const followerLogs = this.logs.get(follower.id) || [];
    
    const logMatch = this.checkLogMatch(followerLogs, prevLogIndex, prevLogTerm);
    
    if (!logMatch) {
      const conflictingEntry = followerLogs[prevLogIndex];
      if (conflictingEntry) {
        const trimmedLogs = followerLogs.slice(0, prevLogIndex);
        this.logs.set(follower.id, trimmedLogs);
        this.emitEvent('log_replicate', follower.id, { 
          action: 'truncate', 
          fromIndex: prevLogIndex,
          conflictingTerm: conflictingEntry.term
        });
      }
      this.sendAppendEntriesResponse(msg.targetId, msg.sourceId, msg.term, false, prevLogIndex, 'Log mismatch');
      return;
    }

    let lastNewIndex = prevLogIndex;
    if (entries && entries.length > 0) {
      entries.forEach(entry => {
        const existingEntry = followerLogs[entry.logIndex];
        if (existingEntry && existingEntry.term !== entry.term) {
          const trimmedLogs = followerLogs.slice(0, entry.logIndex);
          trimmedLogs.push({ ...entry, nodeId: follower.id });
          this.logs.set(follower.id, trimmedLogs);
          this.dbService.saveLogEntry({ ...entry, nodeId: follower.id });
          this.emitEvent('log_replicate', follower.id, { 
            action: 'overwrite', 
            logIndex: entry.logIndex,
            oldTerm: existingEntry.term,
            newTerm: entry.term
          });
        } else if (!existingEntry) {
          const followerLogsArray = this.logs.get(follower.id) || [];
          followerLogsArray.push({ ...entry, nodeId: follower.id });
          this.dbService.saveLogEntry({ ...entry, nodeId: follower.id });
        }
        lastNewIndex = entry.logIndex;
      });

      this.emitAnimation('log_replicate', msg.sourceId, follower.id, { 
        entriesCount: entries.length,
        lastIndex: lastNewIndex
      });
    }

    if (leaderCommit > follower.commitIndex) {
      const newCommitIndex = Math.min(leaderCommit, lastNewIndex);
      for (let i = follower.commitIndex + 1; i <= newCommitIndex; i++) {
        const log = this.logs.get(follower.id)?.[i];
        if (log) {
          log.committed = true;
          this.dbService.updateLogEntryCommitted(follower.id, i, true);
          this.emitEvent('log_commit', follower.id, { logIndex: i });
        }
      }
      follower.commitIndex = newCommitIndex;
      this.dbService.updateNodeState(follower);
    }

    this.applyCommittedLogs(follower.id);

    this.sendAppendEntriesResponse(msg.targetId, msg.sourceId, msg.term, true, lastNewIndex, '');
  }

  private sendAppendEntriesResponse(
    sourceId: number, 
    targetId: number, 
    term: number, 
    success: boolean, 
    matchIndex: number, 
    reason: string
  ): void {
    const response: Message = {
      id: uuidv4(),
      type: MessageType.APPEND_ENTRIES_RESPONSE,
      sourceId,
      targetId,
      term,
      payload: { success, matchIndex, reason },
      sendTime: Date.now(),
      receiveTime: Date.now() + this.getMessageDelay(),
      delivered: false,
      dropped: Math.random() < this.config.failureProbability
    };

    if (!response.dropped) {
      this.queueMessage(response);
    }
  }

  private handleAppendEntriesResponse(msg: Message): void {
    const leader = this.nodes.get(msg.targetId);
    if (!leader || leader.state !== NodeState.LEADER || msg.term !== this.currentTerm) return;

    const success = msg.payload.success as boolean;
    const matchIndex = msg.payload.matchIndex as number;

    if (success) {
      leader.matchIndex[msg.sourceId] = matchIndex;
      leader.nextIndex[msg.sourceId] = matchIndex + 1;
      
      const quorum = Math.floor(this.nodes.size / 2) + 1;
      for (let n = leader.commitIndex + 1; n <= matchIndex; n++) {
        let count = 1;
        this.nodes.forEach((node, nodeId) => {
          if (nodeId !== leader.id && (leader.matchIndex[nodeId] || -1) >= n) {
            count++;
          }
        });
        
        if (count >= quorum) {
          const leaderLogs = this.logs.get(leader.id) || [];
          if (leaderLogs[n] && leaderLogs[n].term === this.currentTerm) {
            leader.commitIndex = n;
            leaderLogs[n].committed = true;
            this.dbService.updateLogEntryCommitted(leader.id, n, true);
            this.emitEvent('log_commit', leader.id, { logIndex: n });
          }
        }
      }
      
      this.applyCommittedLogs(leader.id);
      this.dbService.updateNodeState(leader);
    } else {
      leader.nextIndex[msg.sourceId] = Math.max(0, (leader.nextIndex[msg.sourceId] || 1) - 1);
    }
  }

  private replicateLog(leaderId: number, entry: LogEntry): void {
    const leader = this.nodes.get(leaderId);
    if (!leader || leader.state !== NodeState.LEADER) return;

    const otherNodes = Array.from(this.nodes.values()).filter(n => 
      n.id !== leaderId && n.state !== NodeState.DEAD && this.canCommunicate(leaderId, n.id)
    );

    otherNodes.forEach(follower => {
      const leaderLogs = this.logs.get(leaderId) || [];
      const prevLogIndex = (leader.nextIndex[follower.id] || 0) - 1;
      const prevLogTerm = prevLogIndex >= 0 ? leaderLogs[prevLogIndex]?.term || 0 : 0;
      
      const appendEntries: Message = {
        id: uuidv4(),
        type: MessageType.APPEND_ENTRIES,
        sourceId: leaderId,
        targetId: follower.id,
        term: this.currentTerm,
        payload: {
          prevLogIndex,
          prevLogTerm,
          entries: [entry],
          leaderCommit: leader.commitIndex
        },
        sendTime: Date.now(),
        receiveTime: Date.now() + this.getMessageDelay(),
        delivered: false,
        dropped: Math.random() < this.config.failureProbability
      };

      if (!appendEntries.dropped) {
        this.queueMessage(appendEntries);
        this.emitAnimation('log_replicate', leaderId, follower.id, { 
          logIndex: entry.logIndex,
          command: entry.command
        });
      }
    });
  }

  private applyCommittedLogs(nodeId: number): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const logs = this.logs.get(nodeId) || [];
    for (let i = node.lastApplied + 1; i <= node.commitIndex; i++) {
      const log = logs[i];
      if (log && !log.applied) {
        log.applied = true;
        this.dbService.updateLogEntryApplied(nodeId, i, true);
        this.emitEvent('log_apply', nodeId, { logIndex: i, command: log.command });
      }
    }
    node.lastApplied = node.commitIndex;
    this.dbService.updateNodeState(node);
  }

  private checkLogMatch(logs: LogEntry[], prevLogIndex: number, prevLogTerm: number): boolean {
    if (prevLogIndex < 0) return true;
    if (prevLogIndex >= logs.length) return false;
    return logs[prevLogIndex].term === prevLogTerm;
  }

  private hasMajority(votes: number): boolean {
    return votes > Math.floor(this.nodes.size / 2);
  }

  private getMessageDelay(): number {
    if (this.messageDelayConfig) {
      const { min, max, disorderRate } = this.messageDelayConfig;
      const baseDelay = Math.floor(Math.random() * (max - min + 1)) + min;
      if (Math.random() < disorderRate) {
        return baseDelay * (1 + Math.random() * 2);
      }
      return baseDelay;
    }
    const { minLatency, maxLatency } = this.config;
    return Math.floor(Math.random() * (maxLatency - minLatency + 1)) + minLatency;
  }

  private queueMessage(msg: Message): void {
    const delay = Math.max(0, msg.receiveTime - Date.now()) / this.simulationSpeed;
    
    setTimeout(() => {
      if (!this.isRunning()) return;
      this.deliverMessage(msg);
    }, delay);
  }

  private deliverMessage(msg: Message): void {
    if (msg.dropped) return;
    
    const source = this.nodes.get(msg.sourceId);
    const target = this.nodes.get(msg.targetId);
    if (!source || !target || source.state === NodeState.DEAD || target.state === NodeState.DEAD) return;
    
    if (!this.canCommunicate(msg.sourceId, msg.targetId)) return;

    msg.delivered = true;

    switch (msg.type) {
      case MessageType.REQUEST_VOTE:
        this.handleRequestVote(msg);
        break;
      case MessageType.REQUEST_VOTE_RESPONSE:
        this.handleVoteResponse(msg);
        break;
      case MessageType.APPEND_ENTRIES:
        this.handleAppendEntries(msg);
        break;
      case MessageType.APPEND_ENTRIES_RESPONSE:
        this.handleAppendEntriesResponse(msg);
        break;
    }
  }

  private startCrashScheduler(): void {
    if (this.crashSchedule.length === 0) return;

    this.crashSchedule.forEach(({ nodeId, delay }) => {
      const timerKey = `crash_${nodeId}_${delay}`;
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timerKey);
        if (!this.isRunning()) return;
        this.crashNode(nodeId);
      }, delay / this.simulationSpeed);
      this.pendingTimers.set(timerKey, timer);
    });
  }

  private scheduleElectionForRandomNode(): void {
    const aliveNodes = Array.from(this.nodes.values()).filter(n => 
      n.state !== NodeState.DEAD && !n.isPartitioned
    );
    if (aliveNodes.length === 0) return;

    const randomNode = aliveNodes[Math.floor(Math.random() * aliveNodes.length)];
    randomNode.electionDeadline = Date.now() + randomNode.electionTimeout;
    this.startElectionTimer(randomNode.id);
  }

  private emitEvent(type: EventType, nodeId: number | null, data: Record<string, unknown>): void {
    const event: ClusterEvent = {
      clusterId: this.clusterId,
      type,
      nodeId,
      term: this.currentTerm,
      data,
      timestamp: Date.now()
    };
    this.dbService.saveEvent(event);
    this.callbacks.onEvent(event);
  }

  private emitAnimation(
    type: AnimationEventType, 
    sourceNodeId?: number, 
    targetNodeId?: number, 
    data?: Record<string, unknown>
  ): void {
    const animation: AnimationEvent = {
      type,
      sourceNodeId,
      targetNodeId,
      data: data || {},
      duration: 500,
      timestamp: Date.now()
    };
    this.callbacks.onAnimation(animation);
  }

  getStats(): Record<string, unknown> {
    const nodes = Array.from(this.nodes.values());
    return {
      totalNodes: nodes.length,
      aliveNodes: nodes.filter(n => n.state !== NodeState.DEAD).length,
      deadNodes: nodes.filter(n => n.state === NodeState.DEAD).length,
      leaderId: this.leaderId,
      currentTerm: this.currentTerm,
      partitionedNodes: nodes.filter(n => n.isPartitioned).length,
      totalLogs: Array.from(this.logs.values()).reduce((sum, logs) => sum + logs.length, 0),
      committedLogs: Array.from(this.logs.values()).reduce((sum, logs) => 
        sum + logs.filter(l => l.committed).length, 0
      ),
      appliedLogs: Array.from(this.logs.values()).reduce((sum, logs) => 
        sum + logs.filter(l => l.applied).length, 0
      )
    };
  }

  reset(): void {
    this.stop();
    this.nodes.clear();
    this.logs.clear();
    this.messageQueue = [];
    this.currentTerm = 0;
    this.leaderId = null;
    this.partitionGroups = [];
    this.crashSchedule = [];
    this.inconsistentLogNodes = [];
    this.messageDelayConfig = null;
  }
}
