/**
 * 接单小助手 · 前端 SPA
 * -------------------------------------------------------
 * 架构等同于 Angular 的 Component + Service 模式：
 *   - ApiService       -> 封装后端 REST API (对应 HttpClient Service)
 *   - UiService        -> toast / validation / 动画 (共享 UI Service)
 *   - SummaryComponent -> 顶部汇总卡片
 *   - InvoiceTableComponent -> 账单表格（含状态变更、删除）
 *   - TimeEntryFormComponent -> 工时录入表单
 *   - InvoiceFormComponent  -> 账单生成表单
 *   - ClientFormComponent   -> 新增客户
 *   - ProjectFormComponent  -> 新增项目
 *   - TimeEntryTableComponent -> 最近工时列表
 *   - ScenarioSwitcher     -> 5 个演示场景切换按钮
 *   - ClockComponent       -> 时钟指针滴答动画
 *   - CoinAnimationService -> 硬币掉落特效
 *
 * 注意: 后端跑在 http://localhost:4000, CORS 已打开
 */

(function () {
  'use strict';

  const API_BASE = 'http://localhost:4000/api';

  // =============================================================
  //  工具函数
  // =============================================================
  function formatMoney(n) {
    const v = Number(n) || 0;
    return '¥' + v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function formatHours(n) {
    const v = Number(n) || 0;
    return v.toFixed(1) + ' h';
  }
  function statusText(s) {
    if (s === 'paid') return '已付款';
    if (s === 'unpaid') return '未付款';
    return '草稿';
  }
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function createEl(tag, props) {
    const el = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'text') el.textContent = props[k];
      else if (k === 'html') el.innerHTML = props[k];
      else el.setAttribute(k, props[k]);
    }
    return el;
  }

  // =============================================================
  //  ApiService (对应 Angular 的 HttpClient Service)
  // =============================================================
  const ApiService = {
    async get(path) {
      const r = await fetch(API_BASE + path);
      if (!r.ok) throw new Error('请求失败 ' + r.status);
      return r.json();
    },
    async post(path, body) {
      const opts = { method: 'POST' };
      if (body !== undefined && body !== null) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(body);
      }
      const r = await fetch(API_BASE + path, opts);
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error('请求失败 ' + r.status + ' ' + txt);
      }
      return r.json();
    },
    async patch(path, body) {
      const r = await fetch(API_BASE + path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      });
      if (!r.ok) throw new Error('请求失败 ' + r.status);
      return r.json();
    },
    async delete(path) {
      const r = await fetch(API_BASE + path, { method: 'DELETE' });
      if (!r.ok) throw new Error('请求失败 ' + r.status);
      return r.json();
    }
  };

  // =============================================================
  //  UiService (共享 UI Service)
  // =============================================================
  const UiService = {
    toastTimer: null,
    toast(msg, type) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.remove('show-ok', 'show-err');
      el.classList.add(type === 'error' ? 'show-err' : 'show-ok');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        el.classList.remove('show-ok', 'show-err');
      }, 3000);
    },
    showValidation(msg) {
      const el = document.getElementById('te-validation');
      if (!el) return;
      if (msg) {
        el.textContent = '⚠️ ' + msg;
        el.classList.add('show');
      } else {
        el.classList.remove('show');
      }
    }
  };

  // =============================================================
  //  CoinAnimationService —— 账单生成时的硬币掉落特效
  // =============================================================
  const CoinAnimationService = {
    drop(count) {
      const stage = document.getElementById('coin-stage');
      if (!stage) return;
      count = Math.max(8, Math.min(40, count | 0));
      for (let i = 0; i < count; i++) {
        const c = createEl('div', { class: 'coin' });
        c.style.left = (Math.random() * 96 + 2) + '%';
        c.style.animationDuration = (1.1 + Math.random() * 0.7) + 's';
        c.style.animationDelay = (Math.random() * 0.5) + 's';
        stage.appendChild(c);
        setTimeout(() => { if (c.parentNode) c.parentNode.removeChild(c); }, 2600);
      }
    }
  };

  // =============================================================
  //  ClockComponent —— 时钟指针滴答动画
  // =============================================================
  const ClockComponent = {
    start() {
      const hour = document.getElementById('hour-hand');
      const minute = document.getElementById('minute-hand');
      const second = document.getElementById('second-hand');
      if (!hour || !minute || !second) return;
      const tick = () => {
        const now = new Date();
        const s = now.getSeconds() + now.getMilliseconds() / 1000;
        const m = now.getMinutes() + s / 60;
        const h = (now.getHours() % 12) + m / 60;
        second.style.transform = 'rotate(' + (s * 6) + 'deg)';
        minute.style.transform = 'rotate(' + (m * 6) + 'deg)';
        hour.style.transform = 'rotate(' + (h * 30) + 'deg)';
      };
      tick();
      setInterval(tick, 1000);
    }
  };

  // =============================================================
  //  DataStore (类似 NgRx / 简单的状态管理)
  // =============================================================
  const DataStore = {
    state: {
      clients: [],
      projects: [],
      timeEntries: [],
      invoices: [],
      summary: { totalHours: 0, totalAmount: 0, unpaid: 0, invoiceCount: 0 },
      invoiceFilter: ''
    },
    listeners: [],
    onChange(fn) { this.listeners.push(fn); },
    emit() { this.listeners.forEach(fn => fn(this.state)); },

    async refreshAll() {
      const [clients, projects, invoices, entries, summary] = await Promise.all([
        ApiService.get('/clients'),
        ApiService.get('/projects/detail'),
        ApiService.get('/invoices'),
        ApiService.get('/time-entries'),
        ApiService.get('/summary')
      ]);
      this.state.clients = clients || [];
      this.state.projects = projects || [];
      this.state.invoices = invoices || [];
      this.state.timeEntries = entries || [];
      this.state.summary = summary || this.state.summary;
      this.emit();
    }
  };

  // =============================================================
  //  SummaryComponent
  // =============================================================
  const SummaryComponent = {
    render(state) {
      const s = state.summary || {};
      document.getElementById('sum-hours').textContent = formatHours(s.totalHours);
      document.getElementById('sum-amount').textContent = formatMoney(s.totalAmount);
      document.getElementById('sum-unpaid').textContent = formatMoney(s.unpaid);
      document.getElementById('sum-count').textContent = s.invoiceCount;
    }
  };

  // =============================================================
  //  InvoiceTableComponent
  // =============================================================
  const InvoiceTableComponent = {
    render(state) {
      const tbody = document.getElementById('invoice-tbody');
      if (!tbody) return;
      const filter = state.invoiceFilter;
      const list = filter ? (state.invoices || []).filter(inv => inv.status === filter) : (state.invoices || []);
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty">暂无账单记录，点击上方"生成账单"按钮试试</td></tr>';
        return;
      }
      tbody.innerHTML = list.map((inv, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(inv.project_name || '—')}</td>
          <td>${escapeHtml(inv.client_name || '—')}</td>
          <td>${inv.year}-${String(inv.month).padStart(2, '0')}</td>
          <td class="hours">${formatHours(inv.total_hours)}</td>
          <td class="amount">${formatMoney(inv.total_amount)}</td>
          <td>
            <select data-id="${inv.id}" class="status-select">
              <option value="draft" ${inv.status === 'draft' ? 'selected' : ''}>草稿</option>
              <option value="unpaid" ${inv.status === 'unpaid' ? 'selected' : ''}>未付款</option>
              <option value="paid" ${inv.status === 'paid' ? 'selected' : ''}>已付款</option>
            </select>
            <span class="badge ${inv.status}">${statusText(inv.status)}</span>
          </td>
          <td>${escapeHtml(inv.note || '—')}</td>
          <td><button class="del" data-id="${inv.id}">删除</button></td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          const id = Number(sel.getAttribute('data-id'));
          const status = sel.value;
          try {
            await ApiService.patch('/invoices/' + id, { status });
            UiService.toast('状态已更新为：' + statusText(status));
            await DataStore.refreshAll();
          } catch (e) { UiService.toast(e.message, 'error'); }
        });
      });
      tbody.querySelectorAll('button.del').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = Number(btn.getAttribute('data-id'));
          if (!confirm('确定删除该账单？')) return;
          try {
            await ApiService.delete('/invoices/' + id);
            UiService.toast('账单已删除');
            await DataStore.refreshAll();
          } catch (e) { UiService.toast(e.message, 'error'); }
        });
      });
    }
  };

  // =============================================================
  //  TimeEntryTableComponent
  // =============================================================
  const TimeEntryTableComponent = {
    render(state) {
      const tbody = document.getElementById('time-tbody');
      if (!tbody) return;
      const rows = (state.timeEntries || []).slice(0, 40);
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">暂无工时记录</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(te => `
        <tr>
          <td>${escapeHtml(te.work_date || '—')}</td>
          <td>${escapeHtml(te.project_name || '—')}</td>
          <td>${escapeHtml(te.client_name || '—')}</td>
          <td class="hours">${formatHours(te.hours)}</td>
          <td>${escapeHtml(te.description || '—')}</td>
        </tr>
      `).join('');
    }
  };

  // =============================================================
  //  Project select helper (跨表单复用)
  // =============================================================
  function renderProjectSelects(state) {
    const projects = state.projects || [];
    const opts = projects.map(p => {
      const label = `${p.client_name || ''} / ${p.name} (${p.billing_mode === 'flat' ? '按件 ¥' + p.rate : '¥' + p.rate + '/h'})`;
      return `<option value="${p.id}">${escapeHtml(label)}</option>`;
    }).join('');
    const te = document.getElementById('te-project');
    const iv = document.getElementById('inv-project');
    if (te) te.innerHTML = opts;
    if (iv) iv.innerHTML = opts;

    const clientSel = document.getElementById('p-client');
    if (clientSel) {
      clientSel.innerHTML = (state.clients || []).map(c =>
        `<option value="${c.id}">${escapeHtml(c.name)}</option>`
      ).join('');
    }
  }

  // =============================================================
  //  TimeEntryFormComponent
  // =============================================================
  const TimeEntryFormComponent = {
    init() {
      const form = document.getElementById('time-form');
      if (!form) return;
      document.getElementById('te-date').value = todayStr();
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pid = Number(document.getElementById('te-project').value);
        const date = document.getElementById('te-date').value;
        const hoursRaw = parseFloat(document.getElementById('te-hours').value);
        const desc = document.getElementById('te-desc').value;

        if (!pid || !date) { UiService.toast('请选择项目和日期', 'error'); return; }
        if (isNaN(hoursRaw)) { UiService.toast('工时必须是数字', 'error'); return; }

        // ---- 鲁棒性: 超 24h / 负数不崩, 自动钳制 + 提示 ----
        const warnings = [];
        if (hoursRaw > 24) warnings.push('单日工时超过 24 小时，已自动修正为 24 小时');
        if (hoursRaw < 0)  warnings.push('工时为负数，已自动修正为 0');
        const safeHours = Math.max(0, Math.min(24, Number(hoursRaw) || 0));
        UiService.showValidation(warnings.join(' | '));

        try {
          const r = await ApiService.post('/time-entries', {
            project_id: pid, work_date: date, hours: safeHours, description: desc
          });
          UiService.toast('已添加 ' + formatHours(r.entry.hours) + (warnings.length ? '（输入已自动修正）' : ''));
          document.getElementById('te-desc').value = '';
          document.getElementById('te-hours').value = '';
          await DataStore.refreshAll();
        } catch (e) { UiService.toast(e.message, 'error'); }
      });

      document.getElementById('te-crazy').addEventListener('click', () => {
        document.getElementById('te-hours').value = '25';
        UiService.showValidation('已填入 25 小时 — 提交试试：会自动钳制并给出提示，页面不会崩。同时后端 /time-entries 也会做同样的钳制');
        UiService.toast('💡 试试提交看看：25 小时会被自动修正', 'error');
        CoinAnimationService.drop(6);
      });
    }
  };

  // =============================================================
  //  InvoiceFormComponent
  // =============================================================
  const InvoiceFormComponent = {
    init() {
      const form = document.getElementById('invoice-form');
      if (!form) return;
      const now = new Date();
      document.getElementById('inv-year').value = now.getFullYear();
      document.getElementById('inv-month').value = now.getMonth() + 1;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pid = Number(document.getElementById('inv-project').value);
        const y = Number(document.getElementById('inv-year').value);
        const m = Number(document.getElementById('inv-month').value);
        if (!pid || !y || !m) { UiService.toast('请填写完整参数', 'error'); return; }
        const btn = document.getElementById('gen-btn');
        btn.disabled = true;
        btn.textContent = '生成中...';
        try {
          const r = await ApiService.post('/invoices/generate', { project_id: pid, year: y, month: m });
          CoinAnimationService.drop(22);
          UiService.toast('账单已生成！金额 ' + formatMoney(r.invoice.total_amount));
          await DataStore.refreshAll();
        } catch (e) { UiService.toast(e.message, 'error'); }
        finally { btn.disabled = false; btn.textContent = '🧾 生成 / 更新账单 (含硬币特效)'; }
      });
    }
  };

  // =============================================================
  //  ClientFormComponent
  // =============================================================
  const ClientFormComponent = {
    init() {
      const form = document.getElementById('client-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('c-name').value.trim();
        const contact = document.getElementById('c-contact').value.trim();
        if (!name) { UiService.toast('客户名不能为空', 'error'); return; }
        try {
          await ApiService.post('/clients', { name, contact });
          UiService.toast('客户已添加');
          document.getElementById('c-name').value = '';
          document.getElementById('c-contact').value = '';
          await DataStore.refreshAll();
        } catch (e) { UiService.toast(e.message, 'error'); }
      });
    }
  };

  // =============================================================
  //  ProjectFormComponent
  // =============================================================
  const ProjectFormComponent = {
    init() {
      const form = document.getElementById('project-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cid = Number(document.getElementById('p-client').value);
        const name = document.getElementById('p-name').value.trim();
        const rateRaw = parseFloat(document.getElementById('p-rate').value);
        const mode = document.getElementById('p-mode').value;
        if (!cid || !name) { UiService.toast('请选择客户并填写项目名', 'error'); return; }
        const warnings = [];
        if (isNaN(rateRaw) || rateRaw < 0) warnings.push('时薪为负数或非法，已修正为 0');
        const safeRate = Math.max(0, Number(rateRaw) || 0);
        UiService.showValidation(warnings.join(' | '));
        try {
          await ApiService.post('/projects', { client_id: cid, name, rate: safeRate, billing_mode: mode });
          UiService.toast('项目已添加');
          document.getElementById('p-name').value = '';
          document.getElementById('p-rate').value = '';
          await DataStore.refreshAll();
        } catch (e) { UiService.toast(e.message, 'error'); }
      });
    }
  };

  // =============================================================
  //  ScenarioSwitcher —— 5 个演示场景
  // =============================================================
  const ScenarioSwitcher = {
    init() {
      const btns = document.querySelectorAll('.scenario-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.getAttribute('data-key');
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          document.getElementById('scenario-status').textContent = '切换中...';
          try {
            await ApiService.post('/scenarios/load', { key });
            document.getElementById('scenario-status').textContent = '当前场景：' + btn.textContent;
            CoinAnimationService.drop(12);
            await DataStore.refreshAll();
          } catch (e) {
            UiService.toast('场景切换失败：' + e.message, 'error');
            document.getElementById('scenario-status').textContent = '';
          }
        });
      });

      const filterSel = document.getElementById('invoice-filter');
      if (filterSel) {
        filterSel.addEventListener('change', () => {
          DataStore.state.invoiceFilter = filterSel.value;
          InvoiceTableComponent.render(DataStore.state);
        });
      }
    }
  };

  // =============================================================
  //  App boot (对应 Angular 的 platformBrowserDynamic.bootstrapModule)
  // =============================================================
  const AppModule = {
    async bootstrap() {
      ClockComponent.start();
      TimeEntryFormComponent.init();
      InvoiceFormComponent.init();
      ClientFormComponent.init();
      ProjectFormComponent.init();
      ScenarioSwitcher.init();

      // 订阅 store 变化, 统一刷新视图
      DataStore.onChange(state => {
        SummaryComponent.render(state);
        InvoiceTableComponent.render(state);
        TimeEntryTableComponent.render(state);
        renderProjectSelects(state);
      });

      try {
        await DataStore.refreshAll();
      } catch (e) {
        UiService.toast('无法连接后端 ' + API_BASE + '（请启动 npm start）', 'error');
        document.getElementById('invoice-tbody').innerHTML =
          '<tr><td colspan="9" class="empty">⚠️ 后端未启动，请先运行 <code>cd server && npm install && npm start</code></td></tr>';
      }
    }
  };

  // DOM ready 后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppModule.bootstrap());
  } else {
    AppModule.bootstrap();
  }
})();
