const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'bucket-list.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let nextGoalId = 1;
let nextSubtaskId = 1;

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      nextGoalId = parsed.nextGoalId || 1;
      nextSubtaskId = parsed.nextSubtaskId || 1;
      return parsed.goals || [];
    }
  } catch (e) {
    console.warn('读取数据文件失败，使用空数据', e.message);
  }
  return [];
}

function saveData(goals) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ goals, nextGoalId, nextSubtaskId }, null, 2)
    );
  } catch (e) {
    console.warn('保存数据文件失败', e.message);
  }
}

function computeProgress(subtasks) {
  if (!subtasks || !subtasks.length) return 0;
  const done = subtasks.filter(s => s.completed).length;
  return Math.round((done / subtasks.length) * 100);
}

app.get('/api/goals', (req, res) => {
  const goals = loadData();
  const result = goals.map(goal => ({
    id: goal.id,
    title: goal.title,
    created_at: goal.created_at,
    subtasks: goal.subtasks,
    progress: computeProgress(goal.subtasks),
    total: goal.subtasks.length,
    done: goal.subtasks.filter(s => s.completed).length,
  }));
  res.json(result);
});

app.post('/api/goals', (req, res) => {
  const { title, subtasks } = req.body;
  if (!title || !subtasks || !subtasks.length) {
    return res.status(400).json({ error: '需要标题和至少一个子任务' });
  }
  const goals = loadData();
  const goalId = nextGoalId++;
  const newSubtasks = subtasks
    .filter(text => text && text.trim())
    .map(text => ({
      id: nextSubtaskId++,
      goal_id: goalId,
      text: text.trim(),
      completed: false,
    }));
  const newGoal = {
    id: goalId,
    title,
    created_at: new Date().toISOString(),
    subtasks: newSubtasks,
  };
  goals.unshift(newGoal);
  saveData(goals);
  res.json({
    ...newGoal,
    progress: 0,
    total: newSubtasks.length,
    done: 0,
  });
});

app.patch('/api/subtasks/:id', (req, res) => {
  const { completed } = req.body;
  const id = parseInt(req.params.id);
  const goals = loadData();
  for (const goal of goals) {
    const subtask = goal.subtasks.find(s => s.id === id);
    if (subtask) {
      subtask.completed = !!completed;
      saveData(goals);
      return res.json(subtask);
    }
  }
  res.status(404).json({ error: '子任务未找到' });
});

app.delete('/api/goals/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const goals = loadData();
  const filtered = goals.filter(g => g.id !== id);
  saveData(filtered);
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 梦想激励板服务器启动成功！`);
  console.log(`📂 访问地址:  http://localhost:${PORT}`);
  console.log(`💾 数据文件:  ${DATA_FILE}\n`);
});
