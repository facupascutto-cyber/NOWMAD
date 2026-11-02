# Rediseño de agency.html — nowmad agency

Fecha: 2026-11-02 · Rama: `agency`

## Objetivo

Que `agency.html` venda a nowmad agency: desarrollo full stack (web, sistemas a medida, IA) y growth (Google Ads, Meta Ads, medición). La página tiene que demostrar lo que dice: rápida, cuidada y con interacción propia de la marca.

## Límites

- Solo trabajamos `agency.html` y archivos nuevos propios: `agency.css` y `agency.js`.
- `styles.css`, `main.js`, `index.html` y `explorers.html` son compartidos o de Facu: no se modifican.
- Sitio estático en Apache/Hostinger. Sin backend, sin build, sin librerías externas.
- Nada de datos inventados: proyectos, número de WhatsApp y mail quedan como campos a completar.

## Dirección visual

Misma marca del grupo (logo con brújula, Unbounded / Hanken Grotesk / JetBrains Mono, tokens de `styles.css`) con tono propio: base oscura `--ink`, acento celeste y detalles técnicos en mono. Referencias: Awwwards 2025 (un objeto de marca que actúa, paleta corta con un acento, moderación).

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

Demo de chatbot con IA en vivo (necesita backend y API key), WebGL/3D, View Transitions entre páginas (toca archivos compartidos: coordinar con Facu).
