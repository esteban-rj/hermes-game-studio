// Personajes originales de la oficina. Cuadrícula común, contornos cálidos y luz superior izquierda.
const INK = '#49332d';
const profiles = Object.freeze({
  atlas: { skin: ['#f0c394', '#d7a071', '#b87b59'], hair: ['#a28d79', '#75645b', '#514842'], coat: ['#b69bd1', '#8c70ae', '#654e84'], pants: ['#66677a', '#4a4b61'], type: 'cape', glasses: true },
  pixel: { skin: ['#e5b786', '#c99467', '#a97555'], hair: ['#77716b', '#4f5152', '#343d40'], coat: ['#9cc7d8', '#608fae', '#3e617d'], pants: ['#626f78', '#404e5b'], type: 'jacket', headphones: true },
  prisma: { skin: ['#eec397', '#d5a077', '#b87f5d'], hair: ['#bd7e52', '#8f573f', '#633c32'], coat: ['#eeaf91', '#ce806e', '#9b5550'], pants: ['#797473', '#555562'], type: 'artist', longHair: true, beret: true },
  ux: { skin: ['#edc6a2', '#d3a080', '#af765e'], hair: ['#9d735d', '#704c43', '#4e3735'], coat: ['#9dcdb1', '#65a795', '#3e7b75'], pants: ['#657678', '#44575c'], type: 'cardigan', longHair: true, headband: true },
  nodo: { skin: ['#e6b17d', '#cb905e', '#a76c49'], hair: ['#a97c4c', '#795535', '#543c2e'], coat: ['#bdce86', '#87a260', '#5e7747'], pants: ['#8b8069', '#635f52'], type: 'vest', headset: true },
  lupa: { skin: ['#f3cba0', '#dda778', '#b9825b'], hair: ['#c1a171', '#937450', '#68543f'], coat: ['#ecd38a', '#c8a45e', '#957442'], pants: ['#778378', '#515e55'], type: 'coat', glasses: true, magnifier: true },
});

const playerProfile = Object.freeze({
  skin: ['#d5a17c', '#c18e6b', '#9e6c50'], hair: ['#595047', '#3d3731', '#2b2a27'],
  coat: ['#59605b', '#3b4441', '#293332'], pants: ['#6a746a', '#46554e'],
  type: 'tee', cap: true, beard: true,
});

function p(context, x, y, w, h, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function stamp(context, rows, x, y, palette) {
  rows.forEach((row, dy) => [...row].forEach((key, dx) => {
    if (palette[key]) p(context, x + dx, y + dy, 1, 1, palette[key]);
  }));
}
function block(context, x, y, w, h, color, light = null) {
  p(context, x, y, w, h, INK);
  p(context, x + 1, y + 1, w - 2, h - 2, color);
  if (light) p(context, x + 1, y + 1, w - 2, 1, light);
}
function boots(context, profile, stride, side) {
  const [light, shade] = profile.pants;
  const legs = side ? [{ x: -3 - stride, dy: stride > 0 ? 1 : 0, back: true }, { x: 1 + stride, dy: stride < 0 ? 1 : 0 }] : [{ x: -4, dy: stride > 0 ? 1 : 0, back: true }, { x: 1, dy: stride < 0 ? 1 : 0 }];
  for (const leg of legs) {
    const x = leg.x;
    p(context, x, -8, 4, 8 + leg.dy, INK);
    p(context, x + 1, -7, 2, 6 + leg.dy, leg.back ? shade : light);
    p(context, x + 1, -5 + leg.dy, 1, 3, light);
    p(context, x - (side ? 0 : 1), -1 + leg.dy, 5, 2, INK);
    p(context, x, -1 + leg.dy, 3, 1, '#7a6550');
    p(context, x + 1, -2 + leg.dy, 2, 1, '#4e4b40');
  }
}
function arm(context, profile, x, dy, side = false) {
  const [light, mid, shade] = profile.coat;
  stamp(context, ['.oo.', 'olmo', 'olmo', 'omso', '.oso', '.oko', '.oko', '..o.'], x, -16 + dy,
    { o: INK, l: light, m: mid, s: shade, k: profile.skin[1] });
  if (profile.type === 'tee') {
    p(context, x + 1, -11 + dy, 2, 3, profile.skin[1]);
    p(context, x + 1, -10 + dy, 1, 2, profile.skin[0]);
  }
  if (side) p(context, x + 2, -13 + dy, 1, 2, mid);
}
function torso(context, profile, stride, side, back) {
  const [light, mid, shade] = profile.coat;
  if (profile.type === 'cape') {
    stamp(context, ['..ooooooo..', '.olllmmmmo.', 'olllmmmmmso', 'olllmmmmmsso', 'ollmmmmmssso', '.olmmmmssso.', '.olmmmmssso.', '..olmmmsoo..', '..olmmsoo...', '...oooo....'], -6, -17,
      { o: INK, l: light, m: mid, s: shade });
  }
  if (side) {
    arm(context, profile, -4 - stride, -1, true);
    stamp(context, ['.oooooo.', 'olmmmso.', 'olmmmso.', 'olmmmso.', 'olmmmso.', 'olmmmso.', 'olmmmso.', '.ommmso.', '.oooooo.'], -4, -16,
      { o: INK, l: light, m: mid, s: shade });
    p(context, -2, -9, 5, 1, shade);
    p(context, 1, -8, 2, 1, '#b49c73');
    arm(context, profile, -1 + stride, 0, true);
    return;
  }
  arm(context, profile, -8, stride);
  arm(context, profile, 5, -stride);
  stamp(context, ['..oooooo..', '.olllmmso.', 'ollmmmmsso', 'olmmmmmsso', 'olmmmmmsso', 'olmmmmmsso', 'olmmmmmsso', '.olmmmmso.', '.ooooooo..'], -5, -16,
    { o: INK, l: light, m: mid, s: shade });
  // Costuras, cintura y luz lateral dan volumen a la ropa, sin ruido aleatorio.
  p(context, -3, -10, 1, 2, light); p(context, 3, -11, 1, 3, shade);
  p(context, -3, -8, 6, 1, shade);
  if (back) {
    p(context, -3, -14, 6, 1, light); p(context, -2, -10, 4, 1, mid);
    if (profile.type === 'cape') { p(context, -1, -15, 1, 6, light); p(context, 1, -15, 1, 6, shade); }
    return;
  }
  if (profile.type === 'tee') {
    p(context, -2, -16, 4, 1, profile.skin[1]); p(context, -1, -15, 2, 1, profile.skin[2]);
    p(context, 0, -14, 1, 1, profile.skin[2]);
  } else if (profile.type === 'vest' || profile.type === 'cardigan') {
    p(context, -1, -16, 3, 7, '#e8d8b1'); p(context, 0, -16, 1, 2, '#b1a482');
    p(context, -2, -15, 1, 5, shade); p(context, 2, -15, 1, 5, shade);
    p(context, 2, -11, 1, 1, '#f3d397'); p(context, -3, -10, 2, 1, shade);
  } else if (profile.type === 'coat') {
    p(context, -1, -16, 3, 3, '#e8d8b1'); p(context, 0, -13, 1, 5, shade);
    p(context, -3, -12, 1, 1, '#795f3b'); p(context, -3, -10, 1, 1, '#795f3b');
    p(context, 3, -12, 1, 1, '#795f3b'); p(context, 3, -10, 1, 1, '#795f3b');
  } else if (profile.type === 'jacket') {
    p(context, -1, -16, 3, 7, '#ded1ad'); p(context, -2, -15, 1, 6, shade); p(context, 2, -15, 1, 6, light);
    p(context, -4, -12, 2, 1, shade); p(context, -3, -8, 7, 1, '#6c5942');
    p(context, 0, -8, 2, 1, '#d9be7a'); p(context, 4, -9, 1, 3, '#9a8059');
  } else if (profile.type === 'artist') {
    p(context, -2, -16, 4, 2, '#edd7a7'); p(context, 1, -14, 1, 4, '#ebc696');
    p(context, -4, -12, 3, 3, shade); p(context, -3, -13, 1, 3, '#e7c572'); p(context, -2, -13, 1, 2, '#7ea799');
  } else { p(context, 0, -15, 1, 4, '#e6d5b1'); p(context, 0, -11, 1, 1, '#d1bd7d'); }
}
function hairBack(context, profile) {
  if (!profile.longHair) return;
  stamp(context, ['..ooooooo..', '.olllmmmso.', 'olllmmmmso.', 'olmmmmmmso.', 'olmmmmmmso.', 'olmmmmmmso.', 'olmmmmmmso.', 'olmmmmmmso.', '.olmmmmsso.', '.olmmmsso..', '..olmsso...', '...ooo.....'], -6, -27,
    { o: INK, l: profile.hair[0], m: profile.hair[1], s: profile.hair[2] });
}
function face(context, profile, side, back) {
  const [light, mid, shade] = profile.skin;
  const hair = profile.hair;
  if (back) {
    stamp(context, ['...oooooo...', '..ollllmoo..', '.ollllmmmsso', '.olllmmmmssso', 'olllmmmmmssso', 'olmmmmmmmssso', 'olmmmmmmmssso', '.ommmmmmssso.', '..ommmmssso..', '...ooooooo...'], -6, -28,
      { o: INK, l: hair[0], m: hair[1], s: hair[2] });
    p(context, -2, -18, 4, 2, shade); p(context, -1, -18, 2, 1, mid);
    return;
  }
  if (side) {
    stamp(context, ['...oooooo..', '..ohhhhmmo.', '.ohhhhmmmo.', '.ohhLLLLLo.', '.ohhLLLLLo.', '.ohmLLLLLo.', '..omLLLLaLo', '...oLLLaaao', '...oLLaaao.', '....ooooo..'], -6, -27,
      { o: INK, h: hair[0], m: hair[1], L: light, e: INK, a: mid });
    p(context, -3, -21, 2, 3, shade); p(context, -3, -21, 1, 1, light);
    p(context, 2, -23, 3, 1, hair[2]); p(context, 2, -22, 2, 1, INK);
    p(context, 3, -22, 1, 1, '#f5e0bd'); p(context, 2, -21, 1, 1, '#55453a');
    p(context, 4, -19, 2, 1, '#a76c56');
    return;
  }
  stamp(context, ['...oooooo...', '..ohhhhqqqo.', '.ohhhhhqqso.', '.ohhLLLLhso.', 'ohhLLLLLLLso', 'ohLLLLLLLLso', 'oLLeLLaLeLLo', 'oLLLLLaLLLLo', '.oLLmmmmmLo.', '..oLLLmmLo..', '...oooooo...'], -6, -28,
    { o: INK, h: hair[0], q: hair[1], m: mid, s: hair[2], L: light, e: INK, a: shade });
  // Un píxel de brillo en los ojos y rubor cálido, no superficies planas.
  p(context, -3, -22, 2, 1, INK); p(context, 2, -22, 2, 1, INK);
  p(context, -2, -21, 1, 1, '#55453a'); p(context, 2, -21, 1, 1, '#55453a');
  p(context, -3, -22, 1, 1, '#fff0d2'); p(context, 3, -22, 1, 1, '#fff0d2');
  p(context, -4, -20, 1, 1, '#d99876'); p(context, 4, -20, 1, 1, '#d99876');
  p(context, -1, -19, 3, 1, '#a86f58');
  p(context, -2, -18, 4, 2, mid); p(context, -1, -18, 2, 1, light);
  // Mechones asimétricos sobre la frente.
  p(context, -4, -25, 3, 1, hair[1]); p(context, -4, -24, 1, 2, hair[1]);
  p(context, 1, -26, 3, 1, hair[1]); p(context, 3, -25, 1, 2, hair[1]);
}
function hairFront(context, profile, side, back) {
  if (!profile.longHair || back) return;
  const [light, mid, shade] = profile.hair;
  if (side) {
    p(context, -5, -24, 2, 9, INK); p(context, -4, -24, 2, 9, mid);
    p(context, -4, -21, 1, 5, light); p(context, -3, -18, 1, 4, shade);
    return;
  }
  stamp(context, ['oh...ho', 'oh...ho', 'oh...ho', 'om...ho', 'om...mo', '.o...o.'], -5, -21,
    { o: INK, h: light, m: mid });
  p(context, 4, -22, 1, 8, shade); p(context, -5, -21, 1, 7, light);
}
function cap(context, side, back) {
  const black = '#252d2d', shine = '#48514c', deep = '#182525';
  if (back) {
    stamp(context, ['...oooooo...', '..olllmmmo..', '.olllllmmmo.', 'ollllllmmmmo', 'ollllllmmmmo', '.ommmmmmmmo.'], -6, -28,
      { o: INK, l: shine, m: black });
    p(context, -7, -23, 14, 3, INK); p(context, -6, -23, 12, 2, black); p(context, -5, -23, 8, 1, shine);
    p(context, 0, -27, 1, 4, '#677064');
  } else if (side) {
    stamp(context, ['...oooooo...', '..ollllmmmo.', '.olllllmmmo.', '.ollllmmmmo.', '.ommmm...oo.'], -6, -28,
      { o: INK, l: shine, m: black });
    p(context, -8, -24, 4, 2, INK); p(context, -8, -24, 3, 1, black);
    p(context, 2, -25, 3, 1, '#b0a67e'); p(context, 3, -24, 2, 1, '#d4c894');
  } else {
    stamp(context, ['...oooooo...', '..ollllmmmo.', '.ol..kk..mmo', '.omkkkkkkmmo', '.omkkkkkkmmo', '.om......mmo'], -6, -28,
      { o: INK, l: shine, m: black, k: '#c18e6b' });
    p(context, -5, -24, 10, 1, '#a69e76'); p(context, -4, -25, 8, 1, '#bdb18a');
    p(context, -5, -25, 2, 1, '#dbcea0'); p(context, -6, -24, 1, 3, '#8b8967');
  }
  p(context, -3, -28, 5, 1, shine); p(context, 3, -27, 1, 1, deep);
}
function accessories(context, profile, side, back) {
  const [hairLight, hairMid, hairShade] = profile.hair;
  if (profile.cap) cap(context, side, back);
  if (profile.beret) {
    stamp(context, ['...oooooo...', '..olllllmoo.', '.olllllmmmso', 'ollllllmmmso', '.ommmmmmmso.'], -6, -28,
      { o: INK, l: '#e7aa8e', m: '#ce826f', s: '#995348' });
    p(context, 1, -29, 2, 2, '#805b43'); p(context, 1, -29, 1, 1, '#cab77c');
  }
  if (profile.headband) {
    p(context, -4, -26, 8, 1, '#b4d9b4'); p(context, 3, -25, 2, 1, '#71ae9e');
    p(context, 5, -25, 1, 2, '#3e7978');
  }
  if (profile.headphones || profile.headset) {
    const tone = profile.headphones ? '#678c96' : '#5e7760';
    p(context, -4, -27, 8, 1, INK); p(context, -3, -27, 6, 1, '#b6bba0');
    block(context, -7, -24, 3, 6, tone, '#a0b9b0');
    if (!side) block(context, 5, -24, 3, 6, tone, '#a0b9b0');
    if (profile.headset && !back) {
      p(context, 5, -19, 1, 2, INK); p(context, 3, -18, 3, 1, INK); p(context, 2, -18, 1, 1, '#c7cc9d');
    }
  }
  if (back) return;
  if (profile.beard) {
    if (side) {
      p(context, -2, -20, 2, 3, '#433b32'); p(context, 0, -18, 5, 2, '#3b372e');
      p(context, 4, -20, 2, 1, '#39352d'); p(context, 3, -18, 2, 1, '#6b5543');
    } else {
      p(context, -5, -21, 1, 3, '#433b32'); p(context, 5, -21, 1, 3, '#433b32');
      p(context, -4, -19, 8, 3, '#3b372e'); p(context, -2, -20, 5, 1, '#39352d');
      p(context, -1, -19, 3, 1, '#a26e54'); p(context, -3, -17, 1, 1, '#6b5543'); p(context, 3, -17, 1, 1, '#6b5543');
    }
    p(context, -4, -23, 3, 1, hairShade); p(context, 2, -23, 3, 1, hairShade);
  }
  if (profile.glasses) {
    if (side) {
      block(context, 1, -23, 5, 3, '#9eb9ad'); p(context, -2, -23, 3, 1, '#b7b393'); p(context, 3, -22, 1, 1, '#e5ebcc');
    } else {
      block(context, -5, -23, 5, 3, '#9eb9ad'); block(context, 1, -23, 5, 3, '#9eb9ad');
      p(context, 0, -22, 1, 1, '#b7b393'); p(context, -3, -22, 1, 1, '#edf0d7'); p(context, 3, -22, 1, 1, '#edf0d7');
    }
  }
  if (profile.type === 'cape') {
    block(context, -7, -11, 4, 5, '#bd9b6c', '#ecd4a1'); p(context, -6, -9, 2, 1, '#e7d7aa');
    p(context, -5, -10, 1, 3, '#b08657');
  }
  if (profile.type === 'cardigan') {
    block(context, 3, -12, 5, 7, '#435c59', '#92b9a1'); p(context, 4, -10, 3, 3, '#cfe1b5'); p(context, 5, -6, 1, 1, '#d6c998');
  }
  if (profile.magnifier) {
    stamp(context, ['.ooo.', 'olllo', 'olalo', 'olllo', '.ooo.', '..o..', '..o..'], 4, -13,
      { o: INK, l: '#9ec7bb', a: '#edf0c8' });
    p(context, 6, -8, 1, 3, '#b6985c');
  }
}

/** Motor común para sprites originales; el paso es una fase, no un reloj interno. */
function drawPerson(context, x, y, profile, { facing = 'down', step = 0, scale = 2 } = {}) {
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.scale(scale, scale);
  p(context, -6, 0, 12, 2, '#59433035'); p(context, -8, 0, 16, 1, '#59433020');
  const stride = step ? Math.round(Math.sin(step) * 1.1) : 0;
  const side = facing === 'left' || facing === 'right';
  const back = facing === 'up';
  if (facing === 'left') context.scale(-1, 1);
  boots(context, profile, stride, side);
  context.translate(0, step && Math.abs(Math.sin(step)) > .75 ? -1 : 0);
  hairBack(context, profile);
  torso(context, profile, stride, side, back);
  face(context, profile, side, back);
  hairFront(context, profile, side, back);
  accessories(context, profile, side, back);
  context.restore();
}

export function drawAgentCharacter(context, x, y, { id = 'atlas', tint, facing = 'down', step = 0, scale = 2 } = {}) {
  const profile = profiles[id] || profiles.atlas;
  // Cada paleta conserva luces y sombras diseñadas, aunque exista un color UI de rol.
  drawPerson(context, x, y, profile, { facing, step, scale });
}

export function drawPersonalCharacter(context, x, y, options = {}) {
  drawPerson(context, x, y, playerProfile, options);
}
