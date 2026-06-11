const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const initDb = require('./db');
const { scanReminders, enrichPet, setDb } = require('./scheduler');

async function main() {
  const db = await initDb();
  setDb(db);

  // Make sure seed-like initial data exists if table is empty
  const petCount = db.get('SELECT COUNT(*) as c FROM pets').c;
  if (petCount === 0) {
    // Insert a demo pet so the UI works out of the box
    const today = new Date();
    const offsetDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().split('T')[0];
    };
    const demo = [
      { name: '旺财', species: '狗狗', breed: '金毛', age: 3, avatar: 'dog-golden',
        status: 'healthy', weight: 28.5, temperature: 38.5, heart_rate: 95,
        next_deworming: offsetDays(45), next_rabies: offsetDays(180) },
      { name: '咪咪', species: '猫咪', breed: '橘猫', age: 2, avatar: 'cat-orange',
        status: 'healthy', weight: 5.2, temperature: 38.2, heart_rate: 130,
        next_deworming: offsetDays(60), next_rabies: offsetDays(25) },
      { name: '小白', species: '猫咪', breed: '英短', age: 5, avatar: 'cat-british',
        status: 'critical', weight: 4.0, temperature: 39.8, heart_rate: 180,
        next_deworming: offsetDays(90), next_rabies: offsetDays(150) },
      { name: '豆豆', species: '狗狗', breed: '柯基', age: 4, avatar: 'dog-corgi',
        status: 'healthy', weight: 12.3, temperature: 38.3, heart_rate: 100,
        next_deworming: offsetDays(15), next_rabies: offsetDays(120) },
      { name: '球球', species: '兔子', breed: '垂耳兔', age: 1, avatar: 'bunny',
        status: 'healthy', weight: 1.8, temperature: 38.8, heart_rate: 220,
        next_deworming: offsetDays(80), next_rabies: offsetDays(200) },
      { name: '雪球', species: '仓鼠', breed: '银狐', age: 1, avatar: 'hamster',
        status: 'healthy', weight: 0.05, temperature: 37.5, heart_rate: 400,
        next_deworming: offsetDays(100), next_rabies: offsetDays(365) }
    ];

    const petSql = 'INSERT INTO pets (name, species, breed, age, avatar, status, weight, temperature, heart_rate, next_deworming, next_rabies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const recSql = 'INSERT INTO medical_records (pet_id, type, title, description, hospital, doctor, record_date, next_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    db.transaction(() => {
      for (const p of demo) {
        const info = db.run(petSql, [
          p.name, p.species, p.breed, p.age, p.avatar, p.status,
          p.weight, p.temperature, p.heart_rate, p.next_deworming, p.next_rabies
        ]);
        const petId = info.lastInsertRowid;
        const records = [
          { type: 'vaccine', title: '疫苗接种', description: '完成常规疫苗注射，状态良好。',
            hospital: '宠物医院总院', doctor: '李医生', record_date: offsetDays(-20), next_visit: offsetDays(160) },
          { type: 'checkup', title: '例行体检', description: '血液、生化指标正常，精神状态佳。',
            hospital: '宠物医院分院', doctor: '王医生', record_date: offsetDays(-10), next_visit: offsetDays(80) },
          { type: 'deworm', title: '体内驱虫', description: '按时口服驱虫药，无不良反应。',
            hospital: '宠物医院分院', doctor: '王医生', record_date: offsetDays(-5), next_visit: offsetDays(85) }
        ];
        if (p.species === '猫咪') {
          records.push({ type: 'neuter', title: '绝育手术', description: '手术顺利，术后恢复良好，饮食正常。',
            hospital: '宠物医院总院', doctor: '李医生', record_date: offsetDays(-60), next_visit: null });
        }
        for (const r of records) {
          db.run(recSql, [petId, r.type, r.title, r.description, r.hospital, r.doctor, r.record_date, r.next_visit]);
        }
      }
    });
    console.log('Initial demo data inserted for', demo.length, 'pets');
  }

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/pets', (req, res) => {
    const rows = db.all('SELECT * FROM pets ORDER BY created_at DESC');
    res.json(rows.map(enrichPet));
  });

  app.get('/api/pets/:id', (req, res) => {
    const pet = db.get('SELECT * FROM pets WHERE id = ?', [Number(req.params.id)]);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    const records = db.all(
      'SELECT * FROM medical_records WHERE pet_id = ? ORDER BY record_date DESC',
      [Number(req.params.id)]
    );
    res.json({ pet: enrichPet(pet), records });
  });

  app.post('/api/pets', (req, res) => {
    const b = req.body || {};
    const info = db.run(
      'INSERT INTO pets (name, species, breed, age, avatar, status, weight, temperature, heart_rate, next_deworming, next_rabies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [b.name, b.species, b.breed || null, b.age || null, b.avatar || 'generic',
        b.status || 'healthy', b.weight || null, b.temperature || null,
        b.heart_rate || null, b.next_deworming || null, b.next_rabies || null]
    );
    res.status(201).json({ id: info.lastInsertRowid });
  });

  app.put('/api/pets/:id', (req, res) => {
    const id = Number(req.params.id);
    const existing = db.get('SELECT * FROM pets WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Pet not found' });
    const b = req.body || {};
    // 未提供的字段保持原值；显式 null/空字符串 视为清空调
    const pick = (key, incoming) => {
      if (incoming === undefined) return existing[key];
      if (incoming === '' || incoming === null) return null;
      return incoming;
    };
    const name = pick('name', b.name);
    const species = pick('species', b.species);
    const breed = pick('breed', b.breed);
    const age = pick('age', b.age);
    const weight = pick('weight', b.weight);
    const temperature = pick('temperature', b.temperature);
    const heart_rate = pick('heart_rate', b.heart_rate);
    const next_deworming = pick('next_deworming', b.next_deworming);
    const next_rabies = pick('next_rabies', b.next_rabies);
    if (!name || !species) return res.status(400).json({ error: 'name 和 species 不能为空' });
    db.run(
      'UPDATE pets SET name=?, species=?, breed=?, age=?, weight=?, temperature=?, heart_rate=?, next_deworming=?, next_rabies=? WHERE id=?',
      [name, species, breed, age, weight, temperature, heart_rate, next_deworming, next_rabies, id]
    );
    const updated = db.get('SELECT * FROM pets WHERE id = ?', [id]);
    res.json(updated);
  });

  app.delete('/api/pets/:id', (req, res) => {
    db.run('DELETE FROM medical_records WHERE pet_id = ?', [Number(req.params.id)]);
    db.run('DELETE FROM pets WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  });

  app.get('/api/push', (req, res) => {
    const rows = db.all(
      "SELECT pm.*, p.name as pet_name FROM push_messages pm LEFT JOIN pets p ON p.id = pm.pet_id ORDER BY pm.scheduled_at DESC LIMIT 50"
    );
    res.json(rows);
  });

  app.post('/api/scan-reminders', (req, res) => {
    const msgs = scanReminders();
    res.json({ generated: msgs.length, items: msgs });
  });

  cron.schedule('0 0 8 * * *', () => scanReminders());
  setTimeout(() => scanReminders(), 1500);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('Pet hospital records server running at http://localhost:' + PORT);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
