---
name: aion-editar
description: Edita un reel o short del alumno con su estilo, en español, con las reglas de calidad AION, usando el motor de short-editing. Usar cuando diga "editá este video", "/aion-editar", "editame el reel", pase un video para editar, o diga "/short-editing" (este comando lo envuelve).
argument-hint: "<video> [estilo <nombre>] [guion]"
allowed-tools: Bash(node *) Bash(ffmpeg *) Bash(ffprobe *)
---

# Editar un reel (AION)

Motor: la skill `short-editing` (leer su `SKILL.md` entero, y lo que ella pide leer). Esta skill le agrega el método AION: guion primero, una sola voz, español bien escrito, plan antes de renderizar, borrador liviano, verificación y aprendizaje.

Leer siempre antes de empezar:
- `.aion/kit/reglas/calidad.md` y `.aion/kit/reglas/espanol.md`
- `video-agent/marca.md` (quién es, colores, voseo o tú, cierre)
- `video-agent/mis-reglas.md` si existe (sus correcciones guardadas)
- `.aion/kit/reglas/revision.md` (la doble revisión antes de mostrar)

Hablar en español, simple, sin tecnicismos. Antes de cada paso largo, decir en una línea qué hace y cuánto tarda.

## 1. Video y guion

- Video: el que nombra; si no, el más nuevo de `video-agent/takes/`. Si lo tiene en otra carpeta, usar esa ruta (el motor lo copia; el original no se toca).
- **Guion: pedirlo siempre** ("Pasame el guion de este video: pegalo acá o decime dónde está"). Guardarlo en `video-agent/guiones/<slug>.md`. Si no tiene, avisar que la edición va a ser menos precisa y seguir.
- Estilo: el que nombra (`estilo <nombre>`); si no, el que dice `video-agent/style.json`. Si tiene varios en `video-agent/styles/` y no dijo cuál, mostrar la lista con el estado de cada uno (tabla de `video-agent/styles/README.md`) y preguntar.

## 2. Revisar la toma

```bash
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of compact "<video>"
node .aion/kit/aion/voces.mjs "<video>"
```

- Sin audio: parar y decirlo.
- Otra voz: decir cuántos segundos encontró y que se van a cortar. Guardar su **`cutPrincipal`** para el paso 4 (deja solo la voz del alumno; es más seguro que cortar solo lo que detecta de la otra voz).

## 3. Proyecto y palabras (motor)

Pasos 1 y 2 de `short-editing` (`init`, `words <proyecto> es`). La transcripción tarda entre 1 y 2,5 veces lo que dura el video: avisarlo y correrla en segundo plano si es larga.

## 4. Spec

Paso 3 de `short-editing`, más:
- `cut`: el `cutPrincipal` del paso 2 si hubo otra voz + las retomas y arranques falsos. Recorrer el guion frase por frase y quedarse con la **última toma completa** de cada una.
- `captions.replace`: todo lo que Whisper escribió distinto del guion, y el voseo de `espanol.md`.
- Cada `counter` con `sep: '.'` y `decSep: ','`.
- Hook trabajado (mini historia que se mueve desde el cuadro 0) y ningún hueco de papel vacío de más de 1 s.
- Cierre según `marca.md` (palabra clave para comentar, o sin cierre).

## 5. Plan → OK

Antes de renderizar, un solo mensaje corto:
- duración estimada y qué se corta (retomas, otra voz, muletillas),
- el hook en una línea,
- los tableros principales (qué aparece y en qué frase),
- música elegida y por qué, y el cierre.
Esperar el OK. Lo que pida para este video manda sobre el estilo.

## 6. Cuadros, después borrador

1. `prepare` y `stills` (pasos 4 y 5 del motor). Mirar `stills/contact.jpg` y los cuadros grandes con la lista de calidad del motor y la de `calidad.md` (papel vacío, zona segura, números con punto). Corregir el spec y repetir: los cuadros cuestan segundos, los renders minutos.
2. Borrador a mitad de resolución:
   ```bash
   node .claude/skills/short-editing/engine/short.mjs render <proyecto> --scale .5
   node .claude/skills/short-editing/engine/short.mjs audio <proyecto>
   node .claude/skills/short-editing/engine/short.mjs final <proyecto>
   ```
3. **Doble revisión obligatoria** (`.aion/kit/reglas/revision.md`): pasada 1 `node .aion/kit/aion/revisar.mjs <proyecto> --max 90` (+ `--con-lectora` si hubo otra voz) hasta 0 errores; pasada 2 con un subagente revisor que no editó, hasta "Sin errores". Con un solo error no se muestra. Avisar antes que la pasada 1 tarda unos minutos.
4. Verificar como dice "Antes de decir listo" en `calidad.md` (QC del motor, cuadros).
5. Mostrarle el borrador completo (abrirlo: `start "" "<mp4>"` en Windows, `open "<mp4>"` en Mac) con la línea de la doble revisión y los puntos para escuchar con su segundo.

## 7. Correcciones y final

- Cada corrección: cambiar el spec, cuadros, borrador de nuevo y doble revisión de nuevo. Lo que sirva para otros videos se guarda en el momento (ver "Aprender" en `calidad.md`) y se le avisa en una línea.
- Con su OK: render completo (`short.mjs all <proyecto>`), verificar la línea QC (`h264 1080 1920`), escribir `.srt` y `post.md` (paso 7 del motor) y decirle dónde está.
- Si aprobó el video con un estilo en `borrador` o `en-prueba`, proponerle pasarlo a `aprobado` en `video-agent/styles/README.md`.
- Al final, borrar `video-agent/.tmp/` y ofrecer borrar la copia del video (`assets/source.mp4`) para liberar disco.
