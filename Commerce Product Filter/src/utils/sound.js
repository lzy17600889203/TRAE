let audioCtx = null

function ensureCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (Ctx) audioCtx = new Ctx()
  }
  return audioCtx
}

export function playAlertSound() {
  const ctx = ensureCtx()
  if (!ctx) return

  // 轻微警报：两声短促的 "叮"
  const now = ctx.currentTime
  ;[0, 0.18].forEach((offset, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(i === 0 ? 880 : 1120, now + offset)
    gain.gain.setValueAtTime(0, now + offset)
    gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.18)
  })
}
