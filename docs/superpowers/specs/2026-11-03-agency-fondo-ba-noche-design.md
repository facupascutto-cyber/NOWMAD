# Fondo de agency: Buenos Aires de noche, foto real

Fecha: 2026-11-03 · Página: `agency.html` (la nuestra; `explorers*.html` es de Facu y no se toca)

## Por qué

La Tierra 3D se ve como un render ("parece un dibujito") y no tiene nada que ver con la
página de Facu (`explorers-glass.html`), que es toda video y foto real. La línea que
compartimos no es el look sino que **el fondo sea real y cuente qué hacemos**:
explorers muestra el territorio de día; agency muestra la ciudad de noche, desde arriba.

Bonus de la foto elegida: el centro es luz LED blanca/azulada (paleta agency) y el
conurbano es sodio naranja (paleta explorers). Las dos ramas en la misma imagen.

## La foto

- "Traversing Buenos Aires at Night", **ISS073-E-176299**, astronauta de la ISS, 20/05/2025,
  Nikon Z9 a 200 mm. 4128×2752 px.
- Fuente: https://science.nasa.gov/earth/earth-observatory/traversing-buenos-aires-at-night-154789
  (archivo: `.../imagerecords/154000/154789/iss073e0176299_lrg.jpg`).
- Uso libre con crédito. Crédito en el pie de la página y en el viaje:
  "Foto: ISS073-E-176299 · ISS Crew Earth Observations, NASA Johnson Space Center".
- Descartada NASA Black Marble: 500 m por píxel, no se ven calles.

## Assets nuevos (`assets/ba-noche/`)

- `ba-noche-2400.webp`: foto entera reducida a 2400 px de ancho (objetivo ≤ 350 KB).
- `ba-noche-1200.webp`: misma foto para celular (objetivo ≤ 120 KB).
- `ba-noche-centro.webp`: recorte del microcentro a resolución original, para el final del
  zoom (objetivo ≤ 250 KB). Se carga recién cuando el viaje entra en pantalla.
- `ba-noche.json`: posición del Obelisco y del recorte en coordenadas de la foto (0–1),
  para que CSS/JS no tengan números mágicos.

La foto está girada (el río queda arriba a la derecha). El Obelisco se ubica a mano,
siguiendo la 9 de Julio y el puerto, y se verifica superponiendo el marcador antes de dar
por bueno el punto.

## Cómo se ve al bajar

1. **Portada.** La foto entera de fondo a pantalla completa, oscurecida abajo para que
   se lea el título. Deriva muy lenta (traslación de pocos px en ~60 s), como la ISS
   pasando. El terminal de la portada queda. Se van la leyenda "Tierra en vivo" y el
   "arrastrá" de la Tierra.
2. **Viaje** (`.ag-journey`, mismos 5 pasos y textos). Scroll controla un zoom sobre la foto
   hacia el microcentro. Cuando el zoom pasa ~1,6× entra el recorte de alta resolución
   (fundido) para que el final siga nítido. En el paso "El Obelisco" aparece un marcador
   (punto + anillo que late, en `--ag-accent`) sobre el Obelisco. El zoom frena donde la
   foto se sigue viendo nítida; no se estira más. Si el final queda pobre, se corta a
   escala barrio. El medidor "Altura" se reemplaza por un dato honesto y fijo: la foto se
   tomó desde ~420 km (ISS); se muestra "ISS · 420 km" y el zoom aproximado ("×1", "×2"…).
3. **Resto de la página.** La foto queda fija detrás (`position: fixed`), con un velo
   oscuro más fuerte (~80 %) para que se lea el texto, y un corrimiento leve con el
   scroll. Las tarjetas de vidrio existentes desenfocan la ciudad de atrás.
4. **Contacto.** Se mantiene el bloque actual.

## Qué se va

- `agency-3d.js`, `agency-satellite.js`, el `importmap` de Three.js y el `<canvas class="ag-scene">`.
- Anclas `data-anchor` / `data-pose` y su CSS (`.ag-anchor*`, `.ag-earth-caption`, `.has-3d`…).
- `assets/earth/` y `assets/ba/` quedan sin uso: se borran en el mismo cambio.

Resultado: la página deja de bajar Three.js y texturas; carga 1–2 imágenes.

## Implementación

- Todo en `agency.html`, `agency.css`, `agency.js`. No se tocan `styles.css` ni `main.js`
  (compartidos con Facu).
- Fondo: un `<div class="ag-bg">` fijo con la foto como `<img>` (con `srcset` 1200/2400,
  `fetchpriority="high"` porque es el LCP) + el recorte de centro como segunda capa.
- Zoom y deriva con `transform` (scale/translate) sobre la capa, calculados en
  `agency.js` desde el progreso de scroll del viaje (`requestAnimationFrame`, sin
  librerías). Nada de animar `background-position` ni `width`.
- `prefers-reduced-motion`: sin deriva ni zoom continuo; el viaje muestra la foto en
  cuatro encuadres fijos con fundido entre pasos.
- Arreglo de paso: en agency el texto "Escribinos" del botón de WhatsApp sale blanco sobre
  blanco; se corrige el color dentro de `.page-agency` en `agency.css`.

## Fuera de alcance

Menú en píldora, títulos con palabra fina, barra de avance y otros detalles de
"alineación" con explorers: quedan para después, una vez que el fondo esté.

## Cómo se prueba

- Capturas a 1440×900 y 390×844: portada, tres puntos del viaje (inicio, mitad, Obelisco),
  servicios, contacto. Comparar con `explorers-glass.html`.
- Consola sin errores. Sin scroll horizontal en 390 px.
- Peso total de imágenes de fondo en la carga inicial ≤ 400 KB en escritorio.
- Con reduced motion activado, el viaje funciona sin zoom continuo.
