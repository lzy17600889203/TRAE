// Traditional harmony / counterpoint rule engine.
// Exposes analyze(score) -> list of {rule, severity, message, positions:[...], suggestions:[...]}

const STEP_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ALTER_SEMITONES = { '': 0, '#': 1, '##': 2, 'b': -1, 'bb': -2, 'n': 0 };

function pitchToMIDI(step, octave, alter = '') {
  return (octave + 1) * 12 + STEP_SEMITONES[step] + ALTER_SEMITONES[alter];
}

function intervalClass(midiA, midiB) {
  const diff = Math.abs(midiA - midiB) % 12;
  return diff > 6 ? 12 - diff : diff;
}

function simpleIntervalName(midiA, midiB) {
  const d = Math.abs(midiA - midiB) % 12;
  return d;
}

function isFifthOrOctave(midiA, midiB) {
  const mod = Math.abs(midiA - midiB) % 12;
  return mod === 0 || mod === 7;
}

function isParallel(m1_hi, m1_lo, m2_hi, m2_lo) {
  // Parallel motion: both voices move in same direction AND resulting interval is P5/P8
  const dir1 = Math.sign(m2_hi - m1_hi);
  const dir2 = Math.sign(m2_lo - m1_lo);
  if (dir1 === 0 || dir2 === 0) return false;
  if (dir1 !== dir2) return false;
  const modBefore = Math.abs(m1_hi - m1_lo) % 12;
  const modAfter = Math.abs(m2_hi - m2_lo) % 12;
  if (!(modAfter === 0 || modAfter === 7)) return false;
  // Avoid unison-to-unison trivial case counted as octave
  if (modAfter === 0 && (m2_hi - m2_lo) === 0) return false;
  return true;
}

// "Hidden" (concealed) fifth/octave: outer voices move in similar motion to a perfect interval.
// Typical strict rule: only flagged if an outer voice leaps.
function isHiddenPerfect(prevHi, prevLo, currHi, currLo) {
  const dirHi = Math.sign(currHi - prevHi);
  const dirLo = Math.sign(currLo - prevLo);
  if (dirHi === 0 || dirLo === 0) return false;
  if (dirHi !== dirLo) return false;
  const mod = Math.abs(currHi - currLo) % 12;
  if (!(mod === 0 || mod === 7)) return false;
  const leapHi = Math.abs(currHi - prevHi) >= 4;
  const leapLo = Math.abs(currLo - prevLo) >= 4;
  return leapHi || leapLo;
}

// Crossed voices: at a single moment, higher voice <= lower voice (when sorted by role).
function voiceCrossing(voicesAtT, roleOrder) {
  // roleOrder: array of voice indices in expected descending pitch order (e.g. [0=soprano,1=alto,...]).
  // Returns crossing pairs.
  const crosses = [];
  for (let i = 0; i < roleOrder.length - 1; i++) {
    for (let j = i + 1; j < roleOrder.length; j++) {
      const upper = voicesAtT[roleOrder[i]];
      const lower = voicesAtT[roleOrder[j]];
      if (upper != null && lower != null && upper <= lower) {
        crosses.push({ higher: roleOrder[i], lower: roleOrder[j] });
      }
    }
  }
  return crosses;
}

// Augmented melodic interval detection (e.g., A4 between F and B).
// Traditional counterpoint forbids most augmented melodic intervals.
function isAugmentedMelodic(m1, m2, keyAlterMap = {}) {
  if (m1 == null || m2 == null) return false;
  const d = Math.abs(m1 - m2);
  if (d === 0 || d === 1) return false;
  // Count semitones and diatonic steps using chromatic delta alone:
  // augmented intervals: 6 (A4), 8 (A5), 10 (A6), 13 (A9), etc.
  // Simpler heuristic: skip; we rely on explicit accidental detection via musicxml.
  return false;
}

function detectAugmentedFromAccidentals(prevNote, currNote) {
  if (!prevNote || !currNote) return false;
  const a = prevNote.alter || '';
  const b = currNote.alter || '';
  const p1 = pitchToMIDI(prevNote.step, prevNote.octave, a);
  const p2 = pitchToMIDI(currNote.step, currNote.octave, b);
  const d = Math.abs(p1 - p2);
  // Common augmented melodic forbidden in strict counterpoint:
  const augmentedPatterns = [6, 8, 10, 13, 15];
  return augmentedPatterns.includes(d);
}

// Core analyzer
function analyze(score) {
  const { voices, measures, key = { fifths: 0 }, roleOrder = [0, 1] } = score;
  const issues = [];

  const maxLen = Math.max(...voices.map((v) => v.notes.length));

  // Parallel & hidden detection: voice pairs
  for (let vA = 0; vA < voices.length; vA++) {
    for (let vB = vA + 1; vB < voices.length; vB++) {
      const notesA = voices[vA].notes;
      const notesB = voices[vB].notes;
      for (let i = 1; i < Math.min(notesA.length, notesB.length); i++) {
        const a1 = notesA[i - 1], a2 = notesA[i];
        const b1 = notesB[i - 1], b2 = notesB[i];
        if (!a1 || !a2 || !b1 || !b2) continue;
        const mA1 = pitchToMIDI(a1.step, a1.octave, a1.alter || '');
        const mA2 = pitchToMIDI(a2.step, a2.octave, a2.alter || '');
        const mB1 = pitchToMIDI(b1.step, b1.octave, b1.alter || '');
        const mB2 = pitchToMIDI(b2.step, b2.octave, b2.alter || '');

        const hi1 = Math.max(mA1, mB1), lo1 = Math.min(mA1, mB1);
        const hi2 = Math.max(mA2, mB2), lo2 = Math.min(mA2, mB2);

        if (isParallel(hi1, lo1, hi2, lo2)) {
          issues.push({
            rule: 'parallel-perfect',
            severity: 'error',
            message: `平行${(hi2 - lo2) % 12 === 0 ? '八度' : '五度'}：声部${vA}与声部${vB}同向进入纯${(hi2 - lo2) % 12 === 0 ? '八' : '五'}度`,
            positions: [{ voice: vA, index: i }, { voice: vB, index: i }],
            suggestions: ['改为反向或斜向进行', '将其中一个声部改为三度/六度解决']
          });
        } else if (isHiddenPerfect(hi1, lo1, hi2, lo2)) {
          issues.push({
            rule: 'hidden-perfect',
            severity: 'warning',
            message: `隐伏${(hi2 - lo2) % 12 === 0 ? '八度' : '五度'}：外声部类似方向+跳进进入纯${(hi2 - lo2) % 12 === 0 ? '八' : '五'}度`,
            positions: [{ voice: vA, index: i }, { voice: vB, index: i }],
            suggestions: ['将跳进改为级进', '改变其中一个外声部的方向']
          });
        }
      }
    }
  }

  // Voice crossing at each time step
  for (let i = 0; i < maxLen; i++) {
    const atT = voices.map((v) => {
      const n = v.notes[i];
      if (!n) return null;
      return pitchToMIDI(n.step, n.octave, n.alter || '');
    });
    const crosses = voiceCrossing(atT, roleOrder);
    crosses.forEach((c) => {
      issues.push({
        rule: 'voice-crossing',
        severity: 'error',
        message: `声部交叉：声部${c.higher}低于声部${c.lower}`,
        positions: [{ voice: c.higher, index: i }, { voice: c.lower, index: i }],
        suggestions: ['交换两个声部的音高', '调整其中一个声部的旋律线']
      });
    });
  }

  // Augmented melodic
  voices.forEach((v, vi) => {
    for (let i = 1; i < v.notes.length; i++) {
      if (detectAugmentedFromAccidentals(v.notes[i - 1], v.notes[i])) {
        issues.push({
          rule: 'augmented-melodic',
          severity: 'error',
          message: `增音程未解决：声部${vi}出现增音程进行`,
          positions: [{ voice: vi, index: i - 1 }, { voice: vi, index: i }],
          suggestions: ['将增音程改为减音程或自然音程', '通过等音改写']
        });
      }
    }
  });

  // Rule engine intentionally has a known gap: it does NOT detect voice overlap
  // when voices have equal pitch at the same time step (unison) — only strict crossing.
  // Another known gap: hidden perfect detection only triggers when one voice leaps
  // by >=4 semitones, so a "small-leap + step" scenario slips through.

  return issues;
}

module.exports = { analyze, pitchToMIDI };
