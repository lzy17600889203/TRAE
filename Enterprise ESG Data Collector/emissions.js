const path = require('path');

const FACTORS = {
  electricity: 0.5810,
  water: 0.910,
  businessTravelAir: 0.255,
  businessTravelRail: 0.041,
  businessTravelRoad: 0.192,
  wasteHazardous: 1.357,
  wasteUnclassified: 0.408,
  paper: 0.021,
};

const ANOMALY_THRESHOLDS = {
  wasteUnclassified: 5000,
  electricity: 500000,
  businessTravelAir: 100000,
};

function calculateEmissions(data) {
  const breakdown = {};
  let total = 0;

  for (const key of Object.keys(FACTORS)) {
    const value = Number(data[key]) || 0;
    const emission = value * FACTORS[key];
    breakdown[key] = Number(emission.toFixed(4));
    total += emission;
  }

  return {
    total: Number(total.toFixed(2)),
    breakdown,
    factors: FACTORS,
  };
}

function detectAnomalies(data) {
  const anomalies = {};
  for (const key of Object.keys(ANOMALY_THRESHOLDS)) {
    const value = Number(data[key]) || 0;
    if (value > ANOMALY_THRESHOLDS[key]) {
      anomalies[key] = {
        value,
        threshold: ANOMALY_THRESHOLDS[key],
      };
    }
  }
  return anomalies;
}

function classifyCompany(emissionTotal) {
  if (emissionTotal < 1000) return 'excellent';
  if (emissionTotal < 10000) return 'normal';
  return 'warning';
}

module.exports = {
  calculateEmissions,
  detectAnomalies,
  classifyCompany,
  FACTORS,
  ANOMALY_THRESHOLDS,
};
