# PARPADEO — Logo motion

Identidad experimental de lentes. Vite + GSAP + MorphSVGPlugin, SVG inline y módulos ES.

## Desarrollo

Node.js 22.12+ o 24 LTS. Usar Vite, no Live Server.

```sh
npm install
npm run dev
npm run build
npm run preview
```

`dist/` contiene el sitio publicable. Para una subcarpeta: `npm run build -- --base=/nombre-del-repo/`.

## GitHub Pages

En el repositorio `choochshoot/parpadeo`, abrir **Settings → Pages → Build and deployment → Source** y elegir **GitHub Actions**. Subir `.github/workflows/deploy.yml` a `main` para iniciar la publicación. El workflow instala dependencias con `npm ci`, ejecuta las pruebas, compila con `--base=/parpadeo/` y publica únicamente `dist/`.

Al terminar correctamente, la web estará en `https://choochshoot.github.io/parpadeo/`. Cada push a `main` repetirá la publicación. No es necesario subir `dist` ni `node_modules`. La ejecución se puede consultar o reiniciar desde **Actions → Publish PARPADEO to GitHub Pages**.

## Módulos

- `selectors.js`: IDs originales del logo, sin renombrar.
- `prepareSvg.js`: accesibilidad, contenedores neutros y sustitución visual de los ojos.
- `wordmarkShadow.js`: sombra estática y suave detrás del lettering, derivada de su silueta mediante un filtro SVG.
- `eyeAssets.js`: carga de los tres adjuntos, ubicación de cada ojo y alineación de cejas.
- `eyeMotion.js`: crecimiento, aparición y parpadeo con MorphSVG.
- `eyeGaze.js`: barridos suaves de la mirada, pausa durante el parpadeo y retorno al centro.
- `eyeFinale.js`: mirada frontal sugerida con las pupilas, glitch luminoso sobre copias de los ojos y desaparición.
- `motion.js`: entrada de letras, óptica y luz.
- `letterGlitch.js`: E que nace de una línea central y se abre en 900 ms.
- `letterFlash.js`: destello cálido sobre una copia de la E, con halo estático y animación de opacidad.
- `lightSweep.js`: máscara temporal del lettering y barrido de luz de la O a la P y de vuelta.
- `logoTimeline.js`: coordinación de las secuencias.
- `logoAudio.js`: reproducción optativa de dos WAV sincronizados con `letters`, `sweep` y `sweepReturn`, en un único contexto de audio. Las dos reproducciones eléctricas comparten descarga y buffer decodificado.
- `main.js`: carga, controles, pausa por visibilidad y movimiento reducido.
- `headphones.js`: transición GSAP de las cuatro vistas de audífonos junto al control «Experiencia sonora». Las miniaturas PNG transparentes de 192 px se muestran a 56–64 px y pesan unos 200 KB en total; los archivos aportados no se modifican.

## SVG y conservación

El lettering se presenta en `#1C819E`, definido por `--wordmark-ink` en CSS y aplicado en runtime al relleno de las letras. Se conservan los colores de ojos, iris, destellos y esfera; el archivo SVG fuente permanece intacto.

`public/assets/svg/parpadeo-logo.svg` permanece intacto. Los paths `path73` y `path73-9` conservan sus IDs y datos; se ocultan en runtime para mostrar los ojos nuevos dentro de `layer8`. El lettering conserva sus paths y matrices originales. La E solo recibe una compresión temporal en su contenedor, que vuelve a escala 1.

Los adjuntos se copian sin editar en `public/assets/svg/eyes/`:

| Archivo del proyecto | Adjunto original | Uso |
| --- | --- | --- |
| `growth.svg` | crecimiento de ojos.svg | Círculos iniciales |
| `open.svg` | ojos nuevos.svg | Ojos abiertos y pupilas |
| `closed.svg` | ojos cerrados.svg | Estado cerrado del parpadeo |

Se mantienen los colores de los adjuntos. Cada ojo se coloca con escala uniforme en el espacio del ojo anterior, ordenados de izquierda a derecha. Los documentos tienen recortes y posiciones diferentes: se alinean las cejas del estado cerrado con las del abierto antes del morph. Los elementos importados tienen IDs propios para evitar duplicados.

Los adjuntos actuales identifican las pupilas como `path156-3-6` y `path156-3-6-4`, no como `miradaizq` y `miradader`. Estos últimos nombres se asignan a sus contenedores de movimiento en runtime. La mirada se mueve en la misma dirección en ambos ojos, con un recorrido limitado a 2.4 unidades locales por lado; se detiene durante el parpadeo y queda centrada antes del glitch final. No se renombra ningún elemento de los archivos fuente.

MorphSVG transforma las copias de los nuevos ojos durante el parpadeo. Al reabrir, se restaura el `d` exacto del ojo abierto. No se modifica ningún archivo fuente. El sistema anterior de 874 partículas se sustituye por dos ojos, dos pupilas y dos círculos.

## Secuencia

1. Los círculos aparecen pequeños, crecen y dan paso a los ojos abiertos; termina antes de 2.25 s.
2. A los 2.65 s entra PARPADEO, con el glitch individual de la E, seguido por la luz y el enfoque.
3. Ambos ojos parpadean dos veces, a los 5.75 s y 6.45 s: cada parpadeo tiene cierre de 140 ms, pausa de 90 ms y apertura de 240 ms usando el dibujo adjunto. Entre ambos quedan abiertos 230 ms; las pupilas permanecen centradas hasta completar el segundo.
4. A los 7.95 s las pupilas sugieren una mirada frontal. A los 8.95 s ambos ojos hacen un glitch luminoso de 350 ms y desaparecen. Dos copias de su silueta producen el destello cálido y los pequeños saltos; su halo es estático y solo se animan posición y opacidad. Las copias quedan invisibles al terminar y con movimiento reducido.
5. A los 9.45 s la esfera recorre el texto de derecha a izquierda y vuelve a la O, iluminando las letras con una máscara estática.

La secuencia dura 14.8 s y termina sin bucle, con el lettering y la luz en reposo. Los filtros originales permanecen estáticos. Fuera del breve morph se animan transform y opacity; no se mide geometría por fotograma.

El lettering tiene una sombra oscura desplazada 2 unidades a la derecha y 6 hacia abajo, con desenfoque de 5 unidades y opacidad de 0.65. El filtro SVG genera la silueta trasera sin duplicar paths ni IDs; acompaña automáticamente la entrada de cada letra y el glitch de la E. Sus parámetros no se animan y la sombra permanece en movimiento reducido. Solo se aplica al lettering, no a los ojos ni a la esfera luminosa. El barrido luminoso excluye este filtro de su máscara.

El control circular (`paletteController.js`) permite cambiar el color dominante del lettering: norte crema `#E6E6D4`, este teal `#1C819E`, sur amarillo `#FFBE00` y oeste azul oscuro `#005874`. GSAP interpola la variable CSS del lettering durante 0.65 segundos, independientemente de la reproducción del logo. Admite clic, toque y flechas del teclado; con movimiento reducido aplica el color inmediatamente. No calcula porcentajes de superficie de la composición. La imagen decorativa WebP conserva transparencia, mide 384 × 384 px y pesa 30,238 bytes; se muestra a 176–192 px. Los paths originales permanecen intactos.

Con `prefers-reduced-motion` se muestran los ojos nuevos abiertos y el logo estático, sin timeline. Cambiar la preferencia durante la reproducción restaura ese estado, elimina el barrido temporal y deshabilita los controles. Repetir reinicia la secuencia; ocultar la pestaña pausa sin perder una pausa manual.

## Sonido

El control muestra «Experiencia sonora» y «Mejor con audífonos». Las cuatro vistas cambian suavemente durante 2.8 segundos y terminan estáticas, sin bucle. La animación comparte pausa, repetición y visibilidad de pestaña con la timeline del logo. En movimiento reducido se muestra únicamente la primera vista. Si una imagen falla, se omite sin impedir la carga de la identidad ni del audio.

El botón **Activar sonido** habilita ambos audios mediante una interacción y reinicia la animación. El whoosh se conserva sin convertir en `public/assets/audio/lettering-whoosh.wav` y entra con el texto, en la etiqueta `letters` (2.65 s). El adjunto `mixkit-small-electric-glitch-2595.wav` se copia sin alterar a `public/assets/audio/light-sweep-glitch.wav` y suena al iniciar el barrido, en `sweep` (9.45 s), y de nuevo desde el principio al iniciar el regreso a la O, en `sweepReturn` (12.6 s). No se repite en bucle ni se estira el sonido. La misma etiqueta coordina el movimiento de regreso y su audio. **Silenciar** detiene ambos al instante; **Repetir** conserva la preferencia durante la sesión.

El audio se carga solo al activarlo y se reproduce con Web Audio. Pausa, cambio de pestaña, reinicio y reanudación siguen el reloj de GSAP, sin superponer reproducciones. Con movimiento reducido se desactiva el sonido y su botón. Los errores de carga permiten reintentar sin bloquear el logo. El contexto de audio y las escuchas de controles se liberan al recargar el módulo.

## Pruebas

```sh
node --test --test-isolation=none tests/eyes.test.js tests/finale.test.js tests/letterGlitch.test.js
node --test --test-isolation=none tests/audio.test.js
node --test --test-isolation=none tests/headphones.test.js
node --test --test-isolation=none tests/particles.test.js
node --test --test-isolation=none tests/particleBounce.test.js
npm run build
```

Las pruebas verifican los assets, la alineación geométrica de las cejas, el hash del logo original, el crecimiento, las pausas de la mirada, el cierre final, el regreso de la luz y el reinicio. También comprueban los 900 ms de la E, su destello y la restauración al desactivar movimiento. No sustituyen la revisión visual en navegador.

Revisar a 320, 390 y 1440 px, además de móvil horizontal. Comprobar el parpadeo y sus cejas, pausa/repetición durante el cierre y el barrido, y movimiento reducido antes de cargar y en mitad del morph. Al reducir movimiento deben verse los ojos nuevos abiertos y la esfera en la O. Los ojos antiguos deben permanecer ocultos.

El modo opcional de partículas (`letterParticles.js`) usa GSAP + Physics2DPlugin. Al activarlo, termina la secuencia en silencio y genera círculos dentro del relleno original mediante `isPointInFill`, conservando huecos y transformaciones. El lettering original se oculta temporalmente sin modificar sus paths. Los puntos heredan el color de la paleta. Clic/toque sobre el logo o el botón accesible «Dispersar partículas» produce una dispersión con gravedad y retorno; el ratón atrae puntos cercanos. «Volver al logo», «Repetir» o activar sonido restaura el lettering. El límite es de 700 puntos en móvil y 1400 en escritorio, según el ancho al generar la capa; las coordenadas SVG escalan al redimensionar. Con movimiento reducido se permite la versión estática, sin dispersión. Ocultar la pestaña cancela el movimiento. Verificar visualmente la interacción, los cambios de paleta y la restauración durante una dispersión.

La dispersión calcula el contacto con la línea amarilla en coordenadas SVG en cada activación. Cada punto cae con gravedad, toca la línea con su borde inferior, rebota con amortiguación variable y regresa al lettering. Los impactos quedan dentro de los extremos de la línea; una única onda de opacidad acompaña el contacto. Redimensionar durante el vuelo cancela el movimiento y restaura los puntos para evitar contactos desalineados. El brillo se restaura también al salir del modo o esconder la pestaña. `particleBounce.test.js` verifica contacto, extremos y trayectoria ascendente del rebote.

No se incluyen servicios externos ni fuentes remotas. `.gitignore` excluye dependencias y compilados.
