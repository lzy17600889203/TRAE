const TRANSPORT_FACTOR = {
  walk: { label: '步行', co2PerKm: 0, scorePerKm: 2 },
  bike: { label: '骑车', co2PerKm: 0, scorePerKm: 1.5 },
  bus: { label: '公交', co2PerKm: 0.08, scorePerKm: 0.8 },
  subway: { label: '地铁', co2PerKm: 0.05, scorePerKm: 0.9 },
  car: { label: '开车', co2PerKm: 0.21, scorePerKm: 0 },
  plane: { label: '飞机', co2PerKm: 0.25, scorePerKm: 0 }
};

const DIET_FACTOR = {
  vegan: { label: '纯素', co2PerMeal: 1.0, score: 3 },
  vegetarian: { label: '素食', co2PerMeal: 1.8, score: 2 },
  mixed: { label: '混合', co2PerMeal: 3.5, score: 1 },
  meat: { label: '肉类为主', co2PerMeal: 6.5, score: 0 }
};

const ELECTRICITY_CO2_PER_KWH = 0.5;

function calcCarbon({ transport, transport_km, diet, electricity_kwh }) {
  const km = Number(transport_km) || 0;
  const kwh = Number(electricity_kwh) || 0;
  let co2 = 0;
  let score = 0;
  const breakdown = [];

  if (transport && TRANSPORT_FACTOR[transport]) {
    const f = TRANSPORT_FACTOR[transport];
    co2 += f.co2PerKm * km;
    score += f.scorePerKm * km;
    breakdown.push({ type: 'transport', label: f.label, co2: f.co2PerKm * km, score: f.scorePerKm * km });
  }
  if (diet && DIET_FACTOR[diet]) {
    const f = DIET_FACTOR[diet];
    co2 += f.co2PerMeal;
    score += f.score;
    breakdown.push({ type: 'diet', label: f.label, co2: f.co2PerMeal, score: f.score });
  }
  if (kwh > 0) {
    co2 += ELECTRICITY_CO2_PER_KWH * kwh;
    score += Math.max(0, 10 - kwh);
    breakdown.push({ type: 'electricity', label: '用电', co2: ELECTRICITY_CO2_PER_KWH * kwh, score: Math.max(0, 10 - kwh) });
  }

  const delta = score - co2 * 2;
  return {
    co2: +co2.toFixed(2),
    score: +score.toFixed(2),
    delta: +delta.toFixed(2),
    breakdown
  };
}

function isGreenTransport(t) {
  return t && ['walk', 'bike', 'bus', 'subway'].includes(t);
}

function buildSummary(rows) {
  if (!rows || rows.length === 0) {
    return {
      total_entries: 0,
      total_co2: 0,
      total_score: 0,
      total_delta: 0,
      green_streak_days: 0,
      golden_fruit_ready: false,
      earth_health: 50,
      status: 'empty',
      recent7: [],
      timeline: [],
      all_transports: []
    };
  }

  let totalCo2 = 0;
  let totalScore = 0;
  let totalDelta = 0;

  const byDate = new Map();
  for (const row of rows) {
    const d = Number(row.carbon_delta);
    if (d > 0) totalScore += d;
    else totalCo2 += -d;
    totalDelta += d;

    if (!byDate.has(row.date)) {
      byDate.set(row.date, { transports: new Set(), delta: 0 });
    }
    const info = byDate.get(row.date);
    if (row.transport) info.transports.add(row.transport);
    info.delta += d;
  }

  const sortedDates = [...byDate.keys()].sort();

  let streak = 0;
  let maxStreak = 0;
  const recent7 = [];

  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const date = sortedDates[i];
    const info = byDate.get(date);
    const transports = [...info.transports];
    const hasGreen = transports.some(isGreenTransport);
    const hasBad = transports.some((t) => !isGreenTransport(t));
    const isGreen = hasGreen && !hasBad && info.delta > 0;

    if (isGreen) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }

    recent7.push({
      date,
      delta: +info.delta.toFixed(2),
      isGreen,
      transports
    });
    if (recent7.length >= 7) break;
  }
  recent7.reverse();

  const timeline = sortedDates.slice(-30).map((date) => {
    const info = byDate.get(date);
    return {
      date,
      delta: +info.delta.toFixed(2),
      transports: [...info.transports]
    };
  });

  let health = 50 + totalDelta * 0.8;
  if (totalDelta < 0) health = 50 + totalDelta * 2;
  health = Math.max(0, Math.min(100, health));

  let status = 'normal';
  if (health >= 80) status = 'guardian';
  else if (health <= 25) status = 'warning';

  return {
    total_entries: rows.length,
    total_co2: +totalCo2.toFixed(2),
    total_score: +totalScore.toFixed(2),
    total_delta: +totalDelta.toFixed(2),
    green_streak_days: streak,
    max_green_streak: maxStreak,
    golden_fruit_ready: streak >= 7,
    earth_health: +health.toFixed(1),
    status,
    recent7,
    timeline,
    all_transports: [...new Set(rows.map((r) => r.transport).filter(Boolean))]
  };
}

module.exports = { calcCarbon, buildSummary, TRANSPORT_FACTOR, DIET_FACTOR };
