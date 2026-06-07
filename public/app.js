// ============================================================
// 沉浸白噪音混音台 - Frontend Logic
// Vanilla JS + Web Audio API (程序化合成声音，无需外部音频文件)
// ============================================================

// ---------- 音源定义 ----------
const TRACKS = [
  { id: 'rain',     name: '雨声',   icon: '\uD83C\uDF27\uFE0F', create: createRain },
  { id: 'fire',     name: '篝火',   icon: '\uD83D\uDD25',      create: createFire },
  { id: 'cafe',     name: '咖啡馆', icon: '\u2615',             create: createCafe },
  { id: 'ocean',    name: '海浪',   icon: '\uD83C\uDF0A',      create: createOcean },
  { id: 'wind',     name: '风声',   icon: '\uD83C\uDF43',      create: createWind },
  { id: 'birds',    name: '鸟鸣',   icon: '\uD83D\uDC26',      create: createBirds }
];

// ---------- Web Audio 状态
let audioCtx = null;
let masterGain = null;
const activeNodes = {};
const trackVolumes = {};
TRACKS.forEach(function(t){ trackVolumes[t.id] = 0; });

// ---------- 番茄钟状态
const FOCUS_SECONDS = 45 * 60;
let timerState = 'idle';
let timerRemaining = FOCUS_SECONDS;
let timerInterval = null;
let timerStartAt = null;
let pausedDuration = 0;
let pauseStartTs = null;
let celebrationMode = false;

// ---------- 工具
let noiseBufferCache = {};
function getNoiseBuffer(type) {
  if (noiseBufferCache[type]) return noiseBufferCache[type];
  const ctx = ensureAudio();
  const duration = 3;
  const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    if (type === 'white') {
      data[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      const white = Math.random() * 2 - 1;
      last = 0.98 * last + 0.02 * white;
      data[i] = last * 3;
    } else {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  noiseBufferCache[type] = buf;
  return buf;
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ---------- 合成音源 ----------
function createRain(ctx, gainNode) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer('white');
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1800;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 400;
  src.connect(hp); hp.connect(lp); lp.connect(gainNode);
  src.start();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 600;
  lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
  lfo.start();
  return function(){ try { src.stop(); lfo.stop(); } catch(e){} };
}

function createFire(ctx, gainNode) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer('brown');
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 600;
  src.connect(lp); lp.connect(gainNode);
  src.start();

  function crackle() {
    const c = ctx.createBufferSource();
    c.buffer = getNoiseBuffer('white');
    const cg = ctx.createGain();
    cg.gain.value = 0;
    const clp = ctx.createBiquadFilter();
    clp.type = 'highpass'; clp.frequency.value = 2000;
    c.connect(clp); clp.connect(cg); cg.connect(gainNode);
    const t = ctx.currentTime;
    cg.gain.setValueAtTime(0, t);
    cg.gain.linearRampToValueAtTime(0.3 + Math.random() * 0.4, t + 0.005);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + Math.random() * 0.1);
    c.start(t); c.stop(t + 0.2);
    setTimeout(crackle, 200 + Math.random() * 900);
  }
  setTimeout(crackle, 500);
  return function(){ try { src.stop(); } catch(e){} };
}

function createCafe(ctx, gainNode) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer('pink');
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'bandpass'; lp.frequency.value = 500; lp.Q.value = 0.7;
  src.connect(lp); lp.connect(gainNode);
  src.start();

  const hum = ctx.createOscillator();
  hum.frequency.value = 110;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.08;
  hum.connect(humGain); humGain.connect(gainNode);
  hum.start();

  function clink() {
    if (!audioCtx) return;
    const freqs = [1200, 1600, 2000, 2400];
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freqs[Math.floor(Math.random()*freqs.length)];
    const og = ctx.createGain();
    og.gain.value = 0;
    o.connect(og); og.connect(gainNode);
    const t = ctx.currentTime;
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.25, t + 0.01);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.start(t); o.stop(t + 0.4);
    setTimeout(clink, 3000 + Math.random() * 5000);
  }
  setTimeout(clink, 2000);
  return function(){ try { src.stop(); hum.stop(); } catch(e){} };
}

function createOcean(ctx, gainNode) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer('brown');
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 800;
  src.connect(lp); lp.connect(gainNode);
  src.start();

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 400;
  lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
  lfo.start();

  const lfo2 = ctx.createOscillator();
  lfo2.frequency.value = 0.07;
  const lfo2Gain = ctx.createGain();
  lfo2Gain.gain.value = 0.2;
  const lfo2Base = ctx.createGain();
  lfo2Base.gain.value = 0.7;
  lfo2.connect(lfo2Gain); lfo2Gain.connect(lfo2Base.gain);
  lp.disconnect(); lp.connect(lfo2Base); lfo2Base.connect(gainNode);
  lfo2.start();
  return function(){ try { src.stop(); lfo.stop(); lfo2.stop(); } catch(e){} };
}

function createWind(ctx, gainNode) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer('brown');
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.8;
  src.connect(bp); bp.connect(gainNode);
  src.start();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 400;
  lfo.connect(lfoGain); lfoGain.connect(bp.frequency);
  lfo.start();
  return function(){ try { src.stop(); lfo.stop(); } catch(e){} };
}

function createBirds(ctx, gainNode) {
  function chirp() {
    if (!audioCtx) return;
    const duration = 0.15 + Math.random() * 0.3;
    const o = ctx.createOscillator();
    o.type = 'sine';
    const og = ctx.createGain();
    og.gain.value = 0;
    const t = ctx.currentTime;
    const baseFreq = 1800 + Math.random() * 2200;
    o.frequency.setValueAtTime(baseFreq, t);
    o.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + duration / 2);
    o.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, t + duration);
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.18, t + 0.02);
    og.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(og); og.connect(gainNode);
    o.start(t); o.stop(t + duration + 0.05);
    setTimeout(chirp, 1500 + Math.random() * 5000);
  }
  setTimeout(chirp, 1000);
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer('pink');
  src.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2500;
  const hpGain = ctx.createGain();
  hpGain.gain.value = 0.15;
  src.connect(hp); hp.connect(hpGain); hpGain.connect(gainNode);
  src.start();
  return function(){ try { src.stop(); } catch(e){} };
}

// ---------- 构建 UI ----------
const tracksEl = document.getElementById('tracks');
TRACKS.forEach(function(track){
  const el = document.createElement('div');
  el.className = 'track';
  el.dataset.id = track.id;
  el.innerHTML =
    '<div class="track-icon">' + track.icon + '</div>' +
    '<div class="track-name">' + track.name + '</div>' +
    '<input type="range" min="0" max="100" value="0" class="slider-h" data-track="' + track.id + '">' +
    '<div class="track-value" data-value="' + track.id + '">0%</div>';
  tracksEl.appendChild(el);
});

// 使用水平滑条 + transform: rotate 模拟垂直推子(兼容性好)
// 这里直接用水平滑条(更稳定)，配合样式
document.querySelectorAll('.slider-h').forEach(function(s){
  s.addEventListener('input', onTrackVolume);
});

// 将水平滑条样式改为美观的竖条
const styleFix = document.createElement('style');
styleFix.textContent = '\
.slider-h { -webkit-appearance:none; appearance:none; width:160px; height:14px; background:rgba(255,255,255,0.06); border-radius:999px; outline:none; cursor:pointer; }\
.slider-h::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg, #f0abfc, #a78bfa); box-shadow:0 0 12px #a78bfa; border:2px solid #fff; cursor:grab; }\
.slider-h::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg, #f0abfc, #a78bfa); border:2px solid #fff; }\
';
document.head.appendChild(styleFix);

function onTrackVolume(e) {
  const id = e.target.dataset.track;
  const val = parseInt(e.target.value, 10);
  trackVolumes[id] = val;
  const trackEl = document.querySelector('.track[data-id="' + id + '"]');
  const valLabel = document.querySelector('[data-value="' + id + '"]');
  if (valLabel) valLabel.textContent = val + '%';
  if (trackEl) trackEl.classList.toggle('active', val > 0);
  applyVolumeToNode(id, val / 100);
}

function applyVolumeToNode(id, level) {
  if (!audioCtx) return;
  const entry = activeNodes[id];
  if (!entry) {
    if (level > 0) {
      const def = TRACKS.find(function(t){ return t.id === id; });
      const gain = audioCtx.createGain();
      gain.gain.value = 0;
      gain.connect(masterGain);
      const stop = def.create(audioCtx, gain);
      activeNodes[id] = { gain: gain, stop: stop };
      gain.gain.linearRampToValueAtTime(level, audioCtx.currentTime + 0.5);
    }
    return;
  }
  entry.gain.gain.cancelScheduledValues(audioCtx.currentTime);
  entry.gain.gain.linearRampToValueAtTime(level, audioCtx.currentTime + 0.3);
  if (level === 0) {
    setTimeout(function(){
      const node = activeNodes[id];
      if (!node) return;
      if (node.gain.gain.value < 0.01) {
        try { if (node.stop) node.stop(); } catch(e){}
        try { node.gain.disconnect(); } catch(e){}
        delete activeNodes[id];
      }
    }, 800);
  }
}

// 主音量
const masterVol = document.getElementById('masterVol');
const masterLabel = document.getElementById('masterVolLabel');
masterVol.addEventListener('input', function(){
  const v = masterVol.value / 100;
  if (audioCtx && masterGain) {
    masterGain.gain.linearRampToValueAtTime(v, audioCtx.currentTime + 0.2);
  }
  masterLabel.textContent = masterVol.value + '%';
});

// ---------- 番茄钟 ----------
const startBtn = document.getElementById('startBtn');
const startZone = document.getElementById('startZone');
const controls = document.getElementById('controls');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const timerDisplay = document.getElementById('timerDisplay');
const timerStatus = document.getElementById('timerStatus');
const timerEl = document.getElementById('timer');
const energyFill = document.getElementById('energyFill');
const energyText = document.getElementById('energyText');

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return m + ':' + ss;
}
function renderTimer() { timerDisplay.textContent = fmt(timerRemaining); }
renderTimer();

function setState(s) {
  // 仅控制视觉状态 (dataset)，不覆盖 timerState
  var visual = 'idle';
  if (s === 'running') visual = 'running';
  else if (s === 'paused') visual = 'paused';
  else if (s === 'completed' || s === 'flow') visual = 'flow';
  else if (s === 'aborted') visual = 'aborted';
  else if (s === 'night') visual = 'night';
  document.body.dataset.state = visual;
}

// 会话总专注时长(秒)，不受暂停/恢复影响
let totalFocusSeconds = 0;
// 会话开始时间戳(ms)，用于后端记录
let sessionStartAt = null;

startBtn.addEventListener('click', function(){
  ensureAudio();
  timerRemaining = FOCUS_SECONDS;
  totalFocusSeconds = 0;
  sessionStartAt = Date.now();
  startZone.classList.add('hidden');
  controls.classList.remove('hidden');
  pauseBtn.textContent = '暂停';
  stopBtn.textContent = '结束';
  timerStatus.textContent = '专注中...';
  timerEl.classList.remove('shatter');
  timerState = 'running';
  setState('running');
  renderTimer();
  renderEnergy();
  runTimer();
});

function runTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(function(){
    if (timerState !== 'running') return;
    timerRemaining -= 1;
    totalFocusSeconds += 1;
    renderTimer();
    renderEnergy();
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      completeSession(true);
    }
  }, 1000);
}

function renderEnergy() {
  const elapsed = FOCUS_SECONDS - timerRemaining;
  const pct = Math.min(100, Math.round((elapsed / FOCUS_SECONDS) * 100));
  energyFill.style.width = pct + '%';
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  if (timerState === 'running') {
    energyText.textContent = '专注中 · 已进行 ' + mins + ' 分 ' + secs + ' 秒';
  } else if (timerState === 'paused') {
    energyText.textContent = '已暂停 · 已进行 ' + mins + ' 分 ' + secs + ' 秒';
  }
}

pauseBtn.addEventListener('click', function(){
  if (timerState === 'running') {
    clearInterval(timerInterval);
    timerState = 'paused';
    pauseBtn.textContent = '继续';
    timerStatus.textContent = '已暂停 (点击继续恢复)';
    timerEl.classList.add('shatter');
    setState('paused');
    renderEnergy();
  } else if (timerState === 'paused') {
    timerState = 'running';
    pauseBtn.textContent = '暂停';
    timerStatus.textContent = '专注中...';
    timerEl.classList.remove('shatter');
    setState('running');
    renderEnergy();
    runTimer();
  }
});

stopBtn.addEventListener('click', function(){
  if (timerState === 'idle' || timerState === 'completed' || timerState === 'aborted') return;
  if (!confirm('确认结束本次专注？')) return;
  clearInterval(timerInterval);
  completeSession(false);
});

function completeSession(completed) {
  const end = Date.now();
  const duration = totalFocusSeconds;
  const sources = {};
  Object.keys(trackVolumes).forEach(function(k){ sources[k] = trackVolumes[k]; });
  let score = 0;
  if (completed) {
    score = 100;
    timerStatus.textContent = '\u2726 心流达成! 45 分钟深度专注 \u2726';
    timerState = 'completed';
  } else {
    const mins = Math.floor(duration / 60);
    score = Math.min(80, Math.floor((duration / FOCUS_SECONDS) * 100));
    timerStatus.textContent = '专注记录 · ' + mins + ' 分钟 (评分 ' + score + ')';
    timerState = 'aborted';
  }
  fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_time: sessionStartAt,
      end_time: end,
      duration_seconds: duration,
      sources: sources,
      score: score,
      status: completed ? 'completed' : 'aborted'
    })
  }).catch(function(){});
  setState(completed ? 'flow' : 'aborted');
  renderEnergy();
  if (completed) triggerCelebration();
  setTimeout(function(){
    controls.classList.add('hidden');
    startZone.classList.remove('hidden');
    startBtn.textContent = '再次专注';
    setTimeout(function(){
      if (timerState !== 'completed') setState('idle');
    }, 4000);
  }, 1500);
}

// ---------- 预设 ----------
document.querySelectorAll('.preset-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    applyPreset(btn.dataset.preset);
  });
});

function applyPreset(name) {
  ensureAudio();
  if (name === 'flow') {
    trackVolumes.rain = 70; trackVolumes.fire = 30; trackVolumes.ocean = 40;
    trackVolumes.cafe = 20; trackVolumes.wind = 0; trackVolumes.birds = 15;
    setState('running');
  } else if (name === 'night') {
    trackVolumes.rain = 0; trackVolumes.fire = 25; trackVolumes.ocean = 0;
    trackVolumes.cafe = 0; trackVolumes.wind = 10; trackVolumes.birds = 0;
    setState('night');
  } else {
    TRACKS.forEach(function(t){ trackVolumes[t.id] = 0; });
    setState('idle');
  }
  Object.keys(trackVolumes).forEach(function(id){
    const el = document.querySelector('input[data-track="' + id + '"]');
    if (el) el.value = trackVolumes[id];
    const valLabel = document.querySelector('[data-value="' + id + '"]');
    if (valLabel) valLabel.textContent = trackVolumes[id] + '%';
    const trackEl = document.querySelector('.track[data-id="' + id + '"]');
    if (trackEl) trackEl.classList.toggle('active', trackVolumes[id] > 0);
    applyVolumeToNode(id, trackVolumes[id] / 100);
  });
}

// ---------- 极光 canvas 动画 ----------
const auroraCanvas = document.getElementById('aurora');
const auroraCtx = auroraCanvas.getContext('2d');
const starsCanvas = document.getElementById('stars');
const starsCtx = starsCanvas.getContext('2d');
let stars = [];

function resizeCanvases() {
  [auroraCanvas, starsCanvas].forEach(function(c){
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  });
  makeStars();
}
function makeStars() {
  stars = [];
  const n = Math.floor(window.innerWidth * window.innerHeight / 3500);
  for (let i = 0; i < n; i++) {
    stars.push({
      x: Math.random() * starsCanvas.width,
      y: Math.random() * starsCanvas.height * 0.7,
      r: Math.random() * 1.2 + 0.2,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.02 + 0.005
    });
  }
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

function drawStars() {
  starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.tw += s.sp;
    const a = 0.3 + Math.sin(s.tw) * 0.4 + 0.3;
    starsCtx.beginPath();
    starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    starsCtx.fillStyle = 'rgba(220, 220, 255, ' + a + ')';
    starsCtx.fill();
  }
  requestAnimationFrame(drawStars);
}
requestAnimationFrame(drawStars);

function drawAurora() {
  const W = auroraCanvas.width;
  const H = auroraCanvas.height;
  auroraCtx.clearRect(0, 0, W, H);

  const bands = [
    { hue: 280, y: H * 0.15, amp: 40, speed: 0.0003, thick: 180 },
    { hue: 260, y: H * 0.22, amp: 60, speed: 0.0005, thick: 140 },
    { hue: 300, y: H * 0.1,  amp: 30, speed: 0.0004, thick: 120 },
    { hue: 210, y: H * 0.28, amp: 50, speed: 0.0002, thick: 100 }
  ];
  const t = performance.now();
  for (let bi = 0; bi < bands.length; bi++) {
    const b = bands[bi];
    const grad = auroraCtx.createLinearGradient(0, b.y - b.thick, 0, b.y + b.thick);
    const alpha = celebrationMode ? 0.55 : 0.35;
    grad.addColorStop(0, 'hsla(' + b.hue + ', 80%, 60%, 0)');
    grad.addColorStop(0.5, 'hsla(' + b.hue + ', 80%, 60%, ' + alpha + ')');
    grad.addColorStop(1, 'hsla(' + b.hue + ', 80%, 60%, 0)');
    auroraCtx.fillStyle = grad;
    auroraCtx.beginPath();
    auroraCtx.moveTo(0, b.y);
    for (let x = 0; x <= W; x += 8) {
      const y = b.y
        + Math.sin(x * 0.004 + t * b.speed + bi) * b.amp
        + Math.cos(x * 0.002 + t * b.speed * 1.5) * (b.amp * 0.6);
      auroraCtx.lineTo(x, y);
    }
    auroraCtx.lineTo(W, 0);
    auroraCtx.lineTo(0, 0);
    auroraCtx.closePath();
    auroraCtx.fill();
  }
  if (celebrationMode) {
    for (let i = 0; i < 40; i++) {
      const x = (i / 40) * W + Math.sin(t * 0.001 + i) * 60;
      const y = H * 0.2 + Math.cos(t * 0.0008 + i * 0.5) * 80;
      const grad2 = auroraCtx.createRadialGradient(x, y, 0, x, y, 120);
      grad2.addColorStop(0, 'hsla(' + (280 + i * 3) + ', 90%, 70%, 0.35)');
      grad2.addColorStop(1, 'hsla(300, 80%, 60%, 0)');
      auroraCtx.fillStyle = grad2;
      auroraCtx.beginPath();
      auroraCtx.arc(x, y, 120, 0, Math.PI * 2);
      auroraCtx.fill();
    }
  }
  requestAnimationFrame(drawAurora);
}
requestAnimationFrame(drawAurora);

function triggerCelebration() {
  celebrationMode = true;
  energyText.textContent = '\u2726 心流状态达成! 能量满溢 \u2726';
  energyFill.style.width = '100%';
  setTimeout(function(){ celebrationMode = false; }, 8000);
}
