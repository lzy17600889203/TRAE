const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'bucket-list.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;  // sql.js 数据库实例

// ============ sql.js 辅助函数 ============
function rowsToObjects(result) {
  // result: [{columns: ['id','title',...], values: [[1,'x',...],[2,'y',...]]}]
  if (!result || !result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => { obj[col] = row[idx]; });
    return obj;
  });
}

function saveToFile() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (e) {
    console.warn('保存数据库文件失败', e.message);
  }
}

function computeProgress(subtasks) {
  if (!subtasks || !subtasks.length) return 0;
  const done = subtasks.filter(s => s.completed).length;
  return Math.round((done / subtasks.length) * 100);
}

// ============ 初始化数据库 ============
(async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE);
      db = new SQL.Database(data);
      console.log('✅ SQLite 数据库已从文件恢复');
    } catch (e) {
      console.warn('读取数据库文件失败，重建空库', e.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('✅ 新建空 SQLite 数据库');
  }

  // 创建表（如果不存在）
  db.run(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
  );`);

  saveToFile();
})();

// ============ API 路由 ============
app.get('/api/goals', (req, res) => {
  const goals = rowsToObjects(db.exec('SELECT id, title, created_at FROM goals ORDER BY id DESC'));
  const result = goals.map(goal => {
    const subtasks = rowsToObjects(
      db.exec('SELECT id, goal_id, text, completed FROM subtasks WHERE goal_id = ' + goal.id)
    ).map(s => ({ ...s, completed: !!s.completed }));
    return {
      ...goal,
      subtasks,
      progress: computeProgress(subtasks),
      total: subtasks.length,
      done: subtasks.filter(s => s.completed).length,
    };
  });
  res.json(result);
});

app.post('/api/goals', (req, res) => {
  const { title, subtasks } = req.body;
  if (!title || !subtasks || !subtasks.length) {
    return res.status(400).json({ error: '需要标题和至少一个子任务' });
  }
  // 插入目标
  db.run("INSERT INTO goals (title) VALUES (?)", [title.trim()]);
  // 查刚插入的 ID
  const goalIdRow = rowsToObjects(db.exec('SELECT last_insert_rowid() as id'));
  const goalId = goalIdRow[0].id;
  // 插入子任务
  const validSubtasks = subtasks.filter(t => t && t.trim());
  validSubtasks.forEach(text => {
    db.run("INSERT INTO subtasks (goal_id, text, completed) VALUES (?, ?, 0)", [goalId, text.trim()]);
  });
  // 读回完整信息
  const goal = rowsToObjects(
    db.exec("SELECT id, title, created_at FROM goals WHERE id = " + goalId)
  )[0];
  const goalSubtasks = rowsToObjects(
    db.exec("SELECT id, goal_id, text, completed FROM subtasks WHERE goal_id = " + goalId)
  ).map(s => ({ ...s, completed: !!s.completed }));

  saveToFile();
  res.json({
    ...goal,
    subtasks: goalSubtasks,
    progress: 0,
    total: goalSubtasks.length,
    done: 0,
  });
});

app.patch('/api/subtasks/:id', (req, res) => {
  const { completed } = req.body;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: '无效的子任务 ID' });
  }
  db.run("UPDATE subtasks SET completed = ? WHERE id = ?", [completed ? 1 : 0, id]);
  const subtask = rowsToObjects(
    db.exec("SELECT id, goal_id, text, completed FROM subtasks WHERE id = " + id)
  ).map(s => ({ ...s, completed: !!s.completed }))[0];
  saveToFile();
  if (subtask) res.json(subtask);
  else res.status(404).json({ error: '子任务未找到' });
});

app.delete('/api/goals/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.json({ success: false, message: '无效的目标 ID' });
  }
  db.run("DELETE FROM subtasks WHERE goal_id = " + id);
  db.run("DELETE FROM goals WHERE id = " + id);
  saveToFile();
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 梦想激励板服务器启动成功！`);
  console.log(`📂 访问地址:  http://localhost:${PORT}`);
  console.log(`💾 SQLite 文件: ${DB_FILE}\n`);
});
