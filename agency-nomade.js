/* Fondo de agency: el nómade (clips de Kling con luz dorada, en assets/video/nomade/).
   - Portada: <video> en loop (loop.mp4, corte sin salto).
   - El resto de la página es un solo recorrido: cada clip cubre las secciones marcadas con data-nm-scene="giro|aleja|final"
     (pueden ser varias seguidas, también las que tienen ventanas). Mientras ese tramo cruza la pantalla, el scroll
     mueve su clip cuadro a cuadro, así el video sigue avanzando detrás de las ventanas sin cortes.
   - Los clips NO son videos: son secuencias de cuadros .webp dibujadas en un <canvas>. Buscar un cuadro de video con
     currentTime obliga a decodificar desde el último keyframe y se traba; dibujar una imagen ya decodificada no.
   - Los cuadros se bajan después del evento load: primero salteados (1 de cada 8) y después el resto. Si falta un
     cuadro se dibuja el más cercano.
   - Con prefers-reduced-motion queda la portada quieta. */
(function () {
  var root = document.querySelector("[data-nm]");
  if (!root) return;
  var hero = root.querySelector("[data-nm-hero]");
  var cv = root.querySelector("[data-nm-seq]");
  var fog = root.querySelector("[data-nm-fog]");
  var dark = root.querySelector("[data-nm-dark]");
  var desk = document.querySelector("[data-desk]");
  var ctx = cv && cv.getContext("2d");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wideMq = matchMedia("(min-width: 900px)");
  var BASE = "assets/video/nomade/seq/", V = "?v=2"; // V: subir cuando se regeneran los cuadros

  function play() { var p = hero.play && hero.play(); if (p && p.catch) p.catch(function () {}); }
  if (reduce || !ctx) { try { hero.pause(); } catch (e) {} return; }
  play();

  // fx/fy: dónde está la figura en el cuadro. z0 → z1: leve acercamiento mientras dura la escena.
  // end: hasta qué parte del clip se usa (el giro termina con varios segundos quieto mirando a cámara).
  var CLIPS = [
    { name: "giro", fx: 0.42, fy: 0.45, z0: 1.12, z1: 1, end: 0.8 },
    { name: "aleja", fx: 0.47, fy: 0.5, z0: 1.04, z1: 1 },
    { name: "final", fx: 0.48, fy: 0.5, z0: 1.06, z1: 1 }
  ];
  var IW = 1280, IH = 720;

  function seg(p, a, b) { var t = (p - a) / (b - a); return t < 0 ? 0 : t > 1 ? 1 : t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function pad(i) { return i < 10 ? "00" + i : i < 100 ? "0" + i : "" + i; }

  // ---------- Dónde está cada escena en la página ----------
  var deskTop = 0, deskH = 0;
  function measure() {
    var y = scrollY;
    if (desk) { var d = desk.getBoundingClientRect(); deskTop = d.top + y; deskH = d.height; }
    CLIPS.forEach(function (c) {
      var top = Infinity, bottom = -Infinity;
      document.querySelectorAll('[data-nm-scene="' + c.name + '"]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.height) { top = Math.min(top, r.top + y); bottom = Math.max(bottom, r.bottom + y); }
      });
      c.top = top; c.h = bottom - top;
    });
  }

  // ---------- Carga de cuadros ----------
  var started = false;
  function load() {
    if (started) return;
    started = true;
    fetch(BASE + "seq.json" + V).then(function (r) { return r.json(); }).then(function (meta) {
      IW = meta.w; IH = meta.h;
      var queue = [];
      CLIPS.forEach(function (c) { c.n = meta.clips[c.name] || 0; c.img = new Array(c.n); c.ok = new Array(c.n); });
      // Pasadas cada vez más finas, en el orden en que se ven
      [8, 4, 2, 1].forEach(function (step) {
        CLIPS.forEach(function (c) {
          for (var i = 0; i < c.n; i += step) if (!c.img[i]) { c.img[i] = true; queue.push([c, i]); }
        });
      });
      var active = 0, LIMIT = 6;
      function next() {
        while (active < LIMIT && queue.length) {
          var job = queue.shift(), c = job[0], i = job[1], img = new Image();
          active++;
          img.decoding = "async";
          img.src = BASE + c.name + "/" + pad(i) + ".webp" + V;
          (function (c, i, img) {
            var ready = false;
            var use = function () {
              if (ready) return;
              ready = true; c.img[i] = img; c.ok[i] = true; dirty = true; kick();
            };
            // Apenas baja, libera el lugar en la cola. Se decodifica antes de usarla para no trabar el
            // dibujo; decode() no resuelve en algunos navegadores embebidos, así que tiene un límite.
            img.onload = function () {
              active--; next();
              var t = setTimeout(use, 400);
              if (img.decode) img.decode().then(function () { clearTimeout(t); use(); }, function () { clearTimeout(t); use(); });
              else { clearTimeout(t); use(); }
            };
            img.onerror = function () { active--; next(); };
          })(c, i, img);
        }
      }
      next();
    }).catch(function () {});
  }
  if (document.readyState === "complete") setTimeout(load, 300);
  else addEventListener("load", function () { setTimeout(load, 300); measure(); kick(); });

  // ---------- Dibujo ----------
  var cw = 0, ch = 0, dirty = true, drawn = "";
  function size() {
    var dpr = Math.min(devicePixelRatio || 1, 1.5);
    var w = Math.round(Math.min(innerWidth * dpr, 1920)), h = Math.round(w * innerHeight / innerWidth);
    if (w !== cw || h !== ch) { cv.width = cw = w; cv.height = ch = h; dirty = true; }
  }
  function nearest(c, i) {
    if (!c.ok) return -1;
    for (var d = 0; d < c.n; d++) {
      if (i - d >= 0 && c.ok[i - d]) return i - d;
      if (i + d < c.n && c.ok[i + d]) return i + d;
    }
    return -1;
  }
  function draw(c, t) {
    if (!c.n) return;
    var want = Math.round(t * (c.end || 1) * (c.n - 1)), i = nearest(c, want);
    if (i < 0) return;
    var z = c.z0 + (c.z1 - c.z0) * ease(t);
    var key = c.name + i + "|" + z.toFixed(3) + "|" + cw + "x" + ch;
    if (!dirty && key === drawn) return;
    drawn = key; dirty = false;
    // "cover" con la figura como punto de foco, sin dejar bordes vacíos
    var s = Math.max(cw / IW, ch / IH) * z, w = IW * s, h = IH * s;
    var x = Math.min(0, Math.max(cw - w, cw * c.fx - w * c.fx));
    var y = Math.min(0, Math.max(ch - h, ch * c.fy - h * c.fy));
    ctx.drawImage(c.img[i], x, y, w, h);
  }

  var heroOn = true;
  function render(y) {
    var vh = innerHeight;
    // Portada: en pantallas anchas el caminante va a la izquierda, debajo del titular
    var hp = deskH ? seg(y - deskTop, 0, deskH) : 0;
    var wide = wideMq.matches, s0 = wide ? 1.4 : 1;
    var F = [0.45, 0.56], Q = wide ? [0.24, 0.64] : F;
    var s = s0 * (1 + 0.22 * ease(seg(hp, 0.05, 0.9)));
    hero.style.transform = "translate(" + ((Q[0] - s * F[0]) * 100) + "%," + ((Q[1] - s * F[1]) * 100) + "%) scale(" + s + ")";
    var mix = seg(hp, 0.3, 0.85);
    hero.style.opacity = 1 - mix;
    cv.style.opacity = mix;
    if (mix >= 1 && heroOn) { heroOn = false; try { hero.pause(); } catch (e) {} }
    else if (mix < 1 && !heroOn) { heroOn = true; play(); }
    if (mix > 0 && !started) load();

    // La escena que más ocupa la pantalla es la que se dibuja; entre escenas queda el último cuadro (lo tapa la hoja)
    var best = null, bestVis = 0, bestT = 0;
    CLIPS.forEach(function (c) {
      if (!(c.h > 0)) return;
      var top = c.top - y, vis = Math.min(vh, top + c.h) - Math.max(0, top);
      if (vis > bestVis) { bestVis = vis; best = c; bestT = seg(vh - top, 0, c.h + vh); }
    });
    if (!best && y < deskTop + deskH) { best = CLIPS[0]; bestT = 0; }
    var f = 0, d = 0;
    if (best) {
      draw(best, bestT);
      if (best.name === "aleja") f = 0.85 * (1 - seg(bestT, 0.03, 0.13));
      if (best.name === "final") d = 0.35 * seg(bestT, 0.75, 1);
    }
    fog.style.opacity = f; fog.style.visibility = f > 0 ? "visible" : "hidden";
    dark.style.opacity = d;
  }

  // El scroll se sigue con un poco de inercia; solo se trabaja mientras algo cambia
  var target = scrollY, cur = target, running = false;
  function tick() {
    cur += (target - cur) * 0.18;
    if (Math.abs(target - cur) < 0.5) cur = target;
    render(cur);
    if (cur !== target) requestAnimationFrame(tick); else running = false;
  }
  function kick() { target = scrollY; if (!running) { running = true; requestAnimationFrame(tick); } }
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", function () { size(); measure(); dirty = true; kick(); });
  if (wideMq.addEventListener) wideMq.addEventListener("change", kick);
  // Las secciones cambian de alto (mapa, resultados, fuentes): se vuelve a medir
  if (window.ResizeObserver) new ResizeObserver(function () { measure(); kick(); }).observe(document.body);
  size();
  measure();
  render(cur);
})();
