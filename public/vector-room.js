// Original, resolution-independent scenery. Coordinates are shared with navigation.
export const WORLD = Object.freeze({ width: 1660, height: 1080 });
export const AGENT_SPOTS = Object.freeze({
  atlas: { x: 210, y: 390 }, pixel: { x: 500, y: 390 }, prisma: { x: 790, y: 390 },
  nodo: { x: 210, y: 730 }, ux: { x: 500, y: 730 }, lupa: { x: 790, y: 730 },
});
export const TV = Object.freeze({ x: 1130, y: 220, width: 380, height: 214 });
export const USAGE_TV = Object.freeze({ x: 700, y: 55, width: 260, height: 128 });
export const CABINET = Object.freeze({ x:680,y:900,w:210,h:125,approach:{x:800,y:850} });
export const OBSTACLES = Object.freeze([
  CABINET,
  ...Object.values(AGENT_SPOTS).map(({ x, y }) => ({ x: x - 95, y: y - 160, w: 190, h: 95 })),
  { x: 1120, y: 610, w: 400, h: 110 },
  { x: 1200, y: 784, w: 230, h: 94 },
  { x: 1090, y: 196, w: 460, h: 260 },
  { x: 49, y: 207, w: 54, h: 64 }, { x: 942, y: 197, w: 60, h: 70 },
  { x: 1517, y: 839, w: 64, h: 66 }, { x: 70, y: 865, w: 66, h: 66 },
]);

function plant(x, y, scale = 1, pot = '#b8816d') {
  return `<g transform="translate(${x} 16) scale(${scale})">
    <ellipse cy="22" rx="34" ry="13" fill="#6c6552" opacity=".12"/>
    <path d="M-24-8h48l-5 34c-8 9-30 9-38 0z" fill="${pot}"/>
    <ellipse cy="-8" rx="24" ry="9" fill="#9b7558"/><ellipse cy="-8" rx="18" ry="6" fill="#262a25"/>
    <g class="vr-leaves" stroke="#54775b" stroke-width="3" stroke-linecap="round">
      <path d="M0-6q-4-35-21-56M1-8q7-41 24-65M0-7q-1-57-1-78" fill="none"/>
      <path d="M-4-28q-47 0-39-35 32-7 39 35" fill="#46664c"/>
      <path d="M-7-48q-31-8-26-37 30 0 26 37" fill="#607a5c"/>
      <path d="M4-41q35-34 47-9-6 29-47 9" fill="#56734f"/>
      <path d="M10-62q-1-35 25-36 17 26-25 36" fill="#385b45"/>
      <path d="M-1-64q-24-22-10-47 27 13 10 47" fill="#718862"/>
    </g></g>`;
}

function station(id, name, role, tint, variant) {
  const { x, y } = AGENT_SPOTS[id];
  const notes = variant === 2 ? `<rect x="62" y="23" width="22" height="28" rx="3" fill="#9e776d"/><path d="M66 30h13m-13 6h9m-9 6h12" stroke="#604a43" stroke-width="2"/>`
    : `<rect x="63" y="27" width="20" height="27" rx="3" fill="${tint}"/><rect x="66" y="24" width="20" height="27" rx="3" fill="#b9ad91"/><path d="M71 31h10m-10 6h7m-7 6h10" stroke="#746c59" stroke-width="2"/>`;
  const screen = variant === 0 ? `<path d="M-27 26l-10 9 10 9m54-18 10 9-10 9M5 24l-9 23" fill="none" stroke="${tint}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : variant === 1 ? `<rect x="-38" y="20" width="28" height="30" rx="4" fill="${tint}" opacity=".85"/><path d="M-1 24h36M-1 34h25M-1 44h31" stroke="#b9c9bf" stroke-width="4" stroke-linecap="round"/>`
      : `<circle cx="-21" cy="33" r="14" fill="${tint}"/><path d="M-6 49l20-28 22 28z" fill="#d8b693"/><circle cx="29" cy="22" r="7" fill="#bf9caf"/>`;
  return `<g transform="translate(${x} ${y - 160})" class="vr-station" data-desk-agent="${id}">
    <ellipse class="vr-desk-glow" cx="-36" cy="52" rx="102" ry="66" fill="url(#vr-task-glow)"/>
    <ellipse cy="151" rx="89" ry="18" fill="#6a604f" opacity=".07"/>
    <path d="M-66 78v36m132-36v36" stroke="#6a5f54" stroke-width="9" stroke-linecap="round"/>
    <rect x="-96" y="7" width="192" height="95" rx="21" fill="#7c6951" opacity=".12"/>
    <rect x="-95" y="-2" width="190" height="95" rx="20" fill="url(#vr-desk)" stroke="#9a7655" stroke-width="2"/>
    <path d="M-76 84H76" stroke="#c49a6b" stroke-width="2" opacity=".5"/>
    <rect x="-56" y="9" width="112" height="57" rx="9" fill="#353f3a"/>
    <rect class="vr-monitor-screen" x="-50" y="15" width="100" height="44" rx="5" fill="#50665d"/>
    <g class="vr-monitor-content">${screen}</g>
    <g class="vr-monitor-activity" fill="none" stroke="#c3e9d7" stroke-width="2" stroke-linecap="round"><path d="M-38 52h17m5 0h12"/><path class="vr-monitor-cursor" d="M2 49v6"/></g>
    <path d="M-9 66v9h18v-9m-27 11h36" fill="#5b6359" stroke="#5b6359" stroke-width="4" stroke-linecap="round"/>
    <rect x="-38" y="81" width="75" height="8" rx="4" fill="#aaa58f"/>
    <path d="M-29 85h53" stroke="#5e665f" stroke-width="2" stroke-dasharray="3 3"/>
    <ellipse cx="50" cy="84" rx="7" ry="9" fill="#aaa58f"/>
    <ellipse cx="-71" cy="43" rx="12" ry="5" fill="#1b1716" opacity=".2"/>
    <path d="M-76 27h13v14q-7 7-13 0z" fill="#c7bb9e"/><path d="M-63 29q12-1 8 8h-8" fill="none" stroke="#c7bb9e" stroke-width="4"/>
    ${notes}
    <path d="M-81 15v-21l14-11" fill="none" stroke="#8b7759" stroke-width="4" stroke-linecap="round"/>
    <path class="vr-task-lamp" d="M-78-14q9-13 20-2l6 10h-31z" fill="${tint}"/>
    <path class="vr-task-light" d="M-79-5h25L-27 59h-75z" fill="url(#vr-task-beam)"/>
    <ellipse cx="-81" cy="17" rx="11" ry="4" fill="#76654d"/>
    <g transform="translate(0 127)"><path d="M0 8v22m-29 7L0 29l29 8" fill="none" stroke="#675e54" stroke-width="6" stroke-linecap="round"/>
    <rect x="-36" y="-19" width="72" height="43" rx="19" fill="#596f63" opacity=".12"/>
    <rect x="-34" y="-24" width="68" height="39" rx="18" fill="${tint}"/><path d="M-25-19q25-9 50 0" fill="none" stroke="#fff" opacity=".25" stroke-width="3"/>
    <path d="M-42-7v16m84-16v16" stroke="#827361" stroke-width="6" stroke-linecap="round"/></g>
    <rect x="-95" y="191" width="190" height="48" rx="15" fill="#26333e" opacity=".92"/>
    <circle cx="-73" cy="212" r="5" fill="${tint}"/>
    <text x="-59" y="217" font-size="19" font-weight="720" fill="#ede1c9">${name}</text>
    <text x="-73" y="232" font-size="10" font-weight="650" letter-spacing="1" fill="#b2bdae">${role}</text>
  </g>`;
}

function windowPanel(x, width) {
  return `<g transform="translate(${x} 39)"><rect x="-7" y="-7" width="${width + 14}" height="100" rx="17" fill="#0a111c" opacity=".65"/>
    <rect width="${width}" height="86" rx="12" fill="url(#vr-window)" stroke="#485363" stroke-width="9"/>
    <g fill="#c4d4f3"><circle cx="27" cy="21" r="1.7"/><circle cx="101" cy="54" r="1.2"/><circle cx="145" cy="22" r="1.6"/><circle cx="190" cy="61" r="1.3"/><circle cx="215" cy="18" r="1.5"/></g>
    <path d="M67 15a19 19 0 1 0 18 28A20 20 0 0 1 67 15" fill="#f3e6b9"/>
    <path d="M${width / 2} 4v78" stroke="#485363" stroke-width="6"/>
    <path d="M8 77l30-17 28 7 35-21 27 22 33-13 29 11 42-21v35H8z" fill="#111d2e"/>
    <rect x="-12" y="83" width="${width + 24}" height="12" rx="6" fill="#5d5758"/>
  </g>`;
}

export const roomStyles = `
  .vr-scene text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .vr-leaves { transform-box: fill-box; transform-origin: center bottom; animation: vr-breathe 9s ease-in-out infinite; }
  .vr-light { animation: vr-glow 7s ease-in-out infinite; }
  .vr-station .vr-monitor-screen { fill: #18252d; transition: fill .5s; }
  .vr-station .vr-monitor-content { opacity: .16; transition: opacity .5s; }
  .vr-station .vr-desk-glow, .vr-station .vr-task-light, .vr-station .vr-monitor-activity { opacity: 0; transition: opacity .5s; }
  .vr-station.is-working .vr-monitor-screen { fill: #345b64; }
  .vr-station.is-working .vr-monitor-content { opacity: 1; }
  .vr-station.is-working .vr-desk-glow { opacity: .85; }
  .vr-station.is-working .vr-task-light { opacity: .55; }
  .vr-station.is-working .vr-task-lamp { fill: #e5b873; }
  .vr-station.is-working .vr-monitor-activity { opacity: .9; animation: vr-screen-activity 1.8s steps(3, end) infinite; }
  .vr-station.is-working .vr-monitor-cursor { animation: vr-cursor 1s steps(1, end) infinite; }
  @keyframes vr-screen-activity { 50% { opacity: .4; } }
  @keyframes vr-cursor { 50% { opacity: 0; } }
  @keyframes vr-breathe { 50% { transform: rotate(1.2deg); } }
  @keyframes vr-glow { 50% { opacity: .72; } }
  @media (prefers-reduced-motion: reduce) { .vr-leaves, .vr-light, .vr-station.is-working .vr-monitor-activity, .vr-station.is-working .vr-monitor-cursor { animation: none; } }
`;

export function roomMarkup() {
  return `<defs>
    <linearGradient id="vr-floor" x2="0" y2="1"><stop stop-color="#28252a"/><stop offset="1" stop-color="#39302e"/></linearGradient>
    <linearGradient id="vr-wall" x2="0" y2="1"><stop stop-color="#172130"/><stop offset="1" stop-color="#253140"/></linearGradient>
    <linearGradient id="vr-window" x2="0" y2="1"><stop stop-color="#101c36"/><stop offset="1" stop-color="#243957"/></linearGradient>
    <linearGradient id="vr-desk" x2="0" y2="1"><stop stop-color="#725344"/><stop offset="1" stop-color="#513c34"/></linearGradient>
    <linearGradient id="vr-couch" x2="0" y2="1"><stop stop-color="#56675f"/><stop offset="1" stop-color="#394c47"/></linearGradient>
    <radialGradient id="vr-sun"><stop stop-color="#e9aa62" stop-opacity=".1"/><stop offset="1" stop-color="#e9aa62" stop-opacity="0"/></radialGradient>
    <radialGradient id="vr-task-glow"><stop stop-color="#f3bd72" stop-opacity=".48"/><stop offset="1" stop-color="#f3bd72" stop-opacity="0"/></radialGradient>
    <linearGradient id="vr-task-beam" x2="0" y2="1"><stop stop-color="#ffdb93" stop-opacity=".6"/><stop offset="1" stop-color="#f3bd72" stop-opacity="0"/></linearGradient>
    <radialGradient id="vr-floor-lamp-glow"><stop stop-color="#f4b45f" stop-opacity=".35"/><stop offset="1" stop-color="#f4b45f" stop-opacity="0"/></radialGradient>
    <pattern id="vr-planks" width="430" height="76" patternUnits="userSpaceOnUse"><path d="M0 0h430M0 76h430M150 0v76M365 0v76" fill="none" stroke="#a67b57" stroke-width="1.4" opacity=".27"/><path d="M20 20q60-5 110 0m48 37q80-5 160 0m45-35h30" fill="none" stroke="#c38f61" opacity=".18" stroke-width="1.4"/></pattern>
    <pattern id="vr-rug-lines" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7h14" stroke="#d8bd95" stroke-width="1" opacity=".17"/></pattern>
    <pattern id="vr-acoustic" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="8" height="15" rx="4" fill="#625043"/><rect x="9" width="3" height="15" fill="#3e332e"/></pattern>
    <filter id="vr-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="9" flood-color="#060910" flood-opacity=".38"/></filter>
    <filter id="vr-soft-shadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#060910" flood-opacity=".15"/></filter>
  </defs>
  <g class="vr-scene" stroke-linejoin="round">
    <rect width="1660" height="1080" rx="30" fill="url(#vr-floor)"/>
    <rect y="157" width="1660" height="923" fill="url(#vr-planks)"/>
    <ellipse cx="575" cy="380" rx="620" ry="310" fill="url(#vr-sun)"/>
    <path d="M330 141h165L318 452H132zM665 141h140L658 410H501z" fill="#7491be" opacity=".035"/>
    <path d="M0 166h1660" stroke="#111722" stroke-width="11" opacity=".19"/>
    <path d="M0 0h1660v156H0z" fill="url(#vr-wall)"/>
    <path d="M0 153h1660" stroke="#5b4d44" stroke-width="7"/>
    <path d="M20 179v850M1640 179v850" stroke="#58483f" stroke-width="9" opacity=".3"/>
    <g transform="translate(55 53)"><path d="M0 45V2h10v17h24V2h10v43H34V28H10v17z" fill="#c8b18b"/><text x="61" y="26" fill="#e7d8bb" font-size="29" letter-spacing="6" font-weight="740">HERMES</text><text x="62" y="48" fill="#9cabbc" font-size="10" letter-spacing="3" font-weight="650">ESTUDIO DE JUEGOS</text></g>
    ${windowPanel(375, 240)}
    <g class="vr-usage-tv" aria-label="Pantalla de uso de Codex"><text x="830" y="36" text-anchor="middle" fill="#c0b393" font-size="10" font-weight="700" letter-spacing="3">CODEX · USO</text><rect x="690" y="45" width="280" height="148" rx="13" fill="#070e17" stroke="#57606a" stroke-width="2"/><rect x="700" y="55" width="260" height="128" rx="4" fill="#111d2b"/><circle cx="951" cy="188" r="2" fill="#d5aa68"/></g>
    <g transform="translate(1080 28)"><rect width="500" height="111" rx="13" fill="#121a24"/><rect x="8" y="8" width="484" height="95" rx="9" fill="url(#vr-acoustic)" opacity=".65"/><rect x="88" y="24" width="322" height="63" rx="12" fill="#27323a"/><text x="249" y="51" text-anchor="middle" fill="#d6c3a3" font-size="17" font-weight="700" letter-spacing="2">SALA DE PROYECCIÓN</text><text x="249" y="72" text-anchor="middle" fill="#9aabaf" font-size="11" letter-spacing="1.5">IDEAS QUE COBRAN VIDA</text></g>
    <g transform="translate(74 152)"><rect x="-34" y="-21" width="68" height="13" rx="6" fill="#6b5644"/><rect x="-22" y="-41" width="44" height="20" rx="5" fill="#566954"/><path d="M-13-41v-17m13 17v-24m12 24v-15" stroke="#74937a" stroke-width="4" stroke-linecap="round"/></g>
    <ellipse cx="1085" cy="633" rx="150" ry="143" fill="url(#vr-floor-lamp-glow)" class="vr-light"/><ellipse cx="1567" cy="315" rx="75" ry="150" fill="url(#vr-floor-lamp-glow)"/>
    <g fill="#b09b7f" opacity=".6" font-size="11" font-weight="650" letter-spacing="3"><text x="116" y="196">CREAR · CONSTRUIR · COMPARTIR</text><text x="116" y="536">EL SIGUIENTE GRAN JUEGO EMPIEZA AQUÍ</text></g>
    ${station('atlas', 'Camilo', 'ARQUITECTURA', '#98aa90', 1)}
    ${station('pixel', 'Santi', 'DESARROLLO', '#8faeaa', 0)}
    ${station('prisma', 'Cata', 'DIRECCIÓN VISUAL', '#bd9bb1', 2)}
    ${station('nodo', 'Nico', 'COORDINACIÓN', '#b5ae86', 1)}
    ${station('ux', 'Vale', 'EXPERIENCIA / UX', '#a7b6a0', 2)}
    ${station('lupa', 'Pipe', 'CALIDAD', '#b8a4b6', 0)}
    ${plant(76, 235, .75)}${plant(972, 232, .8, '#a29c89')}
    <g transform="translate(969 394)"><rect x="-30" y="-65" width="60" height="88" rx="6" fill="#705844"/><rect x="-24" y="-59" width="48" height="76" rx="2" fill="#b7ab90"/><circle cy="-31" r="16" fill="#9a7487"/><path d="M-22 14L1-20l22 34z" fill="#62715a"/><path d="M-22 13L-8-7 9 13" fill="#9c7a54"/></g>
    <g filter="url(#vr-shadow)"><rect x="1093" y="193" width="454" height="266" rx="27" fill="#5d4c40"/><rect x="1103" y="203" width="434" height="246" rx="21" fill="#353c37"/>
      <rect x="1130" y="220" width="380" height="214" rx="4" fill="#273b34"/>
      <path d="M1140 230h195l-195 140z" fill="#4b5d50" opacity=".17"/>
      <g transform="translate(1320 306)" fill="none" stroke="#b6c7ac" stroke-width="2" opacity=".7"><rect x="-23" y="-21" width="46" height="34" rx="8"/><path d="M-5-10L8-3-5 5z" fill="#b6c7ac" stroke="none"/><path d="M-10 22h20m-10-9v9"/></g>
      <text x="1320" y="367" text-anchor="middle" fill="#afbea7" font-size="15" font-weight="500">Tu próxima idea, en pantalla</text>
      <circle cx="1320" cy="443" r="2" fill="#b6c4a4"/></g>
    <path d="M1156 476h328" stroke="#7e644b" stroke-width="10" stroke-linecap="round"/>
    <rect x="1267" y="463" width="106" height="13" rx="6" fill="#5e6b5c"/><circle cx="1355" cy="469" r="2" fill="#afc69a"/>
    <g transform="translate(1573 319)"><rect x="-14" y="-100" width="29" height="197" rx="12" fill="#71604f"/><path d="M0-80V77" stroke="#a48760" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/></g>
    <rect x="1052" y="526" width="544" height="438" rx="85" fill="#111b27" opacity=".2"/>
    <rect x="1048" y="516" width="544" height="438" rx="85" fill="#3b3d4d"/>
    <rect x="1065" y="533" width="510" height="404" rx="71" fill="none" stroke="#756b6e" stroke-width="3"/>
    <rect x="1048" y="516" width="544" height="438" rx="85" fill="url(#vr-rug-lines)"/>
    <g fill="none" stroke="#756b6e" stroke-width="2" opacity=".7"><path d="M1110 910q210-95 420 0M1110 925q210-95 420 0"/></g>
    <g filter="url(#vr-shadow)"><path d="M1150 705v23m338-23v23" stroke="#4c3930" stroke-width="10" stroke-linecap="round"/>
      <rect x="1120" y="610" width="400" height="110" rx="33" fill="#2c3d38"/>
      <rect x="1131" y="610" width="378" height="76" rx="26" fill="url(#vr-couch)"/>
      <path d="M1260 622v58m120-58v58" stroke="#2f433b" stroke-width="3" opacity=".55"/>
      <rect x="1132" y="671" width="376" height="36" rx="16" fill="#5c6d60"/><path d="M1260 680v19m120-19v19" stroke="#344b3e" stroke-width="2"/>
      <rect x="1120" y="640" width="28" height="73" rx="14" fill="#4c5e4f"/><rect x="1492" y="640" width="28" height="73" rx="14" fill="#4c5e4f"/>
      <rect x="1155" y="631" width="54" height="49" rx="12" fill="#ab9676" transform="rotate(-10 1182 655)"/>
      <path d="M1167 640l28 29m-21-32 27 28" stroke="#796447" stroke-width="2"/>
      <rect x="1427" y="630" width="52" height="50" rx="12" fill="#826373" transform="rotate(10 1453 655)"/>
      <path d="M1410 634q-14 30-4 65h36q-12-24-7-57z" fill="#b8ab91"/><path d="M1412 645l17 5m-18 4 17 5m-17 4 17 5m-17 4 18 5m-17 4 19 5" stroke="#8b765d" stroke-width="2"/>
    </g>
    <g filter="url(#vr-soft-shadow)"><path d="M1227 855v27m171-27v27" stroke="#5d4535" stroke-width="8" stroke-linecap="round"/><rect x="1200" y="784" width="230" height="94" rx="44" fill="#503a2e"/><rect x="1200" y="777" width="230" height="91" rx="44" fill="#8d6d4f"/><path d="M1220 840q91 28 186-3" fill="none" stroke="#b28e68" stroke-width="2"/>
      <rect x="1241" y="800" width="54" height="38" rx="4" fill="#5e775f" transform="rotate(-8 1268 819)"/><rect x="1247" y="797" width="50" height="35" rx="3" fill="#c2b69c" transform="rotate(-8 1268 819)"/><path d="M1257 805l25-3m-23 9 25-3" stroke="#7f7f68" stroke-width="2"/>
      <ellipse cx="1356" cy="818" rx="22" ry="13" fill="#6f5237"/><ellipse cx="1356" cy="815" rx="14" ry="10" fill="#d2c3a2"/><ellipse cx="1356" cy="811" rx="9" ry="6" fill="#5f3f28"/><path d="M1370 808q14 0 8 10h-9" stroke="#d2c3a2" stroke-width="5" fill="none"/>
    </g>
    <g transform="translate(1085 692)"><path d="M0 0v-129" stroke="#8d785a" stroke-width="5" stroke-linecap="round"/><ellipse cy="3" rx="29" ry="8" fill="#61503d"/><path d="M-24-129q3-43 24-43t24 43z" fill="#ca9e61"/><ellipse cy="-129" rx="24" ry="7" fill="#ffe3a1"/></g>
    <g id="office-cabinet" role="button" tabindex="0" aria-label="Abrir archivador de proyectos" transform="translate(680 900)"><title>Archivador de proyectos locales</title><ellipse cx="108" cy="127" rx="118" ry="15" fill="#111923" opacity=".4"/><path d="M0 0 16-14h190l12 14v117H0Z" fill="#40585c" stroke="#829d91" stroke-width="2"/><path d="M0 0h218v10H0Z" fill="#74877a"/><path d="M207 10h11v107h-11Z" fill="#2d434a"/><g transform="translate(9 49)"><rect width="192" height="28" rx="3" fill="#344a50" stroke="#667f78"/><rect x="71" y="9" width="52" height="11" rx="2" fill="#c4b98f"/><path d="M84 12h26" stroke="#6d765d" stroke-width="2"/><path d="M16 4h35" stroke="#b8a4d7" stroke-width="4"/></g><g transform="translate(9 82)"><rect width="192" height="28" rx="3" fill="#344a50" stroke="#667f78"/><rect x="71" y="9" width="52" height="11" rx="2" fill="#c4b98f"/><path d="M84 12h26" stroke="#6d765d" stroke-width="2"/><path d="M16 4h35" stroke="#b5cc9c" stroke-width="4"/></g><g transform="translate(9 undefined)"><rect width="192" height="28" rx="3" fill="#344a50" stroke="#667f78"/><rect x="71" y="9" width="52" height="11" rx="2" fill="#c4b98f"/><path d="M84 12h26" stroke="#6d765d" stroke-width="2"/><path d="M16 4h35" stroke="#d5b16f" stroke-width="4"/></g><text x="108" y="-24" text-anchor="middle" fill="#c8d7b6" font-size="13" letter-spacing="2">ARCHIVADOR · PROYECTOS</text><path d="M14 119v8m190-8v8" stroke="#24343a" stroke-width="6"/></g>
    ${plant(1549, 872, .87, '#b59985')}${plant(103, 898, .9, '#a6aa90')}
    <g transform="translate(253 918)"><rect width="118" height="35" rx="10" fill="#65513e"/><rect x="5" y="-5" width="108" height="27" rx="8" fill="#9d8261"/><rect x="14" y="-20" width="41" height="16" rx="3" fill="#708269"/><rect x="19" y="-30" width="42" height="11" rx="2" fill="#8e6d7b"/><text x="75" y="12" text-anchor="middle" fill="#d9c4a0" font-size="9" font-weight="700">PLAY</text></g>
    <g transform="translate(1500 1018)" fill="#b0a28c"><text text-anchor="end" font-size="11" letter-spacing="2" font-weight="600">UN ESTUDIO. INFINITAS POSIBILIDADES.</text><path d="M17-13v14m7-11V-3m7-5v2" fill="none" stroke="#9bab91" stroke-width="3" stroke-linecap="round"/></g>
    <rect x="405" y="1000" width="190" height="74" rx="21" fill="#1a222a" opacity=".6"/><rect x="414" y="1008" width="172" height="66" rx="17" fill="#4a4845"/><path d="M433 1026h134m-134 12h134m-134 12h134" stroke="#736b5e" stroke-width="2"/><text x="500" y="1047" text-anchor="middle" fill="#d7c7a8" font-size="14" font-weight="650" letter-spacing="3">BIENVENIDO</text>
    <path d="M35 1063h369m192 0h1029" stroke="#5a4537" stroke-width="11" stroke-linecap="round"/>
    <path d="M423 1072h154" stroke="#8f7152" stroke-width="8" stroke-linecap="round"/>
  </g>`;
}
