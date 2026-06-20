# 安全态势看板 技术架构

## 1. Architecture Design
```mermaid
flowchart TD
    subgraph 前端
        A[Vue 3 + Vite] --> B[Element Plus组件]
        A --> C[ECharts 可视化]
        A --> D[lucide-vue-next 图标]
        C --> C1[全球攻击地图 Map+Lines]
        C --> C2[安全评分雷达图 Radar]
        C --> C3[DDoS爆炸粒子 Canvas覆盖层]
    end
    subgraph 数据层
        E[Mock数据流(定时器模拟)] --> A
    end
```

## 2. Technology Description
- Frontend: Vue@3.4 + TypeScript + Vite@5
- UI框架: element-plus
- 可视化: echarts@5
- 图标: lucide-vue-next
- 世界地图数据: 公共GeoJSON (从CDN加载)
- 状态管理: Vue Composition API (ref/reactive) 单页轻量状态
- 样式: 原生CSS变量 + 全局dark主题

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| / | 安全态势看板首页(唯一页面) |

## 4. 组件划分
```
src/
  components/
    AttackMap.vue          # 中央全球攻击地图(Map+Lines+effect+爆炸canvas)
    AlertList.vue          # 左侧实时告警列表
    SecurityRadar.vue      # 右侧安全评分雷达图
    StatusBar.vue          # 顶部状态条
  composables/
    useMockData.ts         # 攻击流/告警/评分模拟数据生成器
  App.vue                  # 主容器(三栏布局 + DDoS状态联动)
  main.ts                  # 入口
  style.css                # 全局样式
```

## 5. DDoS状态联动协议
```ts
interface DDoSEvent {
  active: boolean;
  targetName: string;
  targetCoord: [number, number];
  peakGbps: number;
  timestamp: number;
}
```
- App.vue 维护 ddosActive state,3-8秒随机切换
- AttackMap 监听 props.ddosEvent → 动态修改 lines 样式 + 触发爆炸粒子
- AlertList 在DDoS激活时自动推入高危告警
- StatusBar 展示DDoS红色横幅

## 6. 数据协议
```ts
interface AttackLine { from:[number,number]; to:[number,number]; fromName:string; toName:string; isDDoS?:boolean }
interface AlertItem  { id:string; level:'高危'|'中危'|'低危'; title:string; source:string; time:number; handled:boolean }
interface ScoreItem  { name:string; value:number; suggestion:string }
```
