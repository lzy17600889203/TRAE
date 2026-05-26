const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');

const defaultPresets = [
  {
    id: 1,
    name: '窄栏新闻场景',
    description: '模拟报纸窄栏排版，容易产生河流效应',
    column_width: 200,
    word_spacing: 0.8,
    letter_spacing: 0,
    hyphenation_rules: 'strict',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: '宽屏阅读场景',
    description: '宽屏舒适阅读，字间距宽松',
    column_width: 600,
    word_spacing: 1.2,
    letter_spacing: 0.5,
    hyphenation_rules: 'normal',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: '代码块混排场景',
    description: '代码与正文混排，等宽字体对齐',
    column_width: 450,
    word_spacing: 1.0,
    letter_spacing: 0,
    hyphenation_rules: 'none',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: '极端连字规则场景',
    description: '激进连字规则，容易产生渲染问题',
    column_width: 350,
    word_spacing: 0.9,
    letter_spacing: 0.2,
    hyphenation_rules: 'aggressive',
    created_at: new Date().toISOString()
  }
];

const defaultFontMetrics = [
  { font_family: 'Georgia', font_size: 16, char: 'a', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'b', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'c', width: 8.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'd', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'e', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'f', width: 5.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'g', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'h', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'i', width: 4.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'j', width: 4.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'k', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'l', width: 4.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'm', width: 14.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'n', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'o', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'p', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'q', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'r', width: 5.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 's', width: 8.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 't', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'u', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'v', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'w', width: 12.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'x', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'y', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'z', width: 8.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'A', width: 11.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'B', width: 10.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'C', width: 11.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'D', width: 11.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'E', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'F', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'G', width: 12.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'H', width: 11.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'I', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'J', width: 8.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'K', width: 10.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'L', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'M', width: 13.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'N', width: 11.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'O', width: 12.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'P', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'Q', width: 12.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'R', width: 11.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'S', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'T', width: 8.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'U', width: 11.2, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'V', width: 10.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'W', width: 14.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'X', width: 10.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'Y', width: 10.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: 'Z', width: 9.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: ' ', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: '.', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: ',', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: '!', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: '?', width: 8.0, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: ';', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: ':', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: '-', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: '\'', width: 2.4, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: '"', width: 4.8, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: '(', width: 5.6, kerning: 0 },
  { font_family: 'Georgia', font_size: 16, char: ')', width: 5.6, kerning: 0 }
];

let db = {
  presets: [...defaultPresets],
  font_metrics: [...defaultFontMetrics]
};

function loadDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
    } else {
      saveDb();
    }
  } catch (error) {
    console.error('加载数据库失败，使用默认数据:', error.message);
    saveDb();
  }
}

function saveDb() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('保存数据库失败:', error.message);
  }
}

loadDb();

function getAllPresets() {
  return { all: () => db.presets };
}

function getPresetByName() {
  return {
    get: (name) => db.presets.find(p => p.name === name)
  };
}

function insertPreset(name, description, column_width, word_spacing, letter_spacing, hyphenation_rules) {
  const existing = db.presets.findIndex(p => p.name === name);
  const preset = {
    id: existing >= 0 ? db.presets[existing].id : Date.now(),
    name,
    description,
    column_width,
    word_spacing,
    letter_spacing,
    hyphenation_rules,
    created_at: new Date().toISOString()
  };
  
  if (existing >= 0) {
    db.presets[existing] = preset;
  } else {
    db.presets.push(preset);
  }
  
  saveDb();
  return { lastInsertRowid: preset.id };
}

module.exports = {
  db,
  getAllPresets: getAllPresets(),
  getPresetByName: getPresetByName(),
  insertPreset
};
