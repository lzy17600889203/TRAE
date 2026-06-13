// ============ 状态 ============
const state = {
  profile: { name: '', title: '', email: '', phone: '', location: '', summary: '', theme: 'minimal' },
  experiences: [],
  skills: [],
  projects: [],
  education: []
};

const themeLabels = { minimal: '极简黑白', geek: '极客暗黑', academic: '学术严谨' };

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', async () => {
  await loadFromServer();
  bindThemeButtons();
  bindActions();
  bindRootInputs();
  renderAllItemLists();
  renderResume();
  applyTheme(state.profile.theme);
  checkOverflow();
});

async function loadFromServer() {
  try {
    const resp = await fetch('/api/resume');
    if (resp.ok) {
      const data = await resp.json();
      if (data.profile) state.profile = { ...state.profile, ...data.profile };
      state.experiences = data.experiences || [];
      state.skills = data.skills || [];
      state.projects = data.projects || [];
      state.education = data.education || [];
    }
  } catch (e) { console.warn('load failed, using empty template', e); }
}

// ============ 主题切换 ============
function bindThemeButtons() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      state.profile.theme = theme;
      applyTheme(theme);
      renderResume();
    });
  });
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    const active = btn.dataset.theme === theme;
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

// ============ 顶部按钮 ============
function bindActions() {
  document.getElementById('btnSave').addEventListener('click', saveToServer);
  document.getElementById('btnDemo').addEventListener('click', loadDemoData);
  document.getElementById('btnClear').addEventListener('click', clearAll);
  document.getElementById('btnExport').addEventListener('click', exportPDF);
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addItem(btn.dataset.add));
  });
}

function bindRootInputs() {
  document.querySelectorAll('[data-bind]').forEach(input => {
    const key = input.dataset.bind;
    input.value = state.profile[key] || '';
    input.addEventListener('input', () => {
      state.profile[key] = input.value;
      renderResume();
    });
  });
}

// ============ 动态列表 ============
function renderAllItemLists() {
  renderEducationList();
  renderExperienceList();
  renderSkillList();
  renderProjectList();
}

function addItem(kind) {
  if (kind === 'experience') {
    state.experiences.push({ company: '', position: '', start_date: '', end_date: '', description: '' });
    renderExperienceList();
  } else if (kind === 'skill') {
    state.skills.push({ name: '', category: '' });
    renderSkillList();
  } else if (kind === 'project') {
    state.projects.push({ name: '', description: '', link: '' });
    renderProjectList();
  } else if (kind === 'education') {
    state.education.push({ school: '', degree: '', start_date: '', end_date: '' });
    renderEducationList();
  }
  renderResume();
}

function renderExperienceList() {
  const wrap = document.getElementById('list-experiences');
  wrap.innerHTML = '';
  state.experiences.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <button class="btn-remove" title="删除">×</button>
      <div class="field-row"><label>公司名称</label><input type="text" placeholder="如：阿里巴巴" data-key="company"></div>
      <div class="field-row"><label>职位</label><input type="text" placeholder="如：高级前端工程师" data-key="position"></div>
      <div class="field-row-two">
        <div class="field-row half"><label>开始时间</label><input type="text" placeholder="2022.03" data-key="start_date"></div>
        <div class="field-row half"><label>结束时间</label><input type="text" placeholder="至今" data-key="end_date"></div>
      </div>
      <div class="field-row"><label>工作描述（每行一条）</label><textarea rows="3" placeholder="负责 XX 模块的设计与开发..." data-key="description"></textarea></div>
    `;
    card.querySelectorAll('[data-key]').forEach(inp => {
      const k = inp.dataset.key;
      inp.value = item[k] || '';
      inp.addEventListener('input', () => {
        state.experiences[i][k] = inp.value;
        renderResume();
      });
    });
    card.querySelector('.btn-remove').addEventListener('click', () => {
      state.experiences.splice(i, 1);
      renderExperienceList();
      renderResume();
    });
    wrap.appendChild(card);
  });
}

function renderSkillList() {
  const wrap = document.getElementById('list-skills');
  wrap.innerHTML = '';
  state.skills.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <button class="btn-remove" title="删除">×</button>
      <div class="field-row"><label>技能名称</label><input type="text" placeholder="如：JavaScript" data-key="name"></div>
      <div class="field-row"><label>分类（可选）</label><input type="text" placeholder="如：编程语言 / 框架" data-key="category"></div>
    `;
    card.querySelectorAll('[data-key]').forEach(inp => {
      const k = inp.dataset.key;
      inp.value = item[k] || '';
      inp.addEventListener('input', () => {
        state.skills[i][k] = inp.value;
        renderResume();
      });
    });
    card.querySelector('.btn-remove').addEventListener('click', () => {
      state.skills.splice(i, 1);
      renderSkillList();
      renderResume();
    });
    wrap.appendChild(card);
  });
}

function renderProjectList() {
  const wrap = document.getElementById('list-projects');
  wrap.innerHTML = '';
  state.projects.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <button class="btn-remove" title="删除">×</button>
      <div class="field-row"><label>项目名称</label><input type="text" placeholder="如：Portfolio Website" data-key="name"></div>
      <div class="field-row"><label>项目链接</label><input type="text" placeholder="https://..." data-key="link"></div>
      <div class="field-row"><label>描述</label><textarea rows="2" placeholder="一句话描述项目亮点..." data-key="description"></textarea></div>
    `;
    card.querySelectorAll('[data-key]').forEach(inp => {
      const k = inp.dataset.key;
      inp.value = item[k] || '';
      inp.addEventListener('input', () => {
        state.projects[i][k] = inp.value;
        renderResume();
      });
    });
    card.querySelector('.btn-remove').addEventListener('click', () => {
      state.projects.splice(i, 1);
      renderProjectList();
      renderResume();
    });
    wrap.appendChild(card);
  });
}

function renderEducationList() {
  const wrap = document.getElementById('list-education');
  wrap.innerHTML = '';
  state.education.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <button class="btn-remove" title="删除">×</button>
      <div class="field-row"><label>学校</label><input type="text" placeholder="如：清华大学" data-key="school"></div>
      <div class="field-row"><label>学位</label><input type="text" placeholder="如：计算机科学 · 本科" data-key="degree"></div>
      <div class="field-row-two">
        <div class="field-row half"><label>开始</label><input type="text" placeholder="2018.09" data-key="start_date"></div>
        <div class="field-row half"><label>结束</label><input type="text" placeholder="2022.06" data-key="end_date"></div>
      </div>
    `;
    card.querySelectorAll('[data-key]').forEach(inp => {
      const k = inp.dataset.key;
      inp.value = item[k] || '';
      inp.addEventListener('input', () => {
        state.education[i][k] = inp.value;
        renderResume();
      });
    });
    card.querySelector('.btn-remove').addEventListener('click', () => {
      state.education.splice(i, 1);
      renderEducationList();
      renderResume();
    });
    wrap.appendChild(card);
  });
}

// ============ 简历渲染 ============
function hasAnyContent() {
  const p = state.profile;
  return !!(p.name || p.title || p.email || p.phone || p.location || p.summary ||
    state.experiences.length || state.skills.length || state.projects.length || state.education.length);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emptyPlaceholder(text) {
  return `<div class="r-empty-dashed">— ${text} —</div>`;
}

function renderResume() {
  const root = document.getElementById('resumeContent');
  const p = state.profile;

  const headerHtml = `
    <div class="r-header">
      <div>
        <div class="r-name">${escapeHtml(p.name) || '你的姓名'}</div>
        <div class="r-title">${escapeHtml(p.title) || '你的头衔 / 职位目标'}</div>
      </div>
      <div class="r-contact">
        ${p.email ? `<div>${escapeHtml(p.email)}</div>` : ''}
        ${p.phone ? `<div>${escapeHtml(p.phone)}</div>` : ''}
        ${p.location ? `<div>${escapeHtml(p.location)}</div>` : ''}
      </div>
    </div>
  `;

  let body = '';

  // 个人简介
  if (p.summary && p.summary.trim()) {
    body += `
      <section class="r-section">
        <div class="r-section-title">个人简介 / Profile</div>
        <div class="r-summary">${escapeHtml(p.summary)}</div>
      </section>`;
  }

  // 教育背景
  if (state.education.length) {
    let items = '';
    state.education.forEach(e => {
      if (!(e.school || e.degree || e.start_date || e.end_date)) return;
      items += `
        <div class="r-edu">
          <div class="r-edu-head">
            <span class="r-edu-school">${escapeHtml(e.school) || '学校名称'}</span>
            <span class="r-edu-date">${escapeHtml(e.start_date) || '开始'} – ${escapeHtml(e.end_date) || '结束'}</span>
          </div>
          <div class="r-edu-degree">${escapeHtml(e.degree) || '学位 / 专业'}</div>
        </div>`;
    });
    body += `<section class="r-section"><div class="r-section-title">教育背景 / Education</div>${items || emptyPlaceholder('添加你的教育经历')}</section>`;
  }

  // 工作经历
  if (state.experiences.length) {
    let items = '';
    state.experiences.forEach(e => {
      if (!(e.company || e.position || e.description)) return;
      items += `
        <div class="r-exp">
          <div class="r-exp-head">
            <span class="r-exp-company">${escapeHtml(e.company) || '公司名称'}</span>
            <span class="r-exp-date">${escapeHtml(e.start_date) || '开始'} – ${escapeHtml(e.end_date) || '至今'}</span>
          </div>
          <div class="r-exp-position">${escapeHtml(e.position) || '职位'}</div>
          <div class="r-exp-desc">${escapeHtml(e.description) || '工作描述...'}</div>
        </div>`;
    });
    body += `<section class="r-section"><div class="r-section-title">工作经历 / Experience</div>${items || emptyPlaceholder('添加你的工作经历')}</section>`;
  }

  // 技能标签
  if (state.skills.length) {
    const categorized = {};
    const uncategorized = [];
    state.skills.forEach(s => {
      if (!s.name) return;
      if (s.category && s.category.trim()) {
        if (!categorized[s.category]) categorized[s.category] = [];
        categorized[s.category].push(s.name);
      } else {
        uncategorized.push(s.name);
      }
    });
    let items = '';
    Object.keys(categorized).forEach(cat => {
      items += `<div class="r-skill-cat">${escapeHtml(cat)}</div>`;
      items += `<div class="r-skill-list">${categorized[cat].map(n => `<span class="r-skill-pill">${escapeHtml(n)}</span>`).join('')}</div>`;
    });
    if (uncategorized.length) {
      items += `<div class="r-skill-list">${uncategorized.map(n => `<span class="r-skill-pill">${escapeHtml(n)}</span>`).join('')}</div>`;
    }
    body += `<section class="r-section"><div class="r-section-title">技能 / Skills</div>${items || emptyPlaceholder('添加你的技能标签')}</section>`;
  }

  // 项目
  if (state.projects.length) {
    let items = '';
    state.projects.forEach(p2 => {
      if (!(p2.name || p2.link || p2.description)) return;
      items += `
        <div class="r-project">
          <div class="r-project-head">
            <span class="r-project-name">${escapeHtml(p2.name) || '项目名称'}</span>
          </div>
          ${p2.link ? `<a class="r-project-link" href="${escapeHtml(p2.link)}" target="_blank" rel="noopener">${escapeHtml(p2.link)}</a>` : ''}
          ${p2.description ? `<div class="r-project-desc">${escapeHtml(p2.description)}</div>` : ''}
        </div>`;
    });
    body += `<section class="r-section"><div class="r-section-title">项目 / Projects</div>${items || emptyPlaceholder('添加你的项目链接')}</section>`;
  }

  // 空白模板状态
  if (!hasAnyContent()) {
    root.innerHTML = `
      ${headerHtml}
      <section class="r-section">
        <div class="r-empty-dashed">添加一句简短的个人简介，让雇主认识你</div>
      </section>
      <section class="r-section">
        <div class="r-section-title">教育背景 / Education</div>
        <div class="r-empty-dashed">从左侧添加你的第一条教育经历</div>
      </section>
      <section class="r-section">
        <div class="r-section-title">工作经历 / Experience</div>
        <div class="r-empty-dashed">从左侧添加你的第一条工作经历</div>
      </section>
      <section class="r-section">
        <div class="r-section-title">技能 / Skills</div>
        <div class="r-empty-dashed">添加 5-10 个关键技能，它们会以药丸标签呈现</div>
      </section>
      <section class="r-section">
        <div class="r-section-title">项目 / Projects</div>
        <div class="r-empty-dashed">添加你的项目链接与亮点描述</div>
      </section>
    `;
  } else {
    root.innerHTML = headerHtml + body;
  }

  // 延迟检测溢出
  requestAnimationFrame(checkOverflow);
}

// ============ 溢出检测（A4 单页判断） ============
let overflowCheckTimer = null;
function checkOverflow() {
  if (overflowCheckTimer) clearTimeout(overflowCheckTimer);
  overflowCheckTimer = setTimeout(() => {
    const page = document.getElementById('resumePage');
    const content = document.getElementById('resumeContent');
    if (!page || !content) return;

    const pageHeight = page.getBoundingClientRect().height; // 297mm ≈ 1122.5px
    const contentHeight = content.scrollHeight;
    // A4 297mm 的像素高度（根据浏览器 DPI 约 3.7795 px/mm）
    const a4Px = 297 * 3.7795;

    const warning = document.getElementById('warningBar');
    if (contentHeight > a4Px + 20) {
      warning.hidden = false;
    }
    // 不自动隐藏，用户可手动关掉
  }, 150);
}

// ============ 保存 / 清空 / 演示 ============
async function saveToServer() {
  const btn = document.getElementById('btnSave');
  const oldText = btn.textContent;
  btn.textContent = '保存中...';
  try {
    const resp = await fetch('/api/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...state.profile,
        experiences: state.experiences,
        skills: state.skills,
        projects: state.projects,
        education: state.education
      })
    });
    if (resp.ok) {
      btn.textContent = '✓ 已保存';
      setTimeout(() => { btn.textContent = oldText; }, 1200);
    }
  } catch (e) {
    btn.textContent = '保存失败';
    setTimeout(() => { btn.textContent = oldText; }, 1200);
  }
}

function clearAll() {
  if (!confirm('确定要清空所有数据吗？此操作不可恢复。')) return;
  state.profile = { name: '', title: '', email: '', phone: '', location: '', summary: '', theme: state.profile.theme };
  state.experiences = [];
  state.skills = [];
  state.projects = [];
  state.education = [];
  document.querySelectorAll('[data-bind]').forEach(i => i.value = '');
  renderAllItemLists();
  renderResume();
}

function loadDemoData() {
  state.profile = {
    name: '李明轩',
    title: '高级前端工程师 · Full-stack Developer',
    email: 'mingxuan.li@example.com',
    phone: '+86 138 6688 8866',
    location: '上海 · 浦东',
    summary: '8 年前端经验，专注于大型 Web 应用的架构设计与性能优化。主导过多个百万 DAU 产品的前端重构，熟悉 React/Vue/Node 全栈技术体系，擅长团队协作与技术选型决策。',
    theme: state.profile.theme
  };
  state.education = [
    { school: '上海交通大学', degree: '计算机科学与技术 · 硕士', start_date: '2014.09', end_date: '2017.06' },
    { school: '华中科技大学', degree: '软件工程 · 本科', start_date: '2010.09', end_date: '2014.06' }
  ];
  state.experiences = [
    {
      company: '字节跳动',
      position: '高级前端工程师 · 团队负责人',
      start_date: '2021.03',
      end_date: '至今',
      description: '主导核心业务 B 端平台的前端架构升级，设计微前端方案，支持 12 个子团队独立开发\n推动前端基础设施建设，搭建组件库与 CLI 工具链，研发效率提升 40%\n负责 6 人小组管理，完成季度目标并输出 2 项专利'
    },
    {
      company: '美团',
      position: '前端工程师',
      start_date: '2018.07',
      end_date: '2021.02',
      description: '参与外卖 C 端 H5 业务开发，负责订单流程与支付模块\n首屏加载优化至 1.2s 以内，转化率提升 3.5%\n推动 TypeScript 迁移，代码质量与可维护性显著提升'
    }
  ];
  state.skills = [
    { name: 'JavaScript', category: '编程语言' },
    { name: 'TypeScript', category: '编程语言' },
    { name: 'Python', category: '编程语言' },
    { name: 'React', category: '前端框架' },
    { name: 'Vue.js', category: '前端框架' },
    { name: 'Next.js', category: '前端框架' },
    { name: 'Node.js', category: '后端' },
    { name: 'GraphQL', category: '后端' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'AWS', category: 'DevOps' },
    { name: '团队管理', category: '软技能' },
    { name: '技术架构', category: '软技能' }
  ];
  state.projects = [
    {
      name: '开源组件库 · UI-Core',
      description: '基于 TypeScript + React 的企业级组件库，GitHub 3.2k stars，支持主题定制与国际化',
      link: 'https://github.com/example/ui-core'
    },
    {
      name: '个人技术博客',
      description: '独立搭建的技术博客平台，累计发表 80+ 篇深度文章，月访问量 10 万+',
      link: 'https://mingxuan.dev'
    },
    {
      name: 'Resume Builder',
      description: '所见即所得的简历生成器（即本项目），支持多主题与一键 PDF 导出',
      link: 'https://resume.example.com'
    }
  ];

  document.querySelectorAll('[data-bind]').forEach(i => { i.value = state.profile[i.dataset.bind] || ''; });
  renderAllItemLists();
  renderResume();
}

// ============ PDF 导出 ============
async function exportPDF() {
  const mask = document.getElementById('loadingMask');
  mask.hidden = false;
  try {
    if (typeof html2pdf === 'undefined') {
      throw new Error('PDF 导出库加载失败，请检查网络连接');
    }

    const resumeNode = document.getElementById('resumePage');
    const name = state.profile.name || 'resume';
    const filename = `${name}-简历.pdf`;

    // 克隆节点并内联当前主题的 CSS 变量，确保 PDF 中的样式正确
    const clone = resumeNode.cloneNode(true);
    const styles = window.getComputedStyle(document.body);
    const themeVars = [
      '--c-bg', '--c-ink', '--c-muted', '--c-line', '--c-accent',
      '--c-pill-bg', '--c-pill-ink', '--c-link', '--font-sans', '--font-serif', '--font-mono'
    ];
    let styleStr = '';
    themeVars.forEach(v => {
      styleStr += v + ': ' + styles.getPropertyValue(v).trim() + '; ';
    });
    clone.setAttribute('style', styleStr + ' box-shadow: none;');

    // 隐藏滚动容器样式以确保截图干净
    clone.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el);
      // 确保透明度和可见性
      if (cs.visibility === 'hidden' || cs.display === 'none') {
        el.style.display = 'none';
      }
    });

    // A4: 210mm x 297mm
    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(clone).save();
  } catch (err) {
    alert('PDF 导出失败：' + err.message);
  } finally {
    setTimeout(() => { mask.hidden = true; }, 800);
  }
}
