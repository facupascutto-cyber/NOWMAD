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

    var hero = document.querySelector(".hero");
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
    var hero = document.querySelector(".hero");
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

  // Explorers: las postales de la portada se mueven apenas con el cursor
  function initFan() {
    var fan = document.querySelector("[data-fan]");
    var hero = document.querySelector(".hero");
    if (!fan || !hero || matchMedia("(hover: none)").matches) return;
    hero.addEventListener("mousemove", function (e) {
      fan.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
      fan.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
    });
    hero.addEventListener("mouseleave", function () {
      fan.style.setProperty("--mx", "0");
      fan.style.setProperty("--my", "0");
    });
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
    safe(initFan, "fan");
    safe(initRoute, "route");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
