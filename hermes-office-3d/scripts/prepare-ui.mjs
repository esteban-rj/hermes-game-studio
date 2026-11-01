import { readFile, writeFile } from 'node:fs/promises';
const base = new URL('../', import.meta.url);
let html = await readFile(new URL('reference/index.html', base), 'utf8');
html = html.replace('<title>Hermes — Tu estudio creativo</title>', '<title>Hermes 3D — Tu estudio creativo</title>');
html = html.replace('href="/styles.css"', 'href="/src/styles.css"><link rel="stylesheet" href="/src/office-3d.css"');
html = html.replace('src="/app.js"', 'src="/src/app.js"');
html = html.replace('oficina vectorial viva', 'oficina 3D viva');
html = html.replace('Planta 01', 'Planta 01 · 3D');
html = html.replace('TURNO NOCHE <b>04</b>', 'TURNO NOCHE <b>3D</b>');
html = html.replace('<h1 id="studio-title">Ideas que cobran vida<span>.</span></h1>', '<h1 id="studio-title">Un nuevo espacio para tus ideas<span>.</span></h1>');
html = html.replace('<p class="intro">Las buenas ideas también llegan de noche.</p>', '<p class="intro">El mismo equipo. Ahora, en otra dimensión.</p>');
html = html.replace('<section class="office-card"', '<section id="office-card" class="office-card"');
html = html.replace('<span><i class="status-dot"></i> 6 AGENTES · HERMES</span>', '<span><i class="status-dot"></i> <span id="agent-count">6 AGENTES · HERMES</span></span>');
html = html.replace('<div class="office-world"', '<div id="scene-labels" class="scene-labels"></div><div id="scene-loading" class="scene-loading"><span class="loading-orbit">✦</span><strong>Abriendo el estudio</strong><span>Preparando tu oficina en 3D…</span></div><div id="scene-error" class="scene-error" hidden><strong>No se pudo abrir la vista 3D</strong><p id="scene-error-text">Comprueba que WebGL esté disponible en tu navegador.</p><button id="scene-reload" class="primary-button" type="button">Reintentar</button><a class="secondary-button" href="http://127.0.0.1:4317/">Abrir oficina original ↗</a></div><div class="office-world"');
html = html.replace('Oficina vectorial. Toca el suelo para caminar, arrastra para explorar', 'Oficina 3D. Toca el suelo para caminar, arrastra para girar');
html = html.replace('Oficina con seis agentes animados', 'Plano de referencia con seis agentes animados');
html = html.replace('<span class="walk-tip" id="walk-tip">Toca el suelo para caminar</span>', '<span class="walk-tip" id="walk-tip"><span>↔</span> Arrastra para girar <b>·</b> Toca el suelo para caminar</span><div class="scene-caption"><span class="scene-dimension">3D</span><span id="scene-status" role="status">Preparando el estudio…</span><span id="scene-online">CONECTANDO</span></div>');
html = html.replace('<button id="camera-follow"', '<button id="camera-top" type="button" aria-label="Vista cenital" aria-pressed="false">▱</button><button id="scene-fullscreen" type="button" aria-label="Pantalla completa" aria-pressed="false">⤢</button><button id="camera-follow"');
html = html.replace('arriba para caminar', 'arriba para caminar');
html = html.replace('pellizca o usa + / − para acercar', 'arrastra para girar · rueda o pellizca para acercar');
// Keep the immersive office immediately above voice, projects, and the gallery.
const voiceStart = html.indexOf('<section class="voice-card"');
const voiceEnd = html.indexOf('</section>', voiceStart) + '</section>'.length;
const voice = html.slice(voiceStart, voiceEnd);
html = html.slice(0, voiceStart) + html.slice(voiceEnd);
html = html.replace('<button id="open-projects"', voice + '\n<button id="open-projects"');
await writeFile(new URL('index.html', base), html);
let app = await readFile(new URL('reference/app.js', base), 'utf8');
app = app.replace("import { walkable, findPath, cameraTransform } from './navigation.js';", '');
app = app.replace("const player = { x:500,y:900,facing:1,path:[] };", '');
app = app.replace(/const camera = .*\r?\n/, '');
app = app.replace('const keys = new Set();', '');
app = app.replace("function selectAgent(id,{voiceCall=false}={}) {", "function selectAgent(id,{voiceCall=false}={}) {if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});");
app = app.replace("state.connected?'En directo':'Reconectando…'", "state.connected?'En directo':'Sin conexión'");
app = app.replace("state.mode==='real'?'Conversación real':'Respuesta simulada'", "!state.connected?'Hermes no disponible':state.mode==='real'?'Conversación real':'Respuesta simulada'");
app = app.slice(0, app.indexOf('// Navegación:')) + `
// The scene reads the existing state; the backend still owns all agent data.
let office3d;
panelVisibility();
try {
 const {createOffice3D}=await import('./office-3d.js');
 office3d=createOffice3D({getState:()=>state,selectAgent,closeChat,cabinet,showMedia,askPrisma,openUsage});
} catch(error) {
 $('#scene-loading').hidden=true;$('#scene-error').hidden=false;
 $('#scene-error-text').textContent='WebGL no está disponible. Puedes usar la oficina original o reintentar.';
 $('#scene-reload').addEventListener('click',()=>location.reload());
 console.error('Office 3D:',error);
}
try{await refresh();state.connected=true;renderConnection();addEvent('runtime.ready');connectEvents();if(state.mode==='real'){refreshUsage();await voice.initialize();}}
catch(error){state.connected=false;renderConnection();status(error.message+' · Abre el estudio Hermes en el puerto 4317.');connectEvents();}
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&state.open&&!document.querySelector('dialog[open]'))closeChat();
 if(event.key==='Tab'&&!desktop.matches&&state.open&&!document.querySelector('dialog[open]')){
  const items=[...$('#chat-panel').querySelectorAll('button:not(:disabled),textarea,input,select')].filter(el=>el.getClientRects().length),first=items[0],last=items.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
});
window.addEventListener('pagehide',()=>{stream?.close();clearInterval(usageTimer);office3d?.dispose();document.querySelectorAll('video').forEach(video=>video.pause());});
`;
await writeFile(new URL('src/app.js', base), app);
