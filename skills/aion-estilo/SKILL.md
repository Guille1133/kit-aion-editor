---
name: aion-estilo
description: Crea o ajusta un estilo de edición (receta) del alumno a partir de reels de referencia que le gustan, usando la skill steal. Usar cuando diga "/aion-estilo", "armá mi estilo", "quiero que mis videos se vean como este", "copiá el estilo de", o pase links de reels de referencia.
argument-hint: "<nombre del estilo> [links o archivos]"
allowed-tools: Bash(yt-dlp *) Bash(ffmpeg *) Bash(ffprobe *) Bash(node *)
---

# Crear un estilo desde referencias (AION)

Motor: la skill `steal` (leer su `SKILL.md` y su `references/learnings.md`). Esta skill le agrega la carpeta de referencias, los estados de receta y el español.

Hablar en español, simple. Leer `video-agent/marca.md`.

## 1. Qué estilo

- Un estilo = un formato que el alumno repite (ej. "hablando a cámara con tips", "historia personal", "lista de 5"). Nombre corto en minúsculas con guiones: `tips-rapidos`.
- Preguntar el nombre si no lo dio. Si ya existe en `video-agent/styles/`, es un ajuste: leer su `STYLE.md` primero.

## 2. Referencias

- Carpeta: `video-agent/referencias/<estilo>/`. Links en `video-agent/referencias/links.txt`, uno por línea: `link | estilo | qué le gusta`.
- **Ideal 2 o 3 reels del mismo formato.** Uno solo puede ser la excepción de esa cuenta. Si trae uno, pedir uno o dos más (no obligatorio).
- Bajar cada link con `yt-dlp -o "video-agent/referencias/<estilo>/ref%(autonumber)s.%(ext)s" "<link>"`. Instagram suele pedir login: si falla, pedirle que guarde el video y lo copie a esa carpeta.
- Preguntar qué le gusta de cada uno si no lo dijo: eso decide qué se copia.

## 3. Medir y escribir (steal)

Seguir los pasos 2 y 3 de `steal` sobre cada referencia, con estos cambios:
- **Sin ElevenLabs:** el nivel de la música bajo la voz se juzga en el espectrograma, no con aislamiento de voz.
- `STYLE.md` en español.
- Adaptar a la marca: colores y fuentes de `marca.md` (no los de la referencia), salvo que diga que quiere los de la referencia.
- Números en español (`sep: '.'`, `decSep: ','`) en las notas del `style.json`.
- Se copia el estilo, nunca logos, textos, música ni imágenes de otra cuenta.

## 4. Probar

Paso 4 de `steal` con una toma del alumno de 10 a 30 s, usando `/aion-editar` (borrador a mitad de resolución). Comparar con la referencia como dice el paso 5 de `steal` antes de mostrar.

## 5. Estado y entrega

- Anotar el estilo en la tabla de `video-agent/styles/README.md`:

  | Estilo | Para qué formato | Referencias | Estado |
  |---|---|---|---|

  Estados: `borrador` (sin referencia medida), `en-prueba` (medido y probado en un video, falta su OK), `aprobado` (aprobó un video final con este estilo; no cambiarlo sin preguntar).
- Contarle en pocas líneas qué se midió, qué se copió, qué quedó afuera y por qué.
- De ahora en más: `/aion-editar <video> estilo <nombre>`.
- Cada cosa que rechace de este estilo se anota en su `STYLE.md` y en `notes` del `style.json`.
