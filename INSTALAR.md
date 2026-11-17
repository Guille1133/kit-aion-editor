# Instalar el editor de reels AION

Instrucciones para Claude Code. El alumno no es programador: hablale en español, simple, una cosa por vez.

Al terminar, en su carpeta de proyecto (la que eligió al abrir Claude Code, ej. `mis-reels`) va a tener:

```text
mis-reels/
├── .aion/
│   ├── kit/          este kit (reglas, comandos AION, herramientas)
│   └── melvynx/      el motor de edición (video-agent-skills, versión fija)
├── .claude/
│   ├── skills/       los comandos: /aion-editar, /aion-estilo, /aion-instalar + los del motor
│   └── settings.local.json   permisos para ffmpeg, yt-dlp y el motor
└── video-agent/
    ├── marca.md      quién es, colores, voseo o tú, cierre
    ├── mis-reglas.md sus correcciones guardadas
    ├── INSTALACION.md registro de esta instalación
    ├── takes/        sus grabaciones
    ├── guiones/      el guion de cada video
    ├── referencias/  reels que le gustan, una carpeta por estilo + links.txt
    ├── styles/       sus estilos (recetas) + README.md con el estado de cada uno
    └── edits/        un proyecto por video editado
```

## Reglas

1. Detectá el sistema (Windows o Mac) y usá sus comandos.
2. Revisá antes de instalar: no reinstales lo que ya funciona.
3. Anotá cada paso en `video-agent/INSTALACION.md` (✅ hecho / ⏳ pendiente / ❌ error y por qué). Si se corta la sesión o hay que reiniciar Claude, al volver leé ese archivo y seguí desde ahí.
4. No des nada por instalado sin probarlo con un comando real.
5. Si algo falla, buscá la causa y arreglalo antes de seguir. Si no podés, decile en una línea qué tiene que hacer.
6. Si un comando pide contraseña o permisos de administrador, decile el comando exacto y esperá.
7. Nada de servicios pagos ni claves: todo corre en su compu. No le ofrezcas ElevenLabs, Treg ni Codex.
8. Antes de cada paso, contale en una línea qué hacés y cuánto tarda.

## 1. Programas

Verificá cada uno con su versión y mostrá una línea por programa (✓ versión o ✗ falta):

| Programa | Windows | Mac |
|---|---|---|
| Git | `winget install --id Git.Git -e` | `xcode-select --install` |
| Node.js 20 o más | `winget install --id OpenJS.NodeJS.LTS -e` | `brew install node` |
| ffmpeg y ffprobe | `winget install --id Gyan.FFmpeg -e` | `brew install ffmpeg` |
| yt-dlp | `winget install --id yt-dlp.yt-dlp -e` | `brew install yt-dlp` |

- Mac sin Homebrew: instalalo primero (pide la contraseña de la compu: avisale).
- Windows: si `winget` no existe, que actualice "Instalador de aplicación" desde Microsoft Store.
- Windows: un programa recién instalado no aparece hasta abrir una terminal nueva. Si no lo encontrás, anotá el paso como ⏳ y pedile que cierre Claude Code, lo abra de nuevo en la misma carpeta y escriba "seguí con la instalación".
- Chrome o Edge: el motor usa el navegador que ya tiene. En Windows siempre está Edge.

## 2. Motor (versión fija)

La versión probada del motor está en `.aion/kit/aion/melvynx.json` (`repo` y `commit`).

```bash
git clone https://github.com/Melvynx/video-agent-skills.git .aion/melvynx
git -C .aion/melvynx checkout <commit de melvynx.json>
```

Si `.aion/melvynx` ya existe: `git -C .aion/melvynx fetch` y el mismo `checkout`.

## 3. Comandos

Copiá a `.claude/skills/` (creala si falta), pisando lo que haya con el mismo nombre:
- del motor: `short-editing`, `steal`, `studio-setup`, `editing`, `clips`, `broll`, `studio-script` (de `.aion/melvynx/skills/`),
- del kit: `aion-editar`, `aion-estilo`, `aion-instalar` (de `.aion/kit/skills/`).

No copies `publish`, `insta-audit`, `outliers`, `short-translate`, `codex-images` ni `vox`: piden cuentas o claves pagas.

Windows (PowerShell):
```powershell
New-Item -ItemType Directory -Force .claude\skills | Out-Null
foreach ($s in 'short-editing','steal','studio-setup','editing','clips','broll','studio-script') { Copy-Item -Recurse -Force ".aion\melvynx\skills\$s" .claude\skills\ }
Copy-Item -Recurse -Force .aion\kit\skills\* .claude\skills\
```
Mac:
```bash
mkdir -p .claude/skills
for s in short-editing steal studio-setup editing clips broll studio-script; do cp -R ".aion/melvynx/skills/$s" .claude/skills/; done
cp -R .aion/kit/skills/* .claude/skills/
```

## 4. Carpetas y plantillas

Creá `video-agent/` con `takes/`, `guiones/`, `referencias/`, `styles/`, `edits/` y copiá:
- `.aion/kit/plantillas/marca.md` → `video-agent/marca.md`
- `.aion/kit/plantillas/mis-reglas.md` → `video-agent/mis-reglas.md`
- `.aion/kit/plantillas/links.txt` → `video-agent/referencias/links.txt`
- `.aion/kit/plantillas/estilos-README.md` → `video-agent/styles/README.md`

Si la carpeta es un repositorio git, agregá al `.gitignore` las líneas del paso 2 de `.claude/skills/studio-setup/SKILL.md` más `.aion/melvynx/`.

## 5. Motor de render (el paso largo)

Avisale antes: "Ahora instalo el motor de video: baja el modelo de voz (0,5 GB) y genera la música. Tarda entre 10 y 25 minutos. Mientras tanto te hago unas preguntas."

1. Windows primero: `node .aion/kit/aion/whisper-windows.mjs` (el instalador del motor falla bajando whisper.cpp en Windows; esto lo resuelve).
2. Corré en segundo plano: `node .claude/skills/short-editing/engine/setup.mjs`
3. Mientras corre, hacé el paso 6.
4. Al terminar, `node .claude/skills/short-editing/engine/setup.mjs --check` tiene que decir `engine ready`.

## 6. Marca (entrevista)

Una pregunta por mensaje, con opciones y la recomendada primero. Guardá todo en `video-agent/marca.md`:

1. Nombre y @ de Instagram (y TikTok o YouTube si usa).
2. De qué habla y a quién le habla.
3. ¿Habla con **voseo** (vos tenés) o con **tú** (tú tienes)? Define cómo se escriben los subtítulos.
4. Cómo graba: celular o cámara, micrófono, si alguien le lee el guion al lado (si sí: recomendale grabar sin lectora o con el guion en la pantalla; el editor igual corta la otra voz). iPhone: sugerile desactivar HDR y grabar en 1080p a 30 fps.
5. Cierre: palabra para comentar ("Comentá GUÍA"), "seguime", o sin cierre.
6. Lo que no quiere ver nunca (emojis, transiciones, música fuerte...).

Después, su look: seguí el paso 5 de `.claude/skills/studio-setup/SKILL.md` (look, color, fuentes, subtítulos, ritmo, cuenta, herramientas que nombra) en español, y escribí `video-agent/styles/default/style.json` y `video-agent/style.json`. Sumá `creator.lang: "es"` y, en `notes`, "Números con punto de miles (sep '.')". Anotá `default` en `video-agent/styles/README.md` como `borrador`.

Si tiene logo en PNG, pedile que lo copie a `video-agent/styles/default/assets/`.

## 7. Permisos

Mostrá estas reglas, explicá que evitan que Claude le pida permiso en cada paso, y con su OK combinalas en `.claude/settings.local.json` (crealo si falta; no borres nada de lo que haya):

```json
{
  "permissions": {
    "allow": [
      "Bash(yt-dlp *)",
      "Bash(ffmpeg *)",
      "Bash(ffprobe *)",
      "Bash(node .claude/skills/short-editing/engine/*)",
      "Bash(node .aion/kit/aion/*)"
    ]
  }
}
```

## 8. Prueba final

1. `node .aion/kit/aion/verificar.mjs`: todo en ✓.
2. Pedile un video corto suyo hablando a cámara (20 a 60 s) **y su guion**. Si no tiene, que grabe uno con el celular y lo pase a `video-agent/takes/`.
3. Editalo con `/aion-editar` (borrador a mitad de resolución). En esta prueba no hace falta esperar el OK del plan: contáselo en dos líneas y seguí.
4. Mostrale el video y decile qué revisar de oído.

## 9. Cierre

Resumen corto: qué quedó instalado (con versión), qué pruebas pasaron, qué falta si falta algo. Después, cómo se usa:

- **Editar:** grabá, copiá el video a `video-agent/takes/` (o decime dónde está), pasame el guion y escribí `/aion-editar`.
- **Tu estilo:** buscá 2 o 3 reels del mismo formato que te gusten, pegá los links en `video-agent/referencias/links.txt` y escribí `/aion-estilo`.
- **Corregir:** decime el segundo y qué cambiar. Lo que sirva para siempre queda guardado.
- **Si algo falla o querés actualizar:** `/aion-instalar`.

Si hubo que reiniciar Claude para que aparezcan los comandos, decíselo: los comandos nuevos aparecen al abrir una sesión nueva en esta carpeta.

## Actualizar

1. `git -C .aion/kit pull`
2. Leé `.aion/kit/aion/melvynx.json`; si cambió el `commit`, repetí el paso 2.
3. Repetí el paso 3 (copiar comandos).
4. `node .claude/skills/short-editing/engine/setup.mjs --check` (en Windows, antes `node .aion/kit/aion/whisper-windows.mjs`).
5. `node .aion/kit/aion/verificar.mjs`.
Nada de esto toca `video-agent/`: sus estilos, guiones y videos quedan como están.
