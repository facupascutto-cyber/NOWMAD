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

## Fondo 3D (agency-3d.js)

- Escena WebGL fija detrás de toda la página, con Three.js 0.170 desde jsDelivr (import map). Se descarga **después del evento load**: el panel de rendimiento mide solo la carga inicial.
- Objeto: la "o" del logo en cromo iridiscente con entorno de estudio para reflejos, núcleo luminoso en esfera de vidrio, aguja que sigue al cursor (o a la tarjeta de servicios activa), giroscopio de tres anillos con 144 marcas de grado, satélites, galaxia espiral de partículas, estrellas, polvo desenfocado y bloom.
- Coreografía por anclas `[data-anchor]`: la brújula viaja al ancla de la sección que está en el centro de la pantalla. Poses: hero (a un costado), servicios (en la columna central), proyectos (la cámara atraviesa el anillo y el núcleo se apaga para que se lea el texto), proceso/FAQ (costados), contacto.
- Rendimiento: DPR limitado, menos partículas en celular o equipos de pocos núcleos, calidad adaptativa (si no llega a 30 fps baja resolución y saca bloom; con menos de 20 deja de animar), y redibujo solo ante cambios con `prefers-reduced-motion`.
- Sin WebGL o si falla la carga: fondo con degradés, nunca vacío.

## Estructura

1. **Hero** (oscuro). Logo + "agency", título, dos CTA (Armá tu pedido / Ver proyectos). A la derecha, un **panel de terminal que mide la propia página en vivo** con la Performance API: carga completa, LCP (si el navegador lo soporta), peso comprimido y cantidad de pedidos. Detrás, un anillo de brújula que gira con el scroll (CSS `animation-timeline: scroll()`).
2. **Servicios: Construir / Crecer.** Dos columnas (Webs, Sistemas a medida, IA | Google Ads, Meta Ads, Medición) con una **brújula en el medio cuya aguja apunta a la tarjeta que tenés bajo el cursor o con foco**. En mobile se apilan y la brújula se oculta.
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
- Proyectos: nombre, rubro, qué se hizo, URL y captura de página completa en `assets/work/`.
- Revisar las respuestas de las preguntas frecuentes.

## Fuera de alcance (después)

Demo de chatbot con IA en vivo (necesita backend y API key), View Transitions entre páginas (toca archivos compartidos: coordinar con Facu).
