# Doble revisión (obligatoria)

Antes de mostrarle un video al alumno y antes del render final, se revisa **dos veces**. Así no gasta vueltas en letras comidas, frases repetidas, silencios o errores en pantalla que se pueden encontrar solos. Si cambian los cortes, se repiten las dos pasadas.

## Pasada 1: control automático

Después de `prepare` y del borrador (`render --scale .5`):

```bash
node .aion/kit/aion/revisar.mjs video-agent/edits/short-<slug> --max 90
```

- Toma el guion de `video-agent/guiones/<slug>.md` (o `--guion <archivo>`). Sin guion compara contra la transcripción original, que es menos confiable.
- Si la toma tiene otra voz (alguien que lee el guion): sumar `--con-lectora`. Antes, en el spec, usar el `cutPrincipal` de `voces.mjs`.
- `--max 90` en reels. Sin límite en videos largos.
- Revisa: palabras comidas, de más o cambiadas contra el guion (antes de marcar error escucha esos 3 s aislados), cortes en plena voz (sílaba comida), palabras coladas de otra toma, palabras repetidas, tramos pisados, silencios, tramos de menos de 0,15 s, duración, cuadros sueltos y sincronía. Arma `revision/hoja_cortes.jpg`.
- Lo que Whisper oye mal pero ya se confirmó de oído va en `captions.replace` del spec: la revisión lo acepta y no lo vuelve a marcar.

**✗ error:** no se muestra ni se renderiza. Corregir y volver a correr.
**⚠ aviso:** no bloquea; se mira en la pasada 2, y los de "escuchar" se le dicen al alumno con su segundo.

Tarda entre 3 y 5 minutos por minuto de video en una compu sin placa de video (transcribe la voz cortada y escucha aparte cada punto dudoso).

## Pasada 2: revisor con ojos frescos

Solo con la pasada 1 en 0 errores. Lanzar un **subagente nuevo** (no el que editó). Darle con rutas completas: `revision/revision.json`, `revision/voz_cortada.txt`, el guion, `revision/hoja_cortes.jpg`, `stills/contact.jpg`, `.aion/kit/reglas/calidad.md`, `.aion/kit/reglas/espanol.md`, `video-agent/marca.md` y el `STYLE.md` del estilo si existe. Que no mire imágenes sueltas salvo las dudosas.

Prompt para el revisor:

> No editaste este video: tu trabajo es encontrar errores antes de que lo vea el alumno. Leé las reglas, la marca y el estilo. Mirá la hoja de cortes, la hoja de tableros y los avisos de la pasada 1.
> Revisá: (1) subtítulos y textos en pantalla: ortografía, tildes, voseo o tú según la marca, números con punto de miles, que coincidan con el guion, nada inventado, sin subtítulo encima de un texto grande; (2) zona segura y papel vacío; (3) cada aviso de la pasada 1: ¿probable error o falsa alarma, y por qué?; (4) duración, cierre y reglas del estilo.
> Ampliá solo lo dudoso (`node .claude/skills/short-editing/engine/short.mjs stills <proyecto> <segundos>`).
> Respondé SOLO una lista: `✗ <segundo> <qué está mal> → <cómo arreglarlo>` y `⚠ <segundo> <qué escuchar o mirar>`. Si no hay nada: "Sin errores".

Si devuelve ✗: corregir y volver a la pasada 1.

## Al mostrar el video

Una línea: "Doble revisión: 0 errores. Para escuchar: 0:14 (…), 0:47 (…)". Los avisos de oído van siempre: el alumno tiene la última palabra.
