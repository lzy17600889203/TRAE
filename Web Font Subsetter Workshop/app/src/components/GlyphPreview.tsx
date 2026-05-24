import { createSignal, onMount, onCleanup, createEffect } from 'solid-js';

export default function GlyphPreview(props: { text: string; corrupt?: boolean }) {
  const [progress, setProgress] = createSignal(0);
  let raf = 0;

  createEffect(() => {
    const start = performance.now();
    const dur = 1600;
    const loop = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
  onCleanup(() => cancelAnimationFrame(raf));

  const chars = () => Array.from(props.text || '').slice(0, 24);

  return (
    <div class="relative overflow-hidden rounded-lg border border-white/10 bg-black/30 p-4 min-h-[220px]">
      <div class="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div class="relative flex flex-wrap gap-3 items-end justify-center">
        {chars().map((ch, idx) => {
          const drawDelay = (idx / chars().length) * progress();
          const visible = progress() > drawDelay;
          return (
            <div
              class={`relative w-12 h-14 flex items-center justify-center border rounded ${props.corrupt ? 'border-glitch/40' : 'border-neon/30'}`}
              style={{ opacity: visible ? 1 : 0.2, transition: 'opacity 240ms' }}
            >
              <svg viewBox="0 0 100 100" class="w-full h-full">
                <path
                  d="M10,80 Q20,20 50,30 T90,60 Q85,85 70,80 T50,90 Q30,95 10,80"
                  class={props.corrupt ? 'stroke-glitch' : 'stroke-neon'}
                  stroke-width="1.2"
                  fill="none"
                  stroke-dasharray="400"
                  style={{
                    'stroke-dashoffset': visible ? 0 : 400,
                    transition: `stroke-dashoffset 900ms ease ${drawDelay * 600}ms`,
                  } as any}
                />
              </svg>
              <div
                class={`absolute inset-0 flex items-center justify-center font-mono text-xl ${props.corrupt ? 'text-glitch glitch-text' : 'text-white'}`}
                style={{ opacity: visible ? 1 : 0 }}
              >
                {props.corrupt && idx % 3 === 0 ? '▓' : ch}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
