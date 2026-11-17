# Editor de reels AION

Editá tus reels con Claude Code: grabás, le pasás el video y el guion, y te lo devuelve cortado, con subtítulos, gráficos animados y música, en tu estilo. Todo corre en tu compu, gratis, sin cuentas ni claves extra.

Es el motor **video-agent-skills** de Melvynx con el método AION encima: comandos en español, tus estilos a partir de reels de referencia, reglas de calidad y verificación antes de mostrarte nada.

## Qué necesitás

- Windows 10/11 o Mac. 8 GB de RAM como mínimo (16 GB recomendado) y unos 5 GB libres.
- Claude Pro o Max, con la app de escritorio de Claude (pestaña **Code**) o Claude Code en la terminal.
- Una hora la primera vez.

## Instalar

1. Creá una carpeta vacía para tus reels, por ejemplo `mis-reels`.
2. Abrí la app de Claude, pestaña **Code** (no Chat ni Cowork), y elegí esa carpeta.
3. Pegá esto:

```text
Instalame el editor de reels AION en esta carpeta. Cloná https://github.com/Guille1133/kit-aion-editor en .aion/kit y seguí .aion/kit/INSTALAR.md paso a paso. Hablame en español y simple, no soy programador.
```

Claude instala los programas que falten, el motor, tus comandos y te hace unas preguntas sobre tu marca. Si en algún momento te pide cerrar y volver a abrir, abrí una sesión nueva en la misma carpeta y escribí **"seguí con la instalación"**.

## Usar

| Querés | Escribí |
|---|---|
| Editar un video | `/aion-editar` y pasale el video **y el guion** |
| Crear tu estilo desde reels que te gustan | pegá 2 o 3 links en `video-agent/referencias/links.txt` y `/aion-estilo` |
| Corregir algo | decí el segundo y qué cambiar ("en 0:12 se corta la palabra hábitos") |
| Actualizar o arreglar el editor | `/aion-instalar` |

## Consejos para que salga bien

- **Pasá siempre el guion.** Con él, los subtítulos salen bien escritos y elige la mejor toma de cada frase.
- **Grabá sin nadie que te lea el guion en voz alta al lado.** El editor corta la otra voz, pero sale más limpio sin ella.
- iPhone: desactivá HDR y grabá en 1080p a 30 fps.
- Al terminar cada frase, seguí mirando a cámara un segundo.
- Antes de mostrarte cada video, Claude lo revisa dos veces (palabras comidas, cortes, silencios, errores en pantalla) y te dice en qué segundos conviene escuchar.
- La primera transcripción de cada video tarda entre 1 y 2,5 veces lo que dura. Los borradores salen a mitad de resolución para que tu compu no se cuelgue; el final, completo.

## Qué hay acá

| Carpeta | Qué es |
|---|---|
| `INSTALAR.md` | El paso a paso que sigue Claude para instalar y actualizar |
| `skills/` | Los comandos `/aion-editar`, `/aion-estilo`, `/aion-instalar` |
| `reglas/` | Reglas de calidad y de español que se aplican en cada edición |
| `aion/` | Herramientas: doble revisión (`revisar.mjs`), detector de otra voz, arreglo de whisper en Windows, verificador, versión fija del motor |
| `plantillas/` | Marca, reglas propias, links de referencias, tabla de estilos |

Créditos y licencias: [CREDITOS.md](CREDITOS.md).
