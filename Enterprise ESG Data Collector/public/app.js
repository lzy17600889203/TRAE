(function () {
  const state = {
    step: 0,
    totalSteps: 5,
    data: {
      companyName: '',
      reportPeriod: '',
      electricity: '',
      water: '',
      businessTravelAir: '',
      businessTravelRail: '',
      businessTravelRoad: '',
      wasteHazardous: '',
      wasteUnclassified: '',
      paper: '',
    },
  };

  const TITLES = {
    electricity: '用电',
    water: '用水',
    businessTravelAir: '航空差旅',
    businessTravelRail: '铁路差旅',
    businessTravelRoad: '公路差旅',
    wasteHazardous: '危险废弃物',
    wasteUnclassified: '未分类垃圾',
    paper: '办公用纸',
  };

  const els = {
    steps: document.querySelectorAll('.form-step'),
    labels: document.querySelectorAll('.step-label'),
    progressFill: document.getElementById('progressFill'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    submitBtn: document.getElementById('submitBtn'),
    statusChip: document.getElementById('statusChip'),
    statusText: document.getElementById('statusText'),
    inputs: document.querySelectorAll('input[data-field]'),
    resultHero: document.getElementById('resultHero'),
    resultHeroIcon: document.getElementById('resultHeroIcon'),
    resultNumber: document.getElementById('resultNumber'),
    resultClass: document.getElementById('resultClass'),
    badgeWrap: document.getElementById('badgeWrap'),
    warningBanner: document.getElementById('warningBanner'),
    breakdown: document.getElementById('breakdown'),
    recordsSection: document.getElementById('recordsSection'),
    recordsGrid: document.getElementById('recordsGrid'),
  };

  const STEP_VALIDATIONS = {
    0: (data) => {
      const errors = [];
      if (!data.companyName || !String(data.companyName).trim()) {
        errors.push({ field: 'companyName', msg: '请填写企业名称' });
      }
      return errors;
    },
  };

  function validateStep(step) {
    const validator = STEP_VALIDATIONS[step];
    if (!validator) return { ok: true, errors: [] };
    const errors = validator(state.data);
    return { ok: errors.length === 0, errors };
  }

  function highlightErrors(errors) {
    document.querySelectorAll('.field-error').forEach((el) => el.remove());
    document.querySelectorAll('input.is-required-error').forEach((el) =>
      el.classList.remove('is-required-error')
    );
    errors.forEach((err) => {
      const input = document.querySelector(
        `input[data-field="${err.field}"]`
      );
      if (!input) return;
      input.classList.add('is-required-error');
      const msg = document.createElement('div');
      msg.className = 'field-error';
      msg.textContent = err.msg;
      input.parentElement.appendChild(msg);
    });
  }

  function goToStep(step, { skipValidation } = {}) {
    // 向前推进时需要校验当前步骤
    if (!skipValidation && step > state.step) {
      const { ok, errors } = validateStep(state.step);
      if (!ok) {
        highlightErrors(errors);
        const firstErr = errors[0];
        const input = document.querySelector(
          `input[data-field="${firstErr.field}"]`
        );
        if (input) input.focus();
        return false;
      }
      highlightErrors([]);
    }

    state.step = Math.max(0, Math.min(state.totalSteps - 1, step));
    els.steps.forEach((s, i) => s.classList.toggle('is-active', i === state.step));
    els.labels.forEach((l, i) => l.classList.toggle('is-active', i === state.step));

    const percent = ((state.step + 1) / state.totalSteps) * 100;
    els.progressFill.style.width = percent + '%';

    els.prevBtn.disabled = state.step === 0;
    const isLast = state.step === state.totalSteps - 1;
    els.nextBtn.hidden = isLast;
    els.submitBtn.hidden = !isLast;

    if (isLast) {
      computeResult();
    }

    updateStatusChip();
    return true;
  }

  function updateStatusChip() {
    const anyFilled = Object.values(state.data).some(
      (v) => typeof v === 'string' ? v.trim() !== '' : Number(v) > 0
    );
    if (state.step === 0 && !anyFilled) {
      setChip('', '初始采集状态');
    } else if (state.step < state.totalSteps - 1) {
      setChip('', '数据录入中');
    } else {
      setChip('', '计算完成');
    }
  }

  function setChip(modifier, text) {
    els.statusChip.classList.remove('is-warn', 'is-danger');
    if (modifier) els.statusChip.classList.add(modifier);
    els.statusText.textContent = text;
  }

  function onInput(e) {
    const input = e.target;
    const field = input.dataset.field;
    const value = input.value;
    state.data[field] = value;

    // 输入时清除对应字段的必填错误态
    input.classList.remove('is-required-error');
    const parent = input.parentElement;
    if (parent) {
      const existing = parent.querySelector('.field-error');
      if (existing) existing.remove();
    }

    const numericFields = ['electricity', 'water', 'businessTravelAir',
      'businessTravelRail', 'businessTravelRoad', 'wasteHazardous',
      'wasteUnclassified', 'paper'];

    if (numericFields.includes(field)) {
      const num = Number(value);
      const warn = Number(input.dataset.warn);
      if (value !== '' && !Number.isNaN(num) && num > 0) {
        input.parentElement.classList.add('filled');
      } else {
        input.parentElement.classList.remove('filled');
      }
      if (!Number.isNaN(num) && !Number.isNaN(warn) && num > warn) {
        input.classList.add('is-warn');
      } else {
        input.classList.remove('is-warn');
      }
    } else if (value.trim()) {
      input.parentElement.classList.add('filled');
    } else {
      input.parentElement.classList.remove('filled');
    }

    updateStatusChip();
  }

  async function computeResult() {
    setChip('', '计算中…');
    els.warningBanner.hidden = true;
    els.resultHero.classList.remove('is-warn', 'is-danger');
    els.resultNumber.classList.remove('is-warn', 'is-danger');
    els.badgeWrap.innerHTML = '';
    els.breakdown.innerHTML = '<h3>排放构成</h3><div class="breakdown-list">正在计算…</div>';

    const payload = normalizePayload();

    let body;
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      body = await res.json();
    } catch (err) {
      els.breakdown.innerHTML =
        '<div style="color:#b33">网络异常，无法连接到后端。请确认已启动 Node.js 服务。</div>';
      return;
    }

    if (!body || !body.ok) {
      els.breakdown.innerHTML = '<div style="color:#b33">计算失败。</div>';
      return;
    }

    const { result, classification } = body;
    const total = result.total;

    animateNumber(els.resultNumber, total);

    if (classification === 'excellent') {
      els.resultHeroIcon.textContent = '🌱';
      els.resultClass.textContent = '碳排放极低，节能表现优秀';
      els.badgeWrap.innerHTML =
        '<div class="leaf-badge"><span>🍃</span><span>ESG 优等生</span></div>';
      setChip('', '绿色环保企业');
    } else if (classification === 'normal') {
      els.resultHeroIcon.textContent = '♻️';
      els.resultHero.classList.add('is-warn');
      els.resultNumber.classList.add('is-warn');
      els.resultClass.textContent = '处于行业中位区间，仍有优化空间';
      setChip('is-warn', '中等排放');
    } else {
      els.resultHeroIcon.textContent = '🔥';
      els.resultHero.classList.add('is-danger');
      els.resultNumber.classList.add('is-danger');
      els.resultClass.textContent = '碳排放显著偏高';
      els.warningBanner.hidden = false;
      setChip('is-danger', '高碳排放警告');
    }

    const items = Object.keys(result.breakdown)
      .map((k) => {
        const label = TITLES[k] || k;
        const val = Number(result.breakdown[k]).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `<div class="breakdown-item"><span>${label}</span><span class="val">${val} kg</span></div>`;
      })
      .join('');
    els.breakdown.innerHTML = `<h3>排放构成（共 ${Object.keys(result.breakdown).length} 项）</h3><div class="breakdown-list">${items}</div>`;
  }

  function animateNumber(targetEl, finalValue) {
    const start = performance.now();
    const duration = 900;
    const formattedFinal = finalValue.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = finalValue * eased;
      targetEl.innerHTML = `${current.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} <small>kg CO₂e</small>`;
      if (p < 1) requestAnimationFrame(tick);
      else targetEl.innerHTML = `${formattedFinal} <small>kg CO₂e</small>`;
    }
    requestAnimationFrame(tick);
  }

  function normalizePayload() {
    return {
      companyName: state.data.companyName || '',
      reportPeriod: state.data.reportPeriod || '',
      electricity: Number(state.data.electricity) || 0,
      water: Number(state.data.water) || 0,
      businessTravelAir: Number(state.data.businessTravelAir) || 0,
      businessTravelRail: Number(state.data.businessTravelRail) || 0,
      businessTravelRoad: Number(state.data.businessTravelRoad) || 0,
      wasteHazardous: Number(state.data.wasteHazardous) || 0,
      wasteUnclassified: Number(state.data.wasteUnclassified) || 0,
      paper: Number(state.data.paper) || 0,
    };
  }

  async function submitAndSave() {
    els.submitBtn.disabled = true;
    const payload = normalizePayload();
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (body && body.ok) {
        els.resultClass.textContent =
          '✅ 已保存，记录 #' + body.id + ' · ' + els.resultClass.textContent;
        await loadRecords();
      } else {
        alert('保存失败，请重试。');
      }
    } catch (err) {
      alert('网络异常，保存失败。');
    }
    els.submitBtn.disabled = false;
  }

  async function loadRecords() {
    try {
      const res = await fetch('/api/records');
      const body = await res.json();
      if (!body || !body.records) return;
      els.recordsSection.hidden = body.records.length === 0;
      els.recordsGrid.innerHTML = body.records
        .map((r) => {
          const tag =
            r.classification === 'excellent'
              ? { text: 'ESG 优等生', cls: '' }
              : r.classification === 'warning'
              ? { text: '高排放警告', cls: 'danger' }
              : { text: '中位排放', cls: 'warn' };
          const period = r.report_period || r.reportPeriod || '—';
          const name = r.company_name || r.companyName || '未命名';
          const total = r.total_emission != null ? r.total_emission : r.totalEmission;
          return `<div class="record-item">
            <div class="name">${name}</div>
            <div class="meta">${period}</div>
            <div class="meta">总排放：${Number(total).toLocaleString('zh-CN', {
              minimumFractionDigits: 2,
            })} kg CO₂e</div>
            <span class="tag ${tag.cls}">${tag.text}</span>
          </div>`;
        })
        .join('');
    } catch (_) {}
  }

  function addTickElements() {
    document.querySelectorAll('.field').forEach((field) => {
      if (!field.querySelector('.tick')) {
        const tick = document.createElement('span');
        tick.className = 'tick';
        tick.textContent = '✓';
        field.appendChild(tick);
      }
    });
  }

  function bind() {
    addTickElements();
    els.inputs.forEach((input) => input.addEventListener('input', onInput));
    els.nextBtn.addEventListener('click', () => goToStep(state.step + 1));
    els.prevBtn.addEventListener('click', () => goToStep(state.step - 1));
    els.submitBtn.addEventListener('click', submitAndSave);
  }

  bind();
  goToStep(0);
  loadRecords();
})();
