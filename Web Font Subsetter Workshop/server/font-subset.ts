import { readCmap } from './font-parse.js';

export type SubsetOptions = {
  charset: string;
  corruptChecksum?: boolean;
  scrambleMapping?: boolean;
  omitGlyphs?: boolean;
};

export type SubsetResult = {
  outputBuffer: Buffer;
  glyphCount: number;
  originalGlyphCount: number;
  warning?: string;
};

export async function subsetFont(input: Buffer, opts: SubsetOptions): Promise<SubsetResult> {
  if (!opts.charset || opts.charset.trim().length === 0) {
    const err: any = new Error('EMPTY_CHARSET');
    err.code = 'EMPTY_CHARSET';
    throw err;
  }

  if (input.length > 8 * 1024 * 1024) {
    const err: any = new Error('OOM: 字体文件过大 (>8MB)，内存溢出');
    err.code = 'OOM';
    throw err;
  }

  const cmap = readCmap(input);
  const codePoints: number[] = [];
  const seen = new Set<number>();
  for (const ch of opts.charset) {
    const cp = ch.codePointAt(0)!;
    if (!seen.has(cp)) {
      seen.add(cp);
      codePoints.push(cp);
    }
  }

  let opentype: any;
  try {
    opentype = await import('opentype.js');
  } catch {
    const err: any = new Error('OPENTYPE_NOT_AVAILABLE');
    err.code = 'OPENTYPE_NOT_AVAILABLE';
    throw err;
  }

  let font: any;
  try {
    const arrayBuffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    font = opentype.parse(arrayBuffer);
  } catch (e) {
    const err: any = new Error('PARSE_ERROR: 字体解析失败');
    err.code = 'PARSE_ERROR';
    err.cause = e;
    throw err;
  }

  const glyphs: any[] = [];
  try {
    const notdef = font.glyphs.get(0);
    if (notdef) glyphs.push(notdef);
  } catch {}

  const gidToIndex = new Map<number, number>();
  let nextIndex = 1;
  let originalGlyphCount = 0;

  try {
    originalGlyphCount = font.glyphs.length || 0;
  } catch {}

  for (const cp of codePoints) {
    let gid = cmap.get(cp);
    if (opts.scrambleMapping && gid) {
      gid = (gid + 1) % Math.max(originalGlyphCount, 2);
    }
    if (gid && gid !== 0) {
      if (!gidToIndex.has(gid)) {
        try {
          const glyph = font.glyphs.get(gid);
          if (glyph && !opts.omitGlyphs) {
            glyphs.push(glyph);
            gidToIndex.set(gid, nextIndex++);
          } else if (opts.omitGlyphs) {
            gidToIndex.set(gid, 0);
          }
        } catch {}
      }
    }
  }

  let newFont: any;
  try {
    newFont = new opentype.Font({
      familyName: font.names?.fontFamily?.en || 'Subsetted',
      styleName: font.names?.fontSubfamily?.en || 'Regular',
      unitsPerEm: font.unitsPerEm || 1000,
      ascender: font.ascender || 800,
      descender: font.descender || -200,
      glyphs,
    });
  } catch (e) {
    const err: any = new Error('FONT_CREATE_ERROR');
    err.code = 'FONT_CREATE_ERROR';
    throw err;
  }

  let outBuffer: ArrayBuffer;
  try {
    outBuffer = newFont.toArrayBuffer();
  } catch (e) {
    const err: any = new Error('GEN_ERROR: 字体生成失败');
    err.code = 'GEN_ERROR';
    throw err;
  }

  let output: Buffer;
  try {
    output = Buffer.from(new Uint8Array(outBuffer));
  } catch {
    const err: any = new Error('BUFFER_CONVERT_ERROR');
    err.code = 'BUFFER_CONVERT_ERROR';
    throw err;
  }

  if (opts.corruptChecksum) {
    try {
      corruptChecksums(output);
    } catch {}
  }

  return {
    outputBuffer: output,
    glyphCount: glyphs.length,
    originalGlyphCount,
  };
}

function corruptChecksums(buf: Buffer): void {
  try {
    const dv = new DataView(buf.buffer as ArrayBuffer, buf.byteOffset, buf.byteLength);
    const numTables = dv.getUint16(4);
    for (let i = 0; i < numTables; i++) {
      const off = 12 + i * 16;
      const orig = dv.getUint32(off + 4);
      dv.setUint32(off + 4, orig ^ 0xdeadbeef);
    }
  } catch {}
}

export async function mergeFonts(inputs: Buffer[]): Promise<Buffer> {
  const merged = inputs[0];
  if (!merged) throw new Error('NO_FONT');
  return merged;
}
