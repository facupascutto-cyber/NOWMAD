/* Fondo de pantalla de agency: el nómade (clips de Kling, sin marca de agua, en assets/video/nomade/).
   - Portada: <video> en loop (loop.mp4, corte sin salto).
   - Al bajar, el scroll de toda la página mueve la secuencia: gira hacia cámara → niebla → se aleja
     hacia las montañas → fundido a oscuro → plano general.
   - Los tramos del scroll NO son videos: son secuencias de cuadros .webp (24 por segundo) dibujadas en
     un <canvas>. Buscar un cuadro de video con currentTime obliga a decodificar desde el último keyframe
     y se traba (sobre todo en Safari y en celulares); dibujar una imagen ya decodificada no.
   - Los cuadros se bajan después del evento load: primero salteados (1 de cada 8) y después el resto,
     así el scroll funciona enseguida y se va afinando. Si falta un cuadro se dibuja el más cercano.
   - Con prefers-reduced-motion queda la portada quieta. */
(function () {
  var root = document.querySelector("[data-nm]");
  if (!root) return;
  var hero = root.querySelector("[data-nm-hero]");
  var cv = root.querySelector("[data-nm-seq]");
  var fog = root.querySelector("[data-nm-fog]");
  var dark = root.querySelector("[data-nm-dark]");
  var ctx = cv && cv.getContext("2d");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wideMq = matchMedia("(min-width: 900px)");
  var BASE = "assets/video/nomade/seq/";

  function play() { var p = hero.play && hero.play(); if (p && p.catch) p.catch(function () {}); }
  if (reduce || !ctx) { try { hero.pause(); } catch (e) {} return; }
  play();

  // Tramos de scroll (fracción de toda la página). fx/fy: dónde está la figura en el cuadro.
  // z0 → z1: leve acercamiento de cámara mientras dura el tramo.
  var CLIPS = [
    { name: "giro", a: 0.07, b: 0.45, fx: 0.42, fy: 0.45, z0: 1.12, z1: 1 },
    { name: "aleja", a: 0.5, b: 0.85, fx: 0.47, fy: 0.5, z0: 1.04, z1: 1 },
    { name: "final", a: 0.86, b: 1, fx: 0.48, fy: 0.5, z0: 1.06, z1: 1 }
  ];
  var IW = 1280, IH = 720;

  function seg(p, a, b) { var t = (p - a) / (b - a); return t < 0 ? 0 : t > 1 ? 1 : t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function bump(p, a, m, b) { return p <= m ? seg(p, a, m) : 1 - seg(p, m, b); }
  function pad(i) { return i < 10 ? "00" + i : i < 100 ? "0" + i : "" + i; }
  function progress() {
    var max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  }

  // ---------- Carga de cuadros ----------
  var started = false;
  function load() {
    if (started) return;
    started = true;
    fetch(BASE + "seq.json").then(function (r) { return r.json(); }).then(function (meta) {
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
          img.src = BASE + c.name + "/" + pad(i) + ".webp";
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
  else addEventListener("load", function () { setTimeout(load, 300); });

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
    var want = Math.round(t * (c.n - 1)), i = nearest(c, want);
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
  function render(p) {
    // Portada: en pantallas anchas el caminante va a la izquierda, debajo del titular
    var wide = wideMq.matches, s0 = wide ? 1.4 : 1;
    var F = [0.45, 0.56], Q = wide ? [0.24, 0.64] : F;
    var s = s0 * (1 + 0.22 * ease(seg(p, 0.01, 0.12)));
    hero.style.transform = "translate(" + ((Q[0] - s * F[0]) * 100) + "%," + ((Q[1] - s * F[1]) * 100) + "%) scale(" + s + ")";
    var mix = seg(p, 0.05, 0.12);
    hero.style.opacity = 1 - mix;
    cv.style.opacity = mix;
    if (mix >= 1 && heroOn) { heroOn = false; try { hero.pause(); } catch (e) {} }
    else if (mix < 1 && !heroOn) { heroOn = true; play(); }
    if (mix > 0 && !started) load();

    var c = p < 0.5 ? CLIPS[0] : p < 0.86 ? CLIPS[1] : CLIPS[2];
    draw(c, seg(p, c.a, c.b));

    var f = 0.95 * bump(p, 0.42, 0.5, 0.58), d = 0.92 * bump(p, 0.8, 0.86, 0.92);
    fog.style.opacity = f; fog.style.visibility = f > 0 ? "visible" : "hidden";
    dark.style.opacity = d;
  }

  // El scroll se sigue con un poco de inercia; solo se trabaja mientras algo cambia
  var target = progress(), cur = target, running = false;
  function tick() {
    cur += (target - cur) * 0.18;
    if (Math.abs(target - cur) < 0.0002) cur = target;
    render(cur);
    if (cur !== target) requestAnimationFrame(tick); else running = false;
  }
  function kick() { target = progress(); if (!running) { running = true; requestAnimationFrame(tick); } }
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", function () { size(); kick(); });
  if (wideMq.addEventListener) wideMq.addEventListener("change", kick);
  size();
  render(cur);
})();
