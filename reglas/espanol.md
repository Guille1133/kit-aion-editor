# Español en pantalla

El motor viene pensado para francés e inglés. Esto lo deja bien en español.

## Voseo o tú

`video-agent/marca.md` dice si el alumno habla con voseo (vos tenés) o con tú (tú tienes). Whisper mezcla las dos formas.

Con **voseo**, después de `words` revisar `files/words.md` y agregar a `captions.replace` las formas de tú que aparezcan. Las más comunes:

```js
['sabes', 'sabés'], ['tenes', 'tenés'], ['tienes', 'tenés'], ['quieres', 'querés'], ['puedes', 'podés'],
['haces', 'hacés'], ['necesitas', 'necesitás'], ['piensas', 'pensás'], ['publicas', 'publicás'],
['apareces', 'aparecés'], ['preguntas', 'preguntás'], ['conoces', 'conocés'], ['escondes', 'escondés'],
['comunicas', 'comunicás'], ['miras', 'mirás'], ['fíjate', 'fijate'], ['guárdalo', 'guardalo'],
['compártelo', 'compartilo'], ['dime', 'decime'], ['mira', 'mirá'], ['escucha', 'escuchá'],
```

Ojo: `preguntas` también es sustantivo ("tengo dos preguntas"). Reemplazar solo cuando es verbo; si dudás, mirar la frase en `words.md`.

Con **tú**, al revés solo si Whisper escribió voseo que el alumno no usa.

## Palabras mal escuchadas

El guion manda. Cada palabra que Whisper escribió distinto al guion va a `captions.replace` (`['Ah, me habían logrado', 'mañana lo grabo']`), nunca tocando los tiempos.

## Números

- Miles con punto y decimales con coma: en cada `counter` poner `sep: '.'` y `decSep: ','`. Sin esto sale "44 000" (formato francés).
- Porcentajes pegados: "100%".
- Plata: "USD 2.250" o "$2.250", como lo diga el guion.

## Texto

- Tildes y signos de apertura (¿ ¡) siempre.
- Sin raya (—) en ningún texto en pantalla.
- Mayúsculas solo al principio y en nombres propios, salvo que el estilo pida todo en mayúsculas.
