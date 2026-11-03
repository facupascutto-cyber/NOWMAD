# Rediseño de agency.html — nowmad agency

Fecha: 2026-11-02 · Rama: `agency`

## Objetivo

Que `agency.html` venda a nowmad agency: desarrollo full stack (web, sistemas a medida, IA) y growth (Google Ads, Meta Ads, medición). La página tiene que demostrar lo que dice: rápida, cuidada y con interacción propia de la marca.

## Límites

- Solo trabajamos `agency.html` y archivos nuevos propios: `agency.css`, `agency.js` y `agency-3d.js`.
- `styles.css`, `main.js`, `index.html` y `explorers.html` son compartidos o de Facu: no se modifican.
- Sitio estático en Apache/Hostinger. Sin backend ni build. Única librería: Three.js por CDN, solo en agency.
- Nada de datos inventados: proyectos, número de WhatsApp y mail quedan como campos a completar.

## Dirección visual

Misma marca del grupo (logo con brújula, Unbounded / Hanken Grotesk / JetBrains Mono) con tono propio: **toda la página oscura** (paleta redefinida bajo `.page-agency`), acento celeste, superficies de vidrio y detalles técnicos en mono. Tiene que diferenciarse claramente de explorers (cálida y clara). Referencias: Awwwards 2025 (un objeto de marca que actúa, paleta corta con un acento).

## Fondo 3D (agency-3d.js): la Tierra en vivo

- Escena WebGL fija detrás de toda la página, con Three.js 0.170 desde jsDelivr (import map). Se descarga **después del evento load**: el panel de rendimiento mide solo la carga inicial.
- Objeto real, no inventado: la Tierra con texturas de la NASA (Blue Marble de día, Black Marble de noche, nubes), de dominio público, en `assets/earth/` (4096 px en escritorio, 2048 px en celular).
- El sol está en su posición real según la fecha y la hora UTC (declinación + ecuación del tiempo); la línea día/noche se actualiza cada minuto. Una leyenda en el hero dice si en Buenos Aires es de día o de noche ahora.
- Shader propio: luz difusa, reflejo del sol en el agua, sombra de nubes, luces de ciudades que titilan, rayos en tormentas nocturnas, tinte de atardecer y bruma atmosférica; capa de atmósfera azul/naranja en el limbo. Sol con destello que la Tierra puede tapar. Vía Láctea procedural, estrellas con temperatura de color y estrellas fugaces.
- Buenos Aires marcada en 34°36′S 58°22′O con una onda de tamaño constante en pantalla.
- Coreografía por anclas `[data-anchor]`: hero (planeta a la derecha mirando a Buenos Aires, se puede arrastrar), servicios (horizonte desde órbita), proyectos (descenso hacia Buenos Aires), proceso/FAQ (planeta de costado girando), contacto.
- Post-proceso: tono AgX, MSAA, bloom solo en luces reales, viñeta, grano y leve aberración cromática.
- Rendimiento: DPR limitado, texturas y geometría más livianas en celular, calidad adaptativa (menos de 30 fps → sin post-proceso; menos de 20 → sin animación continua), redibujo solo ante cambios con `prefers-reduced-motion`.
- Sin WebGL o si falla la carga: fondo con degradés, nunca vacío.

## Viaje a Buenos Aires (sección `#buenos-aires`)

- Sección de 600vh con texto fijo que cambia por tramos: coordenadas → Buenos Aires → 9 de Julio → El Obelisco → "Acá estamos". Indicador de altura calculado con la cámara real.
- Tramo 1: zoom a la Tierra de la NASA hasta casi tocar Buenos Aires. Cambio de escena "atravesando las nubes" (fundido en el post-proceso).
- Tramo 2, con API key (`<meta name="nowmad-google-key">`): Google Photorealistic 3D Tiles (`agency-google.js`, 3DTilesRendererJS 0.5.3). La cámara baja de ~9 km a dar la vuelta al Obelisco real. Se muestran logo y atribución de Google mientras se ven las teselas. La key debe estar restringida por dominio y con tope diario.
- Tramo 2, sin key o si Google falla: respaldo con la foto satelital Sentinel-2 cloudless 2016 de EOX (`agency-satellite.js`), bajando solo hasta ~5 km para que siga nítida.
  Con leve enfoque (máscara de desenfoque) y un marcador sobre el Obelisco real (cruce de la 9 de Julio y la Diagonal Norte) que aparece con el texto "El Obelisco". El encuadre corre el Obelisco a un lado libre del título: a la derecha en pantallas anchas, abajo en celular. Foto de 2048 px en todos los dispositivos.
- `?hora=HH` (hora de Buenos Aires) fuerza la posición del sol para probar de día o de noche.
- Se descartó una ciudad generada con OpenStreetMap: no era real.

## Estructura

1. **Hero** (oscuro). Logo + "agency", título, dos CTA (Armá tu pedido / Ver proyectos). A la derecha, un **panel de terminal que mide la propia página en vivo** con la Performance API: carga completa, LCP (si el navegador lo soporta), peso y cantidad de pedidos de la carga inicial. Detrás, la Tierra en vivo (ver "Fondo 3D").
2. **Servicios: Construir / Crecer.** Dos columnas (Webs, Sistemas a medida, IA | Google Ads, Meta Ads, Medición) con una **brújula en el medio cuya aguja apunta a la tarjeta que tenés bajo el cursor o con foco**. Con el 3D activo la brújula dibujada se oculta y detrás se ve el horizonte de la Tierra. En mobile se apilan.
3. **Proyectos.** Tarjetas en **marco de navegador** con URL; la captura (alta, de página completa) se desplaza al pasar el mouse. Entran con animación ligada al scroll (`animation-timeline: view()`). Arranca con plantillas marcadas para completar.
4. **Cómo trabajamos.** Los 4 pasos actuales con el recorrido que avanza con el scroll (reutiliza `.route` / `initRoute` de `main.js`).
5. **Preguntas frecuentes.** `<details>` nativos; respuestas basadas en lo que la página ya afirma.
6. **Contacto: armador de pedido.** Chips de servicios, rubro y plazo → arma el mensaje en vivo y abre WhatsApp (`wa.me`) con el texto. Si no hay número cargado, el mismo mensaje sale por mail.
7. Link a explorers y footer (sin cambios).

## Comportamiento y bordes

- Sin JS: todo el contenido se lee; el botón de contacto es un `mailto`; el panel explica que mide con JavaScript.
- `prefers-reduced-motion`: sin animaciones de scroll, sin tipeo, la aguja salta sin animar.
- Navegadores sin `animation-timeline`: los elementos se muestran estáticos (todo va dentro de `@supports`).
- Accesibilidad: chips como checkbox/radio reales con foco visible, vista previa del mensaje con `aria-live="polite"`, decoraciones con `aria-hidden`.

## Pendiente de datos reales

- Número de WhatsApp (`data-wa` en el formulario) y mail de la agencia (`data-mail`; hoy `hola@nowmad.travel`).
- Proyectos: nombre, rubro, qué se hizo, URL y captura de página completa en `assets/work/`. Mientras tanto la sección está oculta (`hidden`) y el CTA del hero dice "Ver servicios".
- Revisar las respuestas de las preguntas frecuentes.

## Fuera de alcance (después)

Demo de chatbot con IA en vivo (necesita backend y API key), View Transitions entre páginas (toca archivos compartidos: coordinar con Facu).
