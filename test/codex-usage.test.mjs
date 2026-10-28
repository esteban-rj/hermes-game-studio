import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter,once} from 'node:events';
import {PassThrough} from 'node:stream';
import {normalizeUsage,readCodexUsage,makeCodexUsage} from '../lib/codex-usage.mjs';
import {createStudioServer} from '../server.mjs';

test('uso Codex: tokens y cuota separados; sin inventar ventanas, ceros ni datos privados',()=>{
 const result=normalizeUsage({accountId:'private-account',rateLimitResetCredits:{credits:[{id:'private-credit'}]},rateLimitsByLimitId:{codex:{primary:{usedPercent:5,windowDurationMins:10080,resetsAt:1793792114},secondary:null}}},{summary:{lifetimeTokens:42,email:'private-email'},dailyUsageBuckets:[{startDate:'2026-10-26',tokens:12},{startDate:'2026-10-27',tokens:30}]});
 assert.equal(result.buckets[0].windows.length,1);assert.equal(result.buckets[0].windows[0].remainingPercent,95);
 assert.equal(result.tokens.lifetime,42);assert.equal(result.tokens.latestDay.date,'2026-10-27');
 for(const secret of ['private-account','private-credit','private-email'])assert.ok(!JSON.stringify(result).includes(secret));
 const unavailable=normalizeUsage(null,null);assert.equal(unavailable.status,'unavailable');assert.equal(unavailable.tokens.lifetime,null);
 assert.equal(normalizeUsage(null,{summary:{lifetimeTokens:0}}).tokens.lifetime,0);
});
test('protocolo Codex llama sólo initialize y dos consultas; nunca crea turns ni consume resets',async()=>{
 const methods=[];
 const result=await readCodexUsage({spawnProcess(executable,args,options){
  assert.deepEqual(args,['app-server']);assert.equal(options.shell,false);assert.equal(options.windowsHide,true);assert.equal(options.env.OPENAI_API_KEY,undefined);
  const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{};
  child.stdin.on('data',bytes=>{const request=JSON.parse(bytes.toString());methods.push(request.method);
   if(request.id===1)queueMicrotask(()=>child.stdout.write(JSON.stringify({id:1,result:{}})+'\n'));
   if(request.id===2)queueMicrotask(()=>child.stdout.write(JSON.stringify({id:2,result:{rateLimits:{primary:{usedPercent:20,windowDurationMins:300}}}})+'\n'));
   if(request.id===3)queueMicrotask(()=>child.stdout.write(JSON.stringify({id:3,error:{message:'Unsupported by this version'}})+'\n'));
  });return child;
 }});
 assert.deepEqual(methods,['initialize','initialized','account/rateLimits/read','account/usage/read']);
 assert.equal(result.buckets[0].windows[0].remainingPercent,80);assert.equal(result.tokens.lifetime,null);
});
test('caché comparte lecturas, limita refresh y conserva marca de antigüedad ante fallo',async()=>{
 let clock=0,calls=0,fail=false,release;
 const usage=makeCodexUsage({now:()=>clock,read:()=>{calls++;return new Promise((resolve,reject)=>{release=()=>fail?reject(new Error('private failure')):resolve(normalizeUsage({rateLimits:{primary:{usedPercent:10}}},null));});}});
 const a=usage.get(),b=usage.get();release();await Promise.all([a,b]);assert.equal(calls,1);
 await usage.get({force:true});assert.equal(calls,1);
 clock=61000;fail=true;const failed=usage.get();release();const cached=await failed;assert.equal(cached.stale,true);assert.equal(cached.buckets[0].windows[0].remainingPercent,90);
 assert.ok(!JSON.stringify(cached).includes('private failure'));
});
test('HTTP de uso aplica el origen local y sólo devuelve métricas normalizadas',async()=>{
 const runtime={snapshot:()=>({mode:'real'}),events:[],listeners:new Set()};let calls=0;
 const usage={get:async()=>{calls++;return normalizeUsage(null,{summary:{lifetimeTokens:123}});}};
 const {server}=createStudioServer({port:0,runtime,usage});server.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 try{assert.equal((await fetch(base+'/api/codex-usage',{headers:{Origin:'https://example.invalid'}})).status,403);assert.equal(calls,0);const result=await(await fetch(base+'/api/codex-usage')).json();assert.equal(result.tokens.lifetime,123);assert.equal(calls,1);}
 finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
