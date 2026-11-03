/* nowmad agency — interacciones propias de agency.html.
   main.js (compartido) ya maneja: aguja del logo en el hero, nav, .reveal, recorrido y año. */
(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[nowmad agency] " + name, err); }
  }

  // 1. Panel de terminal: mide esta misma página con la Performance API
  function initPerf() {
    var el = document.querySelector("[data-perf]");
    if (!el || !window.performance || !performance.getEntriesByType) return;

    var lcp = null;
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes &&
        PerformanceObserver.supportedEntryTypes.indexOf("largest-contentful-paint") > -1) {
      var po = new PerformanceObserver(function (list) {
        var entries = list.getEntries();
        if (entries.length) lcp = entries[entries.length - 1].startTime;
      });
      po.observe({ type: "largest-contentful-paint", buffered: true });
    }

    function dots(label, value) {
      var width = 22;
      var pad = Math.max(2, width - label.length);
      return "› " + label + " " + new Array(pad).join(".") + " <b>" + value + "</b>";
    }

    function measure() {
      var nav = performance.getEntriesByType("navigation")[0];
      // Solo lo que se descargó hasta el evento load: el 3D llega después, a propósito
      var end = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now();
      var res = performance.getEntriesByType("resource").filter(function (r) { return r.startTime <= end; });
      var bytes = nav ? (nav.encodedBodySize || 0) : 0;
      res.forEach(function (r) { bytes += r.encodedBodySize || 0; });

      var lines = ["$ medir agency.html"];
      if (nav && nav.loadEventEnd > 0) lines.push(dots("carga completa", Math.round(nav.loadEventEnd - nav.startTime) + " ms"));
      if (lcp !== null) lines.push(dots("contenido principal", Math.round(lcp) + " ms"));
      if (bytes > 0) lines.push(dots("peso al cargar", (bytes / 1024).toFixed(0) + " KB"));
      lines.push(dots("pedidos", String(res.length + 1)));
      lines.push("› listo. medido ahora, en tu navegador.");
      render(lines);
    }

    function render(lines) {
      if (reduced) {
        el.innerHTML = lines.join("\n");
        return;
      }
      var i = 0;
      el.innerHTML = "";
      (function next() {
        var shown = lines.slice(0, i + 1).join("\n");
        var done = i >= lines.length - 1;
        el.innerHTML = shown + (done ? " " : "\n") + '<span class="ag-caret" aria-hidden="true"></span>';
        if (!done) { i++; setTimeout(next, 260); }
      })();
    }

    function afterLoad() { setTimeout(measure, 300); }
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad);
  }

  // 2. Brújula de servicios: la aguja apunta a la tarjeta bajo el cursor o con foco
  function initGuide() {
    var wrap = document.querySelector("[data-guide]");
    var needle = document.querySelector("[data-guide-needle]");
    if (!wrap || !needle) return;
    var svg = needle.ownerSVGElement;
    var cards = Array.prototype.slice.call(wrap.querySelectorAll("[data-guide-target]"));

    var REST = -45; // la línea del logo apunta al noreste; -45 la deja mirando al norte
    var angle = REST;
    var target = REST;
    var running = false;
    var current = null;

    function paint() { needle.setAttribute("transform", "rotate(" + angle.toFixed(2) + " 44 56)"); }

    function step() {
      var delta = target - angle;
      if (Math.abs(delta) < 0.05 || reduced) {
        angle = target;
        paint();
        running = false;
        return;
      }
      angle += delta * 0.12;
      paint();
      requestAnimationFrame(step);
    }

    function go() {
      if (running) return;
      running = true;
      requestAnimationFrame(step);
    }

    // camino más corto, sin dar la vuelta entera
    function aimAt(deg) {
      var d = ((deg - angle) % 360 + 540) % 360 - 180;
      target = angle + d;
      go();
    }

    function point(card) {
      if (current) current.classList.remove("is-target");
      current = card;
      if (!card) {
        aimAt(REST);
        window.dispatchEvent(new CustomEvent("agency:aim", { detail: null }));
        return;
      }
      card.classList.add("is-target");
      var s = svg.getBoundingClientRect();
      var c = card.getBoundingClientRect();
      // centro de la "o" dentro del viewBox 6 18 76 76: (44, 56) → 50% / 50%
      var cx = s.left + s.width * 0.5;
      var cy = s.top + s.height * 0.5;
      var tx = c.left + c.width / 2;
      var ty = c.top + c.height / 2;
      var rad = Math.atan2(ty - cy, tx - cx);
      aimAt(rad * 180 / Math.PI + 45);
      // la brújula 3D del fondo (agency-3d.js) apunta a la misma tarjeta
      window.dispatchEvent(new CustomEvent("agency:aim", { detail: rad }));
    }

    cards.forEach(function (card) {
      // luz que sigue al cursor dentro de la tarjeta
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
      card.addEventListener("mouseenter", function () { point(card); });
      card.addEventListener("focus", function () { point(card); });
    });
    wrap.addEventListener("mouseleave", function () { point(null); });
    wrap.addEventListener("focusout", function (e) {
      if (!wrap.contains(e.relatedTarget)) point(null);
    });

    paint();
  }

  // 3. Armador de pedido: arma el mensaje y lo manda por WhatsApp (o por mail si no hay número)
  function initBuilder() {
    var form = document.querySelector("[data-builder]");
    if (!form) return;
    var msgEl = form.querySelector("[data-msg]");
    var send = form.querySelector("[data-send]");
    var label = form.querySelector("[data-send-label]");
    var wa = (form.getAttribute("data-wa") || "").replace(/\D/g, "");
    var mail = form.getAttribute("data-mail") || "";

    function list(items) {
      if (items.length < 2) return items.join("");
      return items.slice(0, -1).join(", ") + " y " + items[items.length - 1];
    }

    function build() {
      var services = Array.prototype.slice.call(form.querySelectorAll('input[name="s"]:checked'))
        .map(function (i) { return i.value; });
      var rubro = form.elements.rubro.value.trim();
      var plazoEl = form.querySelector('input[name="plazo"]:checked');
      var plazo = plazoEl ? plazoEl.value : "";

      var parts = [];
      if (rubro) parts.push("Mi rubro es " + rubro.replace(/[.\s]+$/, ""));
      if (services.length) parts.push((parts.length ? "y necesito " : "Necesito ") + list(services));
      if (!parts.length) return "¡Hola, nowmad agency! Quiero contarles un proyecto." + (plazo ? " Lo necesito " + plazo + "." : "");
      var text = "¡Hola, nowmad agency! " + parts.join(" ");
      if (plazo) text += (services.length ? ", " : ". Lo necesito ") + plazo;
      return text + ".";
    }

    function update() {
      var text = build();
      msgEl.textContent = text;
      if (wa) {
        send.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(text);
        send.target = "_blank";
        send.rel = "noopener";
      } else {
        send.href = "mailto:" + mail + "?subject=" + encodeURIComponent("Consulta nowmad agency") + "&body=" + encodeURIComponent(text);
      }
    }

    if (wa) label.textContent = "Enviar por WhatsApp";
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); send.click(); });
    update();
  }

  // 4. Viaje a Buenos Aires: qué texto se ve según cuánto bajaste
  function initJourney() {
    var sec = document.querySelector("[data-journey]");
    if (!sec) return;
    var steps = Array.prototype.slice.call(sec.querySelectorAll(".ag-step"));
    var CUTS = [0, 0.16, 0.42, 0.66, 0.86];
    var ticking = false;
    function update() {
      ticking = false;
      var r = sec.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      var idx = 0;
      for (var i = 0; i < CUTS.length; i++) if (p >= CUTS[i]) idx = i;
      steps.forEach(function (el, i) { el.classList.toggle("is-on", i === idx); });
      sec.classList.toggle("is-city", p > 0.3 && p < 1);
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
  }

  function boot() {
    safe(initPerf, "perf");
    safe(initGuide, "guide");
    safe(initBuilder, "builder");
    safe(initJourney, "journey");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
