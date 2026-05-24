export default function RingProgress(props: { value: number; size?: number; label?: string; glitch?: boolean }) {
  const size = props.size || 96;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (props.value / 100) * c;
  const color = props.glitch ? '#ff2d6e' : '#00ffa3';
  return (
    <div class="relative" style={{ width: size + 'px', height: size + 'px' }}>
      <svg width={size} height={size} class="block">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" stroke-width={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          stroke-width={stroke}
          stroke-linecap="round"
          fill="none"
          stroke-dasharray={String(c)}
          stroke-dashoffset={String(offset)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 420ms ease' } as any}
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center font-mono">
        <div class={`text-xl font-semibold ${props.glitch ? 'text-glitch glitch-text' : 'text-neon'}`}>{props.value}%</div>
        <div class="text-[10px] text-white/50 tracking-wider">{props.label || 'PROCESSING'}</div>
      </div>
    </div>
  );
}
