import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveModel } from '../scripts/resolve-model.mjs';

export async function prepareProjectProfile({ root, home, project, agent, readOnly=false }) {
  const name = `office-${readOnly?'voice-':''}${project.id}-${agent.id}`;
  const directory = path.join(home, 'profiles', name);
  const route = resolveModel({agent:agent.id});
  const marker = path.join(directory, '.office-project.local.json');
  try {
    const previous = JSON.parse(await readFile(marker,'utf8'));
    if (previous.workspace !== project.workspace || previous.projectId !== project.id || previous.agentId !== agent.id) throw new Error('El perfil existente pertenece a otro ámbito. Se conserva sin cambios.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(directory); // No sobrescribir perfiles existentes sin nuestra marca.
    await writeFile(marker, JSON.stringify({projectId:project.id,agentId:agent.id,workspace:project.workspace}));
    await mkdir(path.join(directory,'memories'));
    for (const seed of ['MEMORY.md','USER.md']) await writeFile(path.join(directory,'memories',seed), await readFile(path.join(root,'hermes/memory-seeds',seed)));
  }
  let config = await readFile(path.join(root,'hermes/config.base.yaml'),'utf8');
  config = config.replace('cli: [todo, memory]','cli: [todo, memory, workspace]').replace('max_turns: 4','max_turns: 8');
  config += `\nmodel:\n  provider: openai-codex\n  default: ${route.model}\n  openai_runtime: auto\nfallback_providers: []\n`;
  config += 'auxiliary:\n' + ['title_generation','compression','vision','goal_judge','background_review','curator'].map(key => `  ${key}:\n    provider: openai-codex\n    model: ${route.model}\n`).join('');
  config += `mcp_servers:\n  workspace:\n    command: ${JSON.stringify(process.execPath)}\n    args: ${JSON.stringify([path.join(root,'scripts/project-mcp.mjs'),project.id,agent.id,...(readOnly?['read']:[])])}\n    timeout: 20\n    tools:\n      resources: false\n      prompts: false\nterminal:\n  cwd: ${JSON.stringify(project.workspace)}\n`;
  await writeFile(path.join(directory,'config.yaml'), config);
  const soul = await readFile(path.join(root,'hermes/profiles',agent.id,'SOUL.md'),'utf8');
  await writeFile(path.join(directory,'SOUL.md'), soul + `\n\n## Proyecto de esta sesión\nprojectId: ${project.id}\nNombre: ${project.name}\nCarpeta permitida: ${project.workspace}\nHerramientas MCP workspace: project_info, list_files, read_file, write_file, git_status, git_diff. No hay terminal ni red. Lee AGENTS.md y README si existen, y usa las herramientas para verificar el estado real. Edita sólo a petición del usuario; conserva cambios ajenos. Lee primero cada archivo y usa su sha256 para editar. No afirmar builds ni pruebas sin ejecutarlos. No puedes ejecutar compiladores desde esta conexión. No accedas a otros proyectos ni guardes sus detalles en esta memoria.\n`);
  if(readOnly)await writeFile(path.join(directory,'SOUL.md'),(await readFile(path.join(directory,'SOUL.md'),'utf8'))+'\nEsta conexión es un diálogo de voz, sólo lectura. No tienes write_file ni terminal. Responde brevemente, sin bloques de código; las propuestas de edición se revisan por texto.\n');
  return name;
}
