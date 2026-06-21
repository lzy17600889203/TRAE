const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'indie-db.json');

function load() {
  try {
    if (!fs.existsSync(DB_FILE)) return null;
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

let state = load();
if (!state) {
  state = {
    songs: [],
    fans: [],
    announcements: [],
    _seq: { songs: 0, fans: 0, announcements: 0 },
  };
  save(state);
}

function nextId(kind) {
  state._seq[kind] = (state._seq[kind] || 0) + 1;
  save(state);
  return state._seq[kind];
}

function persist() { save(state); }

module.exports = {
  state,
  persist,
  nextId,
  get songs() { return state.songs; },
  get fans() { return state.fans; },
  get announcements() { return state.announcements; },
};

