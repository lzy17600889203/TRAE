const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'resume-data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) { console.warn('读取数据失败，使用空模板'); }
  return {
    profile: { name: '', title: '', email: '', phone: '', location: '', summary: '', theme: 'minimal' },
    experiences: [], skills: [], projects: [], education: []
  };
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('保存失败', e);
    return false;
  }
}

app.get('/api/resume', (req, res) => {
  res.json(readData());
});

app.post('/api/resume', (req, res) => {
  const data = req.body || {};
  const payload = {
    profile: {
      name: data.name || '', title: data.title || '', email: data.email || '',
      phone: data.phone || '', location: data.location || '', summary: data.summary || '',
      theme: data.theme || 'minimal'
    },
    experiences: data.experiences || [],
    skills: data.skills || [],
    projects: data.projects || [],
    education: data.education || []
  };
  const ok = writeData(payload);
  res.json({ ok, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`  数字名片 · 简历生成器已启动`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  数据文件: ${DATA_FILE}`);
  console.log('========================================');
});
