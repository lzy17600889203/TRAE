# 正则表达式可视化调试器

基于 Vue 3 + Fastify + SQLite (sql.js) 的可视化正则表达式构建与调试工具。

## 功能特性

### 核心功能
- **FSM 有限状态机可视化**: 基于有限状态机原理逐步解析正则语法树
- **匹配步骤追踪**: 实时显示每一步的匹配状态
- **语法树可视化**: 支持展开/折叠的正则语法树展示
- **预设场景**: 内置四个典型测试场景

### 四个预设场景
1. **贪婪匹配陷阱场景** - 演示贪婪与非贪婪模式的差异
2. **回溯灾难场景** - 演示灾难性回溯导致的性能问题
3. **零宽断言场景** - 演示正向/负向先行断言的匹配行为
4. **复杂邮箱校验场景** - 演示复杂邮箱正则的匹配逻辑

### 动画效果
- 状态机节点激活脉冲动画
- 匹配路径流光动画
- 失败分支枯萎动画
- 捕获组高亮缩放动画
- 语法树展开折叠动画

### 异常场景模拟
- 灾难性回溯 (Catastrophic Backtracking) 界面卡顿
- 非捕获组被错误高亮
- 多行模式下锚点失效提示

### 数据持久化
- 正则片段库管理
- 历史调试记录保存

## 技术栈

### 前端
- Vue 3 (Composition API)
- Pinia (状态管理)
- Tailwind CSS (样式)
- Vite (构建工具)

### 后端
- Fastify (Web 框架)
- TypeScript (类型安全)

### 数据库
- sql.js (SQLite 的 JavaScript 实现)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务

**方式一: 使用启动脚本 (Windows)**
```bash
start.bat
```

**方式二: 使用 npm 命令**
```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server  # 后端服务 (端口 3001)
npm run dev:client  # 前端服务 (端口 5173)
```

### 3. 访问应用

打开浏览器访问: http://localhost:5173

## 项目结构

```
regex-debugger-visualizer/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   │   ├── InputPanel.vue      # 输入面板
│   │   │   ├── PresetScenarios.vue # 预设场景
│   │   │   ├── SnippetsPanel.vue   # 片段库管理
│   │   │   ├── HistoryPanel.vue    # 历史记录
│   │   │   ├── FSMVisualizer.vue   # FSM 可视化
│   │   │   ├── MatchStepViewer.vue # 匹配步骤查看器
│   │   │   ├── ASTViewer.vue       # 语法树查看器
│   │   │   ├── ASTNode.vue         # 语法树节点
│   │   │   └── ResultDisplay.vue   # 结果显示
│   │   ├── stores/         # Pinia 状态管理
│   │   │   └── regex.ts
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── style.css
│   └── index.html
├── server/                 # 后端代码
│   ├── index.ts            # Fastify 服务入口
│   ├── regexParser.ts      # 正则表达式解析器
│   ├── fsmBuilder.ts       # FSM 构建器
│   ├── regexMatcher.ts     # 正则匹配引擎
│   └── database.ts         # 数据库管理
├── shared/                 # 共享类型定义
│   └── types.ts
├── data/                   # 数据库文件目录
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── tailwind.config.js
```

## API 接口

### 分析接口
- `POST /api/analyze` - 分析正则表达式
  ```json
  {
    "pattern": "\\d+",
    "testString": "abc123def",
    "flags": "g"
  }
  ```

### 片段管理
- `GET /api/snippets` - 获取所有片段
- `POST /api/snippets` - 创建新片段
- `PUT /api/snippets/:id` - 更新片段
- `DELETE /api/snippets/:id` - 删除片段

### 历史记录
- `GET /api/history` - 获取历史记录
- `DELETE /api/history` - 清空历史记录

## 使用说明

### 基本使用
1. 在输入框中输入正则表达式和测试文本
2. 选择合适的标志位 (g, i, m 等)
3. 点击"开始分析"按钮
4. 查看匹配步骤和可视化结果

### 使用预设场景
1. 点击预设场景按钮
2. 自动加载正则表达式和测试文本
3. 观察匹配过程和结果

### 保存片段
1. 输入正则表达式
2. 点击"保存当前"按钮
3. 输入名称和描述
4. 保存到片段库供以后使用

## 动画说明

### 节点激活脉冲
当 FSM 状态被访问时，节点会显示绿色脉冲动画，表示当前正在处理的状态。

### 路径流光
匹配成功的路径会显示绿色流光动画，表示匹配的流动方向。

### 失败枯萎
匹配失败的分支会显示枯萎动画，逐渐变暗缩小，表示该路径已放弃。

### 捕获组高亮
捕获组被成功匹配时会显示缩放高亮动画。

### 语法树展开折叠
点击语法树节点可以展开或折叠子节点，带平滑的动画效果。

## 开发命令

```bash
# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 构建前端
npm run build

# 构建后端
npm run build:server

# 生产模式启动
npm start
```

## 许可证

MIT
