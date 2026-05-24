// JSON file-based persistence layer (drop-in replacement for sqlite storage.
// Uses JSON files under data/ to persist proofs, axioms, lemmas.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PROOF_FILE = path.join(DATA_DIR, 'proofs.json');
const AXIOM_FILE = path.join(DATA_DIR, 'axioms.json');
const LEMMA_FILE = path.join(DATA_DIR, 'lemmas.json');

function readJson(f, def) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch { return def; }
}

function writeJson(f, v) {
  fs.writeFileSync(f, JSON.stringify(v, null, 2));
}

function now() { return new Date().toISOString(); }

function loadProofs() {
  const list = readJson(PROOF_FILE, []);
  // ensure structure
  return list.map(p => ({
    id: p.id,
    name: p.name,
    goal: p.goal || '',
    description: p.description || '',
    created_at: p.created_at || now(),
    updated_at: p.updated_at || now()
  }));
}

function saveProofs(list) { writeJson(PROOF_FILE, list); }

function loadSteps(proofId) {
  const f = path.join(DATA_DIR, `proof_${proofId}.json`);
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch { return []; }
}

function saveSteps(proofId, steps) {
  writeJson(path.join(DATA_DIR, `proof_${proofId}.json`), steps);
}

export function listProofs() {
  return loadProofs().sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
}

export function getProof(id) {
  const list = loadProofs();
  const row = list.find(p => p.id === Number(id));
  if (!row) return null;
  const steps = loadSteps(Number(id));
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps: steps.map(s => ({
      index: s.index,
      formula: s.formula,
      justification: s.justification,
      premiseRefs: s.premiseRefs || []
    }))
  };
}

export function createProof({ name, goal = '', description = '' }) {
  const list = loadProofs();
  const newId = list.length ? Math.max(...list.map(p => p.id)) + 1 : 1;
  const proof = { id: newId, name, goal, description, created_at: now(), updated_at: now() };
  list.push(proof);
  saveProofs(list);
  saveSteps(newId, []);
  return getProof(newId);
}

export function updateProof(id, { name, goal, description }) {
  const list = loadProofs();
  const p = list.find(x => x.id === Number(id));
  if (!p) return null;
  p.name = name;
  p.goal = goal;
  p.description = description;
  p.updated_at = now();
  saveProofs(list);
  return getProof(id);
}

export function deleteProof(id) {
  const list = loadProofs().filter(p => p.id !== Number(id));
  saveProofs(list);
  const f = path.join(DATA_DIR, `proof_${id}.json`);
  try { fs.unlinkSync(f); } catch {}
}

export function saveStepsApi(proofId, steps) {
  saveSteps(Number(proofId), steps.map(s => ({
    index: s.index,
    formula: s.formula,
    justification: s.justification || '',
    premiseRefs: s.premiseRefs || []
  })));
  const list = loadProofs();
  const p = list.find(x => x.id === Number(proofId));
  if (p) { p.updated_at = now(); saveProofs(list); }
}

// Axioms
const DEFAULT_AXIOMS = readJson(AXIOM_FILE, null);

function saveAxiomFile() {}

export function listAxioms() {
  return readJson(AXIOM_FILE, []);
}

export function upsertAxiom({ id, name, formula, description = '', builtin = 0 }) {
  const list = readJson(AXIOM_FILE, []);
  const existing = list.find(a => a.id === id);
  if (existing) {
    existing.name = name; existing.formula = formula; existing.description = description;
  } else {
    list.push({ id, name, formula, builtin, description });
  }
  writeJson(AXIOM_FILE, list);
  return getAxiom(id);
}

export function getAxiom(id) {
  const list = readJson(AXIOM_FILE, []);
  return list.find(a => a.id === id) || null;
}

export function deleteAxiom(id) {
  const list = readJson(AXIOM_FILE, []).filter(a => a.id !== id);
  writeJson(AXIOM_FILE, list);
}

// Lemmas
export function listLemmas() { return readJson(LEMMA_FILE, []); }

export function upsertLemma({ id, name, formula, proof_id = null, description = '' }) {
  const list = readJson(LEMMA_FILE, []);
  const existing = list.find(l => l.id === id);
  if (existing) {
    existing.name = name; existing.formula = formula; existing.proof_id = proof_id; existing.description = description;
  } else {
    list.push({ id, name, formula, proof_id, description });
  }
  writeJson(LEMMA_FILE, list);
  return getLemma(id);
}

export function getLemma(id) {
  const list = readJson(LEMMA_FILE, []);
  return list.find(l => l.id === id) || null;
}

export function deleteLemma(id) {
  const list = readJson(LEMMA_FILE, []).filter(l => l.id !== id);
  writeJson(LEMMA_FILE, list);
}
