import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { makeProjects } from '../lib/projects.mjs';
import { makeHermes } from '../lib/hermes.mjs';
import { roomMarkup, CABINET } from '../public/vector-room.js';
import { walkable, findPath } from '../public/navigation.js';

async function fixture() {
  const root=await mkdtemp(path.join(tmpdir(),'studio-access-'));
  const workspace=path.join(root,'workspace');await mkdir(workspace);
  const registryFile=path.join(root,'projects.local.json');
  const config={projects:[{id:'juego-a',name:'Proyecto de prueba',root:path.join(root,'original'),workspace,enabled:true,permissions:'read-write',agents:['atlas','pixel']}]};
  await writeFile(registryFile,JSON.stringify(config));
  await writeFile(path.join(workspace,'README.md'),'Estado original');
  return {root,workspace,registryFile,config,projects:makeProjects({root,registryFile})};
}
test('acceso: rutas externas, credenciales, enlaces y agentes no autorizados se rechazan',async()=>{
  const f=await fixture();const access=await f.projects.scoped('juego-a','pixel');
  for(const file of ['../secret.txt','/secret.txt','C:/secret.txt','a\\b','x:stream','.git/config','.env','.env.local','.ssh/key','Library/cache','foo/../README.md','foo./x'])await assert.rejects(access.read(file));
  await assert.rejects(f.projects.resolve('juego-a','prisma'),/autorizado/);
  await writeFile(path.join(f.root,'outside.txt'),'no compartir');
  try {await symlink(path.join(f.root,'outside.txt'),path.join(f.workspace,'link.txt'));await assert.rejects(access.read('link.txt'),/Enlaces/);}catch(error){if(error.code!=='EPERM')throw error;}
  f.config.projects[0].enabled=false;await writeFile(f.registryFile,JSON.stringify(f.config));
  await assert.rejects(f.projects.scoped('juego-a','pixel'),/autorizado/);
});
test('ediciones: hash obligatorio, copia del original, conflictos y sólo lectura',async()=>{
  const f=await fixture();const access=await f.projects.scoped('juego-a','pixel');const original=await access.read('README.md');
  await assert.rejects(access.write('README.md','Cambio','new'));
  await assert.rejects(access.write('README.md','Cambio','a'.repeat(64)),/cambió/);
  await access.write('README.md','Cambio autorizado',original.sha256);
  assert.equal((await access.read('README.md')).content,'Cambio autorizado');
  const backups=await readdir(path.join(f.root,'.runtime/project-backups/juego-a'));
  assert.equal(await readFile(path.join(f.root,'.runtime/project-backups/juego-a',backups[0],'original'),'utf8'),'Estado original');
  await assert.rejects(access.write('README.md','Viejo',original.sha256),/cambió/);
  await access.write('nuevo.txt','Nuevo','new');
  f.config.projects[0].permissions='read';await writeFile(f.registryFile,JSON.stringify(f.config));
  await assert.rejects((await f.projects.scoped('juego-a','pixel')).write('otro.txt','No','new'),/lectura/);
  f.config.projects[0].permissions='read-write';await writeFile(f.registryFile,JSON.stringify(f.config));
  await assert.rejects((await f.projects.scoped('juego-a','pixel',{readOnly:true})).write('voz.txt','No','new'),/lectura/);
});
test('Hermes separa sesión, memoria, herramientas y conversación general por proyecto',async()=>{
  const f=await fixture();const home=path.join(f.root,'home');
  for(const agent of ['atlas','pixel','prisma','ux','nodo','lupa']){const folder=path.join(home,'profiles','studio-'+agent);await mkdir(folder,{recursive:true});await writeFile(path.join(folder,'config.yaml'),'agent:\n  run_budget_seconds: 90\nfallback_providers: []\n');}
  const calls=[];const settings={root:f.root,installation:{home,executable:process.execPath,installationComplete:true,authenticationVerified:true},projectAccess:f.projects,prepareProfile:async({project,agent,readOnly})=>'office-'+(readOnly?'voice-':'')+project.id+'-'+agent.id,runProcess:async call=>{calls.push(call);return{session_id:call.sessionId||'session-'+call.profile,text:'Respuesta real inyectada para prueba'};}};
  const runtime=await makeHermes(settings);
  const send=(projectId,id)=>runtime.message({agentId:'pixel',projectId,message:'Consulta de prueba',clientMessageId:id});
  await send('studio','general-001');await send('juego-a','project-001');await send('juego-a','project-002');
  assert.equal(calls[0].toolsets,'todo,memory');assert.equal(calls[1].toolsets,'todo,memory,workspace');
  assert.equal(calls[0].maxTurns,4);assert.equal(calls[1].maxTurns,8);
  assert.equal(calls[1].cwd,f.workspace);assert.equal(calls[1].sessionId,null);assert.equal(calls[2].sessionId,'session-office-juego-a-pixel');
  assert.equal(runtime.snapshot().conversations.pixel.messages.length,2);assert.equal(runtime.snapshot('juego-a').conversations.pixel.messages.length,4);
  const restarted=await makeHermes(settings);assert.equal(restarted.snapshot('juego-a').conversations.pixel.messages.length,4);
  assert.match(calls[1].message,/No uses ni menciones información de otros proyectos/);
  await runtime.message({agentId:'pixel',projectId:'juego-a',message:'Consulta hablada',clientMessageId:'voice-message-001',source:'voice'});
  assert.equal(calls[3].profile,'office-voice-juego-a-pixel');assert.equal(calls[3].sessionId,null);assert.match(calls[3].message,/CANAL DE VOZ/);
  await send('juego-a','text-after-voice');assert.equal(calls[4].sessionId,'session-office-juego-a-pixel');
});
test('archivador accesible: geometría bloquea el mueble y conserva una ruta a su entrada',()=>{
  assert.match(roomMarkup(),/id="office-cabinet"/);assert.equal(walkable(CABINET.x+50,CABINET.y+50),false);
  assert.ok(findPath({x:500,y:900},CABINET.approach).length>0);
});
