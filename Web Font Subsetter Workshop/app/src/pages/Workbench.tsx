import { createSignal, createEffect, onMount, Show, For } from 'solid-js';
import RingProgress from '../components/RingProgress';
import RollingNumber from '../components/RollingNumber';
import CharGridFilter from '../components/CharGridFilter';
import GlyphPreview from '../components/GlyphPreview';
import GlitchError from '../components/GlitchError';

type Preset = { id: string; name: string; color: string; charset: string };
type FontInfo = { id: string; name: string; size: number; format: string; glyphCount: number; family: string; unitsPerEm: number; tables: Record<string, any> };
type Task = { id: string; font_id: string; preset: string | null; charset: string | null; algorithm: string; status: string; progress: number; output_size: number | null; error: string | null; created_at: string };

export default function Workbench() {
  const [presets, setPresets] = createSignal<Preset[]>([]);
  const [file, setFile] = createSignal<File | null>(null);
  const [font, setFont] = createSignal<FontInfo | null>(null);
  const [charset, setCharset] = createSignal('');
  const [algorithm, setAlgorithm] = createSignal<'subset' | 'repair' | 'merge'>('subset');
  const [checksum, setChecksum] = createSignal(true);
  const [preset, setPreset] = createSignal<string | null>(null);
  const [uploading, setUploading] = createSignal(false);
  const [taskId, setTaskId] = createSignal<string | null>(null);
  const [task, setTask] = createSignal<Task | null>(null);
  const [tasks, setTasks] = createSignal<Task[]>([]);
  const [error, setError] = createSignal<string | null>(null);
  const [errorCode, setErrorCode] = createSignal<string | null>(null);

  onMount(async () => {
    const r = await fetch('/api/presets').then(r => r.json());
    setPresets(r);
    const tr = await fetch('/api/tasks').then(r => r.json());
    setTasks(tr);
  });

  const applyPreset = (p: Preset) => {
    setPreset(p.id);
    setCharset(p.charset);
    if (p.id === 'corrupt') setChecksum(false);
    if (p.id === 'merge') setAlgorithm('merge');
    setError(null);
    setErrorCode(null);
  };

  const upload = async () => {
    const f = file();
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const info = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
      setFont(info);
    } catch (e: any) {
      setError(e.message || '上传失败');
      setErrorCode('UPLOAD');
    }
    setUploading(false);
  };

  const process = async () => {
    if (!font()) return;
    setError(null);
    setErrorCode(null);
    try {
      const r = await fetch(`/api/fonts/${font()!.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charset: charset(), algorithm: algorithm(), checksum: checksum(), preset: preset() }),
      }).then(r => r.json());
      if (r.error) {
        setError(r.error);
        setErrorCode('SUBMIT');
        return;
      }
      setTaskId(r.taskId);
      pollTask(r.taskId);
    } catch (e: any) {
      setError(e.message);
      setErrorCode('SUBMIT');
    }
  };

  const pollTask = (id: string) => {
    let stop = false;
    const tick = async () => {
      if (stop) return;
      const t: Task = await fetch(`/api/tasks/${id}`).then(r => r.json());
      setTask(t);
      if (t.status === 'done' || t.status === 'failed') {
        stop = true;
        if (t.status === 'failed') {
          setError(t.error || '任务失败');
          setErrorCode(t.error || 'TASK');
        }
        const tr = await fetch('/api/tasks').then(r => r.json());
        setTasks(tr);
        return;
      }
      setTimeout(tick, 600);
    };
    tick();
  };

  const keptSet = () => new Set(Array.from(charset()));
  const isCorrupt = () => preset() === 'corrupt';
  const progressVal = () => task()?.progress ?? 0;

  return (
    <div class="min-h-screen">
      <header class="relative border-b border-white/10">
        <div class="absolute inset-0 grid-bg opacity-40" />
        <div class="relative max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-neon to-violet flex items-center justify-center font-bold text-ink">Aa</div>
            <div>
              <h1 class="text-xl font-semibold tracking-tight">Web Font Subsetter Workshop</h1>
              <p class="text-xs text-white/50 font-mono">SolidStart × Fastify × SQLite3 · cmap / glyf 可视化</p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs font-mono text-white/50">
            <span class="w-2 h-2 rounded-full bg-neon animate-flicker" />
            <span>API: http://localhost:4000</span>
          </div>
        </div>
      </header>

      <main class="max-w-[1400px] mx-auto px-8 py-8 grid grid-cols-12 gap-6">
        <section class="col-span-12 lg:col-span-5 space-y-6">
          <div class="glass rounded-2xl p-6 relative overflow-hidden">
            <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm tracking-widest text-white/70 font-mono">01 · UPLOAD</h2>
                <span class="text-xs text-white/40 font-mono">TTF / OTF / WOFF2</span>
              </div>
              <label
                class={`block cursor-pointer rounded-xl border-2 border-dashed ${isCorrupt() ? 'border-glitch/50' : 'border-white/20 hover:border-neon/60'} transition-colors p-8 text-center`}
              >
                <input
                  type="file"
                  class="hidden"
                  accept=".ttf,.otf,.woff2,font/*"
                  onChange={e => setFile((e.target as HTMLInputElement).files?.[0] || null)}
                />
                <Show when={file()}>
                  <div class="text-sm">
                    <div class="font-semibold">{file()!.name}</div>
                    <div class="text-white/50 text-xs font-mono mt-1">{(file()!.size / 1024).toFixed(2)} KB</div>
                  </div>
                </Show>
                <Show when={!file()}>
                  <div class="text-sm text-white/60">拖拽字体文件或点击选择</div>
                  <div class="text-xs text-white/30 mt-2 font-mono">支持 TTF/OTF/WOFF2 · 最大 20MB</div>
                </Show>
              </label>
              <button
                disabled={!file() || uploading()}
                onClick={upload}
                class="mt-4 w-full py-3 rounded-xl font-semibold tracking-wide bg-neon/10 border border-neon/50 text-neon hover:bg-neon/20 transition disabled:opacity-30"
              >
                {uploading() ? '解析中…' : '上传并解析'}
              </button>

              <Show when={font()}>
                <div class="mt-5 grid grid-cols-2 gap-3 text-xs font-mono">
                  <div class="p-3 rounded-lg bg-black/30 border border-white/10">
                    <div class="text-white/40">FAMILY</div>
                    <div class="text-white mt-1 truncate">{font()!.family}</div>
                  </div>
                  <div class="p-3 rounded-lg bg-black/30 border border-white/10">
                    <div class="text-white/40">GLYPHS</div>
                    <div class="text-white mt-1">{font()!.glyphCount}</div>
                  </div>
                  <div class="p-3 rounded-lg bg-black/30 border border-white/10">
                    <div class="text-white/40">FORMAT</div>
                    <div class="text-white mt-1">{font()!.format}</div>
                  </div>
                  <div class="p-3 rounded-lg bg-black/30 border border-white/10">
                    <div class="text-white/40">UNITS/EM</div>
                    <div class="text-white mt-1">{font()!.unitsPerEm}</div>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-1.5">
                  <For each={Object.keys(font()!.tables || {})}>
                    {t => <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">{t}</span>}
                  </For>
                </div>
              </Show>
            </div>
          </div>

          <div class="glass rounded-2xl p-6 relative overflow-hidden">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm tracking-widest text-white/70 font-mono">02 · PRESETS</h2>
              <span class="text-xs text-white/40 font-mono">SCENARIOS</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <For each={presets()}>
                {p => (
                  <button
                    onClick={() => applyPreset(p)}
                    class={`group relative text-left rounded-xl border p-4 transition hover:-translate-y-0.5 ${preset() === p.id ? 'neon-border' : 'border-white/10'}`}
                    style={{ background: preset() === p.id ? `${p.color}10` : 'rgba(0,0,0,0.2)' }}
                  >
                    <div class="w-8 h-8 rounded-lg mb-2" style={{ background: p.color, 'box-shadow': `0 0 20px ${p.color}60` } as any} />
                    <div class="text-sm font-semibold">{p.name}</div>
                    <div class="text-[10px] font-mono text-white/40 mt-1">ID: {p.id}</div>
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="glass rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm tracking-widest text-white/70 font-mono">03 · CHARSET</h2>
              <span class="text-xs text-white/40 font-mono">{charset().length} chars</span>
            </div>
            <textarea
              value={charset()}
              onInput={e => setCharset((e.target as HTMLTextAreaElement).value)}
              placeholder="输入要保留的字符集…"
              rows={3}
              class="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm font-mono focus:border-neon/50 outline-none resize-none"
            />
            <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setAlgorithm('subset')}
                class={`py-2 rounded-lg border ${algorithm() === 'subset' ? 'border-neon text-neon' : 'border-white/10 text-white/60'}`}
              >SUBSET</button>
              <button
                onClick={() => setAlgorithm('repair')}
                class={`py-2 rounded-lg border ${algorithm() === 'repair' ? 'border-neon text-neon' : 'border-white/10 text-white/60'}`}
              >REPAIR</button>
              <button
                onClick={() => setAlgorithm('merge')}
                class={`py-2 rounded-lg border ${algorithm() === 'merge' ? 'border-neon text-neon' : 'border-white/10 text-white/60'}`}
              >MERGE</button>
            </div>
            <label class="mt-4 flex items-center gap-2 text-xs text-white/60 cursor-pointer select-none">
              <input type="checkbox" checked={checksum()} onChange={e => setChecksum(e.target.checked)} class="accent-neon" />
              重算校验和 (head · checksumAdjustment)
            </label>
            <button
              disabled={!font() || !charset()}
              onClick={process}
              class="mt-4 w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-neon to-violet text-ink hover:opacity-90 transition disabled:opacity-30"
            >
              提交处理 →
            </button>
          </div>
        </section>

        <section class="col-span-12 lg:col-span-7 space-y-6">
          <div class="glass rounded-2xl p-6 relative overflow-hidden">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm tracking-widest text-white/70 font-mono">04 · PREVIEW</h2>
              <span class="text-xs text-white/40 font-mono">VECTOR PATH ANIM</span>
            </div>
            <GlyphPreview text={charset() || 'AaBbCc'} corrupt={isCorrupt()} />
            <div class="mt-4">
              <div class="text-xs font-mono text-white/50 mb-2">CHARSET FILTER</div>
              <CharGridFilter chars={charset() || '0123456789ABCDEF'} kept={keptSet()} glitch={isCorrupt()} />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="glass rounded-2xl p-5 flex flex-col items-center">
              <RingProgress value={progressVal()} glitch={isCorrupt()} />
              <div class="text-xs text-white/40 font-mono mt-3">{task()?.status?.toUpperCase() || 'IDLE'}</div>
            </div>
            <div class="glass rounded-2xl p-5">
              <div class="text-xs text-white/40 font-mono">INPUT SIZE</div>
              <div class="mt-2 text-2xl font-semibold text-white">
                <Show when={font()}>
                  <RollingNumber value={font()!.size} />
                </Show>
                <Show when={!font()}>
                  <span class="text-white/30">—</span>
                </Show>
              </div>
              <div class="text-xs text-white/40 font-mono mt-1">原始体积</div>
            </div>
            <div class="glass rounded-2xl p-5">
              <div class="text-xs text-white/40 font-mono">OUTPUT SIZE</div>
              <div class="mt-2 text-2xl font-semibold text-neon">
                <Show when={task()?.output_size}>
                  <RollingNumber value={task()!.output_size!} />
                </Show>
                <Show when={!task()?.output_size}>
                  <span class="text-white/30">—</span>
                </Show>
              </div>
              <div class="text-xs text-white/40 font-mono mt-1">子集化后</div>
            </div>
          </div>

          <Show when={error()}>
            <GlitchError message={error()!} code={errorCode()!} />
          </Show>

          <div class="glass rounded-2xl p-6 relative overflow-hidden">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm tracking-widest text-white/70 font-mono">05 · TASK QUEUE</h2>
              <span class="text-xs text-white/40 font-mono">SQLite · tasks</span>
            </div>
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <For each={tasks()}>
                {t => (
                  <div class="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10 text-xs font-mono">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class={`w-2 h-2 rounded-full ${t.status === 'done' ? 'bg-neon' : t.status === 'failed' ? 'bg-glitch' : 'bg-amber animate-pulse'}`} />
                      <span class="text-white/70 truncate">{t.id.slice(0, 10)}…</span>
                      <span class="text-white/40">{t.preset || t.algorithm}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-white/50">{t.progress}%</span>
                      <span class="text-white/40">{t.output_size ? (t.output_size / 1024).toFixed(1) + 'KB' : '—'}</span>
                      <Show when={t.status === 'done'}>
                        <a href={`/api/tasks/${t.id}/download`} class="text-neon hover:underline">↓</a>
                      </Show>
                      <Show when={t.status === 'failed'}>
                        <span class="text-glitch">{t.error}</span>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
              <Show when={tasks().length === 0}>
                <div class="text-center py-10 text-white/30 text-xs font-mono">暂无任务 · 提交后将出现在这里</div>
              </Show>
            </div>
          </div>
        </section>
      </main>

      <footer class="border-t border-white/10 py-6 text-center text-xs text-white/30 font-mono">
        crafted with SolidStart · Fastify · SQLite3 · opentype.js
      </footer>
    </div>
  );
}
