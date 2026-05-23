import type { PresetScenario, ClusterConfig } from '../../shared/types.js';

export const DEFAULT_CONFIG: ClusterConfig = {
  nodeCount: 5,
  minLatency: 50,
  maxLatency: 200,
  failureProbability: 0.0,
  heartbeatInterval: 150,
  electionTimeoutMin: 300,
  electionTimeoutMax: 600
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    name: 'network_split',
    description: '网络分区脑裂场景',
    icon: 'split',
    config: {
      nodeCount: 5,
      minLatency: 100,
      maxLatency: 300,
      failureProbability: 0.1,
      heartbeatInterval: 150,
      electionTimeoutMin: 300,
      electionTimeoutMax: 600
    },
    partitions: [[0, 1], [2, 3, 4]]
  },
  {
    name: 'leader_crash',
    description: 'Leader节点频繁崩溃场景',
    icon: 'crash',
    config: {
      nodeCount: 5,
      minLatency: 50,
      maxLatency: 200,
      failureProbability: 0.05,
      heartbeatInterval: 150,
      electionTimeoutMin: 300,
      electionTimeoutMax: 600
    },
    crashSchedule: [
      { nodeId: 0, delay: 2000 },
      { nodeId: 1, delay: 6000 },
      { nodeId: 2, delay: 10000 }
    ]
  },
  {
    name: 'log_inconsistency',
    description: '日志不一致强制覆盖场景',
    icon: 'log',
    config: {
      nodeCount: 5,
      minLatency: 80,
      maxLatency: 250,
      failureProbability: 0.0,
      heartbeatInterval: 150,
      electionTimeoutMin: 300,
      electionTimeoutMax: 600
    },
    inconsistentLogs: [
      { nodeId: 2, missingEntries: 3 },
      { nodeId: 3, missingEntries: 5 },
      { nodeId: 4, missingEntries: 2 }
    ]
  },
  {
    name: 'message_disorder',
    description: '消息严重乱序延迟场景',
    icon: 'shuffle',
    config: {
      nodeCount: 5,
      minLatency: 200,
      maxLatency: 500,
      failureProbability: 0.15,
      heartbeatInterval: 150,
      electionTimeoutMin: 400,
      electionTimeoutMax: 800
    },
    messageDelay: {
      min: 300,
      max: 1000,
      disorderRate: 0.5
    }
  }
];

export function getScenario(name: string): PresetScenario | undefined {
  return PRESET_SCENARIOS.find(s => s.name === name);
}

export function getScenarioNames(): string[] {
  return PRESET_SCENARIOS.map(s => s.name);
}
