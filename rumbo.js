/* Rumbo: la brújula mascota de nowmad explorers.
   Vive abajo a la izquierda, cambia de ánimo según la parte de la página que estás mirando
   y tira un consejo cuando lo tocás. Los dibujos están en assets/rumbo/ (uno por ánimo).
   Para cambiar lo que dice, editá FRASES y CONSEJOS. */
(function () {
  "use strict";

  var EN = /^en/i.test(document.documentElement.lang || "");
  function t(es, en) { return EN ? en : es; }
  var MOODS = ["tranquilo", "curioso", "perdido", "encontrado"];

  // Qué ánimo y qué frase va en cada parte de la página (el primer selector que exista y se vea, gana)
  var ZONAS = [
    { sel: ".hero", mood: "tranquilo", say: t("¡Hola! Soy Rumbo. Te acompaño mientras mirás.", "Hi! I'm Rumbo. I'll keep you company while you look around.") },
    { sel: "#nosotros", mood: "tranquilo", say: t("Ellos me llevan en cada viaje. Nunca me pierden… casi.", "They take me on every trip. They never lose me… almost.") },
    { sel: "#como", mood: "curioso", say: t("Primero escuchamos, después armamos. Así de simple.", "First we listen, then we plan. That simple.") },
    { sel: "#destinos", mood: "curioso", say: t("Mmm… ¿selva, hielo o montaña? Mi aguja no se decide.", "Hmm… jungle, ice or mountains? My needle can't decide.") },
    { sel: "#viajero", mood: "perdido", say: t("¡Me mareo! Hacé el test y ayudame a encontrar tu norte.", "I'm spinning! Take the quiz and help me find your north.") },
    { sel: "#diario, .dr-home", mood: "curioso", say: t("Estas historias las pegamos a mano en el diario.", "We glued these stories into the journal by hand.") },
    { sel: ".dr-missing", mood: "perdido", say: t("Uy, me perdí. Esta historia no está en el diario.", "Oops, I'm lost. That story isn't in the journal.") },
    { sel: ".dr-cta", mood: "encontrado", say: t("¡Este viaje te queda perfecto! Escribinos.", "This trip suits you perfectly! Message us.") },
    { sel: ".dr-paper", mood: "tranquilo", say: t("Leé tranqui, yo te espero acá.", "Take your time reading, I'll wait here.") },
    { sel: ".dr-list", mood: "tranquilo", say: t("Tocá una foto y te cuento la historia completa.", "Tap a photo and I'll tell you the whole story.") },
    { sel: ".dr-top, .dr-entry-head", mood: "curioso", say: t("Bienvenido al diario de ruta. Acá guardo los recuerdos.", "Welcome to the travel journal. This is where I keep the memories.") },
    { sel: "#contacto, .footer", mood: "encontrado", say: t("¡Norte encontrado! Contanos a dónde vas.", "North found! Tell us where you're headed.") }
  ];
  var QUIZ_OK = t("¡Encontramos tu destino! Mirá lo que te salió.", "We found your destination! Check your result.");

  var CONSEJOS = EN ? [
    "In Iguazú, catch the first train to the Devil's Throat: you'll have it almost to yourself.",
    "In the north, walk slowly and drink lots of water. Altitude doesn't forgive rushing.",
    "Patagonia has four seasons in one day. Pack layers, always.",
    "Iberá needs time: two nights and you see it, four and you understand it.",
    "Book glacier trekking well ahead in summer: spots run out fast.",
    "Ask us about the best time of year for each place: it changes everything."
  ] : [
    "En Iguazú tomá el primer tren a la Garganta: la tenés casi para vos solo.",
    "En el norte caminá despacio y tomá mucha agua. La altura no perdona apurones.",
    "En la Patagonia hay cuatro estaciones en un día. Llevá abrigo en capas, siempre.",
    "Iberá pide tiempo: con dos noches se ve, con cuatro se entiende.",
    "El trekking en el glaciar se reserva con anticipación en verano: los lugares vuelan.",
    "Preguntanos la mejor época para cada lugar: cambia todo el viaje."
  ];

  var KEY = "nm-rumbo-off";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(get, val) {
    try { if (get) return localStorage.getItem(KEY) === "1"; if (val) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch (e) {}
    return false;
  }

  function build() {
    var root = document.createElement("div");
    root.className = "rumbo";
    root.setAttribute("data-mood", "tranquilo");
    root.innerHTML =
      '<div class="rumbo-bubble" role="status" aria-live="polite" hidden><p data-rumbo-text></p>' +
      '<button type="button" class="rumbo-hide" data-rumbo-hide>' + t("Ocultar a Rumbo", "Hide Rumbo") + "</button></div>" +
      '<button type="button" class="rumbo-btn" data-rumbo-btn aria-label="' + t("Rumbo, la brújula de nowmad. Tocá para un consejo de viaje", "Rumbo, nowmad's compass. Tap for a travel tip") + '">' +
      MOODS.map(function (m) { return '<img src="assets/rumbo/rumbo-' + m + '.svg" alt="" data-m="' + m + '" width="380" height="395" decoding="async" />'; }).join("") +
      "</button>" +
      '<button type="button" class="rumbo-back" data-rumbo-back aria-label="' + t("Mostrar a Rumbo", "Show Rumbo") + '"><img src="assets/rumbo/rumbo-tranquilo.svg" alt="" width="380" height="395" /></button>';
    document.body.appendChild(root);
    return root;
  }

  function init() {
    var root = build();
    var bubble = root.querySelector(".rumbo-bubble");
    var text = root.querySelector("[data-rumbo-text]");
    var mood = "", zone = null, said = {}, hideTimer = 0, tip = Math.floor(Math.random() * CONSEJOS.length), quizDone = false;

    function setMood(m) {
      if (m === mood) return;
      mood = m;
      root.setAttribute("data-mood", m);
      if (!reduce) { root.classList.remove("is-hop"); void root.offsetWidth; root.classList.add("is-hop"); }
    }
    function say(msg, ms) {
      if (root.classList.contains("is-off")) return;
      text.textContent = msg;
      bubble.hidden = false;
      requestAnimationFrame(function () { bubble.classList.add("is-on"); });
      clearTimeout(hideTimer);
      hideTimer = setTimeout(quiet, ms || 5200);
    }
    function quiet() {
      bubble.classList.remove("is-on");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { bubble.hidden = true; }, 300);
    }

    // La zona que cruza la línea de un tercio de la pantalla
    var zones = [];
    ZONAS.forEach(function (z) {
      Array.prototype.forEach.call(document.querySelectorAll(z.sel), function (el) { zones.push({ el: el, z: z }); });
    });
    function current() {
      var line = innerHeight * 0.4, best = null;
      for (var i = 0; i < zones.length; i++) {
        var r = zones[i].el.getBoundingClientRect();
        if (r.height && r.top <= line && r.bottom > line) {
          // la más chica que la contenga es la más específica
          if (!best || r.height < best.h) best = { item: zones[i], h: r.height };
        }
      }
      // al llegar al fondo de la página, manda el pie
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
        for (var j = 0; j < zones.length; j++) if (zones[j].el.matches("#contacto, .footer")) return zones[j];
      }
      return best && best.item;
    }
    function update() {
      ticking = false;
      var c = current();
      if (!c || c === zone) return;
      zone = c;
      var isQuiz = c.el.id === "viajero";
      setMood(isQuiz && quizDone ? "encontrado" : c.z.mood);
      // habla solo si te quedás un rato en esa parte (no mientras pasás de largo)
      clearTimeout(sayTimer);
      var key = c.z.sel;
      if (!said[key]) sayTimer = setTimeout(function () {
        if (zone !== c) return;
        said[key] = 1;
        say(isQuiz && quizDone ? QUIZ_OK : c.z.say);
      }, 900);
    }
    var sayTimer = 0;
    var ticking = false;
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    setTimeout(update, 900);

    // El test de viajero: se marea mientras contestás y se pone contento con el resultado
    var result = document.querySelector("[data-quiz] [data-result]");
    if (result && "MutationObserver" in window) {
      new MutationObserver(function () {
        quizDone = !result.hidden;
        if (quizDone) { setMood("encontrado"); say(QUIZ_OK); }
        else setMood("perdido");
      }).observe(result, { attributes: true, attributeFilter: ["hidden"] });
    }

    // Tocarlo: un consejo distinto cada vez
    root.querySelector("[data-rumbo-btn]").addEventListener("click", function () {
      if (bubble.classList.contains("is-on") && text.getAttribute("data-tip") === String(tip)) { quiet(); return; }
      tip = (tip + 1) % CONSEJOS.length;
      text.setAttribute("data-tip", String(tip));
      setMood("curioso");
      say(CONSEJOS[tip], 7000);
      setTimeout(function () { if (zone) setMood(zone.el.id === "viajero" && quizDone ? "encontrado" : zone.z.mood); }, 2600);
    });

    function off(v) {
      root.classList.toggle("is-off", v);
      store(false, v);
      if (v) quiet();
    }
    root.querySelector("[data-rumbo-hide]").addEventListener("click", function () { off(true); root.querySelector("[data-rumbo-back]").focus(); });
    root.querySelector("[data-rumbo-back]").addEventListener("click", function () { off(false); root.querySelector("[data-rumbo-btn]").focus(); say(t("¡Volví!", "I'm back!"), 2500); });
    if (store(true)) root.classList.add("is-off");
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !bubble.hidden) quiet(); });

    requestAnimationFrame(function () { root.classList.add("is-ready"); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
