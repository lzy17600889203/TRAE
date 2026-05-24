// Convert internal score representation <-> MusicXML (simplified).

const DUR_MAP = { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25 };

function scoreToMusicXML(score) {
  const { title = 'Untitled', key = { fifths: 0 }, time = { beats: 4, beatType: 4 }, voices = [], clefs = [] } = score;
  const divisions = 4;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${title}</work-title></work>
  <part-list>`;
  voices.forEach((_, i) => {
    xml += `
    <score-part id="P${i + 1}">
      <part-name>Voice ${i + 1}</part-name>
    </score-part>`;
  });
  xml += `
  </part-list>`;

  voices.forEach((v, vi) => {
    xml += `
  <part id="P${vi + 1}">`;
    const clef = clefs[vi] || 'treble';
    const clefSign = clef === 'bass' ? 'F' : 'G';
    const clefLine = clef === 'bass' ? 4 : 2;
    // one measure holding all notes (simplification)
    const measureNotes = v.notes.map((n, idx) => {
      const dur = Math.round((DUR_MAP[n.duration] || 1) * divisions);
      const alter = n.alter ? ` <alter>${n.alter === '#' ? 1 : n.alter === '##' ? 2 : n.alter === 'b' ? -1 : n.alter === 'bb' ? -2 : 0}</alter>` : '';
      return `
      <note>
        <pitch>
          <step>${n.step}</step>${alter}
          <octave>${n.octave}</octave>
        </pitch>
        <duration>${dur}</duration>
        <voice>${vi + 1}</voice>
        <type>${n.duration}</type>
      </note>`;
    }).join('');

    xml += `
    <measure number="1">
      <attributes>
        <divisions>${divisions}</divisions>
        <key><fifths>${key.fifths}</fifths></key>
        <time><beats>${time.beats}</beats><beat-type>${time.beatType}</beat-type></time>
        <clef><sign>${clefSign}</sign><line>${clefLine}</line></clef>
      </attributes>${measureNotes}
    </measure>
  </part>`;
  });
  xml += `
</score-partwise>`;
  return xml;
}

module.exports = { scoreToMusicXML };
