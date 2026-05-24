import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;
const outDir = path.join(projectRoot, 'dist');

if (existsSync(outDir)) rmSync(outDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

cpSync(path.join(projectRoot, 'src', 'index.html'), path.join(outDir, 'index.html'));
cpSync(path.join(projectRoot, 'src', 'styles.css'), path.join(outDir, 'styles.css'));
cpSync(path.join(projectRoot, 'src', 'app.js'), path.join(outDir, 'app.js'));

console.log('Build complete →', outDir);
