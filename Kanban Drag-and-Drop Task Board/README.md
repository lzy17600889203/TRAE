# Kanban Drag & Drop Task Board

基于 **Next.js 14 (App Router) + Fastify 4 + SQLite (better-sqlite3)** 的经典看板任务管理系统。

## 功能一览

- 多列看板（待办 / 进行中 / 已完成），原生 HTML5 拖拽
- 半透明浮起阴影、放置槽磁吸高亮、状态线条划过、新增弹性缩放、排序平滑位移 等动画
- 后端维护 `sort_index` 排序索引与 `task_logs` 操作日志
- SQLite 持久化存储看板结构、卡片详情及操作者修改记录
- 四个预设场景一键加载：
  - 单列堆积 — 100 张卡片
  - 深层子任务 — 15 层父子链
  - 高频拖拽冲突 — 30 张 × 15 次并发移动
  - 循环依赖阻塞 — A→B→C→A
- 三个可切换的“异常开关”：
  - 索引错位 (+1) — 拖拽落位偏移，直观观察 index 计算错误
  - 并发覆盖写 — 更新描述被注入标记，模拟状态覆盖丢失
  - 随机拖拽丢弃 — 预留扩展位

## 目录结构

```
.
├── server/                Fastify + better-sqlite3 后端
│   ├── src/
│   │   ├── index.ts       路由入口
│   │   ├── db.ts          SQLite 建表与基础工具
│   │   ├── tasks.ts       任务 CRUD / 移动 / 重排 / 日志
│   │   ├── bugs.ts        异常开关
│   │   └── scenarios.ts   四大预设场景
│   └── package.json
├── web/                   Next.js 14 (App Router) 前端
│   ├── app/
│   │   ├── page.tsx       看板页面
│   │   ├── Board.tsx      看板 + 拖拽
│   │   ├── AddCardBar.tsx 新增卡片条
│   │   ├── ScenarioBar.tsx 预设场景 / 异常开关
│   │   ├── LogPanel.tsx   变更日志侧栏
│   │   └── useTasks.ts    数据 Hook + API
│   └── package.json
└── package.json           并发启动脚本
```

## 安装

```bash
# 一键安装根依赖 + server 依赖 + web 依赖
npm run install:all
```

## 启动

```bash
# 同时启动前后端（server :4000, web :3000）
npm run dev
```

或分别启动：

```bash
npm run dev:server   # http://localhost:4000
npm run dev:web      # http://localhost:3000
```

## API

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET  | `/api/tasks` | 列出所有任务 |
| GET  | `/api/tasks/:id` | 单条任务 |
| POST | `/api/tasks` | 创建任务 |
| PATCH| `/api/tasks/:id` | 更新任务 |
| DELETE | `/api/tasks/:id` | 删除任务 |
| POST | `/api/tasks/:id/move` | `{ to_column, to_index }` |
| POST | `/api/scenarios` | `{ name }` 加载预设场景 |
| GET  | `/api/logs` | 变更日志（`?task_id=&limit=`） |
| GET  | `/api/bugs` | 当前异常开关状态 |
| POST | `/api/bugs/:name` | `{ value: true/false }` |

## 异常/边界观察指南

1. **开启 “索引错位” 开关**：拖拽任意卡片，落位位置会比实际计算的索引多 1，直观看到排序抖动。
2. **开启 “并发覆盖写” 开关**：双击卡片修改描述，会看到内容被加上 `[OVERWRITTEN by concurrent bug]` 前缀。
3. **加载 “单列堆积”**：在 100 张卡片的列中快速拖拽，可观察到大量 DOM 重排带来的掉帧。
4. **加载 “高频拖拽冲突”**：后端连续发起 15 次移动，可在日志中看到顺序交错与覆盖。
5. **加载 “循环依赖阻塞”**：卡片上会出现 `阻塞于 A/B/C` 标记。
