import { access, lstat, mkdir, open, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { agents, InputError } from './demo.mjs';

const execute = promisify(execFile);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const MAX_BYTES = 512 * 1024;
const blocked = /^(?:\.git|\.runtime|\.hermes|\.ssh|\.aws|\.codex|\.agents|node_modules|Library|Temp|obj|Logs|\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx|sqlite|db)|credentials.*|auth\.json|\.npmrc|\.netrc|\.gitconfig)$/i;
const identifier = /^[a-z][a-z0-9-]{0,49}$/;
const inside = (base, target) => { const relative = path.relative(base, target); return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)); };

export function makeProjects({ root, registryFile = path.join(root, '.runtime/projects.local.json') }) {
  async function entries() {
    let config;
    try { config = JSON.parse(await readFile(registryFile, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return []; throw new InputError('No se pudo leer el registro privado de proyectos.', 503); }
    if (!Array.isArray(config.projects)) throw new InputError('Registro de proyectos inválido.', 503);
    const ids = new Set();
    return config.projects.map(project => {
      if (!identifier.test(project.id) || project.id === 'studio' || ids.has(project.id)) throw new InputError('Identificador de proyecto inválido o duplicado.', 503);
      ids.add(project.id);
      return { ...project, agents: project.agents || agents.map(agent => agent.id) };
    });
  }
  async function resolve(projectId, agentId) {
    if (!agents.some(agent => agent.id === agentId)) throw new InputError('Agente no válido.');
    const project = (await entries()).find(item => item.id === projectId);
    if (!project?.enabled || !project.agents.includes(agentId)) throw new InputError('El agente aún no tiene acceso autorizado a este proyecto.', 403);
    if (!project.workspace || !path.isAbsolute(project.workspace)) throw new InputError('Falta un espacio de trabajo permitido.', 409);
    const workspace = await realpath(project.workspace);
    if (path.resolve(project.workspace).toLowerCase() !== workspace.toLowerCase() || (await lstat(project.workspace)).isSymbolicLink()) throw new InputError('La carpeta de trabajo no puede redirigir a otro destino.', 403);
    if (project.root && path.resolve(project.root).toLowerCase() === workspace.toLowerCase()) throw new InputError('Usa un worktree separado de la carpeta original.', 403);
    await access(workspace);
    return { ...project, workspace, permissions: project.permissions === 'read-write' ? 'read-write' : 'read' };
  }
  async function list() {
    return Promise.all((await entries()).map(async project => {
      let available = false;
      if (project.enabled) try { await resolve(project.id, project.agents[0]); available = true; } catch { /* Visible como no disponible. */ }
      return { id: project.id, name: project.name, root: project.root, workspace: project.workspace || null, baseCommit: project.baseCommit || null,
        sourceUncommittedEntries: project.sourceUncommittedEntries || 0, agents: project.agents, permissions: project.permissions === 'read-write' ? 'read-write' : 'read', enabled: Boolean(project.enabled), available };
    }));
  }
  async function scoped(projectId, agentId, {readOnly=false}={}) {
    const resolved = await resolve(projectId, agentId);
    const project = {...resolved,permissions:readOnly?'read':resolved.permissions};
    async function target(relative, { directory = false, missing = false } = {}) {
      if (typeof relative !== 'string' || relative.length > 500 || /[\\:\x00-\x1f]/.test(relative) || path.isAbsolute(relative)) throw new InputError('Usa una ruta relativa al proyecto.', 403);
      const parts = relative.split('/').filter(Boolean);
      if (parts.some(part => part === '..' || part === '.' || /[ .]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) || blocked.test(part))) throw new InputError('Ruta fuera del alcance o protegida.', 403);
      if (!parts.length && !directory) throw new InputError('Indica un archivo.');
      let current = project.workspace;
      for (let index = 0; index < parts.length; index++) {
        current = path.join(current, parts[index]);
        if (!inside(project.workspace, current)) throw new InputError('Ruta fuera del proyecto.', 403);
        let info;
        try { info = await lstat(current); } catch (error) { if (error.code === 'ENOENT' && missing && index === parts.length - 1) return current; throw error; }
        if (info.isSymbolicLink() || (!info.isDirectory() && info.nlink > 1) || !inside(project.workspace, await realpath(current))) throw new InputError('Enlaces y archivos compartidos no permitidos.', 403);
        if (index < parts.length - 1 && !info.isDirectory()) throw new InputError('La ruta no es un directorio.');
      }
      return current;
    }
    async function text(relative) {
      const file = await target(relative);
      const info = await lstat(file);
      if (!info.isFile() || info.size > MAX_BYTES) throw new InputError('Sólo archivos de texto de hasta 512 KB.');
      const bytes = await readFile(file);
      if (bytes.includes(0)) throw new InputError('No se leen archivos binarios.');
      let content;
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new InputError('El archivo no es UTF-8.'); }
      return { path: relative, content, sha256: hash(bytes) };
    }
    async function git(args) {
      const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' };
      for (const key of Object.keys(env)) if (/^GIT_(?:DIR|WORK_TREE|CONFIG_(?:COUNT|KEY_|VALUE_)|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|EXTERNAL_DIFF)/.test(key)) delete env[key];
      const { stdout } = await execute('git', ['--no-pager','--no-optional-locks','-c','core.fsmonitor=false','-c','diff.external=','-C',project.workspace,...args], { env, shell: false, windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 });
      return stdout;
    }
    return {
      info: () => ({ projectId, name: project.name, workspace: project.workspace, permissions: project.permissions, agentId }),
      async list(relative = '') { const directory = await target(relative, { directory: true }); const files = await readdir(directory, { withFileTypes: true }); return files.filter(entry => !blocked.test(entry.name) && !entry.isSymbolicLink()).slice(0, 250).map(entry => ({ name: entry.name, type: entry.isDirectory() ? 'directory' : 'file' })); },
      read: text,
      async write(relative, content, expectedSha256) {
        if (project.permissions !== 'read-write') throw new InputError('Este proyecto sólo permite lectura.', 403);
        if (typeof content !== 'string' || content.includes('\0') || Buffer.byteLength(content) > MAX_BYTES) throw new InputError('Contenido de texto inválido o demasiado grande.');
        if (expectedSha256 !== 'new' && !/^[a-f0-9]{64}$/.test(expectedSha256 || '')) throw new InputError('Lee primero el archivo y utiliza su sha256; usa new sólo para uno nuevo.', 409);
        const file = await target(relative, { missing: expectedSha256 === 'new' });
        let handle;
        if (expectedSha256 === 'new') handle = await open(file, 'wx');
        else {
          handle = await open(file, 'r+');
          try {
            const bytes = await handle.readFile();
            const stat = await handle.stat();
            if (hash(bytes) !== expectedSha256 || stat.nlink > 1 || !stat.isFile()) throw new InputError('El archivo cambió desde su lectura; vuelve a leerlo.', 409);
            const backup = path.join(root, '.runtime/project-backups', projectId, randomUUID());
            await mkdir(backup, { recursive: true });
            await writeFile(path.join(backup, 'original'), bytes, { flag: 'wx' });
            await writeFile(path.join(backup, 'record.local.json'), JSON.stringify({ path: relative, agentId, sha256: expectedSha256, at: new Date().toISOString() }));
          } catch (error) { await handle.close(); throw error; }
        }
        try { await handle.write(Buffer.from(content), 0, Buffer.byteLength(content), 0); await handle.truncate(Buffer.byteLength(content)); } finally { await handle.close(); }
        return { path: relative, sha256: hash(content), written: true };
      },
      async status() { return git(['status','--short','--untracked-files=normal','--ignore-submodules=all']); },
      async diff(relative) { await target(relative); return git(['diff','--no-ext-diff','--no-textconv','--ignore-submodules=all','--',relative]); },
    };
  }
  return { list, resolve, scoped, registryFile };
}
