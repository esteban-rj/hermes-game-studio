import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
// Sólo métricas; las respuestas originales pueden incluir IDs de cuenta/créditos.
export function normalizeUsage(limits, activity, now = new Date()) {
  const source = limits?.rateLimitsByLimitId && Object.keys(limits.rateLimitsByLimitId).length
    ? Object.entries(limits.rateLimitsByLimitId) : limits?.rateLimits ? [['codex',limits.rateLimits]] : [];
  const buckets = source.slice(0,12).map(([id,bucket]) => ({
    id: String(id).slice(0,60), name: typeof bucket.limitName === 'string' ? bucket.limitName.slice(0,60) : 'Codex',
    windows: ['primary','secondary'].flatMap(key => {
      const window = bucket[key];
      if (!window || typeof window.usedPercent !== 'number' || !Number.isFinite(window.usedPercent)) return [];
      const usedPercent = Math.min(100,Math.max(0,window.usedPercent));
      return [{usedPercent,remainingPercent:100-usedPercent,windowDurationMins:count(window.windowDurationMins),resetsAt:count(window.resetsAt)}];
    })
  })).filter(bucket => bucket.windows.length);
  const days = Array.isArray(activity?.dailyUsageBuckets) ? activity.dailyUsageBuckets
    .filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day.startDate) && count(day.tokens) !== null)
    .map(day => ({date:day.startDate,tokens:day.tokens})).sort((a,b)=>a.date.localeCompare(b.date)) : [];
  const tokens = {lifetime:count(activity?.summary?.lifetimeTokens),latestDay:days.at(-1)||null};
  const hasTokens = tokens.lifetime !== null || tokens.latestDay !== null;
  return {status:buckets.length || hasTokens ? 'available':'unavailable',source:'codex-app-server',fetchedAt:now.toISOString(),tokens,buckets};
}

// Lista de métodos cerrada. No threads, turns, inferencia, login ni resets.
export function readCodexUsage({executable='codex',spawnProcess=spawn,timeoutMs=15000}={}) {
  return new Promise((resolve,reject)=>{
    const env={...process.env};
    for(const key of ['OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL'])delete env[key];
    const child=spawnProcess(executable,['app-server'],{env,shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
    const lines=createInterface({input:child.stdout});
    let settled=false,bytes=0,limits=null,activity=null;
    const received=new Set();
    const finish=error=>{
      if(settled)return;settled=true;clearTimeout(timer);lines.close();child.stdin.end();child.kill();
      if(error && !limits && !activity)reject(new Error('No se pudo consultar el uso de Codex. Comprueba que el CLI esté instalado y autenticado.'));
      else resolve(normalizeUsage(limits,activity));
    };
    const timer=setTimeout(()=>finish(new Error('timeout')),timeoutMs);
    const send=message=>child.stdin.write(JSON.stringify(message)+'\n');
    child.stderr.on('data',()=>{});
    child.stdin.on('error',()=>{});
    child.on('error',()=>finish(new Error('spawn')));
    child.on('exit',()=>{if(!settled)finish(new Error('exit'));});
    lines.on('line',line=>{
      bytes+=Buffer.byteLength(line);if(bytes>2*1024*1024){finish(new Error('limit'));return;}
      let packet;try{packet=JSON.parse(line);}catch{return;}
      if(packet?.id===1){
        if(packet.error){finish(new Error('initialize'));return;}
        send({method:'initialized',params:{}});
        send({id:2,method:'account/rateLimits/read'});
        send({id:3,method:'account/usage/read'});
      }
      if(packet?.id===2||packet?.id===3){
        received.add(packet.id);
        if(!packet.error){if(packet.id===2)limits=packet.result;else activity=packet.result;}
        if(received.size===2)finish();
      }
    });
    send({id:1,method:'initialize',params:{clientInfo:{name:'hermes_studio_usage',title:'Hermes Studio Usage',version:'0.4.0'}}});
  });
}

export function makeCodexUsage({read=readCodexUsage,now=Date.now,ttlMs=60000}={}) {
  let cache=null,pending=null,lastAttempt=-Infinity;
  return {async get({force=false}={}){
    if(pending)return pending;
    const age=now()-lastAttempt;
    if(cache && age<(force?15000:ttlMs))return structuredClone(cache);
    lastAttempt=now();
    pending=(async()=>{
      try{cache=await read();}
      catch{cache=cache?.status==='available'?{...cache,stale:true}:{status:'unavailable',source:'codex-app-server',fetchedAt:null,tokens:{lifetime:null,latestDay:null},buckets:[]};}
      return structuredClone(cache);
    })();
    try{return await pending;}finally{pending=null;}
  }};
}
