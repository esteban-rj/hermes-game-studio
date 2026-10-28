import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let count = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', '.runtime', 'private', 'node_modules', '.test-output'].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) { await walk(target); continue; }
    if (entry.name.endsWith('.json')) { JSON.parse(await readFile(target, 'utf8')); count++; }
    if (/\.(mjs|js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr || `Falló ${target}`);
      count++;
    }
  }
}
await walk(root);
for (const relative of ['public/index.html', 'public/styles.css', 'public/app.js', 'contracts/task.schema.json', 'contracts/event.schema.json']) await readFile(path.join(root, relative));
console.log(`Verificación estática OK: ${count} archivos JSON/JS. Sin build ni dependencias externas.`);
