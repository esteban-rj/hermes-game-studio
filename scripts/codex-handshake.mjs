// Diagnóstico opt-in: sólo initialize/initialized. No thread/start ni turn/start.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const executable = process.argv[2] || 'codex';
const doctorHome = fileURLToPath(new URL('../.runtime/codex-doctor/', import.meta.url));
await mkdir(doctorHome, { recursive: true });
const child = spawn(executable, ['app-server'], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, CODEX_HOME: path.resolve(doctorHome) } });
let settled = false;
const finish = (code, message) => {
  if (settled) return;
  settled = true;
  clearTimeout(timer);
  console.log(message);
  child.stdin.end();
  child.kill();
  process.exitCode = code;
};
const timer = setTimeout(() => finish(1, 'Handshake no confirmado en 15 s; no se inició ningún turn.'), 15000);
child.on('error', error => finish(1, `No se pudo iniciar Codex (${error.code || 'error'}).`));
child.on('exit', () => { if (!settled) finish(1, 'Codex terminó antes de confirmar initialize.'); });
child.stderr.on('data', () => {}); // No imprimir diagnósticos que puedan incluir datos de la cuenta.
const lines = createInterface({ input: child.stdout });
lines.on('line', line => {
  let message;
  try { message = JSON.parse(line); } catch { return; }
  if (message.id !== 1) return;
  if (message.error) return finish(1, 'Codex rechazó initialize; consultar la versión instalada.');
  child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
  finish(0, 'Codex App Server: initialize confirmado. Sin thread, turn, modelo ni inferencia.');
});
child.stdin.on('error', () => {});
child.stdin.write(JSON.stringify({ method: 'initialize', id: 1, params: { clientInfo: { name: 'hermes_game_studio_doctor', title: 'Hermes Game Studio Doctor', version: '0.1.0' } } }) + '\n');
