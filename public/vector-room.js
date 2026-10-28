// Original, resolution-independent scenery. Coordinates are shared with navigation.
export const WORLD = Object.freeze({ width: 1660, height: 1080 });
export const AGENT_SPOTS = Object.freeze({
  atlas: { x: 210, y: 390 }, pixel: { x: 500, y: 390 }, prisma: { x: 790, y: 390 },
  nodo: { x: 210, y: 730 }, ux: { x: 500, y: 730 }, lupa: { x: 790, y: 730 },
});
export const TV = Object.freeze({ x: 1130, y: 220, width: 380, height: 214 });
export const OBSTACLES = Object.freeze([
  ...Object.values(AGENT_SPOTS).map(({ x, y }) => ({ x: x - 95, y: y - 160, w: 190, h: 95 })),
  { x: 1120, y: 610, w: 400, h: 110 },
  { x: 1200, y: 784, w: 230, h: 94 },
  { x: 1090, y: 196, w: 460, h: 260 },
  { x: 49, y: 207, w: 54, h: 64 }, { x: 942, y: 197, w: 60, h: 70 },
  { x: 1517, y: 839, w: 64, h: 66 }, { x: 70, y: 865, w: 66, h: 66 },
]);

function plant(x, y, scale = 1, pot = '#b8816d') {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cy="22" rx="34" ry="13" fill="#6c6552" opacity=".12"/>
    <path d="M-24-8h48l-5 34c-8 9-30 9-38 0z" fill="${pot}"/>
    <ellipse cy="-8" rx="24" ry="9" fill="#d7ac92"/><ellipse cy="-8" rx="18" ry="6" fill="#555342"/>
    <g class="vr-leaves" stroke="#54775b" stroke-width="3" stroke-linecap="round">
      <path d="M0-6q-4-35-21-56M1-8q7-41 24-65M0-7q-1-57-1-78" fill="none"/>
      <path d="M-4-28q-47 0-39-35 32-7 39 35" fill="#6f9271"/>
      <path d="M-7-48q-31-8-26-37 30 0 26 37" fill="#8aa582"/>
      <path d="M4-41q35-34 47-9-6 29-47 9" fill="#7f9d77"/>
      <path d="M10-62q-1-35 25-36 17 26-25 36" fill="#63896c"/>
      <path d="M-1-64q-24-22-10-47 27 13 10 47" fill="#9db38d"/>
    </g></g>`;
}

function station(id, name, role, tint, variant) {
  const { x, y } = AGENT_SPOTS[id];
  const notes = variant === 2 ? `<rect x="62" y="23" width="22" height="28" rx="3" fill="#dcb2a4"/><path d="M66 30h13m-13 6h9m-9 6h12" stroke="#aa776a" stroke-width="2"/>`
    : `<rect x="63" y="27" width="20" height="27" rx="3" fill="${tint}"/><rect x="66" y="24" width="20" height="27" rx="3" fill="#f5eee0"/><path d="M71 31h10m-10 6h7m-7 6h10" stroke="#b7ad98" stroke-width="2"/>`;
  const screen = variant === 0 ? `<path d="M-27 26l-10 9 10 9m54-18 10 9-10 9M5 24l-9 23" fill="none" stroke="${tint}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : variant === 1 ? `<rect x="-38" y="20" width="28" height="30" rx="4" fill="${tint}" opacity=".85"/><path d="M-1 24h36M-1 34h25M-1 44h31" stroke="#b9c9bf" stroke-width="4" stroke-linecap="round"/>`
      : `<circle cx="-21" cy="33" r="14" fill="${tint}"/><path d="M-6 49l20-28 22 28z" fill="#d8b693"/><circle cx="29" cy="22" r="7" fill="#bf9caf"/>`;
  return `<g transform="translate(${x} ${y - 160})" class="vr-station">
    <ellipse cy="151" rx="89" ry="18" fill="#6a604f" opacity=".07"/>
    <path d="M-66 78v36m132-36v36" stroke="#aaa18f" stroke-width="9" stroke-linecap="round"/>
    <rect x="-96" y="7" width="192" height="95" rx="21" fill="#7c6951" opacity=".12"/>
    <rect x="-95" y="-2" width="190" height="95" rx="20" fill="url(#vr-desk)" stroke="#d0b99a" stroke-width="2"/>
    <path d="M-76 84H76" stroke="#b59672" stroke-width="2" opacity=".5"/>
    <rect x="-56" y="9" width="112" height="57" rx="9" fill="#353f3a"/>
    <rect x="-50" y="15" width="100" height="44" rx="5" fill="#50665d"/>${screen}
    <path d="M-9 66v9h18v-9m-27 11h36" fill="#5b6359" stroke="#5b6359" stroke-width="4" stroke-linecap="round"/>
    <rect x="-38" y="81" width="75" height="8" rx="4" fill="#f3eee5"/>
    <path d="M-29 85h53" stroke="#c9c6bc" stroke-width="2" stroke-dasharray="3 3"/>
    <ellipse cx="50" cy="84" rx="7" ry="9" fill="#f3eee5"/>
    <ellipse cx="-71" cy="43" rx="12" ry="5" fill="#ab9b7f" opacity=".2"/>
    <path d="M-76 27h13v14q-7 7-13 0z" fill="#f6f0e6"/><path d="M-63 29q12-1 8 8h-8" fill="none" stroke="#f6f0e6" stroke-width="4"/>
    ${notes}
    <path d="M-81 15v-21l14-11" fill="none" stroke="#7e8270" stroke-width="4" stroke-linecap="round"/>
    <path d="M-78-14q9-13 20-2l6 10h-31z" fill="${tint}"/>
    <ellipse cx="-81" cy="17" rx="11" ry="4" fill="#89907b"/>
    <g transform="translate(0 127)"><path d="M0 8v22m-29 7L0 29l29 8" fill="none" stroke="#aaa498" stroke-width="6" stroke-linecap="round"/>
    <rect x="-36" y="-19" width="72" height="43" rx="19" fill="#596f63" opacity=".12"/>
    <rect x="-34" y="-24" width="68" height="39" rx="18" fill="${tint}"/><path d="M-25-19q25-9 50 0" fill="none" stroke="#fff" opacity=".25" stroke-width="3"/>
    <path d="M-42-7v16m84-16v16" stroke="#a79f90" stroke-width="6" stroke-linecap="round"/></g>
    <rect x="-95" y="191" width="190" height="48" rx="15" fill="#f9f5eb" opacity=".92"/>
    <circle cx="-73" cy="212" r="5" fill="${tint}"/>
    <text x="-59" y="217" font-size="19" font-weight="720" fill="#45564b">${name}</text>
    <text x="-73" y="232" font-size="10" font-weight="650" letter-spacing="1" fill="#8b8b78">${role}</text>
  </g>`;
}

function windowPanel(x, width) {
  return `<g transform="translate(${x} 39)"><rect x="-7" y="-7" width="${width + 14}" height="100" rx="17" fill="#c6c6b8" opacity=".35"/>
    <rect width="${width}" height="86" rx="12" fill="url(#vr-window)" stroke="#f8f7ed" stroke-width="9"/>
    <path d="M${width / 2} 4v78" stroke="#f8f7ed" stroke-width="6"/>
    <path d="M15 16h${width / 2 - 34}" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>
    <rect x="-12" y="83" width="${width + 24}" height="12" rx="6" fill="#e7dfcd"/>
  </g>`;
}

export const roomStyles = `
  .vr-scene text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .vr-leaves { transform-box: fill-box; transform-origin: center bottom; animation: vr-breathe 9s ease-in-out infinite; }
  .vr-light { animation: vr-glow 7s ease-in-out infinite; }
  @keyframes vr-breathe { 50% { transform: rotate(1.2deg); } }
  @keyframes vr-glow { 50% { opacity: .72; } }
  @media (prefers-reduced-motion: reduce) { .vr-leaves, .vr-light { animation: none; } }
`;

export function roomMarkup() {
  return `<defs>
    <linearGradient id="vr-floor" x2="0" y2="1"><stop stop-color="#e9dfcd"/><stop offset="1" stop-color="#f0e6d5"/></linearGradient>
    <linearGradient id="vr-wall" x2="0" y2="1"><stop stop-color="#f6f3e9"/><stop offset="1" stop-color="#e8e5d8"/></linearGradient>
    <linearGradient id="vr-window" x2="0" y2="1"><stop stop-color="#c8dfdc"/><stop offset="1" stop-color="#eef1df"/></linearGradient>
    <linearGradient id="vr-desk" x2="0" y2="1"><stop stop-color="#f4dec0"/><stop offset="1" stop-color="#e3c7a1"/></linearGradient>
    <linearGradient id="vr-couch" x2="0" y2="1"><stop stop-color="#a1b69a"/><stop offset="1" stop-color="#7f9b7e"/></linearGradient>
    <radialGradient id="vr-sun"><stop stop-color="#fffcec" stop-opacity=".66"/><stop offset="1" stop-color="#fffcec" stop-opacity="0"/></radialGradient>
    <pattern id="vr-planks" width="430" height="76" patternUnits="userSpaceOnUse"><path d="M0 0h430M0 76h430M150 0v76M365 0v76" fill="none" stroke="#c8b99c" stroke-width="1.4" opacity=".27"/><path d="M20 20q60-5 110 0m48 37q80-5 160 0m45-35h30" fill="none" stroke="#d0bfa1" opacity=".18" stroke-width="1.4"/></pattern>
    <pattern id="vr-rug-lines" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7h14" stroke="#fffaf0" stroke-width="1" opacity=".17"/></pattern>
    <pattern id="vr-acoustic" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="8" height="15" rx="4" fill="#ab8f77"/><rect x="9" width="3" height="15" fill="#8d7561"/></pattern>
    <filter id="vr-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="9" flood-color="#6e5b42" flood-opacity=".15"/></filter>
    <filter id="vr-soft-shadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#4a5a47" flood-opacity=".15"/></filter>
  </defs>
  <g class="vr-scene" stroke-linejoin="round">
    <rect width="1660" height="1080" rx="30" fill="url(#vr-floor)"/>
    <rect y="157" width="1660" height="923" fill="url(#vr-planks)"/>
    <ellipse cx="575" cy="380" rx="620" ry="310" fill="url(#vr-sun)"/>
    <path d="M330 141h165L318 452H132zM665 141h140L658 410H501z" fill="#fff9de" opacity=".19"/>
    <path d="M0 166h1660" stroke="#b8ab93" stroke-width="11" opacity=".19"/>
    <path d="M0 0h1660v156H0z" fill="url(#vr-wall)"/>
    <path d="M0 153h1660" stroke="#faf7ed" stroke-width="7"/>
    <path d="M20 179v850M1640 179v850" stroke="#baa991" stroke-width="9" opacity=".3"/>
    <g transform="translate(55 53)"><path d="M0 45V2h10v17h24V2h10v43H34V28H10v17z" fill="#687e67"/><text x="61" y="26" fill="#53664f" font-size="29" letter-spacing="6" font-weight="740">HERMES</text><text x="62" y="48" fill="#93917e" font-size="10" letter-spacing="3" font-weight="650">ESTUDIO DE JUEGOS</text></g>
    ${windowPanel(375, 240)}${windowPanel(696, 240)}
    <g transform="translate(1080 28)"><rect width="500" height="111" rx="13" fill="#e5ddcf"/><rect x="8" y="8" width="484" height="95" rx="9" fill="url(#vr-acoustic)" opacity=".65"/><rect x="88" y="24" width="322" height="63" rx="12" fill="#eceade"/><text x="249" y="51" text-anchor="middle" fill="#65725c" font-size="17" font-weight="700" letter-spacing="2">SALA DE PROYECCIÓN</text><text x="249" y="72" text-anchor="middle" fill="#93917f" font-size="11" letter-spacing="1.5">IDEAS QUE COBRAN VIDA</text></g>
    <g transform="translate(74 152)"><rect x="-34" y="-21" width="68" height="13" rx="6" fill="#e0d8c5"/><rect x="-22" y="-41" width="44" height="20" rx="5" fill="#b5c0a1"/><path d="M-13-41v-17m13 17v-24m12 24v-15" stroke="#739171" stroke-width="4" stroke-linecap="round"/></g>
    <g fill="#fff6db" opacity=".5" class="vr-light"><ellipse cx="210" cy="207" rx="110" ry="30"/><ellipse cx="790" cy="547" rx="110" ry="30"/></g>
    <g fill="#9d8d73" opacity=".6" font-size="11" font-weight="650" letter-spacing="3"><text x="116" y="196">CREAR · CONSTRUIR · COMPARTIR</text><text x="116" y="536">EL SIGUIENTE GRAN JUEGO EMPIEZA AQUÍ</text></g>
    ${station('atlas', 'Atlas', 'ARQUITECTURA', '#98aa90', 1)}
    ${station('pixel', 'Pixel', 'DESARROLLO', '#8faeaa', 0)}
    ${station('prisma', 'Prisma', 'DIRECCIÓN VISUAL', '#bd9bb1', 2)}
    ${station('nodo', 'Nodo', 'COORDINACIÓN', '#b5ae86', 1)}
    ${station('ux', 'Vera', 'EXPERIENCIA / UX', '#a7b6a0', 2)}
    ${station('lupa', 'Lupa', 'CALIDAD', '#b8a4b6', 0)}
    ${plant(76, 235, .75)}${plant(972, 232, .8, '#a29c89')}
    <g transform="translate(969 394)"><rect x="-30" y="-65" width="60" height="88" rx="6" fill="#bca78a"/><rect x="-24" y="-59" width="48" height="76" rx="2" fill="#f7f0df"/><circle cy="-31" r="16" fill="#c59ba2"/><path d="M-22 14L1-20l22 34z" fill="#91a080"/><path d="M-22 13L-8-7 9 13" fill="#c7b08c"/></g>
    <g filter="url(#vr-shadow)"><rect x="1093" y="193" width="454" height="266" rx="27" fill="#a9957d"/><rect x="1103" y="203" width="434" height="246" rx="21" fill="#353c37"/>
      <rect x="1130" y="220" width="380" height="214" rx="4" fill="#273b34"/>
      <path d="M1140 230h195l-195 140z" fill="#4b5d50" opacity=".17"/>
      <g transform="translate(1320 306)" fill="none" stroke="#b6c7ac" stroke-width="2" opacity=".7"><rect x="-23" y="-21" width="46" height="34" rx="8"/><path d="M-5-10L8-3-5 5z" fill="#b6c7ac" stroke="none"/><path d="M-10 22h20m-10-9v9"/></g>
      <text x="1320" y="367" text-anchor="middle" fill="#afbea7" font-size="15" font-weight="500">Tu próxima idea, en pantalla</text>
      <circle cx="1320" cy="443" r="2" fill="#b6c4a4"/></g>
    <path d="M1156 476h328" stroke="#c7b394" stroke-width="10" stroke-linecap="round"/>
    <rect x="1267" y="463" width="106" height="13" rx="6" fill="#5e6b5c"/><circle cx="1355" cy="469" r="2" fill="#afc69a"/>
    <g transform="translate(1573 319)"><rect x="-14" y="-100" width="29" height="197" rx="12" fill="#ded2bf"/><path d="M0-80V77" stroke="#bba58c" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/></g>
    <rect x="1052" y="526" width="544" height="438" rx="85" fill="#c3b7b9" opacity=".2"/>
    <rect x="1048" y="516" width="544" height="438" rx="85" fill="#cec3c1"/>
    <rect x="1065" y="533" width="510" height="404" rx="71" fill="none" stroke="#e3d8d1" stroke-width="3"/>
    <rect x="1048" y="516" width="544" height="438" rx="85" fill="url(#vr-rug-lines)"/>
    <g fill="none" stroke="#e3d8d1" stroke-width="2" opacity=".7"><path d="M1110 910q210-95 420 0M1110 925q210-95 420 0"/></g>
    <g filter="url(#vr-shadow)"><path d="M1150 705v23m338-23v23" stroke="#8d7960" stroke-width="10" stroke-linecap="round"/>
      <rect x="1120" y="610" width="400" height="110" rx="33" fill="#6d886e"/>
      <rect x="1131" y="610" width="378" height="76" rx="26" fill="url(#vr-couch)"/>
      <path d="M1260 622v58m120-58v58" stroke="#6f8a6e" stroke-width="3" opacity=".55"/>
      <rect x="1132" y="671" width="376" height="36" rx="16" fill="#a6b99b"/><path d="M1260 680v19m120-19v19" stroke="#789276" stroke-width="2"/>
      <rect x="1120" y="640" width="28" height="73" rx="14" fill="#91a88a"/><rect x="1492" y="640" width="28" height="73" rx="14" fill="#91a88a"/>
      <rect x="1155" y="631" width="54" height="49" rx="12" fill="#e7d7bd" transform="rotate(-10 1182 655)"/>
      <path d="M1167 640l28 29m-21-32 27 28" stroke="#c1b095" stroke-width="2"/>
      <rect x="1427" y="630" width="52" height="50" rx="12" fill="#b798a3" transform="rotate(10 1453 655)"/>
      <path d="M1410 634q-14 30-4 65h36q-12-24-7-57z" fill="#ede6d2"/><path d="M1412 645l17 5m-18 4 17 5m-17 4 17 5m-17 4 18 5m-17 4 19 5" stroke="#c9b9a0" stroke-width="2"/>
    </g>
    <g filter="url(#vr-soft-shadow)"><path d="M1227 855v27m171-27v27" stroke="#a1886b" stroke-width="8" stroke-linecap="round"/><rect x="1200" y="784" width="230" height="94" rx="44" fill="#bca17d"/><rect x="1200" y="777" width="230" height="91" rx="44" fill="#f0dec0"/><path d="M1220 840q91 28 186-3" fill="none" stroke="#e2cbab" stroke-width="2"/>
      <rect x="1241" y="800" width="54" height="38" rx="4" fill="#859b82" transform="rotate(-8 1268 819)"/><rect x="1247" y="797" width="50" height="35" rx="3" fill="#f1eadd" transform="rotate(-8 1268 819)"/><path d="M1257 805l25-3m-23 9 25-3" stroke="#b7b29e" stroke-width="2"/>
      <ellipse cx="1356" cy="818" rx="22" ry="13" fill="#d7c3a1"/><ellipse cx="1356" cy="815" rx="14" ry="10" fill="#f8f2e5"/><ellipse cx="1356" cy="811" rx="9" ry="6" fill="#856d58"/><path d="M1370 808q14 0 8 10h-9" stroke="#f8f2e5" stroke-width="5" fill="none"/>
    </g>
    <g transform="translate(1085 692)"><path d="M0 0v-129" stroke="#8f9680" stroke-width="5" stroke-linecap="round"/><ellipse cy="3" rx="29" ry="8" fill="#8e9580"/><path d="M-24-129q3-43 24-43t24 43z" fill="#efe5ca"/><ellipse cy="-129" rx="24" ry="7" fill="#fff6dc"/></g>
    ${plant(1549, 872, .87, '#b59985')}${plant(103, 898, .9, '#a6aa90')}
    <g transform="translate(253 918)"><rect width="118" height="35" rx="10" fill="#d8c9ad"/><rect x="5" y="-5" width="108" height="27" rx="8" fill="#f4ead7"/><rect x="14" y="-20" width="41" height="16" rx="3" fill="#a8b298"/><rect x="19" y="-30" width="42" height="11" rx="2" fill="#bd9ba8"/><text x="75" y="12" text-anchor="middle" fill="#8e8c78" font-size="9" font-weight="700">PLAY</text></g>
    <g transform="translate(1500 1018)" fill="#9c937f"><text text-anchor="end" font-size="11" letter-spacing="2" font-weight="600">UN ESTUDIO. INFINITAS POSIBILIDADES.</text><path d="M17-13v14m7-11V-3m7-5v2" fill="none" stroke="#a5ac94" stroke-width="3" stroke-linecap="round"/></g>
    <rect x="405" y="1000" width="190" height="74" rx="21" fill="#c8bfaa" opacity=".6"/><rect x="414" y="1008" width="172" height="66" rx="17" fill="#ded5c1"/><path d="M433 1026h134m-134 12h134m-134 12h134" stroke="#c5bda9" stroke-width="2"/><text x="500" y="1047" text-anchor="middle" fill="#8b8c77" font-size="14" font-weight="650" letter-spacing="3">BIENVENIDO</text>
    <path d="M35 1063h369m192 0h1029" stroke="#c0b098" stroke-width="11" stroke-linecap="round"/>
    <path d="M423 1072h154" stroke="#a38d71" stroke-width="8" stroke-linecap="round"/>
  </g>`;
}
