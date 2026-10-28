import { WORLD, OBSTACLES } from './vector-room.js';

export function walkable(x, y, radius = 18) {
  return x >= 38 && x <= WORLD.width - 38 && y >= 180 && y <= WORLD.height - 42 && !OBSTACLES.some(box => x + radius > box.x && x - radius < box.x + box.w && y + radius > box.y && y - radius < box.y + box.h);
}
export function findPath(start, target) {
  if (!walkable(target.x, target.y)) return [];
  const step = 40, cell = point => ({ x: Math.round(point.x / step), y: Math.round(point.y / step) });
  const a = cell(start), b = cell(target), key = point => `${point.x},${point.y}`;
  if (!walkable(b.x * step, b.y * step)) return [];
  const open = [a], parents = new Map([[key(a), null]]);
  for (let index = 0; index < open.length; index++) {
    const point = open[index];
    if (key(point) === key(b)) {
      const path = []; let current = point;
      while (parents.get(key(current))) { path.unshift({x:current.x * step,y:current.y * step}); current = parents.get(key(current)); }
      path.push(target); return path;
    }
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const next = { x:point.x + dx,y:point.y + dy };
      if (!parents.has(key(next)) && walkable(next.x * step,next.y * step)) { parents.set(key(next),point); open.push(next); }
    }
  }
  return [];
}
export function cameraTransform({x,y,zoom,width,height}) {
  const tx = Math.min(0, Math.max(width - WORLD.width * zoom, width / 2 - x * zoom));
  const ty = Math.min(0, Math.max(height - WORLD.height * zoom, height / 2 - y * zoom));
  return { x: WORLD.width * zoom < width ? (width - WORLD.width * zoom) / 2 : tx, y: WORLD.height * zoom < height ? (height - WORLD.height * zoom) / 2 : ty, zoom };
}
