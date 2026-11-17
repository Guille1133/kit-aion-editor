// Pasada 1 de la doble revisión: control automático ANTES de mostrar el video y antes del render final.
// Busca palabras comidas o de más (contra el guion), cortes en plena voz (sílaba comida), palabras repetidas,
// silencios, tramos muy cortos, duración, cuadros sueltos y desincronización.
// Sale con código 1 si hay errores (✗): con un solo error no se muestra ni se renderiza el final.
//
// Uso (desde la carpeta del proyecto):
//   node .aion/kit/aion/revisar.mjs video-agent/edits/short-<slug> [--guion video-agent/guiones/<slug>.md]
//        [--video <mp4>] [--max 90] [--con-lectora] [--min-tramo 0.5]
// El guion se busca solo en video-agent/guiones/<slug>.md. Sin guion compara contra la transcripción original.
// Escribe <proyecto>/revision/: revision.json, voz_cortada.txt y hoja_cortes.jpg (un cuadro por corte, en orden).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const PROJ = argv.find(a => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
if (!PROJ || !fs.existsSync(path.join(PROJ, 'assets/timeline.json'))) {
  console.log('uso: node .aion/kit/aion/revisar.mjs video-agent/edits/short-<slug>  (correr antes "prepare")'); process.exit(2);
}
const P = (...p) => path.join(PROJ, ...p);
const OUT = P('revision'); fs.mkdirSync(OUT, { recursive: true });
const slug = path.basename(PROJ).replace(/^short-/, '');
const guionPath = opt('--guion') || ['video-agent/guiones', path.join(PROJ, '../../guiones')].map(d => path.join(d, `${slug}.md`)).find(f => fs.existsSync(f));
const MAX = Number(opt('--max', 0)), LECTORA = argv.includes('--con-lectora'), MIN_TRAMO = Number(opt('--min-tramo', 0.5));
const MULETILLAS = new Set(['eh', 'em', 'este', 'bueno', 'o', 'sea', 'mm', 'ah', 'viste', 'digamos', 'tipo']);
const errores = [], avisos = [];
const err = (tipo, t, d) => errores.push({ tipo, t: t == null ? null : +t.toFixed(2), detalle: d });
const warn = (tipo, t, d) => avisos.push({ tipo, t: t == null ? null : +t.toFixed(2), detalle: d });
const norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}%]/gu, '');

// ---------- motor: whisper local (sin claves) ----------
const ENGINE = path.resolve('.claude/skills/short-editing/engine');
const W = await import(pathToFileURL(path.join(ENGINE, 'whisper.mjs')).href);
const cli = W.findWhisper(), model = W.modelPath();
if (!cli || !fs.existsSync(model)) { console.log('error: falta whisper.cpp o el modelo. Correr /aion-instalar.'); process.exit(2); }
const SR = 16000;
function leerAudio(file, ss, t) {
  const r = spawnSync('ffmpeg', ['-v', 'error', ...(ss != null ? ['-ss', String(ss), '-t', String(t)] : []), '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status) throw new Error(`ffmpeg no pudo leer ${file}`);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}
function transcribir(file, ss, t, tag) {
  const cache = path.join(OUT, `whisper_${tag}.json`);
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'revisar-')), w16 = path.join(tmp, 'a.wav');
  spawnSync('ffmpeg', ['-v', 'error', '-y', ...(ss != null ? ['-ss', String(ss), '-t', String(t)] : []), '-i', file, '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', w16]);
  const r = spawnSync(cli, ['-m', model, '-f', w16, '-l', 'es', '-t', String(Math.max(2, Math.min(8, os.cpus().length))), '-ojf', '-of', path.join(tmp, 'out'), '-np',
    '--prompt', 'Eh, bueno, yo, yo probé todos los, eh, todos los.'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  let words = [];
  if (!r.status) {
    const json = JSON.parse(fs.readFileSync(path.join(tmp, 'out.json'), 'utf8'));
    for (const seg of json.transcription || []) for (const tk of seg.tokens || []) {
      const tx = tk.text || ''; if (!tx.trim() || /^\[.*\]$/.test(tx.trim())) continue;
      const from = tk.offsets.from / 1000, to = tk.offsets.to / 1000, last = words.at(-1);
      if (last && !/^\s/.test(tx)) { last.text += tx; last.end = Math.max(last.end, to); continue; }
      words.push({ text: tx.trim(), start: from + (ss || 0), end: Math.max(to, from + .02) + (ss || 0) });
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.writeFileSync(cache, JSON.stringify(words));
  return words;
}
const aislado = t => transcribir(VOZ, Math.max(0, t - 1.5), 3.2, `${HASH}_${t.toFixed(2)}`).map(w => norm(w.text));

// ---------- datos del proyecto ----------
const tl = JSON.parse(fs.readFileSync(P('assets/timeline.json'), 'utf8'));
const VOZ = P('assets/voice.wav');
const HASH = crypto.createHash('md5').update(fs.readFileSync(VOZ)).digest('hex').slice(0, 8);
const sp = tl.speed || 1;
const segs = tl.keeps.map(([a, b, o]) => ({ t0: o, t1: o + (b - a) / sp, a, b }));
const excl = [];
if (tl.pause) excl.push([tl.pause.t0, tl.pause.t0 + tl.pause.dur]);
for (const v of tl.inserts || []) if (v) excl.push([v.t0, v.t0 + v.dur]);
const original = (() => { try { return JSON.parse(fs.readFileSync(P('assets/words-scribe.json'), 'utf8')).words.filter(w => (w.type || 'word') === 'word'); } catch { return []; } })();
// tiempo de salida → segundo del crudo
const aFuente = t => { const s = segs.find(s => s.t0 - .05 <= t && t <= s.t1 + .05); return s && { src: s.a + (t - s.t0) * sp, ...s }; };
const dentro = (w, a, b) => a - 0.05 <= w.start && w.start < b;

console.log(`Revisión de ${PROJ}${guionPath ? ` (guion: ${guionPath})` : ' (sin guion: contra la transcripción original)'}`);

// ---------- audio ----------
const x = leerAudio(VOZ), HOP = SR / 100, n = Math.floor(x.length / HOP), db = new Float32Array(n);
for (let i = 0; i < n; i++) { let e = 0; for (let j = i * HOP; j < (i + 1) * HOP; j++) e += x[j] * x[j]; db[i] = 10 * Math.log10(e / HOP + 1e-12); }
const vocal = [...db].filter(v => v > -60).sort((a, b) => a - b), ref = vocal.length ? vocal[Math.floor(vocal.length * .9)] : -20;
const total = n / 100, enExcl = t => excl.some(([a, b]) => a - .6 <= t && t <= b + .6);
console.log(`  voz cortada: ${total.toFixed(2)} s, nivel típico ${ref.toFixed(1)} dB, ${segs.length} tramos`);

for (let i = 0; i < n;) {   // silencios
  if (db[i] < -52) { let j = i; while (j < n && db[j] < -52) j++; const a = i / 100, b = j / 100;
    if (b - a >= .2 && a > .3 && b < total - .5 && !enExcl(a)) (b - a >= .35 ? err : warn)('silencio', a, b - a >= .35 ? `hueco de ${(b - a).toFixed(2)} s` : `pausa de ${(b - a).toFixed(2)} s: escuchar`);
    i = j; } else i++;
}
const max = (a, b) => { let m = -120; for (let k = Math.max(0, a); k < Math.min(n, b); k++) m = Math.max(m, db[k]); return m; };
const min = (a, b) => { let m = 0; for (let k = Math.max(0, a); k < Math.min(n, b); k++) m = Math.min(m, db[k]); return m; };
const cortes = segs.slice(1).map(s => s.t0);
for (const t of cortes) {   // cortes en plena voz
  const k = Math.round(t * 100); if (k < 3 || k > n - 6) continue;
  const antes = max(k - 5, k - 1), despues = max(k + 1, k + 6), piso = min(k - 2, k + 3);
  if (piso > ref - 18 || (antes > ref - 5 && despues > ref - 5)) err('corte', t, `el corte cae en plena voz (antes ${antes.toFixed(0)} dB, después ${despues.toFixed(0)} dB): posible sílaba o palabra comida`);
  else if (antes > ref - 10 && despues > ref - 10) warn('corte', t, `unión con voz a los dos lados: escuchar que no falte una sílaba`);
}
for (const s of segs) { const d = s.t1 - s.t0;
  if (d < .15) err('trabado', s.t0, `tramo de ${d.toFixed(2)} s: se ve como imagen trabada`);
  else if (d < MIN_TRAMO) warn('trabado', s.t0, `tramo de ${d.toFixed(2)} s: mirar que la imagen no salte de golpe`);
}
for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
  const o = Math.min(segs[i].b, segs[j].b) - Math.max(segs[i].a, segs[j].a);
  if (o > .02) err('pisado', segs[j].t0, `el tramo ${segs[j].a.toFixed(2)}-${segs[j].b.toFixed(2)} se pisa con ${segs[i].a.toFixed(2)}-${segs[i].b.toFixed(2)}: palabras repetidas`);
}
if (MAX && tl.duration > MAX) warn('duracion', null, `dura ${tl.duration.toFixed(1)} s (máximo ${MAX} s): recortar frases de relleno antes de acelerar`);

// ---------- texto ----------
const dichas = transcribir(VOZ, null, null, `voz_${HASH}`);
fs.writeFileSync(path.join(OUT, 'voz_cortada.txt'), dichas.map(w => w.text).join(' '));
// Reemplazos ya confirmados de oído en el spec (captions.replace): Whisper oyó mal, el subtítulo ya va bien.
// Se aplican a lo que se oye antes de comparar, así no vuelven a salir como error.
try {
  const code = fs.readFileSync(P('source/spec.js'), 'utf8'), win = {};
  new Function('window', code)(win);
  for (const [de, a] of win.SPEC?.captions?.replace || []) {
    const D0 = String(de).split(/\s+/).map(norm).filter(Boolean), A = String(a).split(/\s+/).map(norm).filter(Boolean);
    let s = 0, e = D0.length; while (s < e && MULETILLAS.has(D0[s])) s++; while (e > s && MULETILLAS.has(D0[e - 1])) e--;
    for (const D of [D0, D0.slice(s, e)]) for (let i = 0; D.length && i + D.length <= dichas.length; i++) {
      if (D.every((w, k) => norm(dichas[i + k].text) === w)) {
        const t0 = dichas[i].start, t1 = dichas[i + D.length - 1].end;
        dichas.splice(i, D.length, ...A.map(w => ({ text: w, start: t0, end: t1 })));
        i += A.length - 1;
      }
    }
  }
} catch { /* spec sin reemplazos o ilegible: se compara tal cual */ }
let esperadas = [];
if (guionPath) {
  const g = fs.readFileSync(guionPath, 'utf8').replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').split('\n').filter(l => !l.trim().startsWith('#')).join(' ');
  esperadas = g.split(/\s+/).map(norm).filter(Boolean);
} else if (original.length) {
  for (const s of segs) esperadas.push(...original.filter(w => dentro(w, s.a, s.b)).map(w => norm(w.text)));
  esperadas = esperadas.filter(Boolean);
  if (LECTORA) warn('lectora', null, 'grabación con lectora sin guion: pasá el guion para un control de texto confiable');
}
const got = dichas.map(w => norm(w.text));
console.log(`  transcripción de la voz cortada: ${got.length} palabras${esperadas.length ? `, esperadas ${esperadas.length}` : ''}`);

function opcodes(A, B) {   // diff por LCS, agrupado como difflib
  const m = A.length, k = B.length, L = Array.from({ length: m + 1 }, () => new Int32Array(k + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = k - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ops = []; let i = 0, j = 0, ci = 0, cj = 0;
  const flush = () => { if (i > ci || j > cj) ops.push([i > ci && j > cj ? 'replace' : i > ci ? 'delete' : 'insert', ci, i, cj, j]); };
  while (i < m && j < k) {
    if (A[i] === B[j]) { flush(); i++; j++; ci = i; cj = j; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  i = m; j = k; flush();
  return ops;
}
const sim = (a, b) => { if (!a.length && !b.length) return 1; const ops = opcodes([...a], [...b]); let d = 0; for (const [, i1, i2, j1, j2] of ops) d += Math.max(i2 - i1, j2 - j1); return 1 - d / Math.max(a.length, b.length); };

if (esperadas.length) for (const [op, i1, i2, j1, j2] of opcodes(esperadas, got)) {
  const exp = esperadas.slice(i1, i2), hay = got.slice(j1, j2), t = dichas[Math.min(j1, dichas.length - 1)]?.start ?? 0;
  if (op === 'insert' && hay.every(w => MULETILLAS.has(w))) { warn('muletilla', t, `se oye «${hay.join(' ')}»`); continue; }
  if (op === 'delete' && exp.every(w => MULETILLAS.has(w))) continue;
  if (op === 'replace' && sim(exp.join(''), hay.join('')) >= .8) { warn('palabra', t, `«${exp.join(' ')}» se oye «${hay.join(' ')}» (misma palabra escrita distinto)`); continue; }
  if (op === 'insert' && !guionPath && original.length) {
    const m = aFuente(t);
    if (m) {
      const cerca = original.filter(w => hay.includes(norm(w.text)) && Math.abs((w.start + w.end) / 2 - m.src) < 1.5);
      if (cerca.some(w => dentro(w, m.a, m.b))) { warn('texto', t, `se oye «${hay.join(' ')}» de más (probable diferencia de transcripción)`); continue; }
      const lejos = w => segs.every(s => !(s.a - .35 <= w.start && w.start < s.b + .1));
      if (cerca.length && cerca.every(lejos)) { (LECTORA ? warn : err)('colada', t, `«${hay.join(' ')}» viene de una parte descartada: se coló una palabra de otra toma`); continue; }
      if (cerca.length) { warn('borde', t, `«${hay.join(' ')}» está en la unión de dos tramos: escuchar si entra entera o queda un resto`); continue; }
    }
  }
  const iso = aislado(t);
  if (iso.length && (op === 'delete' || op === 'replace') && exp.filter(w => !MULETILLAS.has(w)).every(w => iso.includes(w))) { warn('texto', t, `«${exp.join(' ')}» aparece al escuchar esos 3 s aislados: probable falla de transcripción`); continue; }
  if (iso.length && op === 'insert' && !hay.some(w => iso.includes(w))) { warn('texto', t, `«${hay.join(' ')}» no aparece al aislar 3 s: probable falla de transcripción`); continue; }
  const txt = { delete: `falta «${exp.join(' ')}»`, insert: `sobra «${hay.join(' ')}»`, replace: `esperaba «${exp.join(' ')}», se oye «${hay.join(' ')}»` }[op];
  err('texto', t, `${txt} | esperado: …${esperadas.slice(Math.max(0, i1 - 4), i2 + 4).join(' ')}… | se oye: …${got.slice(Math.max(0, j1 - 4), j2 + 4).join(' ')}…`);
}
{ // palabras repetidas que no estaban así en el guion u original
  const e = ` ${esperadas.join(' ')} `;
  for (const k of [3, 2, 1]) for (let i = 0; i + 2 * k <= got.length; i++) {
    const a = got.slice(i, i + k), b = got.slice(i + k, i + 2 * k);
    if (a.join(' ') !== b.join(' ') || !a.every(Boolean) || (k === 1 && ['no', 'muy', 'si', 'que'].includes(a[0]))) continue;
    if (e.includes(` ${[...a, ...b].join(' ')} `)) continue;
    err('repetida', dichas[i].start, `«${a.join(' ')} ${b.join(' ')}» repetido (¿retoma que quedó o tramos pisados?)`);
  }
}

// ---------- video ----------
const outDir = P('output');
const video = opt('--video') || (fs.existsSync(outDir) ? fs.readdirSync(outDir).filter(f => f.endsWith('.mp4')).map(f => path.join(outDir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] : null);
if (video) {
  const d = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf8' }).stdout);
  if (Math.abs(d - tl.duration) > .1) warn('sync', null, `el video dura ${d.toFixed(2)} s y la línea de tiempo ${tl.duration.toFixed(2)} s: revisar`);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', video, '-vf', 'scale=54:96,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
  const F = 54 * 96, nf = Math.floor(r.stdout.length / F), m = new Float32Array(nf);
  for (let f = 0; f < nf; f++) { let s = 0; for (let p = f * F; p < (f + 1) * F; p++) s += r.stdout[p]; m[f] = s / F; }
  const fps = tl.fps || 30;
  for (let f = 1; f < nf - 1; f++) if (Math.abs(m[f] - m[f - 1]) > 12 && Math.abs(m[f] - m[f + 1]) > 12 && Math.abs(m[f + 1] - m[f - 1]) < 4) err('flash', f / fps, `cuadro suelto (flash de un cuadro)`);
  const times = [0.1, ...cortes].slice(0, 48), frames = times.map(t => Math.round((t + .07) * fps));
  const cols = 8, rows = Math.ceil(frames.length / cols);
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `select='${frames.map(f => `eq(n\\,${f})`).join('+')}',scale=180:320,tile=${cols}x${rows}`, '-frames:v', '1', '-vsync', '0', path.join(OUT, 'hoja_cortes.jpg')]);
  if (fs.existsSync(path.join(OUT, 'hoja_cortes.jpg'))) console.log(`  hoja de cortes: ${path.join(OUT, 'hoja_cortes.jpg')} (en orden: ${times.map(t => t.toFixed(1)).join(', ')} s)`);
} else warn('video', null, 'sin video: no se revisaron cuadros sueltos ni la hoja de cortes (correr de nuevo con el borrador)');

// ---------- informe ----------
const ord = (a, b) => (a.t ?? 1e9) - (b.t ?? 1e9);
errores.sort(ord); avisos.sort(ord);
console.log('');
for (const e of errores) console.log(`✗ ${String(e.t ?? '').padStart(7)} [${e.tipo}] ${e.detalle}`);
for (const e of avisos) console.log(`⚠ ${String(e.t ?? '').padStart(7)} [${e.tipo}] ${e.detalle}`);
console.log(`\n${errores.length} error(es), ${avisos.length} aviso(s). ` + (errores.length ? 'NO mostrar ni renderizar: corregir y volver a correr.' : 'Pasada 1 OK: seguir con la pasada 2 (revisor).'));
fs.writeFileSync(path.join(OUT, 'revision.json'), JSON.stringify({ proyecto: PROJ, guion: guionPath || null, errores, avisos }, null, 1));
process.exit(errores.length ? 1 : 0);
