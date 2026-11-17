// Instala whisper.cpp en Windows dentro del motor de edición.
// El instalador original busca el .zip en la última versión de whisper.cpp, pero desde la v1.9.3
// los binarios de Windows salen en versiones aparte (b5454, b5130...). Este script busca la más
// reciente que tenga whisper-bin-x64.zip y la descomprime donde el motor la espera.
//
// Uso (desde la carpeta del proyecto): node .aion/kit/aion/whisper-windows.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'win32') { console.log('ok   no es Windows: no hace falta'); process.exit(0); }

const SKILL = path.resolve('.claude/skills/short-editing');
const DEST = path.join(SKILL, '.runtime', 'whisper');
const find = dir => {
  if (!fs.existsSync(dir)) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const r = find(p); if (r) return r; }
    else if (e.name.toLowerCase() === 'whisper-cli.exe') return p;
  }
  return null;
};

if (!fs.existsSync(SKILL)) { console.log('error: no encuentro .claude/skills/short-editing. Corré esto desde la carpeta del proyecto.'); process.exit(1); }
const ya = find(DEST);
if (ya) { console.log(`ok   whisper.cpp ya instalado: ${ya}`); process.exit(0); }

const res = await fetch('https://api.github.com/repos/ggml-org/whisper.cpp/releases?per_page=20', { headers: { 'user-agent': 'kit-aion-editor' } });
if (!res.ok) { console.log(`error: GitHub respondió ${res.status}. Probá de nuevo en unos minutos.`); process.exit(1); }
const rel = (await res.json()).find(r => (r.assets || []).some(a => a.name === 'whisper-bin-x64.zip'));
if (!rel) { console.log('error: no encontré whisper-bin-x64.zip en las últimas versiones de whisper.cpp'); process.exit(1); }
const url = rel.assets.find(a => a.name === 'whisper-bin-x64.zip').browser_download_url;

console.log(`bajando whisper.cpp ${rel.tag_name} para Windows (unos 5 MB)...`);
fs.mkdirSync(DEST, { recursive: true });
const zip = path.join(SKILL, '.runtime', 'whisper-bin-x64.zip');
const r = await fetch(url);
if (!r.ok) { console.log(`error: la descarga respondió ${r.status}`); process.exit(1); }
fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));

// tar.exe de Windows (bsdtar) abre .zip; el tar de Git Bash no. Si falla, PowerShell.
const winTar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
let ok = fs.existsSync(winTar) && spawnSync(winTar, ['-xf', zip, '-C', DEST], { stdio: 'inherit' }).status === 0;
if (!ok) ok = spawnSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path '${zip}' -DestinationPath '${DEST}' -Force`], { stdio: 'inherit' }).status === 0;
fs.rmSync(zip, { force: true });

const exe = find(DEST);
if (!ok || !exe) { console.log('error: no pude descomprimir whisper.cpp'); process.exit(1); }
console.log(`ok   whisper.cpp: ${exe}`);
