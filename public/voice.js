import {routeVoice,voiceProfiles,spokenReply} from './voice-routing.js';
import {characterMarkup} from './vector-characters.js';

const $=selector=>document.querySelector(selector);
export function createVoice({getState,selectAgent,sendMessage}) {
  $('.voice-orb').innerHTML='<svg viewBox="-30 -117 60 67" aria-hidden="true">'+characterMarkup('lina',{portrait:true,activity:'portrait'})+'</svg>';
  let capabilities={available:false,voices:[]},enabled=false,activeAgent=null,phase='off',epoch=0,stream,context,analyser,recorder,raf,request,audio,objectUrl;
  let settings={};try{settings=JSON.parse(localStorage.getItem('studio-voices')||'{}');}catch{/* Preferencias opcionales. */}
  const profile=id=>({...voiceProfiles[id],...settings[id]});
  const agent=id=>getState().agents.find(item=>item.id===id);
  const names=()=>getState().agents.map(item=>item.name).join(', ');
  function paint(message) {
    const labels={off:'Micrófono apagado',listening:activeAgent?'Te escucha '+agent(activeAgent)?.name:'Di el nombre de un agente',transcribing:'Transcribiendo en este equipo…',thinking:'Hermes está respondiendo…',speaking:'Respuesta de voz sintética'};
    $('#voice-status').textContent=message||labels[phase];$('#chat-voice-status').textContent=message||labels[phase];
    for(const id of ['voice-toggle','chat-voice-toggle']){const button=$('#'+id);button.textContent=enabled?'Apagar micrófono':'Activar micrófono';button.setAttribute('aria-pressed',String(enabled));button.disabled=!capabilities.available||getState().mode!=='real';}
    $('#voice-card').dataset.phase=phase;$('#voice-target').textContent=activeAgent?'En llamada con '+agent(activeAgent)?.name:'Lina · Central de voz';
    $('#voice-interrupt').disabled=phase!=='speaking';$('#voice-hangup').disabled=!activeAgent;
  }
  function stopRecording(){cancelAnimationFrame(raf);if(recorder?.state==='recording'){recorder.onstop=null;recorder.stop();}recorder=null;}
  function stopAudio(){if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio.src='';audio=null;}if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
  function off(message) {
    enabled=false;epoch++;activeAgent=null;request?.abort();stopRecording();stopAudio();stream?.getTracks().forEach(track=>track.stop());stream=null;
    context?.close().catch(()=>{});context=null;analyser=null;phase='off';$('#voice-transcript').textContent='';paint(message);
  }
  async function speak(text,id='lina',after=true) {
    const token=epoch;stopRecording();stopAudio();stream?.getAudioTracks().forEach(track=>track.enabled=false);
    phase='speaking';paint();const choice=id==='lina'?{voice:'daniela',rate:1}:profile(id);request=new AbortController();
    if(!after){$('#voice-preview-status').textContent='Preparando la muestra local…';document.querySelectorAll('.voice-choice button').forEach(button=>button.disabled=true);}
    try {
      const response=await fetch('/api/voice/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spokenReply(text),voice:choice.voice,rate:choice.rate}),signal:request.signal});
      if(!response.ok)throw new Error((await response.json()).error||'No se pudo generar la voz.');
      const blob=await response.blob();if(token!==epoch)return;objectUrl=URL.createObjectURL(blob);audio=new Audio(objectUrl);
      if(!after)$('#voice-preview-status').textContent='Reproduciendo la voz sintética…';
      await new Promise((resolve,reject)=>{audio.onended=resolve;audio.onerror=()=>reject(new Error('No se pudo reproducir la voz.'));audio.play().catch(reject);});
      if(token!==epoch)return;stopAudio();if(!after){$('#voice-preview-status').textContent='Muestra finalizada.';document.querySelectorAll('.voice-choice button').forEach(button=>button.disabled=false);}if(after&&enabled)listen();else{phase='off';paint();}
    }catch(error){if(token===epoch&&error.name!=='AbortError'){if(!after){$('#voice-preview-status').textContent=error.message;document.querySelectorAll('.voice-choice button').forEach(button=>button.disabled=false);}off(error.message+(after?' El texto sigue en el chat.':''));}}
  }
  async function handle(text,token,projectId) {
    if(token!==epoch||projectId!==getState().projectId||!enabled)return;
    $('#voice-transcript').textContent='Tú: '+text;
    const route=routeVoice(text,activeAgent);
    if(route.type==='off'){off();return;}
    if(route.type==='hangup'){activeAgent=null;await speak('Llamada terminada. Dime el nombre de otro agente.');return;}
    if(route.type==='ambiguous'){await speak('Dime un solo nombre para conectar la llamada.');return;}
    if(route.type==='help'){await speak('Soy Lina. Puedo conectarte con '+names()+'. Dime el nombre y tu consulta.');return;}
    if(['empty','unaddressed'].includes(route.type)){listen();return;}
    if(getState().busy||getState().sending){phase='listening';paint('Hay una respuesta en curso. Espera a que termine.');listen();return;}
    activeAgent=route.agentId;selectAgent(activeAgent);paint();
    if(route.type==='call'){await speak('Te conecto con '+agent(activeAgent).name+'. Te escucho.');return;}
    phase='thinking';paint();stream?.getAudioTracks().forEach(track=>track.enabled=false);
    try{
      const result=await sendMessage(route.message,{agentId:activeAgent,projectId,source:'voice'});
      if(token===epoch&&enabled){if(!result?.reply)throw new Error('No se completó la respuesta.');await speak(result.reply,activeAgent);}
    }catch(error){if(token===epoch)off(error.message);}
  }
  function listen() {
    if(!enabled||!stream||document.hidden)return;
    stopRecording();stream.getAudioTracks().forEach(track=>track.enabled=true);phase='listening';paint();
    const token=epoch,projectId=getState().projectId,chunks=[];
    const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
    recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
    const current=recorder;let hadSpeech=false,firstSpeech=0,lastSpeech=0;const started=performance.now(),samples=new Uint8Array(analyser.fftSize);
    current.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
    current.onerror=()=>off('Falló la captura de audio. Vuelve a activar el micrófono.');
    current.onstop=async()=>{
      if(token!==epoch||!enabled)return;
      if(!hadSpeech||lastSpeech-firstSpeech<220){listen();return;}
      phase='transcribing';paint();stream.getAudioTracks().forEach(track=>track.enabled=false);request=new AbortController();
      try{
        const blob=new Blob(chunks,{type:current.mimeType});
        const response=await fetch('/api/voice/transcribe',{method:'POST',headers:{'Content-Type':blob.type},body:blob,signal:request.signal});
        const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo transcribir.');
        await handle(result.text,token,projectId);
      }catch(error){if(token===epoch&&error.name!=='AbortError')off(error.message);}
    };
    current.start();
    function check(now){
      if(token!==epoch||!enabled||current.state!=='recording')return;
      analyser.getByteTimeDomainData(samples);let energy=0;for(const sample of samples)energy+=((sample-128)/128)**2;energy=Math.sqrt(energy/samples.length);
      if(energy>.018){if(!hadSpeech)firstSpeech=now;hadSpeech=true;lastSpeech=now;}
      if((hadSpeech&&now-lastSpeech>1150)||now-started>16000){current.stop();return;}
      raf=requestAnimationFrame(check);
    }
    raf=requestAnimationFrame(check);
  }
  async function activate() {
    if(enabled){off();return;}
    if(!capabilities.available){paint(capabilities.reason);return;}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){paint('Este navegador no permite captura de voz. Abre la oficina en Chrome o Edge.');return;}
    const token=++epoch;paint('Permite el micrófono para iniciar la escucha local…');
    try{
      const captured=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      if(token!==epoch||document.hidden){captured.getTracks().forEach(track=>track.stop());return;}
      stream=captured;context=new AudioContext();await context.resume();analyser=context.createAnalyser();analyser.fftSize=1024;context.createMediaStreamSource(stream).connect(analyser);enabled=true;activeAgent=null;listen();
    }catch(error){off(error.name==='NotAllowedError'?'Permiso de micrófono denegado. Puedes habilitarlo en los permisos de este sitio.':'No se pudo abrir el micrófono. Comprueba el dispositivo y el navegador.');}
  }
  function contextChanged(){if(!enabled)return;epoch++;activeAgent=null;request?.abort();stopAudio();stopRecording();listen();}
  function renderSettings(){
    const container=$('#voice-choices');container.replaceChildren();
    for(const person of getState().agents){
      const row=document.createElement('div');row.className='voice-choice';const label=document.createElement('label');label.htmlFor='voice-choice-'+person.id;label.textContent=person.name+' · '+voiceProfiles[person.id].label;
      const select=document.createElement('select');select.id=label.htmlFor;select.setAttribute('aria-label','Voz de '+person.name);
      for(const item of capabilities.voices){const option=document.createElement('option');option.value=item.id;option.textContent=item.name+' · '+item.timbre;select.append(option);}select.value=profile(person.id).voice;
      const rate=document.createElement('select');rate.setAttribute('aria-label','Ritmo de '+person.name);for(const speed of [.85,.94,.96,.98,1,1.03,1.08,1.15]){const option=document.createElement('option');option.value=speed;option.textContent=speed+'×';rate.append(option);}rate.value=String(profile(person.id).rate);
      const preview=document.createElement('button');preview.type='button';preview.className='secondary-button';preview.textContent='Escuchar';preview.disabled=!capabilities.available;
      const save=()=>{settings[person.id]={voice:select.value,rate:Number(rate.value)};try{localStorage.setItem('studio-voices',JSON.stringify(settings));}catch{/* Sólo este navegador. */}};
      select.addEventListener('change',save);rate.addEventListener('change',save);preview.addEventListener('click',()=>{epoch++;request?.abort();stopAudio();speak('Hola, soy '+person.name+'. Esta es mi voz para conversar contigo.',person.id,false);});row.append(label,select,rate,preview);container.append(row);
    }
  }
  for(const id of ['voice-toggle','chat-voice-toggle'])$('#'+id).addEventListener('click',activate);
  for(const id of ['voice-settings','chat-voice-settings'])$('#'+id).addEventListener('click',()=>{off();renderSettings();$('#voice-dialog').showModal();});
  $('#close-voice').addEventListener('click',()=>{$('#voice-dialog').close();epoch++;request?.abort();stopAudio();phase='off';paint();});
  $('#voice-dialog').addEventListener('cancel',()=>{epoch++;request?.abort();stopAudio();phase='off';paint();});
  $('#voice-hangup').addEventListener('click',()=>{contextChanged();paint();});
  $('#voice-interrupt').addEventListener('click',()=>{epoch++;request?.abort();stopAudio();if(enabled)listen();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&enabled)off('Micrófono apagado al salir de esta pestaña.');});
  window.addEventListener('pagehide',()=>off());
  async function initialize(){try{capabilities=await(await fetch('/api/voice')).json();$('#voice-engine').textContent=capabilities.available?'Whisper + Piper · audio local':'Motor local no disponible';paint(capabilities.available?undefined:capabilities.reason);}catch{paint('No se pudo consultar el motor de voz.');}}
  return {initialize,contextChanged,off,paint};
}
