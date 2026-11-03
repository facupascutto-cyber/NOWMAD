# Fondo de agency: luz en movimiento + vidrio líquido

Fecha: 2026-11-03 · Página: `agency.html` (la nuestra; `explorers*.html` es de Facu y no se toca)

## Por qué

La Tierra 3D se veía como un render ("parece un dibujito") y no tenía nada que ver con la
página de Facu. Se probó una foto real de Buenos Aires de noche desde la ISS y se descartó
(quedaba sucia y se pixelaba en el zoom). Se fue a un fondo que no intenta ser real:
luz de estudio digital, en los azules de agency.

## Qué hay

- **`agency-flow.js`**: shader WebGL sin librerías. Cinco masas de luz (cobalto, azul
  eléctrico, violeta, un brillo celeste y un violeta oscuro) que orbitan despacio, con bordes
  deformados por ruido simplex. Negro azulado profundo entre ellas y viñeta para que el texto
  siempre caiga sobre oscuro. Se mueve apenas con el mouse y con el scroll; hacia el contacto
  la luz se entibia un poco (guiño a la paleta de explorers).
  - Se dibuja a 0,6 de la resolución CSS y a ~30 cuadros; se pausa con la pestaña oculta.
  - Con `prefers-reduced-motion`: un solo cuadro fijo.
  - Sin WebGL: degradé equivalente en CSS (`.ag-flow`).
  - En pantallas verticales la luz se reacomoda para que no quede fuera de cuadro.
- **Grano**: SVG de ruido en CSS (`.page-agency::after`) a resolución completa.
- **Vidrio líquido** (misma idea que explorers, en azul): relleno translúcido con desenfoque y
  un borde que brilla arriba y abajo, en tarjetas, terminal, preguntas, cruce a explorers y
  vista previa del mensaje.

## Qué se fue

- Three.js, `agency-3d.js`, `agency-satellite.js`, `assets/earth/`, `assets/ba/`.
- La sección "viaje" al Obelisco (600vh de scroll que dependían del 3D).

## Arreglos de paso

- Botón de WhatsApp en agency: el texto salía blanco sobre blanco; ahora va oscuro en vidrio.
- La brújula del medio de Servicios (antes oculta por el 3D) quedó más chica y en celeste.

## Pendiente (fuera de este cambio)

Menú en píldora y títulos con palabra fina, para alinear más con explorers.
