# Reglas de calidad AION

Valen para todos los videos, encima de las reglas del motor (`short-editing/references/style.md`).
Orden de prioridad: lo que pide el alumno para este video > su estilo (`video-agent/styles/<nombre>/`) > estas reglas > las del motor.

## Antes de editar

- **Guion junto con el video.** Pedirlo siempre (texto pegado, archivo, Notion, Google Docs). Guardarlo en `video-agent/guiones/<slug>.md`. Sirve para corregir los subtítulos, elegir tomas y comprobar el final. Sin guion: avisar en una línea que la edición va a ser menos precisa y seguir.
- **Una sola voz.** Correr `node .aion/kit/aion/voces.mjs <toma>` en cada toma nueva. Si encuentra otra voz (alguien que lee el guion, un comentario de fondo), avisar y usar su `cutPrincipal` en el spec (deja solo la voz del alumno). Nunca cortar un tramo que el guion dice que es del alumno sin escucharlo antes (`ffmpeg -ss a -t 3`).
- **El original no se toca.** Nunca mover, renombrar, editar ni borrar el video del alumno.

## Cortes

- Retomas: quedarse con la **última toma completa** de cada frase del guion. Si la última está trabada, la anterior.
- Nunca cortar dentro de una palabra. Los tiempos de Whisper fallan 0,1 a 0,3 s: si una palabra dura más de 0,6 s, una frase aparece dos veces o algo no tiene sentido, es una retoma escondida: escuchar ese punto y cortarla.
- El video arranca en la primera palabra del hook: sin respiración, sin "bueno", sin mirar a cámara antes.
- Fuera: muletillas de arranque, "esperá", "lo hago de nuevo", "¿cómo sigue?", comentarios a quien está en la sala.

## Pantalla

- **Nunca papel vacío.** En vista dividida siempre hay algo en el papel: si entre dos tableros queda más de 1 s sin nada, extender el anterior o adelantar el siguiente. Revisarlo en los cuadros (`stills`) en cada hueco entre escenas.
- Hook: legible en el primer cuadro, se mueve desde el cuadro 0, suma al hook hablado (no lo repite). Es la parte con más trabajo.
- Cada tablero ilustra lo que se dice en la palabra exacta (`at` = tiempo de esa palabra). Nunca tres tableros de solo texto seguidos.
- Si hay un título o una palabra grande en pantalla, el subtítulo se esconde mientras esté (`captions.hide`).
- Zona segura: texto entre y 170 e y 1500, y lejos de los 220 px de la derecha desde y 1100 para abajo.
- Nunca inventar: ni cifras, ni frases, ni promesas. En pantalla solo lo que se dice o lo que está en el guion.

## Audio

- Final a -14 LUFS, pico -1 dBTP (el `final` del motor lo controla: la línea QC tiene que decirlo).
- Música elegida por lo que tiene que sentir quien mira, nunca la misma del video anterior. Tiene que oírse en el parlante del celular sin tapar la voz.
- Sin whooshes ni efectos de "novato": golpes solo en un dato o un remate real.

## Antes de decir "listo"

**Doble revisión obligatoria** antes de mostrar y antes del render final: `reglas/revision.md` (pasada 1 `aion/revisar.mjs` en 0 errores + pasada 2 con un revisor que no editó). Además:


1. Línea QC del motor: `h264 1080 1920`, duración igual al timeline, ≈ -14 LUFS, pico ≤ -1 dBTP.
2. Transcribir la voz ya cortada (`assets/voice.wav`) y compararla con el guion frase por frase. Si falta algo, transcribir ese tramo solo antes de concluir (Whisper a veces saltea frases en audios largos).
3. Mirar los cuadros: hook, cada tablero, cada hueco entre escenas y el último segundo.
4. Decir qué no se pudo comprobar de oído (cortes, respiraciones, nivel de música).

## Memoria y tiempos

- Compus de 8 a 16 GB: primero un borrador a mitad de resolución (`render ... --scale .5`, después `audio` y `final`). El render completo solo con el OK del alumno.
- Un solo render a la vez.
- Avisar cuánto tarda cada paso largo: la transcripción tarda entre 1 y 2,5 veces lo que dura el video en una compu sin placa de video.

## Aprender

Cada corrección del alumno que sirva para otros videos se guarda en el momento:
- gusto de un estilo → `STYLE.md` y `notes` del `style.json` de ese estilo,
- regla general → `video-agent/mis-reglas.md` (se lee junto con este archivo).
Avisarle en una línea qué regla quedó.
