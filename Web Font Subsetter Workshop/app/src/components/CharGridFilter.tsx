import { createSignal, onMount, createEffect, onCleanup } from 'solid-js';

export default function CharGridFilter(props: { chars: string; kept: Set<string>; glitch?: boolean }) {
  const [t, setT] = createSignal(0);
  let raf = 0;
  onMount(() => {
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
  onCleanup(() => cancelAnimationFrame(raf));

  const items = () => Array.from(props.chars).filter(c => c !== '\n' && c !== ' ').slice(0, 120);

  return (
    <div class="grid grid-cols-[repeat(auto-fill,minmax(34px,1fr))] gap-1.5 p-2">
      {items().map((ch, i) => {
        const isKept = props.kept.has(ch);
        const wobble = Math.sin(t() * 4 + i * 0.2) * 2;
        return (
          <div
            class={`char-cell font-mono text-center leading-none py-2 border border-white/10 rounded text-sm ${isKept ? 'kept' : 'filtered'}`}
            style={props.glitch && !isKept ? { transform: `translateX(${wobble}px)`, color: '#ff2d6e' } : undefined}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
}
