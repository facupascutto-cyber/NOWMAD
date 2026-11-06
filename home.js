/* nowmad group · portada nueva: brújula 3D, servicios en órbita, texto que se ilumina, el método y el cursor brújula */
(function () {
  "use strict";

  var COARSE = matchMedia("(hover: none)").matches;
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[nowmad] " + name, err); }
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // diferencia de ángulos por el camino corto (-180..180)
  function angDiff(a, b) { return ((b - a) % 360 + 540) % 360 - 180; }

  // ---------- Brújula 3D + órbita ----------
  function initCompass() {
    var stage = document.querySelector("[data-stage]");
    var cmp = document.querySelector("[data-cmp]");
    if (!stage || !cmp) return;
    var wrap = cmp.parentNode;
    var needle = cmp.querySelector("[data-needle] svg");
    var glass = cmp.querySelector("[data-glass]");
    var shadow = wrap.querySelector("[data-shadow]");
    var back = stage.querySelector("[data-orbit-back]");
    var front = stage.querySelector("[data-orbit-front]");
    var hero = document.querySelector("[data-hero]");

    // canto de la brújula: discos apilados que le dan espesor
    var edge = cmp.querySelector("[data-edge]");
    for (var k = 1; k <= 14; k++) {
      var d = document.createElement("i");
      d.style.setProperty("--z", (-k * 1.6).toFixed(1) + "px");
      edge.appendChild(d);
    }

    var WORDS = [
      ["Webs", "#EBCB94"], ["Sistemas a medida", "#E0A46C"], ["Marketing", "#F4A2BE"],
      ["Automatizaciones", "#9AD8C8"], ["IA", "#C9B4FF"], ["Google Ads", "#F5BE4E"]
    ];
    var items = WORDS.map(function (w) {
      var el = document.createElement("span");
      el.className = "ow";
      el.style.setProperty("--acc", w[1]);
      el.innerHTML = "<i></i>" + w[0];
      back.appendChild(el);
      return el;
    });

    // estado: inclinación (rx, ry), aguja con resorte, giro de la órbita
    var tRx = 18, tRy = -12, rx = 18, ry = -12;
    var target = 0, ang = 0, vel = 0;
    var spin = 0, mouseIn = false, last = performance.now(), visible = true;
    var cx = 0, cy = 0, w = 0, h = 0, size = 0, ox = 0, oy = 0;

    function measure() {
      var s = stage.getBoundingClientRect(), c = wrap.getBoundingClientRect();
      size = c.width;
      ox = c.left - s.left + c.width / 2;
      oy = c.top - s.top + c.height / 2;
      cx = c.left + c.width / 2;
      cy = c.top + c.height / 2;
      w = window.innerWidth; h = window.innerHeight;
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", function () { var c = wrap.getBoundingClientRect(); cx = c.left + c.width / 2; cy = c.top + c.height / 2; }, { passive: true });

    function aim(x, y) {
      mouseIn = true;
      tRy = clamp((x - cx) / (w / 2), -1, 1) * 26;
      tRx = 14 - clamp((y - cy) / (h / 2), -1, 1) * 20;
      // la aguja (punta roja) apunta hacia el cursor
      target = ang + angDiff(ang, Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90);
    }
    if (!COARSE) {
      hero.addEventListener("mousemove", function (e) { aim(e.clientX, e.clientY); });
      hero.addEventListener("mouseleave", function () { mouseIn = false; });
    } else {
      hero.addEventListener("touchmove", function (e) { var t = e.touches[0]; if (t) aim(t.clientX, t.clientY); }, { passive: true });
      hero.addEventListener("touchend", function () { mouseIn = false; });
    }

    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(frame); } }).observe(hero);

    function frame(now) {
      var dt = Math.min(48, now - last) / 16.67;
      last = now;
      var t = now / 1000;

      if (!mouseIn) {
        // sin mouse: se balancea solita y la aguja busca el norte con un temblor
        tRx = 16 + Math.sin(t * .6) * 8;
        tRy = Math.sin(t * .4) * 16;
        target = ang + angDiff(ang, Math.sin(t * .7) * 14 + Math.sin(t * 1.9) * 4);
      }
      rx += (tRx - rx) * .07 * dt;
      ry += (tRy - ry) * .07 * dt;
      // resorte: la aguja se pasa un poco y vuelve, como una brújula de verdad
      vel += (target - ang) * .045 * dt;
      vel *= Math.pow(.86, dt);
      ang += vel * dt;

      cmp.style.setProperty("--rx", rx.toFixed(2) + "deg");
      cmp.style.setProperty("--ry", ry.toFixed(2) + "deg");
      needle.style.setProperty("--needle", ang.toFixed(2) + "deg");
      glass.style.setProperty("--gx", (30 - ry * 1.2).toFixed(1) + "%");
      glass.style.setProperty("--gy", (25 + rx * .8).toFixed(1) + "%");
      shadow.style.setProperty("--sx", (-ry * 1.6).toFixed(1) + "px");
      shadow.style.setProperty("--ss", (1 - Math.abs(ry) / 120).toFixed(3));

      // órbita: una elipse inclinada alrededor de la brújula
      spin += .0032 * dt;
      var rX = size * (w < 860 ? .66 : .82), rY = size * .2;
      for (var i = 0; i < items.length; i++) {
        var a = spin + i / items.length * Math.PI * 2;
        var z = Math.sin(a);              // -1 atrás, 1 adelante
        var x = Math.cos(a) * rX;
        var y = z * rY + size * .02 - ry * .4;
        var sc = .78 + (z + 1) * .16;
        var el = items[i];
        var isFront = z > 0;
        var parent = isFront ? front : back;
        if (el.parentNode !== parent) parent.appendChild(el);
        el.style.transform = "translate(" + (ox - (stage.clientWidth / 2) + x).toFixed(1) + "px," + (oy - (stage.clientHeight / 2) + y).toFixed(1) + "px) translate(-50%,-50%) scale(" + sc.toFixed(3) + ")";
        el.style.left = "50%"; el.style.top = "50%";
        el.style.opacity = (.35 + (z + 1) * .325).toFixed(2);
      }
      if (visible && !REDUCED) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ---------- Nosotros: se ilumina palabra por palabra ----------
  function initScrub() {
    var sec = document.querySelector("[data-scrub]");
    var text = sec && sec.querySelector("[data-scrub-text]");
    if (!text) return;
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) return walk(child);
        if (child.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span");
          s.className = "sw";
          s.textContent = part;
          frag.appendChild(s);
          words.push(s);
        });
        child.parentNode.replaceChild(frag, child);
      });
    })(text);
    if (REDUCED) { words.forEach(function (s) { s.classList.add("is-on"); }); return; }
    var ticking = false;
    function update() {
      ticking = false;
      var r = sec.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = clamp((-r.top + window.innerHeight * .35) / (total + window.innerHeight * .2), 0, 1);
      var n = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("is-on", i < n);
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---------- El método: la aguja apunta al paso que estás leyendo ----------
  function initMethod() {
    var steps = document.querySelectorAll("[data-step]");
    var needle = document.querySelector("[data-mini-needle]");
    var label = document.querySelector("[data-mini-label]");
    var pts = document.querySelectorAll("[data-pt]");
    if (!steps.length || !needle) return;
    var NAMES = ["N · Escuchamos", "E · Proponemos", "S · Construimos", "O · Medimos"];
    var current = -1, angle = 0;
    function set(i) {
      if (i === current) return;
      angle += angDiff(angle, i * 90);
      current = i;
      needle.style.setProperty("--needle", angle + "deg");
      if (label) label.textContent = NAMES[i];
      Array.prototype.forEach.call(steps, function (s, j) { s.classList.toggle("is-on", j === i); });
      Array.prototype.forEach.call(pts, function (p, j) { p.classList.toggle("is-on", j === i); });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) set(+e.target.getAttribute("data-step")); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    Array.prototype.forEach.call(steps, function (s) { io.observe(s); });
    set(0);
  }

  // ---------- Tarjetas que se inclinan ----------
  function initTilt() {
    if (COARSE || REDUCED) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-tilt]"), function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ty", ((px - .5) * 8).toFixed(2) + "deg");
        card.style.setProperty("--tx", ((.5 - py) * 8).toFixed(2) + "deg");
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--tx", "0deg");
        card.style.setProperty("--ty", "0deg");
      });
    });
  }

  // ---------- Aparición, barra de avance, WhatsApp, reloj ----------
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { Array.prototype.forEach.call(items, function (el) { el.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  function initScroll() {
    var bar = document.querySelector(".progress");
    var cta = document.querySelector("[data-chat]");
    var footer = document.querySelector(".footer-cta");
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.setProperty("--scroll", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      if (cta) {
        var past = window.scrollY > window.innerHeight * .6;
        var fr = footer && footer.getBoundingClientRect();
        var atFooter = fr && fr.top < window.innerHeight * .8 && fr.bottom > 0;
        cta.classList.toggle("is-on", past && !atFooter);
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function initClock() {
    var el = document.querySelector("[data-clock]");
    if (!el || !window.Intl) return;
    var fmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
    function set() { el.textContent = "Ahora " + fmt.format(new Date()) + " en Buenos Aires"; }
    set();
    setInterval(set, 30000);
  }

  // ---------- Cursor brújula (el de siempre) ----------
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
        angle += angDiff(angle, Math.atan2(dy, dx) * 180 / Math.PI + 90);
        el.style.setProperty("--angle", angle.toFixed(1) + "deg");
      }
      x = e.clientX; y = e.clientY;
      el.classList.add("is-on");
      var t = e.target.closest ? e.target : null;
      el.classList.toggle("is-link", !!(t && t.closest("a, button")));
      el.classList.toggle("is-ex", !!(t && t.closest(".card-ex, .ex-chip, .nav-ex")));
      if (!raf) raf = requestAnimationFrame(loop);
    });
    document.addEventListener("mouseleave", function () { el.classList.remove("is-on"); });
  }

  function initYear() {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  safe(initCompass, "compass");
  safe(initScrub, "scrub");
  safe(initMethod, "method");
  safe(initTilt, "tilt");
  safe(initReveal, "reveal");
  safe(initScroll, "scroll");
  safe(initClock, "clock");
  safe(initCursor, "cursor");
  safe(initYear, "year");
})();
