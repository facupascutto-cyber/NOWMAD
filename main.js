(function () {
  "use strict";

  var REST = 0; // la aguja descansa en su posición del logo: noreste

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[nowmad] " + name, err); }
  }

  // Reloj de Buenos Aires: el "ahora" del logo
  function initClock() {
    var el = document.querySelector("[data-clock]");
    if (!el || !window.Intl) return;
    var fmt = new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit", minute: "2-digit", hour12: false,
      timeZone: "America/Argentina/Buenos_Aires"
    });
    function tick() { el.textContent = fmt.format(new Date()) + " BUE"; }
    tick();
    setInterval(tick, 10000);
  }

  // La aguja de la "o": gira al cargar y después sigue al cursor
  function initNeedle() {
    var svg = document.querySelector("[data-compass]");
    var needle = document.querySelector("[data-needle]");
    if (!svg || !needle) return;

    var angle = -300;
    var target = REST;
    var running = false;

    function paint() { needle.setAttribute("transform", "rotate(" + angle.toFixed(2) + " 44 56)"); }

    function step() {
      var delta = target - angle;
      if (Math.abs(delta) < 0.05) {
        angle = target;
        paint();
        running = false;
        return;
      }
      angle += delta * 0.09;
      paint();
      requestAnimationFrame(step);
    }

    function go() {
      if (running) return;
      running = true;
      requestAnimationFrame(step);
    }

    paint();
    go();

    if (matchMedia("(hover: none)").matches) return;

    var hero = document.querySelector(".hero, .scene-stick");
    hero.addEventListener("mousemove", function (e) {
      var r = svg.getBoundingClientRect();
      var cx = r.left + r.width * (38 / 76);
      var cy = r.top + r.height * (38 / 76);
      var deg = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 45;
      // camino más corto, sin dar la vuelta entera
      var d = ((deg - angle) % 360 + 540) % 360 - 180;
      target = angle + d;
      go();
    });
    hero.addEventListener("mouseleave", function () {
      var d = ((REST - angle) % 360 + 540) % 360 - 180;
      target = angle + d;
      go();
    });
  }

  // Los anillos se corren apenas con el scroll
  function initRings() {
    var rings = document.querySelector("[data-rings]");
    if (!rings || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        rings.style.transform = "translate3d(0," + (y * 0.08).toFixed(1) + "px,0)";
        ticking = false;
      });
    }, { passive: true });
  }

  function initNav() {
    var nav = document.querySelector("[data-nav]");
    var hero = document.querySelector(".hero, .scene");
    if (!nav || !hero) return;
    function update() {
      nav.classList.toggle("is-solid", window.scrollY > hero.offsetHeight - 72);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    function show(el) { el.classList.add("is-visible"); }
    if (!("IntersectionObserver" in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(show); }, 6000);
  }

  // Explorers: el recorrido de "Cómo funciona" avanza con el scroll
  function initRoute() {
    var route = document.querySelector("[data-route]");
    if (!route) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = route.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (vh * 0.5 + r.height);
      route.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
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

  // Explorers: cada punto cardinal gira la aguja y muestra sus destinos
  function initRumbos() {
    var root = document.querySelector("[data-rumbos]");
    if (!root) return;
    var needle = root.querySelector("[data-rumbo-needle]");
    var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-rumbo]"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-rumbo-panel]"));
    var ANGLES = { n: 0, e: 90, s: 180, o: 270 };
    var angle = ANGLES.e;

    function select(key) {
      // camino más corto, sin dar la vuelta entera
      angle += ((ANGLES[key] - angle) % 360 + 540) % 360 - 180;
      needle.style.transform = "rotate(" + angle + "deg)";
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-rumbo") === key));
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-rumbo-panel") === key);
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { select(b.getAttribute("data-rumbo")); });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-go-rumbo]"), function (link) {
      link.addEventListener("click", function () { select(link.getAttribute("data-go-rumbo")); });
    });
    select("e");
    root.classList.add("is-ready");
  }

  // Explorers: se entra al viaje por la "o" y la aguja recorre los destinos
  function initScene() {
    var scene = document.querySelector("[data-scene]");
    if (!scene) return;
    var q = function (s) { return scene.querySelector(s); };
    var stick = q("[data-scene-stick]");
    var logo = q("[data-scene-logo]");
    var o = q("[data-scene-o]");
    var dial = q("[data-scene-dial]");
    var needle = q("[data-scene-needle]");
    var photos = q("[data-scene-photos]");
    var copy = q("[data-scene-copy]");
    var shade = q("[data-scene-shade]");
    var hud = q(".scene-hud");
    var hudNeedle = q("[data-scene-hud-needle]");
    var layers = Array.prototype.slice.call(scene.querySelectorAll("[data-scene-photo]"));
    var stops = Array.prototype.slice.call(scene.querySelectorAll("[data-scene-stop]"));
    var ANGLES = [90, 270, 180]; // este, oeste, sur
    var HOLE = 24.5;             // radio interior del anillo, en unidades del logo
    var ZOOM_START = 0.03, ZOOM_END = 0.4;
    var cx = 0, cy = 0, midX = 0, midY = 0, k0 = 1, kEnd = 1, current = -1, ticking = false;

    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

    function measure() {
      logo.style.transform = "none";
      var r = o.getBoundingClientRect();
      var s = stick.getBoundingClientRect();
      cx = r.left - s.left + r.width / 2;
      cy = r.top - s.top + r.height / 2;
      k0 = r.width / 76;
      logo.style.transformOrigin = (r.left + r.width / 2 - logo.getBoundingClientRect().left) + "px " +
        (r.top + r.height / 2 - logo.getBoundingClientRect().top) + "px";
      midX = s.width / 2;
      midY = s.height / 2;
      kEnd = Math.hypot(midX, midY) / HOLE * 1.08;
    }

    function update() {
      ticking = false;
      var travel = scene.offsetHeight - stick.offsetHeight;
      var p = travel > 0 ? clamp(-scene.getBoundingClientRect().top / travel) : 0;
      var z = clamp((p - ZOOM_START) / (ZOOM_END - ZOOM_START));
      var k = k0 * Math.pow(kEnd / k0, Math.pow(z, 1.4));
      var s = k / k0;
      // la brújula se va al centro de la pantalla mientras crece
      var drift = clamp(z / 0.6);
      var x = cx + (midX - cx) * drift;
      var y = cy + (midY - cy) * drift;

      logo.style.transform = "translate(" + (x - cx).toFixed(1) + "px," + (y - cy).toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
      logo.style.opacity = (1 - clamp((s - 1) / 2.5)).toFixed(3);
      copy.style.opacity = (1 - clamp(p / 0.05)).toFixed(3);
      copy.style.visibility = p > 0.05 ? "hidden" : "visible";
      dial.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + k.toFixed(3) + ") translate(-44 -56)");
      needle.style.opacity = (1 - clamp((z - 0.3) / 0.16)).toFixed(3);
      dial.style.display = z >= 1 ? "none" : "";
      photos.style.clipPath = z >= 1 ? "none" : "circle(" + (HOLE * k * clamp(z / 0.03) + 1).toFixed(1) + "px at " + x.toFixed(1) + "px " + y.toFixed(1) + "px)";
      photos.style.visibility = z > 0 ? "visible" : "hidden";

      var t = clamp((p - ZOOM_END) / (1 - ZOOM_END));
      layers[1].style.opacity = clamp((t - 0.3) / 0.07).toFixed(3);
      layers[2].style.opacity = clamp((t - 0.64) / 0.07).toFixed(3);
      shade.style.opacity = clamp((z - 0.7) / 0.3).toFixed(3);

      var show = z >= 0.92;
      var i = !show ? -1 : t < 0.33 ? 0 : t < 0.67 ? 1 : 2;
      hud.classList.toggle("is-on", show);
      if (i !== current) {
        current = i;
        stops.forEach(function (el, n) { el.classList.toggle("is-active", n === i); });
        if (i >= 0) hudNeedle.style.transform = "rotate(" + ANGLES[i] + "deg)";
      }
    }

    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    scene.classList.add("is-ready");
    measure();
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", function () { measure(); update(); });
    window.addEventListener("load", function () { measure(); update(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
  }

  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function boot() {
    safe(initClock, "clock");
    safe(initNeedle, "needle");
    safe(initRings, "rings");
    safe(initNav, "nav");
    safe(initReveal, "reveal");
    safe(initScene, "scene");
    safe(initRoute, "route");
    safe(initRumbos, "rumbos");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
