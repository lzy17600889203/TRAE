import { db } from './db.js';
import { nanoid } from 'nanoid';

export function insertFont(font: Omit<any, 'created_at'>) {
  const id = font.id || nanoid();
  const data = Buffer.isBuffer(font.data) ? font.data : Buffer.from(font.data);
  db.prepare(
    `INSERT INTO fonts (id, name, size, format, glyph_count, family, units_per_em, tables, data)
     VALUES ($id, $name, $size, $format, $glyph_count, $family, $units_per_em, $tables, $data)`
  ).run({
    $id: id, $name: font.name, $size: font.size, $format: font.format,
    $glyph_count: font.glyph_count, $family: font.family,
    $units_per_em: font.units_per_em, $tables: font.tables, $data: data,
  });
  return db.prepare('SELECT * FROM fonts WHERE id = $id').get({ $id: id });
}

export function getFont(id: string) {
  return db.prepare('SELECT * FROM fonts WHERE id = $id').get({ $id: id });
}

export function listFonts() {
  return db.prepare(
    `SELECT id, name, size, format, glyph_count, family, units_per_em, tables, created_at FROM fonts ORDER BY created_at DESC`
  ).all();
}

export function insertTask(task: Omit<any, 'created_at'>) {
  const id = task.id || nanoid();
  const output = task.output ? (Buffer.isBuffer(task.output) ? task.output : Buffer.from(task.output)) : null;
  db.prepare(
    `INSERT INTO tasks (id, font_id, preset, charset, algorithm, status, progress, output_size, error, output)
     VALUES ($id, $font_id, $preset, $charset, $algorithm, $status, $progress, $output_size, $error, $output)`
  ).run({
    $id: id, $font_id: task.font_id, $preset: task.preset, $charset: task.charset,
    $algorithm: task.algorithm, $status: task.status, $progress: task.progress,
    $output_size: task.output_size, $error: task.error, $output: output,
  });
  return db.prepare('SELECT * FROM tasks WHERE id = $id').get({ $id: id });
}

export function updateTask(id: string, patch: any) {
  const keys = Object.keys(patch);
  const sets = keys.map(k => `${k} = $${k}`).join(', ');
  const params: any = { $id: id };
  for (const k of keys) {
    let v = patch[k];
    if (k === 'output' && v && !Buffer.isBuffer(v)) v = Buffer.from(v);
    params['$' + k] = v;
  }
  db.prepare(`UPDATE tasks SET ${sets} WHERE id = $id`).run(params);
}

export function getTask(id: string) {
  return db.prepare('SELECT * FROM tasks WHERE id = $id').get({ $id: id });
}

export function listTasks() {
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}
