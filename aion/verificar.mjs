// Revisa que el editor AION esté completo. Uso (desde la carpeta del proyecto): node .aion/kit/aion/verificar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

let fallas = 0;
const ok = m => console.log(`✓ ${m}`);
const mal = (m, fix) => { fallas++; console.log(`✗ ${m}${fix ? `  →  ${fix}` : ''}`); };
const ver = (cmd, args, re) => { const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' }); return r.status === 0 ? ((r.stdout + r.stderr).match(re) || [, 'ok'])[1] : null; };
const win = process.platform === 'win32';

const node = process.versions.node.split('.')[0];
node >= 20 ? ok(`Node ${process.versions.node}`) : mal(`Node ${process.versions.node} (hace falta 20 o más)`, win ? 'winget install --id OpenJS.NodeJS.LTS -e' : 'brew install node');
for (const [n, args, re, fix] of [
  ['git', ['--version'], /version ([\d.]+)/, win ? 'winget install --id Git.Git -e' : 'xcode-select --install'],
  ['ffmpeg', ['-version'], /version (\S+)/, win ? 'winget install --id Gyan.FFmpeg -e' : 'brew install ffmpeg'],
  ['ffprobe', ['-version'], /version (\S+)/, win ? 'winget install --id Gyan.FFmpeg -e' : 'brew install ffmpeg'],
  ['yt-dlp', ['--version'], /([\d.]+)/, win ? 'winget install --id yt-dlp.yt-dlp -e' : 'brew install yt-dlp'],
]) { const v = ver(n, args, re); v ? ok(`${n} ${v}`) : mal(`${n} no está`, fix); }

const pin = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'melvynx.json'), 'utf8'));
const head = ver('git', ['-C', '.aion/melvynx', 'rev-parse', '--short', 'HEAD'], /(\w+)/);
head && pin.commit.startsWith(head) ? ok(`motor en la versión probada (${head})`) : mal(`motor ${head ? `en ${head}, se esperaba ${pin.commit}` : 'no está en .aion/melvynx'}`, 'INSTALAR.md paso 2');

for (const s of ['short-editing', 'steal', 'studio-setup', 'aion-editar', 'aion-estilo', 'aion-instalar'])
  fs.existsSync(`.claude/skills/${s}/SKILL.md`) ? ok(`comando ${s}`) : mal(`falta el comando ${s}`, 'INSTALAR.md paso 3');

if (fs.existsSync('.claude/skills/short-editing/engine/setup.mjs')) {
  const r = spawnSync('node', ['.claude/skills/short-editing/engine/setup.mjs', '--check'], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  /engine ready/.test(out) ? ok('motor de render listo (whisper, modelo de voz, música)') : mal('motor de render incompleto', win ? 'node .aion/kit/aion/whisper-windows.mjs y después node .claude/skills/short-editing/engine/setup.mjs' : 'node .claude/skills/short-editing/engine/setup.mjs');
}

for (const d of ['takes', 'guiones', 'referencias', 'styles', 'edits']) fs.existsSync(`video-agent/${d}`) ? null : mal(`falta la carpeta video-agent/${d}`, 'INSTALAR.md paso 4');
const marca = fs.existsSync('video-agent/marca.md') ? fs.readFileSync('video-agent/marca.md', 'utf8') : '';
marca && !/\{\{/.test(marca) ? ok('marca completa') : mal(marca ? 'marca.md tiene campos sin completar ({{...}})' : 'falta video-agent/marca.md', 'INSTALAR.md paso 6');
try { JSON.parse(fs.readFileSync('video-agent/styles/default/style.json', 'utf8')); ok('estilo default'); } catch { mal('falta o está roto video-agent/styles/default/style.json', 'INSTALAR.md paso 6'); }

console.log(fallas ? `\n${fallas} cosa(s) para arreglar.` : '\nTodo listo para editar.');
process.exit(fallas ? 1 : 0);
