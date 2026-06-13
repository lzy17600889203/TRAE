/* ============================================================
 * 纯 JS 实现的内存"数据库"——替代 SQLite
 * 功能：
 *   1. 适老化改造标准库（内置 14 项）
 *   2. 老人档案管理
 *   3. 评估记录保存
 *   4. 风险评估 + 报告生成逻辑（与原 SQLite 版本一致）
 * ============================================================ */

const fs = require('fs');
const path = require('path');

// ---------- 适老化改造标准库（内置数据，相当于原 SQLite 的 standards 表 ----------
const MODIFICATION_STANDARDS = [
  // 行动能力相关
  { category: 'mobility', item_code: 'ANTI_SLIP_MAT', item_name: '防滑垫安装',
    description: '在浴室、厨房、走廊等易滑区域铺设防滑垫',
    threshold_min: 0, threshold_max: 50, triggered_by: 'mobility_score',
    priority: '高', recommendation: '浴室与卫生间门口必须铺设 PVC 防滑垫，规格不小于 60x90cm，摩擦系数 ≥ 0.8' },

  { category: 'mobility', item_code: 'HANDRAIL_BATH', item_name: '浴室扶手加装',
    description: '在浴缸旁、马桶旁加装 L 型扶手',
    threshold_min: 0, threshold_max: 60, triggered_by: 'mobility_score',
    priority: '高', recommendation: '马桶两侧安装高度 75cm 防滑扶手，浴缸侧安装 L 型扶手' },

  { category: 'mobility', item_code: 'HANDRAIL_STAIR', item_name: '楼梯扶手加装',
    description: '所有楼梯双侧安装扶手',
    threshold_min: 0, threshold_max: 70, triggered_by: 'mobility_score',
    priority: '中', recommendation: '楼梯两侧必须安装连续扶手，高度 85-90cm' },

  { category: 'mobility', item_code: 'RAMP_INSTALL', item_name: '坡道改造',
    description: '门槛高度超过 2cm 需做坡道过渡',
    threshold_min: 0, threshold_max: 55, triggered_by: 'mobility_score',
    priority: '高', recommendation: '所有门槛高度差超过 15mm 处安装橡胶斜坡，坡度 ≤ 1:12' },

  // 视力相关
  { category: 'vision', item_code: 'LIGHTING_UPGRADE', item_name: '照明升级',
    description: '改善室内照明亮度',
    threshold_min: 0, threshold_max: 60, triggered_by: 'vision_score',
    priority: '中', recommendation: '所有房间照度提升至 ≥ 200lux，走廊与楼梯安装感应夜灯' },

  { category: 'vision', item_code: 'CONTRAST_STRIP', item_name: '色彩对比度提示',
    description: '台阶边缘贴高对比度警示条',
    threshold_min: 0, threshold_max: 50, triggered_by: 'vision_score',
    priority: '中', recommendation: '楼梯台阶前缘粘贴黄色高对比度防滑条，宽度 ≥ 50mm' },

  // 听力相关
  { category: 'hearing', item_code: 'DOORBELL_UPGRADE', item_name: '可视门铃安装',
    description: '更换为带闪光灯的可视门铃',
    threshold_min: 0, threshold_max: 50, triggered_by: 'hearing_score',
    priority: '中', recommendation: '入户门安装带灯光闪烁提示的可视门铃，音量可调节' },

  { category: 'hearing', item_code: 'SMOKE_ALARM', item_name: '声光报警器升级',
    description: '烟雾报警器增加强光闪烁',
    threshold_min: 0, threshold_max: 45, triggered_by: 'hearing_score',
    priority: '高', recommendation: '厨房与卧室安装带频闪灯光的烟雾报警器及一氧化碳报警器' },

  // 认知相关
  { category: 'cognitive', item_code: 'EMERGENCY_BUTTON', item_name: '紧急呼叫按钮',
    description: '随身佩戴一键呼叫装置',
    threshold_min: 0, threshold_max: 55, triggered_by: 'cognitive_score',
    priority: '高', recommendation: '老人随身佩戴 GPS+4G 紧急呼叫手表，绑定家属手机' },

  { category: 'cognitive', item_code: 'LABEL_SYSTEM', item_name: '物品标识系统',
    description: '室内物品使用大字标签标识',
    threshold_min: 0, threshold_max: 60, triggered_by: 'cognitive_score',
    priority: '中', recommendation: '抽屉、柜门、常用物品粘贴 48pt 以上大字图文标签' },

  // 浴室安全
  { category: 'bathroom', item_code: 'SHOWER_SEAT', item_name: '淋浴座椅安装',
    description: '浴室安装折叠淋浴座椅',
    threshold_min: 0, threshold_max: 65, triggered_by: 'bathroom_score',
    priority: '高', recommendation: '淋浴区安装壁挂式折叠淋浴座椅，承重 ≥ 150kg' },

  { category: 'bathroom', item_code: 'TEMPERATURE_CONTROL', item_name: '恒温龙头安装',
    description: '更换为恒温混水阀',
    threshold_min: 0, threshold_max: 70, triggered_by: 'bathroom_score',
    priority: '中', recommendation: '淋浴龙头更换为恒温阀，最高出水温度锁定 38°C' },

  // 客厅安全
  { category: 'livingroom', item_code: 'FURNITURE_REARRANGE', item_name: '家具动线优化',
    description: '确保主要通道宽度 ≥ 90cm',
    threshold_min: 0, threshold_max: 60, triggered_by: 'livingroom_score',
    priority: '中', recommendation: '清理通道障碍，沙发与茶几间距 ≥ 80cm，地毯固定防止滑动' },

  { category: 'livingroom', item_code: 'FLOOR_CARPET_FIX', item_name: '地毯固定',
    description: '松散地毯做防滑处理或移除',
    threshold_min: 0, threshold_max: 55, triggered_by: 'livingroom_score',
    priority: '高', recommendation: '移除所有松散地毯，或使用双面胶带全面固定' }
];

// ---------- 安全阈值（低于此值触发警示 ----------
const SAFE_THRESHOLD = 70;

const SCORE_LABELS = {
  mobility_score: '行动能力',
  vision_score: '视力',
  hearing_score: '听力',
  cognitive_score: '认知能力',
  bathroom_score: '浴室安全',
  livingroom_score: '客厅安全'
};

// ---------- 内存数据库 ----------
const DB_PATH = path.join(__dirname, 'silver_health.json');

function loadDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { profiles: [], assessments: [] };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // 忽略写失败（例如只读文件系统），保持在内存中
  }
}

let _state = loadDB();
let _profileIdSeq = _state.profiles.length > 0
  ? Math.max(..._state.profiles.map(p => p.id)) + 1 : 1;
let _assessmentIdSeq = _state.assessments.length > 0
  ? Math.max(..._state.assessments.map(a => a.id)) + 1 : 1;

// ---------- 根据评估指标计算风险并生成建议 ----------
function generateReport(scores) {
  const warnings = [];
  const recommendations = [];
  const seenCodes = new Set();

  // 遍历六个维度
  Object.keys(SCORE_LABELS).forEach((key) => {
    const score = scores[key];
    if (score === undefined || score === null) return;

    if (score < SAFE_THRESHOLD) {
      warnings.push({
        dimension: SCORE_LABELS[key],
        score: score,
        threshold: SAFE_THRESHOLD,
        status: score < 40 ? '高危' : '中危'
      });

      // 查找触发的改造标准
      MODIFICATION_STANDARDS.forEach((std) => {
        if (std.triggered_by === key &&
            score >= std.threshold_min && score <= std.threshold_max) {
          if (!seenCodes.has(std.item_code)) {
            seenCodes.add(std.item_code);
            recommendations.push({
              category: std.category,
              item_code: std.item_code,
              item_name: std.item_name,
              description: std.description,
              priority: std.priority,
              recommendation: std.recommendation
            });
          }
        }
      });
    }
  });

  // 按优先级排序
  recommendations.sort((a, b) => (a.priority === '高' ? -1 : 1));

  // 计算总体风险等级
  const allScores = Object.values(scores).filter((v) => typeof v === 'number');
  const avg = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;
  const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;

  let riskLevel;
  if (minScore < 40 || warnings.filter((w) => w.status === '高危').length >= 2) {
    riskLevel = '高危风险';
  } else if (avg < SAFE_THRESHOLD) {
    riskLevel = '需改造';
  } else {
    riskLevel = '安全居家';
  }

  return {
    scores: scores,
    average_score: avg,
    risk_level: riskLevel,
    warnings: warnings,
    recommendations: recommendations,
    summary: buildSummary(riskLevel, warnings, recommendations)
  };
}

function buildSummary(riskLevel, warnings, recommendations) {
  if (riskLevel === '高危风险') {
    return '老人存在 ' + warnings.length + ' 项风险指标，其中 ' +
      warnings.filter((w) => w.status === '高危').length +
      ' 项为高危，建议立即进行适老化改造，重点推进以下 ' +
      recommendations.length + ' 项改造措施。';
  }
  if (riskLevel === '需改造') {
    return '老人部分指标低于安全标准，建议有计划地开展以下 ' +
      recommendations.length + ' 项改造工作，优先处理高优先级项目。';
  }
  return '老人各项指标均处于安全范围，当前居家环境总体安全，建议每 6 个月进行一次复评。';
}

// ---------- 档案与评估的 CRUD ----------
function createProfile(data) {
  const profile = {
    id: _profileIdSeq++,
    name: data.name || '未命名',
    age: data.age || null,
    gender: data.gender || null,
    phone: data.phone || null,
    address: data.address || null,
    created_at: new Date().toISOString()
  };
  _state.profiles.push(profile);
  saveDB(_state);
  return profile;
}

function saveAssessment(data) {
  const report = generateReport(data.scores);
  const assessment = {
    id: _assessmentIdSeq++,
    profile_id: data.profile_id || null,
    mobility_score: data.scores.mobility_score,
    vision_score: data.scores.vision_score,
    hearing_score: data.scores.hearing_score,
    cognitive_score: data.scores.cognitive_score,
    bathroom_score: data.scores.bathroom_score,
    livingroom_score: data.scores.livingroom_score,
    risk_level: report.risk_level,
    report: report,
    created_at: new Date().toISOString()
  };
  _state.assessments.push(assessment);
  saveDB(_state);
  return { assessment_id: assessment.id, report: report };
}

function listProfiles() {
  return _state.profiles.slice().sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at));
}

function getProfile(id) {
  return _state.profiles.find((p) => p.id === id) || null;
}

function listAssessments(profileId) {
  let list = _state.assessments.slice();
  if (profileId) list = list.filter((a) => a.profile_id === profileId);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
}

function getStandards() {
  return MODIFICATION_STANDARDS.slice().sort((a, b) => {
    if (a.category === b.category) return a.priority === '高' ? -1 : 1;
    return a.category.localeCompare(b.category);
  });
}

function initDB() {
  // 确保数据库文件存在
  if (!fs.existsSync(DB_PATH)) {
    saveDB({ profiles: [], assessments: [] });
  }
}

module.exports = {
  initDB,
  generateReport,
  createProfile,
  saveAssessment,
  listProfiles,
  getProfile,
  listAssessments,
  getStandards
};
