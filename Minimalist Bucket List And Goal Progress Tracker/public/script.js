// ============= 全局状态 =============
let goals = [];
let demoMode = 'normal';

const CONTAINER = document.getElementById('goals-container');
const CONFETTI_CANVAS = document.getElementById('confetti-canvas');

// ============= 预设演示数据 =============
const DEMO_PRESETS = {
  'dream-true': {
    title: '学会弹吉他',
    subtasks: [
      { text: '买一把合适的吉他', completed: true },
      { text: '学习 C 和弦指法', completed: true },
      { text: '练习 G 和弦转换', completed: true },
      { text: '掌握基本扫弦节奏', completed: true },
      { text: '弹会《小星星》完整曲目', completed: true },
      { text: '每天练习 30 分钟', completed: true },
    ],
  },
  'half-give-up': {
    title: '跑一场马拉松',
    subtasks: [
      { text: '买一双专业跑鞋', completed: true },
      { text: '连续跑步 3 公里', completed: true },
      { text: '能跑完 5 公里', completed: true },
      { text: '每周跑 3 次', completed: false },
      { text: '完成 10 公里训练', completed: false },
      { text: '参加正式马拉松比赛', completed: false },
    ],
  },
  'normal': {
    title: '学会弹吉他',
    subtasks: [
      { text: '买一把合适的吉他', completed: true },
      { text: '学习 C 和弦指法', completed: true },
      { text: '练习 G 和弦转换', completed: true },
      { text: '掌握基本扫弦节奏', completed: false },
      { text: '弹会《小星星》完整曲目', completed: false },
      { text: '录制一段自己的演奏', completed: false },
    ],
  },
};

// ============= 工具函数 =============
function playDingSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  } catch (e) {}
}

function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {}
}

// ============= 彩带特效 =============
function launchConfetti(duration = 4000, intensity = 'high') {
  const colors = ['#ff0000', '#ff6b00', '#ffd700', '#00ff00', '#00bfff', '#8a2be2', '#ff1493', '#00ff7f'];
  const pieceCount = intensity === 'high' ? 180 : 80;

  for (let i = 0; i < pieceCount; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random() * colors.length)];
      piece.style.background = color;
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-20px';
      const size = 6 + Math.random() * 10;
      piece.style.width = size + 'px';
      piece.style.height = (size * 1.4) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      CONFETTI_CANVAS.appendChild(piece);

      const fallDuration = 2000 + Math.random() * 2000;
      const driftX = (Math.random() - 0.5) * 400;
      const rotations = Math.random() * 720;
      const delay = Math.random() * 300;

      const anim = piece.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${driftX}px, ${window.innerHeight + 50}px) rotate(${rotations}deg)`, opacity: 0 },
        ],
        {
          duration: fallDuration,
          delay: delay,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'forwards',
        }
      );

      anim.onfinish = () => piece.remove();
    }, i * 15);
  }
}

function launchSideConfetti() {
  const colors = ['#ffd700', '#ff6b00', '#ff1493', '#00bfff'];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = side === 0 ? '-10px' : '100%';
        piece.style.top = (30 + Math.random() * 50) + '%';
        const size = 8 + Math.random() * 10;
        piece.style.width = size + 'px';
        piece.style.height = (size * 1.4) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        CONFETTI_CANVAS.appendChild(piece);

        const endX = side === 0 ? window.innerWidth + 50 : -window.innerWidth - 50;
        const endY = (Math.random() - 0.5) * 400;
        const rotations = Math.random() * 1080;

        piece.animate(
          [
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${endX}px, ${endY}px) rotate(${rotations}deg)`, opacity: 0 },
          ],
          {
            duration: 2500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards',
          }
        ).onfinish = () => piece.remove();
      }, i * 25);
    }
  }
}

// ============= 渲染逻辑 =============
function computeProgress(subtasks) {
  if (!subtasks || !subtasks.length) return 0;
  const done = subtasks.filter(s => s.completed).length;
  return Math.round((done / subtasks.length) * 100);
}

function renderGoals() {
  CONTAINER.innerHTML = '';

  if (demoMode === 'new-wish') {
    renderNewGoalCard();
    return;
  }

  goals.forEach(goal => renderGoalCard(goal));
  renderNewGoalCard();
}

function renderGoalCard(goal) {
  const template = document.getElementById('goal-card-template');
  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.goalId = goal.id;

  const progress = computeProgress(goal.subtasks);
  const total = goal.subtasks.length;
  const done = goal.subtasks.filter(s => s.completed).length;

  card.querySelector('.goal-title').textContent = goal.title;
  card.querySelector('.progress-fill').style.width = progress + '%';
  card.querySelector('.progress-text').textContent = progress + '%';
  card.querySelector('.progress-summary').textContent = `已完成 ${done} / ${total} 个子任务`;

  const subtasksList = card.querySelector('.subtasks-list');
  goal.subtasks.forEach(subtask => {
    const li = document.createElement('li');
    li.className = 'subtask-item' + (subtask.completed ? ' completed' : '');
    li.dataset.subtaskId = subtask.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = subtask.completed;
    checkbox.id = `sub-${goal.id}-${subtask.id}`;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = subtask.text;

    li.appendChild(checkbox);
    li.appendChild(label);
    subtasksList.appendChild(li);

    checkbox.addEventListener('change', () => handleSubtaskToggle(goal, subtask, checkbox, li, card));
  });

  if (progress === 100) {
    card.classList.add('complete');
  }

  if (demoMode === 'half-give-up') {
    card.classList.add('abandoned');
  }

  card.querySelector('.btn-delete').addEventListener('click', () => handleDeleteGoal(goal.id));

  CONTAINER.appendChild(card);
}

function renderNewGoalCard() {
  const template = document.getElementById('new-goal-template');
  const card = template.content.firstElementChild.cloneNode(true);

  if (demoMode === 'new-wish') {
    card.classList.add('active');
    card.querySelector('.new-goal-form').hidden = false;
  }

  card.addEventListener('click', (e) => {
    if (card.classList.contains('active')) return;
    card.classList.add('active');
    card.querySelector('.new-goal-form').hidden = false;
  });

  card.querySelector('.btn-cancel').addEventListener('click', (e) => {
    e.stopPropagation();
    if (demoMode === 'new-wish') return;
    card.classList.remove('active');
    card.querySelector('.new-goal-form').hidden = true;
  });

  card.querySelector('.btn-primary').addEventListener('click', (e) => {
    e.stopPropagation();
    handleCreateGoal(card);
  });

  CONTAINER.appendChild(card);
}

// ============= 交互逻辑 =============
function handleSubtaskToggle(goal, subtask, checkbox, li, card) {
  const willComplete = checkbox.checked;
  li.classList.toggle('completed', willComplete);

  if (willComplete) {
    playDingSound();
  }

  const updatedSubtasks = goal.subtasks.map(s =>
    s.id === subtask.id ? { ...s, completed: willComplete } : s
  );
  const newProgress = computeProgress(updatedSubtasks);

  const fill = card.querySelector('.progress-fill');
  const text = card.querySelector('.progress-text');
  const summary = card.querySelector('.progress-summary');
  const done = updatedSubtasks.filter(s => s.completed).length;

  fill.style.width = newProgress + '%';
  text.textContent = newProgress + '%';
  summary.textContent = `已完成 ${done} / ${goal.subtasks.length} 个子任务`;

  if (newProgress === 100 && computeProgress(goal.subtasks) < 100) {
    card.classList.add('complete');
    setTimeout(() => {
      launchConfetti(4000, 'high');
      launchSideConfetti();
      playCelebrationSound();
    }, 600);
  } else if (newProgress < 100) {
    card.classList.remove('complete');
  }

  goal.subtasks = updatedSubtasks;

  if (typeof subtask.id === 'number') {
    fetch(`/api/subtasks/${subtask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: willComplete }),
    }).catch(() => {});
  }
}

function handleCreateGoal(card) {
  const titleInput = card.querySelector('.goal-input');
  const subtaskInputs = card.querySelectorAll('.subtask-input');
  const title = titleInput.value.trim();
  const subtasks = Array.from(subtaskInputs)
    .map(input => input.value.trim())
    .filter(text => text);

  if (!title) {
    titleInput.focus();
    titleInput.style.borderColor = '#dc2626';
    setTimeout(() => (titleInput.style.borderColor = ''), 1500);
    return;
  }
  if (subtasks.length === 0) {
    subtaskInputs[0].focus();
    return;
  }

  fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, subtasks }),
  })
    .then(res => res.json())
    .then(newGoal => {
      goals.unshift({
        id: newGoal.id,
        title: newGoal.title,
        subtasks: newGoal.subtasks.map(s => ({ ...s, completed: !!s.completed })),
      });
      renderGoals();
    })
    .catch(() => {
      goals.unshift({
        id: 'local-' + Date.now(),
        title,
        subtasks: subtasks.map((text, i) => ({ id: 's-' + i, text, completed: false })),
      });
      renderGoals();
    });
}

function handleDeleteGoal(goalId) {
  if (!confirm('确定要删除这个愿望吗？')) return;
  goals = goals.filter(g => g.id !== goalId);
  renderGoals();
  if (typeof goalId === 'number') {
    fetch(`/api/goals/${goalId}`, { method: 'DELETE' }).catch(() => {});
  }
}

// ============= 演示模式切换 =============
function setDemoMode(mode) {
  demoMode = mode;

  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'normal') {
    fetchAndRender();
    return;
  }

  if (mode === 'new-wish') {
    goals = [];
    renderGoals();
    return;
  }

  const preset = DEMO_PRESETS[mode];
  goals = [{
    id: 'demo-' + mode,
    title: preset.title,
    subtasks: preset.subtasks.map((s, i) => ({ id: i, text: s.text, completed: s.completed })),
  }];
  renderGoals();

  if (mode === 'dream-true') {
    setTimeout(() => {
      launchConfetti(4000, 'high');
      launchSideConfetti();
      playCelebrationSound();
    }, 400);
  }
}

document.querySelectorAll('.demo-btn').forEach(btn => {
  btn.addEventListener('click', () => setDemoMode(btn.dataset.mode));
});

// ============= 数据加载 =============
function fetchAndRender() {
  fetch('/api/goals')
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        goals = data.map(g => ({
          id: g.id,
          title: g.title,
          subtasks: g.subtasks.map(s => ({ ...s, completed: !!s.completed })),
        }));
      } else {
        const preset = DEMO_PRESETS['normal'];
        goals = [{
          id: 'demo-normal',
          title: preset.title,
          subtasks: preset.subtasks.map((s, i) => ({ id: i, text: s.text, completed: s.completed })),
        }];
      }
      renderGoals();
    })
    .catch(() => {
      const preset = DEMO_PRESETS['normal'];
      goals = [{
        id: 'demo-normal',
        title: preset.title,
        subtasks: preset.subtasks.map((s, i) => ({ id: i, text: s.text, completed: s.completed })),
      }];
      renderGoals();
    });
}

// ============= 初始化 =============
fetchAndRender();
