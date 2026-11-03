/* nowmad agency: la página es el escritorio de una Mac.
   Arranque, Spotlight, menú de la app y clic derecho; ventanas que se arrastran; un navegador que
   arma un sitio con lo que escribís o escanea tu web de verdad; mapa de tu competencia; vista previa
   de cada servicio; tablero del proceso; asistente de preguntas y el contacto como WhatsApp. */
(function () {
  "use strict";

  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DESKTOP = matchMedia("(min-width: 901px)");

  function safe(fn, name) { try { fn(); } catch (err) { console.warn("[nowmad agency] " + name, err); } }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // ---------- Logros: se desbloquean jugando con la página ----------
  var ACH = [
    { id: "ventana", t: "Arquitecto de ventanas", d: "Moviste una ventana del escritorio." },
    { id: "luces", t: "Botonero", d: "Tocaste los botones de una ventana." },
    { id: "escaner", t: "Bajo la lupa", d: "Escaneaste una web en vivo." },
    { id: "mapa", t: "Conocé a tu rival", d: "Buscaste tu competencia en el mapa." },
    { id: "sitio", t: "Constructor", d: "Armaste un sitio escribiendo en el navegador." },
    { id: "proyecto", t: "Project manager", d: "Llevaste tu proyecto hasta Online." },
    { id: "propuesta", t: "Con plan", d: "Armaste tu propuesta inicial." },
    { id: "apps", t: "Curioso", d: "Probaste tres apps en el celular." },
    { id: "chat", t: "Preguntón", d: "Le hiciste una pregunta al asistente." },
    { id: "spot", t: "Power user", d: "Abriste el buscador (⌘K o la lupa de arriba)." },
    { id: "fondo", t: "Decorador", d: "Cambiaste el fondo de pantalla." }
  ];
  var got = {};
  try { got = JSON.parse(localStorage.getItem("nowmad-logros") || "{}") || {}; } catch (e) { got = {}; }
  var toastTimer = 0;
  function toast(title, body) {
    var el = $("[data-toast]");
    if (!el) return;
    $("[data-toast-title]", el).textContent = title;
    $("[data-toast-body]", el).textContent = body;
    el.classList.remove("is-on"); void el.offsetWidth; el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 3600);
  }
  function confetti(x, y, n) {
    var box = $("[data-confetti]");
    if (!box || REDUCED || !box.animate) return;
    var colors = ["#8A6A3F", "#B08A4F", "#E8DCC5", "#D97757", "#4A3524", "#FFFFFF"];
    for (var i = 0; i < (n || 60); i++) {
      var c = document.createElement("i");
      c.style.background = colors[i % colors.length];
      box.appendChild(c);
      var a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
      var dx = Math.cos(a) * v, dy = Math.sin(a) * v - 220;
      var anim = c.animate([
        { transform: "translate(" + x + "px," + y + "px) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + (x + dx) + "px," + (y + dy) + "px) rotate(" + (Math.random() * 720) + "deg)", opacity: 1, offset: .45 },
        { transform: "translate(" + (x + dx * 1.4) + "px," + (y + dy + 520) + "px) rotate(" + (Math.random() * 1080) + "deg)", opacity: 0 }
      ], { duration: 1600 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.4,1)" });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(c);
    }
  }
  function renderTrophies() {
    var n = 0;
    ACH.forEach(function (a) { if (got[a.id]) n++; });
    var num = $("[data-trophy-n]"), tot = $("[data-trophy-t]"), list = $("[data-trophy-list]");
    if (num) num.textContent = n;
    if (tot) tot.textContent = ACH.length;
    if (list) {
      list.innerHTML = "";
      ACH.forEach(function (a) {
        var li = document.createElement("li"), i = document.createElement("i"), box = document.createElement("span");
        var b = document.createElement("b"), sm = document.createElement("small");
        li.className = got[a.id] ? "is-on" : "";
        i.textContent = got[a.id] ? "★" : "?";
        b.textContent = got[a.id] ? a.t : "Logro escondido";
        sm.textContent = got[a.id] ? a.d : "Seguí jugando para descubrirlo.";
        box.appendChild(b); box.appendChild(sm); li.appendChild(i); li.appendChild(box); list.appendChild(li);
      });
    }
    return n;
  }
  function unlock(id) {
    if (got[id]) return;
    var a = ACH.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    got[id] = 1;
    try { localStorage.setItem("nowmad-logros", JSON.stringify(got)); } catch (e) {}
    var n = renderTrophies();
    var btn = $("[data-trophy]");
    if (btn) { btn.classList.remove("is-bump"); void btn.offsetWidth; btn.classList.add("is-bump"); }
    if (n === ACH.length) {
      toast("¡Completaste todos los logros!", "Te pasaste un buen rato acá. ¿Charlamos tu proyecto?");
      confetti(innerWidth / 2, innerHeight / 3, 140);
    } else toast("Logro: " + a.t, a.d + " (" + n + "/" + ACH.length + ")");
  }
  function initTrophies() {
    var btn = $("[data-trophy]"), panel = $("[data-trophies]");
    renderTrophies();
    if (!btn || !panel) return;
    function close() { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
    });
    document.addEventListener("click", function (e) { if (!panel.hidden && !panel.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  function hexToRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  // ---------- Títulos palabra por palabra y apariciones ----------
  function initWords() {
    $$("[data-words]").forEach(function (title) {
      var n = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 1) { if (child.tagName !== "BR") walk(child); return; }
          if (child.nodeType !== 3) return;
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"), wi = document.createElement("span");
            w.className = "w"; wi.className = "wi"; wi.style.setProperty("--i", n++); wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        });
      })(title);
      title.classList.add("is-split");
    });
  }
  function initReveal() {
    var items = $$(".reveal, [data-words]:not([data-scrub])");
    function show(el) { el.classList.add("is-visible"); }
    if (!("IntersectionObserver" in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } });
    }, { threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(show); }, 6000);
  }
  // "Nosotros": el título se enciende palabra por palabra al bajar
  function initScrub() {
    var scrub = $("[data-scrub]");
    if (!scrub) return;
    var ticking = false;
    function update() {
      ticking = false;
      var words = scrub.querySelectorAll(".wi");
      var r = scrub.getBoundingClientRect(), vh = innerHeight;
      var p = REDUCED ? 1 : clamp((vh * 0.85 - r.top) / (vh * 0.6));
      var t = p * (words.length + 2);
      for (var k = 0; k < words.length; k++) words[k].style.setProperty("--o", (0.16 + 0.84 * clamp(t - k)).toFixed(3));
    }
    update();
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  // ---------- Ventanas que se arrastran ----------
  var z = 10;
  function front(win) { $$(".desk .win").forEach(function (w) { w.classList.remove("is-front"); }); win.classList.add("is-front"); win.style.zIndex = ++z; }
  function initDrag() {
    $$(".desk [data-win]").forEach(function (win) {
      var bar = win.querySelector("[data-drag]");
      win.addEventListener("pointerdown", function () { front(win); });
      if (!bar) return;
      bar.addEventListener("pointerdown", function (e) {
        if (!DESKTOP.matches || e.target.closest("input, button, a, form")) return;
        var desk = win.offsetParent, sx = e.clientX, sy = e.clientY, ox = win.offsetLeft, oy = win.offsetTop;
        document.documentElement.classList.add("is-dragging");
        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
        unlock("ventana");
        function move(ev) {
          var x = Math.max(-win.offsetWidth * 0.6, Math.min(desk.clientWidth - win.offsetWidth * 0.4, ox + ev.clientX - sx));
          var y = Math.max(34, Math.min(desk.clientHeight - 40, oy + ev.clientY - sy));
          win.style.setProperty("--x", x + "px");
          win.style.setProperty("--y", y + "px");
        }
        function up() {
          document.documentElement.classList.remove("is-dragging");
          bar.removeEventListener("pointermove", move);
          bar.removeEventListener("pointerup", up);
        }
        bar.addEventListener("pointermove", move);
        bar.addEventListener("pointerup", up);
      });
    });
  }

  // ---------- Las ventanas de las secciones también se mueven ----------
  function initWinPlay() {
    $$("main .win").forEach(function (win) {
      var bar = $(".win-bar", win), sec = win.closest("section"), dx = 0, dy = 0, t = 0;
      if (!bar) return;
      bar.setAttribute("data-drag", "");
      var hint = document.createElement("span"); hint.className = "win-hint"; hint.textContent = "arrastrame";
      bar.appendChild(hint);
      function place(rot) { win.style.translate = dx + "px " + dy + "px"; win.style.rotate = (rot || 0) + "deg"; }
      function settle() { win.classList.add("is-settle"); clearTimeout(t); t = setTimeout(function () { win.classList.remove("is-settle"); }, 600); }
      function home() { dx = 0; dy = 0; settle(); place(0); }
      bar.addEventListener("pointerdown", function (e) {
        if (!DESKTOP.matches || e.button || e.target.closest("input, button, a, select, i")) return;
        var sx = e.clientX - dx, sy = e.clientY - dy, lx = e.clientX;
        win.classList.add("is-held"); win.classList.remove("is-settle");
        if (sec) sec.style.zIndex = ++z;
        document.documentElement.classList.add("is-dragging");
        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
        function move(ev) {
          var mx = innerWidth * 0.45, my = innerHeight * 0.6;
          dx = Math.max(-mx, Math.min(mx, ev.clientX - sx));
          dy = Math.max(-my, Math.min(my, ev.clientY - sy));
          place(Math.max(-4, Math.min(4, (ev.clientX - lx) * 0.5))); lx = ev.clientX;
          if (Math.abs(dx) + Math.abs(dy) > 60) unlock("ventana");
        }
        function up() {
          win.classList.remove("is-held"); document.documentElement.classList.remove("is-dragging");
          settle(); place(0);
          bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); bar.removeEventListener("pointercancel", up);
        }
        bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up); bar.addEventListener("pointercancel", up);
      });
      bar.addEventListener("dblclick", function (e) { if (!e.target.closest("i")) home(); });
      win.addEventListener("win:home", function () { win.classList.remove("is-min"); home(); });
      // Rojo: no se deja cerrar. Amarillo: se minimiza. Verde: vuelve a su lugar.
      var L = $$(".lights i", win);
      if (L.length !== 3) return;
      L[0].addEventListener("click", function () {
        win.classList.remove("is-nope"); void win.offsetWidth; win.classList.add("is-nope");
        toast("Esta no se cierra", "Adentro está lo bueno. Probá el amarillo o el verde.");
        unlock("luces");
      });
      L[1].addEventListener("click", function () { win.classList.toggle("is-min"); unlock("luces"); });
      L[2].addEventListener("click", function () { win.classList.remove("is-min"); home(); unlock("luces"); });
    });
  }

  // ---------- Navegador: arma un sitio de ejemplo en cuatro etapas ----------
  var PRESETS = [
    { k: /inmobil|propiedad|alquil|departament|casas?\b/i, name: "Casa Sur", kicker: "Palermo · Belgrano · Núñez", title: "Encontrá tu próximo hogar", cta: "Ver propiedades", slug: "casasur", acc: "#C9822B", n: 48 },
    { k: /odont|dent|consult|m[eé]dic|cl[ií]nic|turno|salud|psic|kine|nutri|est[eé]tic|veterin/i, name: "Sonrisa Studio", kicker: "Odontología · Recoleta", title: "Sacá turno en 30 segundos", cta: "Pedir turno", slug: "sonrisastudio", acc: "#119C8D", n: 64 },
    { k: /gim|gym|entren|fitness|yoga|pilates|crossfit|deport|club/i, name: "Pulso Gym", kicker: "Funcional · Musculación · Clases", title: "Tu primera clase es gratis", cta: "Reservar clase", slug: "pulsogym", acc: "#E2462B", n: 91 },
    { k: /resto|restaur|\bbar\b|parrilla|caf[eé]|comida|pizz|gastr|delivery|cocina|panader|helad/i, name: "Fuego Parrilla", kicker: "San Telmo · Desde 1998", title: "Reservá tu mesa para esta noche", cta: "Reservar", slug: "fuegoparrilla", acc: "#D9821F", n: 132 },
    { k: /ropa|tienda|indument|moda|shop|e-?commerce|vender|venta|productos|calzado/i, name: "Lúa Indumentaria", kicker: "Envíos a todo el país", title: "Nueva colección de otoño", cta: "Comprar ahora", slug: "luaindumentaria", acc: "#C2417F", n: 215 }
  ];
  var SCAN = { on: false, resume: function () {} };
  var PHASE_MS = [3400, 5600, 3400, 4600];
  var LABELS = ["nav", "p.kicker", "h1", "a.cta", "section.cards"];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function slugify(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 18) || "tumarca"; }
  function presetFor(text) {
    var t = text.trim();
    if (!t) return null;
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].k.test(t)) return PRESETS[i];
    var m = t.match(/(?:para (?:mi|mis|un|una|el|la|los|las|nuestro|nuestra)\s+)(.+)$/i);
    var thing = (m ? m[1] : t).replace(/[.!?]+$/, "").slice(0, 32), name = cap(thing);
    return { name: name, kicker: "Hecho a medida", title: name + ", en línea", cta: "Empezar", slug: slugify(thing), acc: "#8A6A3F", n: 57 };
  }

  function initMock() {
    var desk = $("[data-desk]"), browser = $("[data-stage]");
    if (!desk || !browser) return;
    var site = $("[data-site]", browser), codeEl = $("[data-m-code]", browser);
    var countEl = $("[data-m-count]"), spark = $(".st-spark");
    var notif = $("[data-notif]"), nTitle = $("[data-notif-title]"), nBody = $("[data-notif-body]");
    var blocks = $$("[data-b]", browser), tabs = $$("[data-chapter]", browser), input = $("[data-mock-input]");
    var fields = {};
    $$("[data-m]", browser).forEach(function (el) { fields[el.getAttribute("data-m")] = el; });
    blocks.forEach(function (b, i) { b.setAttribute("data-l", LABELS[i] || ""); });
    var preset = PRESETS[0], rotate = 0, custom = false;
    var phase = 0, start = 0, lines = [], total = 0, built = -1, visible = true, raf = 0, notifTimer = 0;

    function render(p) {
      preset = p;
      fields.name.textContent = p.name; fields.kicker.textContent = p.kicker;
      fields.title.textContent = p.title; fields.cta.textContent = p.cta;
      site.style.setProperty("--acc", p.acc);
      lines = [["<nav>", p.name, "</nav>"], ['<p class="kicker">', p.kicker, "</p>"], ["<h1>", p.title, "</h1>"], ['<a class="cta">', p.cta, "</a>"], ['<section class="cards">', "…", "</section>"]];
      total = lines.reduce(function (n, l) { return n + l.join("").length + 1; }, 0);
      fields.url.textContent = phase >= 2 ? preset.slug + ".com.ar" : "vista-previa/" + preset.slug;
    }
    function build(n) {
      if (n === built) return;
      built = n;
      blocks.forEach(function (b, i) { b.classList.toggle("is-built", i < n); });
    }
    function typeTo(chars) {
      var out = "", left = chars, done = 0;
      for (var i = 0; i < lines.length && left > 0; i++) {
        var l = lines[i], len = l.join("").length + 1, take = Math.min(left, len - 1), a = l[0].length, b = l[1].length;
        out += '<span class="t">' + esc(l[0].slice(0, take)) + "</span>";
        if (take > a) out += esc(l[1].slice(0, take - a));
        if (take > a + b) out += '<span class="t">' + esc(l[2].slice(0, take - a - b)) + "</span>";
        if (left >= len) { out += "\n"; done++; }
        left -= len;
      }
      codeEl.innerHTML = out + '<span class="c"></span>';
      build(done);
    }
    function toast(title, body) {
      if (!notif) return;
      nTitle.textContent = title; nBody.textContent = body;
      notif.classList.remove("is-on"); void notif.offsetWidth; notif.classList.add("is-on");
      clearTimeout(notifTimer);
      notifTimer = setTimeout(function () { notif.classList.remove("is-on"); }, 3200);
    }
    function setPhase(i) {
      phase = i; start = performance.now();
      desk.setAttribute("data-phase", String(i));
      tabs.forEach(function (c, n) { c.classList.toggle("is-on", n === i); c.style.setProperty("--p", n < i ? "1" : "0"); });
      fields.url.textContent = i >= 2 ? preset.slug + ".com.ar" : "vista-previa/" + preset.slug;
      if (i === 0) build(0);
      if (i === 1) typeTo(0);
      if (i >= 2) { build(blocks.length); typeTo(total); }
      if (i < 3) { countEl.textContent = "—"; spark.style.setProperty("--draw", "1"); }
      if (i === 2) toast("Publicado", preset.slug + ".com.ar ya está online.");
      if (i === 3) toast("Google Ads · Nueva consulta", "Alguien buscó “" + preset.name + "” y te escribió.");
      if (REDUCED) frame(start + PHASE_MS[i]);
    }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function frame(now) {
      var t = clamp((now - start) / PHASE_MS[phase]);
      if (tabs[phase]) tabs[phase].style.setProperty("--p", t.toFixed(4));
      if (phase === 1) typeTo(Math.floor(clamp(t * 1.12) * total));
      if (phase === 3) { countEl.textContent = "+" + Math.round(preset.n * ease(t)); spark.style.setProperty("--draw", (1 - ease(t)).toFixed(3)); }
      return t;
    }
    function loop(now) {
      raf = 0;
      if (!visible || document.hidden || SCAN.on) return;
      if (frame(now) >= 1) {
        if (phase < 3) setPhase(phase + 1);
        else { if (!custom) { rotate = (rotate + 1) % PRESETS.length; render(PRESETS[rotate]); } setPhase(0); }
      }
      raf = requestAnimationFrame(loop);
    }
    function play() { if (!raf && !REDUCED) raf = requestAnimationFrame(loop); }
    SCAN.resume = function () { setPhase(0); play(); };
    tabs.forEach(function (c) { c.addEventListener("click", function () { setPhase(parseInt(c.getAttribute("data-chapter"), 10)); }); });
    var idle = 0;
    if (input) input.addEventListener("input", function () {
      if (looksLikeUrl(input.value)) return; // una dirección web se escanea, no se arma
      var p = presetFor(input.value);
      custom = !!p;
      if (p && input.value.trim().length > 6) unlock("sitio");
      render(p || PRESETS[rotate]);
      if (phase >= 2) typeTo(total);
      clearTimeout(idle);
      idle = setTimeout(function () { setPhase(0); }, 900);
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) play(); }).observe(browser);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) play(); });
    render(PRESETS[0]);
    if (REDUCED) { setPhase(2); return; }
    setPhase(0); play();
  }

  // El chat de la IA del escritorio se escribe solo, en loop
  function initChatDemo() {
    var box = $("[data-chat-demo]");
    if (!box) return;
    var msgs = $$("p", box), i = 0;
    if (REDUCED) { msgs.forEach(function (m) { m.classList.add("is-on"); }); return; }
    (function next() {
      if (i < msgs.length) { msgs[i++].classList.add("is-on"); setTimeout(next, 1300); }
      else setTimeout(function () { msgs.forEach(function (m) { m.classList.remove("is-on"); }); i = 0; setTimeout(next, 700); }, 3500);
    })();
  }

  // ---------- Terminal: mide esta misma página ----------
  function initPerf() {
    var el = $("[data-perf]");
    if (!el || !window.performance || !performance.getEntriesByType) return;
    var lcp = null;
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.indexOf("largest-contentful-paint") > -1) {
      new PerformanceObserver(function (list) { var e = list.getEntries(); if (e.length) lcp = e[e.length - 1].startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    }
    function dots(label, value) { return "› " + label + " " + new Array(Math.max(2, 20 - label.length)).join(".") + " <b>" + value + "</b>"; }
    function measure() {
      if (SCAN.on) return; // la terminal está mostrando un escaneo
      var nav = performance.getEntriesByType("navigation")[0];
      var end = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now();
      var res = performance.getEntriesByType("resource").filter(function (r) { return r.startTime <= end; });
      var bytes = nav ? (nav.encodedBodySize || 0) : 0;
      res.forEach(function (r) { bytes += r.encodedBodySize || 0; });
      var lines = ["$ medir agency.html"];
      if (nav && nav.loadEventEnd > 0) lines.push(dots("carga completa", Math.round(nav.loadEventEnd - nav.startTime) + " ms"));
      if (lcp !== null) lines.push(dots("contenido principal", Math.round(lcp) + " ms"));
      if (bytes > 0) lines.push(dots("peso", (bytes / 1024).toFixed(0) + " KB"));
      lines.push("› medido ahora, en tu navegador.");
      if (REDUCED) { el.innerHTML = lines.join("\n"); return; }
      var i = 0;
      (function step() {
        var done = i >= lines.length - 1;
        el.innerHTML = lines.slice(0, i + 1).join("\n") + (done ? " " : "\n") + '<span class="caret" aria-hidden="true"></span>';
        if (!done) { i++; setTimeout(step, 280); }
      })();
    }
    if (document.readyState === "complete") setTimeout(measure, 900);
    else addEventListener("load", function () { setTimeout(measure, 900); });
  }

  // ---------- Vista previa: la demo de cada servicio (desde el dock o el explorador) ----------
  var NAMES = { web: "Webs", sys: "Sistemas a medida", auto: "Automatización", ia: "Inteligencia artificial", google: "Google Ads", meta: "Meta Ads", data: "Medición" };
  var SERVICE = { web: "una web", sys: "un sistema a medida", auto: "automatizar mi negocio", ia: "algo con inteligencia artificial", google: "campañas en Google Ads", meta: "campañas en Meta Ads", data: "medir mis resultados" };
  function initQuickLook() {
    var ql = $("[data-ql]");
    if (!ql) return;
    var title = $("[data-ql-title]", ql), demos = {}, current = null, timer = 0, opener = null;
    $$("[data-demo]", ql).forEach(function (d) { demos[d.getAttribute("data-demo")] = d; });
    function replay(d) { d.classList.remove("is-on"); void d.offsetWidth; d.classList.add("is-on"); }
    function open(key, from) {
      var d = demos[key];
      if (!d) return;
      opener = from || null;
      $$("[data-demo].is-on", ql).forEach(function (x) { if (x !== d) x.classList.remove("is-on"); });
      ql.hidden = false;
      ql.style.setProperty("--qx", "0px"); ql.style.setProperty("--qy", "0px");
      title.textContent = NAMES[key] + " — vista previa";
      current = key;
      replay(d);
      $$(".dock-app").forEach(function (a) { a.classList.toggle("is-open", a.getAttribute("data-open") === key); });
      $$(".file").forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-open") === key); });
      clearInterval(timer);
      if (!REDUCED) timer = setInterval(function () { if (!ql.hidden) replay(d); }, 6500);
    }
    function close() {
      ql.hidden = true; current = null; clearInterval(timer);
      $$(".dock-app, .file").forEach(function (a) { a.classList.remove("is-open", "is-on"); });
      if (opener) opener.focus();
    }
    $$("[data-open]").forEach(function (b) { b.addEventListener("click", function () { open(b.getAttribute("data-open"), b); }); });
    $("[data-ql-close]", ql).addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ql.hidden) close(); });
    // "Lo quiero": lo marca en el WhatsApp de contacto
    $("[data-ql-pick]", ql).addEventListener("click", function () {
      var box = current && $('[data-builder] input[name="s"][value="' + SERVICE[current] + '"]');
      if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event("change", { bubbles: true })); }
      close();
    });
    // La vista previa también se arrastra
    var bar = $("[data-drag]", ql);
    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      var sx = e.clientX, sy = e.clientY;
      var ox = parseFloat(ql.style.getPropertyValue("--qx")) || 0, oy = parseFloat(ql.style.getPropertyValue("--qy")) || 0;
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
      function move(ev) { ql.style.setProperty("--qx", ox + ev.clientX - sx + "px"); ql.style.setProperty("--qy", oy + ev.clientY - sy + "px"); }
      function up() { bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); }
      bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up);
    });
  }

  // ---------- Dock: los íconos crecen según la distancia al mouse ----------
  function initDock() {
    var dock = $(".dock");
    if (!dock || !FINE || REDUCED) return;
    var apps = $$(".dock-app", dock);
    dock.addEventListener("pointermove", function (e) {
      apps.forEach(function (a) {
        var r = a.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2));
        var k = Math.max(0, 1 - d / 140);
        a.style.setProperty("--s", (1 + k * 0.32).toFixed(3));
        a.style.setProperty("--lift", (-k * 6).toFixed(1) + "px");
      });
    });
    dock.addEventListener("pointerleave", function () { apps.forEach(function (a) { a.style.setProperty("--s", "1"); a.style.setProperty("--lift", "0px"); }); });
  }

  // ---------- Tablero: arrastrás tu proyecto de columna en columna hasta que queda online ----------
  function initBoard() {
    var sec = $("[data-board]");
    if (!sec) return;
    var win = $(".win-board", sec), card = $("[data-card]", sec), cols = $$(".col", sec);
    var state = $("[data-card-state]", sec), next = $("[data-card-next]", sec);
    var STATES = ["En análisis", "Propuesta aprobada", "En construcción", "¡Online!"];
    var cur = 0;
    function spot(k) {
      var board = cols[0].parentNode, col = cols[k];
      return { x: board.offsetLeft + col.offsetLeft + 14, y: board.offsetTop + col.offsetTop + col.offsetHeight - card.offsetHeight - 14, w: col.offsetWidth - 28 };
    }
    function place(k, celebrate) {
      cur = k;
      // primero se marca la columna (en celular reserva lugar para la tarjeta) y después se mide
      sec.style.setProperty("--card-h", card.offsetHeight + "px");
      cols.forEach(function (c, i) { c.classList.toggle("is-on", i === k); c.classList.toggle("is-done", k === 3 && i <= 3); });
      var sp = spot(k);
      card.style.setProperty("--cw", sp.w + "px");
      card.style.setProperty("--cx", sp.x + "px");
      card.style.setProperty("--cy", sp.y + "px");
      card.style.setProperty("--cr", (k % 2 ? 1.5 : -1.5) + "deg");
      state.textContent = STATES[k];
      card.classList.toggle("is-online", k === 3);
      next.textContent = k === 3 ? "Otra vez ↺" : "Avanzar →";
      if (k === 3 && celebrate) {
        var r = card.getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top, 90);
        unlock("proyecto");
      }
    }
    next.addEventListener("click", function () { place(cur === 3 ? 0 : cur + 1, true); });
    // Arrastrar la tarjeta
    card.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      var wr = win.getBoundingClientRect(), cr = card.getBoundingClientRect();
      var gx = e.clientX - cr.left, gy = e.clientY - cr.top, over = -1;
      card.classList.add("is-drag");
      try { card.setPointerCapture(e.pointerId); } catch (err) {}
      function move(ev) {
        card.style.setProperty("--cx", (ev.clientX - wr.left - gx) + "px");
        card.style.setProperty("--cy", (ev.clientY - wr.top - gy) + "px");
        card.style.setProperty("--cr", "4deg");
        over = -1;
        cols.forEach(function (c, i) {
          var r = c.getBoundingClientRect();
          var hit = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
          c.classList.toggle("is-over", hit);
          if (hit) over = i;
        });
      }
      function up() {
        card.classList.remove("is-drag");
        cols.forEach(function (c) { c.classList.remove("is-over"); });
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerup", up);
        card.removeEventListener("pointercancel", up);
        place(over > -1 ? over : cur, over === 3 && cur !== 3);
      }
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerup", up);
      card.addEventListener("pointercancel", up);
    });
    place(0, false);
    addEventListener("resize", function () { place(cur, false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(cur, false); });
  }

  // ---------- Escáner: tu web real, auditada en vivo ----------
  // Captura, nombre, logo y colores: Microlink (gratis, sin clave).
  // Auditoría: Google PageSpeed Insights. Poné acá una clave gratuita (console.cloud.google.com →
  // habilitar "PageSpeed Insights API" → Credenciales → Clave de API, restringida a tu dominio).
  // Sin clave la auditoría suele estar saturada y la página lo avisa sin romperse.
  var PSI_KEY = "AIzaSyAAh4ad4H7bI2bkj1OSJ71_JyUCsnpb0r8";
  function looksLikeUrl(t) { t = (t || "").trim(); return !/\s/.test(t) && /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(t); }
  function normUrl(t) { t = t.trim(); return /^https?:\/\//i.test(t) ? t : "https://" + t; }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } }
  function waNumber() { var b = $("[data-builder]"); return b ? (b.getAttribute("data-wa") || "").replace(/\D/g, "") : ""; }
  function openWa(text) { window.open("https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(text), "_blank", "noopener"); }
  function hsl(hex) {
    var c = hexToRgb(hex), mx = Math.max.apply(0, c), mn = Math.min.apply(0, c), l = (mx + mn) / 2, d = mx - mn;
    return { s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l: l };
  }
  // El color de la marca: el más saturado que no sea ni casi blanco ni casi negro
  function pickAccent(pal) {
    var best = null, score = 0;
    (pal || []).forEach(function (h) {
      if (!/^#[0-9a-f]{6}$/i.test(h)) return;
      var x = hsl(h), sc = x.s * (1 - Math.abs(x.l - 0.5) * 1.6);
      if (x.s > 0.25 && sc > score) { score = sc; best = h; }
    });
    return best;
  }
  function cleanName(t) { return (t || "").split(/\s[|\-–—·:]\s/)[0].trim().slice(0, 28) || "Tu marca"; }
  function makeTitle(desc, name) {
    if (desc) { var d = desc.split(/[.!?]\s/)[0].trim(); if (d.length > 8) return d.length > 62 ? d.slice(0, 60).replace(/\s\S*$/, "") + "…" : d; }
    return name + ", más rápida y en tu celular";
  }
  function initScanner() {
    var form = $("[data-hero-form]"), input = $("[data-mock-input]"), browser = $("[data-stage]"), scan = $("[data-scan]");
    if (!form || !scan) return;
    var tabsA = $(".tabs:not(.scan-tabs)", browser), tabsB = $("[data-scan-tabs]");
    var img = $("[data-scan-img]"), load = $("[data-scan-load]"), msg = $("[data-scan-msg]");
    var rings = $("[data-rings]"), findings = $("[data-findings]"), term = $("[data-perf]");
    var stats = $(".w-stats"), stK = $("[data-st-k]"), stV = $("[data-m-count]");
    var nw = $("[data-nw]"), nwLogo = $("[data-nw-logo]"), nwName = $("[data-nw-name]"), nwTitle = $("[data-nw-title]");
    var urlEl = $('[data-m="url"]', browser), run = 0, report = null, lines = [];
    var lock = $("[data-scan-lock]"), lockMsg = $("[data-scan-lock-msg]"), lockHost = "";

    // Un escaneo gratis por persona (se recuerda en este navegador); el siguiente se pide por WhatsApp
    function usedScan() { try { return localStorage.getItem("nowmad-escaneo"); } catch (e) { return null; } }
    function markScan(h) { try { localStorage.setItem("nowmad-escaneo", h); } catch (e) {} }
    function locked(host, prev) {
      run++; SCAN.on = true; lockHost = host;
      scan.hidden = false; tabsA.hidden = true; tabsB.hidden = true;
      view("shot");
      scan.classList.remove("is-scanning");
      img.classList.remove("is-on"); load.hidden = true; lock.hidden = false;
      urlEl.textContent = host;
      lockMsg.innerHTML = "Ya usaste tu escaneo gratis con <b>" + esc(prev) + "</b>. ¿Querés que revisemos <b>" + esc(host) + "</b>? Escribinos y te la auditamos nosotros, con el informe completo.";
    }

    function view(k) {
      $$(".sv", scan).forEach(function (v) { v.classList.toggle("is-on", v.getAttribute("data-sv") === k); });
      $$("[data-sv-btn]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-sv-btn") === k); });
    }
    function log(extra) {
      if (extra) lines.push(extra);
      term.innerHTML = lines.join("\n") + ' <span class="caret" aria-hidden="true"></span>';
    }
    function dots(label, value) { return "› " + label + " " + new Array(Math.max(2, 20 - label.length)).join(".") + " <b>" + value + "</b>"; }
    function exit() {
      if (!SCAN.on) return;
      SCAN.on = false; run++;
      scan.hidden = true; tabsB.hidden = true; tabsA.hidden = false;
      stats.classList.remove("is-score"); stK.textContent = "Consultas este mes";
      SCAN.resume();
    }
    function ring(label, v) {
      var c = v < 50 ? "#D93025" : v < 90 ? "#F08A2B" : "#1FA35A";
      var d = document.createElement("div"); d.className = "ring"; d.style.setProperty("--c", c);
      d.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="bg" cx="32" cy="32" r="28" /><circle class="fg" cx="32" cy="32" r="28" /></svg><b></b><span></span>';
      d.querySelector("b").textContent = v; d.querySelector("span").textContent = label;
      rings.appendChild(d);
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.style.setProperty("--v", v); }); });
    }
    function li(text, cls) { var x = document.createElement("li"); if (cls) x.className = cls; x.textContent = text; findings.appendChild(x); }

    function scanIt(raw) {
      var u = normUrl(raw), host = hostOf(u), prev = usedScan();
      if (prev) { locked(host, prev); return; }
      var my = ++run;
      SCAN.on = true; lock.hidden = true;
      report = { host: host, url: u };
      scan.hidden = false; tabsA.hidden = true; tabsB.hidden = false;
      view("shot");
      img.classList.remove("is-on"); img.removeAttribute("src");
      load.hidden = false; msg.textContent = "Abriendo " + host + "…";
      scan.classList.add("is-scanning"); scan.style.setProperty("--h", scan.clientHeight + "px");
      urlEl.textContent = host;
      stats.classList.add("is-score"); stK.textContent = "Velocidad en celular"; stV.textContent = "…";
      rings.innerHTML = ""; findings.innerHTML = "";
      li("Google está auditando tu web: tarda unos segundos…", "note");
      lines = ["$ escanear " + esc(host), "› abriendo tu web…", "› auditando con Google…"]; log();

      // 1. Captura y marca (Microlink)
      fetch("https://api.microlink.io/?url=" + encodeURIComponent(u) + "&screenshot=true&palette=true&meta=true")
        .then(function (r) { return r.json().then(function (j) { j.http = r.status; return j; }); })
        .then(function (j) {
          if (my !== run) return;
          if (j.http === 429 || j.code === "ERATE") throw new Error("cupo");
          if (j.status !== "success" || !j.data) throw new Error(j.message || "microlink");
          var d = j.data, shot = d.screenshot && d.screenshot.url;
          if (shot) {
            img.onload = function () { if (my === run) { load.hidden = true; img.classList.add("is-on"); } };
            img.src = shot;
          } else msg.textContent = "No pudimos sacar la captura de " + host + ".";
          var pal = ((d.logo && d.logo.palette) || []).concat((d.image && d.image.palette) || [], (d.screenshot && d.screenshot.palette) || []);
          report.name = cleanName(d.title || d.publisher || host);
          nwName.textContent = report.name;
          nwTitle.textContent = makeTitle(d.description, report.name);
          if (d.logo && d.logo.url && /^https:\/\//.test(d.logo.url)) nwLogo.src = d.logo.url; else nwLogo.removeAttribute("src");
          var a1 = pickAccent(pal) || "#8A6A3F", a2 = pickAccent(pal.filter(function (h) { return h !== a1; })) || "#D8BF8E";
          nw.style.setProperty("--acc", a1); nw.style.setProperty("--acc2", a2);
          log(dots("captura", "ok"));
          log(dots("marca", esc(report.name)));
        })
        .catch(function (err) {
          if (my !== run) return;
          msg.textContent = err && err.message === "cupo"
            ? "Hoy escanearon muchas webs y la captura se tomó un descanso. El informe de Google sigue abajo."
            : "No pudimos abrir " + host + ". ¿Está bien escrita la dirección?";
          log(dots("captura", "no disponible"));
        });

      // 2. Auditoría (Google PageSpeed Insights, en celular y en español)
      var psi = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + encodeURIComponent(u) +
        "&strategy=mobile&locale=es&category=performance&category=seo&category=accessibility&category=best-practices" + (PSI_KEY ? "&key=" + PSI_KEY : "");
      fetch(psi).then(function (r) { return r.json(); }).then(function (j) {
        if (my !== run) return;
        if (j.error || !j.lighthouseResult) throw new Error(j.error ? j.error.message : "psi");
        var c = j.lighthouseResult.categories, a = j.lighthouseResult.audits;
        function sc(k) { return c[k] && c[k].score != null ? Math.round(c[k].score * 100) : null; }
        var S = { perf: sc("performance"), seo: sc("seo"), acc: sc("accessibility"), bp: sc("best-practices") };
        var lcp = a["largest-contentful-paint"] && a["largest-contentful-paint"].displayValue;
        report.scores = S; report.lcp = lcp;
        markScan(host);
        rings.innerHTML = ""; findings.innerHTML = "";
        ring("Velocidad", S.perf); ring("SEO", S.seo); ring("Accesibilidad", S.acc); ring("Buenas prácticas", S.bp);
        if (lcp) li("En un celular, lo principal de tu web tarda " + lcp + " en aparecer.", S.perf >= 90 ? "ok" : "");
        var KEY = ["meta-description", "image-alt", "tap-targets", "font-size", "document-title", "link-text", "is-crawlable", "viewport", "color-contrast"];
        var issues = Object.keys(a).map(function (k) { return a[k]; }).filter(function (x) {
          return x.score != null && x.score < 0.9 && ((x.details && x.details.type === "opportunity") || KEY.indexOf(x.id) > -1);
        }).sort(function (x, y) { return ((y.details && y.details.overallSavingsMs) || 0) - ((x.details && x.details.overallSavingsMs) || 0); }).slice(0, 4);
        issues.forEach(function (x) { li(x.title + (x.displayValue ? " (" + x.displayValue + ")" : "")); });
        if (!issues.length) li("Tu web está muy bien. Igual podemos hacer que venda más.", "ok");
        stV.innerHTML = S.perf + "<small>/100</small>";
        log(dots("velocidad celular", S.perf + "/100"));
        log(dots("SEO", S.seo + "/100"));
        log(dots("accesibilidad", S.acc + "/100"));
        if (lcp) log(dots("carga en celular", esc(lcp)));
        log("› listo: mirá el informe y tu web nueva.");
        scan.classList.remove("is-scanning");
        view("report");
        toast("Escaneo listo", host + ": " + S.perf + "/100 de velocidad en celular.");
        unlock("escaner");
      }).catch(function () {
        if (my !== run) return;
        scan.classList.remove("is-scanning");
        findings.innerHTML = "";
        li("La auditoría de Google está saturada en este momento. Mandanos tu web y te la hacemos nosotros, gratis.", "note");
        stV.textContent = "—";
        log(dots("auditoría Google", "no disponible ahora"));
        unlock("escaner");
      });
    }

    // La barra del navegador: una dirección web se escanea; cualquier otra cosa arma el ejemplo
    form.addEventListener("submit", function (e) {
      if (!looksLikeUrl(input.value)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      scanIt(input.value);
    }, true);
    input.addEventListener("input", function () { if (SCAN.on && !looksLikeUrl(input.value)) exit(); });
    $$("[data-sv-btn]").forEach(function (b) { b.addEventListener("click", function () { view(b.getAttribute("data-sv-btn")); }); });
    $("[data-scan-cta]").addEventListener("click", function () {
      if (!report) return;
      var t = "¡Hola, nowmad agency! Escaneé mi web " + report.host + " en su página";
      if (report.scores) t += ": velocidad en celular " + report.scores.perf + "/100, SEO " + report.scores.seo + "/100, accesibilidad " + report.scores.acc + "/100";
      t += ". Quiero que me pasen el informe y mejorarla.";
      var b = $("[data-builder]");
      if (b) { b.elements.idea.value = "mejorar mi web " + report.host; b.dispatchEvent(new Event("change", { bubbles: true })); }
      openWa(t);
    });
    $("[data-scan-lock-btn]").addEventListener("click", function () {
      openWa("¡Hola, nowmad agency! Ya usé el escaneo gratis de su página y quiero que me auditen " + lockHost + ".");
    });
    $$("[data-try]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-try");
        if (v === "tu web") { input.value = ""; input.focus(); input.placeholder = "Escribí la dirección de tu web y Enter"; return; }
        input.value = v;
        scanIt(v);
        browser.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
      });
    });
  }

  // ---------- Competencia: negocios reales cerca, en un mapa ----------
  var RUBRO = {
    gimnasio: ["gimnasios", ["[leisure=fitness_centre]", "[leisure=sports_centre][sport=fitness]"]],
    restaurante: ["restaurantes", ["[amenity=restaurant]"]],
    cafe: ["cafés", ["[amenity=cafe]"]],
    bar: ["bares", ["[amenity=bar]", "[amenity=pub]"]],
    inmobiliaria: ["inmobiliarias", ["[office=estate_agent]", "[shop=estate_agent]"]],
    odontologo: ["odontólogos", ["[amenity=dentist]", "[healthcare=dentist]"]],
    medico: ["consultorios y clínicas", ["[amenity=clinic]", "[amenity=doctors]"]],
    peluqueria: ["peluquerías y barberías", ["[shop=hairdresser]"]],
    estetica: ["centros de estética", ["[shop=beauty]", "[leisure=spa]"]],
    ropa: ["tiendas de ropa", ["[shop=clothes]"]],
    veterinaria: ["veterinarias", ["[amenity=veterinary]"]],
    farmacia: ["farmacias", ["[amenity=pharmacy]"]],
    hotel: ["hoteles y hospedajes", ["[tourism=hotel]", "[tourism=hostel]", "[tourism=guest_house]"]],
    panaderia: ["panaderías", ["[shop=bakery]"]],
    ferreteria: ["ferreterías", ["[shop=hardware]", "[shop=doityourself]"]],
    autos: ["talleres mecánicos", ["[shop=car_repair]"]],
    optica: ["ópticas", ["[shop=optician]"]]
  };
  var leaflet = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leaflet) return leaflet;
    leaflet = new Promise(function (res, rej) {
      var css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      var js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      js.onload = function () { res(window.L); };
      js.onerror = rej;
      document.head.appendChild(js);
    });
    return leaflet;
  }
  function initCompetition() {
    var form = $("[data-cmp-form]"), box = $("[data-cmp-map]"), out = $("[data-cmp-result]"), geo = $("[data-cmp-geo]");
    if (!form || !box) return;
    var go = $(".cmp-go", form), map = null, layer = null;
    if ("IntersectionObserver" in window) {
      // Cuando la sección se acerca, el mapa ya se muestra (Buenos Aires) para que no quede un recuadro vacío
      var io = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        loadLeaflet().then(function (L) {
          if (map) return;
          var empty = $("[data-cmp-empty]", box); if (empty) empty.remove();
          map = L.map(box, { scrollWheelZoom: false, attributionControl: true });
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
          map.setView([-34.6037, -58.3816], 12);
        }).catch(function () {});
      }, { rootMargin: "600px" });
      io.observe(box);
    }
    function say(text, cls) { out.innerHTML = ""; var p = document.createElement("p"); p.className = cls || "cmp-q"; p.textContent = text; out.appendChild(p); }
    // Prefiere ciudades y barrios: "Corrientes" es la ciudad, no el centro de la provincia
    var PLACE = ["city", "town", "village", "suburb", "neighbourhood", "quarter", "borough", "municipality", "hamlet", "city_district"];
    function geocode(q) {
      function ask(extra) {
        return fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es" + extra + "&q=" + encodeURIComponent(q))
          .then(function (r) { return r.json(); });
      }
      return ask("&countrycodes=ar").then(function (d) { return d.length ? d : ask(""); }).then(function (d) {
        if (!d.length) throw new Error("nogeo");
        var best = d.filter(function (x) { return PLACE.indexOf(x.addresstype) > -1 || PLACE.indexOf(x.type) > -1; })[0] || d[0];
        return { lat: +best.lat, lon: +best.lon, label: q };
      });
    }
    function overpass(lat, lon, r, tags) {
      var body = "[out:json][timeout:25];(" + tags.map(function (t) { return "nwr(around:" + r + "," + lat + "," + lon + ")" + t + ";"; }).join("") + ");out center 300;";
      var hosts = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
      // Si un servidor tarda más de 12 s, se prueba el otro
      function tryHost(i) {
        var ctrl = window.AbortController ? new AbortController() : null;
        var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
        return fetch(hosts[i], { method: "POST", body: "data=" + encodeURIComponent(body), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctrl ? ctrl.signal : undefined })
          .then(function (res) { clearTimeout(t); if (!res.ok) throw new Error("overpass"); return res.json(); })
          .catch(function (err) { clearTimeout(t); if (i + 1 < hosts.length) return tryHost(i + 1); throw err; });
      }
      return tryHost(0).then(function (d) { return d.elements || []; });
    }
    // Respaldo si Overpass está saturado: Photon busca por palabras del rubro dentro de la zona
    var PHOTON = {
      gimnasio: ["leisure:fitness_centre", ["gimnasio", "gym", "fitness", "crossfit", "training"]],
      restaurante: ["amenity:restaurant", ["restaurante", "restaurant", "parrilla", "pizzeria", "comedor"]],
      cafe: ["amenity:cafe", ["cafe", "café", "coffee", "cafetería"]],
      bar: ["amenity:bar", ["bar", "pub", "cervecería"]],
      inmobiliaria: ["office:estate_agent", ["inmobiliaria", "propiedades", "bienes raices"]],
      odontologo: ["amenity:dentist", ["odontologia", "dental", "odontologo", "dentista"]],
      medico: ["amenity:clinic", ["clinica", "consultorio", "centro medico", "sanatorio"]],
      peluqueria: ["shop:hairdresser", ["peluqueria", "barberia", "barber", "estilista"]],
      estetica: ["shop:beauty", ["estetica", "spa", "belleza", "beauty"]],
      ropa: ["shop:clothes", ["ropa", "indumentaria", "moda", "boutique"]],
      veterinaria: ["amenity:veterinary", ["veterinaria", "vet", "mascotas"]],
      farmacia: ["amenity:pharmacy", ["farmacia", "farmacity", "drogueria"]],
      hotel: ["tourism:hotel", ["hotel", "hostel", "hospedaje", "apart"]],
      panaderia: ["shop:bakery", ["panaderia", "confiteria", "panificadora"]],
      ferreteria: ["shop:hardware", ["ferreteria", "corralon", "bulonera"]],
      autos: ["shop:car_repair", ["taller", "mecanica", "mecánico", "service"]],
      optica: ["shop:optician", ["optica", "óptica", "lentes"]]
    };
    function photon(lat, lon, r, key) {
      var cfg = PHOTON[key], dLat = r / 111000, dLon = r / (111000 * Math.cos(lat * Math.PI / 180));
      var bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat].join(",");
      return Promise.all(cfg[1].map(function (w) {
        return fetch("https://photon.komoot.io/api/?limit=50&q=" + encodeURIComponent(w) + "&osm_tag=" + cfg[0] + "&bbox=" + bbox)
          .then(function (res) { return res.json(); }).catch(function () { return { features: [] }; });
      })).then(function (all) {
        var seen = {}, els = [];
        all.forEach(function (j) {
          (j.features || []).forEach(function (f) {
            var id = f.properties.osm_type + f.properties.osm_id;
            if (seen[id]) return;
            seen[id] = 1;
            var c = f.geometry.coordinates;
            if (Math.abs(c[1] - lat) > dLat || Math.abs(c[0] - lon) > dLon) return;
            els.push({ lat: c[1], lon: c[0], tags: { name: f.properties.name } });
          });
        });
        els.partial = true;
        return els;
      });
    }
    function search(lat, lon, label) {
      var key = form.elements.rubro.value, R = RUBRO[key], radius = +form.elements.radio.value;
      var rubroTxt = form.elements.rubro.options[form.elements.rubro.selectedIndex].text.toLowerCase();
      go.disabled = true; go.textContent = "Buscando…";
      say("Buscando " + R[0] + " cerca de " + label + "…");
      // Carrera: Overpass es el más completo; si a los 5 s no contestó, sale también Photon y gana el primero con datos
      var found = new Promise(function (resolve, reject) {
        var done = false, fails = 0, backup = null;
        function ok(els) { if (!done && els && (els.length || fails)) { done = true; resolve(els); } else if (!done && els) { fails++; if (fails > 1) { done = true; resolve(els); } } }
        function bad() { fails++; if (fails > 1 && !done) { done = true; reject(new Error("sin datos")); } else if (!backup) startBackup(); }
        function startBackup() { if (backup || done) return; backup = photon(lat, lon, radius, key).then(ok, bad); }
        overpass(lat, lon, radius, R[1]).then(ok, bad);
        setTimeout(startBackup, 5000);
      });
      Promise.all([loadLeaflet(), found]).then(function (res) {
        var L = res[0], els = res[1];
        if (!map) {
          var empty = $("[data-cmp-empty]", box); if (empty) empty.remove();
          map = L.map(box, { scrollWheelZoom: false, attributionControl: true });
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
        }
        if (layer) layer.remove();
        layer = L.layerGroup().addTo(map);
        L.circle([lat, lon], { radius: radius, color: "#8A6A3F", weight: 1.5, fillOpacity: 0.06 }).addTo(layer);
        L.marker([lat, lon], { icon: L.divIcon({ className: "", html: '<span class="pin-me"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }) }).bindPopup("Vos").addTo(layer);
        map.invalidateSize();
        map.fitBounds(L.latLng(lat, lon).toBounds(radius * 2), { padding: [20, 20] });
        var names = [];
        els.forEach(function (e, i) {
          var la = e.lat != null ? e.lat : e.center && e.center.lat, lo = e.lon != null ? e.lon : e.center && e.center.lon;
          if (la == null) return;
          var n = e.tags && e.tags.name;
          if (n && names.indexOf(n) < 0) names.push(n);
          setTimeout(function () {
            var m = L.circleMarker([la, lo], { radius: 7, color: "#fff", weight: 2, fillColor: "#4A3524", fillOpacity: 1 });
            m.bindPopup(document.createTextNode(n || "Sin nombre en el mapa"));
            m.addTo(layer);
          }, REDUCED ? 0 : Math.min(i, 120) * 22);
        });
        out.innerHTML = "";
        var km = radius / 1000, big = document.createElement("p"); big.className = "cmp-big";
        var q = document.createElement("p"); q.className = "cmp-q";
        if (els.length) {
          big.innerHTML = "<em></em> " ; big.querySelector("em").textContent = els.length;
          big.appendChild(document.createTextNode(R[0] + " a " + km + " km de " + label + "."));
          q.textContent = "Cuando alguien busca “" + rubroTxt + " en " + label + "”, ¿te encuentra a vos o a ellos?" + (els.partial ? " (Resultado parcial: el mapa está con mucha demanda.)" : "");
        } else {
          big.textContent = "No hay " + R[0] + " cargados en el mapa a " + km + " km de " + label + ".";
          q.textContent = "Oportunidad: el primero que aparece online en tu zona se queda con los clientes.";
        }
        out.appendChild(big); out.appendChild(q);
        if (names.length) {
          var ul = document.createElement("ul"); ul.className = "cmp-names";
          names.slice(0, 10).forEach(function (n) { var x = document.createElement("li"); x.textContent = n; ul.appendChild(x); });
          if (names.length > 10) { var more = document.createElement("li"); more.textContent = "+" + (names.length - 10) + " más"; ul.appendChild(more); }
          out.appendChild(ul);
        }
        var want = document.createElement("button");
        want.type = "button"; want.className = "cmp-want"; want.textContent = "Quiero destacarme →";
        want.addEventListener("click", function () {
          openWa("¡Hola, nowmad agency! Busqué mi competencia en su página: hay " + els.length + " " + R[0] + " a " + km + " km de " + label + ". Quiero destacarme.");
        });
        out.appendChild(want);
        unlock("mapa");
      }).catch(function (err) {
        console.warn("[nowmad agency] competencia", err);
        say("El mapa no respondió. Probá de nuevo en un ratito.", "cmp-err");
      }).then(function () { go.disabled = false; go.textContent = "Buscar mi competencia"; });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = form.elements.lugar.value.trim();
      if (!q) { say("Escribí tu ciudad o barrio, o tocá “Usar mi ubicación”.", "cmp-err"); form.elements.lugar.focus(); return; }
      go.disabled = true;
      geocode(q).then(function (g) { search(g.lat, g.lon, g.label); }).catch(function () {
        go.disabled = false;
        say("No encontramos “" + q + "”. Probá con ciudad y provincia.", "cmp-err");
      });
    });
    geo.addEventListener("click", function () {
      if (!navigator.geolocation) { say("Tu navegador no comparte la ubicación. Escribí tu ciudad.", "cmp-err"); return; }
      say("Pidiendo tu ubicación…");
      navigator.geolocation.getCurrentPosition(function (pos) {
        search(pos.coords.latitude, pos.coords.longitude, "tu ubicación");
      }, function () { say("No pudimos usar tu ubicación. Escribí tu ciudad.", "cmp-err"); }, { timeout: 10000 });
    });
  }

  // ---------- Tu propuesta: analiza qué necesitás, qué tenés y tu presupuesto ----------
  var ITEMS = {
    web: { t: "Tu web", d: "Rápida, pensada para el celular y para vender o recibir consultas.", s: "una web" },
    rediseno: { t: "Rediseño de tu web", d: "La rehacemos para que cargue rápido y convierta.", s: "una web" },
    tienda: { t: "Tienda online", d: "Catálogo, carrito y pagos con Mercado Pago.", s: "una web" },
    google: { t: "Google Ads", d: "Aparecer cuando te están buscando.", s: "campañas en Google Ads" },
    meta: { t: "Meta Ads", d: "Instagram y Facebook, a la gente indicada.", s: "campañas en Meta Ads" },
    sistema: { t: "Sistema a medida", d: "Pedidos, turnos o stock hechos para tu negocio.", s: "un sistema a medida" },
    auto: { t: "Automatización a medida", d: "Web, pagos, stock, facturas y WhatsApp conectados; lo manejás desde el celular. Sin IA si no hace falta.", s: "automatizar mi negocio" },
    ia: { t: "Asistente con IA", d: "Responde consultas y agenda sin que estés encima.", s: "algo con inteligencia artificial" },
    medicion: { t: "Medición", d: "Saber qué funciona y dónde conviene invertir.", s: "medir mis resultados" }
  };
  var GOALS = { vender: ["tienda", "meta"], consultas: ["google", "meta"], google: ["google"], procesos: ["auto"], ia: ["ia"] };
  var GOAL_TXT = { vender: "vender online", consultas: "conseguir más consultas", google: "aparecer en Google", procesos: "automatizar y conectar todo", ia: "automatizar con IA" };
  var NOW_TXT = { nada: "todavía no tengo nada", redes: "hoy solo tengo redes", vieja: "tengo una web que no me convence", web: "tengo una web que funciona" };
  var BUDGET_TXT = { ajustado: "ajustado", medio: "intermedio", amplio: "amplio", nose: "a definir, quiero que me asesoren" };

  function planFor(goals, now, budget) {
    var keys = [];
    function add(k) { if (keys.indexOf(k) < 0) keys.push(k); }
    var wantsShop = goals.indexOf("vender") > -1;
    if (!wantsShop && (now === "nada" || now === "redes" || !now)) add("web");
    if (!wantsShop && now === "vieja") add("rediseno");
    goals.forEach(function (g) { (GOALS[g] || []).forEach(add); });
    if (!keys.length) { add("web"); add("google"); }
    if (budget === "amplio" || keys.length >= 3) add("medicion");
    var nowCount = budget === "ajustado" ? 1 : budget === "medio" ? 2 : keys.length;
    return keys.map(function (k, i) {
      var tag = budget === "nose" || !budget ? "talk" : i < nowCount ? "now" : "later";
      return { item: ITEMS[k], tag: tag };
    });
  }

  function initWizard() {
    var form = $("[data-wiz]");
    if (!form) return;
    var steps = $$("[data-step]", form), side = $$("[data-wiz-steps] li", form);
    var back = $("[data-wiz-back]", form), next = $("[data-wiz-next]", form), count = $("[data-wiz-count]", form);
    var planEl = $("[data-wiz-plan]", form), summary = $("[data-wiz-summary]", form);
    var cur = 0, last = [];
    function values() {
      return {
        goals: $$('input[name="goal"]:checked', form).map(function (i) { return i.value; }),
        now: (($('input[name="now"]:checked', form) || {}).value) || "",
        budget: (($('input[name="budget"]:checked', form) || {}).value) || "",
        amount: form.elements.amount.value.trim()
      };
    }
    function show(i) {
      cur = i;
      steps.forEach(function (s, n) {
        var on = n === i;
        s.classList.toggle("is-on", on);
        if (s.classList.contains("wiz-result")) s.hidden = !on;
      });
      side.forEach(function (li, n) { li.classList.toggle("is-on", n === i); li.classList.toggle("is-done", n < i); });
      back.hidden = i === 0;
      next.hidden = i === 3;
      next.textContent = i === 2 ? "Ver mi propuesta" : "Siguiente";
      count.textContent = i < 3 ? "Paso " + (i + 1) + " de 3" : "Listo";
      if (i === 3) { render(); unlock("propuesta"); }
    }
    function render() {
      var v = values();
      last = planFor(v.goals, v.now, v.budget);
      var LABEL = { now: "Ahora", later: "Más adelante", talk: "Lo vemos juntos" };
      planEl.innerHTML = "";
      last.forEach(function (p, n) {
        var li = document.createElement("li");
        li.style.setProperty("--i", n);
        var box = document.createElement("div");
        var b = document.createElement("b"); b.textContent = p.item.t;
        var sp = document.createElement("span"); sp.textContent = p.item.d;
        box.appendChild(b); box.appendChild(sp);
        var tag = document.createElement("i"); tag.className = p.tag; tag.textContent = LABEL[p.tag];
        li.appendChild(box); li.appendChild(tag);
        planEl.appendChild(li);
      });
      var parts = [];
      var g = v.goals.map(function (k) { return GOAL_TXT[k]; });
      if (g.length) parts.push("Para " + (g.length < 2 ? g[0] : g.slice(0, -1).join(", ") + " y " + g[g.length - 1]));
      if (v.budget === "ajustado") parts.push("con un presupuesto ajustado: arrancamos por lo que más impacto tiene y sumamos el resto por etapas.");
      else if (v.budget === "medio") parts.push("con un presupuesto intermedio: lo principal ahora y el resto después.");
      else if (v.budget === "amplio") parts.push("con un presupuesto amplio: lo hacemos completo de una.");
      else parts.push("y te asesoramos sobre cuánto conviene invertir.");
      summary.textContent = parts.join(", ").replace(/^,\s*/, "");
    }
    next.addEventListener("click", function () { show(Math.min(3, cur + 1)); });
    back.addEventListener("click", function () { show(Math.max(0, cur - 1)); });
    // "Pedir esta propuesta": carga todo en el WhatsApp de contacto
    $("[data-wiz-send]", form).addEventListener("click", function () {
      var v = values(), b = $("[data-builder]");
      if (!b) return;
      $$('input[name="s"]', b).forEach(function (box) { box.checked = false; });
      last.forEach(function (p) {
        if (p.tag === "later") return;
        var box = $('input[name="s"][value="' + p.item.s + '"]', b);
        if (box) box.checked = true;
      });
      var r = v.budget && $('input[name="budget"][value="' + v.budget + '"]', b);
      if (r) r.checked = true;
      b.elements.amount.value = v.amount;
      var idea = [];
      var gs = v.goals.map(function (k) { return GOAL_TXT[k]; });
      if (gs.length) idea.push("una propuesta para " + (gs.length < 2 ? gs[0] : gs.slice(0, -1).join(", ") + " y " + gs[gs.length - 1]));
      if (v.now) idea.push(NOW_TXT[v.now]);
      b.elements.idea.value = idea.join("; ");
      b.dispatchEvent(new Event("change", { bubbles: true }));
    });
    show(0);
  }


  // ---------- Servicios: el celular. Arrastrás una app adentro (o la tocás) y funciona ----------
  var APP_DESC = {
    web: ["Sitios rápidos que venden", "Tu web, rápida y pensada para el celular, hecha para vender o recibir consultas."],
    sys: ["Hecho para tu negocio", "Paneles, pedidos, turnos o stock a medida de cómo trabajás."],
    auto: ["Todo conectado, sin IA", "Web, pagos, stock, facturas y WhatsApp conectados. Lo manejás desde el celular."],
    ia: ["Responde y agenda solo", "Asistentes con tus datos, solo cuando suman de verdad."],
    google: ["Aparecer cuando te buscan", "Campañas de búsqueda, display y YouTube."],
    meta: ["Llegar a la gente indicada", "Anuncios en Instagram y Facebook."],
    data: ["Saber qué funciona", "Píxeles, conversiones y analítica para invertir mejor."]
  };
  function initPhone() {
    var list = $("[data-apps]"), phone = $("[data-phone]");
    if (!list || !phone) return;
    var home = $("[data-phone-home]"), inst = $("[data-phone-install]"), app = $("[data-phone-app]");
    var demoBox = $("[data-phone-demo]"), title = $("[data-phone-title]"), iname = $("[data-phone-name]"), info = $("[data-phone-info]");
    var used = {}, timer = 0, current = null;
    $$(".dock-app[data-open]").forEach(function (d) {
      var key = d.getAttribute("data-open");
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.className = "app-tile"; b.setAttribute("data-app", key);
      var ic = d.querySelector(".ic").cloneNode(true);
      ic.className = "ic " + (d.className.match(/ic-\w+/) || [""])[0];
      var tx = document.createElement("span"), nm = document.createElement("b"), sm = document.createElement("small");
      nm.textContent = NAMES[key]; sm.textContent = APP_DESC[key][0];
      tx.appendChild(nm); tx.appendChild(sm); b.appendChild(ic); b.appendChild(tx);
      li.appendChild(b); list.appendChild(li);
    });
    var tiles = $$(".app-tile", list);
    function wrapIcon(tile) { var w = document.createElement("span"); w.className = tile.querySelector(".ic").className.split(" ").filter(function (c) { return c.indexOf("ic-") === 0; }).join(" "); return w; }
    function showInfo(key) {
      info.innerHTML = "";
      var b = document.createElement("b"), d = document.createElement("p"), want = document.createElement("button");
      b.textContent = NAMES[key]; d.className = "ph-info-d"; d.textContent = APP_DESC[key][1];
      want.type = "button"; want.className = "ph-want"; want.textContent = "Lo quiero en mi pedido";
      want.addEventListener("click", function () {
        var box = $('[data-builder] input[name="s"][value="' + SERVICE[key] + '"]');
        if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event("change", { bubbles: true })); }
        want.textContent = "Anotado en tu pedido ✓"; want.classList.add("is-done");
      });
      info.appendChild(b); info.appendChild(d); info.appendChild(want);
    }
    function install(key) {
      var src = $('[data-ql] [data-demo="' + key + '"]');
      if (!src) return;
      current = key;
      tiles.forEach(function (t) { t.classList.toggle("is-on", t.getAttribute("data-app") === key); });
      clearTimeout(timer);
      app.hidden = true; home.hidden = true; inst.hidden = false;
      // en celular el teléfono queda abajo de la lista: lo traemos a la vista
      if (innerWidth < 900) phone.scrollIntoView({ block: "center", behavior: REDUCED ? "auto" : "smooth" });
      iname.textContent = NAMES[key];
      showInfo(key);
      timer = setTimeout(function () {
        inst.hidden = true;
        demoBox.innerHTML = "";
        var d = src.cloneNode(true);
        d.classList.remove("is-on");
        demoBox.appendChild(d);
        title.textContent = NAMES[key];
        app.hidden = false;
        void d.offsetWidth; d.classList.add("is-on");
        used[key] = 1;
        var t = $('.app-tile[data-app="' + key + '"]'); if (t) t.classList.add("is-used");
        if (Object.keys(used).length >= 3) unlock("apps");
      }, REDUCED ? 0 : 900);
    }
    $("[data-phone-close]").addEventListener("click", function () {
      app.hidden = true; inst.hidden = true; home.hidden = false; current = null;
      tiles.forEach(function (t) { t.classList.remove("is-on"); });
    });
    tiles.forEach(function (tile) {
      var key = tile.getAttribute("data-app");
      tile.addEventListener("click", function () { if (!tile._dragged) install(key); tile._dragged = false; });
      // Con mouse, también se puede arrastrar al celular
      tile.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        var sx = e.clientX, sy = e.clientY, ghost = null, over = false;
        function move(ev) {
          if (!ghost && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
          if (!ghost) {
            ghost = tile.querySelector(".ic").cloneNode(true);
            ghost.classList.add("drag-ghost");
            document.body.appendChild(ghost);
            tile._dragged = true;
          }
          ghost.style.setProperty("--gx", (ev.clientX - 24) + "px");
          ghost.style.setProperty("--gy", (ev.clientY - 24) + "px");
          var r = phone.getBoundingClientRect();
          over = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
          phone.classList.toggle("is-over", over);
        }
        function up() {
          removeEventListener("pointermove", move);
          removeEventListener("pointerup", up);
          phone.classList.remove("is-over");
          if (ghost) { ghost.remove(); if (over) install(key); }
        }
        addEventListener("pointermove", move);
        addEventListener("pointerup", up);
      });
    });
  }

  // ---------- Ayuda: un asistente que responde ----------
  function initBot() {
    var log = $("[data-bot-log]"), chips = $("[data-bot-chips]"), form = $("[data-bot-form]");
    if (!log || !form) return;
    var QA = $$("[data-faq] details").map(function (d) {
      return { q: d.querySelector("summary").textContent, a: d.querySelector("p").textContent };
    });
    var STOP = " que los las del con por para una uno unos como cual puedo tengo hace hacen esto eso necesito quiero sale ";
    function words(t) {
      return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
        .filter(function (w) { return w.length > 2 && STOP.indexOf(" " + w + " ") < 0; });
    }
    var EXTRA = { precio: 0, cuesta: 0, cuanto: 0, presupuesto: 0, plata: 0, celular: 3, telefono: 3, movil: 3, app: 3, ia: 2, inteligencia: 2, chatbot: 4, automatizar: 2, automatizacion: 2, anuncios: 1, ads: 1, google: 1, meta: 1, instagram: 1, avances: 5, proyecto: 5, ver: 5 };
    function answer(text) {
      var w = words(text), best = -1, score = 0;
      QA.forEach(function (qa, i) {
        var bag = words(qa.q + " " + qa.a), sc = 0;
        w.forEach(function (x) { if (bag.indexOf(x) > -1) sc += 1; if (EXTRA[x] === i) sc += 3; });
        if (sc > score) { score = sc; best = i; }
      });
      return score > 0 ? QA[best].a : null;
    }
    function bubble(cls, text) { var p = document.createElement("p"); p.className = cls; p.textContent = text; log.appendChild(p); log.scrollTop = log.scrollHeight; return p; }
    var busy = false;
    function ask(q, fixed) {
      if (busy || !q.trim()) return;
      busy = true;
      bubble("b-out", q);
      var typing = document.createElement("p");
      typing.className = "b-typing"; typing.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(typing); log.scrollTop = log.scrollHeight;
      setTimeout(function () {
        typing.remove();
        var a = fixed || answer(q);
        if (a) bubble("b-in", a);
        else {
          var p = bubble("b-in", "Eso no lo sé todavía, pero una persona sí. ");
          var link = document.createElement("a"); link.href = "#contacto"; link.textContent = "Escribinos por WhatsApp →";
          p.appendChild(link);
        }
        busy = false;
        unlock("chat");
      }, REDUCED ? 100 : 900 + Math.random() * 500);
    }
    QA.forEach(function (qa) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "bot-chip"; b.textContent = qa.q;
      b.addEventListener("click", function () { ask(qa.q, qa.a); b.classList.add("is-used"); });
      chips.appendChild(b);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = form.querySelector("input");
      ask(inp.value); inp.value = "";
    });
  }

  // ---------- Secreto: código Konami = modo fiesta ----------
  function initParty() {
    var seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], i = 0;
    document.addEventListener("keydown", function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === seq[i] ? i + 1 : (k === seq[0] ? 1 : 0);
      if (i === seq.length) {
        i = 0;
        document.documentElement.classList.add("is-party");
        setTimeout(function () { document.documentElement.classList.remove("is-party"); }, 12000);
        toast("Modo fiesta", "Encontraste el secreto. Mirá el fondo.");
        confetti(innerWidth / 2, innerHeight / 2, 160);
      }
    });
  }

  // ---------- Ayuda: buscador que filtra las preguntas ----------
  function initFaq() {
    var input = $("[data-faq-search]"), none = $("[data-faq-none]");
    if (!input) return;
    var items = $$("[data-faq] details");
    function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    input.addEventListener("input", function () {
      var q = norm(input.value.trim()), shown = 0;
      items.forEach(function (d) {
        var hit = !q || norm(d.textContent).indexOf(q) > -1;
        d.hidden = !hit;
        if (hit) shown++;
        d.open = !!q && hit && shown === 1;
      });
      if (none) none.hidden = shown > 0;
    });
  }

  // ---------- Contacto: el WhatsApp arma el mensaje ----------
  function initBuilder() {
    var form = $("[data-builder]");
    if (!form) return;
    var msgEl = $("[data-msg]", form), bubble = msgEl.closest(".wa-out"), nowEl = $("[data-now]", form);
    var send = $("[data-send]", form), label = $("[data-send-label]", form);
    var wa = (form.getAttribute("data-wa") || "").replace(/\D/g, ""), mail = form.getAttribute("data-mail") || "";
    function list(items) { return items.length < 2 ? items.join("") : items.slice(0, -1).join(", ") + " y " + items[items.length - 1]; }
    function build() {
      var idea = form.elements.idea.value.trim().replace(/[.\s]+$/, "");
      var services = $$('input[name="s"]:checked', form).map(function (i) { return i.value; });
      var plazoEl = $('input[name="plazo"]:checked', form), plazo = plazoEl ? plazoEl.value : "";
      var budgetEl = $('input[name="budget"]:checked', form), budget = budgetEl ? budgetEl.value : "";
      var amount = form.elements.amount ? form.elements.amount.value.trim() : "";
      var text = "¡Hola, nowmad agency!";
      if (idea) text += " Quiero " + idea.charAt(0).toLowerCase() + idea.slice(1) + ".";
      if (services.length) text += " Necesito " + list(services) + ".";
      if (!idea && !services.length) text += " Quiero contarles un proyecto.";
      if (budget) text += " Mi presupuesto es " + BUDGET_TXT[budget] + (amount ? " (aprox. " + amount + ")" : "") + ".";
      else if (amount) text += " Cuento con aprox. " + amount + ".";
      if (plazo) text += " Lo necesito " + plazo + ".";
      return text;
    }
    function update() {
      var text = build();
      if (msgEl.textContent !== text && bubble && !REDUCED) { bubble.classList.remove("is-new"); void bubble.offsetWidth; bubble.classList.add("is-new"); }
      msgEl.textContent = text;
      var d = new Date();
      if (nowEl) nowEl.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
      if (wa) { send.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(text); send.target = "_blank"; send.rel = "noopener"; }
      else send.href = "mailto:" + mail + "?subject=" + encodeURIComponent("Consulta nowmad agency") + "&body=" + encodeURIComponent(text);
    }
    if (wa) label.textContent = "Enviar por WhatsApp";
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); send.click(); });
    // La barra del navegador del escritorio lleva lo que escribiste al WhatsApp
    var hero = $("[data-hero-form]");
    if (hero) hero.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = hero.elements.idea.value.trim();
      if (looksLikeUrl(v)) return; // eso lo maneja el escáner
      if (v) form.elements.idea.value = v;
      update();
      $("#contacto").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
    });
    update();
  }

  function initClock() {
    var els = $$("[data-clock]");
    if (!els.length) return;
    var fmt;
    try { fmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }); } catch (e) { return; }
    function tick() { var s = fmt.format(new Date()); els.forEach(function (el) { el.textContent = s; }); }
    tick(); setInterval(tick, 15000);
  }
  function initYear() { $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }

  function boot() {
    // ---------- Capa Mac: arranque, menú de la app, Spotlight, clic derecho, fondos y selección ----------
  function initMac() {
    var root = document.documentElement;

    // Arranque: el logo y la barrita, una vez por visita
    // (el script del <head> ya marcó "is-booting" para que se vea desde el primer cuadro)
    var boot = $("[data-boot]");
    if (boot && root.classList.contains("is-booting")) {
      try { sessionStorage.setItem("nowmad-boot", "1"); } catch (e) {}
      setTimeout(function () {
        root.classList.remove("is-booting"); boot.classList.add("is-out");
        setTimeout(function () { boot.remove(); }, 600);
      }, 1300);
    } else if (boot) boot.remove();

    // Fondos de pantalla: el mismo diseño en cinco tonos, o según la hora de Buenos Aires
    var wall = $("[data-wall]"), tone = "bronce";
    var TONES = [["bronce", "Bronce", "#8A6A3F"], ["sepia", "Sepia", "#4A3524"], ["oliva", "Oliva", "#6B7A3A"], ["atardecer", "Atardecer", "#D97757"], ["noche", "Noche", "#1A120B"], ["auto", "Según la hora", "conic-gradient(#B08A4F 0 33%, #D97757 0 66%, #1A120B 0)"]];
    function autoTone() {
      var h = +new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
      return h >= 20 || h < 6 ? "noche" : h >= 17 ? "atardecer" : "bronce";
    }
    function toneName(t) { for (var i = 0; i < TONES.length; i++) if (TONES[i][0] === t) return TONES[i][1]; return t; }
    function setTone(t, save) {
      tone = t;
      if (wall) wall.setAttribute("data-tone", t === "auto" ? autoTone() : t);
      if (!save) return;
      try { localStorage.setItem("nowmad-fondo", t); } catch (e) {}
      toast("Fondo de pantalla", toneName(t) + ".");
      unlock("fondo");
    }
    try { tone = localStorage.getItem("nowmad-fondo") || "bronce"; } catch (e) {}
    if (!TONES.some(function (x) { return x[0] === tone; })) tone = "bronce";
    setTone(tone);
    function nextTone() {
      var i = 0;
      for (var k = 0; k < 5; k++) if (TONES[k][0] === tone) i = k + 1;
      setTone(TONES[i % 5][0], true);
    }

    // Batería real del dispositivo si el navegador la da
    var bat = $("[data-bat]");
    if (bat && navigator.getBattery) navigator.getBattery().then(function (b) {
      function upd() {
        bat.parentNode.style.setProperty("--bat", Math.max(10, b.level * 100) + "%");
        bat.parentNode.classList.toggle("is-low", b.level < 0.2 && !b.charging);
        var dd = $("[data-about-bat]");
        if (dd) dd.textContent = Math.round(b.level * 100) + "%" + (b.charging ? ", cargando" : "") + ". Nosotros, para rato.";
      }
      upd(); b.addEventListener("levelchange", upd); b.addEventListener("chargingchange", upd);
    }).catch(function () {});

    // Acciones que comparten el menú de la app, el clic derecho y Spotlight
    var about = $("[data-about]"), spot = $("[data-spot]"), ctx = $("[data-ctx]");
    var amBtn = $("[data-appmenu]"), amList = $("[data-appmenu-list]");
    function closeMenus() {
      if (amList) { amList.hidden = true; amBtn.setAttribute("aria-expanded", "false"); }
      if (ctx) ctx.hidden = true;
    }
    function tidy() {
      $$("main .win").forEach(function (w) { w.dispatchEvent(new Event("win:home")); });
      $$(".desk [data-win]").forEach(function (w) { w.style.removeProperty("--x"); w.style.removeProperty("--y"); });
      toast("Ventanas ordenadas", "Todo volvió a su lugar.");
    }
    function openAbout() { if (!about) return; about.hidden = false; $("[data-about-close]", about).focus(); }
    var ACTS = {
      about: openAbout,
      spot: function () { openSpot(); },
      wall: nextTone,
      tidy: tidy,
      logros: function () { var t = $("[data-trophy]"); if (t) t.click(); },
      wa: function () { openWa("¡Hola, nowmad agency! Quiero contarles un proyecto."); }
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (b && ACTS[b.getAttribute("data-act")]) { closeMenus(); ACTS[b.getAttribute("data-act")](); return; }
      var t = b ? null : e.target.closest("[data-tone-set]");
      if (t) { closeMenus(); setTone(t.getAttribute("data-tone-set"), true); return; }
      if (!e.target.closest(".mb-am, .ctx")) closeMenus();
    });
    if (about) {
      $("[data-about-close]", about).addEventListener("click", function () { about.hidden = true; });
      $$(".lights i", about).forEach(function (i) { i.addEventListener("click", function () { about.classList.remove("is-nope"); void about.offsetWidth; }); });
    }

    // Menú de la app ("nowmad agency" en la barra)
    if (amBtn && amList) amBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = amList.hidden;
      closeMenus();
      amList.hidden = !open; amBtn.setAttribute("aria-expanded", String(open));
      if (open) $("button", amList).focus();
    });

    // Clic derecho en el escritorio: el menú de siempre, con los fondos
    function ctxHtml() {
      return '<button type="button" data-act="spot">Buscar… <kbd>⌘K</kbd></button>' +
        '<button type="button" data-act="about">Acerca de nowmad agency</button><hr />' +
        '<p class="ctx-h">Fondo de pantalla</p><div class="ctx-tones">' +
        TONES.map(function (t) { return '<button type="button" data-tone-set="' + t[0] + '" title="' + t[1] + '" aria-label="Fondo ' + t[1] + '" style="--c:' + t[2] + ';background:' + t[2] + '"' + (t[0] === tone ? ' class="is-on"' : "") + "></button>"; }).join("") +
        '</div><hr /><button type="button" data-act="tidy">Ordenar ventanas</button>' +
        '<button type="button" data-act="logros">Ver logros</button><hr />' +
        '<button type="button" data-act="wa">Escribinos por WhatsApp</button>';
    }
    if (ctx) document.addEventListener("contextmenu", function (e) {
      if (!DESKTOP.matches || e.target.closest(".win, input, textarea, select, a, button, .dock, .menubar, .spot, .ctx, .leaflet-container")) return;
      e.preventDefault();
      closeMenus();
      ctx.innerHTML = ctxHtml(); ctx.hidden = false;
      var w = ctx.offsetWidth, h = ctx.offsetHeight;
      ctx.style.left = Math.min(e.clientX, innerWidth - w - 8) + "px";
      ctx.style.top = Math.min(e.clientY, innerHeight - h - 8) + "px";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closeMenus();
      if (about && !about.hidden) about.hidden = true;
    });
    addEventListener("scroll", function () { if (ctx && !ctx.hidden) ctx.hidden = true; }, { passive: true });

    // Spotlight: secciones, demos, acciones, escanear una web y hacer cuentas
    var input = $("[data-spot-input]"), list = $("[data-spot-list]"), items = [], sel = 0, opener = null;
    var I = {
      folder: '<svg><use href="#folder" /></svg>', o: '<svg><use href="#o" /></svg>', chat: '<svg><use href="#chat" /></svg>',
      search: '<svg><use href="#search" /></svg>', doc: '<svg><use href="#doc" /></svg>'
    };
    function go(hash) { var el = $(hash); if (el) el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" }); }
    var BASE = [
      { t: "Nosotros", d: "Quiénes somos", k: "nosotros agencia equipo quienes", i: I.doc, run: function () { go("#nosotros"); } },
      { t: "Cómo trabajamos", d: "El proceso, del brief a estar online", k: "proceso pasos tablero brief trabajo", i: I.folder, run: function () { go("#como"); } },
      { t: "Tu competencia", d: "Mapa con los negocios reales que tenés cerca", k: "competencia mapa rivales negocios cerca zona", i: I.o, run: function () { go("#competencia"); } },
      { t: "Tu propuesta", d: "Armá tu propuesta según tu presupuesto", k: "propuesta presupuesto precio costo cuanto sale cotizar plan", i: I.o, run: function () { go("#propuesta"); } },
      { t: "Servicios", d: "Webs, sistemas, automatización, IA y anuncios", k: "servicios webs sistemas apps automatizacion ia anuncios", i: I.folder, run: function () { go("#servicios"); } },
      { t: "Preguntas frecuentes", d: "El asistente responde tus dudas", k: "preguntas ayuda faq dudas asistente", i: I.chat, run: function () { go("#preguntas"); } },
      { t: "Contacto", d: "WhatsApp y mail", k: "contacto whatsapp mail email telefono escribir", i: I.chat, run: function () { go("#contacto"); } },
      { t: "Escribinos por WhatsApp", d: "Te respondemos en el día", k: "whatsapp hablar escribir contacto mensaje", i: I.chat, run: ACTS.wa },
      { t: "Cambiar fondo de pantalla", d: "Bronce, sepia, oliva, atardecer o noche", k: "fondo pantalla wallpaper color tema", i: "◐", run: nextTone },
      { t: "Ordenar ventanas", d: "Todas vuelven a su lugar", k: "ordenar ventanas acomodar reset", i: "▦", run: tidy },
      { t: "Acerca de nowmad agency", d: "Las especificaciones de la casa", k: "acerca about version info", i: I.o, run: openAbout },
      { t: "Ver logros", d: "Lo que descubriste en la página", k: "logros trofeos achievements", i: "★", run: ACTS.logros },
      { t: "nowmad explorers", d: "La rama de viajes del grupo", k: "explorers viajes turismo grupo", i: "↗", run: function () { location.href = "explorers-glass.html"; } }
    ];
    $$(".dock-app[data-open]").forEach(function (b) {
      var l = $(".dock-l", b).textContent;
      BASE.push({ t: l, d: "Demo en vivo de " + l.toLowerCase(), k: "demo app " + l.toLowerCase(), i: $(".ic", b).innerHTML.replace(/<i[^>]*>.*?<\/i>/, ""), app: b.className.replace(/.*\b(ic-\w+).*/, "$1"), run: function () { b.click(); } });
    });
    var SUGGEST = ["Tu competencia", "Tu propuesta", "Escribinos por WhatsApp", "Cambiar fondo de pantalla", "Webs"];
    function norm(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    function calc(q) {
      var s = q.replace(/\s/g, "").replace(/[x×]/gi, "*").replace(/÷/g, "/").replace(/\^/g, "**");
      if (!/^[\d.,+\-*/()%]+$/.test(s) || !/\d/.test(s) || !/[+\-*/%]/.test(s.replace(/^-/, ""))) return null;
      s = s.replace(/(\d),(\d)/g, "$1.$2").replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
      try { var v = Function('"use strict";return (' + s + ")")(); return typeof v === "number" && isFinite(v) ? v : null; } catch (e) { return null; }
    }
    function build(q) {
      var n = norm(q.trim()), out = [];
      if (!n) return SUGGEST.map(function (t) { return BASE.filter(function (x) { return x.t === t; })[0]; }).filter(Boolean);
      var v = calc(q);
      if (v != null) {
        var txt = v.toLocaleString("es-AR", { maximumFractionDigits: 6 });
        out.push({ t: "= " + txt, d: "Calculadora · Enter para copiar", i: "=", calc: true, run: function () { try { navigator.clipboard.writeText(String(v)); } catch (e) {} toast("Copiado", txt); } });
      }
      if (looksLikeUrl(q.trim())) {
        var host = hostOf(normUrl(q.trim()));
        out.push({ t: "Escanear " + host, d: "Velocidad, SEO y cómo quedaría rehecha", i: I.search, run: function () {
          var form = $("[data-hero-form]"), inp = $("[data-mock-input]");
          if (!form || !inp) return;
          scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
          inp.value = q.trim();
          if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event("submit", { cancelable: true }));
        } });
      }
      var hits = BASE.map(function (x) {
        var t = norm(x.t), s = t.indexOf(n) === 0 ? 3 : t.indexOf(n) > -1 ? 2 : norm(x.k + " " + x.d).indexOf(n) > -1 ? 1 : 0;
        if (!s) n.split(/\s+/).forEach(function (w) { if (w.length > 2 && norm(x.t + " " + x.k).indexOf(w) > -1) s = Math.max(s, 0.5); });
        return { x: x, s: s };
      }).filter(function (h) { return h.s; }).sort(function (a, b) { return b.s - a.s; }).map(function (h) { return h.x; });
      out = out.concat(hits.slice(0, 7));
      if (v == null) {
        out.push({ t: "Preguntarle al asistente: «" + q.trim() + "»", d: "Te responde en la sección de ayuda", i: I.chat, run: function () {
          var f = $("[data-bot-form]");
          go("#preguntas");
          if (f) setTimeout(function () { var x = f.querySelector("input"); x.value = q.trim(); f.dispatchEvent(new Event("submit", { cancelable: true })); }, REDUCED ? 0 : 650);
        } });
        out.push({ t: "Mandarnos «" + q.trim() + "» por WhatsApp", d: "Directo a nuestro número", i: I.chat, run: function () { openWa("¡Hola, nowmad agency! " + q.trim()); } });
      }
      return out;
    }
    function render() {
      items = build(input.value);
      sel = Math.min(sel, Math.max(0, items.length - 1));
      list.innerHTML = "";
      items.forEach(function (x, i) {
        var li = document.createElement("li");
        li.id = "spot-" + i; li.setAttribute("role", "option");
        if (x.calc) li.className = "spot-calc";
        li.innerHTML = '<span class="spot-ico ' + (x.app || "") + '" aria-hidden="true"></span><span><b></b><small></small></span><em></em>';
        var ico = $(".spot-ico", li);
        if (x.app) { ico.className = "spot-ico ic " + x.app; ico.style.color = "#fff"; }
        ico.innerHTML = x.i;
        $("b", li).textContent = x.t; $("small", li).textContent = x.d; $("em", li).textContent = i === 0 ? "↵" : "";
        li.addEventListener("pointermove", function () { if (sel !== i) { sel = i; mark(); } });
        li.addEventListener("click", function () { sel = i; pick(); });
        list.appendChild(li);
      });
      mark();
    }
    function mark() {
      $$("li", list).forEach(function (li, i) { li.classList.toggle("is-on", i === sel); li.setAttribute("aria-selected", String(i === sel)); $("em", li).textContent = i === sel ? "↵" : ""; });
      var on = $("li.is-on", list);
      if (on) { on.scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", on.id); }
    }
    function pick() { var x = items[sel]; if (!x) return; closeSpot(); x.run(); }
    function openSpot() {
      if (!spot) return;
      opener = document.activeElement;
      closeMenus();
      spot.hidden = false; input.value = ""; sel = 0; render(); input.focus();
      unlock("spot");
    }
    function closeSpot() { if (!spot || spot.hidden) return; spot.hidden = true; if (opener && opener.focus) opener.focus(); }
    if (spot) {
      input.addEventListener("input", function () { sel = 0; render(); });
      input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % items.length; mark(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; mark(); }
        else if (e.key === "Enter") { e.preventDefault(); pick(); }
        else if (e.key === "Escape") { e.preventDefault(); closeSpot(); }
      });
      spot.addEventListener("pointerdown", function (e) { if (e.target === spot) closeSpot(); });
      $$("[data-spot-open]").forEach(function (b) { b.addEventListener("click", openSpot); });
      document.addEventListener("keydown", function (e) {
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
        if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); spot.hidden ? openSpot() : closeSpot(); }
        else if (e.key === "/" && !typing && spot.hidden) { e.preventDefault(); openSpot(); }
      });
    }

    // Arrastrar sobre el fondo de la portada dibuja el recuadro de selección y marca los íconos
    var desk = $("[data-desk]"), icons = $$(".desk-icons a");
    if (desk && icons.length) {
      desk.addEventListener("pointerdown", function (e) {
        if (!DESKTOP.matches || e.button || (e.target !== desk && !e.target.classList.contains("desk-icons"))) return;
        e.preventDefault(); root.classList.add("is-marquee");
        icons.forEach(function (a) { a.classList.remove("is-sel"); });
        var sx = e.clientX, sy = e.clientY, box = document.createElement("div"), moved = false;
        box.className = "marquee"; document.body.appendChild(box);
        function move(ev) {
          var x = Math.min(sx, ev.clientX), y = Math.min(sy, ev.clientY), w = Math.abs(ev.clientX - sx), h = Math.abs(ev.clientY - sy);
          if (w + h > 6) moved = true;
          box.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px";
          icons.forEach(function (a) {
            var r = a.getBoundingClientRect();
            a.classList.toggle("is-sel", r.left < x + w && r.right > x && r.top < y + h && r.bottom > y);
          });
        }
        function up() {
          box.remove(); root.classList.remove("is-marquee");
          removeEventListener("pointermove", move); removeEventListener("pointerup", up);
          var n = icons.filter(function (a) { return a.classList.contains("is-sel"); }).length;
          if (moved && n > 1) toast(n + " ítems seleccionados", "Doble clic en uno para abrirlo.");
        }
        addEventListener("pointermove", move); addEventListener("pointerup", up);
      });
      icons.forEach(function (a) {
        a.addEventListener("click", function (e) {
          if (!DESKTOP.matches || a.classList.contains("is-sel")) return;
          e.preventDefault();
          icons.forEach(function (o) { o.classList.toggle("is-sel", o === a); });
        });
        a.addEventListener("dblclick", function () { var h = a.getAttribute("href"); if (h.charAt(0) === "#") go(h); else location.href = h; });
      });
    }
  }

  safe(initTrophies, "trophies");
    safe(initWinPlay, "winplay");
  safe(initMac, "mac");
    safe(initWords, "words");
    safe(initReveal, "reveal");
    safe(initScrub, "scrub");
    safe(initDrag, "drag");
    safe(initMock, "mock");
    safe(initChatDemo, "chat");
    safe(initPerf, "perf");
    safe(initQuickLook, "quicklook");
    safe(initDock, "dock");
    safe(initScanner, "scanner");
    safe(initCompetition, "competencia");
    safe(initBoard, "board");
    safe(initPhone, "phone");
    safe(initBot, "bot");
    safe(initParty, "party");
    safe(initWizard, "wizard");
    safe(initFaq, "faq");
    safe(initBuilder, "builder");
    safe(initClock, "clock");
    safe(initYear, "year");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
