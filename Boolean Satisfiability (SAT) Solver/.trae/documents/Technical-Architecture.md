# SAT 求解器可视化系统 - 技术架构文档

## 1. 系统架构概述

### 1.1 架构风格
- **前后端分离架构** (Frontend-Backend Separation)
- **RESTful API** 通信模式
- **事件驱动** 的算法状态更新

### 1.2 整体架构图
```
┌──────────────────────────────────────────────────────────────┐
│                        客户端 (Vue 3)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   输入组件   │  │  可视化组件  │  │     控制组件        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          ▼                                    │
│                  ┌─────────────────┐                         │
│                  │   Pinia Store   │                         │
│                  └────────┬────────┘                         │
│                           │ WebSocket/REST                   │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      后端 (Fastify)                          │
│                           ▼                                   │
│                  ┌─────────────────┐                         │
│                  │   API Routes    │                         │
│                  └────────┬────────┘                         │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐                 │
│         ▼                 ▼                 ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │ CDCL Solver │  │ Parser Module│  │  Stats Module   │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
│                           │                                   │
│                           ▼                                   │
│                  ┌─────────────────┐                         │
│                  │   SQLite DB     │                         │
│                  │ (better-sqlite3) │                         │
│                  └─────────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 前端架构设计 (Vue 3)

### 2.1 目录结构
```
client/
├── src/
│   ├── components/
│   │   ├── InputPanel.vue          # 公式输入面板
│   │   ├── DimacsImporter.vue      # DIMACS 导入器
│   │   ├── PresetButtons.vue       # 预设场景按钮
│   │   ├── ControlPanel.vue        # 控制面板
│   │   ├── DecisionTree.vue        # 决策树主组件
│   │   ├── TreeNode.vue            # 树节点组件
│   │   ├── ClauseList.vue          # 子句列表
│   │   ├── VariablePanel.vue        # 变量状态面板
│   │   ├── StatsPanel.vue           # 统计面板
│   │   └── LogViewer.vue           # 日志查看器
│   ├── stores/
│   │   ├── solverStore.ts          # 求解器状态管理
│   │   └── animationStore.ts       # 动画状态管理
│   ├── composables/
│   │   ├── useSolver.ts            # 求解器交互逻辑
│   │   ├── useAnimation.ts         # 动画控制逻辑
│   │   └── useTreeLayout.ts        # 树形布局计算
│   ├── utils/
│   │   ├── parser.ts               # 前端解析工具
│   │   └── constants.ts            # 常量定义
│   ├── types/
│   │   └── index.ts                # TypeScript 类型定义
│   ├── App.vue
│   ├── main.ts
│   └── style.scss
├── package.json
└── vite.config.ts
```

### 2.2 Pinia Store 设计

#### solverStore
```typescript
interface SolverState {
  formula: Clause[];
  variables: Map<number, VariableState>;
  decisions: DecisionNode[];
  currentLevel: number;
  learnedClauses: Clause[];
  stats: SolverStats;
  status: 'idle' | 'running' | 'paused' | 'solved' | 'unsolved' | 'timeout';
  error: string | null;
}
```

#### animationStore
```typescript
interface AnimationState {
  isAnimating: boolean;
  speed: 'slow' | 'normal' | 'fast';
  pendingAnimations: Animation[];
  currentAnimation: Animation | null;
}
```

### 2.3 核心组件职责

| 组件 | 职责 |
|------|------|
| InputPanel | 手动输入 CNF 公式 |
| DimacsImporter | 解析 DIMACS 格式输入 |
| DecisionTree | 决策树 SVG 渲染与布局 |
| TreeNode | 单个决策节点渲染 |
| ControlPanel | 开始/暂停/单步控制 |
| StatsPanel | 实时统计显示 |

---

## 3. 后端架构设计 (Fastify)

### 3.1 目录结构
```
server/
├── src/
│   ├── routes/
│   │   ├── solver.ts              # 求解 API
│   │   ├── formula.ts             # 公式 API
│   │   └── database.ts            # 数据库 API
│   ├── solvers/
│   │   ├── cdcl.ts                # CDCL 主算法
│   │   ├── parser.ts              # CNF/DIMACS 解析
│   │   ├── clause.ts              # 子句数据结构
│   │   ├── implicationGraph.ts    # 蕴含图
│   │   └── heuristics.ts          # 决策启发式
│   ├── db/
│   │   ├── index.ts               # 数据库初始化
│   │   ├── clauses.ts             # 子句存储
│   │   └── logs.ts                # 决策日志
│   ├── types/
│   │   └── index.ts               # 共享类型
│   ├── app.ts                     # Fastify 应用入口
│   └── server.ts                  # 服务器启动
├── data/                          # SQLite 数据库文件
├── package.json
└── tsconfig.json
```

### 3.2 API 设计

#### 公式管理 API
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/formula/parse` | 解析 CNF 公式 |
| POST | `/api/formula/dimacs` | 解析 DIMACS 格式 |
| GET | `/api/formula/:id` | 获取公式详情 |

#### 求解器 API
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/solver/init` | 初始化求解器 |
| POST | `/api/solver/step` | 单步执行 |
| POST | `/api/solver/run` | 连续执行 |
| POST | `/api/solver/pause` | 暂停执行 |
| POST | `/api/solver/stop` | 停止执行 |
| GET | `/api/solver/state` | 获取当前状态 |
| GET | `/api/solver/stats` | 获取统计数据 |

#### 数据库 API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/db/clauses` | 获取所有子句 |
| GET | `/api/db/logs` | 获取决策日志 |
| DELETE | `/api/db/logs` | 清空日志 |

### 3.3 数据模型

#### SQLite Schema
```sql
-- 公式表
CREATE TABLE formulas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  dimacs TEXT,
  variable_count INTEGER,
  clause_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 子句表
CREATE TABLE clauses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  formula_id INTEGER,
  literals TEXT,  -- JSON 数组
  is_learned BOOLEAN DEFAULT FALSE,
  activity REAL DEFAULT 0.0,
  reason TEXT,  -- 冲突来源或 null
  level INTEGER,  -- 添加层级
  FOREIGN KEY (formula_id) REFERENCES formulas(id)
);

-- 决策日志表
CREATE TABLE decision_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  formula_id INTEGER,
  step INTEGER,
  type TEXT,  -- 'decision', 'propagation', 'conflict', 'backtrack', 'learn'
  variable INTEGER,
  value INTEGER,  -- 1 或 -1
  level INTEGER,
  clause_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (formula_id) REFERENCES formulas(id)
);

-- 索引
CREATE INDEX idx_clauses_formula ON clauses(formula_id);
CREATE INDEX idx_clauses_learned ON clauses(is_learned);
CREATE INDEX idx_logs_formula ON decision_logs(formula_id);
CREATE INDEX idx_logs_step ON decision_logs(step);
```

---

## 4. CDCL 算法实现

### 4.1 核心数据结构

```typescript
// 文字：正数为变量 x，负数为 -x
type Literal = number;  // e.g., 1 = x1, -1 = -x1

// 子句
interface Clause {
  id: number;
  literals: Literal[];
  isLearned: boolean;
  activity: number;
  lbd: number;  // Literal Block Distance
}

// 变量状态
interface Variable {
  value: 0 | 1 | -1;  // 0=未赋值, 1=true, -1=false
  level: number;       // 决策层级
  reason: Clause | null;  // 蕴含原因
}

// 决策节点
interface Decision {
  level: number;
  variable: number;
  value: 1 | -1;
  assignment: Map<number, Variable>;
}
```

### 4.2 CDCL 算法流程

```
function CDCL():
    while true:
        // 1. 单元传播
        conflict = propagate()
        if conflict != null:
            // 2. 冲突处理
            if current_level == 0:
                return UNSAT
            
            // 分析冲突，学习新子句
            clause = analyze(conflict)
            backtrack(clause)
        else:
            // 3. 选择决策变量
            if allVariablesAssigned():
                return SAT
            
            var = selectVariable()
            makeDecision(var, value)
            incrementLevel()
```

### 4.3 关键子算法

| 子算法 | 描述 |
|--------|------|
| `propagate()` | BCP (Boolean Constraint Propagation) |
| `analyze()` | 冲突分析，生成学习子句 |
| `backtrack()` | 回跳到适当的决策层级 |
| `selectVariable()` | VSIDS 启发式选择 |
| `decayActivity()` | 活跃度衰减 |
| `restart()` | 重启搜索 |

---

## 5. 动画系统设计

### 5.1 动画类型枚举

```typescript
enum AnimationType {
  DECISION_BRANCH = 'decision_branch',      // 决策分支延伸
  SATISFACTION_CHECK = 'satisfaction_check', // 子句满足检查
  CONFLICT_FLASH = 'conflict_flash',         // 冲突闪烁
  BACKTRACK_ERASE = 'backtrack_erase',       // 回溯擦除
  VARIABLE_SWITCH = 'variable_switch',      // 变量开关
  LEARNED_CLAUSE_ADD = 'learned_clause_add'  // 学习子句添加
}
```

### 5.2 动画队列系统

```typescript
interface Animation {
  id: string;
  type: AnimationType;
  data: any;
  duration: number;
  easing: string;
  onStart?: () => void;
  onComplete?: () => void;
}

class AnimationManager {
  queue: Animation[];
  currentAnimation: Animation | null;
  
  add(animation: Animation): void;
  play(): void;
  pause(): void;
  skip(): void;
}
```

### 5.3 动画时长配置

```typescript
const ANIMATION_DURATIONS = {
  [AnimationType.DECISION_BRANCH]: 300,
  [AnimationType.SATISFACTION_CHECK]: 200,
  [AnimationType.CONFLICT_FLASH]: 150,
  [AnimationType.BACKTRACK_ERASE]: 400,
  [AnimationType.VARIABLE_SWITCH]: 250,
  [AnimationType.LEARNED_CLAUSE_ADD]: 350
};

const EASING_FUNCTIONS = {
  branch: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  conflict: 'ease-in-out',
  switch: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};
```

---

## 6. 预设场景数据

### 6.1 场景一：不可满足矛盾
```cnf
p cnf 2 4
1 2 0
-1 2 0
1 -2 0
-1 -2 0
```

### 6.2 场景二：组合爆炸
```cnf
p cnf 20 100
1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 0
... (98 more random clauses)
```

### 6.3 场景三：单元传播链
```cnf
p cnf 10 11
1 0
-1 2 0
-2 3 0
-3 4 0
-4 5 0
-5 6 0
-6 7 0
-7 8 0
-8 9 0
-9 10 0
-10 0
```

### 6.4 场景四：纯文字消除
```cnf
p cnf 8 12
1 2 3 0
-1 4 0
1 -4 5 0
-1 6 0
2 7 0
-2 8 0
1 2 0
-1 -2 0
3 4 0
-3 -4 0
5 6 0
-5 -6 0
```

---

## 7. 异常处理机制

### 7.1 超时检测
```typescript
const TIMEOUT_THRESHOLD = 30000; // 30秒

function checkTimeout(startTime: number): boolean {
  return Date.now() - startTime > TIMEOUT_THRESHOLD;
}
```

### 7.2 回溯深度监控
```typescript
const MAX_BACKTRACK_DEPTH = 1000;

interface BacktrackMonitor {
  currentDepth: number;
  maxDepth: number;
  threshold: number;
  
  record(decision: Decision): void;
  shouldWarn(): boolean;
  shouldAbort(): boolean;
}
```

### 7.3 内存监控
```typescript
const MEMORY_WARNING_THRESHOLD = 0.8;
const MEMORY_CRITICAL_THRESHOLD = 0.9;

function checkMemoryUsage(): 'normal' | 'warning' | 'critical' {
  // 使用 process.memoryUsage() 或浏览器 API
  const usage = getMemoryUsage();
  const ratio = usage.heapUsed / usage.heapTotal;
  
  if (ratio >= MEMORY_CRITICAL_THRESHOLD) return 'critical';
  if (ratio >= MEMORY_WARNING_THRESHOLD) return 'warning';
  return 'normal';
}
```

---

## 8. 部署架构

### 8.1 开发环境
- 前端：`http://localhost:5173` (Vite Dev Server)
- 后端：`http://localhost:3000` (Fastify)
- API 代理配置

### 8.2 生产环境
- 前端静态资源打包
- PM2 进程管理后端
- Nginx 反向代理

### 8.3 开发脚本
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build"
  }
}
```
