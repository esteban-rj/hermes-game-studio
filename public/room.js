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
  rect(context, x + 2, y, size - 4, 2, tone);
  rect(context, x, y + 2, size, Math.max(2, size - 4), tone);
  rect(context, x + 2, y + size - 2, size - 4, 2, tone);
  rect(context, x + 2, y + 2, Math.max(2, size - 5), 1, '#a6c460');
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
  rect(context, -9, 0, 20, 3, '#5c3a2b44');
  rect(context, -7, -13, 15, 13, ink);
  rect(context, -6, -12, 13, 10, '#b65f3b');
  rect(context, -4, -11, 8, 10, '#d47a48');
  rect(context, -3, -9, 2, 6, '#e39759');
  rect(context, -8, -16, 17, 5, ink);
  rect(context, -7, -15, 15, 3, '#dc8a4d');
  rect(context, -5, -15, 11, 2, '#573d2a');
  rect(context, -1, -34, 2, 21, '#3e652f');
  const leaves = [
    [-11, -30, 11, '#467c39'], [1, -32, 12, '#538b3d'], [-7, -40, 12, '#75a641'],
    [-16, -37, 12, '#679a3e'], [5, -41, 11, '#8bb54c'], [-5, -49, 12, '#69983f'],
    [-1, -44, 12, '#a3be58'],
  ];
  leaves.forEach(([lx, ly, size, tone]) => leaf(context, lx, ly, size, tone));
  rect(context, -1, -44, 1, 15, '#c0cc70');
  rect(context, 7, -38, 5, 1, '#c0cc70');
  context.restore();
}

function monitor(context, x, y, role) {
  rect(context, x + 3, y + 4, 47, 30, '#674d3544');
  frame(context, x, y, 47, 30, '#343c39');
  rect(context, x + 2, y + 2, 43, 1, '#6c7766');
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
  rect(context, x + 39, y + 27, 2, 1, '#9ac56a');
  rect(context, x + 20, y + 30, 7, 5, ink);
  rect(context, x + 21, y + 30, 4, 4, '#647364');
  rect(context, x + 11, y + 34, 27, 3, ink);
  rect(context, x + 13, y + 34, 23, 1, '#82917a');
}

function book(context, x, y, cover, vertical = false) {
  const width = vertical ? 7 : 23; const height = vertical ? 20 : 16;
  frame(context, x, y, width, height, cover, ink, 1);
  rect(context, x + 2, y + height - 4, width - 3, 2, '#ecdbb1');
  rect(context, x + 1, y + 1, 1, height - 3, '#f2d5a175');
  if (!vertical) {
    rect(context, x + 5, y + 4, width - 10, 1, '#edd6a8');
    rect(context, x + 7, y + 7, width - 14, 1, '#edd6a8');
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
  frame(context, x, y, 134, 56, wood.shade);
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
    rect(context, x + offset + 11, y + 51, 7, 2, '#65452d');
    rect(context, x + offset + 12, y + 51, 5, 1, '#ddbc6a');
  });
  monitor(context, x + 43, y + 6, id);
  // Teclado, mouse y taza de cerámica.
  frame(context, x + 43, y + 44, 49, 6, '#a5a58a', '#6a654a', 1);
  for (let key = 0; key < 13; key++) rect(context, x + 46 + key * 3, y + 46, 2, 1, '#ded7b1');
  rect(context, x + 53, y + 48, 22, 1, '#d9d0aa');
  frame(context, x + 98, y + 42, 7, 8, '#a5ac8c', '#6a654a', 1);
  rect(context, x + 101, y + 43, 1, 2, '#d9d6ae');
  rect(context, x + 111, y + 39, 14, 4, '#75493240');
  frame(context, x + 110, y + 27, 11, 13, '#d99358', ink, 1);
  frame(context, x + 120, y + 30, 5, 7, '#e0a769', ink, 1);
  rect(context, x + 121, y + 32, 2, 3, '#c58a51');
  rect(context, x + 111, y + 27, 9, 3, '#f2d49c'); rect(context, x + 113, y + 28, 5, 1, '#6c422b');
  rect(context, x + 112, y + 31, 2, 6, '#ecc086');
  if (id === 'prisma') {
    frame(context, x + 10, y + 21, 24, 23, '#f2dfae', '#906039', 1);
    rect(context, x + 13, y + 24, 18, 12, '#a4b57a'); rect(context, x + 16, y + 27, 8, 6, '#d69474');
    ['#d88568', '#7f9d65', '#8da5b3', '#b49ab7'].forEach((tone, i) => rect(context, x + 13 + i * 5, y + 39, 3, 3, tone));
    rect(context, x + 28, y + 15, 1, 13, '#755237'); rect(context, x + 27, y + 14, 3, 4, '#bd7762');
  } else if (id === 'ux') {
    frame(context, x + 11, y + 23, 24, 20, '#e9d6a9', '#8d6542', 1);
    rect(context, x + 14, y + 26, 8, 12, '#8daca0'); rect(context, x + 25, y + 26, 6, 3, '#c98b6a');
    rect(context, x + 25, y + 32, 6, 1, '#a4916c'); rect(context, x + 25, y + 35, 6, 1, '#a4916c');
  } else {
    book(context, x + 11, y + 27, { atlas: '#9a7ba0', pixel: '#6b92a1', nodo: '#8b9e63', lupa: '#c09652' }[id]);
    rect(context, x + 20, y + 21, 16, 2, '#7a5736'); rect(context, x + 33, y + 20, 4, 2, '#d0a45e');
  }
  // Cartel de especialidad separado de la placa de nombre.
  frame(context, x + 5, y - 22, 124, 14, '#edcf94', '#855734', 1);
  rect(context, x + 7, y - 21, 120, 1, '#f7dfac');
  bitmapText(context, item.role, x + 67, y - 17, '#69452d');
}

function chair(context, x, y, upholstery) {
  rect(context, x - 15, y + 7, 32, 8, '#5b3c2b30');
  frame(context, x - 14, y - 24, 29, 23, wood.shade);
  frame(context, x - 11, y - 21, 23, 16, upholstery, '#6a4c36', 1);
  rect(context, x - 9, y - 19, 19, 1, '#e4d7aa60');
  rect(context, x - 9, y - 7, 19, 1, '#4a4a3530');
  for (let i = 0; i < 5; i++) {
    rect(context, x - 9 + i * 4, y - 17, 1, 1, '#e0dab482');
    rect(context, x - 9 + i * 4, y - 8, 1, 1, '#e0dab482');
  }
  frame(context, x - 14, y - 2, 29, 11, wood.shade);
  rect(context, x - 11, y - 1, 23, 6, upholstery); rect(context, x - 10, y, 20, 1, '#e4d7aa50');
  rect(context, x - 11, y + 6, 23, 1, '#594b353b');
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
