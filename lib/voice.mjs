import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { InputError } from './demo.mjs';

export const MAX_VOICE_BYTES=3*1024*1024;
export async function makeVoice({root,invoke}={}) {
  const configFile=path.join(root,'.runtime/voice-install.local.json');let config;
  try {config=JSON.parse((await readFile(configFile,'utf8')).replace(/^\uFEFF/,''));await access(config.python);await access(path.join(config.sttModel,'model.bin'));for(const voice of Object.values(config.voices))await access(voice.model);}
  catch {return {capabilities:()=>({available:false,reason:'La voz local no está instalada. Ejecuta scripts/setup-voice.ps1.',voices:[]}),close(){}};}
  let child,lines,pending=null,idle;
  function close(){clearTimeout(idle);const previous=child;child=null;lines?.close();previous?.kill();if(pending){clearTimeout(pending.timer);pending.reject(new InputError('Se cerró el motor local de voz.',503));pending=null;}}
  async function run(operation,data) {
    if(invoke)return invoke(operation,data);
    if(pending)throw new InputError('El motor local de audio está ocupado.',409);
    clearTimeout(idle);
    if(!child){
      const env={...process.env,HF_HUB_OFFLINE:'1',HF_HUB_DISABLE_TELEMETRY:'1',PYTHONIOENCODING:'utf-8'};
      for(const key of Object.keys(env))if(/API_KEY|HF_TOKEN|HUGGING_FACE_HUB_TOKEN/.test(key))delete env[key];
      child=spawn(config.python,['-u',path.join(root,'scripts/voice-worker.py'),configFile],{cwd:root,env,shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
      child.stderr.on('data',()=>{});child.stdin.on('error',()=>{});
      const instance=child;child.on('error',()=>{if(child===instance)close();});child.on('close',()=>{if(child===instance)close();});
      lines=createInterface({input:child.stdout});lines.on('line',line=>{
        if(line.length>16*1024*1024){close();return;}
        let packet;try{packet=JSON.parse(line);}catch{return;}
        if(!pending||packet.id!==pending.id)return;const request=pending;pending=null;clearTimeout(request.timer);
        if(packet.error)request.reject(new InputError('No se pudo procesar el audio local. Comprueba el formato y los modelos instalados.',502));else request.resolve(packet.result);
        idle=setTimeout(close,120000);idle.unref();
      });
    }
    return new Promise((resolve,reject)=>{const id=randomUUID();pending={id,resolve,reject,timer:setTimeout(()=>{close();},90000)};child.stdin.write(JSON.stringify({id,operation,...data})+'\n');});
  }
  return {
    capabilities:()=>({available:true,stt:'Whisper local · español',tts:'Piper local',audioRetention:'memory-only',voices:Object.entries(config.voices).map(([id,voice])=>({id,name:voice.name,language:voice.language,timbre:voice.timbre})),permissions:'voice-read-only'}),
    async transcribe(bytes,type){if(!Buffer.isBuffer(bytes)||bytes.length<100||bytes.length>MAX_VOICE_BYTES)throw new InputError('Audio vacío o mayor de 3 MB.',413);if(!/^audio\/(webm|ogg|mp4|wav|x-wav)(?:;.*)?$/i.test(type||''))throw new InputError('Formato de audio no admitido.',415);return run('transcribe',{audio:bytes.toString('base64')});},
    async speak(input={}){if(!input||typeof input!=='object'||Array.isArray(input))throw new InputError('Se esperaba un objeto de voz.');const{text,voice='davefx',rate=1}=input;if(typeof text!=='string'||!text.trim()||text.length>1800||!Object.hasOwn(config.voices,voice)||!Number.isFinite(rate)||rate<.75||rate>1.25)throw new InputError('Texto, voz o velocidad no válidos.');const result=await run('speak',{text,voice,rate});const bytes=Buffer.from(result.audio||'','base64');if(bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF')throw new InputError('El motor de voz no devolvió audio válido.',502);return bytes;},
    close,
  };
}
