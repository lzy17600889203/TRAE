import { createSignal, onMount, onCleanup } from 'solid-js';

export default function RollingNumber(props: { value: number; duration?: number; className?: string; suffix?: string }) {
  const [display, setDisplay] = createSignal(0);
  let raf: number;

  onMount(() => {
    const duration = props.duration ?? 900;
    const start = performance.now();
    const from = 0;
    const to = props.value;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
  onCleanup(() => cancelAnimationFrame(raf));

  const fmt = (n: number) => {
    if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
    if (n >= 1024) return (n / 1024).toFixed(2) + ' KB';
    return n + ' B';
  };

  return <span class={props.className}>{fmt(display())}{props.suffix || ''}</span>;
}
