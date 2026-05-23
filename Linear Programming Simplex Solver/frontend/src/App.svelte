<script>
  import './app.css';
  import { onMount, onDestroy } from 'svelte';
  import ConstraintRow from './ConstraintRow.svelte';
  import { DEFAULT_MODEL, formatNum, cloneModel } from './model.js';
  import {
    createVisualizer,
    drawFeasibleRegion,
    setCurrentPoint,
    animatePulse,
    clearGroup
  } from './visualizer.js';
  import { analyzeFeasibility } from './feasibility.js';

  let model = cloneModel(DEFAULT_MODEL);
  let variables = model.objective.variables;
  let presets = [];
  let solving = false;
  let result = null;
  let error = null;
  let currentStep = 0;
  let playing = false;
  let playInterval = null;
  let tab = 'tableau';

  let vizEl = null;
  let vizCtx = null;
  let animFrame = null;
  let pulseAnim = null;
  let vizInitialized = false;

  let prevValues = null;
  let changedCells = new Set();

  $: variables = model.objective.variables;

  function switchTab(newTab) {
    tab = newTab;
    if (newTab === 'viz') {
      setTimeout(() => {
        if (!vizCtx && vizEl) {
          initViz();
          vizInitialized = true;
        } else if (vizCtx) {
          vizCtx.renderer.setSize(vizEl.clientWidth, vizEl.clientHeight);
          vizCtx.camera.aspect = vizEl.clientWidth / vizEl.clientHeight;
          vizCtx.camera.updateProjectionMatrix();
        }
      }, 60);
    }
  }

  onMount(async () => {
    try {
      const r = await fetch('/api/presets').then((r) => r.json());
      presets = r;
    } catch (e) {
      console.warn('presets fetch failed', e);
    }
    setTimeout(initViz, 100);
  });

  onDestroy(() => {
    if (playInterval) clearInterval(playInterval);
    if (animFrame) cancelAnimationFrame(animFrame);
    if (vizCtx) vizCtx.dispose?.();
  });

  function initViz() {
    if (!vizEl) return;
    if (vizEl.clientWidth === 0 || vizEl.clientHeight === 0) return;
    if (vizCtx) vizCtx.dispose?.();
    const { context } = createVisualizer(vizEl, model);
    vizCtx = context;
    const feasibility = analyzeFeasibility(model);
    drawFeasibleRegion(vizCtx, feasibility, model);
    startVizLoop();
  }

  function startVizLoop() {
    if (animFrame) cancelAnimationFrame(animFrame);
    let last = performance.now();
    function tick() {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (vizCtx) {
        if (vizCtx.isoline) vizCtx.isoline.update(dt);
        if (vizCtx.currentPoint?.update) vizCtx.currentPoint.update(dt);
        if (pulseAnim) pulseAnim.update(dt);
      }
      animFrame = requestAnimationFrame(tick);
    }
    tick();
  }

  function addVariable() {
    const n = model.objective.variables.length + 1;
    model.objective.variables.push(`x${n}`);
    model.objective.coefficients.push(0);
    for (const c of model.constraints) {
      // leave existing terms as-is
    }
    model = model;
  }

  function removeVariable(i) {
    if (model.objective.variables.length <= 2) return;
    const name = model.objective.variables[i];
    model.objective.variables.splice(i, 1);
    model.objective.coefficients.splice(i, 1);
    for (const c of model.constraints) {
      c.terms = c.terms.filter((t) => t.name !== name);
    }
    model = model;
  }

  function addConstraint() {
    model.constraints.push({
      label: `C${model.constraints.length + 1}`,
      terms: variables.map((v) => ({ name: v, coefficient: 0 })),
      op: '<=',
      rhs: 0
    });
    model = model;
  }

  function removeConstraint(i) {
    model.constraints.splice(i, 1);
    model = model;
  }

  function loadPreset(p) {
    model = cloneModel(p);
    result = null;
    currentStep = 0;
    error = null;
    pulseAnim = null;
    setTimeout(() => {
      if (!vizEl) return;
      if (vizEl.clientWidth === 0 || vizEl.clientHeight === 0) return;
      if (vizCtx) {
        vizCtx.dispose?.();
        vizCtx = null;
      }
      const { context } = createVisualizer(vizEl, model);
      vizCtx = context;
      const feasibility = analyzeFeasibility(model);
      drawFeasibleRegion(vizCtx, feasibility, model);
      startVizLoop();
    }, 50);
  }

  async function solve() {
    solving = true;
    error = null;
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
      });
      const data = await res.json();
      result = data;
      currentStep = 0;
      prevValues = null;
      changedCells = new Set();
      play();
      if (vizCtx) {
        clearGroup(vizCtx);
        drawFeasibleRegion(vizCtx, data.feasibility, model);
        if (data.final && data.status === 'optimal') {
          setCurrentPoint(vizCtx, data.final.x, 'optimal');
          pulseAnim = animatePulse(vizCtx, data.final.x);
        } else if (data.status === 'unbounded') {
          const firstFeasible = (data.feasibility?.samples || [])[0];
          if (firstFeasible) setCurrentPoint(vizCtx, firstFeasible, 'unbounded');
        }
      }
    } catch (e) {
      error = e.message;
    } finally {
      solving = false;
    }
  }

  function play() {
    stop();
    playing = true;
    playInterval = setInterval(() => {
      if (!result || !result.history) return;
      if (currentStep < result.history.length - 1) {
        setStep(currentStep + 1);
      } else {
        stop();
      }
    }, 1200);
  }

  function stop() {
    playing = false;
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }

  function setStep(i) {
    currentStep = i;
    if (result && result.history && vizCtx) {
      const iter = result.history[i];
      if (iter?.basis) {
        const std = result.std;
        if (std) {
          const n = std.originalN;
          const x = new Array(n).fill(0);
          const m = std.m;
          const nCols = std.totalVars + 1;
          for (let k = 0; k < m; k++) {
            const b = iter.basis[k];
            if (b < n) x[b] = iter.tableau[k][nCols - 1];
          }
          setCurrentPoint(vizCtx, x, iter.status || '');
        }
      }
    }
  }

  $: currentIter = result?.history?.[currentStep];
  $: {
    if (currentIter) {
      const cur = new Map();
      for (let i = 0; i < currentIter.tableau.length; i++) {
        for (let j = 0; j < currentIter.tableau[i].length; j++) {
          cur.set(`${i},${j}`, currentIter.tableau[i][j]);
        }
      }
      if (prevValues) {
        const newSet = new Set();
        for (const [k, v] of cur) {
          const old = prevValues.get(k);
          if (old === undefined || Math.abs(old - v) > 1e-9) newSet.add(k);
        }
        changedCells = newSet;
      }
      prevValues = cur;
    }
  }

  function describeStatus(s) {
    switch (s) {
      case 'optimal': return { cls: 'status-optimal', text: '已找到最优解' };
      case 'unbounded': return { cls: 'status-unbounded', text: '目标函数无界' };
      case 'infeasible': return { cls: 'status-infeasible', text: '可行域为空（无解）' };
      case 'cycling': return { cls: 'status-cycling', text: '循环迭代不收敛' };
      default: return { cls: '', text: '' };
    }
  }

  function varLabel(i, std) {
    if (!std) return `x${i + 1}`;
    if (i < std.originalN) return std.variables[i];
    return std.slackVars[i - std.originalN] || `s${i - std.originalN + 1}`;
  }

  function basisLabel(i, std) {
    if (!std || !currentIter) return '';
    const b = currentIter.basis[i];
    return varLabel(b, std);
  }

  function isPivotCell(r, c) {
    if (!currentIter) return false;
    return currentIter.pivot_row === r && currentIter.pivot_col === c;
  }

  function isEnteringCol(c) {
    if (!currentIter) return false;
    return currentIter.pivot_col === c;
  }
  function isLeavingRow(r) {
    if (!currentIter) return false;
    return currentIter.pivot_row === r;
  }
  function isObjRow(r, std) {
    if (!std) return false;
    return r === std.m;
  }

  function addObjectiveVar() {
    const n = model.objective.variables.length + 1;
    model.objective.variables.push(`x${n}`);
    model.objective.coefficients.push(0);
    for (const c of model.constraints) {
      // keep existing terms; user can add manually
    }
    model = model;
  }

  function removeObjectiveVar(i) {
    if (model.objective.variables.length <= 2) return;
    model.objective.variables.splice(i, 1);
    model.objective.coefficients.splice(i, 1);
    model = model;
  }
</script>

<div class="app">
  <aside class="sidebar">
    <div class="grid">
      <h3 style="color:var(--accent); margin:0 0 10px 0;">线性规划模型</h3>
      <div>
        <label>目标函数方向</label>
        <select bind:value={model.direction}>
          <option value="max">最大化 (max)</option>
          <option value="min">最小化 (min)</option>
        </select>
      </div>

      <div>
        <label>目标函数系数</label>
        {#each model.objective.coefficients as c, i}
          <div class="var-row">
            <span style="color:var(--muted);">{model.objective.variables[i]}</span>
            <input type="number" step="any" bind:value={model.objective.coefficients[i]} />
            <button class="danger" on:click={() => removeObjectiveVar(i)}>✕</button>
          </div>
        {/each}
        <button on:click={addObjectiveVar}>+ 变量</button>
      </div>

      <div>
        <label>约束条件 ({model.constraints.length})</label>
        {#each model.constraints as con, i}
          <ConstraintRow
            variables={variables}
            bind:value={model.constraints[i]}
            on:remove={() => removeConstraint(i)}
          />
        {/each}
        <button on:click={addConstraint}>+ 约束</button>
      </div>

      <div>
        <label>预设场景</label>
        <div class="presets">
          {#each presets as p}
            <button class="preset-btn" on:click={() => loadPreset(p)}>
              <div style="font-weight:600;">{p.name}</div>
              <div class="k">{p.key}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="solve-bar">
      <button class="primary" disabled={solving} on:click={solve} style="width:100%;">
        {solving ? '求解中...' : '▶ 运行单纯形法'}
      </button>
    </div>
  </aside>

  <div class="main">
    <div class="header">
      <div>
        <div class="title">线性规划单纯形法可视化求解器</div>
        <div class="sub">Svelte · Fastify · SQLite (better-sqlite3)</div>
      </div>
      {#if result}
        <span class="status-badge {describeStatus(result.status).cls}">
          {describeStatus(result.status).text}
        </span>
      {/if}
    </div>

    <div class="split-v">
      <div class="panel">
        <div class="tabs">
          <div class="tab {tab === 'tableau' ? 'active' : ''}" on:click={() => switchTab('tableau')}>单纯形表</div>
          <div class="tab {tab === 'viz' ? 'active' : ''}" on:click={() => switchTab('viz')}>可行域可视化</div>
        </div>

        <div style="display:{tab === 'tableau' ? 'block' : 'none'};">
          {#if result && currentIter}
            <div class="tableau-wrap">
              <table class="tableau">
                <thead>
                  <tr>
                    <th>基</th>
                    {#each Array.from({ length: result.std.totalVars }) as _, j}
                      <th>{varLabel(j, result.std)}</th>
                    {/each}
                    <th>RHS</th>
                  </tr>
                </thead>
                <tbody>
                  {#each currentIter.tableau as row, r}
                    <tr class="{isObjRow(r, result.std) ? 'obj-row' : ''} {isLeavingRow(r) ? 'leaving-row' : ''}">
                      <td class="basis-cell">
                        {#if !isObjRow(r, result.std)}
                          {basisLabel(r, result.std)}
                        {:else}
                          z
                        {/if}
                      </td>
                      {#each row as v, c}
                        <td
                          class="{isPivotCell(r, c) ? 'pivot-cell' : ''} {isEnteringCol(c) ? 'entering-col' : ''}"
                        >
                          <span class="cell-val {changedCells.has(`${r},${c}`) ? 'changed' : ''}">
                            {formatNum(v)}
                          </span>
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            {#if currentIter.notes}
              <div class="note {currentIter.status === 'unbounded' || currentIter.status === 'cycling' ? 'warn' : ''} {currentIter.status === 'infeasible' ? 'bad' : ''}">
                {currentIter.notes}
              </div>
            {/if}

            {#if result.final && result.status === 'optimal'}
              <div class="note">
                最优解：
                {#each result.final.x as xv, i}
                  <span class="badge" style="margin-right:4px;">
                    {variables[i]} = {formatNum(xv)}
                  </span>
                {/each}
                ，目标值 z = {formatNum(result.final.z)}
              </div>
            {/if}
          {:else}
            <div style="color:var(--muted); padding:20px;">
              点击左侧“运行单纯形法”开始求解。当前模型：
              <pre style="background:var(--panel-2); padding:10px; border-radius:6px; overflow:auto;">
{JSON.stringify(model, null, 2)}</pre>
            </div>
          {/if}
        </div>

        <div style="display:{tab === 'viz' ? 'block' : 'none'};">
          <div class="viz-wrap" bind:this={vizEl}></div>
          <div class="viz-overlay">
            {#if result?.status === 'infeasible'}
              <span style="color:var(--danger);">⚠ 可行域为空，约束矛盾</span>
            {:else if result?.status === 'unbounded'}
              <span style="color:var(--accent-2);">⚠ 目标函数无界，等值线可无限平移</span>
            {:else if result?.status === 'cycling'}
              <span style="color:var(--accent-2);">⚠ 退化引发循环迭代</span>
            {:else if result?.status === 'optimal'}
              <span style="color:var(--good);">● 最优解顶点已定位</span>
            {:else}
              <span>等待求解...</span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    {#if result && result.history}
      <div class="playback">
        <button on:click={() => setStep(0)} disabled={!result.history.length}>⏮</button>
        <button on:click={() => setStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>◀</button>
        {#if playing}
          <button on:click={stop}>⏸ 暂停</button>
        {:else}
          <button on:click={play} disabled={currentStep >= result.history.length - 1}>▶ 播放</button>
        {/if}
        <button on:click={() => setStep(Math.min(result.history.length - 1, currentStep + 1))}
          disabled={currentStep >= result.history.length - 1}>▶</button>
        <button on:click={() => setStep(result.history.length - 1)}>⏭</button>
        <span class="step-info">迭代 {currentStep + 1} / {result.history.length}</span>
        <input
          class="slider"
          type="range"
          min="0"
          max={result.history.length - 1}
          bind:value={currentStep}
        />
      </div>
    {/if}

    {#if error}
      <div class="note bad">错误：{error}</div>
    {/if}
  </div>
</div>
