import { animeHead } from './anime-heads.js';
// Self-contained, resolution-independent characters. Only the known presets below
// enter the markup; callers may safely insert the result into an SVG element.
const ink = '#26334b';
const presets = {
  lina: { skin:'#c69376',shade:'#a66e58',hair:'#665074',shirt:'#aa80ba',light:'#e4c3ef',pants:'#424c64',shoes:'#323b50' },
  atlas: { skin: '#d9a77d', shade: '#bd835e', hair: '#43354f', shirt: '#8a74d8', light: '#bba9f1', pants: '#494967', shoes: '#33364e' },
  pixel: { skin: '#a86f52', shade: '#865139', hair: '#253349', shirt: '#578cde', light: '#9ec8ff', pants: '#344562', shoes: '#28364e' },
  prisma: { skin: '#efbb9c', shade: '#d79879', hair: '#9d4d46', shirt: '#ec817e', light: '#ffd0b8', pants: '#73596f', shoes: '#493e59' },
  ux: { skin: '#c68e6c', shade: '#aa7054', hair: '#253b47', shirt: '#4da6a2', light: '#a5dcd0', pants: '#355469', shoes: '#294151' },
  nodo: { skin: '#e2b697', shade: '#c99677', hair: '#665047', shirt: '#79a77f', light: '#c4dfab', pants: '#4b5d54', shoes: '#35453f' },
  lupa: { skin: '#b97c59', shade: '#945b41', hair: '#3d303b', shirt: '#d5aa54', light: '#f6dfa3', pants: '#665569', shoes: '#423d51' },
  player: { skin: '#d4a07d', shade: '#b98160', hair: '#30323a', shirt: '#454b58', light: '#778491', pants: '#485570', shoes: '#2d3547' },
};

function legs(p) {
  return `<g class="sprite-leg-left"><path d="M-12-30h11l-1 22c0 4-2 6-6 6s-7-2-6-6Z" fill="${p.pants}"/><path d="M-13-8c3 2 7 2 11 0l1 5c0 3-2 5-5 5h-9c-2 0-3-2-2-4Z" fill="${p.shoes}"/><path d="M-15-1h11" stroke="#9aacc1" stroke-width="1.3" stroke-linecap="round"/></g>
  <g class="sprite-leg-right"><path d="M1-30h11l3 22c1 4-2 6-6 6S3-4 3-8Z" fill="${p.pants}"/><path d="M3-8c3 2 7 2 11 0l3 6c1 3-1 4-3 4H5C2 2 1 0 2-3Z" fill="${p.shoes}"/><path d="M5-1h10" stroke="#9aacc1" stroke-width="1.3" stroke-linecap="round"/></g>`;
}

function seatedLegs(p) {
  return `<g class="sprite-seated-legs"><path d="M-12-30h24l12 13-6 14h-9l5-12-14-7-14 7 5 12h-9l-6-14Z" fill="${p.pants}"/><path d="m-18-8 9-1 4 8c1 2-1 3-3 3h-13c-3 0-4-3-2-5Zm27-1 9 1 5 5c2 2 1 5-2 5H8C6 2 4 1 5-1Z" fill="${p.shoes}"/><path d="M-20-1h12m16 0h12" stroke="#9aacc1" stroke-width="1.3"/></g>`;
}

function sleepingArms(p) {
  return `<g class="sprite-sleep-arms"><path d="M-18-46q-10 9-6 22l7 5 5-7-5-4 5-12m30-4q10 9 6 22l-7 5-5-7 5-4-5-12" fill="${p.shirt}"/><path d="m-22-26 7 2 1 7c0 4-5 5-7 2l-3-6Zm44 0-7 2-1 7c0 4 5 5 7 2l3-6Z" fill="${p.skin}"/></g>`;
}

function sleepLetters(p) {
  // Paths keep the sleep cue independent of font availability and create no IDs.
  return `<g class="sprite-sleep-letters" fill="none" stroke="${p.light}" stroke-width="2.7"><path class="sprite-sleep-z sprite-sleep-z-one" d="M17-91h7l-7 8h7"/><path class="sprite-sleep-z sprite-sleep-z-two" d="M23-105h8l-8 9h8"/><path class="sprite-sleep-z sprite-sleep-z-three" d="M28-120h9l-9 10h9"/></g>`;
}

function head(id, p) { return animeHead(id, p); }

function outfit(id, p) {
  const collar = id === 'atlas' ? `<path d="m-6-51 6 7 6-7 4 2-6 10-4-5-4 5-6-10Z" fill="#f0eaff"/><path d="M0-43v15" stroke="#5d4d9e" stroke-width="1.3"/><circle cx="3" cy="-35" r="1" fill="#eee8ff"/>`
    : id === 'nodo' ? `<path d="m-6-51 6 5 6-5 4 3-6 9-4-6-4 6-6-9Z" fill="#e4f1d6"/><path d="M0-43v15" stroke="#4f795a" stroke-width="1.3"/>`
      : `<path d="M-7-51q7 8 14 0" fill="none" stroke="${p.light}" stroke-width="3" stroke-linecap="round"/>`;
  const badge = id === 'pixel' ? `<path d="m-9-37-4 3 4 3m7-6 4 3-4 3m-3-8-2 10" fill="none" stroke="#cce7ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : id === 'ux' ? `<rect x="-12" y="-40" width="8" height="8" rx="2" fill="#c1eae0"/><path d="m-10-36 2 2 3-4" fill="none" stroke="#438c87" stroke-width="1.2"/>`
      : id === 'prisma' ? `<path d="M-12-40h24l3 15h-30Z" fill="#ffe4c6"/><path d="M-8-49v12m16-12v12" stroke="#ffe4c6" stroke-width="3"/><circle cx="-7" cy="-32" r="2" fill="#ee9f79"/><path d="m2-30 6-3" stroke="#8aabc4" stroke-width="2" stroke-linecap="round"/>`
        : id === 'lupa' ? `<path d="m-8-50-3 22M8-50l3 22" stroke="#efce83" stroke-width="3"/><rect x="-7" y="-39" width="14" height="9" rx="2" fill="#f6dfa3"/><path d="M-4-35h8" stroke="#b18b44" stroke-width="1.5"/>` : '';
  return `<path d="M-7-53c-6 0-12 2-15 8l6 13 1 7c9 3 21 3 30 0l1-7 6-13c-3-6-9-8-15-8Z" fill="${p.shirt}" stroke="${ink}" stroke-opacity=".14" stroke-width="1"/>
  <path d="M-15-46q-1 10 0 19" stroke="${p.light}" stroke-width="2" opacity=".45" fill="none" stroke-linecap="round"/>
  ${collar}${badge}<path d="M-13-26h26" stroke="${ink}" stroke-opacity=".2" stroke-width="2" stroke-linecap="round"/>`;
}

function armsAndTools(id, p, portrait) {
  const left = `<g class="sprite-arm sprite-arm-left"><path d="M-18-46q-7 7-6 15l9 6 4-7-5-3 4-7" fill="${p.shirt}"/><path d="m-17-34 6 3c3 1 3 6 0 7-3 1-8-2-9-3Z" fill="${p.skin}"/></g>`;
  const right = `<g class="sprite-arm sprite-arm-right"><path d="M18-46q7 7 6 15l-9 6-4-7 5-3-4-7" fill="${p.shirt}"/><path d="m17-34-6 3c-3 1-3 6 0 7 3 1 8-2 9-3Z" fill="${p.skin}"/></g>`;
  if (portrait || id === 'player' || id === 'lina') return left + right;
  if (id === 'atlas') return `${left}<g class="sprite-tool"><path d="m-13-39 13-3 14 3 2 20-15-3-13 3Z" fill="#ece7ff" stroke="#665993" stroke-width="1.3" stroke-linejoin="round"/><path d="m0-42 1 20" stroke="#b1a2d8" stroke-width="1.2"/><path d="m-9-35 5-1 1 7-5 2m13-9 5 2-1 4-5-1m-8 7 4-2" fill="none" stroke="#9a85c8" stroke-width="1.2" stroke-linecap="round"/><path d="M5-28h4m-2-2v4" stroke="#b68cd9" stroke-width="1.2"/></g><g class="sprite-arm sprite-arm-right"><path d="M18-46q8 8 5 16l-9 4-3-7 6-3-5-6" fill="${p.shirt}"/><ellipse cx="14" cy="-29" rx="4" ry="3.5" fill="${p.skin}"/></g>`;
  if (id === 'pixel') return `${left}<g class="sprite-tool"><path d="M-15-40h29l-2 17h-25Z" fill="#2c4565" stroke="#9dc6f2" stroke-width="1.1" stroke-linejoin="round"/><path d="m-11-36 21 0-1 9h-19Z" fill="#436083"/><path d="m-7-33-3 2 3 2m8-4 3 2-3 2m-4-5-2 6" stroke="#9fe1db" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M-17-23h33l-3 3h-27Z" fill="#99b9d9"/></g><g class="sprite-arm sprite-arm-right"><path d="M18-46q9 9 4 16l-13 6-3-6 11-5-5-7" fill="${p.shirt}"/><ellipse cx="7" cy="-27" rx="5" ry="3" fill="${p.skin}"/></g>`;
  if (id === 'prisma') return `<g class="sprite-arm sprite-arm-left"><path d="M-18-46q-8 10-3 16l9 2 2-7-6-2 4-5" fill="${p.shirt}"/><ellipse cx="-11" cy="-32" rx="5" ry="3" fill="${p.skin}"/></g><g class="sprite-tool sprite-palette"><path d="M-19-33c-7 0-10 6-7 11 3 6 17 7 23 2 4-4 0-6-3-7-3-2-3-6-7-6Z" fill="#f4d4a4" stroke="#b98f76" stroke-width="1"/><ellipse cx="-10" cy="-25" rx="2.6" ry="2" fill="#a97859"/><circle cx="-20" cy="-27" r="2" fill="#ed8782"/><circle cx="-20" cy="-21" r="2" fill="#6db5c4"/><circle cx="-14" cy="-20" r="2" fill="#a18cd6"/></g><g class="sprite-arm sprite-arm-right"><path d="M18-46q8 8 5 15l-6 3-4-6 4-3-5-5" fill="${p.shirt}"/><ellipse cx="19" cy="-31" rx="4" ry="3.5" fill="${p.skin}"/><g class="sprite-brush"><path d="m20-30 6-19" stroke="#805c62" stroke-width="2.4" stroke-linecap="round"/><path d="m25-46 2-6" stroke="#c8d3dd" stroke-width="3"/><path d="M26-51c-3-5 1-7 3-10 3 5 3 8-1 11Z" fill="#edb37f"/><path d="m28-58 1-3 1 4" fill="#b382cc"/></g></g>`;
  if (id === 'ux') return `${left}<g class="sprite-tool"><rect x="-12" y="-43" width="25" height="24" rx="3.5" fill="#344d64" stroke="#a8d8d3" stroke-width="1.2"/><rect x="-9" y="-40" width="19" height="17" rx="1.5" fill="#d9f3ec"/><rect x="-7" y="-38" width="7" height="5" rx="1.2" fill="#8fc8c1"/><path d="M3-37h4m-4 3h4m-14 4H7m-14 3H3" stroke="#7aaba8" stroke-width="1.1" stroke-linecap="round"/><circle cx="1" cy="-21" r=".8" fill="#c3e2df"/></g><g class="sprite-arm sprite-arm-right"><path d="M18-46q8 7 5 13l-11 3-2-6 7-1-5-5" fill="${p.shirt}"/><ellipse cx="11" cy="-33" rx="4" ry="3" fill="${p.skin}"/><path d="m8-31-8-9" stroke="#455774" stroke-width="2" stroke-linecap="round"/><path d="m0-40-1-2" stroke="#faf6df" stroke-width="1.5" stroke-linecap="round"/></g>`;
  if (id === 'nodo') return `${left}<g class="sprite-tool"><rect x="-11" y="-45" width="23" height="27" rx="2.5" fill="#d8b991" stroke="#9f886e" stroke-width="1"/><rect x="-8" y="-41" width="17" height="20" rx="1" fill="#faf7e9"/><rect x="-5" y="-47" width="11" height="6" rx="2" fill="#5e7777"/><path d="m-5-36 1.5 1.5 3-3m-4.5 7 1.5 1.5 3-3" fill="none" stroke="#72a17b" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M2-35h4m-4 6h4m-11 4h11" stroke="#b9c6ba" stroke-width="1.2" stroke-linecap="round"/></g><g class="sprite-arm sprite-arm-right"><path d="M18-46q8 9 4 14l-11 4-2-7 8-2-5-5" fill="${p.shirt}"/><ellipse cx="10" cy="-31" rx="4" ry="3" fill="${p.skin}"/><path d="m8-30 4-11" stroke="#526c5a" stroke-width="2" stroke-linecap="round"/></g>`;
  return `${left}<g class="sprite-tool"><path d="m-12-38 19 1-1 20-20-1Z" fill="#fff0c9" stroke="#bba16c" stroke-width="1"/><path d="m-9-33 12 1m-12 4 9 1m-9 4 6 .5" stroke="#c6b17e" stroke-width="1.2" stroke-linecap="round"/></g><g class="sprite-arm sprite-arm-right"><path d="M18-46q8 8 6 14l-8 4-4-6 5-3-5-5" fill="${p.shirt}"/><ellipse cx="16" cy="-32" rx="4" ry="3.5" fill="${p.skin}"/><g class="sprite-magnifier"><path d="m14-33 5-10" stroke="#67536a" stroke-width="4.5" stroke-linecap="round"/><circle cx="22" cy="-49" r="9" fill="#c2eced" fill-opacity=".65" stroke="#7b6578" stroke-width="3"/><path d="M18-53q4-3 7 0" stroke="#fff8e7" stroke-width="2" fill="none" stroke-linecap="round"/></g></g>`;
}

/** SVG inner markup; the parent SVG controls the viewBox and world position. */
export function characterMarkup(id, { portrait = false, activity = 'idle' } = {}) {
  const key = Object.hasOwn(presets, id) ? id : 'player';
  const p = presets[key];
  const isAgent = key !== 'player';
  const activityClass = isAgent && activity !== 'portrait' ? (activity === 'working' ? ' is-working' : ' is-sleeping') : '';
  const body = isAgent
    ? `<g class="sprite-standing-legs">${legs(p)}</g>${seatedLegs(p)}<g class="sprite-body">${outfit(key, p)}<g class="sprite-head">${head(key, p)}</g><g class="sprite-work-arms">${armsAndTools(key, p, false)}</g>${sleepingArms(p)}</g>${sleepLetters(p)}`
    : `${legs(p)}<g class="sprite-body">${outfit(key, p)}${head(key, p)}${armsAndTools(key, p, portrait)}</g>`;
  return `<g class="sprite sprite-${key}${portrait ? ' sprite-portrait' : ''}${activityClass}" stroke-linecap="round" stroke-linejoin="round">
    <ellipse class="sprite-shadow" cx="0" cy="2" rx="22" ry="5" fill="#304955" opacity=".16"/>
    ${body}
  </g>`;
}

// All motion stays inside the sprite so the scene's translate is never replaced.
export const characterStyles = `
.sprite .sprite-body{animation:vector-breathe 4.2s ease-in-out infinite;transform-origin:0px -27px}
.sprite .sprite-eyes{animation:vector-blink 6.7s ease-in-out infinite;transform-origin:0px -74px}
.sprite .sprite-shadow{animation:vector-shadow 4.2s ease-in-out infinite;transform-origin:0px 2px}
.sprite .sprite-arm{transform-origin:17px -45px}
.sprite .sprite-arm-left{transform-origin:-17px -45px}
.sprite .sprite-tool{transform-origin:0px -30px}
.sprite-atlas .sprite-tool{animation:vector-map 5s ease-in-out infinite}
.sprite-atlas .sprite-arm-right{animation:vector-point 5s ease-in-out infinite}
.sprite-pixel .sprite-arm-right{animation:vector-type .9s ease-in-out infinite}
.sprite-pixel .sprite-arm-left{animation:vector-type 1.1s ease-in-out -.4s infinite}
.sprite-prisma .sprite-arm-right{animation:vector-paint 3.2s ease-in-out infinite}
.sprite-prisma .sprite-palette{animation:vector-palette 4s ease-in-out infinite}
.sprite-ux .sprite-arm-right{animation:vector-draw 2.6s ease-in-out infinite}
.sprite-nodo .sprite-arm-right{animation:vector-check 3.7s ease-in-out infinite}
.sprite-lupa .sprite-arm-right{animation:vector-scan 4.6s ease-in-out infinite}
.sprite-player .sprite-arm-left{animation:vector-rest 4.8s ease-in-out infinite}
.sprite-player .sprite-arm-right{animation:vector-rest 4.8s ease-in-out -2.4s infinite}
.working .sprite .sprite-arm,.sprite.working .sprite-arm{animation-duration:1.2s}
.working .sprite .sprite-body,.sprite.working .sprite-body{animation-duration:2s}
.walking .sprite-player .sprite-leg-left,.sprite-player.walking .sprite-leg-left{animation:vector-step .42s ease-in-out infinite;transform-origin:-7px -28px}
.walking .sprite-player .sprite-leg-right,.sprite-player.walking .sprite-leg-right{animation:vector-step .42s ease-in-out -.21s infinite;transform-origin:7px -28px}
.walking .sprite-player .sprite-body,.sprite-player.walking .sprite-body{animation:vector-walk-bob .21s ease-in-out infinite}
.walking .sprite-player .sprite-arm-left,.sprite-player.walking .sprite-arm-left{animation:vector-swing .42s ease-in-out infinite}
.walking .sprite-player .sprite-arm-right,.sprite-player.walking .sprite-arm-right{animation:vector-swing .42s ease-in-out -.21s infinite}
.sprite-portrait .sprite-shadow{display:none}
.sprite-portrait .sprite-arm{animation:none}
.sprite .sprite-seated-legs,.sprite .sprite-sleep-arms,.sprite .sprite-closed-eyes,.sprite .sprite-sleep-letters{display:none}
.sprite.is-working .sprite-standing-legs{display:none}
.sprite.is-working .sprite-seated-legs{display:inline}
.sprite.is-working .sprite-body{animation:vector-work-breathe 2.8s ease-in-out infinite}
.sprite.is-working .sprite-head{transform:translate(0,2px) rotate(-3deg);transform-origin:0px -55px}
.sprite.is-working .sprite-work-arms{transform:translateY(-4px)}
.sprite.is-working .sprite-tool{animation:vector-work-tool 2.4s ease-in-out infinite}
.sprite.is-working .sprite-arm{animation-duration:1.1s}
.sprite.is-working.sprite-prisma .sprite-arm-right{animation-duration:1.8s}
.sprite.is-working.sprite-lupa .sprite-arm-right{animation-duration:2.2s}
.sprite.is-sleeping .sprite-work-arms,.sprite.is-sleeping .sprite-eyes{display:none}
.sprite.is-sleeping .sprite-sleep-arms,.sprite.is-sleeping .sprite-closed-eyes,.sprite.is-sleeping .sprite-sleep-letters{display:inline}
.sprite.is-sleeping .sprite-work-arms *{animation:none!important}
.sprite.is-sleeping .sprite-body{animation:vector-sleep-breathe 5s ease-in-out infinite;transform-origin:0px -26px}
.sprite.is-sleeping .sprite-head{animation:vector-sleep-nod 5s ease-in-out infinite;transform-origin:0px -55px}
.sprite.is-sleeping .sprite-shadow{animation-duration:5s}
.sprite .sprite-sleep-z{animation:vector-sleep-rise 3.6s ease-in-out infinite;opacity:.85}
.sprite .sprite-sleep-z-two{animation-delay:-1.2s}
.sprite .sprite-sleep-z-three{animation-delay:-2.4s}
.sprite-portrait.is-working .sprite-arm{animation:none}
@keyframes vector-work-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-.7px) rotate(-.5deg)}}
@keyframes vector-work-tool{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(2deg) translateY(-.7px)}}
@keyframes vector-sleep-breathe{0%,100%{transform:translateY(1px) rotate(1deg)}50%{transform:translateY(-.5px) rotate(2deg)}}
@keyframes vector-sleep-nod{0%,100%{transform:translate(2px,3px) rotate(10deg)}50%{transform:translate(2px,5px) rotate(15deg)}}
@keyframes vector-sleep-rise{0%{transform:translate(-2px,4px);opacity:0}20%{opacity:.9}75%{opacity:.75}100%{transform:translate(2px,-4px);opacity:0}}
@keyframes vector-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
@keyframes vector-blink{0%,42%,45%,76%,79%,100%{transform:scaleY(1)}43.5%,77.5%{transform:scaleY(.08)}}
@keyframes vector-shadow{0%,100%{transform:scaleX(1);opacity:.16}50%{transform:scaleX(.94);opacity:.13}}
@keyframes vector-map{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg) translateY(-1px)}}
@keyframes vector-point{0%,100%{transform:rotate(0)}45%,65%{transform:rotate(-5deg)}}
@keyframes vector-type{0%,100%{transform:translateY(0)}35%{transform:translateY(-1.6px) rotate(-2deg)}70%{transform:translateY(.6px)}}
@keyframes vector-paint{0%,100%{transform:rotate(-4deg)}35%{transform:rotate(7deg)}65%{transform:rotate(2deg) translateY(-2px)}}
@keyframes vector-palette{0%,100%{transform:rotate(0)}50%{transform:rotate(-4deg)}}
@keyframes vector-draw{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}50%{transform:translate(-1px,1px) rotate(2deg)}75%{transform:rotate(-3deg)}}
@keyframes vector-check{0%,25%,100%{transform:rotate(0)}40%{transform:rotate(-5deg)}55%{transform:rotate(2deg)}70%{transform:rotate(-3deg)}}
@keyframes vector-scan{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg) translateY(-1px)}}
@keyframes vector-rest{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(2deg)}}
@keyframes vector-step{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg) translateY(-2px)}}
@keyframes vector-walk-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes vector-swing{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
@media(prefers-reduced-motion:reduce){.sprite *{animation:none!important;transition:none!important}}
@media(prefers-reduced-motion:reduce){.sprite.is-sleeping .sprite-head{transform:translate(2px,4px) rotate(12deg)}.sprite .sprite-sleep-z{opacity:.85}}
`;
