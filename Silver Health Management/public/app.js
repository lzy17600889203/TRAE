/* ============================================================
 * 银龄康养评估系统 · 前端 Vanilla JS 逻辑
 * 包含：状态切换 / 分步问卷 / 实时警示灯 / 报告生成
 * ============================================================ */

(function () {
  'use strict';

  // ---------- 评估题目配置 ----------
  const QUESTIONS = [
    {
      key: 'mobility_score',
      label: '行动能力',
      title: '日常行走与起身能力',
      desc: '考虑老人独立行走、上下楼梯、座椅起身的能力。是否需要助行器或护理协助？',
      quickOpts: [
        { label: '完全不能自理', value: 20 },
        { label: '需要搀扶', value: 40 },
        { label: '借助拐杖', value: 60 },
        { label: '行动自如', value: 90 }
      ]
    },
    {
      key: 'vision_score',
      label: '视力',
      title: '视觉识别与辨物',
      desc: '老人在室内的视物清晰度。能否看清药瓶文字、识别台阶边缘、夜间起夜视物情况。',
      quickOpts: [
        { label: '严重弱视', value: 30 },
        { label: '佩戴眼镜仍吃力', value: 55 },
        { label: '戴镜正常', value: 78 },
        { label: '视力良好', value: 92 }
      ]
    },
    {
      key: 'hearing_score',
      label: '听力',
      title: '听觉反应能力',
      desc: '老人对门铃声、烟雾报警器声、电话铃声的识别能力，日常交流是否吃力。',
      quickOpts: [
        { label: '几乎听不见', value: 25 },
        { label: '需大声说话', value: 50 },
        { label: '基本正常', value: 75 },
        { label: '听力良好', value: 90 }
      ]
    },
    {
      key: 'cognitive_score',
      label: '认知能力',
      title: '认知与记忆',
      desc: '近期记忆、方位识别、对家庭地址电话的记忆，是否出现过忘关火、忘带钥匙等情况。',
      quickOpts: [
        { label: '经常遗忘', value: 35 },
        { label: '偶有遗忘', value: 55 },
        { label: '基本正常', value: 80 },
        { label: '思维清晰', value: 93 }
      ]
    },
    {
      key: 'bathroom_score',
      label: '浴室安全',
      title: '卫浴环境安全',
      desc: '浴缸/淋浴间防滑情况、马桶高度是否需要扶手、地面是否湿滑易摔风险。',
      quickOpts: [
        { label: '地面极滑', value: 25 },
        { label: '缺少扶手', value: 55 },
        { label: '基本安全', value: 78 },
        { label: '已做改造', value: 92 }
      ]
    },
    {
      key: 'livingroom_score',
      label: '客厅安全',
      title: '客厅动线与家具安全',
      desc: '客厅家具是否有尖角/地毯松动、动线是否顺畅、夜间照明是否充足。',
      quickOpts: [
        { label: '动线杂乱', value: 30 },
        { label: '部分隐患', value: 60 },
        { label: '基本顺畅', value: 82 },
        { label: '非常安全', value: 95 }
      ]
    }
  ];

  const SAFE_THRESHOLD = 70;

  // ---------- 状态管理 ----------
  let currentStep = 0;
  const scores = {};
  let currentProfile = null;

  // ---------- DOM 辅助 ----------
  const $ = (id) => document.getElementById(id);

  // ---------- 四个状态屏切换 ----------
  function switchState(state) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.state-btn').forEach((el) => el.classList.remove('active'));

    const scr = $('screen-' + state);
    if (scr) scr.classList.add('active');
    const btn = document.querySelector('.state-btn[data-state="' + state + '"]');
    if (btn) btn.classList.add('active');

    if (state === 'assessing') renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.switchState = switchState;

  // ---------- 初始建档 ----------
  function startAssessment() {
    const profile = {
      name: $('p-name').value || '匿名老人',
      age: parseInt($('p-age').value) || null,
      gender: $('p-gender').value,
      phone: $('p-phone').value,
      address: $('p-address').value
    };
    currentProfile = profile;
    currentStep = 0;
    Object.keys(scores).forEach((k) => delete scores[k]);
    switchState('assessing');
  }

  // ---------- 分步问卷渲染 ----------
  function renderQuestion() {
    const q = QUESTIONS[currentStep];
    if (!q) return;

    // 进度
    const total = QUESTIONS.length;
    const percent = Math.round((currentStep + 1) / total * 100);
    $('progress-fill').style.width = percent + '%';
    $('progress-label').textContent = '第 ' + (currentStep + 1) + ' 步 / 共 ' + total + ' 步';
    $('progress-percent').textContent = percent + '%';

    // 步骤标签
    document.querySelectorAll('.progress-steps .step').forEach((el) => {
      const idx = parseInt(el.dataset.idx, 10);
      el.classList.remove('active', 'done');
      if (idx < currentStep) el.classList.add('done');
      if (idx === currentStep) el.classList.add('active');
    });

    // 当前分数（若已有）
    const existingValue = scores[q.key] !== undefined ? scores[q.key] : 80;
    scores[q.key] = existingValue;

    // 问题卡
    const card = $('question-card');
    card.innerHTML =
      '<div class="question-inner">' +
        '<span class="question-label">维度 ' + (currentStep + 1) + ' / ' + total + '</span>' +
        '<h2 class="question-title">' + q.title + '</h2>' +
        '<p class="question-desc">' + q.desc + '</p>' +

        '<div class="score-slider-wrap">' +
          '<div class="score-input">' +
            '<input type="range" id="q-range" min="0" max="100" step="1" value="' + existingValue + '" />' +
            '<div class="score-value" id="q-value">' + existingValue + '</div>' +
          '</div>' +
          '<div class="score-scale-row">' +
            '<span>0 · 高危</span><span>70 · 安全线</span><span>100 · 优秀</span>' +
          '</div>' +
        '</div>' +

        '<div class="quick-btns" id="q-quick">' +
          q.quickOpts.map((o, i) =>
            '<button class="quick-btn" data-v="' + o.value + '"><span class="num">' + o.value + '</span>' + o.label + '</button>'
          ).join('') +
        '</div>' +

        '<div class="warn-indicator" id="q-warn">' +
          '<span class="warn-light"></span>' +
          '<span class="warn-text"></span>' +
        '</div>' +
      '</div>';

    // 滑杆交互
    const range = $('q-range');
    const val = $('q-value');
    const warn = $('q-warn');
    const warnText = warn.querySelector('.warn-text');

    function updateScore(val_num) {
      val_num = parseInt(val_num, 10);
      scores[q.key] = val_num;
      val.textContent = val_num;
      val.classList.remove('danger', 'warn', 'safe');
      if (val_num < 40) val.classList.add('danger');
      else if (val_num < SAFE_THRESHOLD) val.classList.add('warn');
      else val.classList.add('safe');

      // 警示灯
      warn.classList.remove('danger', 'warn');
      if (val_num < SAFE_THRESHOLD) {
        warn.classList.add('show');
        if (val_num < 40) {
          warn.classList.add('danger');
          warnText.textContent = '⚠ 该指标低于安全阈值 (' + SAFE_THRESHOLD + ') — 高危预警';
        } else {
          warn.classList.add('warn');
          warnText.textContent = '⚑ 该指标略低于安全阈值，需关注';
        }
      } else {
        warn.classList.remove('show');
      }

      // 快捷按钮选中态
      document.querySelectorAll('.quick-btn').forEach((b) => {
        b.classList.toggle('selected', parseInt(b.dataset.v, 10) === val_num);
      });
    }

    range.addEventListener('input', (e) => updateScore(e.target.value));
    document.querySelectorAll('.quick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.v;
        range.value = v;
        updateScore(v);
      });
    });

    // 按钮状态
    $('btn-prev').style.visibility = currentStep === 0 ? 'hidden' : 'visible';
    $('btn-next').textContent = currentStep === total - 1 ? '生成评估报告 →' : '下一步 →';

    updateScore(existingValue);
  }

  // ---------- 上一步 / 下一步 ----------
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      renderQuestion();
    }
  }
  function nextStep() {
    const total = QUESTIONS.length;
    if (currentStep < total - 1) {
      currentStep++;
      renderQuestion();
    } else {
      // 最后一步，根据综合分数决定报告页
      generateReportFromScores();
    }
  }

  // ---------- 生成报告 ----------
  function generateReportFromScores() {
    // 本地计算 + 请求后端
    const avg = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
    );
    // 根据平均分决定是高危还是安全
    const isHighRisk = avg < SAFE_THRESHOLD ||
      Object.values(scores).some((v) => v < 40) ||
      Object.values(scores).filter((v) => v < SAFE_THRESHOLD).length >= 3;

    // 先尝试请求后端
    fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: null, scores: scores })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.data && data.data.report) {
          renderReportPage(data.data.report, isHighRisk);
        } else {
          // 回退：使用本地逻辑
          renderReportPageFallback(scores, isHighRisk);
        }
      })
      .catch(() => renderReportPageFallback(scores, isHighRisk));
  }

  function renderReportPage(report, isHighRisk) {
    if (isHighRisk) {
      renderHighRiskReport(report);
      switchState('highrisk');
    } else {
      renderSafeReport(report);
      switchState('safe');
    }
  }

  function renderReportPageFallback(sc, isHighRisk) {
    // 简易本地报告生成（后端不可用时的退化逻辑
    const localReport = buildLocalReport(sc);
    if (isHighRisk) {
      renderHighRiskReport(localReport);
      switchState('highrisk');
    } else {
      renderSafeReport(localReport);
      switchState('safe');
    }
  }

  // 本地回退报告生成器
  function buildLocalReport(sc) {
    const labels = {
      mobility_score: '行动能力',
      vision_score: '视力',
      hearing_score: '听力',
      cognitive_score: '认知能力',
      bathroom_score: '浴室安全',
      livingroom_score: '客厅安全'
    };
    const recMap = {
      mobility_score: [
        { item_name: '防滑垫安装', recommendation: '浴室与卫生间门口必须铺设 PVC 防滑垫，摩擦系数 ≥ 0.8', priority: '高' },
        { item_name: '浴室扶手加装', recommendation: '马桶两侧安装高度 75cm 防滑扶手，浴缸侧安装 L 型扶手', priority: '高' }
      ],
      vision_score: [
        { item_name: '照明升级', recommendation: '所有房间照度提升至 ≥ 200lux，走廊与楼梯安装感应夜灯', priority: '中' }
      ],
      hearing_score: [
        { item_name: '声光报警器升级', recommendation: '厨房与卧室安装带频闪灯光的烟雾报警器', priority: '高' }
      ],
      cognitive_score: [
        { item_name: '紧急呼叫按钮', recommendation: '老人随身佩戴 GPS+4G 紧急呼叫手表，绑定家属手机', priority: '高' }
      ],
      bathroom_score: [
        { item_name: '淋浴座椅安装', recommendation: '淋浴区安装壁挂式折叠淋浴座椅，承重 ≥ 150kg', priority: '高' }
      ],
      livingroom_score: [
        { item_name: '家具动线优化', recommendation: '清理通道障碍，沙发与茶几间距 ≥ 80cm', priority: '中' }
      ]
    };

    const warnings = [];
    const recommendations = [];
    const seenNames = new Set();
    Object.keys(labels).forEach((k) => {
      if (sc[k] < SAFE_THRESHOLD) {
        warnings.push({
          dimension: labels[k],
          score: sc[k],
          status: sc[k] < 40 ? '高危' : '中危',
          threshold: SAFE_THRESHOLD
        });
        (recMap[k] || []).forEach((r) => {
          if (!seenNames.has(r.item_name)) {
            seenNames.add(r.item_name);
            recommendations.push(r);
          }
        });
      }
    });
    const allValues = Object.values(sc);
    const avg = Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);
    const isHighRisk = avg < SAFE_THRESHOLD || allValues.some((v) => v < 40);

    return {
      scores: sc,
      average_score: avg,
      risk_level: isHighRisk ? '高危风险' : '安全居家',
      warnings: warnings,
      recommendations: recommendations,
      summary: isHighRisk
        ? '老人存在 ' + warnings.length + ' 项风险指标，建议立即进行适老化改造。'
        : '老人各项指标均处于安全范围，居家环境总体安全。'
    };
  }

  // ---------- 高危报告页渲染 ----------
  function renderHighRiskReport(report) {
    const scoresData = report.scores || {};
    const labelsMap = {
      mobility_score: '行动能力',
      vision_score: '视力',
      hearing_score: '听力',
      cognitive_score: '认知能力',
      bathroom_score: '浴室安全',
      livingroom_score: '客厅安全'
    };

    // 分数卡片
    const scoreHTML = Object.keys(labelsMap)
      .map((k) => {
        const v = scoresData[k] !== undefined ? scoresData[k] : 0;
        const cls = v < 40 ? 'danger' : v < SAFE_THRESHOLD ? 'warn' : 'safe';
        const light = v < 40 ? '闪烁红灯' : v < SAFE_THRESHOLD ? '黄灯' : '绿灯';
        return (
          '<div class="score-card ' + cls + '">' +
            '<div class="sc-light" title="' + light + '"></div>' +
            '<div class="sc-label">' + labelsMap[k] + '</div>' +
            '<div class="sc-value">' + v + '</div>' +
            '<div class="sc-thres">阈值 70</div>' +
          '</div>'
        );
      })
      .join('');
    $('highrisk-scores').innerHTML = scoreHTML;

    // 预警列表
    const warnings = report.warnings || [];
    if (warnings.length === 0) {
      $('highrisk-warnings').innerHTML = '<div style="color:#888; font-size:13px; padding:12px;">暂无预警项</div>';
    } else {
      $('highrisk-warnings').innerHTML = warnings
        .map((w) => {
          const cls = w.status === '高危' ? '' : 'warn';
          return (
            '<div class="warning-item ' + cls + '">' +
              '<span class="warning-tag">' + w.status + '</span>' +
              '<div class="warning-body">' +
                '<div class="w-dim">' + w.dimension + '</div>' +
                '<div class="w-score">当前评分 ' + w.score + ' 分 · 安全阈值 ' + (w.threshold || SAFE_THRESHOLD) + ' 分</div>' +
              '</div>' +
            '</div>'
          );
        })
        .join('');
    }

    // 改造建议
    const recs = report.recommendations || [];
    if (recs.length === 0) {
      $('highrisk-recs').innerHTML = '<div style="color:#888; font-size:13px; padding:12px;">根据评分均达标，无需改造</div>';
    } else {
      $('highrisk-recs').innerHTML = recs
      .slice()
      .sort((a, b) => (a.priority === '高' ? -1 : 1))
        .map((r) => {
          const pCls = r.priority === '高' ? '高-priority' : '中-priority';
          return (
            '<div class="rec-item">' +
              '<div class="rec-head">' +
                '<span class="rec-priority ' + pCls + '">' + r.priority + '优先级</span>' +
                '<span class="rec-name">' + (r.item_name || '') + '</span>' +
              '</div>' +
              '<div class="rec-desc">' + (r.recommendation || r.description || '') + '</div>' +
            '</div>'
          );
        })
        .join('');
    }
  }

  // ---------- 安全报告页渲染 ----------
  function renderSafeReport(report) {
    const scoresData = report.scores || {};
    const labelsMap = {
      mobility_score: '行动能力',
      vision_score: '视力',
      hearing_score: '听力',
      cognitive_score: '认知能力',
      bathroom_score: '浴室安全',
      livingroom_score: '客厅安全'
    };

    // 分数卡片
    const scoreHTML = Object.keys(labelsMap)
      .map((k) => {
        const v = scoresData[k] !== undefined ? scoresData[k] : 0;
        return (
          '<div class="score-card safe">' +
            '<div class="sc-light"></div>' +
            '<div class="sc-label">' + labelsMap[k] + '</div>' +
            '<div class="sc-value">' + v + '</div>' +
            '<div class="sc-thres">✓ 安全</div>' +
          '</div>'
        );
      })
      .join('');
    $('safe-scores').innerHTML = scoreHTML;

    // 温馨提示
    const avg = report.average_score || 0;
    $('safe-summary').innerHTML =
      '<div class="summary-line"><strong>综合评分：</strong>' + avg + ' 分（满分 100）</div>' +
      '<div class="summary-line">' + (report.summary || '各项指标均处于绿色安全区。') + '</div>' +
      '<div class="summary-line"><strong>后续建议：</strong>每 6 个月上门复评一次，若身体状况有明显变化请及时联系社区康养顾问。</div>' +
      '<div class="summary-line"><strong>家属联络：</strong>建议家属定期沟通，保持老人心情舒畅。</div>';
  }

  // ---------- 快速演示高危/安全 ----------
  function demoHighRisk() {
    fetch('/api/demo/high-risk', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        const report = (data && data.data) || buildLocalReport({
          mobility_score: 25, vision_score: 35, hearing_score: 50, cognitive_score: 40, bathroom_score: 30, livingroom_score: 45
        });
        renderHighRiskReport(report);
        switchState('highrisk');
      })
      .catch(() => {
        const local = buildLocalReport({
          mobility_score: 25, vision_score: 35, hearing_score: 50, cognitive_score: 40, bathroom_score: 30, livingroom_score: 45
        });
        renderHighRiskReport(local);
        switchState('highrisk');
      });
  }
  window.demoHighRisk = demoHighRisk;

  function demoSafe() {
    fetch('/api/demo/safe', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        const report = (data && data.data) || buildLocalReport({
          mobility_score: 85, vision_score: 82, hearing_score: 88, cognitive_score: 90, bathroom_score: 86, livingroom_score: 89
        });
        renderSafeReport(report);
        switchState('safe');
      })
      .catch(() => {
        const local = buildLocalReport({
          mobility_score: 85, vision_score: 82, hearing_score: 88, cognitive_score: 90, bathroom_score: 86, livingroom_score: 89
        });
        renderSafeReport(local);
        switchState('safe');
      });
  }
  window.demoSafe = demoSafe;

  // ---------- 事件绑定 ----------
  document.addEventListener('DOMContentLoaded', function () {
    // 顶部状态按钮
    document.querySelectorAll('.state-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const state = this.dataset.state;
        if (state === 'assessing') {
          // 直接进入评估状态，使用默认空档案
          if (Object.keys(scores).length === 0) {
            currentProfile = { name: '演示老人' };
          }
          currentStep = 0;
        }
        switchState(state);
      });
    });

    // 建档页开始评估
    const startBtn = $('btn-start-assess');
    if (startBtn) startBtn.addEventListener('click', startAssessment);

    // 评估页上下步
    const prev = $('btn-prev');
    const next = $('btn-next');
    if (prev) prev.addEventListener('click', prevStep);
    if (next) next.addEventListener('click', nextStep);

    // 报告页的演示按钮
    const demoHR = $('btn-demo-highrisk');
    if (demoHR) demoHR.addEventListener('click', demoHighRisk);
    const demoSF = $('btn-demo-safe');
    if (demoSF) demoSF.addEventListener('click', demoSafe);

    // 默认进入初始建档页
    switchState('profile');
  });
})();
