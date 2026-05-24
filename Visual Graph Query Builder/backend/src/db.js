import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildDatabase() {
  const db = new Database(path.join(__dirname, '..', 'graph.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      props TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS edges (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      type TEXT NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS c FROM nodes').get().c;
  if (count === 0) seed(db);
  return db;
}

function seed(db) {
  const insertNode = db.prepare(
    'INSERT INTO nodes (id, label, props) VALUES (?, ?, ?)'
  );
  const insertEdge = db.prepare(
    'INSERT INTO edges (id, source, target, type) VALUES (?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    const users = [
      ['u1', 'User', { name: 'Alice', age: 30, city: 'NYC' }],
      ['u2', 'User', { name: 'Bob', age: 28, city: 'NYC' }],
      ['u3', 'User', { name: 'Carol', age: 32, city: 'SF' }],
      ['u4', 'User', { name: 'Dan', age: 25, city: 'LA' }],
      ['u5', 'User', { name: 'Eve', age: 29, city: 'NYC' }],
      ['u6', 'User', { name: 'Frank', age: 40, city: 'Chicago' }],
      ['u7', 'User', { name: 'Grace', age: 22, city: 'Boston' }],
      ['u8', 'User', { name: 'Henry', age: 35, city: 'Seattle' }],
    ];
    users.forEach(([id, label, props]) =>
      insertNode.run(id, label, JSON.stringify(props))
    );

    const artists = [
      ['a1', 'Artist', { name: 'Leonardo', country: 'Italy' }],
      ['a2', 'Artist', { name: 'Michelangelo', country: 'Italy' }],
    ];
    artists.forEach(([id, label, props]) =>
      insertNode.run(id, label, JSON.stringify(props))
    );

    const works = [
      ['w1', 'Work', { name: 'MonaLisa', kind: 'painting', year: 1503 }],
      ['w2', 'Work', { name: 'LastSupper', kind: 'painting', year: 1495 }],
      ['w3', 'Work', { name: 'David', kind: 'sculpture', year: 1504 }],
    ];
    works.forEach(([id, label, props]) =>
      insertNode.run(id, label, JSON.stringify(props))
    );

    const items = [
      ['i1', 'Item', { name: 'A', value: 1 }],
      ['i2', 'Item', { name: 'B', value: 2 }],
      ['i3', 'Item', { name: 'C', value: 3 }],
      ['i4', 'Item', { name: 'D', value: 4 }],
    ];
    items.forEach(([id, label, props]) =>
      insertNode.run(id, label, JSON.stringify(props))
    );

    const chainNodes = Array.from({ length: 20 }, (_, i) => [
      `n${i + 1}`,
      'Node',
      { name: `N${i + 1}`, depth: i + 1 },
    ]);
    chainNodes.forEach(([id, label, props]) =>
      insertNode.run(id, label, JSON.stringify(props))
    );

    const edges = [
      ['e1', 'u1', 'u2', 'KNOWS'],
      ['e2', 'u2', 'u3', 'KNOWS'],
      ['e3', 'u2', 'u4', 'KNOWS'],
      ['e4', 'u1', 'u5', 'KNOWS'],
      ['e5', 'u5', 'u3', 'KNOWS'],
      ['e6', 'u3', 'u6', 'KNOWS'],
      ['e7', 'u6', 'u7', 'KNOWS'],
      ['e8', 'u4', 'u8', 'KNOWS'],
      ['e9', 'u1', 'u6', 'KNOWS'],

      ['ea1', 'a1', 'w1', 'CREATED'],
      ['ea2', 'a1', 'w2', 'CREATED'],
      ['ea3', 'a2', 'w3', 'CREATED'],

      ['ec1', 'i1', 'i2', 'REF'],
      ['ec2', 'i2', 'i3', 'REF'],
      ['ec3', 'i3', 'i1', 'REF'],
      ['ec4', 'i3', 'i4', 'REF'],
    ];
    for (let i = 0; i < chainNodes.length - 1; i++) {
      edges.push([
        `ch${i + 1}`,
        chainNodes[i][0],
        chainNodes[i + 1][0],
        'LINK',
      ]);
    }

    edges.forEach(([id, s, t, type]) => insertEdge.run(id, s, t, type));
  });

  tx();
}
