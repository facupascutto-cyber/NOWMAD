(function () {
  "use strict";

  var COARSE = matchMedia("(hover: none)").matches;
  // La misma lógica sirve para la página en español y la en inglés: el idioma sale del <html lang>
  var EN = /^en/i.test(document.documentElement.lang || "");
  function t(es, en) { return EN ? en : es; }

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[nowmad] " + name, err); }
  }

  // Parte los títulos en palabras para que suban una detrás de otra
  function initWords() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-words]"), function (title) {
      var n = 0;
      function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 1) {
            if (child.tagName !== "BR") walk(child);
            return;
          }
          if (child.nodeType !== 3) return;
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            var wi = document.createElement("span");
            w.className = "w";
            wi.className = "wi";
            wi.style.setProperty("--i", n++);
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        });
      }
      walk(title);
      title.classList.add("is-split");
    });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal, .wipe:not(.place-pic)"));
    function show(el) { el.classList.add("is-visible"); }
    if (!("IntersectionObserver" in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        setTimeout(show, batch++ * 140, entry.target);
      });
    }, { threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(show); }, 6000);
  }

  // Portada: varios clips que se encadenan con un fundido cruzado.
  // Los archivos se grabaron más lentos y acá se reproducen a 2x (los de 60 cuadros quedan en cámara lenta).
  var CLIPS = [
    { src: "assets/video/trekking.mp4", pos: "58% bottom", place: "Patagonia" },
    { src: "assets/video/iguazu.mp4", pos: "center", place: "Cataratas del Iguazú" },
    { src: "assets/video/buenos-aires.mp4", pos: "center 60%", place: "Buenos Aires" },
    { src: "assets/video/glaciar.mp4", pos: "center 40%", place: "Glaciar Perito Moreno" }
  ];
  function initVideo() {
    var reel = document.querySelector("[data-reel]");
    if (!reel) return;
    var layers = reel.querySelectorAll("video");
    if (layers.length < 2) return;
    var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
    var RATE = 2, LEAD = 1.8, LENGTH = 20; // LEAD: segundos de archivo antes del final en que empieza el fundido
    var index = 0, front = layers[0], back = layers[1], switching = false;

    function play(v) {
      v.defaultPlaybackRate = RATE;
      v.playbackRate = RATE;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    function load(v, clip) {
      v.style.objectPosition = clip.pos;
      if (v.getAttribute("src") !== clip.src) {
        v.preload = "auto";
        v.src = clip.src;
        v.load();
      }
    }
    function caption(i) {
      chapters.forEach(function (c, n) {
        c.classList.toggle("is-on", n === i);
        c.setAttribute("aria-current", n === i ? "true" : "false");
        if (n !== i) c.style.setProperty("--p", n < i ? "1" : "0");
      });
    }
    // La barra del capítulo activo avanza con el video
    function progress() {
      var c = chapters[index];
      if (c) {
        var end = isFinite(front.duration) && front.duration > 0 ? front.duration : LENGTH;
        c.style.setProperty("--p", Math.min(1, front.currentTime / (end - LEAD * 0.5)).toFixed(4));
      }
      requestAnimationFrame(progress);
    }
    function next(target) {
      if (switching) return;
      var i = typeof target === "number" ? target : (index + 1) % CLIPS.length;
      if (i === index) return;
      switching = true;
      var incoming = back, outgoing = front;
      function go() {
        incoming.currentTime = 0;
        play(incoming);
        incoming.classList.add("is-on");
        outgoing.classList.remove("is-on");
        index = i;
        front = incoming;
        back = outgoing;
        caption(i);
        setTimeout(function () {
          outgoing.pause();
          load(outgoing, CLIPS[(i + 1) % CLIPS.length]);
          switching = false;
        }, 1200);
      }
      if (typeof target === "number" && incoming.getAttribute("src") !== CLIPS[i].src) {
        // Salto elegido a mano: se carga ese lugar y entra apenas tenga imagen
        load(incoming, CLIPS[i]);
        var ready = function () { incoming.removeEventListener("loadeddata", ready); go(); };
        incoming.addEventListener("loadeddata", ready);
        setTimeout(function () { if (switching && front !== incoming) { incoming.removeEventListener("loadeddata", ready); switching = false; } }, 8000);
      } else if (incoming.readyState >= 2) go();
      else {
        // Si el próximo todavía no cargó, el actual vuelve a empezar y se intenta en la siguiente vuelta
        front.currentTime = 0;
        play(front);
        switching = false;
      }
    }

    layers[0].style.objectPosition = CLIPS[0].pos;
    caption(0);
    load(back, CLIPS[1]);
    Array.prototype.forEach.call(layers, function (v) {
      v.addEventListener("timeupdate", function () {
        if (v !== front || switching) return;
        var end = isFinite(v.duration) && v.duration > 0 ? v.duration : LENGTH;
        if (v.currentTime >= end - LEAD) next();
      });
      v.addEventListener("ended", function () { if (v === front) next(); });
    });
    chapters.forEach(function (c) {
      c.addEventListener("click", function () { next(parseInt(c.getAttribute("data-chapter"), 10)); });
    });
    play(front);
    requestAnimationFrame(progress);
  }

  // Scroll: portada que se aleja, fotos que se desplazan y anillo que gira
  function initScroll() {
    var hero = document.querySelector(".hero");
    var content = document.querySelector("[data-hero-content]");
    var frames = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var ring = document.querySelector("[data-parallax-ring]");
    var reel = document.querySelector("[data-reel]");
    var chapterBar = document.querySelector(".chapters");
    var scrub = document.querySelector("[data-scrub]");
    var about = document.querySelector(".about");
    var bar = document.querySelector(".progress");
    var ticking = false;
    function clamp(v) { return Math.max(0, Math.min(1, v)); }

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      if (bar) {
        var max = document.documentElement.scrollHeight - vh;
        bar.style.setProperty("--scroll", max > 0 ? clamp(window.scrollY / max).toFixed(4) : "0");
      }
      if (hero && content) {
        var s = clamp(window.scrollY / vh);
        content.style.opacity = (1 - s * 1.5).toFixed(3);
        content.style.transform = "translate3d(0," + (s * -60).toFixed(1) + "px,0)";
        // El video se cierra como una ventana y se va acercando: la portada queda atrás
        if (reel) {
          var e = s * s * (3 - 2 * s);
          reel.style.clipPath = "inset(" + (e * 5).toFixed(2) + "% " + (e * 6).toFixed(2) + "% " + (e * 12).toFixed(2) + "% round " + (e * 36).toFixed(1) + "px)";
          reel.style.setProperty("--zoom", (1 + e * 0.14).toFixed(4));
        }
        if (chapterBar) chapterBar.style.opacity = clamp(1 - s * 3).toFixed(3);
      }
      // "Nosotros": el título se enciende palabra por palabra a medida que bajás
      if (scrub && scrub.classList.contains("is-split")) {
        var words = scrub.querySelectorAll(".wi");
        var r = scrub.getBoundingClientRect();
        var prog = clamp((vh * 0.9 - r.top) / (vh * 0.7));
        var t = prog * (words.length + 2);
        for (var k = 0; k < words.length; k++) words[k].style.setProperty("--o", (0.14 + 0.86 * clamp(t - k)).toFixed(3));
        if (about) {
          about.style.setProperty("--line", clamp(prog * 1.6).toFixed(3));
          if (r.top < vh * 1.5 && r.bottom > -vh * 0.5) about.style.setProperty("--topo", (r.top * -0.12).toFixed(1) + "px");
        }
      }
      frames.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.setProperty("--py", (p * -5).toFixed(2) + "%");
      });
      if (ring) {
        var q = ring.parentNode.getBoundingClientRect();
        if (q.top < vh && q.bottom > 0) ring.style.setProperty("--ring", ((vh - q.top) * 0.05).toFixed(1) + "deg");
      }
    }
    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
  }

  // Las tarjetas de destino se inclinan apenas hacia el cursor
  function initTilt() {
    if (COARSE) return;
    Array.prototype.forEach.call(document.querySelectorAll(".service"), function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2) + "deg");
        card.style.setProperty("--rx", (((e.clientY - r.top) / r.height - 0.5) * -7).toFixed(2) + "deg");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  // WhatsApp: el botón lee en qué parte de la página estás y cambia color, frase y mensaje.
  // Para usar el número de la agencia, completá WA_NUMBER (solo dígitos, con 549 adelante). Vacío abre WhatsApp para elegir el chat.
  var WA_NUMBER = "";
  function initWhatsApp() {
    var btn = document.querySelector("[data-chat]");
    if (!btn) return;
    var label = btn.querySelector("[data-wa-text]");
    var input = document.getElementById("destino");
    var hero = document.querySelector(".hero");
    var places = Array.prototype.slice.call(document.querySelectorAll(".place"));
    var zones = [
      { el: document.querySelector(".footer-cta"), theme: "is-warm", text: t("Escribinos ahora", "Message us now"), msg: t("Hola nowmad explorers! Quiero armar un viaje.", "Hi nowmad explorers! I'd like to plan a trip.") },
      { el: document.querySelector(".places"), theme: "", text: t("Preguntá por un destino", "Ask about a destination"), msg: t("Hola nowmad explorers! Quiero info sobre sus destinos.", "Hi nowmad explorers! I'd like info about your destinations."), places: true },
      { el: document.querySelector(".steps"), theme: "is-light", text: t("Empezá por el paso 1", "Start with step 1"), msg: t("Hola nowmad explorers! Les cuento a dónde quiero ir:", "Hi nowmad explorers! Here's where I'd like to go:") },
      { el: document.querySelector(".quiz"), theme: "is-light", text: t("Contanos qué te salió", "Tell us your result"), msg: t("Hola nowmad explorers! Hice el test de viajero y quiero armar un viaje.", "Hi nowmad explorers! I took the traveler quiz and I'd like to plan a trip.") },
      { el: document.querySelector(".about"), theme: "", text: t("Hablemos de tu viaje", "Let's talk about your trip"), msg: t("Hola nowmad explorers! Quiero armar un viaje.", "Hi nowmad explorers! I'd like to plan a trip.") }
    ];
    // Zonas extra marcadas en el HTML (Diario de ruta): data-wa-zone = frase, data-wa-zone-msg = mensaje, data-wa-theme = color
    var marked = Array.prototype.map.call(document.querySelectorAll("[data-wa-zone]"), function (el) {
      return { el: el, theme: el.getAttribute("data-wa-theme") || "", text: el.getAttribute("data-wa-zone"), msg: el.getAttribute("data-wa-zone-msg") || zones[zones.length - 1].msg };
    });
    zones = zones.slice(0, 1).concat(marked, zones.slice(1));
    // Botones de WhatsApp con su propio mensaje (data-wa-link): usan el mismo número que el flotante
    Array.prototype.forEach.call(document.querySelectorAll("a[data-wa-link]"), function (a) {
      a.href = "https://" + "wa" + ".me/" + WA_NUMBER + "?text=" + encodeURIComponent(a.getAttribute("data-wa-link"));
    });
    var current = "", hovered = null, openTimer = 0, ticking = false;

    function destination() {
      var v = input && input.value.trim();
      return v ? v : "";
    }
    function setText(text) {
      if (!label || label.textContent === text) return;
      label.textContent = text;
      label.classList.remove("is-new");
      void label.offsetWidth;
      label.classList.add("is-new");
      // En celular el botón es solo el ícono: se abre un momento cada vez que cambia la frase
      btn.classList.add("is-open");
      clearTimeout(openTimer);
      openTimer = setTimeout(function () { btn.classList.remove("is-open"); }, 3200);
    }
    function apply(zone, place) {
      var text = zone.text, msg = zone.msg;
      if (place) {
        text = t("Preguntá por ", "Ask about ") + place;
        msg = t("Hola nowmad explorers! Quiero info para viajar a " + place + ".", "Hi nowmad explorers! I'd like info about traveling to " + place + ".");
      } else if (destination()) {
        msg = t("Hola nowmad explorers! Quiero armar un viaje a " + destination() + ".", "Hi nowmad explorers! I'd like to plan a trip to " + destination() + ".");
      }
      btn.classList.toggle("is-light", zone.theme === "is-light");
      btn.classList.toggle("is-warm", zone.theme === "is-warm");
      setText(text);
      btn.setAttribute("data-go", "https://" + "wa" + ".me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg));
    }
    function centerPlace() {
      if (hovered) return hovered;
      var vh = window.innerHeight, best = null, dist = Infinity;
      places.forEach(function (p) {
        var r = p.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - vh * 0.6);
        if (r.bottom > 0 && r.top < vh && d < dist) { dist = d; best = p; }
      });
      return best ? best.querySelector(".place-name").textContent : null;
    }
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      // En la portada se queda más arriba para no tapar los capítulos del video
      var inHero = hero ? window.scrollY < hero.offsetHeight * 0.35 : false;
      btn.classList.add("is-on");
      btn.classList.toggle("is-hero", inHero);
      // La zona que está detrás del botón (abajo de la pantalla) decide cómo se ve
      var y = vh - 50;
      for (var i = 0; i < zones.length; i++) {
        var z = zones[i];
        if (!z.el) continue;
        var r = z.el.getBoundingClientRect();
        if (r.top < y && r.bottom > y - 60) {
          var key = i + (z.places ? ":" + centerPlace() : "");
          if (key !== current) { current = key; apply(z, z.places ? centerPlace() : null); }
          return;
        }
      }
      var fallback = zones[zones.length - 1];
      if (current !== "base") { current = "base"; apply(fallback, null); }
    }
    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    places.forEach(function (p) {
      p.addEventListener("mouseenter", function () { hovered = p.querySelector(".place-name").textContent; current = ""; request(); });
      p.addEventListener("mouseleave", function () { hovered = null; current = ""; request(); });
    });
    // Si escribió un destino en la portada, el mensaje ya lo lleva
    if (input) input.addEventListener("input", function () { current = ""; request(); });
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }

  // Destinos: el mapa enciende cada punto cuando aparece su renglón y marca el que estás mirando
  function initMap() {
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-place]"));
    if (!rows.length) return;
    var pins = {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-pin]"), function (p) { pins[p.getAttribute("data-pin")] = p; });
    var hovered = null, active = null, ticking = false;
    function setActive(id) {
      if (id === active) return;
      active = id;
      rows.forEach(function (r) { r.classList.toggle("is-on", r.getAttribute("data-place") === id); });
      Object.keys(pins).forEach(function (k) { pins[k].classList.toggle("is-on", k === id); });
    }
    function update() {
      ticking = false;
      var vh = window.innerHeight, best = null, dist = Infinity;
      rows.forEach(function (r) {
        var b = r.getBoundingClientRect();
        if (b.top < vh * 0.92 && pins[r.getAttribute("data-place")]) pins[r.getAttribute("data-place")].classList.add("is-lit");
        var d = Math.abs(b.top + b.height / 2 - vh * 0.5);
        if (b.bottom > 0 && b.top < vh && d < dist) { dist = d; best = r; }
      });
      setActive(hovered || (best && dist < vh * 0.4 ? best.getAttribute("data-place") : null));
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    rows.forEach(function (r) {
      r.addEventListener("mouseenter", function () { hovered = r.getAttribute("data-place"); request(); });
      r.addEventListener("mouseleave", function () { hovered = null; request(); });
    });
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }

  // Clima de ahora en cada destino (servicio gratuito Open-Meteo). Si no responde, no se muestra nada.
  function initWeather() {
    var spots = Array.prototype.slice.call(document.querySelectorAll("[data-weather]"));
    if (!spots.length || !window.fetch) return;
    var lats = [], lons = [];
    spots.forEach(function (s) { var p = s.getAttribute("data-weather").split(","); lats.push(p[0]); lons.push(p[1]); });
    function sky(code) {
      if (code === 0) return t("despejado", "clear");
      if (code <= 2) return t("algo nublado", "partly cloudy");
      if (code === 3) return t("nublado", "cloudy");
      if (code === 45 || code === 48) return t("con niebla", "foggy");
      if (code >= 51 && code <= 57) return t("llovizna", "drizzle");
      if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return t("lluvia", "rain");
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return t("nieve", "snow");
      if (code >= 95) return t("tormenta", "storm");
      return "";
    }
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lats.join(",") + "&longitude=" + lons.join(",") + "&current=temperature_2m,weather_code&timezone=auto";
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) { return r.json(); }).then(function (data) {
      clearTimeout(timer);
      var list = Array.isArray(data) ? data : [data];
      spots.forEach(function (s, i) {
        var cur = list[i] && list[i].current;
        if (!cur || typeof cur.temperature_2m !== "number") return;
        var temp = Math.round(cur.temperature_2m), desc = sky(cur.weather_code);
        s.innerHTML = "<i></i>" + t("Ahora", "Now") + " <b>" + temp + "°</b>" + (desc ? " · " + desc : "");
        s.classList.add("is-ready");
      });
    }).catch(function () {});
  }

  // Cuándo conviene ir: marca el mes actual y escalona la animación de las barras
  function initSeason() {
    var now = new Date().getMonth();
    Array.prototype.forEach.call(document.querySelectorAll(".season [data-m]"), function (el) {
      var m = parseInt(el.getAttribute("data-m"), 10);
      el.style.setProperty("--m", m);
      if (m === now) el.classList.add("is-now");
    });
  }

  // ¿Qué viajero sos?: tres preguntas, un destino y el mensaje de WhatsApp ya escrito
  var QUIZ = EN ? {
    iguazu: { photo: "iguazu", type: "Jungle traveler", why: "You love green, the roar of water and days spent outdoors. Your starting point: Iguazú Falls.", name: "Iguazú" },
    mendoza: { photo: "aconcagua", type: "Mountain traveler", why: "Peaks, great food and high-altitude roads. Mendoza brings together the Andes, wineries and clear skies.", name: "Mendoza" },
    glaciares: { photo: "glaciar", type: "Ice traveler", why: "You're into vast landscapes and silence. The glaciers of Santa Cruz will leave you speechless.", name: "the Glaciers" },
    ushuaia: { photo: "beagle", type: "End-of-the-world traveler", why: "Faraway places pull you in: the Beagle Channel, the forests of Tierra del Fuego and the southernmost city in Argentina.", name: "Ushuaia" }
  } : {
    iguazu: { photo: "iguazu", type: "Viajero de selva", why: "Te va el verde, el ruido del agua y los días al aire libre. Tu punto de partida: las Cataratas del Iguazú.", name: "Iguazú" },
    mendoza: { photo: "aconcagua", type: "Viajero de cordillera", why: "Montaña, buena mesa y rutas de altura. Mendoza junta cerros, bodegas y cielos limpios.", name: "Mendoza" },
    glaciares: { photo: "glaciar", type: "Viajero de hielo", why: "Lo tuyo son los paisajes enormes y el silencio. Los glaciares de Santa Cruz te van a dejar sin palabras.", name: "los Glaciares" },
    ushuaia: { photo: "beagle", type: "Viajero del fin del mundo", why: "Te tira lo lejano: el canal Beagle, los bosques fueguinos y la ciudad más austral del país.", name: "Ushuaia" }
  };
  var SCORE = {
    montana: { mendoza: 3, glaciares: 1, ushuaia: 0.5 },
    selva: { iguazu: 3 },
    hielo: { glaciares: 3, ushuaia: 1 },
    mar: { ushuaia: 3, glaciares: 0.5 },
    tranqui: { mendoza: 1, iguazu: 1 },
    mitad: { mendoza: 0.5, iguazu: 0.5, glaciares: 0.5, ushuaia: 0.5 },
    aventura: { glaciares: 1, ushuaia: 1, mendoza: 0.5 },
    verano: { glaciares: 1, ushuaia: 1 },
    otono: { mendoza: 1, iguazu: 0.5 },
    invierno: { ushuaia: 1, iguazu: 1 },
    primavera: { iguazu: 0.5, mendoza: 0.5, glaciares: 0.5 }
  };
  var LABEL = EN
    ? { montana: "mountains", selva: "jungle and waterfalls", hielo: "ice and lakes", mar: "the sea and the end of the world", tranqui: "a relaxed pace", mitad: "a bit of both", aventura: "adventure", verano: "in summer", otono: "in autumn", invierno: "in winter", primavera: "in spring" }
    : { montana: "montaña", selva: "selva y agua", hielo: "hielo y lagos", mar: "mar y fin del mundo", tranqui: "tranqui", mitad: "mitad y mitad", aventura: "aventura", verano: "en verano", otono: "en otoño", invierno: "en invierno", primavera: "en primavera" };
  function initQuiz() {
    var box = document.querySelector("[data-quiz]");
    if (!box) return;
    var qs = Array.prototype.slice.call(box.querySelectorAll(".quiz-q"));
    var dots = Array.prototype.slice.call(box.querySelectorAll(".quiz-steps li"));
    var result = box.querySelector("[data-result]");
    var answers = [], step = 0, link = "";
    function show(i) {
      step = i;
      qs.forEach(function (q, n) { q.classList.toggle("is-on", n === i); });
      dots.forEach(function (d, n) { d.classList.toggle("is-on", n === i); d.classList.toggle("is-done", n < i || i >= qs.length); });
    }
    function finish() {
      var score = { iguazu: 0, mendoza: 0, glaciares: 0, ushuaia: 0 };
      answers.forEach(function (a) { var s = SCORE[a] || {}; Object.keys(s).forEach(function (k) { score[k] += s[k]; }); });
      var order = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
      var top = QUIZ[order[0]], also = QUIZ[order[1]];
      box.querySelector("[data-r-img]").src = "assets/photos/" + top.photo + "-1100.webp";
      box.querySelector("[data-r-img]").alt = top.name;
      box.querySelector("[data-r-type]").textContent = top.type + ".";
      box.querySelector("[data-r-why]").textContent = top.why;
      var looking = answers.map(function (a) { return LABEL[a]; }).join(", ");
      box.querySelector("[data-r-also]").innerHTML = t("También te puede gustar: <b>", "You might also like: <b>") + also.name.replace(/^(los|the) /i, "") + "</b>.";
      var msg = EN
        ? "Hi nowmad explorers! I took the quiz and got " + top.type.toLowerCase() + " (" + top.name + "). I'm looking for " + looking + ". Can you help me plan it?"
        : "Hola nowmad explorers! Hice el test y me salió " + top.type.toLowerCase() + " (" + top.name + "). Busco " + looking + ". ¿Me ayudan a armarlo?";
      link = "https://" + "wa" + ".me/" + (typeof WA_NUMBER === "string" ? WA_NUMBER : "") + "?text=" + encodeURIComponent(msg);
      show(qs.length);
      result.hidden = false;
      window.dispatchEvent(new Event("scroll"));
    }
    Array.prototype.forEach.call(box.querySelectorAll(".quiz-opt"), function (btn) {
      btn.addEventListener("click", function () {
        var q = btn.closest(".quiz-q");
        Array.prototype.forEach.call(q.querySelectorAll(".quiz-opt"), function (b) { b.classList.toggle("is-picked", b === btn); });
        answers[step] = btn.getAttribute("data-v");
        setTimeout(function () { if (step + 1 < qs.length) show(step + 1); else finish(); }, 260);
      });
    });
    box.querySelector("[data-r-go]").addEventListener("click", function () { if (link) window.open(link, "_blank", "noopener"); });
    box.querySelector("[data-r-again]").addEventListener("click", function () {
      answers = [];
      result.hidden = true;
      Array.prototype.forEach.call(box.querySelectorAll(".quiz-opt.is-picked"), function (b) { b.classList.remove("is-picked"); });
      show(0);
    });
  }

  // Cursor brújula: sigue al mouse con un poco de inercia y la aguja apunta hacia donde se mueve
  function initCompass() {
    if (COARSE || !matchMedia("(pointer: fine)").matches) return;
    var el = document.querySelector(".compass-cursor");
    if (!el) return;
    var x = -100, y = -100, cx = -100, cy = -100, angle = 0, raf = 0;
    function loop() {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      if (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) raf = requestAnimationFrame(loop); else raf = 0;
    }
    document.addEventListener("mousemove", function (e) {
      var dx = e.clientX - x, dy = e.clientY - y;
      if (dx * dx + dy * dy > 9) {
        var target = Math.atan2(dx, -dy) * 180 / Math.PI;
        var diff = ((target - angle + 540) % 360) - 180;
        angle += diff;
        el.style.setProperty("--angle", angle.toFixed(1) + "deg");
      }
      x = e.clientX; y = e.clientY;
      el.classList.add("is-on");
      el.classList.toggle("is-link", !!(e.target.closest && e.target.closest("a, button, input")));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("mouseleave", function () { el.classList.remove("is-on"); });
  }

  // Nosotros: las polaroids entran de a una y la tira se desliza hacia el sur a medida que bajás
  function initTrip() {
    var trip = document.querySelector(".trip");
    var track = document.querySelector("[data-trip]");
    if (!trip || !track) return;
    Array.prototype.forEach.call(track.children, function (card, i) { card.style.setProperty("--i", i); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { trip.classList.add("is-in"); io.disconnect(); }
      }, { threshold: 0.15 });
      io.observe(trip);
      setTimeout(function () { trip.classList.add("is-in"); }, 8000);
    } else trip.classList.add("is-in");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var r = trip.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var extra = track.scrollWidth - trip.clientWidth;
      if (extra <= 0) { track.style.setProperty("--tx", "0px"); return; }
      // 0 cuando la tira asoma abajo, 1 cuando ya está saliendo por arriba
      var p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      track.style.setProperty("--tx", (-extra * p).toFixed(1) + "px");
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
  }

  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function boot() {
    safe(initWords, "words");
    safe(initReveal, "reveal");
    safe(initVideo, "video");
    safe(initScroll, "scroll");
    safe(initTilt, "tilt");
    safe(initWhatsApp, "whatsapp");
    safe(initMap, "map");
    safe(initWeather, "weather");
    safe(initSeason, "season");
    safe(initQuiz, "quiz");
    safe(initTrip, "trip");
    safe(initCompass, "compass");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
