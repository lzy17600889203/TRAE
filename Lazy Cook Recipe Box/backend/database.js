'use strict';

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'recipes.db');
let SQL;

async function openDb() {
  if (!SQL) SQL = await initSqlJs();
  let buffer = null;
  if (fs.existsSync(dbPath)) {
    try {
      buffer = fs.readFileSync(dbPath);
    } catch (e) {
      buffer = null;
    }
  }
  const db = new SQL.Database(buffer);
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT,
      scene TEXT NOT NULL,
      base_servings INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      steps TEXT
    );
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      base_quantity REAL,
      unit TEXT,
      is_fuzzy INTEGER NOT NULL DEFAULT 0,
      fuzzy_label TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
  `);
  return db;
}

function saveDb(db) {
  const data = db.export();
  const buf = Buffer.from(data);
  fs.writeFileSync(dbPath, buf);
}

function run(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const cols = stmt.getColumnNames();
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push(row);
  }
  stmt.free();
  return rows;
}

function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows.length ? rows[0] : null;
}

async function listRecipesByScene(scene) {
  const db = await openDb();
  return queryAll(db, 'SELECT * FROM recipes WHERE scene = ? ORDER BY id', [scene]);
}

async function listAllRecipes() {
  const db = await openDb();
  return queryAll(db, 'SELECT * FROM recipes ORDER BY id');
}

async function getRecipeWithIngredients(id) {
  const db = await openDb();
  const recipe = queryOne(db, 'SELECT * FROM recipes WHERE id = ?', [id]);
  if (!recipe) return null;
  const ingredients = queryAll(
    db,
    'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id',
    [id]
  );
  return { ...recipe, ingredients };
}

async function addRecipe(recipe) {
  const db = await openDb();
  run(
    db,
    'INSERT INTO recipes (name, emoji, scene, base_servings, description, steps) VALUES (?, ?, ?, ?, ?, ?)',
    [
      recipe.name,
      recipe.emoji || '',
      recipe.scene,
      recipe.base_servings || 1,
      recipe.description || '',
      recipe.steps || '',
    ]
  );
  const info = queryOne(db, 'SELECT last_insert_rowid() AS id');
  const recipeId = info && info.id;
  for (const ing of recipe.ingredients || []) {
    run(
      db,
      'INSERT INTO ingredients (recipe_id, name, base_quantity, unit, is_fuzzy, fuzzy_label) VALUES (?, ?, ?, ?, ?, ?)',
      [
        recipeId,
        ing.name,
        ing.base_quantity != null ? Number(ing.base_quantity) : null,
        ing.unit || '',
        ing.is_fuzzy ? 1 : 0,
        ing.fuzzy_label || '',
      ]
    );
  }
  saveDb(db);
  return recipeId;
}

async function isEmpty() {
  const db = await openDb();
  const row = queryOne(db, 'SELECT COUNT(*) AS c FROM recipes');
  return row && row.c === 0;
}

module.exports = {
  listRecipesByScene,
  listAllRecipes,
  getRecipeWithIngredients,
  addRecipe,
  isEmpty,
};
