(function () {
  "use strict";

  var COARSE = matchMedia("(hover: none)").matches;
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Para usar el número del grupo, completá WA_NUMBER (solo dígitos, con 549 adelante). Vacío abre WhatsApp para elegir el chat.
  var WA_NUMBER = "";
  // Número de nowmad agency (el mismo que usa agency.html): las consultas de la rama agency van directo ahí.
  var WA_AGENCY = "5493795054206";

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[nowmad] " + name, err); }
  }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  // Parte los títulos en palabras para que suban una detrás de otra
  function initWords() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-words]"), function (title) {
      var n = 0;
      function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 1) { if (child.tagName !== "BR") walk(child); return; }
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
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
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

  // Portada: la mitad que mirás se agranda y la aguja del logo apunta hacia el mouse
  function initSplit() {
    var hero = document.querySelector("[data-split]");
    if (!hero) return;
    var split = hero.querySelector(".split");
    var needle = hero.querySelector("[data-needle]");
    var logo = hero.querySelector(".hero-logo .logo-o");
    var sides = hero.querySelectorAll("[data-side]");
    var video = hero.querySelector(".side-video");
    var angle = -45; // la aguja dibujada apunta al noreste; -45 la deja mirando al norte

    function pick(which) {
      hero.setAttribute("data-split", which || "");
      split.classList.toggle("is-ex", which === "ex");
      split.classList.toggle("is-ag", which === "ag");
    }
    function point(target) {
      // sin vueltas de más: elige el giro más corto
      var d = ((target - angle) % 360 + 540) % 360 - 180;
      angle += d;
      if (needle) needle.style.setProperty("--needle", angle.toFixed(1) + "deg");
    }

    if (video) {
      video.playbackRate = 2;
      video.addEventListener("loadedmetadata", function () { video.playbackRate = 2; });
      if (REDUCED) video.pause();
    }

    Array.prototype.forEach.call(sides, function (s) {
      var which = s.getAttribute("data-side");
      s.addEventListener("mouseenter", function () { pick(which); });
      s.addEventListener("focus", function () { pick(which); point(which === "ex" ? -135 : 45); });
    });
    hero.addEventListener("mouseleave", function () { pick(""); point(-45); });

    if (!COARSE) {
      var drift = hero.querySelectorAll("[data-drift]");
      var grid = hero.querySelector(".ag-grid");
      hero.addEventListener("mousemove", function (e) {
        if (logo) {
          var r = logo.getBoundingClientRect();
          var a = Math.atan2(e.clientY - (r.top + r.height * 0.55), e.clientX - (r.left + r.width * 0.5)) * 180 / Math.PI;
          point(a + 45);
        }
        var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        Array.prototype.forEach.call(drift, function (el) {
          var k = parseFloat(el.getAttribute("data-drift")) || 1;
          el.style.setProperty("--rx", (nx * 30 * k).toFixed(1) + "px");
          el.style.setProperty("--ry", (ny * 30 * k).toFixed(1) + "px");
        });
        if (grid) {
          grid.style.setProperty("--gx", (nx * -14).toFixed(1) + "px");
          grid.style.setProperty("--gy", (ny * -14).toFixed(1) + "px");
        }
      });
    } else {
      // En el celular la aguja va y viene sola entre las dos ramas
      var turn = 0;
      setInterval(function () {
        turn = 1 - turn;
        pick(turn ? "ex" : "ag");
        point(turn ? -135 : 45);
      }, 2600);
    }

    // El video solo corre mientras se ve la portada
    if (video && "IntersectionObserver" in window && !REDUCED) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
          else video.pause();
        });
      }).observe(video);
    }
  }

  // La línea de código de agency se escribe y se borra sola
  function initType() {
    var el = document.querySelector("[data-type]");
    if (!el || REDUCED) return;
    var lines = ["hacemos webs que se usan", "diseño + código + marketing", "tu marca, online en semanas", "npm run lanzamiento"];
    var li = 0, ci = lines[0].length, del = true;
    function tick() {
      if (del) {
        ci--;
        if (ci <= 0) { del = false; li = (li + 1) % lines.length; }
      } else {
        ci++;
        if (ci >= lines[li].length) { del = true; el.textContent = lines[li]; return setTimeout(tick, 2200); }
      }
      el.textContent = lines[li].slice(0, Math.max(0, ci));
      setTimeout(tick, del ? 32 : 70);
    }
    setTimeout(tick, 2600);
  }

  // Hora de Buenos Aires en la portada
  function initClock() {
    var el = document.querySelector("[data-clock]");
    if (!el) return;
    var fmt;
    try { fmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }); } catch (e) { return; }
    function set() { el.textContent = fmt.format(new Date()) + " en Buenos Aires"; }
    set();
    setInterval(set, 15000);
  }

  // Scroll: barra de avance, título que se enciende y anillo del cierre que gira
  function initScroll() {
    var bar = document.querySelector(".progress");
    var scrub = document.querySelector("[data-scrub]");
    var about = document.querySelector(".about");
    var ring = document.querySelector("[data-parallax-ring]");
    var center = document.querySelector("[data-hero-center]");
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var max = document.documentElement.scrollHeight - vh;
      if (bar) bar.style.setProperty("--scroll", max > 0 ? clamp(window.scrollY / max).toFixed(4) : "0");
      if (center && !COARSE) {
        var s = clamp(window.scrollY / vh);
        center.style.opacity = (1 - s * 1.6).toFixed(3);
      }
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
      if (ring) {
        var q = ring.parentNode.getBoundingClientRect();
        if (q.top < vh && q.bottom > 0) ring.style.setProperty("--ring", ((vh - q.top) * 0.08).toFixed(1) + "deg");
      }
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
  }

  // Las tarjetas de las ramas se inclinan apenas hacia el cursor
  function initTilt() {
    if (COARSE || REDUCED) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-tilt]"), function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ty", (x * 5).toFixed(2) + "deg");
        card.style.setProperty("--tx", (y * -5).toFixed(2) + "deg");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--ty", "0deg");
        card.style.setProperty("--tx", "0deg");
      });
    });
  }

  // Cursor brújula: la aguja apunta hacia donde movés el mouse
  function initCursor() {
    if (COARSE) return;
    var el = document.querySelector(".compass-cursor");
    if (!el) return;
    var x = -100, y = -100, cx = -100, cy = -100, angle = 0, raf = 0;
    function loop() {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    }
    document.addEventListener("mousemove", function (e) {
      var dx = e.clientX - x, dy = e.clientY - y;
      if (dx * dx + dy * dy > 16) {
        var target = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        var d = ((target - angle) % 360 + 540) % 360 - 180;
        angle += d;
        el.style.setProperty("--angle", angle.toFixed(1) + "deg");
      }
      x = e.clientX; y = e.clientY;
      el.classList.add("is-on");
      var t = e.target.closest ? e.target : null;
      el.classList.toggle("is-link", !!(t && t.closest("a, button")));
      el.classList.toggle("is-ex", !!(t && t.closest(".side-ex, .branch-ex, .pill-ex, .nav-ex")));
      if (!raf) raf = requestAnimationFrame(loop);
    });
    document.addEventListener("mouseleave", function () { el.classList.remove("is-on"); });
  }

  // WhatsApp: cambia de color, frase y mensaje según dónde estés
  function initWhatsApp() {
    var btn = document.querySelector("[data-chat]");
    if (!btn) return;
    var text = btn.querySelector("[data-wa-text]");
    var ZONES = {
      base: { t: "Escribinos", m: "Hola nowmad! Quiero hacer una consulta.", c: "" },
      ex: { t: "Quiero viajar", m: "Hola nowmad explorers! Quiero armar un viaje.", c: "is-ex" },
      ag: { t: "Necesito una web", m: "Hola nowmad agency! Necesito una web.", c: "", n: WA_AGENCY },
      light: { t: "Escribinos", m: "Hola nowmad! Quiero hacer una consulta.", c: "is-light" },
      blue: { t: "Hablemos ahora", m: "Hola nowmad! Quiero hacer una consulta.", c: "is-blue" }
    };
    var current = "";
    function apply(zone) {
      if (zone === current) return;
      current = zone;
      var z = ZONES[zone];
      btn.classList.remove("is-ex", "is-light", "is-blue");
      if (z.c) btn.classList.add(z.c);
      btn.setAttribute("data-go", "https://wa.me/" + (z.n || WA_NUMBER) + "?text=" + encodeURIComponent(z.m));
      if (text && text.textContent !== z.t) {
        text.textContent = z.t;
        text.classList.remove("is-new");
        void text.offsetWidth;
        text.classList.add("is-new");
      }
    }
    var hero = document.querySelector("[data-split]");
    var values = document.querySelector(".values");
    var footer = document.querySelector(".footer-cta");
    var exCard = document.querySelector(".branch-ex"), agCard = document.querySelector(".branch-ag");
    function under(el, y) { if (!el) return false; var r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }
    function update() {
      var y = window.innerHeight - 40;
      // En la portada ya están los botones de cada rama: el de WhatsApp aparece al bajar
      btn.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.5);
      if (under(footer, y)) return apply("blue");
      if (under(values, y)) return apply("light");
      var heroRect = hero && hero.getBoundingClientRect();
      if (heroRect && heroRect.bottom > window.innerHeight * 0.5) {
        var s = hero.getAttribute("data-split");
        return apply(s === "ex" ? "ex" : s === "ag" ? "ag" : "base");
      }
      var mid = window.innerHeight / 2;
      if (under(exCard, mid) && !under(agCard, mid)) return apply("ex");
      if (under(agCard, mid) && !under(exCard, mid)) return apply("ag");
      apply("base");
    }
    var ticking = false;
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    if (hero) new MutationObserver(request).observe(hero, { attributes: true, attributeFilter: ["data-split"] });
    update();
  }

  function initYear() {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  safe(initWords, "words");
  safe(initReveal, "reveal");
  safe(initSplit, "split");
  safe(initType, "type");
  safe(initClock, "clock");
  safe(initScroll, "scroll");
  safe(initTilt, "tilt");
  safe(initCursor, "cursor");
  safe(initWhatsApp, "whatsapp");
  safe(initYear, "year");
})();
