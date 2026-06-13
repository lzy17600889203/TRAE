const express = require('express');
const cors = require('cors');
const path = require('path');
const {
  initDB,
  generateReport,
  createProfile,
  saveAssessment,
  listProfiles,
  getProfile,
  listAssessments,
  getStandards
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

initDB();

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Silver Health Management', timestamp: new Date().toISOString() });
});

// 档案管理
app.post('/api/profiles', (req, res) => {
  try {
    const profile = createProfile(req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/profiles', (req, res) => {
  res.json({ success: true, data: listProfiles() });
});

app.get('/api/profiles/:id', (req, res) => {
  const profile = getProfile(req.params.id);
  if (!profile) return res.status(404).json({ success: false, error: '未找到该老人档案' });
  res.json({ success: true, data: profile });
});

// 评估提交
app.post('/api/assessments', (req, res) => {
  try {
    const { profile_id, scores } = req.body;
    if (!scores) return res.status(400).json({ success: false, error: '缺少评估分数 scores' });

    const requiredKeys = ['mobility_score', 'vision_score', 'hearing_score', 'cognitive_score', 'bathroom_score', 'livingroom_score'];
    for (const k of requiredKeys) {
      if (scores[k] === undefined) {
        return res.status(400).json({ success: false, error: `缺少必要指标：${k}` });
      }
    }

    const result = saveAssessment({ profile_id, scores });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 仅生成报告（不保存）
app.post('/api/report', (req, res) => {
  try {
    const report = generateReport(req.body);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/assessments', (req, res) => {
  const profileId = req.query.profile_id;
  const data = listAssessments(profileId);
  res.json({ success: true, data });
});

// 改造标准库
app.get('/api/standards', (req, res) => {
  res.json({ success: true, data: getStandards() });
});

// 演示接口：快速构造不同风险状态的样例
app.post('/api/demo/:scenario', (req, res) => {
  const scenario = req.params.scenario;
  let scores;
  if (scenario === 'high-risk') {
    scores = {
      mobility_score: 25,
      vision_score: 35,
      hearing_score: 50,
      cognitive_score: 40,
      bathroom_score: 30,
      livingroom_score: 45
    };
  } else if (scenario === 'safe') {
    scores = {
      mobility_score: 85,
      vision_score: 82,
      hearing_score: 88,
      cognitive_score: 90,
      bathroom_score: 86,
      livingroom_score: 89
    };
  } else {
    scores = {
      mobility_score: 65,
      vision_score: 70,
      hearing_score: 68,
      cognitive_score: 72,
      bathroom_score: 66,
      livingroom_score: 75
    };
  }
  const report = generateReport(scores);
  res.json({ success: true, scenario, data: report });
});

app.listen(PORT, () => {
  console.log(`[Silver Health] 评估系统启动成功： http://localhost:${PORT}`);
  console.log(`[Silver Health] 首页：                http://localhost:${PORT}/`);
  console.log(`[Silver Health] 健康检查：            http://localhost:${PORT}/api/health`);
});
