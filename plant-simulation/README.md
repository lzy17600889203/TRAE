# 植物生长模拟系统 - L-System

基于 Angular + Three.js + Fastify 技术栈开发的植物生长模拟系统，使用 L 系统（L-system）算法生成分形植物结构。

## 功能特性

### 核心功能
- **L 系统分形算法**：后端使用递归生成植物几何结构
- **生长优先级计算**：基于光照方向、养分供给、层级计算各分支生长优先级
- **实时参数调节**：
  - 分形迭代次数
  - 枝条生长角度
  - 光照吸引系数
  - 养分供给量
  - 叶片密度、花朵几率等

### 四种预设场景
1. **🌞 向阳生长预设**：充足阳光和养分，健康生长状态
2. **🌑 阴暗徒长预设**：光照不足，枝条细长稀疏的徒长现象
3. **🌿 营养过剩预设**：密集生长、枝条穿插重叠
4. **🥀 枯萎病变预设**：病害侵袭，黑斑扩散、生长停滞

### 动画系统
- 枝条逐级延伸生长动画
- 叶片展开缩放动画（包含翻转效果）
- 光合作用能量流动光效（粒子系统）
- 花朵绽放旋转动画
- 病变组织黑斑扩散动画

### 边界情况模拟
- 枝条穿插重叠
- 叶片模型翻转错误
- 生长点坐标溢出
- 迭代层级过深导致性能问题

## 项目结构

```
plant-simulation/
├── backend/                 # Fastify 后端
│   ├── data/               # 本地 JSON 配置
│   │   ├── default-genes.json
│   │   ├── default-environment.json
│   │   └── presets.json    # 四个预设配置
│   ├── src/
│   │   ├── index.ts        # 服务器入口
│   │   ├── lsystem.ts      # L系统算法核心
│   │   ├── config-service.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Angular + Three.js 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts
│   │   │   ├── control-panel.component.ts
│   │   │   ├── plant-renderer.service.ts  # Three.js 渲染器
│   │   │   ├── plant.service.ts
│   │   │   └── types.ts
│   │   ├── main.ts
│   │   ├── index.html
│   │   └── styles.scss
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
└── README.md
```

## 快速开始

### 前置要求
- Node.js 18+
- npm 9+

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动项目

**终端 1 - 启动后端：**
```bash
cd backend
npm run dev
# 后端运行在 http://localhost:3000
```

**终端 2 - 启动前端：**
```bash
cd frontend
npm start
# 前端运行在 http://localhost:4200
```

### 访问应用
打开浏览器访问 http://localhost:4200

## API 接口

### 预设管理
- `GET /api/presets` - 获取所有预设
- `GET /api/presets/:id` - 获取特定预设
- `POST /api/presets/:id/apply` - 应用预设并生成植物

### 植物生成
- `POST /api/generate` - 根据参数生成植物结构
- `GET /api/defaults` - 获取默认基因和环境参数
- `POST /api/defaults/genes` - 保存默认基因参数
- `POST /api/defaults/environment` - 保存默认环境参数

## 参数说明

### 基因参数
| 参数 | 范围 | 说明 |
|------|------|------|
| iterations | 1-15 | 分形迭代次数 |
| branchAngle | 5-90° | 枝条分叉角度 |
| lightAttraction | 0-1 | 光照吸引系数 |
| nutrientSupply | 0-1 | 养分供给量 |
| leafDensity | 0-1 | 叶片密度 |
| flowerChance | 0-1 | 花朵生成几率 |

### 动画参数
- branchGrowthSpeed: 枝条生长速度
- leafUnfurlSpeed: 叶片展开速度
- photosynthesisSpeed: 光合作用粒子发射速度
- flowerBloomSpeed: 花朵绽放速度
- diseaseSpreadSpeed: 病变扩散速度

## 技术栈

- **前端框架**: Angular 17 (Standalone Components)
- **3D 渲染**: Three.js + OrbitControls
- **后端框架**: Fastify 4
- **语言**: TypeScript
- **数据存储**: 本地 JSON 文件

## 预设说明

### 向阳生长 (sunny-growth)
- 高迭代次数，合适的分支角度
- 强光照吸引，充足养分
- 叶片茂密，花朵丰富
- 高光效动画，无病变

### 阴暗徒长 (shady-etiolation)
- 极高光照吸引（追逐光线）
- 低养分导致枝条细长
- 叶片稀少，几乎无花朵
- 快速生长但结构脆弱

### 营养过剩 (nutrient-overload)
- 极高迭代次数
- 大分支角度，高分支缩减率
- 极端密集导致枝条交叉重叠
- 叶片花朵极度丰富

### 枯萎病变 (withered-disease)
- 低迭代，生长停滞
- 极少叶片和花朵
- 高病变扩散速度
- 低光效和生长速度

## 边界情况

点击控制面板底部的"边界情况模拟"按钮可以触发：

1. **枝条穿插重叠**：设置极高迭代、小角度、高分支缩减
2. **叶片翻转错误**：高重力导致叶片法线方向异常
3. **生长点溢出**：长枝条、无重力、无限向上生长
4. **深度迭代崩溃**：15 层迭代测试性能极限

## 开发指南

### 添加新预设
编辑 `backend/data/presets.json` 添加新的预设配置。

### 自定义 L 系统规则
修改 `backend/src/lsystem.ts` 中的 `recursiveBranch` 方法。

### 调整动画效果
修改 `frontend/src/app/plant-renderer.service.ts` 中的动画更新方法。
