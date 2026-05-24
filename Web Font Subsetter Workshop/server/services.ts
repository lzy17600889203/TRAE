import { insertFont, getFont, listFonts, insertTask, updateTask, getTask, listTasks } from './repository.js';
import { parseFontMeta } from './font-parse.js';
import { subsetFont } from './font-subset.js';
import { nanoid } from 'nanoid';

export async function uploadFont(buffer: Buffer, name: string) {
  const meta = parseFontMeta(buffer);
  const row = insertFont({
    id: nanoid(),
    name,
    size: buffer.length,
    format: meta.format,
    glyph_count: meta.glyphCount,
    family: meta.family,
    units_per_em: meta.unitsPerEm,
    tables: JSON.stringify(meta.tables),
    data: buffer,
  } as any);
  return {
    id: row.id,
    name: row.name,
    size: row.size,
    format: row.format,
    glyphCount: row.glyph_count,
    family: row.family,
    unitsPerEm: row.units_per_em,
    tables: meta.tables,
  };
}

export function getFontInfo(id: string) {
  const f = getFont(id);
  if (!f) return null;
  return {
    id: f.id,
    name: f.name,
    size: f.size,
    format: f.format,
    glyphCount: f.glyph_count,
    family: f.family,
    unitsPerEm: f.units_per_em,
    tables: f.tables ? JSON.parse(f.tables) : {},
  };
}

export function allFonts() {
  return listFonts().map(f => ({
    id: f.id,
    name: f.name,
    size: f.size,
    format: f.format,
    glyphCount: f.glyph_count,
    family: f.family,
    unitsPerEm: f.units_per_em,
    created_at: f.created_at,
  }));
}

export async function processFont(
  fontId: string,
  opts: { charset: string; algorithm: string; checksum: boolean; preset?: string }
) {
  const font = getFont(fontId);
  if (!font) throw new Error('FONT_NOT_FOUND');

  const corruptCmap = opts.preset === 'corrupt';
  const scramble = opts.preset === 'corrupt';

  const task = insertTask({
    id: nanoid(),
    font_id: fontId,
    preset: opts.preset || null,
    charset: opts.charset || null,
    algorithm: opts.algorithm,
    status: 'queued',
    progress: 0,
    output_size: null,
    error: null,
    output: null,
  } as any);

  setImmediate(async () => {
    try {
      updateTask(task.id, { status: 'processing', progress: 10 });
      const result = await subsetFont(font.data, {
        charset: opts.charset,
        corruptChecksum: corruptCmap && !opts.checksum,
        scrambleMapping: scramble,
      });
      updateTask(task.id, { progress: 70 });
      updateTask(task.id, {
        status: 'done',
        progress: 100,
        output_size: result.outputBuffer.length,
        output: result.outputBuffer,
      });
    } catch (e: any) {
      updateTask(task.id, {
        status: 'failed',
        progress: 100,
        error: e.code || e.message || 'UNKNOWN',
      });
    }
  });

  return task.id;
}

export function allTasks() {
  return listTasks().map(t => ({
    id: t.id,
    font_id: t.font_id,
    preset: t.preset,
    charset: t.charset,
    algorithm: t.algorithm,
    status: t.status,
    progress: t.progress,
    output_size: t.output_size,
    error: t.error,
    created_at: t.created_at,
  }));
}

export function taskDetail(id: string) {
  const t = getTask(id);
  if (!t) return null;
  return {
    id: t.id,
    font_id: t.font_id,
    preset: t.preset,
    charset: t.charset,
    algorithm: t.algorithm,
    status: t.status,
    progress: t.progress,
    output_size: t.output_size,
    error: t.error,
    created_at: t.created_at,
    has_output: !!t.output,
  };
}

export function taskOutput(id: string) {
  const t = getTask(id);
  if (!t || !t.output) return null;
  return { data: t.output, fontName: `subset-${id}.ttf` };
}
