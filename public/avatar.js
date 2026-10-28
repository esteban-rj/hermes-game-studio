import { drawPersonalCharacter } from './characters.js';

// El personaje derivado usa la misma cuadrícula, luz y contorno que los agentes.
// La referencia original permanece fuera del proyecto; el cuerpo se completa por diseño.
export function drawPlayerAvatar(context, x, y, options = {}) {
  drawPersonalCharacter(context, x, y, options);
}
