let db;

function setDb(_db) { db = _db; }

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function scanReminders() {
  if (!db) return [];
  const pets = db.all('SELECT * FROM pets');
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const generated = [];

  for (const pet of pets) {
    const pushCount = (kind) => {
      const rows = db.all(
        "SELECT COUNT(*) as c FROM push_messages WHERE pet_id = ? AND kind = ? AND date(scheduled_at) = date('now')",
        [pet.id, kind]
      );
      return rows[0].c;
    };

    const dewormDays = daysUntil(pet.next_deworming);
    if (dewormDays !== Infinity && dewormDays >= 0 && dewormDays <= 7) {
      if (pushCount('deworm') === 0) {
        const title = dewormDays === 0 ? '驱虫日提醒' : '还有 ' + dewormDays + ' 天驱虫';
        db.run(
          'INSERT INTO push_messages (pet_id, title, body, kind, scheduled_at, "read") VALUES (?, ?, ?, ?, ?, 0)',
          [pet.id, title, pet.name + ' 即将到驱虫时间，别忘了带它去宠物医院哦。', 'deworm', now]
        );
        generated.push({ pet: pet.name, kind: 'deworm', days: dewormDays });
      }
    }

    const rabiesDays = daysUntil(pet.next_rabies);
    if (rabiesDays !== Infinity && rabiesDays >= 0 && rabiesDays <= 30) {
      if (pushCount('rabies') === 0) {
        const title = rabiesDays === 0 ? '狂犬疫苗到期！' : '狂犬疫苗将在 ' + rabiesDays + ' 天内到期';
        db.run(
          'INSERT INTO push_messages (pet_id, title, body, kind, scheduled_at, "read") VALUES (?, ?, ?, ?, ?, 0)',
          [pet.id, title, pet.name + ' 的狂犬疫苗即将过期，请尽快安排补种。', 'rabies', now]
        );
        generated.push({ pet: pet.name, kind: 'rabies', days: rabiesDays });
      }
    }
  }

  console.log('[扫描提醒] ' + new Date().toLocaleString() + ' 生成 ' + generated.length + ' 条消息');
  return generated;
}

function enrichPet(pet) {
  return {
    ...pet,
    deworm_days: daysUntil(pet.next_deworming),
    rabies_days: daysUntil(pet.next_rabies)
  };
}

module.exports = { scanReminders, enrichPet, daysUntil, setDb };
