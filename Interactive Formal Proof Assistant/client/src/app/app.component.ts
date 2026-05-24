import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-shell">
      <header class="app-header">
        <h1>形式化逻辑证明编辑器</h1>
        <span class="subtitle">Natural Deduction / Hilbert System · Unification Engine</span>
      </header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-shell { min-height: 100vh; background: #0f1220; color: #e8eaff; font-family: 'Segoe UI', 'PingFang SC', sans-serif; }
    .app-header { padding: 14px 24px; background: linear-gradient(90deg, #1b2250, #0f1220); border-bottom: 1px solid #2a2f55; display: flex; justify-content: space-between; align-items: center; }
    .app-header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; color: #b8c3ff; }
    .subtitle { color: #6c7aa8; font-size: 13px; }
    .app-main { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
  `]
})
export class AppComponent {}
