// Avatar pixel art derivado de la referencia visual del usuario.
// Sólo se conservan decisiones de dibujo; no se incorpora la fotografía.
const palette = Object.freeze({
  skin: '#c18e6b', skinLight: '#d5a17c', skinShade: '#a87355',
  beard: '#393732', beardLight: '#51483d', brow: '#2c2b27',
  cap: '#202729', capLight: '#343d3e', capDark: '#141c1d',
  strap: '#a39c76', buckle: '#c3ba8d',
  shirt: '#303737', shirtShade: '#242e2e', shirtLight: '#3b4442',
  trousers: '#48534f', trouserShade: '#374641', shoes: '#24332e',
});

function pixel(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function legs(context, stride, side) {
  // Pantalón y zapatos son decisiones de diseño, no detalles observados en la foto.
  const first = stride > 0 ? 1 : 0;
  const second = stride < 0 ? 1 : 0;
  if (side) {
    pixel(context, -3 - stride, -5, 3, 5 + first, palette.trouserShade);
    pixel(context, 1 + stride, -5, 3, 5 + second, palette.trousers);
    pixel(context, -3 - stride, -1 + first, 4, 2, palette.shoes);
    pixel(context, 1 + stride, -1 + second, 5, 2, palette.shoes);
    return;
  }
  pixel(context, -4, -5, 3, 5 + first, palette.trouserShade);
  pixel(context, 2, -5, 3, 5 + second, palette.trousers);
  pixel(context, -5, -1 + first, 4, 2, palette.shoes);
  pixel(context, 2, -1 + second, 4, 2, palette.shoes);
}

function arm(context, x, swing, shade) {
  pixel(context, x, -11 + swing, 2, 4, shade);
  pixel(context, x, -7 + swing, 2, 3, palette.skin);
  pixel(context, x, -5 + swing, 1, 1, palette.skinShade);
}

function front(context, stride) {
  legs(context, stride, false);
  arm(context, -7, stride, palette.shirtShade);
  arm(context, 6, -stride, palette.shirtLight);
  pixel(context, -5, -12, 11, 8, palette.shirt);
  pixel(context, -5, -6, 2, 2, palette.shirtShade);
  // Cuello V liso, sin letras ni dibujo en la camiseta.
  pixel(context, -2, -12, 5, 2, palette.skin);
  pixel(context, -1, -10, 3, 1, palette.skinShade);
  pixel(context, 0, -9, 1, 1, palette.skinShade);
  pixel(context, -5, -19, 11, 7, palette.skin);
  pixel(context, -4, -18, 8, 4, palette.skinLight);
  pixel(context, -6, -17, 1, 3, palette.skinShade);
  pixel(context, 6, -17, 1, 3, palette.skin);
  // Cejas y ojos oscuros; barba y bigote cortos con un píxel de labio.
  pixel(context, -4, -17, 3, 1, palette.brow);
  pixel(context, 2, -17, 3, 1, palette.brow);
  pixel(context, -3, -16, 1, 1, palette.brow);
  pixel(context, 3, -16, 1, 1, palette.brow);
  pixel(context, 0, -15, 1, 1, palette.skinShade);
  pixel(context, -5, -15, 2, 3, palette.beard);
  pixel(context, 4, -15, 2, 3, palette.beard);
  pixel(context, -2, -14, 5, 1, palette.beard);
  pixel(context, -3, -12, 7, 2, palette.beard);
  pixel(context, -1, -13, 3, 1, palette.skinShade);
  pixel(context, -2, -11, 1, 1, palette.beardLight);
  pixel(context, 2, -11, 1, 1, palette.beardLight);
  // Gorra hacia atrás: abertura sobre la frente y correa oliva/beige visible.
  pixel(context, -4, -23, 9, 2, palette.cap);
  pixel(context, -5, -22, 11, 3, palette.cap);
  pixel(context, -2, -21, 5, 2, palette.skinLight);
  pixel(context, -6, -21, 2, 4, palette.capDark);
  pixel(context, 5, -21, 2, 4, palette.capDark);
  pixel(context, -5, -19, 11, 1, palette.strap);
  pixel(context, -4, -20, 9, 1, palette.strap);
  pixel(context, -5, -20, 2, 1, palette.buckle);
  pixel(context, -6, -19, 1, 3, palette.strap);
  pixel(context, -3, -23, 6, 1, palette.capLight);
}

function back(context, stride) {
  legs(context, stride, false);
  arm(context, -7, stride, palette.shirtShade);
  arm(context, 6, -stride, palette.shirtLight);
  pixel(context, -5, -12, 11, 8, palette.shirt);
  pixel(context, -3, -11, 7, 1, palette.shirtLight);
  pixel(context, -1, -12, 3, 1, palette.skinShade);
  pixel(context, -4, -19, 9, 7, palette.beard);
  pixel(context, -5, -17, 1, 3, palette.skinShade);
  pixel(context, 5, -17, 1, 3, palette.skin);
  pixel(context, -3, -14, 7, 2, palette.skinShade);
  // La visera orientada atrás se ve desde esta vista; la correa frontal queda oculta.
  pixel(context, -5, -23, 11, 5, palette.cap);
  pixel(context, -4, -24, 9, 1, palette.capLight);
  pixel(context, -7, -21, 15, 2, palette.capDark);
  pixel(context, -6, -21, 13, 1, palette.capLight);
  pixel(context, 0, -23, 1, 3, palette.capLight);
}

function right(context, stride) {
  legs(context, stride, true);
  arm(context, -4 - stride, -1, palette.shirtShade);
  pixel(context, -4, -12, 8, 8, palette.shirt);
  pixel(context, 2, -12, 2, 2, palette.skinShade);
  pixel(context, 3, -10, 1, 1, palette.skinShade);
  arm(context, -1 + stride, 0, palette.shirtLight);
  pixel(context, -3, -19, 8, 7, palette.skin);
  pixel(context, 1, -18, 4, 4, palette.skinLight);
  pixel(context, 5, -16, 1, 2, palette.skin);
  pixel(context, -4, -17, 2, 3, palette.skinShade);
  pixel(context, -3, -16, 1, 1, palette.skinLight);
  pixel(context, 2, -17, 3, 1, palette.brow);
  pixel(context, 3, -16, 1, 1, palette.brow);
  pixel(context, -2, -15, 2, 3, palette.beard);
  pixel(context, 3, -14, 3, 1, palette.beard);
  pixel(context, -1, -12, 6, 2, palette.beard);
  pixel(context, 4, -13, 1, 1, palette.skinShade);
  // Perfil: visera negra hacia atrás, detrás de la oreja.
  pixel(context, -4, -23, 8, 4, palette.cap);
  pixel(context, -3, -23, 5, 1, palette.capLight);
  pixel(context, -5, -21, 2, 4, palette.capDark);
  pixel(context, -8, -20, 4, 2, palette.capDark);
  pixel(context, -7, -20, 3, 1, palette.capLight);
  pixel(context, 2, -20, 3, 1, palette.strap);
  pixel(context, 3, -19, 2, 1, palette.buckle);
}

/** Dibuja el avatar personal en la misma cuadrícula y escala de los NPC. */
export function drawPlayerAvatar(context, x, y, { facing = 'down', step = 0, scale = 2 } = {}) {
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.scale(scale, scale);
  pixel(context, -6, 0, 13, 2, '#31483655');
  const stride = step ? Math.round(Math.sin(step) * 1.2) : 0;
  if (facing === 'left') context.scale(-1, 1);
  if (facing === 'up') back(context, stride);
  else if (facing === 'right' || facing === 'left') right(context, stride);
  else front(context, stride);
  context.restore();
}
