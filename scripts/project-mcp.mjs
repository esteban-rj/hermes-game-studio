import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeProjects } from '../lib/projects.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [projectId, agentId] = process.argv.slice(2);
const readOnly=process.argv[4]==='read';
const projects = makeProjects({ root });
const string = { type: 'string' };
const schema = (properties = {}, required = []) => ({ type:'object', properties, required, additionalProperties:false });
export const tools = [
  { name:'project_info', description:'Proyecto, carpeta y permisos autorizados para esta sesión.', inputSchema:schema() },
  { name:'list_files', description:'Listar una carpeta relativa al worktree activo. No cruza enlaces ni lee secretos.', inputSchema:schema({ path:string }) },
  { name:'read_file', description:'Leer texto UTF-8 del proyecto y su sha256. Leer AGENTS.md/README antes de editar. Máximo 512 KB.', inputSchema:schema({ path:string }, ['path']) },
  { name:'write_file', description:'Crear o editar un archivo del proyecto. Padre debe existir. expectedSha256 debe ser el hash de read_file, o new si no existe. Guarda copia privada del original. Sin borrado.', inputSchema:schema({ path:string, content:string, expectedSha256:string }, ['path','content','expectedSha256']) },
  { name:'git_status', description:'Consultar cambios Git locales del worktree. No crea commits ni accede a la red.', inputSchema:schema() },
  { name:'git_diff', description:'Diff local de un archivo relativo. Sin comandos externos, textconv o red.', inputSchema:schema({ path:string }, ['path']) },
];
async function respond(message) {
  if (!Object.hasOwn(message, 'id')) return;
  let result;
  if (message.method === 'initialize') result = { protocolVersion: message.params?.protocolVersion || '2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:'studio-project-workspace', version:'1.0.0' } };
  else if (message.method === 'ping') result = {};
  else if (message.method === 'tools/list') result = { tools:readOnly?tools.filter(tool=>tool.name!=='write_file'):tools };
  else if (message.method === 'tools/call') {
    try {
      const { name, arguments: args = {} } = message.params;
      const tool = tools.find(tool => tool.name === name);
      if (!tool || (readOnly&&name==='write_file') || Object.keys(args).some(key => !Object.hasOwn(tool.inputSchema.properties,key)) || tool.inputSchema.required.some(key => typeof args[key] !== 'string')) throw new Error('Herramienta o argumentos no válidos.');
      const access = await projects.scoped(projectId, agentId,{readOnly});
      let value;
      if (name === 'project_info') value = access.info();
      if (name === 'list_files') value = await access.list(args.path);
      if (name === 'read_file') value = await access.read(args.path);
      if (name === 'write_file') value = await access.write(args.path,args.content,args.expectedSha256);
      if (name === 'git_status') value = await access.status();
      if (name === 'git_diff') value = await access.diff(args.path);
      result = { content:[{type:'text',text:JSON.stringify(value)}] };
    } catch (error) { result = { isError:true, content:[{type:'text',text:error.status ? error.message : 'No se pudo completar la operación dentro del proyecto. Comprueba la ruta y los permisos.'}] }; }
  } else { process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:message.id,error:{code:-32601,message:'Method not found'}})+'\n'); return; }
  process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:message.id,result})+'\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lines = createInterface({ input:process.stdin });
  // Las escrituras se serializan, incluso cuando el cliente agrupa tools/call.
  for await (const line of lines) {
    if (Buffer.byteLength(line) > 1024 * 1024) continue;
    try { await respond(JSON.parse(line)); } catch { /* Nunca enviar logs/secretos por stdout MCP. */ }
  }
}
