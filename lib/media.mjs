import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { agents, InputError } from './demo.mjs';

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const extensions = { 'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp', 'image/gif':'gif', 'image/svg+xml':'svg', 'video/mp4':'mp4', 'video/webm':'webm' };
const idPattern = /^[a-f0-9-]{36}$/;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const color = value => {
  if (typeof value !== 'string' || !/^(?:#[a-f\d]{3}(?:[a-f\d]{3})?|none)$/i.test(value)) throw new InputError('Color vectorial inválido.');
  return value;
};
const number = (value, fallback = 0) => {
  const result = value === undefined ? fallback : value;
  if (typeof result !== 'number' || !Number.isFinite(result) || Math.abs(result) > 10000) throw new InputError('Coordenada vectorial inválida.');
  return result;
};

// Se construye SVG desde primitivas acotadas; nunca se acepta SVG/HTML arbitrario.
export function vectorImage(input) {
  if (!input || !Array.isArray(input.elements) || input.elements.length < 1 || input.elements.length > 120) throw new InputError('El gráfico necesita entre 1 y 120 elementos.');
  const width = number(input.width, 960), height = number(input.height, 540);
  if (width < 128 || height < 128 || width > 1920 || height > 1920) throw new InputError('Dimensiones vectoriales fuera de rango.');
  const shapes = input.elements.map(shape => {
    if (!shape || typeof shape !== 'object') throw new InputError('Elemento vectorial inválido.');
    const fill = color(shape.fill ?? '#233e38');
    const stroke = color(shape.stroke ?? 'none');
    const common = `fill="${fill}" stroke="${stroke}" stroke-width="${Math.max(0, Math.min(40, number(shape.strokeWidth, 2)))}"`;
    const attrs = names => names.map(name => `${name}="${number(shape[name])}"`).join(' ');
    if (shape.type === 'rect') {
      if (number(shape.width) < 0 || number(shape.height) < 0) throw new InputError('Rectángulo inválido.');
      return `<rect ${attrs(['x','y','width','height','rx'])} ${common}/>`;
    }
    if (shape.type === 'circle') {
      if (number(shape.r) < 0) throw new InputError('Radio inválido.');
      return `<circle ${attrs(['cx','cy','r'])} ${common}/>`;
    }
    if (shape.type === 'ellipse') return `<ellipse ${attrs(['cx','cy','rx','ry'])} ${common}/>`;
    if (shape.type === 'line') return `<line ${attrs(['x1','y1','x2','y2'])} ${common} stroke-linecap="round"/>`;
    if (shape.type === 'path') {
      if (typeof shape.d !== 'string' || shape.d.length > 5000 || !/^[MmLlHhVvCcSsQqTtAaZz\d\s.,+eE-]+$/.test(shape.d)) throw new InputError('Trazado vectorial inválido.');
      return `<path d="${shape.d}" ${common} stroke-linejoin="round"/>`;
    }
    if (shape.type === 'text') {
      if (typeof shape.text !== 'string' || shape.text.length > 300) throw new InputError('Texto vectorial inválido.');
      const anchor = ['start','middle','end'].includes(shape.anchor) ? shape.anchor : 'start';
      return `<text ${attrs(['x','y'])} ${common} font-family="Arial,sans-serif" font-size="${Math.max(8, Math.min(128, number(shape.fontSize, 32)))}" font-weight="${shape.bold ? 700 : 400}" text-anchor="${anchor}">${escape(shape.text)}</text>`;
    }
    throw new InputError('Tipo de elemento vectorial no permitido.');
  });
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color(input.background ?? '#f5efdf')}"/>${shapes.join('')}</svg>`);
}

export function sniffMedia(bytes) {
  if (!bytes.length || bytes.length > MAX_MEDIA_BYTES) throw new InputError('El archivo debe pesar entre 1 byte y 25 MB.', 413);
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (/^GIF8[79]a/.test(bytes.subarray(0,6).toString('ascii'))) return 'image/gif';
  if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') return 'image/webp';
  if (bytes.subarray(4,8).toString() === 'ftyp') return 'video/mp4';
  if (bytes.subarray(0,4).equals(Buffer.from([26,69,223,163]))) return 'video/webm';
  throw new InputError('Adjunta PNG, JPG, WebP, GIF, MP4 o WebM. SVG/HTML externos no se admiten.', 415);
}

export function byteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) throw new InputError('Rango inválido.', 416);
  let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  let end = match[1] && match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) throw new InputError('Rango inválido.', 416);
  return { start, end: Math.min(end, size - 1) };
}

export async function makeMedia({ root }) {
  const directory = path.join(root, '.runtime/hermes-office/media');
  const indexFile = path.join(directory, 'index.local.json');
  let items = [];
  try {
    items = JSON.parse(await readFile(indexFile, 'utf8'));
    if (!Array.isArray(items) || items.some(item => !idPattern.test(item.id) || !extensions[item.mime] || !agents.some(a => a.id === item.agentId))) throw new Error('Índice inválido.');
  } catch (error) { if (error.code !== 'ENOENT') throw new Error('No se pudo leer la galería local; no se sobrescribirá.'); }
  let queue = Promise.resolve();
  async function add({ bytes, mime, agentId, title, source, runId }) {
    if (!agents.some(agent => agent.id === agentId)) throw new InputError('Agente desconocido.');
    if (typeof title !== 'string' || !title.trim() || title.length > 140) throw new InputError('El resultado necesita un título de hasta 140 caracteres.');
    const operation = queue.then(async () => {
      if (items.length >= 200) throw new InputError('La galería local alcanzó 200 resultados.', 409);
      const id = randomUUID();
      const item = { id, agentId, title: title.trim(), mime, kind: mime.startsWith('video/') ? 'video' : 'image', source, runId, size: bytes.length, createdAt: new Date().toISOString(), url: `/api/media/${id}/content` };
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `${id}.${extensions[mime]}`), bytes, { flag: 'wx', mode: 0o600 });
      const next = [item, ...items];
      const temporary = `${indexFile}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
      await rename(temporary, indexFile);
      items = next;
      return { ...item };
    });
    queue = operation.catch(() => {});
    return operation;
  }
  return {
    list: () => structuredClone(items),
    upload: ({ bytes, agentId, title }) => add({ bytes, mime: sniffMedia(bytes), agentId, title, source: 'upload' }),
    async content(id) {
      if (!idPattern.test(id)) throw new InputError('Resultado no encontrado.', 404);
      const item = items.find(item => item.id === id);
      if (!item) throw new InputError('Resultado no encontrado.', 404);
      return { item: { ...item }, bytes: await readFile(path.join(directory, `${id}.${extensions[item.mime]}`)) };
    },
    async fromReply(reply, { agentId, runId }) {
      const blocks = [...reply.matchAll(/```studio-media\s*\n([\s\S]*?)```/g)];
      const assets = [], warnings = [];
      let text = reply;
      for (const block of blocks.slice(0,3)) {
        try {
          if (block[1].length > 100000) throw new InputError('El gráfico supera el límite.');
          const specification = JSON.parse(block[1]);
          const bytes = vectorImage(specification);
          assets.push(await add({ bytes, mime: 'image/svg+xml', agentId, title: specification.title, source: 'hermes', runId }));
          text = text.replace(block[0], '');
        } catch { warnings.push('No se pudo publicar un gráfico: formato inválido o almacenamiento no disponible.'); text = text.replace(block[0], ''); }
      }
      return { reply: text.trim() || (assets.length ? 'El resultado está listo en la TV de la sala.' : 'No se pudo publicar el resultado.'), assets, warnings };
    }
  };
}

export const TV_INSTRUCTIONS = `La oficina tiene una TV real para resultados gráficos. Si el usuario pide un gráfico, diagrama, ilustración vectorial o publicar una imagen en la TV, crea tú una composición y añade al final un bloque con etiqueta studio-media que contenga JSON válido. El servidor renderiza y publica esas primitivas como una imagen SVG. No digas que has creado vídeo ni imágenes con herramientas externas. Esquema: {"title":"Título breve","width":960,"height":540,"background":"#f5efdf","elements":[{"type":"rect","x":40,"y":40,"width":880,"height":460,"rx":24,"fill":"#25483e"},{"type":"text","x":480,"y":150,"text":"Título","fontSize":40,"fill":"#ffffff","anchor":"middle","bold":true}]}. Elementos admitidos: rect(x,y,width,height,rx), circle(cx,cy,r), ellipse(cx,cy,rx,ry), line(x1,y1,x2,y2), path(d), text(x,y,text,fontSize,anchor,bold); todos aceptan fill, stroke y strokeWidth. Sólo colores hexadecimales o none. Diseña hasta 32 elementos, con composición y textos legibles. No uses código HTML/SVG, URLs ni imágenes externas dentro del bloque. El resultado visible se confirma sólo cuando el servidor lo acepta. En conversaciones normales responde con naturalidad sin imprimir identificadores internos. Si solicitan un vídeo, explica que pueden adjuntar un MP4/WebM existente a la galería; esta conexión no genera vídeo.`;
