import { createSignal, onMount, onCleanup } from 'solid-js';

export default function GlitchError(props: { message: string; code?: string }) {
  const [jitter, setJitter] = createSignal(0);
  let raf = 0;
  onMount(() => {
    const loop = () => {
      setJitter(Math.random());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
  onCleanup(() => cancelAnimationFrame(raf));

  const jx = (Math.random() - 0.5) * 2;
  return (
    <div class="relative p-4 rounded-lg border border-glitch/40 bg-glitch/5 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none" style={{
        'background-image': 'repeating-linear-gradient(0deg, rgba(255,45,110,0.08) 0 2px, transparent 2px 4px)',
      } as any} />
      <div class="relative">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-block w-2 h-2 bg-glitch rounded-full animate-flicker" />
          <span class="text-glitch font-mono text-xs tracking-widest">// ERROR {props.code || ''}</span>
        </div>
        <div class="relative font-mono text-sm text-glitch leading-relaxed" style={{ transform: `translateX(${jx}px)` }}>
          <span class="glitch-err inline-block">{props.message}</span>
        </div>
      </div>
    </div>
  );
}
