# 装修记账本

Angular（前端） + Fastify（后端） + better-sqlite3（本地 SQLite）装修记账应用。

## 项目结构

- `server/` — 后端：Fastify + better-sqlite3，启动即生成 SQLite（`server/renovation.db`）
- `web/` — 前端：Angular 18，使用 standalone 组件

## 一键启动

打开两个终端，分别执行：

**终端 1 — 后端（端口 3100）**

```bash
cd server
npm install   # 首次安装
npm start
```

后端启动后会：
1. 创建并初始化 `renovation.db`
2. 自动写入 5 个一键体验场景的假数据
3. 监听 http://localhost:3100

**终端 2 — 前端（端口默认由 Angular CLI 分配）**

```bash
cd web
npm install   # 首次安装
npm start     # 访问 http://localhost:4200
```

前端已配置 `proxy.conf.json`，将 `/api/*` 转发到 `http://localhost:3100`。

## 功能亮点

- **五个一键体验场景**：预算充足土豪装修、边装边改严重超支、买错材料疯狂退货、停工半个月没动静、硬装结束软装还没买。
- **大阶段 + 细项开销**：每个阶段下可自由添加、编辑、删除多项具体开销。
- **计划 vs 实际对比**：每个阶段、总览都有对比，超支时数字变红并抖动（CSS shake 动画）。
- **卷尺风格进度条**：`TapeBarComponent` 实现“像拉开卷尺一样”的动画效果（黄色刻度 → 红色超支）。
- **奇葩输入友好**：计划金额为 0、实际金额为负数或空值都不会报错，只会给提示，进度条正常显示。
- **本地持久化**：所有数据都保存在 `server/renovation.db`，可安全删除重新生成（点前端“🔄 重新生成演示数据”即可）。

## API 速览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/scenarios` | 列出所有场景 |
| GET | `/api/scenarios/:key` | 场景详情（包含阶段 + 开销） |
| POST | `/api/seed` | 重新生成演示数据 |
| POST | `/api/scenarios/:key/stages` | 为该场景新增一个阶段 |
| PUT | `/api/stages/:id` | 修改阶段 |
| DELETE | `/api/stages/:id` | 删除阶段（级联删除开销） |
| POST | `/api/stages/:id/expenses` | 新增开销 |
| PUT | `/api/expenses/:id` | 修改开销 |
| DELETE | `/api/expenses/:id` | 删除开销 |
