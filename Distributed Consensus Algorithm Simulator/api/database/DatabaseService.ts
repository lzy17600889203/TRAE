import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';
import type { ClusterConfig, ClusterEvent, LogEntry, Node, NodeState } from '../../shared/types.js';

let SQL: SqlJsStatic | null = null;

async function initDatabase(): Promise<Database> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return new SQL.Database();
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS cluster (
    id TEXT PRIMARY KEY,
    node_count INTEGER NOT NULL DEFAULT 5,
    min_latency INTEGER NOT NULL DEFAULT 50,
    max_latency INTEGER NOT NULL DEFAULT 200,
    failure_probability REAL NOT NULL DEFAULT 0.0,
    heartbeat_interval INTEGER NOT NULL DEFAULT 150,
    election_timeout_min INTEGER NOT NULL DEFAULT 300,
    election_timeout_max INTEGER NOT NULL DEFAULT 600,
    status TEXT NOT NULL DEFAULT 'idle',
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS node (
    id INTEGER PRIMARY KEY,
    cluster_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'follower',
    current_term INTEGER NOT NULL DEFAULT 0,
    voted_for INTEGER,
    commit_index INTEGER NOT NULL DEFAULT 0,
    last_applied INTEGER NOT NULL DEFAULT 0,
    last_heartbeat INTEGER NOT NULL,
    election_timeout INTEGER NOT NULL,
    is_partitioned INTEGER NOT NULL DEFAULT 0,
    partition_group INTEGER NOT NULL DEFAULT 0,
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (cluster_id) REFERENCES cluster(id)
);

CREATE TABLE IF NOT EXISTS log_entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    log_index INTEGER NOT NULL,
    term INTEGER NOT NULL,
    command TEXT NOT NULL,
    committed INTEGER NOT NULL DEFAULT 0,
    applied INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (node_id) REFERENCES node(id),
    UNIQUE(node_id, log_index)
);

CREATE TABLE IF NOT EXISTS node_state_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    state TEXT NOT NULL,
    term INTEGER NOT NULL,
    log_index INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (node_id) REFERENCES node(id)
);

CREATE TABLE IF NOT EXISTS cluster_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id TEXT NOT NULL,
    type TEXT NOT NULL,
    node_id INTEGER,
    term INTEGER NOT NULL,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (cluster_id) REFERENCES cluster(id)
);

CREATE INDEX IF NOT EXISTS idx_node_cluster ON node(cluster_id);
CREATE INDEX IF NOT EXISTS idx_log_node ON log_entry(node_id);
CREATE INDEX IF NOT EXISTS idx_log_index ON log_entry(node_id, log_index);
CREATE INDEX IF NOT EXISTS idx_event_cluster ON cluster_event(cluster_id);
CREATE INDEX IF NOT EXISTS idx_event_time ON cluster_event(timestamp);
CREATE INDEX IF NOT EXISTS idx_snapshot_node ON node_state_snapshot(node_id);
`;

export class DatabaseService {
  private db: Database | null = null;

  async initialize(): Promise<void> {
    this.db = await initDatabase();
    this.db.run(SCHEMA_SQL);
  }

  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  saveCluster(clusterId: string, config: ClusterConfig, status: string, createdAt: number): void {
    const db = this.getDatabase();
    db.run(
      `INSERT OR REPLACE INTO cluster (id, node_count, min_latency, max_latency, failure_probability, heartbeat_interval, election_timeout_min, election_timeout_max, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clusterId,
        config.nodeCount,
        config.minLatency,
        config.maxLatency,
        config.failureProbability,
        config.heartbeatInterval,
        config.electionTimeoutMin,
        config.electionTimeoutMax,
        status,
        createdAt
      ]
    );
  }

  updateClusterStatus(clusterId: string, status: string): void {
    const db = this.getDatabase();
    db.run(`UPDATE cluster SET status = ? WHERE id = ?`, [status, clusterId]);
  }

  saveNode(node: Node): void {
    const db = this.getDatabase();
    const now = Date.now();
    db.run(
      `INSERT OR REPLACE INTO node (id, cluster_id, state, current_term, voted_for, commit_index, last_applied, last_heartbeat, election_timeout, is_partitioned, partition_group, position_x, position_y, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        node.id,
        node.clusterId,
        node.state,
        node.currentTerm,
        node.votedFor,
        node.commitIndex,
        node.lastApplied,
        node.lastHeartbeat,
        node.electionTimeout,
        node.isPartitioned ? 1 : 0,
        node.partitionGroup,
        node.position.x,
        node.position.y,
        now,
        now
      ]
    );
  }

  saveNodes(nodes: Node[]): void {
    nodes.forEach(node => this.saveNode(node));
  }

  updateNodeState(node: Node): void {
    const db = this.getDatabase();
    const now = Date.now();
    db.run(
      `UPDATE node SET state = ?, current_term = ?, voted_for = ?, commit_index = ?, last_applied = ?, last_heartbeat = ?, is_partitioned = ?, partition_group = ?, updated_at = ?
       WHERE id = ?`,
      [
        node.state,
        node.currentTerm,
        node.votedFor,
        node.commitIndex,
        node.lastApplied,
        node.lastHeartbeat,
        node.isPartitioned ? 1 : 0,
        node.partitionGroup,
        now,
        node.id
      ]
    );
  }

  saveLogEntry(entry: LogEntry): void {
    const db = this.getDatabase();
    db.run(
      `INSERT OR REPLACE INTO log_entry (node_id, log_index, term, command, committed, applied, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.nodeId,
        entry.logIndex,
        entry.term,
        entry.command,
        entry.committed ? 1 : 0,
        entry.applied ? 1 : 0,
        entry.timestamp
      ]
    );
  }

  saveLogEntries(entries: LogEntry[]): void {
    entries.forEach(entry => this.saveLogEntry(entry));
  }

  updateLogEntryCommitted(nodeId: number, logIndex: number, committed: boolean): void {
    const db = this.getDatabase();
    db.run(
      `UPDATE log_entry SET committed = ? WHERE node_id = ? AND log_index = ?`,
      [committed ? 1 : 0, nodeId, logIndex]
    );
  }

  updateLogEntryApplied(nodeId: number, logIndex: number, applied: boolean): void {
    const db = this.getDatabase();
    db.run(
      `UPDATE log_entry SET applied = ? WHERE node_id = ? AND log_index = ?`,
      [applied ? 1 : 0, nodeId, logIndex]
    );
  }

  saveNodeStateSnapshot(nodeId: number, state: string, term: number, logIndex: number): void {
    const db = this.getDatabase();
    db.run(
      `INSERT INTO node_state_snapshot (node_id, state, term, log_index, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [nodeId, state, term, logIndex, Date.now()]
    );
  }

  saveEvent(event: ClusterEvent): void {
    const db = this.getDatabase();
    db.run(
      `INSERT INTO cluster_event (cluster_id, type, node_id, term, data, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event.clusterId,
        event.type,
        event.nodeId,
        event.term,
        JSON.stringify(event.data),
        event.timestamp
      ]
    );
  }

  saveEvents(events: ClusterEvent[]): void {
    events.forEach(event => this.saveEvent(event));
  }

  getClusterConfig(clusterId: string): ClusterConfig | null {
    const db = this.getDatabase();
    const results = db.exec(
      `SELECT * FROM cluster WHERE id = ?`,
      [clusterId]
    );
    if (results.length === 0 || results[0].values.length === 0) return null;
    const row = results[0].values[0];
    const columns = results[0].columns;
    const idx = (name: string) => columns.indexOf(name);
    return {
      nodeCount: row[idx('node_count')] as number,
      minLatency: row[idx('min_latency')] as number,
      maxLatency: row[idx('max_latency')] as number,
      failureProbability: row[idx('failure_probability')] as number,
      heartbeatInterval: row[idx('heartbeat_interval')] as number,
      electionTimeoutMin: row[idx('election_timeout_min')] as number,
      electionTimeoutMax: row[idx('election_timeout_max')] as number
    };
  }

  getNodes(clusterId: string): Node[] {
    const db = this.getDatabase();
    const results = db.exec(
      `SELECT * FROM node WHERE cluster_id = ? ORDER BY id`,
      [clusterId]
    );
    if (results.length === 0) return [];
    const columns = results[0].columns;
    const idx = (name: string) => columns.indexOf(name);
    return results[0].values.map(row => ({
      id: row[idx('id')] as number,
      clusterId: row[idx('cluster_id')] as string,
      state: row[idx('state')] as NodeState,
      currentTerm: row[idx('current_term')] as number,
      votedFor: row[idx('voted_for')] as number | null,
      commitIndex: row[idx('commit_index')] as number,
      lastApplied: row[idx('last_applied')] as number,
      nextIndex: {},
      matchIndex: {},
      lastHeartbeat: row[idx('last_heartbeat')] as number,
      electionTimeout: row[idx('election_timeout')] as number,
      electionDeadline: 0,
      isPartitioned: (row[idx('is_partitioned')] as number) === 1,
      partitionGroup: row[idx('partition_group')] as number,
      votesReceived: new Set(),
      position: {
        x: row[idx('position_x')] as number,
        y: row[idx('position_y')] as number
      }
    }));
  }

  getLogEntries(nodeId: number): LogEntry[] {
    const db = this.getDatabase();
    const results = db.exec(
      `SELECT * FROM log_entry WHERE node_id = ? ORDER BY log_index`,
      [nodeId]
    );
    if (results.length === 0) return [];
    const columns = results[0].columns;
    const idx = (name: string) => columns.indexOf(name);
    return results[0].values.map(row => ({
      id: row[idx('id')] as number,
      nodeId: row[idx('node_id')] as number,
      logIndex: row[idx('log_index')] as number,
      term: row[idx('term')] as number,
      command: row[idx('command')] as string,
      committed: (row[idx('committed')] as number) === 1,
      applied: (row[idx('applied')] as number) === 1,
      timestamp: row[idx('timestamp')] as number
    }));
  }

  getEvents(clusterId: string, limit: number = 100): ClusterEvent[] {
    const db = this.getDatabase();
    const results = db.exec(
      `SELECT * FROM cluster_event WHERE cluster_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [clusterId, limit]
    );
    if (results.length === 0) return [];
    const columns = results[0].columns;
    const idx = (name: string) => columns.indexOf(name);
    return results[0].values.map(row => ({
      id: row[idx('id')] as number,
      clusterId: row[idx('cluster_id')] as string,
      type: row[idx('type')] as string,
      nodeId: row[idx('node_id')] as number | null,
      term: row[idx('term')] as number,
      data: JSON.parse(row[idx('data')] as string),
      timestamp: row[idx('timestamp')] as number
    }));
  }

  export(): Uint8Array {
    const db = this.getDatabase();
    return db.export();
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
