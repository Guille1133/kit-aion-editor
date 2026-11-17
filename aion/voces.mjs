// Detecta una segunda voz en la toma (alguien que lee el guion en voz baja, un comentario de fondo)
// y devuelve los tramos a cortar, listos para `cut` del spec.js.
// Mide el volumen cada 50 ms con ffmpeg: la voz principal es la más fuerte; un tramo de voz que queda
// 15 dB o más por debajo de ella es otra persona.
//
// Uso: node .aion/kit/aion/voces.mjs <video o audio> [--margen 15]
// Imprime un resumen y, al final, una línea JSON: {"principal": dB, "otras": [[a, b, dB], ...], "cut": [[a, b], ...]}
import { spawnSync } from 'node:child_process';

const file = process.argv[2];
if (!file) { console.log('uso: node voces.mjs <video> [--margen 15]'); process.exit(1); }
const mi = process.argv.indexOf('--margen');
const MARGEN = mi > 0 ? Number(process.argv[mi + 1]) : 15;
const PASO = 0.05;

const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', '16000', '-af',
  `asetnsamples=${16000 * PASO},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-`,
  '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
if (r.status !== 0) { console.log('error: ffmpeg no pudo leer el archivo'); process.exit(1); }
const db = [...r.stdout.matchAll(/RMS_level=(-?[\d.]+|-inf)/g)].map(m => m[1] === '-inf' ? -120 : Number(m[1]));
if (!db.length) { console.log('error: no hay audio'); process.exit(1); }

// piso de ruido = percentil 10; voz = todo lo que está 12 dB o más arriba del piso
const ord = [...db].sort((a, b) => a - b), piso = ord[Math.floor(ord.length * 0.1)], umbral = piso + 12;
// tramos de voz separados por pausas de 0,1 s o más (así no se pega la lectora con la voz principal)
const tramos = []; let ini = -1, pico = -120, hueco = 0;
for (let i = 0; i <= db.length; i++) {
  const voz = i < db.length && db[i] > umbral;
  if (voz) { if (ini < 0) { ini = i; pico = -120; } pico = Math.max(pico, db[i]); hueco = 0; }
  else if (ini >= 0 && (++hueco >= 2 || i === db.length)) { tramos.push([ini * PASO, (i - hueco + 1) * PASO, pico]); ini = -1; }
}
if (!tramos.length) { console.log('no encontré voz'); process.exit(0); }
const largos = tramos.filter(t => t[1] - t[0] >= 0.25).map(t => t[2]).sort((a, b) => a - b);
const principal = largos[Math.floor(largos.length * 0.75)] ?? Math.max(...tramos.map(t => t[2]));
// tramos bajos seguidos (sin un tramo fuerte en el medio, separados por menos de 0,5 s) = otra voz
const otras = []; let g = null;
for (const t of tramos) {
  if (t[2] < principal - MARGEN) {
    if (g && t[0] - g[1] < 0.5) { g[1] = t[1]; g[2] = Math.max(g[2], t[2]); } else { if (g) otras.push(g); g = [...t]; }
  } else { if (g) otras.push(g); g = null; }
}
if (g) otras.push(g);
const filtradas = otras.filter(([a, b]) => b - a >= 0.3).map(([a, b, p]) => [+a.toFixed(2), +b.toFixed(2), +p.toFixed(1)]);
otras.length = 0; otras.push(...filtradas);
const dur = otras.reduce((s, [a, b]) => s + b - a, 0);

console.log(`voz principal: ${principal.toFixed(1)} dB (pico típico) · piso de ruido ${piso.toFixed(1)} dB · ${tramos.length} tramos de voz`);
if (!otras.length) console.log('una sola voz: no hay nada que cortar');
else {
  console.log(`${otras.length} tramos de OTRA voz (${MARGEN}+ dB más baja), ${dur.toFixed(1)} s en total:`);
  for (const [a, b, p] of otras) console.log(`  ${a.toFixed(2)}-${b.toFixed(2)} s  ${p} dB`);
}
const cut = otras.map(([a, b]) => [Math.max(0, +(a - 0.05).toFixed(2)), +(b + 0.05).toFixed(2)]);
console.log(JSON.stringify({ principal: +principal.toFixed(1), otras, cut }));
