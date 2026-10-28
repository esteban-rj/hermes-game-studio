// Materiales originales para una oficina cozy en píxeles. Sin texturas externas.
// La geometría de mesas y circulación coincide con el mapa y sus colisiones.
const WIDTH = 832;
const HEIGHT = 512;
const ink = '#563925';
const wood = { dark: '#805032', shade: '#a66b3e', mid: '#c98c4e', light: '#e4b773', edge: '#f2cf8b' };
const deskLayout = Object.freeze([
  { id: 'atlas', name: 'Atlas', x: 102, y: 133, chairX: 170, chairY: 216, role: 'ARQUITECTURA', upholstery: '#96779b' },
  { id: 'pixel', name: 'Pixel', x: 286, y: 133, chairX: 355, chairY: 216, role: 'DESARROLLO', upholstery: '#6e98a0' },
  { id: 'prisma', name: 'Prisma', x: 588, y: 133, chairX: 655, chairY: 216, role: 'ARTE / MUNDOS', upholstery: '#c4866b' },
  { id: 'nodo', name: 'Nodo', x: 102, y: 304, chairX: 170, chairY: 386, role: 'COORDINACION', upholstery: '#879b5e' },
  { id: 'ux', name: 'Vera', x: 349, y: 304, chairX: 416, chairY: 386, role: 'DISENO UX', upholstery: '#6eab96' },
  { id: 'lupa', name: 'Lupa', x: 588, y: 304, chairX: 655, chairY: 386, role: 'CONTROL DE CALIDAD', upholstery: '#bd9a55' },
]);

// Fuente bitmap propia de 3 x 5; los rótulos también mantienen bordes de píxel.
const letters = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'], D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'], J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'], N: ['101', '111', '111', '111', '101'],
  O: ['010', '101', '101', '101', '010'], P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '111', '011'], R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'], X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'], '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '110', '101', '010'], '7': ['111', '001', '010', '010', '010'],
  '8': ['010', '101', '010', '101', '010'], '9': ['010', '101', '011', '001', '110'],
  '/': ['001', '001', '010', '100', '100'], '-': ['000', '000', '111', '000', '000'],
  '+': ['000', '010', '111', '010', '000'], ' ': ['000', '000', '000', '000', '000'],
};
let staticLayer = null;

function rect(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function bitmapText(context, value, centerX, top, color, scale = 1) {
  const text = String(value).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const left = Math.round(centerX - (text.length * 4 - 1) * scale / 2);
  [...text].forEach((letter, index) => {
    const glyph = letters[letter] || letters[' '];
    glyph.forEach((row, y) => [...row].forEach((bit, x) => {
      if (bit === '1') rect(context, left + (index * 4 + x) * scale, top + y * scale, scale, scale, color);
    }));
  });
}

function hash(x, y, salt = 0) {
  let value = Math.imul(x + 19, 374761393) ^ Math.imul(y + 71, 668265263) ^ Math.imul(salt + 11, 1274126177);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return (value ^ value >>> 16) >>> 0;
}

function frame(context, x, y, width, height, fill, border = ink, thickness = 2) {
  rect(context, x, y, width, height, border);
  rect(context, x + thickness, y + thickness, width - thickness * 2, height - thickness * 2, fill);
}

// Siluetas curvas construidas por filas enteras: no hay trazos suavizados.
function pixelOval(context, x, y, width, height, color) {
  for (let row = 0; row < height; row++) {
    const unitY = (row + .5 - height / 2) / (height / 2);
    const half = Math.sqrt(Math.max(0, 1 - unitY * unitY)) * width / 2;
    const inset = Math.max(0, Math.round(width / 2 - half));
    rect(context, x + inset, y + row, width - inset * 2, 1, color);
  }
}

function softBox(context, x, y, width, height, radius, color) {
  for (let row = 0; row < height; row++) {
    const corner = Math.min(row, height - 1 - row);
    const offset = corner < radius ? radius - corner - 1 : 0;
    rect(context, x + offset, y + row, width - offset * 2, 1, color);
  }
}

function woodGrain(context, x, y, width, height, seed, light = '#e8b672', dark = '#a66b3e') {
  for (let row = 3; row < height - 2; row += 5) {
    const n = hash(seed, row);
    const length = 7 + n % Math.max(8, Math.floor(width / 3));
    const start = 3 + (n >>> 6) % Math.max(1, width - length - 5);
    rect(context, x + start, y + row, length, 1, row % 2 ? dark : light);
    if (n % 3 === 0) rect(context, x + start + 3, y + row + 1, Math.max(2, length - 7), 1, light);
  }
}

function knot(context, x, y) {
  rect(context, x + 2, y, 7, 1, '#b27b45');
  rect(context, x, y + 1, 11, 1, '#b27b45');
  rect(context, x + 1, y + 2, 9, 2, '#dfa96a');
  rect(context, x + 3, y + 2, 5, 1, '#966039');
  rect(context, x + 4, y + 3, 3, 1, '#ad713d');
  rect(context, x + 2, y + 4, 7, 1, '#edbf7a');
}

function drawFloor(context) {
  rect(context, 44, 104, 744, 363, '#bc8148');
  context.save();
  context.beginPath(); context.rect(44, 104, 744, 363); context.clip();
  const tones = ['#d4a164', '#dca96b', '#ca9256', '#cf9b5c', '#d8a567'];
  for (let row = 0; row < 16; row++) {
    const y = 104 + row * 24;
    const offset = [0, 34, 68, 17][row % 4];
    for (let column = -1; column < 9; column++) {
      const x = 44 + column * 96 - offset;
      const seed = hash(column, row);
      rect(context, x, y, 96, 24, '#96613b');
      rect(context, x + 1, y + 1, 94, 22, tones[seed % tones.length]);
      rect(context, x + 1, y + 1, 94, 1, '#ebbd7e');
      rect(context, x + 1, y + 22, 94, 1, '#bc814a');
      woodGrain(context, x + 1, y + 1, 94, 21, seed, '#e2ad6b', '#bd854b');
      rect(context, x + 4, y + 5, 1, 2, '#8b5d3a'); rect(context, x + 91, y + 18, 1, 2, '#8b5d3a');
      rect(context, x + 5, y + 5, 1, 1, '#efc489'); rect(context, x + 92, y + 18, 1, 1, '#efc489');
      if (seed % 5 === 0) knot(context, x + 29 + seed % 27, y + 9);
    }
  }
  // Tres haces de luz en escalones de píxel, pintados una única vez bajo los muebles.
  [85, 290, 589].forEach(x => {
    for (let step = 0; step < 18; step++) {
      rect(context, x + step * 2, 106 + step * 4, 108, 4, '#fff0b315');
      if (step < 11) rect(context, x + 7 + step * 2, 106 + step * 4, 24, 4, '#ffe8a010');
    }
  });
  context.restore();
}

function leaf(context, x, y, size, tone) {
  const h = Math.round(size * .78);
  pixelOval(context, x, y + 2, size, h, '#3b6534');
  pixelOval(context, x + 1, y + 1, size - 2, h - 1, tone);
  pixelOval(context, x + Math.round(size * .27), y, Math.round(size * .58), Math.round(size * .6), tone);
  pixelOval(context, x + 2, y + 2, Math.max(3, Math.round(size * .5)), 3, '#b3ca6a80');
  rect(context, x + 3, y + h - 1, 3, 1, '#446f37');
  rect(context, x + 5, y + h - 2, 3, 1, '#bed477');
  rect(context, x + 8, y + h - 3, 2, 1, '#bed477');
  rect(context, x + size - 2, y + 3, 2, 2, tone);
}

function gardenWindow(context, x, y, variant) {
  frame(context, x - 6, y - 3, 126, 43, '#b57a48');
  rect(context, x - 3, y - 1, 120, 39, '#edcc90');
  rect(context, x, y + 1, 114, 32, '#a1cfc5');
  rect(context, x, y + 19, 114, 14, '#7fa45d');
  // Nubes, colinas y hojas propias: todas se mantienen dentro del vano.
  rect(context, x + 15, y + 6, 18, 4, '#e8ead0'); rect(context, x + 20, y + 3, 8, 4, '#e8ead0');
  rect(context, x + 70, y + 4, 16, 3, '#e8ead0');
  for (let i = 0; i < 7; i++) {
    const height = 9 + hash(i, variant) % 10;
    rect(context, x + i * 17, y + 33 - height, 17, height, i % 2 ? '#82aa60' : '#91b56b');
    rect(context, x + i * 17 + 3, y + 31 - height, 11, 2, '#a0bc78');
  }
  [0, 34, 81].forEach((offset, i) => {
    rect(context, x + offset + 7, y + 18, 4, 15, '#785c39');
    leaf(context, x + offset + 1, y + 15 - i % 2 * 5, 16, '#477b43');
    leaf(context, x + offset + 7, y + 12 - i % 2 * 4, 14, '#65934b');
    leaf(context, x + offset + 2, y + 10 - i % 2 * 5, 12, '#87b151');
  });
  // Reflejos escalonados y travesaños con tres tonos.
  for (let i = 0; i < 5; i++) {
    rect(context, x + 9 + i * 2, y + 3 + i * 3, 2, 4, '#edf2d780');
    rect(context, x + 66 + i * 2, y + 8 + i * 3, 2, 4, '#edf2d750');
  }
  rect(context, x + 54, y, 6, 34, '#6c4d31');
  rect(context, x + 55, y, 4, 34, '#f2ddb2');
  rect(context, x + 55, y, 1, 34, '#fff0c9');
  rect(context, x - 2, y + 17, 118, 4, '#725336'); rect(context, x, y + 17, 114, 2, '#f0d9a8');
  frame(context, x - 8, y + 33, 130, 8, '#c68c4f');
  rect(context, x - 6, y + 34, 126, 2, '#f4d49a');
  rect(context, x - 3, y + 41, 120, 3, '#7b4e3440');
}

function plant(context, x, y, scale = 1) {
  context.save(); context.translate(x, y); context.scale(scale, scale);
  pixelOval(context, -10, -1, 22, 5, '#5c3a2b44');
  const widths = [15, 15, 15, 15, 13, 13, 13, 11, 11, 11, 9, 7];
  widths.forEach((width, row) => {
    const left = Math.round(-width / 2);
    rect(context, left, -13 + row, width, 1, '#78432c');
    rect(context, left + 1, -13 + row, width - 2, 1, '#bc653e');
    if (row < 9) rect(context, left + 2, -13 + row, 2, 1, '#e49a5d');
    if (row > 1 && row < 10) rect(context, -1, -13 + row, 3, 1, '#cf7b46');
  });
  pixelOval(context, -9, -17, 19, 7, '#75432c');
  pixelOval(context, -8, -17, 17, 5, '#e49a59');
  pixelOval(context, -6, -16, 13, 3, '#573d2a');
  rect(context, -6, -13, 12, 1, '#f1b16b');
  rect(context, -1, -32, 2, 18, '#456d31');
  rect(context, -5, -29, 5, 1, '#456d31'); rect(context, 0, -34, 7, 1, '#456d31');
  const leaves = [
    [-13, -29, 12, '#4e833d'], [1, -30, 13, '#659a45'], [-7, -38, 13, '#75a641'],
    [-16, -36, 12, '#6c9e43'], [4, -40, 12, '#8bb54c'], [-6, -48, 12, '#69983f'],
    [-1, -44, 13, '#9eba52'],
  ];
  leaves.forEach(([lx, ly, size, tone]) => leaf(context, lx, ly, size, tone));
  rect(context, -1, -39, 1, 10, '#bed477');
  rect(context, 2, -33, 4, 1, '#bed477');
  context.restore();
}

function monitor(context, x, y, role) {
  pixelOval(context, x + 5, y + 26, 44, 10, '#674d3540');
  softBox(context, x, y, 47, 31, 4, '#4e3d2c');
  softBox(context, x + 1, y + 1, 45, 28, 3, '#8c8f76');
  softBox(context, x + 2, y + 2, 43, 26, 2, '#d1c7a2');
  rect(context, x + 4, y + 3, 38, 1, '#f3e5bc');
  rect(context, x + 2, y + 5, 1, 19, '#ede0b4');
  softBox(context, x + 3, y + 4, 41, 22, 2, '#405246');
  rect(context, x + 4, y + 4, 39, 21, '#2b5551');
  const sx = x + 6; const sy = y + 6;
  if (role === 'atlas') {
    rect(context, sx, sy, 35, 17, '#a7c0b2');
    rect(context, sx + 14, sy + 2, 9, 4, '#877ca5');
    rect(context, sx + 18, sy + 6, 1, 4, '#5e7d6b'); rect(context, sx + 6, sy + 9, 25, 1, '#5e7d6b');
    rect(context, sx + 5, sy + 9, 1, 3, '#5e7d6b'); rect(context, sx + 30, sy + 9, 1, 3, '#5e7d6b');
    rect(context, sx + 2, sy + 12, 10, 4, '#718d9b'); rect(context, sx + 25, sy + 12, 8, 4, '#779567');
  } else if (role === 'pixel') {
    rect(context, sx, sy, 5, 17, '#294849');
    [0, 1, 2, 3, 4].forEach(i => {
      rect(context, sx + 1, sy + i * 3, 2, 1, '#638b7d');
      rect(context, sx + 8 + i % 2 * 3, sy + 1 + i * 3, 12 + i % 3 * 3, 1, ['#a4ce85', '#8cc1b8', '#d6bb79'][i % 3]);
      if (i % 2 === 0) rect(context, sx + 23, sy + 1 + i * 3, 8, 1, '#c7a87d');
    });
  } else if (role === 'prisma') {
    rect(context, sx, sy, 25, 17, '#a4c4ba');
    rect(context, sx + 2, sy + 11, 21, 4, '#799853'); rect(context, sx + 8, sy + 7, 8, 5, '#647c8a');
    rect(context, sx + 12, sy + 5, 4, 3, '#e4d3ac'); rect(context, sx + 3, sy + 3, 3, 3, '#f0d481');
    ['#d1846a', '#bb9ac0', '#e1c46e', '#84ad70'].forEach((tone, i) => rect(context, sx + 28, sy + i * 4, 6, 3, tone));
  } else if (role === 'nodo') {
    ['#c7c79c', '#9ebba4', '#d0a07e'].forEach((tone, i) => {
      rect(context, sx + i * 12, sy, 10, 2, tone);
      rect(context, sx + i * 12, sy + 4, 10, 5 + i % 2 * 3, '#b5c7a4');
      rect(context, sx + i * 12, sy + 13, 10, 3, tone);
    });
  } else if (role === 'ux') {
    rect(context, sx, sy, 35, 17, '#d3d5ad');
    rect(context, sx + 2, sy + 2, 10, 13, '#89a999'); rect(context, sx + 4, sy + 4, 6, 5, '#e9dfb8');
    rect(context, sx + 15, sy + 2, 18, 3, '#688f82'); rect(context, sx + 15, sy + 7, 14, 1, '#8ea68c');
    rect(context, sx + 15, sy + 10, 18, 1, '#8ea68c'); rect(context, sx + 23, sy + 13, 10, 3, '#c7866a');
  } else {
    rect(context, sx, sy, 35, 17, '#c8cfaa');
    [0, 1, 2].forEach(i => {
      rect(context, sx + 2, sy + 2 + i * 5, 4, 3, '#69895a');
      rect(context, sx + 3, sy + 3 + i * 5, 1, 1, '#e1e7b6');
      rect(context, sx + 5, sy + 2 + i * 5, 1, 1, '#e1e7b6');
      rect(context, sx + 10, sy + 3 + i * 5, 19 - i * 3, 1, '#728e69');
    });
  }
  // Reflejo de cristal escalonado, bisel inferior y pie de forma redondeada.
  rect(context, x + 5, y + 5, 9, 1, '#f2f2ca60');
  rect(context, x + 5, y + 6, 6, 2, '#f2f2ca30');
  rect(context, x + 40, y + 7, 2, 9, '#d5e3bc35');
  rect(context, x + 39, y + 26, 2, 2, '#88a95d');
  rect(context, x + 21, y + 27, 5, 1, '#857d60');
  softBox(context, x + 20, y + 30, 7, 6, 2, '#6c6e55');
  rect(context, x + 21, y + 30, 2, 4, '#b0ac89');
  pixelOval(context, x + 10, y + 33, 29, 5, '#675740');
  pixelOval(context, x + 12, y + 33, 25, 3, '#b5b28c');
  rect(context, x + 17, y + 34, 15, 1, '#d8d2a5');
}

function book(context, x, y, cover, vertical = false) {
  const width = vertical ? 7 : 23; const height = vertical ? 20 : 16;
  softBox(context, x + 1, y + 2, width, height, 2, '#6a493530');
  softBox(context, x, y, width, height, 2, ink);
  rect(context, x + 1, y + 1, width - 2, height - 3, cover);
  rect(context, x + 2, y + height - 5, width - 3, 3, '#e4d1a5');
  rect(context, x + 3, y + height - 4, width - 4, 1, '#baa27b');
  rect(context, x + 1, y + 1, 2, height - 3, '#f2d5a175');
  rect(context, x + 3, y + 1, width - 5, 1, '#f2d5a145');
  rect(context, x + 2, y + height - 2, width - 2, 1, cover);
  if (!vertical) {
    rect(context, x + 5, y + 3, width - 10, 1, '#edd6a8');
    rect(context, x + 6, y + 6, width - 12, 1, '#edd6a8');
    rect(context, x + width - 7, y + height - 4, 2, 5, '#b76353');
  } else {
    rect(context, x + 2, y + 4, 3, 1, '#f2dca9');
    rect(context, x + 2, y + 12, 3, 1, '#f2dca9');
  }
}

function ceramicMug(context, x, y, glaze) {
  pixelOval(context, x - 2, y + 11, 18, 5, '#79513a35');
  pixelOval(context, x - 2, y + 10, 17, 4, '#e5c38c');
  pixelOval(context, x + 8, y + 2, 8, 9, ink);
  pixelOval(context, x + 9, y + 3, 6, 7, glaze);
  pixelOval(context, x + 11, y + 4, 3, 4, '#dba567');
  softBox(context, x, y + 2, 12, 11, 3, ink);
  softBox(context, x + 1, y + 3, 10, 9, 3, glaze);
  rect(context, x + 2, y + 5, 2, 5, '#ffdfab70');
  pixelOval(context, x - 1, y, 14, 5, '#e5c99a');
  pixelOval(context, x + 1, y + 1, 10, 3, '#75432a');
  pixelOval(context, x + 3, y + 1, 6, 2, '#a56c3e');
  rect(context, x + 2, y + 1, 3, 1, '#edc487');
}

function roleTools(context, x, y, role) {
  // Todos estos útiles viven sobre la mesa, sin ocupar nuevos pasos del mapa.
  if (role === 'atlas') {
    softBox(context, x + 9, y + 23, 25, 21, 2, '#846143');
    rect(context, x + 10, y + 24, 23, 17, '#e9d9ae');
    rect(context, x + 12, y + 25, 19, 14, '#9cbdb0');
    [0, 1, 2].forEach(i => rect(context, x + 14, y + 28 + i * 4, 15, 1, '#c8dcc2'));
    rect(context, x + 16, y + 27, 1, 11, '#c8dcc2'); rect(context, x + 26, y + 27, 1, 11, '#c8dcc2');
    rect(context, x + 19, y + 30, 7, 6, '#5d897f'); rect(context, x + 21, y + 32, 3, 2, '#c4d8ba');
    pixelOval(context, x + 31, y + 21, 6, 5, '#f3e2b8'); rect(context, x + 32, y + 23, 5, 16, '#e3c997');
    pixelOval(context, x + 31, y + 37, 6, 4, '#b99e70');
  } else if (role === 'pixel') {
    softBox(context, x + 9, y + 25, 28, 18, 3, '#785945');
    softBox(context, x + 11, y + 27, 24, 14, 2, '#a1805a');
    rect(context, x + 14, y + 27, 3, 8, '#536759');
    rect(context, x + 14, y + 34, 3, 5, '#c47b5e'); rect(context, x + 15, y + 27, 1, 8, '#c8cfb0');
    rect(context, x + 23, y + 31, 2, 9, '#b8c7b2');
    pixelOval(context, x + 20, y + 27, 7, 6, '#d9d9b4'); rect(context, x + 22, y + 27, 3, 2, '#a1805a');
    pixelOval(context, x + 29, y + 30, 5, 5, '#4c6256'); rect(context, x + 31, y + 31, 1, 2, '#d0ca9b');
  } else if (role === 'prisma') {
    softBox(context, x + 8, y + 19, 24, 17, 2, '#78583b');
    rect(context, x + 9, y + 20, 22, 14, '#f1dfb1');
    rect(context, x + 13, y + 23, 14, 7, '#adc28b'); rect(context, x + 17, y + 25, 6, 5, '#d59d7a');
    pixelOval(context, x + 10, y + 32, 25, 12, '#815836');
    pixelOval(context, x + 11, y + 32, 23, 10, '#dfb47a');
    pixelOval(context, x + 27, y + 35, 4, 4, '#8c6241');
    [[14, 35, '#c76754'], [19, 33, '#7f9e59'], [24, 33, '#7a9cb5'], [19, 38, '#a087b2']].forEach(([dx, dy, tone]) => pixelOval(context, x + dx, y + dy, 3, 3, tone));
    rect(context, x + 34, y + 19, 1, 16, '#785239'); rect(context, x + 33, y + 17, 3, 5, '#ae7350');
    rect(context, x + 37, y + 24, 1, 13, '#b58a51'); rect(context, x + 36, y + 22, 3, 4, '#748f65');
  } else if (role === 'ux') {
    softBox(context, x + 10, y + 22, 26, 22, 3, '#5a5948');
    softBox(context, x + 12, y + 24, 22, 17, 2, '#e2d6ac');
    rect(context, x + 14, y + 26, 7, 12, '#8fae9d'); rect(context, x + 23, y + 26, 8, 2, '#688c7b');
    rect(context, x + 23, y + 31, 7, 1, '#b2b58f'); rect(context, x + 25, y + 35, 6, 3, '#d38e70');
    rect(context, x + 22, y + 42, 3, 1, '#b8b292');
    for (let i = 0; i < 11; i++) rect(context, x + 37 + Math.floor(i / 4), y + 25 + i, 1, 1, '#e4d9ae');
  } else if (role === 'nodo') {
    softBox(context, x + 9, y + 23, 28, 21, 2, '#725f3d');
    rect(context, x + 10, y + 24, 12, 17, '#eee0b5'); rect(context, x + 23, y + 24, 12, 17, '#dfcea1');
    rect(context, x + 22, y + 24, 1, 18, '#a9946a');
    [0, 1, 2].forEach(i => {
      rect(context, x + 12, y + 27 + i * 4, 8, 1, '#a9ae87');
      rect(context, x + 26, y + 28 + i * 4, 7, 1, '#a9ae87');
    });
    rect(context, x + 26, y + 23, 2, 5, '#c77e61');
    rect(context, x + 34, y + 28, 3, 3, '#9fb375'); rect(context, x + 34, y + 33, 3, 3, '#d4b46b');
  } else {
    book(context, x + 9, y + 27, '#bfa167');
    pixelOval(context, x + 22, y + 21, 12, 11, '#6c5137');
    pixelOval(context, x + 23, y + 22, 10, 9, '#c4b274');
    pixelOval(context, x + 24, y + 23, 8, 7, '#91b3a3');
    rect(context, x + 25, y + 24, 3, 1, '#e5e7bd'); rect(context, x + 25, y + 25, 1, 2, '#e5e7bd');
    for (let i = 0; i < 6; i++) {
      rect(context, x + 31 + Math.floor(i / 2), y + 30 + i, 3, 1, '#74513a');
      rect(context, x + 32 + Math.floor(i / 2), y + 30 + i, 1, 1, '#ba8a53');
    }
  }
}

function desk(context, item) {
  const { x, y, id } = item;
  rect(context, x + 5, y + 14, 134, 56, '#57392535');
  // Patas y travesaño: la silueta de mesa conserva los 134 x 56 originales.
  [6, 118].forEach(offset => {
    frame(context, x + offset, y + 44, 10, 24, wood.shade);
    rect(context, x + offset + 2, y + 47, 3, 18, '#d49656');
    rect(context, x + offset + 6, y + 48, 2, 17, '#8d5636');
  });
  softBox(context, x, y, 134, 56, 3, ink);
  softBox(context, x + 1, y + 1, 132, 53, 2, wood.shade);
  rect(context, x + 2, y + 2, 130, 43, '#dba567');
  rect(context, x + 2, y + 2, 130, 2, '#f4d18e');
  rect(context, x + 2, y + 44, 130, 3, '#b97741');
  rect(context, x + 3, y + 47, 128, 2, '#e7af69');
  [16, 31].forEach(offset => {
    rect(context, x + 3, y + offset, 128, 1, '#bf8147');
    rect(context, x + 3, y + offset + 1, 128, 1, '#e6b374');
  });
  woodGrain(context, x + 3, y + 4, 128, 40, x + y, '#edbe7b', '#c48a4d');
  knot(context, x + 93, y + 8);
  // Cajones pequeños, herrajes y cantos gastados.
  [8, 99].forEach(offset => {
    frame(context, x + offset, y + 48, 28, 7, '#b87a43', '#80502f', 1);
    rect(context, x + offset + 2, y + 49, 24, 1, '#e0a360');
    pixelOval(context, x + offset + 10, y + 50, 9, 4, '#65452d');
    pixelOval(context, x + offset + 11, y + 50, 7, 2, '#ddbc6a');
  });
  monitor(context, x + 43, y + 6, id);
  // Teclado, mouse y taza de cerámica.
  frame(context, x + 43, y + 44, 49, 6, '#a5a58a', '#6a654a', 1);
  for (let key = 0; key < 13; key++) rect(context, x + 46 + key * 3, y + 46, 2, 1, '#ded7b1');
  rect(context, x + 53, y + 48, 22, 1, '#d9d0aa');
  pixelOval(context, x + 97, y + 42, 9, 9, '#6a654a');
  pixelOval(context, x + 98, y + 42, 7, 7, '#b3b795');
  rect(context, x + 101, y + 43, 1, 2, '#e1dcb6');
  ceramicMug(context, x + 110, y + 27, { atlas: '#ac8fb4', pixel: '#80a7a2', prisma: '#ce8468', nodo: '#9cad6d', ux: '#d6c18c', lupa: '#d6a160' }[id]);
  roleTools(context, x, y, id);
  // Cartel de especialidad separado de la placa de nombre.
  frame(context, x + 5, y - 22, 124, 14, '#edcf94', '#855734', 1);
  rect(context, x + 7, y - 21, 120, 1, '#f7dfac');
  bitmapText(context, item.role, x + 67, y - 17, '#69452d');
}

function chair(context, x, y, upholstery) {
  pixelOval(context, x - 16, y + 7, 34, 10, '#5b3c2b30');
  softBox(context, x - 14, y - 24, 29, 23, 4, ink);
  softBox(context, x - 13, y - 23, 27, 21, 4, wood.shade);
  softBox(context, x - 12, y - 22, 25, 19, 4, '#6a4c36');
  softBox(context, x - 11, y - 21, 23, 17, 4, upholstery);
  rect(context, x - 8, y - 20, 17, 2, '#f0dfb448');
  rect(context, x - 10, y - 17, 1, 10, '#eddfb550');
  rect(context, x - 8, y - 6, 17, 1, '#4a4a3540');
  [-4, 4].forEach(offset => {
    rect(context, x + offset, y - 13, 2, 2, '#60493150');
    rect(context, x + offset, y - 13, 1, 1, '#f0dfb480');
  });
  for (let i = 0; i < 5; i++) {
    rect(context, x - 9 + i * 4, y - 17, 1, 1, '#e0dab482');
    rect(context, x - 9 + i * 4, y - 8, 1, 1, '#e0dab482');
  }
  softBox(context, x - 14, y - 2, 29, 11, 4, ink);
  softBox(context, x - 13, y - 2, 27, 9, 4, wood.shade);
  softBox(context, x - 11, y - 2, 23, 9, 3, upholstery);
  rect(context, x - 8, y - 1, 17, 1, '#e4d7aa50');
  rect(context, x - 9, y + 5, 19, 1, '#594b3540');
  softBox(context, x - 15, y - 6, 5, 10, 2, ink);
  softBox(context, x + 11, y - 6, 5, 10, 2, ink);
  rect(context, x - 14, y - 6, 3, 2, '#c29155'); rect(context, x + 12, y - 6, 3, 2, '#c29155');
  rect(context, x - 2, y + 9, 5, 9, ink); rect(context, x - 1, y + 10, 2, 7, '#9b7949');
  rect(context, x - 10, y + 17, 21, 3, ink); rect(context, x - 10, y + 17, 21, 1, '#ae8650');
  rect(context, x - 12, y + 19, 4, 3, '#47392b'); rect(context, x + 9, y + 19, 4, 3, '#47392b');
}

function rug(context) {
  const x = 325; const y = 270; const width = 183; const height = 127;
  rect(context, x + 3, y + 4, width + 2, height + 2, '#63432e24');
  frame(context, x, y, width, height, '#b4674c', '#795239', 2);
  rect(context, x + 4, y + 4, width - 8, height - 8, '#e2bb7e');
  rect(context, x + 9, y + 9, width - 18, height - 18, '#bb7753');
  rect(context, x + 13, y + 13, width - 26, height - 26, '#d89b67');
  for (let row = 0; row < 29; row++) rect(context, x + 13, y + 14 + row * 3, width - 26, 1, row % 2 ? '#e6b47a44' : '#ac6e4833');
  for (let i = 0; i < 20; i++) {
    const px = x + 12 + i * 8;
    rect(context, px, y - 3, 2, 4, '#d8c08b'); rect(context, px + 1, y + height - 1, 2, 4, '#d8c08b');
    rect(context, px, y + 5, 3, 3, '#9f6845'); rect(context, px, y + height - 8, 3, 3, '#9f6845');
  }
  for (let i = 0; i < 12; i++) {
    rect(context, x + 5, y + 13 + i * 8, 3, 3, '#9f6845');
    rect(context, x + width - 8, y + 13 + i * 8, 3, 3, '#9f6845');
  }
  // Rombo geométrico tejido original, parcialmente cubierto por la mesa UX.
  for (let row = 0; row < 9; row++) {
    const half = 4 - Math.abs(4 - row);
    rect(context, 416 - half * 4, y + 38 + row * 4, half * 8 + 4, 4, '#ebca92');
  }
}

function shelf(context) {
  const x = 449; const y = 97;
  rect(context, x + 4, y + 7, 96, 28, '#61412f38');
  frame(context, x, y, 96, 33, '#9e673d');
  rect(context, x + 3, y + 4, 90, 23, '#b4824b');
  frame(context, x - 2, y - 1, 100, 6, '#d7a064');
  rect(context, x, y, 96, 1, '#efc586');
  frame(context, x + 4, y + 6, 48, 21, '#775135', '#71482f', 1);
  ['#929b67', '#bb865f', '#7d9e96', '#ae8eab', '#cca45d'].forEach((tone, i) => book(context, x + 8 + i * 8, y + 7, tone, true));
  frame(context, x + 61, y + 4, 24, 23, '#425b49', ink, 1);
  rect(context, x + 63, y + 6, 20, 4, '#6f8770'); rect(context, x + 66, y + 12, 14, 8, '#313d33');
  rect(context, x + 77, y + 7, 3, 2, '#d6b96d');
  rect(context, x + 70, y + 18, 8, 7, '#e3bf86'); rect(context, x + 71, y + 19, 6, 1, '#6d4b30');
  rect(context, x + 65, y + 26, 18, 2, '#c6b084');
  rect(context, x + 3, y + 29, 90, 2, '#d8a269');
}

function wallArt(context, x, y, variant) {
  frame(context, x + 2, y + 3, 25, 31, '#e7cd98', '#704a30');
  rect(context, x + 4, y + 5, 21, 1, '#f5d9a1');
  frame(context, x + 6, y + 8, 17, 20, variant ? '#b8c5a1' : '#dfc080', '#aa794a', 1);
  if (variant) {
    rect(context, x + 8, y + 18, 13, 8, '#7b9b63'); rect(context, x + 10, y + 13, 3, 7, '#46784a');
    rect(context, x + 15, y + 11, 4, 9, '#5e894c');
  } else {
    rect(context, x + 10, y + 12, 8, 8, '#ca8664'); rect(context, x + 8, y + 22, 13, 2, '#b18b53');
  }
}

function exteriorAndWalls(context) {
  rect(context, 0, 0, WIDTH, HEIGHT, '#344633');
  // El marco exterior deja visibles sólo un borde de jardín y la senda de entrada.
  for (let i = 0; i < 19; i++) {
    const x = hash(i, 7) % WIDTH; const y = hash(i, 14) % 35;
    rect(context, x, y, 4 + i % 4, 2, '#566947');
    rect(context, x + 2, y - 2, 2, 2, '#71844e');
  }
  [8, 810].forEach((x, column) => {
    for (let i = 0; i < 8; i++) leaf(context, x, 54 + i * 52, 14, i % 2 ? '#48643b' : '#527241');
  });
  frame(context, 23, 44, 786, 446, '#8b5c38', '#2e3021', 3);
  rect(context, 29, 48, 774, 432, '#b67b45');
  rect(context, 34, 54, 764, 51, '#efdbac');
  rect(context, 44, 60, 744, 35, '#f4e2ba');
  for (let x = 49; x < 785; x += 17) {
    rect(context, x, 62, 1, 32, '#ddc398');
    if (hash(x, 2) % 3 === 0) rect(context, x + 4, 72, 1, 12, '#e7cfaa');
  }
  frame(context, 32, 49, 768, 11, wood.shade);
  rect(context, 35, 51, 762, 2, '#dca464');
  woodGrain(context, 35, 51, 762, 6, 11, '#c18a50', '#8f5d35');
  frame(context, 34, 97, 764, 9, '#aa713f');
  rect(context, 36, 98, 760, 2, '#dbab69');
  [34, 788].forEach(x => {
    rect(context, x, 105, 10, 362, ink);
    rect(context, x + 2, 105, 6, 361, '#9d673c');
    rect(context, x + 2, 106, 2, 359, '#cf9657');
    for (let y = 122; y < 460; y += 46) rect(context, x + 3, y, 3, 1, '#805033');
  });
  frame(context, 34, 466, 764, 14, '#986137');
  rect(context, 36, 467, 760, 3, '#d79b5a'); rect(context, 36, 476, 760, 2, '#65402b');
  // Senda exterior de piedra con pequeñas juntas y musgo.
  rect(context, 368, 480, 96, 32, '#77785d');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const x = 369 + col * 20 - row % 2 * 7;
    frame(context, x, 482 + row * 11, 19, 10, row % 2 ? '#aaa482' : '#969779', '#626c52', 1);
    rect(context, x + 2, 483 + row * 11, 12, 1, '#c2b991');
  }
  rect(context, 363, 482, 5, 3, '#71964a'); rect(context, 461, 502, 5, 4, '#799a4b');
}

function drawStatic(context) {
  context.imageSmoothingEnabled = false;
  exteriorAndWalls(context);
  drawFloor(context);
  // Zócalos interiores y sombras de pared sobre el roble.
  rect(context, 44, 105, 744, 4, '#76503260');
  rect(context, 44, 109, 744, 2, '#a9734540');
  rect(context, 44, 105, 3, 361, '#61432f40');
  gardenWindow(context, 84, 58, 0); gardenWindow(context, 289, 58, 1); gardenWindow(context, 588, 58, 2);
  frame(context, 457, 62, 79, 29, '#dcb77c');
  rect(context, 461, 66, 71, 21, '#f0dfb5');
  rect(context, 463, 68, 67, 1, '#fff0cc');
  bitmapText(context, 'MAKE / PLAY', 496, 74, '#865534');
  rect(context, 464, 81, 12, 1, '#c4a36e'); rect(context, 517, 81, 12, 1, '#c4a36e');
  shelf(context);
  rug(context);
  deskLayout.forEach(item => desk(context, item));
  deskLayout.forEach(item => chair(context, item.chairX, item.chairY, item.upholstery));
  // Separadores finos en sus posiciones originales; no ocupan nuevos pasillos.
  [250, 548].forEach(x => {
    frame(context, x, 124, 4, 102, '#bd8a51', '#805431', 1);
    rect(context, x + 1, 126, 1, 97, '#ebbd7c');
    [144, 190, 220].forEach(y => rect(context, x + 1, y, 1, 2, '#62422a'));
  });
  plant(context, 67, 161); plant(context, 765, 165, 1.5);
  plant(context, 69, 442, 1.5); plant(context, 763, 442, 1.5);
  wallArt(context, 54, 278, false); wallArt(context, 749, 264, true);
  // Alfombrilla de entrada cálida y sello de estudio, ambos transitables.
  frame(context, 366, 454, 100, 21, '#8f754c', '#62432b', 2);
  rect(context, 371, 457, 90, 15, '#c5b37b');
  for (let i = 0; i < 22; i++) rect(context, 373 + i * 4, 459, 1, 11, '#8b80524d');
  bitmapText(context, 'ENTRADA', 416, 462, '#69502f');
  bitmapText(context, 'HERMES', 416, 241, '#8b603b', 2);
  bitmapText(context, 'GAME STUDIO', 416, 255, '#997046');
}

function getStaticLayer(context) {
  if (staticLayer) return staticLayer;
  if (typeof OffscreenCanvas === 'function') staticLayer = new OffscreenCanvas(WIDTH, HEIGHT);
  else {
    staticLayer = context.canvas.ownerDocument.createElement('canvas');
    staticLayer.width = WIDTH; staticLayer.height = HEIGHT;
  }
  drawStatic(staticLayer.getContext('2d'));
  return staticLayer;
}

/** Capa de materiales cacheada; sólo nombres y selección se actualizan por frame. */
export function drawStudioRoom(context, { agents = [], selected = null, colors = {} } = {}) {
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(getStaticLayer(context), 0, 0);
  deskLayout.forEach(item => {
    const owner = agents.find(agent => agent.id === item.id);
    const color = colors[item.id] || owner?.color || '#e7cf9c';
    // En un extremo del canto, para que la cabeza del ocupante no tape el nombre.
    frame(context, item.x + 2, item.y + 51, 50, 16, '#4b4531', ink, 1);
    rect(context, item.x + 4, item.y + 52, 46, 1, '#a99561');
    rect(context, item.x + 4, item.y + 64, 46, 1, '#302e23');
    const name = owner?.name || item.name;
    bitmapText(context, name, item.x + 27, item.y + 54, '#f1dfb1', String(name).length > 6 ? 1 : 2);
    if (selected === item.id) {
      rect(context, item.x - 5, item.y + 55, 5, 6, ink);
      rect(context, item.x - 4, item.y + 55, 3, 5, color);
      rect(context, item.x - 3, item.y + 54, 1, 1, '#fff0c7');
    }
  });
  context.restore();
}
