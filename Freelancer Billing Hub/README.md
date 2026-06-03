# 接单小助手 · Freelancer Billing Hub

专门给接私活的开发者用的「工时 & 账单管理工具」。

- 按 **客户 / 项目** 分类记录每日工时
- 支持按时计费 (`hourly`) 与按件计费 (`flat`) 两种模式
- 月底一键生成账单，自动按工时 × 时薪（或固定单价）算钱
- 数据持久化到本地 **SQLite** (better-sqlite3)
- 提供 **5 个一键切换的演示场景**：
  1. 大客户按月结算
  2. 小客户按件计费
  3. 连续加班疯狂爆肝
  4. 客户拖欠尾款半年
  5. 跨时区项目时间算错
- **时钟指针实时滴答动画** + **账单生成硬币掉落特效**
- 鲁棒输入校验：25 小时 / 负数时薪 等瞎输入不会搞崩页面（自动钳制 + 友好提示）

---

## 技术栈

- **后端**：Node.js + Fastify 5 + better-sqlite3 12
- **前端**：Angular 17 (CDN UMD) + 原生 CSS
- **数据**：SQLite (`server/data/billing.db`)

## 运行

### 1. 启动后端 API (端口 4000)

```bash
cd server
npm install
npm start
```

启动后会自动预置「大客户按月结算」作为默认场景。

### 2. 打开前端

直接在浏览器打开 `web/index.html` 即可；

或者起一个本地静态服务器（推荐，避免 CORS 小问题）：

```bash
# 任选其一
npx serve web
# 或
cd web && python3 -m http.server 8080
```

然后访问 http://localhost:8080

> 如果前后端不同源，浏览器会自动触发 CORS；后端 `@fastify/cors` 已经开启 `origin: true` 允许所有来源。

---

## 主要路由

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET  | `/api/clients` | 客户列表 |
| POST | `/api/clients` | 新增客户 `{ name, contact }` |
| GET  | `/api/projects/detail` | 项目列表（含客户名 / 时薪 / 计费方式） |
| POST | `/api/projects` | 新增项目 `{ client_id, name, rate, billing_mode }` |
| GET  | `/api/time-entries` | 最近工时记录 |
| POST | `/api/time-entries` | 新增工时 `{ project_id, work_date, hours, description }`（**自动钳制 0~24h**） |
| GET  | `/api/invoices` | 账单列表（可传 `?status=unpaid` 过滤） |
| POST | `/api/invoices/generate` | 按月生成/刷新账单 `{ project_id, year, month }` |
| PATCH| `/api/invoices/:id` | 更新账单状态/备注 `{ status, note }` |
| DELETE | `/api/invoices/:id` | 删除账单 |
| GET  | `/api/summary` | 汇总 `{ totalHours, totalAmount, unpaid, invoiceCount }` |
| POST | `/api/scenarios/load` | 切换演示场景 `{ key: "big-monthly" | "small-flat" | "overtime-crazy" | "overdue-half-year" | "timezone-mistake" }` |
| POST | `/api/reset` | 重置并加载默认场景 |

---

## 鲁棒性演示

- 工时输入 `25` → 自动修正为 `24` 并显示红色提示条；表格 / 汇总数值不会出现非法值
- 时薪输入 `-50` → 自动修正为 `0` 并给出 Toast 提示
- 账单表格长字符串通过 CSS `overflow-x: auto` 横向滚动，不会撑爆布局
- HTTP 请求失败会被统一捕获并通过 Toast 展示，不影响其他操作

## 硬币掉落动画

每次点击「生成账单」会在页面上方随机位置掉落下 18 枚金色硬币，伴随弹跳与旋转。
