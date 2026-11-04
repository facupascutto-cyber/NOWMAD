/* Diario de ruta: las historias y todo lo que las muestra.
   Lo usan diario.html, entrada.html, sus versiones en inglés y el bloque "Diario" de explorers.
   Va antes que explorers-glass.js: deja armado el contenido y ese archivo le suma animaciones y WhatsApp. */
(function () {
  "use strict";

  // =====================================================================================
  // ENTRADAS
  // Para sumar una historia copiá un bloque entero, cambiá el id (minúsculas, sin espacios
  // ni tildes: es lo que va en la dirección entrada.html?id=...) y completá los campos.
  //   fecha: AAAA-MM-DD · coords: [latitud, longitud] (negativas en Argentina)
  //   etiqueta: Selva, Montaña, Ciudad, Agua, Hielo, Mar... (los filtros salen solos de acá)
  //   foto: ruta a la imagen, o "" para usar un fondo de color de la paleta
  //   cuerpo / cuerpo_en: un texto por párrafo
  //   ruta_relacionada: opcional, un enlace a un viaje parecido
  //   destacada: true para que vaya grande arriba (si ninguna lo tiene, va la más nueva)
  //   placeholder: true muestra el sello "PLACEHOLDER": borralo cuando la historia sea real
  // =====================================================================================
  var ENTRADAS = [
    {
      id: "iguazu-garganta-temprano",
      placeholder: true,
      titulo: "Iguazú: la Garganta del Diablo a las ocho de la mañana",
      titulo_en: "Iguazú: the Devil's Throat at eight in the morning",
      lugar: "Cataratas del Iguazú, Misiones",
      lugar_en: "Iguazú Falls, Misiones",
      coords: [-25.6953, -54.4367],
      fecha: "2026-09-14",
      etiqueta: "Selva",
      foto: "assets/photos/iguazu-1100.webp",
      foto_grande: "assets/photos/iguazu-2000.webp",
      foto_alt: "La Garganta del Diablo, en las cataratas del Iguazú, con la nube de agua que levanta la caída",
      foto_alt_en: "The Devil's Throat at Iguazú Falls, with the cloud of spray rising from the drop",
      extracto: "Llegamos antes que los micros, caminamos las pasarelas con el parque casi vacío y entendimos por qué conviene madrugar.",
      extracto_en: "We got there before the tour buses, walked the catwalks with the park almost empty and understood why it pays to get up early.",
      cuerpo: [
        "Salimos del hotel a las siete y media, con el desayuno en la mochila. A esa hora el Parque Nacional Iguazú todavía está en silencio: los coatíes dan vueltas por la entrada y el aire ya se siente pesado, con olor a tierra mojada.",
        "Tomamos el primer Tren de la Selva hasta la estación Garganta. Desde ahí es poco más de un kilómetro de pasarelas sobre el río, tan quieto que cuesta creer lo que viene después. Primero se escucha, después se siente la llovizna en la cara y recién al final aparece.",
        "La Garganta del Diablo no entra en una foto. Es una herradura de agua que cae y levanta una nube que tapa el fondo. Nos quedamos un buen rato en el mirador, casi solos, hasta que a las diez empezaron a llegar los grupos.",
        "A la tarde hicimos el Circuito Inferior, que te deja a la altura de los saltos, y terminamos empapados en el bote que se mete bajo las cascadas. Lo que nos llevamos: llegar temprano cambia todo, y conviene dejar el lado brasileño para el día siguiente."
      ],
      cuerpo_en: [
        "We left the hotel at half past seven with breakfast in our backpacks. At that hour Iguazú National Park is still quiet: coatis wander around the entrance and the air already feels heavy, smelling of wet earth.",
        "We took the first Jungle Train to Garganta station. From there it's just over a kilometer of catwalks above the river, so calm it's hard to believe what comes next. First you hear it, then you feel the spray on your face, and only at the very end does it appear.",
        "The Devil's Throat doesn't fit in a photo. It's a horseshoe of falling water that throws up a cloud hiding the bottom. We stayed at the viewpoint for a long while, almost alone, until the groups started arriving around ten.",
        "In the afternoon we did the Lower Circuit, which puts you level with the falls, and ended up soaked on the boat that goes right under the cascades. What we took home: arriving early changes everything, and the Brazilian side is best left for the next day."
      ],
      ruta_relacionada: { titulo: "Armá tu viaje a Iguazú", titulo_en: "Plan your trip to Iguazú", href: "explorers-glass.html#destinos", href_en: "explorers-en.html#destinos" }
    },
    {
      id: "esteros-del-ibera",
      placeholder: true,
      titulo: "Esteros del Iberá: una semana sin señal y con yacarés",
      titulo_en: "Esteros del Iberá: a week off the grid, among caimans",
      lugar: "Colonia Carlos Pellegrini, Corrientes",
      lugar_en: "Colonia Carlos Pellegrini, Corrientes",
      coords: [-28.5367, -57.1717],
      fecha: "2026-07-22",
      etiqueta: "Agua",
      foto: "",
      foto_alt: "",
      foto_alt_en: "",
      extracto: "Llegamos por camino de ripio y nos fuimos con la cabeza en otro ritmo: lancha al amanecer, carpinchos por todos lados y cielos enormes.",
      extracto_en: "We arrived on a gravel road and left on a different clock: boat rides at dawn, capybaras everywhere and huge skies.",
      cuerpo: [
        "Desde Mercedes son unos 120 kilómetros de ripio hasta Colonia Carlos Pellegrini. El camino es parte del viaje: ñandúes al costado, palmeras sueltas y ni un auto durante largos tramos.",
        "El pueblo está a orillas de la laguna Iberá y vive al ritmo de los esteros. La primera salida en lancha fue al amanecer: yacarés tomando sol sobre las islas flotantes, carpinchos que ni se inmutan y garzas que levantan vuelo cuando pasa el motor.",
        "Una tarde caminamos el sendero de monte junto al centro de visitantes, donde se escuchan los monos aulladores. A la noche, sin luces alrededor, el cielo se llena de estrellas como pocas veces se ve.",
        "Lo que nos llevamos: Iberá pide tiempo. Con dos noches se ve; con cuatro se entiende. Y conviene ir en otoño o en invierno, cuando el calor afloja y los animales están más a la vista."
      ],
      cuerpo_en: [
        "From Mercedes it's about 120 kilometers of gravel to Colonia Carlos Pellegrini. The road is part of the trip: rheas by the roadside, scattered palm trees and not a single car for long stretches.",
        "The village sits on the shore of Laguna Iberá and lives to the rhythm of the wetlands. Our first boat ride was at dawn: caimans sunbathing on the floating islands, capybaras that couldn't care less and herons taking off as the engine went by.",
        "One afternoon we walked the forest trail next to the visitor center, where you can hear howler monkeys. At night, with no lights around, the sky fills with more stars than you'll see almost anywhere.",
        "What we took home: Iberá needs time. Two nights and you see it; four and you understand it. Autumn and winter are the best seasons, when the heat eases off and wildlife is easier to spot."
      ],
      ruta_relacionada: null
    },
    {
      id: "quebrada-de-humahuaca",
      placeholder: true,
      titulo: "Quebrada de Humahuaca: colores, altura y empanadas",
      titulo_en: "Quebrada de Humahuaca: colors, altitude and empanadas",
      lugar: "Purmamarca, Jujuy",
      lugar_en: "Purmamarca, Jujuy",
      coords: [-23.7447, -65.4996],
      fecha: "2026-05-03",
      etiqueta: "Montaña",
      foto: "",
      foto_alt: "",
      foto_alt_en: "",
      extracto: "Cinco días por la Quebrada, de Purmamarca a las Salinas Grandes y el Hornocal, aprendiendo a subir despacio.",
      extracto_en: "Five days along the Quebrada, from Purmamarca to the Salinas Grandes and the Hornocal, learning to take altitude slowly.",
      cuerpo: [
        "Llegamos a Purmamarca a media tarde, justo cuando el sol pega de costado en el Cerro de los Siete Colores. Lo recorrimos por el Paseo de los Colorados, un circuito corto que rodea los cerros y deja ver cada capa de cerca.",
        "Al otro día subimos la Cuesta de Lipán hasta los 4.170 metros y bajamos a las Salinas Grandes. El blanco encandila y el silencio es total. Ahí aprendimos la regla del norte: caminar despacio, tomar mucha agua y no apurar la altura.",
        "Seguimos por Tilcara, con su pucará y su mercado, y llegamos a Humahuaca. Desde ahí, un camino de cornisa lleva al mirador del Hornocal, la serranía de los catorce colores, a más de 4.300 metros.",
        "Lo que nos llevamos: el norte se disfruta con calma y con tiempo para comer. Locro, tamales y empanadas jujeñas en cada parada, y noches frías aunque de día haga calor."
      ],
      cuerpo_en: [
        "We reached Purmamarca mid-afternoon, just as the low sun hit the Hill of Seven Colors. We walked the Paseo de los Colorados, a short loop around the hills that lets you see every layer up close.",
        "The next day we climbed the Cuesta de Lipán to 4,170 meters and dropped down to the Salinas Grandes salt flats. The white is blinding and the silence is total. That's where we learned the rule of the north: walk slowly, drink plenty of water and don't rush the altitude.",
        "We carried on through Tilcara, with its pre-Inca fortress and market, and reached Humahuaca. From there, a cliffside road climbs to the Hornocal viewpoint, the range of fourteen colors, at over 4,300 meters.",
        "What we took home: the north is best enjoyed slowly, with time to eat. Locro, tamales and Jujuy-style empanadas at every stop, and cold nights even after hot days."
      ],
      ruta_relacionada: null
    }
  ];
  // ============================== fin de las entradas ==============================

  var EN = /^en/i.test(document.documentElement.lang || "");
  function t(es, en) { return EN ? en : es; }
  var TAGS_EN = { "Selva": "Jungle", "Montaña": "Mountains", "Ciudad": "City", "Agua": "Water", "Hielo": "Ice", "Mar": "Sea", "Desierto": "Desert", "Bosque": "Forest", "Vino": "Wine" };
  // Silueta de Argentina del mapa de Destinos, en las mismas coordenadas
  var LAND = "M134.0 674.0L119.0 675.0L111.0 667.9L101.5 667.4L84.6 667.4L84.6 622.7L90.6 632.0L98.5 647.0L119.0 659.0L141.1 664.0L134.0 674.0ZM142.4 11.5L151.7 26.0L157.8 9.9L175.8 10.7L178.3 15.0L207.3 47.6L220.2 50.7L239.4 65.4L255.7 73.2L257.9 82.1L242.4 112.5L258.3 117.9L276.0 121.0L288.5 117.8L302.8 102.4L305.3 84.8L313.2 81.0L321.1 92.5L320.7 108.5L307.5 119.5L296.9 127.6L279.1 147.1L258.1 174.3L254.1 190.3L249.9 210.9L250.1 230.8L246.7 235.3L245.4 248.2L244.4 258.6L264.4 275.8L262.2 289.5L272.1 298.3L271.3 308.0L256.1 333.7L232.7 344.4L201.1 348.6L183.8 346.6L187.1 358.5L183.9 373.5L186.8 383.5L177.4 390.6L161.2 393.3L146.1 386.1L140.0 391.3L142.2 411.2L152.8 417.2L161.4 410.9L166.1 421.3L151.6 427.5L139.0 439.9L136.7 460.0L132.9 470.7L118.0 470.8L105.7 481.0L101.2 496.0L116.7 510.7L131.7 514.7L126.3 532.7L107.7 543.9L97.5 567.4L83.1 575.3L76.6 584.7L81.7 605.4L92.2 617.0L85.6 616.0L70.9 612.9L32.9 610.2L26.3 598.5L26.6 583.5L16.1 584.8L10.6 577.6L9.2 556.4L21.3 547.6L26.3 534.9L24.5 524.8L32.8 507.7L38.6 481.2L36.9 469.5L43.8 465.7L42.1 458.2L34.8 454.1L40.0 445.8L32.9 438.2L29.2 415.1L35.5 411.0L32.8 386.6L36.6 366.2L40.8 348.3L50.2 341.1L45.4 321.5L45.4 303.2L57.3 290.1L56.9 273.4L65.9 253.9L66.0 235.5L61.9 231.8L54.6 197.3L64.3 176.7L62.8 157.4L68.5 139.2L78.8 120.4L89.9 108.0L85.2 100.1L88.5 93.7L88.0 60.4L105.1 50.5L110.6 29.7L108.6 24.7L121.8 6.6L142.4 11.5ZM201.7 607.0L220.6 595.0L234.0 600.0L243.5 592.0L256.1 601.0L251.4 608.0L230.1 614.0L223.0 607.0L209.6 616.0L201.7 607.0Z";

  var list = ENTRADAS.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0; });
  window.NOWMAD_DIARIO = list;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function field(e, name) { return (EN && e[name + "_en"]) || e[name] || ""; }
  function tag(e) { return EN ? (e.etiqueta_en || TAGS_EN[e.etiqueta] || e.etiqueta) : e.etiqueta; }
  function slug(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-"); }
  function entryUrl(e) { return (EN ? "entrada-en.html" : "entrada.html") + "?id=" + encodeURIComponent(e.id); }
  function diaryUrl() { return EN ? "diario-en.html" : "diario.html"; }
  function words(e) { return (field(e, "cuerpo") || []).join(" ").split(/\s+/).length; }
  function minutes(e) { return Math.max(1, Math.round(words(e) / 200)); }
  function readTime(e) { return minutes(e) + t(" min de lectura", " min read"); }
  function date(e, opts) {
    var d = new Date(e.fecha + "T12:00:00");
    try { return new Intl.DateTimeFormat(EN ? "en-US" : "es-AR", opts || { day: "numeric", month: "short", year: "numeric" }).format(d); }
    catch (err) { return e.fecha; }
  }
  function dms(v, pos, neg) {
    var a = Math.abs(v), d = Math.floor(a), m = Math.round((a - d) * 60);
    if (m === 60) { d++; m = 0; }
    return d + "°" + (m < 10 ? "0" : "") + m + "′" + (v < 0 ? neg : pos);
  }
  function lat(e) { return dms(e.coords[0], "N", "S"); }
  function lng(e) { return dms(e.coords[1], "E", t("O", "W")); }
  function alt(e) { return field(e, "foto_alt") || field(e, "lugar"); }
  function arrow() { return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function phBadge(e) { return e.placeholder ? '<span class="dr-ph" title="' + t("Historia de ejemplo: reemplazala por una real", "Sample story: replace it with a real one") + '">PLACEHOLDER</span>' : ""; }

  // Foto, o un fondo de la paleta con curvas de nivel y las coordenadas si todavía no hay foto
  function media(e, big) {
    var src = big && e.foto_grande ? e.foto_grande : e.foto;
    if (src) return '<img src="' + esc(src) + '" alt="' + esc(alt(e)) + '" loading="lazy" decoding="async" />';
    return '<span class="dr-fallback dr-fb-' + slug(e.etiqueta) + '" role="img" aria-label="' + esc(t("Sin foto todavía: ", "No photo yet: ") + field(e, "lugar")) + '"><span>' + lat(e) + " " + lng(e) + "</span></span>";
  }

  function card(e, i, extra) {
    return '<article class="dr-card' + (extra || "") + '" data-tag="' + esc(slug(e.etiqueta)) + '" style="--i:' + i + '">' +
      '<a class="dr-card-link" href="' + entryUrl(e) + '">' +
      '<span class="dr-card-media">' + media(e) + '<span class="dr-tag">' + esc(tag(e)) + "</span>" + phBadge(e) + "</span>" +
      '<span class="dr-card-body">' +
      '<span class="dr-card-meta">' + esc(field(e, "lugar")) + ' · <time datetime="' + e.fecha + '">' + date(e) + "</time></span>" +
      '<h3 class="dr-card-title">' + esc(field(e, "titulo")) + "</h3>" +
      '<span class="dr-card-excerpt">' + esc(field(e, "extracto")) + "</span>" +
      '<span class="dr-card-foot">' + readTime(e) + arrow() + "</span>" +
      "</span></a></article>";
  }

  function featured() {
    for (var i = 0; i < list.length; i++) if (list[i].destacada) return list[i];
    return list[0];
  }

  function jsonLd(data) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  // ---------- diario.html: destacada, filtros por etiqueta y grilla ----------
  function initDiary() {
    var grid = document.querySelector("[data-dr-grid]");
    if (!grid) return;
    var feat = featured();
    var featBox = document.querySelector("[data-dr-feature]");
    var filters = document.querySelector("[data-dr-filters]");
    var count = document.querySelector("[data-dr-count]");
    var log = document.querySelector("[data-dr-log]");
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (log && list.length) {
      log.innerHTML = "<span>" + t("Entradas", "Entries") + " <b>" + (list.length < 10 ? "0" : "") + list.length + "</b></span>" +
        "<span>" + t("Última", "Latest") + ' <b><time datetime="' + list[0].fecha + '">' + date(list[0]) + "</time></b></span>" +
        "<span>" + lat(list[0]) + " · " + lng(list[0]) + "</span>";
    }

    if (featBox && feat) {
      featBox.innerHTML = '<a class="dr-feature-link" href="' + entryUrl(feat) + '">' +
        '<span class="dr-polaroid">' +
        '<span class="dr-feature-media">' + media(feat, true) + '<span class="dr-tag">' + esc(tag(feat)) + "</span>" + phBadge(feat) + "</span>" +
        '<span class="dr-polaroid-cap dr-hand" aria-hidden="true">' + esc(field(feat, "lugar").split(",")[0]) + ", " + date(feat, { month: "long", year: "numeric" }) + "</span>" +
        '<img class="dr-sticker" src="assets/rumbo/rumbo-encontrado.svg" alt="" width="380" height="395" loading="lazy" decoding="async" />' +
        "</span>" +
        '<span class="dr-feature-body">' +
        '<span class="dr-kicker">' + t("Destacada", "Featured") + "</span>" +
        '<span class="dr-card-meta">' + esc(field(feat, "lugar")) + ' · <time datetime="' + feat.fecha + '">' + date(feat) + "</time></span>" +
        "<h2>" + esc(field(feat, "titulo")) + "</h2>" +
        '<span class="dr-card-excerpt">' + esc(field(feat, "extracto")) + "</span>" +
        '<span class="dr-feature-go">' + t("Leer la historia", "Read the story") + arrow() + '</span><span class="dr-card-foot">' + readTime(feat) + "</span>" +
        "</span></a>";
    }

    // Etiquetas con cuántas historias tiene cada una, en el orden en que aparecen
    var tags = [], seen = {};
    list.forEach(function (e) {
      var k = slug(e.etiqueta);
      if (!seen[k]) { seen[k] = { key: k, label: tag(e), n: 0 }; tags.push(seen[k]); }
      seen[k].n++;
    });
    var active = "all";

    function render(animate) {
      var items = active === "all" ? list.filter(function (e) { return e !== feat; }) : list.filter(function (e) { return slug(e.etiqueta) === active; });
      if (featBox) featBox.hidden = active !== "all";
      grid.innerHTML = items.map(function (e, i) { return card(e, i, animate && !reduce ? " is-anim" : " reveal"); }).join("") ||
        '<p class="dr-empty">' + t("Todavía no hay historias con esta etiqueta.", "No stories with this tag yet.") + "</p>";
      var n = active === "all" ? list.length : items.length;
      if (count) count.textContent = n + " " + (n === 1 ? t("historia", "story") : t("historias", "stories"));
      if (filters) Array.prototype.forEach.call(filters.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tag") === active)); });
      // en la primera carga las tarjetas las hace aparecer explorers-glass.js; después de filtrar ya están a la vista
      if (animate) Array.prototype.forEach.call(grid.querySelectorAll(".reveal"), function (c) { c.classList.add("is-visible"); });
    }

    if (filters) {
      filters.innerHTML = '<button type="button" data-tag="all">' + t("Todas", "All") + " <b>" + list.length + "</b></button>" +
        tags.map(function (g) { return '<button type="button" data-tag="' + g.key + '">' + esc(g.label) + " <b>" + g.n + "</b></button>"; }).join("");
      filters.addEventListener("click", function (ev) {
        var b = ev.target.closest("button[data-tag]");
        if (!b || b.getAttribute("data-tag") === active) return;
        active = b.getAttribute("data-tag");
        render(true);
        // la etiqueta queda en la dirección para poder compartir el filtro, sin recargar
        try { history.replaceState(null, "", active === "all" ? location.pathname + location.search : "#t=" + active); } catch (err) {}
      });
    }
    var fromHash = /#t=([a-z0-9-]+)/.exec(location.hash);
    if (fromHash && seen[fromHash[1]]) active = fromHash[1];
    render(false);

    jsonLd({
      "@context": "https://schema.org", "@type": "Blog", name: t("Diario de ruta · nowmad explorers", "Travel journal · nowmad explorers"), inLanguage: EN ? "en" : "es-AR",
      blogPost: list.filter(function (e) { return !e.placeholder; }).map(function (e) { return { "@type": "BlogPosting", headline: field(e, "titulo"), datePublished: e.fecha, url: entryUrl(e) }; })
    });
  }

  // ---------- explorers: las tres últimas antes de Contacto ----------
  function initLatest() {
    var box = document.querySelector("[data-dr-latest]");
    if (!box) return;
    box.innerHTML = list.slice(0, 3).map(function (e, i) { return card(e, i, " reveal"); }).join("");
  }

  // ---------- entrada.html?id=... ----------
  function miniMap(e) {
    // misma proyección que el mapa de Destinos
    var x = 81.3 + (e.coords[1] + 68.84) * 15.764, y = 83.8 + (-25.69 - e.coords[0]) * 20;
    var right = x > 190;
    return '<svg viewBox="-10 -10 383 700" role="img" aria-label="' + esc(t("Mapa de Argentina con ", "Map of Argentina showing ") + field(e, "lugar")) + '">' +
      '<path class="dr-map-land" d="' + LAND + '" />' +
      '<g class="dr-map-pin" transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ')"><circle class="dr-map-ring" r="22" /><circle class="dr-map-dot" r="8" />' +
      '<text x="' + (right ? -18 : 18) + '" y="6"' + (right ? ' text-anchor="end"' : "") + ">" + esc(field(e, "lugar").split(",")[0]) + "</text></g></svg>";
  }

  function stamp(e) {
    var d = e.fecha.split("-");
    var ring = "NOWMAD EXPLORERS · " + t("DIARIO DE RUTA", "TRAVEL JOURNAL") + " · " + field(e, "lugar").split(",")[0].toUpperCase() + " · ";
    return '<svg class="dr-stamp" viewBox="0 0 200 200" role="img" aria-label="' + esc(t("Coordenadas: ", "Coordinates: ") + lat(e) + " " + lng(e)) + '">' +
      '<defs><path id="dr-arc" d="M100 100m-75 0a75 75 0 1 1 150 0a75 75 0 1 1-150 0" /></defs>' +
      '<circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" stroke-width="3.5" />' +
      '<circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" stroke-width="1" />' +
      '<circle cx="100" cy="100" r="61" fill="none" stroke="currentColor" stroke-width="1.2" />' +
      '<text class="dr-stamp-ring"><textPath href="#dr-arc" textLength="465" lengthAdjust="spacing">' + esc(ring) + "</textPath></text>" +
      '<text class="dr-stamp-big" x="100" y="91" text-anchor="middle">' + lat(e) + "</text>" +
      '<text class="dr-stamp-big" x="100" y="117" text-anchor="middle">' + lng(e) + "</text>" +
      '<line x1="62" y1="128" x2="138" y2="128" stroke="currentColor" stroke-width="1" />' +
      '<text class="dr-stamp-small" x="100" y="144" text-anchor="middle">' + d[2] + "." + d[1] + "." + d[0] + "</text></svg>";
  }

  function initEntry() {
    var box = document.querySelector("[data-dr-entry]");
    if (!box) return;
    var id = "";
    try { id = new URLSearchParams(location.search).get("id") || ""; } catch (err) { id = (/[?&]id=([^&#]+)/.exec(location.search) || [])[1] || ""; }
    var e = list.filter(function (x) { return x.id === decodeURIComponent(id); })[0];
    // el selector ES / EN lleva a la misma historia en el otro idioma
    Array.prototype.forEach.call(document.querySelectorAll(".lang"), function (a) { a.href = a.getAttribute("href").split("?")[0] + location.search; });

    if (!e) {
      document.title = t("Historia no encontrada · Diario de ruta", "Story not found · Travel journal") + " · nowmad explorers";
      box.innerHTML = '<div class="dr-missing"><p class="label">' + t("Diario de ruta", "Travel journal") + "</p><h1>" + t("No encontramos esa historia.", "We couldn't find that story.") + '</h1><a class="glass-btn liquid-glass" href="' + diaryUrl() + '">' + t("Ver todas las historias", "See all stories") + "</a></div>";
      return;
    }

    var title = field(e, "titulo");
    document.title = title + " · " + t("Diario de ruta", "Travel journal") + " · nowmad explorers";
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", field(e, "extracto"));
    if (e.placeholder) {
      // las historias de ejemplo no se indexan en buscadores
      var robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex";
      document.head.appendChild(robots);
    }

    var body = field(e, "cuerpo") || [];
    var route = e.ruta_relacionada;
    var others = list.filter(function (x) { return x !== e; }).slice(0, 2);
    var msg = t("Hola nowmad explorers! Leí \"" + title + "\" en el Diario de ruta y quiero vivir algo así. ¿Me ayudan a armarlo?",
      "Hi nowmad explorers! I read \"" + title + "\" in your travel journal and I'd love to do something like it. Can you help me plan it?");

    box.innerHTML =
      '<header class="dr-entry-head">' +
      '<nav class="dr-crumbs" aria-label="' + t("Estás en", "You are here") + '"><a href="' + diaryUrl() + '">' + t("Diario de ruta", "Travel journal") + '</a><span aria-hidden="true">/</span><a href="' + diaryUrl() + "#t=" + slug(e.etiqueta) + '">' + esc(tag(e)) + "</a></nav>" +
      (e.placeholder ? '<p class="dr-ph-note"><span class="dr-ph">PLACEHOLDER</span>' + t("Historia de ejemplo. Reemplazala por una real en diario.js.", "Sample story. Replace it with a real one in diario.js.") + "</p>" : "") +
      "<h1 class=\"reveal\" data-words>" + esc(title) + "</h1>" +
      '<p class="dr-entry-meta reveal"><span>' + esc(field(e, "lugar")) + '</span><span><time datetime="' + e.fecha + '">' + date(e, { day: "numeric", month: "long", year: "numeric" }) + "</time></span><span>" + readTime(e) + "</span></p>" +
      "</header>" +
      '<figure class="dr-entry-photo"><span class="dr-entry-photo-in wipe">' + media(e, true) + "</span></figure>" +
      '<div class="dr-paper" data-wa-zone="' + esc(t("Quiero vivir esto", "I want to do this")) + '" data-wa-zone-msg="' + esc(msg) + '" data-wa-theme="is-light">' +
      '<div class="dr-entry-grid">' +
      '<div class="dr-body">' +
      '<p class="dr-lead">' + esc(field(e, "extracto")) + "</p>" +
      body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      "</div>" +
      '<aside class="dr-side" aria-label="' + t("Datos del lugar", "About the place") + '">' +
      '<div class="dr-stamp-wrap reveal">' + stamp(e) + "</div>" +
      '<figure class="dr-minimap">' + miniMap(e) + "<figcaption>" + esc(field(e, "lugar")) + "<br />" + lat(e) + " · " + lng(e) + "</figcaption></figure>" +
      (route ? '<a class="dr-route" href="' + esc(EN && route.href_en ? route.href_en : route.href) + '"><span class="label">' + t("Ruta relacionada", "Related route") + "</span><b>" + esc(EN && route.titulo_en ? route.titulo_en : route.titulo) + "</b>" + arrow() + "</a>" : "") +
      "</aside></div>" +
      '<div class="dr-cta reveal">' +
      '<div><h2>' + t("¿Querés vivir <em>esto</em>?", "Want to <em>live this</em>?") + "</h2><p>" + t("Escribinos y armamos un viaje parecido, a tu medida.", "Message us and we'll plan a similar trip, tailored to you.") + "</p></div>" +
      '<a class="dr-wa" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" data-wa-link="' + esc(msg) + '" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#chat" /></svg>' + t("Escribinos", "Message us") + "</a>" +
      "</div>" +
      (others.length ? '<section class="dr-more" aria-labelledby="dr-more-t"><div class="dr-more-head"><h2 id="dr-more-t">' + t("Más del diario", "More from the journal") + '</h2><a href="' + diaryUrl() + '">' + t("Ver todas", "See all") + arrow() + '</a></div><div class="dr-grid">' + others.map(function (x, i) { return card(x, i, " reveal"); }).join("") + "</div></section>" : "") +
      "</div>";

    jsonLd({
      "@context": "https://schema.org", "@type": "BlogPosting", headline: title, description: field(e, "extracto"), datePublished: e.fecha, inLanguage: EN ? "en" : "es-AR",
      image: e.foto_grande || e.foto || undefined, wordCount: words(e),
      author: { "@type": "Organization", name: "nowmad explorers" },
      contentLocation: { "@type": "Place", name: field(e, "lugar"), geo: { "@type": "GeoCoordinates", latitude: e.coords[0], longitude: e.coords[1] } }
    });
  }

  function safe(fn, name) { try { fn(); } catch (err) { console.warn("[diario] " + name, err); } }
  safe(initDiary, "diario");
  safe(initLatest, "ultimas");
  safe(initEntry, "entrada");
})();
