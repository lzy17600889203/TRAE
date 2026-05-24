# Interactive Counterpoint Editor

技术栈：Angular 18 + Fastify + SQLite (better-sqlite3)

## 启动

```bash
# 安装依赖
npm run install:all

# 构建前端 (将编译产物输出到 frontend/dist)
npm run build:frontend

# 启动后端 (后端会同时托管前端静态文件)
npm start
```

访问 http://localhost:3000

## 功能

- 四个预设场景：二声部对位 / 和弦转位 / 模进发展 / 违规和声进行
- 规则引擎检测：平行五八度、隐伏五八度、声部交叉、增音程未解决
- SQLite 保存 MusicXML 与分析结果
- 动画：音符落下弹跳 / 声部连线拉伸 / 和声解决色彩渐变 / 错误音符红色震动 / 播放指针平滑滚动

## 故意暴露的 Bug（用于测试动画反馈）

1. 违规场景中的“隐伏五/八度”在小跳情况下可能漏判（引擎要求跳进 ≥4 半音）
2. 声部交叉时的符头渲染重叠
3. 调号变更后的临时升降号显示错误（旧调号需要的升降号仍被强制渲染）
4. 增音程（如中音声部 F4 → B4 的 A4）在场景中以红色震动呈现
