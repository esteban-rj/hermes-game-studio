import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {routeVoice,spokenReply} from '../public/voice-routing.js';
import {makeVoice} from '../lib/voice.mjs';
import {createStudioServer} from '../server.mjs';

test('voz: llamadas por nombre, continuidad, ambigüedad y órdenes explícitas',()=>{
  assert.deepEqual(routeVoice('Lina, llama a Cata.'),{type:'call',agentId:'prisma',message:''});
  assert.deepEqual(routeVoice('Camilo, revisa este plan.'),{type:'message',agentId:'atlas',message:'revisa este plan.'});
  assert.equal(routeVoice('Hola Nicolás').agentId,'nodo');assert.equal(routeVoice('Felipe, revisa').agentId,'lupa');
  assert.equal(routeVoice('Quiero otra idea.','ux').agentId,'ux');
  assert.equal(routeVoice('¿Qué dijo Cata?','atlas').agentId,'atlas');
  assert.equal(routeVoice('Camilo y Cata').type,'ambiguous');assert.equal(routeVoice('Una charla de fondo.').type,'unaddressed');
  assert.equal(routeVoice('Lina apaga el micrófono').type,'off');assert.equal(routeVoice('Termina la llamada').type,'hangup');
  assert.equal(routeVoice('Hola Lina').type,'help');assert.equal(routeVoice('Vale, gracias.','nodo').agentId,'nodo');
  assert.doesNotMatch(spokenReply('Texto ```js\nsecret()\n``` [enlace](https://x.test)'),/secret|https/);
});
async function fixture(){
  const root=await mkdtemp(path.join(tmpdir(),'studio-voice-'));await mkdir(path.join(root,'.runtime'));const model=path.join(root,'model.bin');await writeFile(model,'fixture');
  await writeFile(path.join(root,'.runtime/voice-install.local.json'),JSON.stringify({python:process.execPath,sttModel:root,voices:{davefx:{model,name:'Voz fixture',language:'es',timbre:'masculina'}}}));
  const wav=Buffer.alloc(100);wav.write('RIFF');
  const calls=[];const voice=await makeVoice({root,invoke:async(op,data)=>{calls.push({op,...data});return op==='speak'?{audio:wav.toString('base64')}:{text:'Camilo hola',provider:'fixture'};}});
  return{root,voice,calls,wav};
}
test('voz: audio acotado, modelos permitidos y ausencia de fallback',async()=>{
  const{voice,calls,wav}=await fixture();
  await assert.rejects(voice.speak({text:'Hola',voice:'arbitraria'}));await assert.rejects(voice.transcribe(Buffer.alloc(99),'audio/wav'));await assert.rejects(voice.transcribe(wav,'text/plain'));
  assert.deepEqual(await voice.speak({text:'Hola',voice:'davefx'}),wav);assert.equal((await voice.transcribe(wav,'audio/wav')).text,'Camilo hola');assert.equal(calls.length,2);
  const absent=await makeVoice({root:path.join(tmpdir(),'studio-missing-voice')});assert.equal(absent.capabilities().available,false);assert.equal(absent.speak,undefined);
});
test('voz HTTP: tipos, origen local, audio WAV y transcripción sin persistir',async t=>{
  const{voice,wav}=await fixture();const runtime={snapshot:()=>({mode:'real',capabilities:{},conversations:{}}),events:[],listeners:new Set()};const{server}=createStudioServer({port:0,runtime,voice});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());const url='http://127.0.0.1:'+server.address().port;
  assert.equal((await(await fetch(url+'/api/voice')).json()).available,true);
  assert.equal((await fetch(url+'/api/voice/speak',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://external.test'},body:JSON.stringify({text:'Hola'})})).status,403);
  const spoken=await fetch(url+'/api/voice/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Hola',voice:'davefx'})});assert.equal(spoken.headers.get('content-type'),'audio/wav');assert.equal(Buffer.from(await spoken.arrayBuffer()).toString('ascii',0,4),'RIFF');
  const transcript=await fetch(url+'/api/voice/transcribe',{method:'POST',headers:{'Content-Type':'audio/wav'},body:wav});assert.equal((await transcript.json()).text,'Camilo hola');
});
