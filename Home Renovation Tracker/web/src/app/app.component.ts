import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RenovationService,
  Scenario,
  Stage,
  Expense
} from './renovation.service';
import { TapeBarComponent } from './tape-bar.component';

function fmtMoney(v: any): string {
  const n = Number(v);
  if (!isFinite(n) || isNaN(n)) return '¥0.00';
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TapeBarComponent],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <div class="brand">
          <div class="logo">🧰</div>
          <div>
            <h1>装修记账本</h1>
            <p class="subtitle">Angular + Fastify + SQLite · 预算与支出一目了然</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="reseed()">
            🔄 重新生成演示数据
          </button>
        </div>
      </header>

      <section class="scenario-strip">
        <h2 class="section-title">一键体验场景</h2>
        <div class="scenario-cards">
          <button
            *ngFor="let s of scenarios"
            class="scenario-card"
            [ngClass]="{ active: activeKey === s.key }"
            (click)="selectScenario(s.key)"
          >
            <div class="scenario-name">{{ s.name }}</div>
            <div class="scenario-desc">{{ s.description }}</div>
          </button>
        </div>
      </section>

      <section class="summary" *ngIf="detail">
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">总计划预算</div>
            <div class="summary-amount">{{ fmtMoney(totalPlanned) }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">总实际支出</div>
            <div
              class="summary-amount"
              [ngClass]="{ 'over-budget': totalActual > totalPlanned && totalPlanned > 0, shake: triggerShake }"
            >
              {{ fmtMoney(totalActual) }}
              <span class="diff" *ngIf="asNumber(totalPlanned) > 0">
                ({{ asNumber(totalActual) >= asNumber(totalPlanned) ? '超支' : '节约' }}
                {{ diffMoney(totalActual, totalPlanned) }})
              </span>
            </div>
          </div>
          <div class="summary-card tape-card">
            <app-tape-bar
              label="总预算使用率"
              [planned]="totalPlanned"
              [actual]="totalActual"
            ></app-tape-bar>
          </div>
        </div>
      </section>

      <section class="builder" *ngIf="detail">
        <div class="builder-head">
          <h2>{{ detail.scenario.name }}</h2>
          <div class="builder-actions">
            <button class="btn btn-primary" (click)="startAddStage()">
              + 新增大阶段
            </button>
          </div>
        </div>

        <div class="stage-add" *ngIf="showStageForm">
          <div class="add-expense-title">➕ 新建阶段</div>
          <div class="stage-add-body">
            <label class="field field-wide">
              <span class="field-label">阶段名称</span>
              <input type="text" [(ngModel)]="newStage.name" placeholder="如：水电 / 泥瓦 / 木工" />
            </label>
            <label class="field">
              <span class="field-label">计划金额</span>
              <input type="number" step="0.01" [(ngModel)]="newStage.planned_amount" placeholder="0" />
            </label>
            <div class="field field-submit" style="justify-content: flex-start;">
              <button class="btn btn-primary" (click)="submitStage()">保存阶段</button>
              <button class="btn btn-ghost" (click)="cancelStage()">取消</button>
            </div>
          </div>
        </div>

        <div class="stages">
          <div
            *ngFor="let stage of detail.stages"
            class="stage"
            [ngClass]="{ paused: stage.status === 'paused', pending: stage.status === 'pending' }"
          >
            <div class="stage-head">
              <div class="stage-title">
                <span class="stage-name">{{ stage.name }}</span>
                <span class="stage-status" [ngClass]="'status-' + stage.status">
                  {{ statusText(stage.status) }}
                </span>
              </div>
              <div class="stage-amounts">
                <span class="planned">计划 {{ fmtMoney(stage.planned_amount) }}</span>
                <span class="divider">/</span>
                <span
                  class="actual"
                  [ngClass]="{
                    'over-budget': asNumber(stage.actual_amount) > asNumber(stage.planned_amount) && asNumber(stage.planned_amount) > 0
                  }"
                >
                  实际 {{ fmtMoney(stage.actual_amount) }}
                </span>
              </div>
              <div class="stage-actions">
                <button class="icon-btn" (click)="startEditStage(stage)" title="编辑">✎</button>
                <button class="icon-btn" (click)="removeStage(stage)" title="删除">🗑</button>
              </div>
            </div>

            <app-tape-bar
              label="阶段进度"
              [planned]="stage.planned_amount"
              [actual]="stage.actual_amount"
            ></app-tape-bar>

            <div class="expenses">
              <div class="expenses-head">
                <span>项目</span>
                <span>类别</span>
                <span>计划</span>
                <span>实际</span>
                <span>数量</span>
                <span>状态</span>
                <span>备注</span>
                <span></span>
              </div>

              <div
                class="expense-row"
                *ngFor="let e of expensesByStage[stage.id] || []"
                [ngClass]="{ refunded: e.refunded === 1, paused: stage.status === 'paused' }"
              >
                <div class="col col-item">{{ e.item_name }}</div>
                <div class="col col-cat">{{ e.category }}</div>
                <div class="col col-money" [ngClass]="{ 'hint-zero': asNumber(e.planned_amount) === 0 }">
                  {{ fmtMoney(e.planned_amount) }}
                  <small *ngIf="asNumber(e.planned_amount) === 0" class="hint">（计划为 0）</small>
                </div>
                <div class="col col-money"
                  [ngClass]="{
                    'over-budget': asNumber(e.actual_amount) > asNumber(e.planned_amount) && asNumber(e.planned_amount) > 0,
                    'negative': asNumber(e.actual_amount) < 0
                  }"
                >
                  {{ fmtMoney(e.actual_amount) }}
                  <small *ngIf="asNumber(e.actual_amount) < 0" class="hint">（负数支出）</small>
                </div>
                <div class="col">{{ e.quantity }} {{ e.unit }}</div>
                <div class="col">
                  <span *ngIf="e.refunded === 1" class="tag tag-refund">已退货</span>
                  <span *ngIf="e.paid === 1 && e.refunded !== 1" class="tag tag-paid">已支付</span>
                  <span *ngIf="e.paid !== 1 && e.refunded !== 1" class="tag tag-unpaid">未支付</span>
                </div>
                <div class="col muted">{{ e.notes || '-' }}</div>
                <div class="col col-actions">
                  <button class="icon-btn" (click)="startEditExpense(stage, e)" title="编辑">✎</button>
                  <button class="icon-btn" (click)="removeExpense(e)" title="删除">🗑</button>
                </div>
              </div>

              <div class="add-expense-card">
                <div class="add-expense-title">➕ 添加一项开销</div>
                <div class="add-expense-grid">
                  <label class="field field-wide">
                    <span class="field-label">项目</span>
                    <input
                      type="text"
                      placeholder="如：电线 / 水管 / 瓷砖"
                      [(ngModel)]="expenseDrafts[stage.id].item_name"
                    />
                  </label>
                  <label class="field">
                    <span class="field-label">类别</span>
                    <select [(ngModel)]="expenseDrafts[stage.id].category">
                      <option>材料</option>
                      <option>人工</option>
                      <option>定制家具</option>
                      <option>吊顶</option>
                      <option>门窗</option>
                      <option>家电</option>
                      <option>布艺</option>
                      <option>灯具</option>
                      <option>装饰</option>
                      <option>其他</option>
                    </select>
                  </label>
                  <label class="field">
                    <span class="field-label">计划金额</span>
                    <input type="number" step="0.01" placeholder="0"
                      [(ngModel)]="expenseDrafts[stage.id].planned_amount" />
                  </label>
                  <label class="field">
                    <span class="field-label">实际金额</span>
                    <input type="number" step="0.01" placeholder="0"
                      [(ngModel)]="expenseDrafts[stage.id].actual_amount" />
                  </label>
                  <label class="field field-tight">
                    <span class="field-label">数量</span>
                    <input type="number" step="1" placeholder="1"
                      [(ngModel)]="expenseDrafts[stage.id].quantity" />
                  </label>
                  <label class="field field-tight">
                    <span class="field-label">单位</span>
                    <input type="text" placeholder="项/套/m²"
                      [(ngModel)]="expenseDrafts[stage.id].unit" />
                  </label>
                  <label class="field field-checks">
                    <span class="field-label">状态</span>
                    <span class="checks">
                      <label class="chk">
                        <input type="checkbox" [(ngModel)]="expenseDrafts[stage.id].paid" />
                        <span>已付</span>
                      </label>
                      <label class="chk">
                        <input type="checkbox" [(ngModel)]="expenseDrafts[stage.id].refunded" />
                        <span>退货</span>
                      </label>
                    </span>
                  </label>
                  <label class="field field-wide">
                    <span class="field-label">备注</span>
                    <input type="text" placeholder="选填"
                      [(ngModel)]="expenseDrafts[stage.id].notes" />
                  </label>
                  <div class="field field-submit">
                    <button class="btn btn-primary" (click)="submitExpense(stage)">添加到本阶段</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="stage-edit" *ngIf="editingStageId === stage.id">
              <div class="edit-title">编辑阶段</div>
              <div class="edit-grid">
                <label class="field field-wide">
                  <span class="field-label">名称</span>
                  <input type="text" [(ngModel)]="editingStage.name" />
                </label>
                <label class="field">
                  <span class="field-label">计划金额</span>
                  <input type="number" step="0.01" [(ngModel)]="editingStage.planned_amount" />
                </label>
                <label class="field">
                  <span class="field-label">状态</span>
                  <select [(ngModel)]="editingStage.status">
                    <option value="active">进行中</option>
                    <option value="done">已完成</option>
                    <option value="paused">已停工</option>
                    <option value="pending">未开始</option>
                  </select>
                </label>
                <div class="field field-submit">
                  <button class="btn btn-primary" (click)="submitEditStage()">保存</button>
                  <button class="btn btn-ghost" (click)="editingStageId = null">取消</button>
                </div>
              </div>
            </div>

            <div class="stage-edit" *ngIf="editingExpenseId && editingExpense.stage_id === stage.id">
              <div class="edit-title">编辑开销</div>
              <div class="edit-grid">
                <label class="field field-wide">
                  <span class="field-label">项目</span>
                  <input type="text" [(ngModel)]="editingExpense.item_name" />
                </label>
                <label class="field">
                  <span class="field-label">计划金额</span>
                  <input type="number" step="0.01" [(ngModel)]="editingExpense.planned_amount" />
                </label>
                <label class="field">
                  <span class="field-label">实际金额</span>
                  <input type="number" step="0.01" [(ngModel)]="editingExpense.actual_amount" />
                </label>
                <label class="field field-tight">
                  <span class="field-label">数量</span>
                  <input type="number" step="0.01" [(ngModel)]="editingExpense.quantity" />
                </label>
                <label class="field field-tight">
                  <span class="field-label">单位</span>
                  <input type="text" placeholder="项/套/m²" [(ngModel)]="editingExpense.unit" />
                </label>
                <label class="field field-checks">
                  <span class="field-label">状态</span>
                  <span class="checks">
                    <label class="chk">
                      <input type="checkbox" [(ngModel)]="editingExpense.paid" />
                      <span>已支付</span>
                    </label>
                    <label class="chk">
                      <input type="checkbox" [(ngModel)]="editingExpense.refunded" />
                      <span>已退货</span>
                    </label>
                  </span>
                </label>
                <label class="field field-wide">
                  <span class="field-label">备注</span>
                  <input type="text" [(ngModel)]="editingExpense.notes" />
                </label>
                <div class="field field-submit">
                  <button class="btn btn-primary" (click)="submitEditExpense()">保存</button>
                  <button class="btn btn-ghost" (click)="editingExpenseId = null">取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="app-footer">
        <p>数据保存在本地 SQLite（<code>server/renovation.db</code>）。</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .app-shell {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
      }
      .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .logo {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
      }
      h1 {
        margin: 0;
        font-size: 22px;
      }
      .subtitle {
        margin: 4px 0 0;
        color: var(--color-muted);
        font-size: 12px;
      }
      .section-title {
        font-size: 14px;
        color: var(--color-muted);
        margin: 12px 0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .scenario-strip {
        margin-bottom: 24px;
      }
      .scenario-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      .scenario-card {
        text-align: left;
        background: var(--color-surface);
        border: 2px solid var(--color-border);
        border-radius: 12px;
        padding: 14px 16px;
        transition: all 0.2s;
      }
      .scenario-card:hover {
        transform: translateY(-2px);
        border-color: var(--color-primary);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
      }
      .scenario-card.active {
        border-color: var(--color-primary);
        background: var(--color-primary-soft);
      }
      .scenario-name {
        font-weight: 700;
        margin-bottom: 4px;
      }
      .scenario-desc {
        font-size: 12px;
        color: var(--color-muted);
        line-height: 1.4;
      }
      .summary {
        margin-bottom: 20px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 1.3fr 1.3fr;
        gap: 12px;
      }
      @media (max-width: 760px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
      .summary-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 16px 20px;
      }
      .tape-card {
        display: flex;
        align-items: center;
      }
      .summary-label {
        color: var(--color-muted);
        font-size: 12px;
        margin-bottom: 6px;
      }
      .summary-amount {
        font-size: 22px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .summary-amount .diff {
        font-size: 12px;
        font-weight: 500;
        color: var(--color-muted);
        margin-left: 6px;
      }
      .summary-amount.over-budget {
        color: var(--color-danger);
      }
      .summary-amount.shake {
        animation: shake 0.5s ease-in-out;
      }
      .builder {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      }
      .builder-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .builder-head h2 {
        margin: 0;
        font-size: 18px;
      }
      .stage-add, .stage-edit {
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 12px;
        padding: 14px 16px;
        margin: 12px 0;
      }
      .edit-title,
      .add-expense-title {
        font-size: 13px;
        font-weight: 700;
        color: #374151;
        margin-bottom: 10px;
        letter-spacing: 0.3px;
      }
      .add-expense-grid,
      .edit-grid,
      .stage-add-body {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px 14px;
        align-items: end;
      }
      @media (max-width: 960px) {
        .add-expense-grid, .edit-grid, .stage-add-body {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 520px) {
        .add-expense-grid, .edit-grid, .stage-add-body {
          grid-template-columns: 1fr;
        }
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }
      .field-label {
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        letter-spacing: 0.3px;
      }
      .field input,
      .field select {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: white;
        font-size: 13px;
        color: #111827;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .field input:focus,
      .field select:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      }
      .field-wide {
        grid-column: span 2;
      }
      @media (max-width: 520px) {
        .field-wide { grid-column: span 1; }
      }
      .field-tight input {
        min-width: 0;
      }
      .field-checks .checks {
        display: flex;
        gap: 10px;
        align-items: center;
        height: 34px;
        padding: 0 4px;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 8px;
      }
      .chk {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #374151;
        cursor: pointer;
        user-select: none;
      }
      .chk input[type="checkbox"] {
        width: 14px;
        height: 14px;
        accent-color: #2563eb;
        margin: 0;
      }
      .field-submit {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 0;
        justify-content: flex-end;
      }
      .stage-add-actions {
        display: flex;
        gap: 8px;
        margin-top: 2px;
      }
      .stages {
        display: grid;
        gap: 16px;
      }
      .stage {
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .stage.paused {
        border-left: 4px solid var(--color-warning);
        background: #fffbeb;
      }
      .stage.pending {
        opacity: 0.85;
        background: #f8fafc;
      }
      .stage-head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .stage-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .stage-name {
        font-weight: 700;
        font-size: 17px;
        color: #111827;
      }
      .stage-status {
        font-size: 11px;
        padding: 3px 10px;
        border-radius: 999px;
        background: #e5e7eb;
        color: #374151;
        font-weight: 600;
        letter-spacing: 0.3px;
      }
      .status-done { background: #dcfce7; color: #166534; }
      .status-active { background: #dbeafe; color: #1e3a8a; }
      .status-paused { background: #fef3c7; color: #78350f; }
      .status-pending { background: #e5e7eb; color: #374151; }
      .stage-amounts {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #475569;
        margin-left: 6px;
      }
      .stage-amounts .planned { color: #6b7280; }
      .stage-amounts .divider { color: #d1d5db; }
      .stage-amounts .actual {
        font-weight: 700;
        color: #111827;
      }
      .stage-amounts .actual.over-budget {
        color: var(--color-danger);
      }
      .stage-actions {
        margin-left: auto;
        display: flex;
        gap: 4px;
      }
      .icon-btn {
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        color: #374151;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .icon-btn:hover {
        background: #f3f4f6;
        border-color: #cbd5f5;
      }
      .expenses {
        margin-top: 14px;
      }
      .expenses-head {
        display: grid;
        grid-template-columns: 1.8fr 0.9fr 1.1fr 1.1fr 1fr 1fr 1.2fr 110px;
        gap: 10px;
        padding: 8px 10px;
        font-size: 11px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        border-radius: 8px 8px 0 0;
      }
      @media (max-width: 960px) {
        .expenses-head { display: none; }
      }
      .expense-row {
        display: grid;
        grid-template-columns: 1.8fr 0.9fr 1.1fr 1.1fr 1fr 1fr 1.2fr 110px;
        gap: 10px;
        padding: 12px 10px;
        border-bottom: 1px solid #f1f5f9;
        align-items: center;
        font-size: 13px;
        color: #111827;
        transition: background 0.15s;
      }
      .expense-row:hover {
        background: #f9fafb;
      }
      @media (max-width: 960px) {
        .expense-row {
          grid-template-columns: 1fr 1fr;
          row-gap: 4px;
          padding: 14px 12px;
        }
        .expense-row .col-actions {
          grid-column: 1 / -1;
          justify-content: flex-start;
        }
      }
      .expense-row.refunded {
        color: #7c3aed;
        text-decoration: line-through;
        background: #faf5ff;
      }
      .expense-row.paused {
        color: #78350f;
      }
      .expense-row .col {
        min-width: 0;
      }
      .col-item {
        font-weight: 600;
      }
      .col-money {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        color: #111827;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .col-money.over-budget { color: var(--color-danger); }
      .col-money.negative { color: var(--color-warning); }
      .col-money.hint-zero { color: #6b7280; font-weight: 500; }
      .col-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
      }
      .add-expense-card {
        margin-top: 14px;
        padding: 14px 16px 16px;
        background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
        border: 1px solid #bfdbfe;
        border-radius: 12px;
      }
      .tag {
        display: inline-block;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 999px;
        margin-right: 4px;
      }
      .tag-paid { background: #dcfce7; color: #166534; }
      .tag-unpaid { background: #f3f4f6; color: #6b7280; }
      .tag-refund { background: #ede9fe; color: #5b21b6; }
      .muted { color: var(--color-muted); }
      .text-right { text-align: right; }
      .hint {
        display: block;
        color: var(--color-warning);
        font-size: 11px;
        margin-top: 2px;
      }
      .hint-zero {
        color: var(--color-muted);
      }
      .negative {
        color: var(--color-warning);
        font-weight: 600;
      }
      .chk {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--color-text);
      }
      .btn {
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.15s;
      }
      .btn-primary {
        background: var(--color-primary);
        color: white;
      }
      .btn-primary:hover { background: #1d4ed8; }
      .btn-secondary {
        background: white;
        border-color: #d1d5db;
      }
      .btn-secondary:hover { background: #f3f4f6; }
      .btn-ghost {
        background: transparent;
        border-color: #d1d5db;
        color: #6b7280;
      }
      .btn-ghost:hover { background: #f3f4f6; }
      .app-footer {
        color: var(--color-muted);
        font-size: 12px;
        text-align: center;
        margin-top: 20px;
      }
      .app-footer code {
        background: #f3f4f6;
        padding: 1px 6px;
        border-radius: 4px;
      }
    `
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  scenarios: Scenario[] = [];
  detail: { scenario: Scenario; stages: Stage[]; expenses: Expense[] } | null = null;
  activeKey: string | null = null;

  expenseDrafts: Record<number, any> = {};
  expensesByStage: Record<number, Expense[]> = {};

  showStageForm = false;
  newStage: any = { name: '', planned_amount: 0 };

  editingStageId: number | null = null;
  editingStage: any = {};
  editingExpenseId: number | null = null;
  editingExpense: any = {};

  triggerShake = false;
  private shakeTimer: any = null;

  constructor(private service: RenovationService) {
    this.fmtMoney = fmtMoney;
  }

  fmtMoney: (v: any) => string;

  asNumber(v: any): number {
    const n = Number(v);
    if (!isFinite(n) || isNaN(n)) return 0;
    return n;
  }

  abs(v: any): number {
    const n = this.asNumber(v);
    return n < 0 ? -n : n;
  }

  diffMoney(a: any, b: any): string {
    return fmtMoney(this.abs(this.asNumber(a) - this.asNumber(b)));
  }

  statusText(s: string) {
    return { done: '已完成', active: '进行中', paused: '已停工', pending: '未开始' }[s] || s;
  }

  get totalPlanned() {
    return (this.detail?.stages || []).reduce((sum, s) => sum + Number(s.planned_amount || 0), 0);
  }

  get totalActual() {
    return (this.detail?.stages || []).reduce((sum, s) => sum + Number(s.actual_amount || 0), 0);
  }

  async ngOnInit() {
    await this.loadList();
  }

  ngOnDestroy() {
    if (this.shakeTimer) clearTimeout(this.shakeTimer);
  }

  async loadList() {
    try {
      this.scenarios = await this.service.listScenarios();
    } catch (e) {
      this.scenarios = [];
    }
    if (this.scenarios.length > 0 && !this.activeKey) {
      this.selectScenario(this.scenarios[0].key);
    }
  }

  async selectScenario(key: string) {
    this.activeKey = key;
    try {
      const d = await this.service.getScenario(key);
      this.detail = d;
      this.rebuildExpenseIndex();
      this.shakeIfOverBudget();
    } catch (e) {
      console.error(e);
    }
  }

  async reseed() {
    try {
      await this.service.reseed();
    } catch (e) {}
    await this.loadList();
    if (this.activeKey) {
      this.selectScenario(this.activeKey);
    }
  }

  rebuildExpenseIndex() {
    this.expensesByStage = {};
    for (const s of this.detail?.stages || []) {
      this.expensesByStage[s.id] = [];
      if (!this.expenseDrafts[s.id]) {
        this.expenseDrafts[s.id] = this.emptyExpense();
      }
    }
    for (const e of this.detail?.expenses || []) {
      if (!this.expensesByStage[e.stage_id]) this.expensesByStage[e.stage_id] = [];
      this.expensesByStage[e.stage_id].push(e);
    }
  }

  emptyExpense() {
    return {
      item_name: '',
      category: '材料',
      planned_amount: 0,
      actual_amount: 0,
      quantity: 1,
      unit: '项',
      paid: 0,
      refunded: 0,
      notes: ''
    };
  }

  shakeIfOverBudget() {
    if (this.totalPlanned > 0 && this.totalActual > this.totalPlanned) {
      this.triggerShake = false;
      if (this.shakeTimer) clearTimeout(this.shakeTimer);
      this.shakeTimer = setTimeout(() => {
        this.triggerShake = true;
      }, 50);
    }
  }

  startAddStage() {
    this.showStageForm = true;
    this.newStage = { name: '', planned_amount: 0 };
  }
  cancelStage() {
    this.showStageForm = false;
  }
  async submitStage() {
    if (!this.activeKey || !this.newStage.name) return;
    try {
      await this.service.addStage(this.activeKey, {
        name: this.newStage.name,
        planned_amount: Number(this.newStage.planned_amount) || 0
      });
    } catch (e) {}
    this.showStageForm = false;
    this.selectScenario(this.activeKey!);
  }

  startEditStage(stage: Stage) {
    this.editingStageId = stage.id;
    this.editingStage = { ...stage };
    this.editingExpenseId = null;
  }
  async submitEditStage() {
    try {
      await this.service.updateStage(this.editingStage.id, {
        name: this.editingStage.name,
        planned_amount: Number(this.editingStage.planned_amount) || 0,
        status: this.editingStage.status
      });
    } catch (e) {}
    this.editingStageId = null;
    this.selectScenario(this.activeKey!);
  }
  async removeStage(stage: Stage) {
    if (!confirm(`删除阶段「${stage.name}」及其全部开销？`)) return;
    try {
      await this.service.deleteStage(stage.id);
    } catch (e) {}
    this.selectScenario(this.activeKey!);
  }

  async submitExpense(stage: Stage) {
    const draft = this.expenseDrafts[stage.id];
    if (!draft || !String(draft.item_name).trim()) return;
    const payload = {
      item_name: draft.item_name,
      category: draft.category,
      planned_amount: Number(draft.planned_amount) || 0,
      actual_amount: Number(draft.actual_amount) || 0,
      quantity: Number(draft.quantity) || 1,
      unit: draft.unit || '项',
      paid: draft.paid ? 1 : 0,
      refunded: draft.refunded ? 1 : 0,
      notes: draft.notes || ''
    };
    try {
      await this.service.addExpense(stage.id, payload);
    } catch (e) {}
    this.expenseDrafts[stage.id] = this.emptyExpense();
    this.selectScenario(this.activeKey!);
  }

  startEditExpense(stage: Stage, e: Expense) {
    this.editingExpenseId = e.id;
    this.editingExpense = { ...e };
    this.editingStageId = null;
  }
  async submitEditExpense() {
    const payload = {
      item_name: this.editingExpense.item_name,
      category: this.editingExpense.category,
      planned_amount: Number(this.editingExpense.planned_amount) || 0,
      actual_amount: Number(this.editingExpense.actual_amount) || 0,
      quantity: Number(this.editingExpense.quantity) || 1,
      unit: this.editingExpense.unit || '项',
      paid: this.editingExpense.paid ? 1 : 0,
      refunded: this.editingExpense.refunded ? 1 : 0,
      notes: this.editingExpense.notes || ''
    };
    try {
      await this.service.updateExpense(this.editingExpense.id, payload);
    } catch (e) {}
    this.editingExpenseId = null;
    this.selectScenario(this.activeKey!);
  }
  async removeExpense(e: Expense) {
    if (!confirm(`删除开销「${e.item_name}」？`)) return;
    try {
      await this.service.deleteExpense(e.id);
    } catch (err) {}
    this.selectScenario(this.activeKey!);
  }
}
