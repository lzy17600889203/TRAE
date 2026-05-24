// Preset scenes. Each scene is an object that the frontend can load verbatim.
// Scenes deliberately include the problematic conditions the user wants to observe:
//   - augmented melodic intervals unresolved
//   - hidden perfect intervals that slip past the rule engine
//   - voice crossing / overlap causing visual overlap
//   - key-signature change with stale accidentals display

const SCENES = {
  'two-voice-counterpoint': {
    id: 'two-voice-counterpoint',
    title: '二声部对位场景',
    key: { fifths: 0, mode: 'major' },
    time: { beats: 4, beatType: 4 },
    clefs: ['treble', 'bass'],
    roleOrder: [0, 1],
    voices: [
      {
        name: '高音声部',
        notes: [
          { step: 'C', octave: 5, alter: '', duration: 'quarter' },
          { step: 'B', octave: 4, alter: '', duration: 'quarter' },
          { step: 'A', octave: 4, alter: '', duration: 'quarter' },
          { step: 'G', octave: 4, alter: '', duration: 'quarter' },
          { step: 'F', octave: 4, alter: '', duration: 'quarter' },
          { step: 'E', octave: 4, alter: '', duration: 'quarter' },
          { step: 'D', octave: 4, alter: '', duration: 'quarter' },
          { step: 'C', octave: 4, alter: '', duration: 'quarter' }
        ]
      },
      {
        name: '低音声部',
        notes: [
          { step: 'C', octave: 3, alter: '', duration: 'quarter' },
          { step: 'G', octave: 3, alter: '', duration: 'quarter' },
          { step: 'C', octave: 3, alter: '', duration: 'quarter' },
          { step: 'E', octave: 3, alter: '', duration: 'quarter' },
          { step: 'F', octave: 3, alter: '', duration: 'quarter' },
          { step: 'C', octave: 3, alter: '', duration: 'quarter' },
          { step: 'G', octave: 3, alter: '', duration: 'quarter' },
          { step: 'C', octave: 3, alter: '', duration: 'quarter' }
        ]
      }
    ]
  },

  'chord-inversion': {
    id: 'chord-inversion',
    title: '和弦转位场景',
    key: { fifths: 0, mode: 'major' },
    time: { beats: 4, beatType: 4 },
    clefs: ['treble', 'treble', 'bass'],
    roleOrder: [0, 1, 2],
    voices: [
      {
        name: '高音',
        notes: [
          { step: 'C', octave: 5, alter: '', duration: 'half' },
          { step: 'D', octave: 5, alter: '', duration: 'half' },
          { step: 'E', octave: 5, alter: '', duration: 'half' },
          { step: 'C', octave: 5, alter: '', duration: 'half' }
        ]
      },
      {
        name: '中音',
        notes: [
          { step: 'G', octave: 4, alter: '', duration: 'half' },
          { step: 'B', octave: 4, alter: '', duration: 'half' },
          { step: 'A', octave: 4, alter: '', duration: 'half' },
          { step: 'E', octave: 4, alter: '', duration: 'half' }
        ]
      },
      {
        name: '低音',
        notes: [
          { step: 'E', octave: 3, alter: '', duration: 'half' },
          { step: 'G', octave: 3, alter: '', duration: 'half' },
          { step: 'C', octave: 3, alter: '', duration: 'half' },
          { step: 'C', octave: 3, alter: '', duration: 'half' }
        ]
      }
    ]
  },

  'sequence-development': {
    id: 'sequence-development',
    title: '模进发展场景',
    key: { fifths: 0, mode: 'major' },
    time: { beats: 4, beatType: 4 },
    clefs: ['treble', 'bass'],
    roleOrder: [0, 1],
    voices: [
      {
        name: '主题',
        notes: [
          { step: 'C', octave: 5, alter: '', duration: 'quarter' },
          { step: 'E', octave: 5, alter: '', duration: 'quarter' },
          { step: 'G', octave: 5, alter: '', duration: 'quarter' },
          { step: 'C', octave: 6, alter: '', duration: 'quarter' },
          { step: 'D', octave: 5, alter: '', duration: 'quarter' },
          { step: 'F', octave: 5, alter: '', duration: 'quarter' },
          { step: 'A', octave: 5, alter: '', duration: 'quarter' },
          { step: 'D', octave: 6, alter: '', duration: 'quarter' },
          { step: 'E', octave: 5, alter: '', duration: 'quarter' },
          { step: 'G', octave: 5, alter: '', duration: 'quarter' },
          { step: 'B', octave: 5, alter: '', duration: 'quarter' },
          { step: 'E', octave: 6, alter: '', duration: 'quarter' }
        ]
      },
      {
        name: '对题',
        notes: [
          { step: 'C', octave: 4, alter: '', duration: 'quarter' },
          { step: 'B', octave: 3, alter: '', duration: 'quarter' },
          { step: 'A', octave: 3, alter: '', duration: 'quarter' },
          { step: 'G', octave: 3, alter: '', duration: 'quarter' },
          { step: 'F', octave: 3, alter: '', duration: 'quarter' },
          { step: 'E', octave: 3, alter: '', duration: 'quarter' },
          { step: 'D', octave: 3, alter: '', duration: 'quarter' },
          { step: 'C', octave: 3, alter: '', duration: 'quarter' },
          { step: 'D', octave: 3, alter: '', duration: 'quarter' },
          { step: 'E', octave: 3, alter: '', duration: 'quarter' },
          { step: 'F', octave: 3, alter: '', duration: 'quarter' },
          { step: 'G', octave: 3, alter: '', duration: 'quarter' }
        ]
      }
    ]
  },

  'forbidden-progression': {
    id: 'forbidden-progression',
    title: '违规和声进行场景',
    key: { fifths: 0, mode: 'major' },
    time: { beats: 4, beatType: 4 },
    clefs: ['treble', 'treble', 'bass'],
    roleOrder: [0, 1, 2],
    // This scene deliberately contains:
    //   * parallel fifth & parallel octave
    //   * hidden perfect (outer voices similar motion into P5) — but with small leaps
    //     that slip through the engine's leap>=4 detection, exposing a false negative.
    //   * augmented melodic F->B (tritone = A4) in the middle voice
    //   * voice crossing between treble voices
    //   * a key change at the end that requires re-rendering accidentals
    voices: [
      {
        name: '高音',
        notes: [
          { step: 'C', octave: 5, alter: '', duration: 'quarter' },
          { step: 'D', octave: 5, alter: '', duration: 'quarter' },
          { step: 'C', octave: 5, alter: '', duration: 'quarter' },
          { step: 'E', octave: 5, alter: '', duration: 'quarter' },
          { step: 'G', octave: 5, alter: '', duration: 'quarter' },
          { step: 'F', octave: 5, alter: '', duration: 'quarter' },
          { step: 'E', octave: 5, alter: '', duration: 'quarter' },
          { step: 'D', octave: 5, alter: 'b', duration: 'quarter' }
        ]
      },
      {
        name: '中音',
        notes: [
          { step: 'G', octave: 4, alter: '', duration: 'quarter' },
          { step: 'A', octave: 4, alter: '', duration: 'quarter' },
          { step: 'B', octave: 4, alter: '', duration: 'quarter' },
          { step: 'F', octave: 4, alter: '', duration: 'quarter' },
          { step: 'B', octave: 4, alter: '', duration: 'quarter' },
          { step: 'A', octave: 4, alter: '', duration: 'quarter' },
          { step: 'G', octave: 4, alter: '', duration: 'quarter' },
          { step: 'F', octave: 4, alter: '#', duration: 'quarter' }
        ]
      },
      {
        name: '低音',
        notes: [
          { step: 'C', octave: 3, alter: '', duration: 'quarter' },
          { step: 'D', octave: 3, alter: '', duration: 'quarter' },
          { step: 'E', octave: 3, alter: '', duration: 'quarter' },
          { step: 'C', octave: 3, alter: '', duration: 'quarter' },
          { step: 'C', octave: 3, alter: '', duration: 'quarter' },
          { step: 'B', octave: 2, alter: '', duration: 'quarter' },
          { step: 'A', octave: 2, alter: '', duration: 'quarter' },
          { step: 'G', octave: 2, alter: '', duration: 'quarter' }
        ]
      }
    ],
    keyChangeAt: { index: 7, fifths: -1, mode: 'major' }
  }
};

module.exports = { SCENES };
