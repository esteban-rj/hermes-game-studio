import { characterMarkup, characterStyles } from './vector-characters.js';
import { WORLD, AGENT_SPOTS, USAGE_TV, roomMarkup, roomStyles } from './vector-room.js';
import { walkable, findPath, cameraTransform } from './navigation.js';

const $ = selector => document.querySelector(selector);
const ns = 'http://www.w3.org/2000/svg';
const state = { agents:[], conversations:{}, media:[], selected:null, busy:null, mode:null, connected:false, sending:false, live:null, tab:'chat', events:[], open:false, tvId:null };
const desktop = matchMedia('(min-width:1100px)');
const reduced = matchMedia('(prefers-reduced-motion:reduce)');
const player = { x:500,y:900,facing:1,path:[] };
const camera = { x:500,y:740,zoom:desktop.matches ? .62 : .78,follow:true,width:0,height:0,tx:0,ty:0 };
const keys = new Set();
const icons = {
 office:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 21v-5h6v5M8 8h1m6 0h1M8 12h1m6 0h1"/>',
 tv:'<rect x="2" y="4" width="20" height="14" rx="3"/><path d="M8 22h8m-4-4v4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 locate:'<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
 chat:'<path d="M21 11a8 8 0 0 1-8 8H5l-3 3v-11a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8Z"/><path d="M7 10h9M7 14h6"/>',
 send:'<path d="m5 19 14-14M5 5h14v14"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
 door:'<path d="M4 21h16M7 21V4l10-2v19M13 12h1"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 play:'<path d="m8 4 13 8-13 8Z"/>'
};
function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || icons.tv) + '</svg>'; }
function fillIcons(root=document) { root.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); }); }
function node(tag,className,text) { const el=document.createElement(tag); if(className)el.className=className; if(text!==undefined)el.textContent=text; return el; }
function portrait(id,activity='idle') { const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','-36 -126 78 132');svg.setAttribute('aria-hidden','true');svg.innerHTML=characterMarkup(id,{portrait:true,activity});return svg; }
function selected() { return state.agents.find(agent=>agent.id===state.selected); }
function owner(asset) { return state.agents.find(agent=>agent.id===asset.agentId)?.name || 'Equipo'; }
function origin(asset) { return owner(asset)+(asset.source==='hermes'?' · Hermes':' · Adjunto'); }
function status(text) { $('#form-status').textContent=text; }
async function api(url,body) {
 const response=await fetch(url,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await response.json();if(!response.ok)throw new Error(data.error || 'No se pudo completar la acción.');return data;
}
const style=document.createElement('style');style.textContent=characterStyles+'\n'+roomStyles;document.head.append(style);
fillIcons();
$('#room-layer').innerHTML=roomMarkup();
$('#player-sprite').innerHTML='<ellipse class="player-marker" cy="7" rx="23" ry="9"/>'+characterMarkup('player')+'<text class="agent-name-tag" y="30">TÚ</text>';
const figures=new Map();
function renderTeam() {
 $('#agent-list').replaceChildren(...state.agents.map(agent=>{
  const button=node('button','agent-button');button.type='button';button.dataset.agent=agent.id;button.style.setProperty('--agent-color',agent.color);button.setAttribute('aria-pressed',String(agent.id===state.selected));
  const p=node('span','mini-portrait');p.append(portrait(agent.id,agent.status==='running'?'working':'idle'));const info=node('span');info.append(node('span','name',agent.name),node('span','role',agent.role));button.title=agent.status==='running'?'Trabajando en su mesa':'Durmiendo · disponible para conversar';button.append(p,info,node('span','agent-presence'));button.addEventListener('click',()=>selectAgent(agent.id));return button;
 }));
 for(const agent of state.agents) {
  let figure=figures.get(agent.id);
  if(!figure) {
   const point=AGENT_SPOTS[agent.id];if(!point)continue;
   figure=document.createElementNS(ns,'g');figure.setAttribute('transform','translate('+point.x+' '+point.y+')');figure.setAttribute('tabindex','0');figure.setAttribute('role','button');figure.setAttribute('aria-label','Hablar con '+agent.name);figure.dataset.officeAgent=agent.id;
   figure.addEventListener('click',event=>{event.stopPropagation();selectAgent(agent.id);});
   figure.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectAgent(agent.id);}});
   $('#actors-layer').append(figure);figures.set(agent.id,figure);
  }
  const activity=agent.status==='running'?'working':'idle';
  if(figure.dataset.activity!==activity){figure.innerHTML='<ellipse class="selection-ring" cy="3" rx="38" ry="15"/>'+characterMarkup(agent.id,{activity})+'<circle class="agent-status-dot" cx="27" cy="-105" r="4"/><text class="agent-name-tag" y="30"></text>';figure.querySelector('text.agent-name-tag').textContent=agent.name;figure.dataset.activity=activity;}
  const point=AGENT_SPOTS[agent.id];figure.setAttribute('transform','translate('+(point.x+(activity==='working'?30:0))+' '+(point.y-(activity==='working'?30:0))+')');
  figure.setAttribute('class','agent-figure'+(agent.id===state.selected?' selected':'')+(activity==='working'?' working':' sleeping'));
  figure.setAttribute('aria-label','Hablar con '+agent.name+' · '+(activity==='working'?'trabajando en su mesa':'durmiendo'));
  document.querySelector('[data-desk-agent="'+agent.id+'"]')?.classList.toggle('is-working',activity==='working');
 }
 const select=$('#upload-agent');const previous=select.value;select.replaceChildren(...state.agents.map(agent=>{const option=node('option',null,agent.name+' · '+agent.role);option.value=agent.id;return option;}));select.value=previous||state.selected;
}
function renderChat() {
 const chat=state.conversations[state.selected]?.messages || [];
 const entries=[...chat];
 if(state.live?.agentId===state.selected&&state.live.text) entries.push({who:'agent',message:state.live.text,streaming:true});
 const thread=$('#chat-thread');thread.replaceChildren();
 if(!entries.length) {
  const empty=node('div','chat-empty');empty.append(node('span',null,'✦'),node('b',null,'Las buenas ideas empiezan hablando.'),document.createTextNode('Cuéntale a '+(selected()?.name||'tu equipo')+' lo que tienes en mente. También puedes pedirle un gráfico para la TV.'));thread.append(empty);
 }
 const fence=String.fromCharCode(96).repeat(3)+'studio-media';
 for(const entry of entries) {
  const message=node('div','chat-message '+(entry.who==='user'?'user':entry.who==='system'?'system':''));
  const caption=entry.who==='user'?'TÚ':entry.who==='system'?'ESTUDIO':(selected()?.name.toUpperCase()||'HERMES')+(entry.streaming?' · RESPONDIENDO':' · HERMES');
  let text=entry.message||'';if(entry.streaming&&text.includes(fence))text=text.split(fence)[0]+'\nPreparando el gráfico para la TV…';
  message.append(node('small',null,caption),document.createTextNode(text));
  for(const asset of entry.media||[]) { const button=node('button','chat-asset','Ver en la TV · '+asset.title+' ↗');button.type='button';button.addEventListener('click',()=>showMedia(asset.id));message.append(button); }
  thread.append(message);
 }
 thread.scrollTop=thread.scrollHeight;
}
function renderSelected() {
 const agent=selected();if(!agent)return;
 $('#selected-name').textContent=agent.name;$('#selected-role').textContent=agent.role.toUpperCase();$('#selected-status').textContent=agent.status==='running'?'Trabajando en su mesa…':'Durmiendo · listo para conversar';
 $('#selected-portrait').replaceChildren(portrait(agent.id,agent.status==='running'?'working':'idle'));$('#profile-description').textContent=agent.description;$('#profile-model').textContent=agent.model||'Modo de prueba';$('#model-note').textContent=(agent.model||'').replace('gpt-','');
 $('#profile-runtime').textContent=state.mode==='real'?'Hermes · tu suscripción':'Prueba explícita';$('#message').placeholder='Comparte una idea con '+agent.name+'…';renderChat();renderConnection();
}
function renderConnection() {
 $('#runtime-badge').textContent=state.connected?(state.mode==='real'?'● HERMES CONECTADO':'DEMO LOCAL'):'Conectando…';
 $('#connection-label').textContent=state.connected?'En directo':'Reconectando…';$('#connection-light').style.background=state.connected?'#c1daa3':'#d7ac77';
 $('#chat-mode-note').textContent=state.busy?'Hermes está respondiendo…':state.mode==='real'?'Conversación real':'Respuesta simulada';
 $('#send-message').disabled=!state.connected||state.sending||Boolean(state.busy);
}
function panelVisibility() { $('#chat-panel').inert=!desktop.matches&&!state.open;$('.studio-column').inert=!desktop.matches&&state.open;$('#chat-panel').setAttribute('role',desktop.matches?'complementary':'dialog');if(!desktop.matches&&state.open)$('#chat-panel').setAttribute('aria-modal','true');else $('#chat-panel').removeAttribute('aria-modal'); }
function selectAgent(id) {state.selected=id;state.open=true;document.body.classList.add('chat-open');$('#chat-backdrop').hidden=desktop.matches;renderTeam();renderSelected();panelVisibility();switchTab('chat');if(!desktop.matches)$('#close-chat').focus({preventScroll:true});}
function closeChat() {state.open=false;document.body.classList.remove('chat-open');$('#chat-backdrop').hidden=true;panelVisibility();$('#agent-list [data-agent="'+state.selected+'"]')?.focus({preventScroll:true});}
function switchTab(tab) {state.tab=tab;for(const item of ['chat','profile']){$('#tab-'+item).setAttribute('aria-selected',String(tab===item));$('#panel-'+item).hidden=tab!==item;}}
for(const tab of ['chat','profile'])$('#tab-'+tab).addEventListener('click',()=>switchTab(tab));
$('#close-chat').addEventListener('click',closeChat);$('#chat-backdrop').addEventListener('click',closeChat);
desktop.addEventListener('change',()=>{$('#chat-backdrop').hidden=desktop.matches||!state.open;panelVisibility();});
let refreshing;
async function refresh() {
 if(refreshing)return refreshing;
 refreshing=(async()=>{const data=await api('/api/studio');state.agents=data.agents;state.mode=data.mode;state.busy=data.busy;state.conversations=data.conversations||{};state.media=data.media||[];if(!state.selected)state.selected=data.agents[0]?.id;renderTeam();renderSelected();renderMedia();})();
 try{await refreshing;}finally{refreshing=null;}
}
function addEvent(type,data={},agentId) {
 const name=state.agents.find(agent=>agent.id===agentId)?.name||'Hermes';
 const descriptions={'runtime.ready':'Tu equipo está conectado a Hermes.','run.started':name+' está preparando una respuesta.','run.completed':name+' respondió.','run.failed':name+' no pudo completar la respuesta.','artifact.created':name+' añadió un resultado a la TV.'};
 if(!descriptions[type])return;
 state.events.unshift({text:descriptions[type],time:new Date()});state.events=state.events.slice(0,3);
 $('#event-list').replaceChildren(...state.events.map(event=>{const li=node('li');const time=node('time',null,event.time.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}));time.dateTime=event.time.toISOString();li.append(node('i','status-dot'),node('span',null,event.text),time);return li;}));
}
let stream;
function connectEvents() {
 stream=new EventSource('/api/events');
 stream.onopen=()=>{state.connected=true;renderConnection();refresh().catch(()=>status('No se pudo actualizar el estado.'));};
 stream.onerror=()=>{state.connected=false;renderConnection();};
 stream.onmessage=event=>{
  try {
   const packet=JSON.parse(event.data);
   if(packet.type==='message.delta'){if(state.live?.runId!==packet.runId)state.live={runId:packet.runId,agentId:packet.agentId,text:''};state.live.text+=packet.data.text||'';renderChat();return;}
   if(packet.type==='run.completed'||packet.type==='run.failed')state.live=null;
   if(packet.type==='artifact.created')state.tvId=packet.data.asset.id;
   addEvent(packet.type,packet.data,packet.agentId);
   if(['run.started','run.completed','run.failed','agent.status','artifact.created'].includes(packet.type))refresh().catch(()=>status('No se pudo actualizar el estudio.'));
  }catch{status('No se pudo interpretar una actualización.');}
 };
}
$('#chat-form').addEventListener('submit',async event=>{
 event.preventDefault();const input=$('#message');const message=input.value.trim();if(!message||!state.selected||state.sending||state.busy)return;
 const agentId=state.selected;state.sending=true;const chat=state.conversations[agentId]||={messages:[]};chat.messages.push({who:'user',message});input.value='';renderChat();renderConnection();status('Hermes está preparando su respuesta…');
 try {
  const result=await api('/api/messages',{agentId,projectId:'studio',message,clientMessageId:crypto.randomUUID()});state.live=null;
  if(state.mode==='real')await refresh();else{chat.messages.push({who:'agent',message:result.reply});renderChat();}
  if(state.selected===agentId)status(result.media?.length?'Resultado publicado en la TV.':result.model+' · respuesta de Hermes');
 }catch(error){state.live=null;await refresh().catch(()=>{});status(error.message);}
 finally{state.sending=false;renderConnection();}
});
$('#message').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();if(!$('#send-message').disabled)$('#chat-form').requestSubmit();}});

// Galería y TV comparten el mismo resultado. El vídeo se reproduce sólo por acción del usuario.
let currentMediaId=null;
function mediaElement(asset) {
 const el=node(asset.kind==='video'?'video':'img');
 el.src=asset.url;
 if(asset.kind==='video'){el.controls=true;el.playsInline=true;el.preload='metadata';el.setAttribute('aria-label',asset.title);}
 else{el.alt=asset.title;el.loading='lazy';}
 el.addEventListener('error',()=>{$('#media-status').textContent='No se pudo abrir este archivo. Comprueba su formato o códec.';if(el.closest('#viewer-content')){$('#viewer-status').textContent='Este navegador no puede reproducir el archivo. Puedes descargar el original para abrirlo en otro reproductor.';$('#media-download').hidden=false;}});
 return el;
}
function showMedia(id) {
 const asset=state.media.find(item=>item.id===id);if(!asset)return;
 currentMediaId=id;state.tvId=id;renderTV();$('#viewer-status').textContent='';$('#media-download').hidden=true;$('#media-download').href=asset.url;$('#media-download').download='hermes-'+asset.id+(asset.kind==='video'?'.'+asset.mime.split('/')[1]:'.'+(asset.mime==='image/svg+xml'?'svg':asset.mime.split('/')[1]));
 $('#viewer-title').textContent=asset.title;$('#viewer-owner').textContent=origin(asset).toUpperCase();$('#viewer-content').querySelectorAll('video').forEach(video=>video.pause());$('#viewer-content').replaceChildren(mediaElement(asset));$('#tv-screen video')?.pause();
 const index=state.media.findIndex(item=>item.id===id);$('#viewer-count').textContent=(index+1)+' / '+state.media.length;$('#media-prev').disabled=index===0;$('#media-next').disabled=index===state.media.length-1;
 if(!$('#media-viewer').open)$('#media-viewer').showModal();
}
function renderTV() {
 const asset=state.media.find(item=>item.id===state.tvId)||state.media[0];
 const key=asset?.id||'empty';if($('#tv-screen').dataset.mediaId===key)return;$('#tv-screen').dataset.mediaId=key;
 const tv=$('#tv-screen');tv.querySelectorAll('video').forEach(video=>video.pause());tv.replaceChildren();
 if(!asset){const button=node('button');button.type='button';button.innerHTML=icon('tv');button.append(node('span','tv-empty-label','LA PRÓXIMA GRAN IDEA'),node('span','tv-empty-caption','Pide un gráfico a tu equipo'));button.addEventListener('click',()=>askPrisma());tv.append(button);return;}
 if(asset.kind==='video')tv.append(mediaElement(asset));
 else{const button=node('button');button.type='button';button.setAttribute('aria-label','Ampliar '+asset.title);button.append(mediaElement(asset));button.addEventListener('click',()=>showMedia(asset.id));tv.append(button);}
}
function askPrisma(){selectAgent('prisma');$('#message').value='Crea una composición visual para nuestra oficina y muéstrala en la TV.';$('#message').focus();}
function renderMedia() {
 const gallery=$('#media-gallery');gallery.replaceChildren();
 if(!state.media.length){const empty=node('div','gallery-empty');const graphic=node('span');graphic.innerHTML=icon('tv');const copy=node('div');copy.append(node('b',null,'La próxima gran idea va aquí.'),node('p',null,'Pide un gráfico a un agente o añade una imagen o vídeo.'));const button=node('button',null,'Crear con Cata ↗');button.type='button';button.addEventListener('click',askPrisma);empty.append(graphic,copy,button);gallery.append(empty);}
 for(const asset of state.media) {
  const card=node('button','media-card');card.type='button';card.setAttribute('aria-label','Ver '+asset.title);
  if(asset.kind==='image'){const image=mediaElement(asset);image.className='media-thumbnail';card.append(image);}
  else{const placeholder=node('div','video-placeholder');placeholder.innerHTML=icon('play');card.append(placeholder);}
  const info=node('div');info.append(node('b',null,asset.title),node('small',null,origin(asset)));card.append(node('span','media-kind',asset.kind==='video'?'VÍDEO':asset.mime==='image/svg+xml'?'VECTOR':'IMAGEN'),info);card.addEventListener('click',()=>showMedia(asset.id));gallery.append(card);
 }
 renderTV();
}
$('#close-viewer').addEventListener('click',()=>$('#media-viewer').close());
$('#media-viewer').addEventListener('close',()=>{$('#viewer-content').querySelectorAll('video').forEach(video=>video.pause());});
for(const [id,offset] of [['media-prev',-1],['media-next',1]])$('#'+id).addEventListener('click',()=>{const index=state.media.findIndex(item=>item.id===currentMediaId);const next=state.media[index+offset];if(next)showMedia(next.id);});
$('#attach-media').addEventListener('click',()=>{$('#upload-agent').value=state.selected;$('#upload-status').textContent='';$('#upload-dialog').showModal();});
$('#close-upload').addEventListener('click',()=>$('#upload-dialog').close());
$('#upload-file').addEventListener('change',()=>{if(!$('#upload-name').value)$('#upload-name').value=($('#upload-file').files[0]?.name||'').replace(/\.[^.]+$/,'').slice(0,140);});
$('#upload-form').addEventListener('submit',async event=>{
 event.preventDefault();const file=$('#upload-file').files[0];if(!file)return;const button=$('#upload-form button[type=submit]');button.disabled=true;$('#upload-status').textContent='Guardando el resultado…';
 try {
  if(file.size>25*1024*1024)throw new Error('El archivo supera 25 MB.');
  const params=new URLSearchParams({agentId:$('#upload-agent').value,title:$('#upload-name').value});
  const response=await fetch('/api/media?'+params,{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});const data=await response.json();if(!response.ok)throw new Error(data.error);
  state.tvId=data.asset.id;await refresh();$('#upload-dialog').close();$('#upload-form').reset();showMedia(data.asset.id);$('#media-status').textContent='Resultado adjunto guardado en la TV.';
 }catch(error){$('#upload-status').textContent=error.message;}finally{button.disabled=false;}
});

// TV secundaria: actividad y cuota reales de Codex, sin ejecutar modelos.
let usageData=null,usagePending=null;
const compactNumber=new Intl.NumberFormat('es',{notation:'compact',maximumFractionDigits:1});
const wholeNumber=new Intl.NumberFormat('es');
const usageScreen=$('#usage-screen');
Object.assign(usageScreen.style,{left:USAGE_TV.x+'px',top:USAGE_TV.y+'px',width:USAGE_TV.width+'px',height:USAGE_TV.height+'px'});
function quotaDuration(minutes){if(!minutes)return 'Ventana publicada';return minutes%1440===0?minutes/1440+' días':minutes%60===0?minutes/60+' horas':minutes+' min';}
function renderUsage(){
 const data=usageData,tokens=data?.tokens,day=tokens?.latestDay;
 const bucket=data?.buckets?.find(item=>item.id==='codex')||data?.buckets?.[0];const quota=bucket?.windows?.[0];
 const hasTotal=typeof tokens?.lifetime==='number';const available=data?.status==='available';
 const date=day?new Date(day.date+'T12:00:00Z').toLocaleDateString('es',{day:'numeric',month:'short'}):null;
 $('#usage-tv-number').textContent=hasTotal?compactNumber.format(tokens.lifetime):quota?Math.round(quota.remainingPercent)+'%':'—';
 $('#usage-tv-caption').textContent=hasTotal?'TOKENS ACUMULADOS · CUENTA':quota?'CUOTA DISPONIBLE':usagePending?'CONSULTANDO USO…':'DATOS NO DISPONIBLES';
 $('#usage-tv-detail').textContent=day?date+' · '+compactNumber.format(day.tokens)+' tokens':'Actividad de tu cuenta';
 $('#usage-tv-quota').textContent=quota?Math.round(quota.remainingPercent)+'% libre':'Cuota: —';
 $('#usage-tv-fill').style.width=(quota?.remainingPercent||0)+'%';
 $('#usage-toolbar-value').textContent=quota?Math.round(quota.remainingPercent)+'% libre':'—';
 usageScreen.dataset.stale=String(Boolean(data?.stale||!available));
 $('#usage-total').textContent=hasTotal?wholeNumber.format(tokens.lifetime):'No disponible';
 $('#usage-day-label').textContent=date?'Último día con datos · '+date:'Último día con datos';
 $('#usage-day').textContent=day?wholeNumber.format(day.tokens):'No disponible';
 $('#usage-state').textContent=data?.stale?'Última lectura guardada; no se pudo actualizar.':available?'Datos reales de tu cuenta de Codex.':usagePending?'Consultando Codex…':'Datos no disponibles. Comprueba que Codex esté instalado y tenga la sesión iniciada.';
 $('#usage-updated').textContent=data?.fetchedAt?'Lectura: '+new Date(data.fetchedAt).toLocaleString('es',{dateStyle:'short',timeStyle:'short'}):'Sin lectura confirmada';
 const windows=$('#usage-windows');windows.replaceChildren();
 for(const item of data?.buckets||[])for(const window of item.windows){
  const box=node('section','usage-window');const heading=node('div','usage-window-heading');heading.append(node('span',null,item.name+' · '+quotaDuration(window.windowDurationMins)),node('strong',null,Math.round(window.remainingPercent)+'% disponible'));
  const bar=node('div','usage-meter');bar.setAttribute('role','meter');bar.setAttribute('aria-label','Cuota disponible · '+quotaDuration(window.windowDurationMins));bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',String(window.remainingPercent));const fill=node('span');fill.style.width=window.remainingPercent+'%';bar.append(fill);
  const reset=window.resetsAt?' · Reinicia '+new Date(window.resetsAt*1000).toLocaleString('es',{dateStyle:'short',timeStyle:'short'}):'';
  box.append(heading,bar,node('p',null,Math.round(window.usedPercent)+'% de cuota utilizada'+reset));windows.append(box);
 }
}
async function refreshUsage(force=false){
 if(usagePending||document.hidden&&!force)return usagePending;
 $('#refresh-usage').disabled=true;
 usagePending=(async()=>{try{usageData=await api('/api/codex-usage'+(force?'?refresh=1':''));}catch{usageData=usageData?.status==='available'?{...usageData,stale:true}:{status:'unavailable',tokens:{lifetime:null,latestDay:null},buckets:[]};}})();
 renderUsage();try{await usagePending;}finally{usagePending=null;$('#refresh-usage').disabled=false;renderUsage();}
}
function openUsage(){if(!$('#usage-dialog').open)$('#usage-dialog').showModal();refreshUsage();}
$('#usage-screen').addEventListener('click',openUsage);$('#open-usage').addEventListener('click',openUsage);
$('#close-usage').addEventListener('click',()=>$('#usage-dialog').close());$('#refresh-usage').addEventListener('click',()=>refreshUsage(true));
const usageTimer=setInterval(()=>refreshUsage(),60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshUsage();});

// Navegación: colisiones, rutas al tocar, zoom centrado y cámara que sigue al personaje.
const viewport=$('#office-viewport');
let frame=0,lastTime=0,nearest=null,transform={x:0,y:0,zoom:camera.zoom};
function resize(){const box=viewport.getBoundingClientRect();camera.width=box.width;camera.height=box.height;}
new ResizeObserver(resize).observe(viewport);resize();
function updateCamera() {
 transform=cameraTransform(camera);camera.tx=transform.x;camera.ty=transform.y;
 $('#office-world').style.transform='translate('+transform.x.toFixed(2)+'px,'+transform.y.toFixed(2)+'px) scale('+camera.zoom.toFixed(4)+')';
 $('#zoom-label').textContent=Math.round(camera.zoom*100)+'%';$('#camera-follow').setAttribute('aria-pressed',String(camera.follow));
}
function setZoom(value,anchor) {
 const next=Math.max(.12,Math.min(1.65,value));
 if(anchor&&!camera.follow){const wx=(anchor.x-transform.x)/camera.zoom,wy=(anchor.y-transform.y)/camera.zoom;camera.x=wx-(anchor.x-camera.width/2)/next;camera.y=wy-(anchor.y-camera.height/2)/next;}
 camera.zoom=next;updateCamera();
}
function walkTo(target) {player.path=findPath(player,target);if(player.path.length){camera.follow=true;$('#walk-tip').style.opacity='0';}return player.path.length>0;}
function move(dx,dy){const x=player.x+dx,y=player.y+dy;if(walkable(x,player.y))player.x=x;if(walkable(player.x,y))player.y=y;if(Math.abs(dx)>.1)player.facing=dx>0?1:-1;}
function interact(){if(nearest?.id==='tv'){if(state.media.length)showMedia(state.tvId||state.media[0].id);else askPrisma();}else if(nearest)selectAgent(nearest.id);}
function tick(time) {
 const dt=Math.min(.04,(time-lastTime)/1000||.016);lastTime=time;
 let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
 let dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
 if(dx||dy){player.path=[];camera.follow=true;const length=Math.hypot(dx,dy);dx=dx/length*235*dt;dy=dy/length*235*dt;move(dx,dy);$('#walk-tip').style.opacity='0';}
 else if(player.path.length){const next=player.path[0],distance=Math.hypot(next.x-player.x,next.y-player.y);if(distance<5)player.path.shift();else{const amount=Math.min(distance,235*dt);dx=(next.x-player.x)/distance*amount;dy=(next.y-player.y)/distance*amount;move(dx,dy);}}
 const sprite=$('#player-sprite');sprite.setAttribute('transform','translate('+player.x.toFixed(1)+' '+player.y.toFixed(1)+')');sprite.classList.toggle('walking',Boolean(dx||dy));sprite.querySelector('.sprite-player').setAttribute('transform','scale('+player.facing+' 1)');
 sprite.dataset.x=Math.round(player.x);sprite.dataset.y=Math.round(player.y);
 if(camera.follow){const ease=reduced.matches?1:Math.min(1,dt*8);camera.x+=(player.x-camera.x)*ease;camera.y+=(player.y-130-camera.y)*ease;}
 updateCamera();
 const candidates=state.agents.map(agent=>({...agent,distance:Math.hypot(player.x-AGENT_SPOTS[agent.id].x,player.y-AGENT_SPOTS[agent.id].y)}));
 candidates.push({id:'tv',name:'la TV',distance:Math.hypot(player.x-1320,player.y-520)});
 nearest=candidates.filter(candidate=>candidate.distance<105).sort((a,b)=>a.distance-b.distance)[0]||null;
 $('#touch-interact').disabled=!nearest;$('#interact-label').textContent=nearest?(nearest.id==='tv'?'Ver la TV':'Hablar con '+nearest.name):'Acércate a una mesa';
 const lounge=player.x>1035;$('#zone-label').textContent=lounge?'SALA DE PROYECCIÓN':'OFICINA CREATIVA';$('#go-lounge').classList.toggle('active',lounge);$('#go-work').classList.toggle('active',!lounge);
 frame=requestAnimationFrame(tick);
}
$('#zoom-in').addEventListener('click',()=>setZoom(camera.zoom+.12));$('#zoom-out').addEventListener('click',()=>setZoom(camera.zoom-.12));
$('#camera-fit').addEventListener('click',()=>{camera.follow=false;camera.x=WORLD.width/2;camera.y=WORLD.height/2;$('#walk-tip').style.opacity='0';setZoom(Math.min(camera.width/WORLD.width,camera.height/WORLD.height)*.96);});
$('#camera-follow').addEventListener('click',()=>{camera.follow=true;setZoom(desktop.matches ? .72 : .84);});
$('#reset-position').addEventListener('click',()=>{player.x=500;player.y=900;player.path=[];keys.clear();camera.follow=true;viewport.focus({preventScroll:true});});
$('#go-lounge').addEventListener('click',()=>walkTo({x:1320,y:530}));
$('#go-work').addEventListener('click',()=>walkTo({x:500,y:850}));
$('#touch-interact').addEventListener('click',interact);
const pointers=new Map();let gesture=null;
function localPoint(event){const box=viewport.getBoundingClientRect();return{x:event.clientX-box.left,y:event.clientY-box.top};}
function gestureStart(){
 const points=[...pointers.values()];
 if(points.length===1)gesture={point:points[0],initial:points[0],x:camera.x,y:camera.y,moved:false};
 else if(points.length===2)gesture={pinch:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),zoom:camera.zoom,moved:true};
}
viewport.addEventListener('pointerdown',event=>{
 if(event.target.closest('button,video,[data-office-agent]'))return;
 viewport.setPointerCapture(event.pointerId);pointers.set(event.pointerId,localPoint(event));gestureStart();viewport.focus({preventScroll:true});
});
viewport.addEventListener('pointermove',event=>{
 if(!pointers.has(event.pointerId)||!gesture)return;pointers.set(event.pointerId,localPoint(event));const points=[...pointers.values()];
 if(points.length===2&&gesture.pinch){setZoom(gesture.zoom*Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)/gesture.pinch);gesture.moved=true;}
 else if(points.length===1&&gesture.point){const point=points[0],dx=point.x-gesture.point.x,dy=point.y-gesture.point.y;if(Math.hypot(dx,dy)>6||gesture.moved){gesture.moved=true;camera.follow=false;camera.x=gesture.x-dx/camera.zoom;camera.y=gesture.y-dy/camera.zoom;updateCamera();}}
});
viewport.addEventListener('pointerup',event=>{
 if(!pointers.has(event.pointerId))return;const point=localPoint(event),tap=gesture&&!gesture.moved&&pointers.size===1;pointers.delete(event.pointerId);
 if(tap)walkTo({x:(point.x-transform.x)/camera.zoom,y:(point.y-transform.y)/camera.zoom});
 if(pointers.size)gestureStart();else gesture=null;
});
viewport.addEventListener('pointercancel',()=>{pointers.clear();gesture=null;});
viewport.addEventListener('wheel',event=>{event.preventDefault();setZoom(camera.zoom*Math.exp(-event.deltaY*.0015),localPoint(event));},{passive:false});
const movement=['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];
window.addEventListener('keydown',event=>{
 const modalOpen=$('#media-viewer').open||$('#upload-dialog').open||$('#usage-dialog').open;
 if(event.key==='Escape'&&state.open&&!modalOpen){event.preventDefault();closeChat();return;}
 if(event.key==='Tab'&&!desktop.matches&&state.open&&!modalOpen){const focusable=[...$('#chat-panel').querySelectorAll('button:not(:disabled),textarea,input,select')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 if(event.target.closest('input,textarea,select,button')||modalOpen)return;
 const key=event.key.toLowerCase();if(movement.includes(key)){event.preventDefault();keys.add(key);}if(key==='e'){event.preventDefault();interact();}if(key==='Escape'&&state.open)closeChat();
});
window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();player.path=[];}});
for(const button of document.querySelectorAll('[data-direction]')) {
 const key='arrow'+button.dataset.direction;let downAt=0;
 button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);downAt=performance.now();keys.add(key);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>keys.delete(key));
 button.addEventListener('click',()=>{if(performance.now()-downAt<180||downAt===0){const offsets={up:[0,-60],down:[0,60],left:[-60,0],right:[60,0]};const[dx,dy]=offsets[button.dataset.direction];walkTo({x:player.x+dx,y:player.y+dy});}});
}
panelVisibility();frame=requestAnimationFrame(tick);
try{await refresh();state.connected=true;renderConnection();addEvent('runtime.ready');connectEvents();if(state.mode==='real')refreshUsage();}
catch(error){state.connected=false;renderConnection();status(error.message);}
window.addEventListener('pagehide',()=>{stream?.close();clearInterval(usageTimer);cancelAnimationFrame(frame);keys.clear();document.querySelectorAll('video').forEach(video=>video.pause());});
