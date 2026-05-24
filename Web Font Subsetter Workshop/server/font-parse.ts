export type FontMeta = {
  format: 'TTF' | 'OTF' | 'WOFF2' | 'UNKNOWN';
  glyphCount: number;
  family: string;
  unitsPerEm: number;
  tables: Record<string, { offset: number; length: number; checksum: number }>;
  hasCmap: boolean;
  hasGlyf: boolean;
};

export function parseFontMeta(buffer: Buffer): FontMeta {
  const tables: Record<string, { offset: number; length: number; checksum: number }> = {};
  let glyphCount = 0;
  let family = 'Unknown';
  let unitsPerEm = 1000;

  try {
    if (buffer.length >= 12) {
      const dv = safeDataView(buffer);
      if (!dv) return makeDefault(buffer, tables, family, unitsPerEm);

      const numTables = Math.min(dv.getUint16(4), 50);
      for (let i = 0; i < numTables; i++) {
        const off = 12 + i * 16;
        if (off + 16 > buffer.length) break;

        const tag = String.fromCharCode(
          dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3),
        );
        const tableOffset = dv.getUint32(off + 8);
        const tableLength = dv.getUint32(off + 12);

        if (tableOffset + tableLength > buffer.length) continue;

        tables[tag] = {
          checksum: dv.getUint32(off + 4),
          offset: tableOffset,
          length: tableLength,
        };
      }

      if (tables['maxp'] && tables['maxp'].offset + 6 <= buffer.length) {
        glyphCount = dv.getUint16(tables['maxp'].offset + 4);
      }
      if (tables['head'] && tables['head'].offset + 18 <= buffer.length) {
        unitsPerEm = dv.getUint16(tables['head'].offset + 18);
      }
      if (tables['name']) {
        family = readNameRecord(buffer, tables['name'].offset, tables['name'].length) || family;
      }
    }
  } catch (e) {
    // ignore parsing errors
  }

  return makeDefault(buffer, tables, family, unitsPerEm, glyphCount);
}

function makeDefault(
  buffer: Buffer,
  tables: Record<string, { offset: number; length: number; checksum: number }>,
  family: string,
  unitsPerEm: number,
  glyphCount?: number,
): FontMeta {
  return {
    format: detectFormat(buffer),
    glyphCount: glyphCount || 0,
    family,
    unitsPerEm,
    tables,
    hasCmap: !!tables['cmap'],
    hasGlyf: !!tables['glyf'],
  };
}

function safeDataView(buf: Buffer): DataView | null {
  try {
    return new DataView(buf.buffer as ArrayBuffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
}

function detectFormat(buf: Buffer): 'TTF' | 'OTF' | 'WOFF2' | 'UNKNOWN' {
  if (buf.length < 4) return 'UNKNOWN';
  try {
    const sig = buf.readUInt32BE(0);
    if (sig === 0x774f4632) return 'WOFF2';
    if (sig === 0x00010000 || sig === 0x74727565) return 'TTF';
    if (sig === 0x4f54544f) return 'OTF';
  } catch {}
  return 'UNKNOWN';
}

function readNameRecord(buf: Buffer, tableOffset: number, tableLength: number): string | null {
  if (buf.length < tableOffset + 6) return null;
  const dv = safeDataView(buf);
  if (!dv) return null;

  const count = Math.min(dv.getUint16(tableOffset + 2), 100);
  const stringOffset = dv.getUint16(tableOffset + 4);

  for (let i = 0; i < count; i++) {
    const rec = tableOffset + 6 + i * 12;
    if (rec + 12 > buf.length) break;

    const platformId = dv.getUint16(rec);
    const nameId = dv.getUint16(rec + 6);
    const strLen = dv.getUint16(rec + 8);
    const strOff = dv.getUint16(rec + 10);
    const abs = tableOffset + stringOffset + strOff;

    if (abs + strLen > buf.length) continue;
    if (nameId !== 1) continue;

    try {
      if (platformId === 3) {
        let s = '';
        for (let j = 0; j < Math.min(strLen, 200); j += 2) {
          if (abs + j + 1 < buf.length) {
            s += String.fromCharCode(dv.getUint16(abs + j));
          }
        }
        if (s) return s;
      } else if (platformId === 1 || platformId === 0) {
        return buf.slice(abs, abs + Math.min(strLen, 100)).toString('latin1');
      }
    } catch {}
  }
  return null;
}

function readCmapFormat4(buf: Buffer, offset: number, bufLen: number): Map<number, number> {
  const dv = safeDataView(buf);
  if (!dv || offset + 16 > bufLen) return new Map();

  const segCount = Math.min(dv.getUint16(offset + 6) / 2, 65536);
  if (segCount <= 0 || segCount > 65536) return new Map();

  const endCodes = offset + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDelta = startCodes + segCount * 2;
  const idRangeOffset = idDelta + segCount * 2;

  if (idRangeOffset + segCount * 2 > bufLen) return new Map();

  const result = new Map<number, number>();
  for (let i = 0; i < segCount; i++) {
    const endCode = dv.getUint16(endCodes + i * 2);
    const startCode = dv.getUint16(startCodes + i * 2);
    const delta = dv.getInt16(idDelta + i * 2);
    const rangeOff = dv.getUint16(idRangeOffset + i * 2);

    if (endCode === 0xffff && startCode === 0xffff) break;
    if (startCode > endCode) continue;

    for (let c = startCode; c <= endCode; c++) {
      let gid = 0;
      if (rangeOff === 0) {
        gid = (c + delta) & 0xffff;
      } else {
        const glyphIndex = idRangeOffset + i * 2 + rangeOff + (c - startCode) * 2;
        if (glyphIndex + 1 < bufLen) {
          gid = dv.getUint16(glyphIndex);
          if (gid !== 0) gid = (gid + delta) & 0xffff;
        }
      }
      if (gid !== 0) result.set(c, gid);
    }
  }
  return result;
}

function readCmapFormat12(buf: Buffer, offset: number, bufLen: number): Map<number, number> {
  const dv = safeDataView(buf);
  if (!dv || offset + 16 > bufLen) return new Map();

  const nGroups = Math.min(dv.getUint32(offset + 12), 65536);
  if (nGroups <= 0 || nGroups > 65536) return new Map();

  const result = new Map<number, number>();
  for (let i = 0; i < nGroups; i++) {
    const g = offset + 16 + i * 12;
    if (g + 12 > bufLen) break;

    const start = dv.getUint32(g);
    const end = dv.getUint32(g + 4);
    const glyphId = dv.getUint32(g + 8);

    if (start > end) continue;

    for (let c = start; c <= end; c++) {
      result.set(c, glyphId + (c - start));
    }
  }
  return result;
}

export function readCmap(buf: Buffer): Map<number, number> {
  const dv = safeDataView(buf);
  if (!dv || buf.length < 4) return new Map();

  try {
    const numTables = Math.min(dv.getUint16(2), 50);
    for (let i = 0; i < numTables; i++) {
      const off = 4 + i * 8;
      if (off + 8 > buf.length) break;

      const platformId = dv.getUint16(off);
      const encodingId = dv.getUint16(off + 2);
      const tableOffset = dv.getUint32(off + 4);

      if (tableOffset + 4 > buf.length) continue;

      const format = dv.getUint16(tableOffset);

      if ((platformId === 0 || platformId === 3) && (encodingId === 0 || encodingId === 3 || encodingId === 4 || encodingId === 10)) {
        if (format === 4) return readCmapFormat4(buf, tableOffset, buf.length);
        if (format === 12) return readCmapFormat12(buf, tableOffset, buf.length);
      }
    }
  } catch {}

  return new Map();
}
