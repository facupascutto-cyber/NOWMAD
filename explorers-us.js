/* nowmad explorers EN · rutas, formulario corto (WhatsApp o mail) y medición de consultas.
   Se suma a explorers-glass.js sin modificarlo. */
(function () {
  "use strict";

  var form = document.querySelector("[data-plan]");
  if (!form) return;

  // Número de WhatsApp de explorers: solo dígitos, con 549 adelante (ej. 5491100000000).
  // Vacío abre WhatsApp para que la persona elija el chat. Se completa en el atributo data-wa del formulario.
  var WA_NUMBER = (form.getAttribute("data-wa") || "").replace(/\D/g, "");
  var MAIL = "hola@nowmad.travel";

  var $ = function (id) { return document.getElementById(id); };
  var route = $("pf-route"), name = $("pf-name"), email = $("pf-email"), when = $("pf-when"), people = $("pf-people"), notes = $("pf-notes");
  var errorBox = form.querySelector("[data-plan-error]"), doneBox = form.querySelector("[data-plan-done]");

  // Medición para las campañas: guarda los utm_* de la visita (sirve para saber de qué anuncio vino la consulta)
  var utm = {};
  try {
    var qs = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"].forEach(function (k) { if (qs.get(k)) utm[k] = qs.get(k); });
    if (Object.keys(utm).length) sessionStorage.setItem("nm-utm", JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem("nm-utm") || "{}") || {};
  } catch (e) { utm = {}; }

  function track(event, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: event }, params));
      if (typeof window.gtag === "function") window.gtag("event", event, params);
      if (typeof window.fbq === "function" && event === "generate_lead") window.fbq("track", "Lead", { content_name: params.route || "custom" });
    } catch (e) {}
  }

  function goToForm(focusEl) {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    $("plan").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setTimeout(function () { try { (focusEl || name).focus({ preventScroll: true }); } catch (e) {} }, reduce ? 0 : 700);
  }

  // "Plan this route": elige la ruta en el formulario y baja hasta él
  Array.prototype.forEach.call(document.querySelectorAll("[data-route-cta]"), function (a) {
    a.addEventListener("click", function (e) {
      var card = a.closest("[data-route]");
      var r = card ? card.getAttribute("data-route") : "";
      Array.prototype.forEach.call(route.options, function (o) { if (r && o.text.indexOf(r) === 0) route.value = o.value || o.text; });
      track("select_route", { route: r });
      e.preventDefault();
      goToForm();
    });
  });

  // El buscador de la portada lleva al formulario con el destino ya escrito
  var heroForm = document.querySelector(".hero-form");
  if (heroForm) {
    heroForm.addEventListener("submit", function (e) {
      var v = ($("destino") && $("destino").value.trim()) || "";
      if (!v) return;
      e.preventDefault();
      if (!notes.value.trim()) notes.value = "I'd like to go to: " + v;
      route.value = "";
      goToForm();
    });
  }

  function setInvalid(el, bad) { if (bad) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid"); }
  [name, email].forEach(function (el) { el.addEventListener("input", function () { setInvalid(el, false); }); });

  function validate() {
    var problems = [];
    var okName = name.value.trim().length > 1;
    var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    setInvalid(name, !okName); setInvalid(email, !okMail);
    if (!okName) problems.push("your name");
    if (!okMail) problems.push("a valid email");
    if (problems.length) {
      errorBox.textContent = "Please add " + problems.join(" and ") + " so we can reply.";
      errorBox.hidden = false;
      (okName ? email : name).focus();
      return false;
    }
    errorBox.hidden = true;
    return true;
  }

  function message() {
    var r = route.value || "Not sure yet, help me choose";
    var lines = [
      "Hi nowmad explorers! I'd like to plan a trip to Argentina.",
      "",
      "Name: " + name.value.trim(),
      "Email: " + email.value.trim(),
      "Route: " + r,
      "When: " + (when.value.trim() || "Flexible"),
      "Travelers: " + people.value
    ];
    if (notes.value.trim()) lines.push("Notes: " + notes.value.trim());
    if (utm.utm_campaign) lines.push("", "Ref: " + utm.utm_campaign);
    return lines.join("\n");
  }

  var via = "whatsapp";
  Array.prototype.forEach.call(form.querySelectorAll("[data-send]"), function (b) {
    b.addEventListener("click", function () { via = b.getAttribute("data-send"); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.submitter && e.submitter.getAttribute("data-send")) via = e.submitter.getAttribute("data-send");
    if (!validate()) return;
    var text = message();
    var r = route.value || "custom";
    if (via === "email") {
      var subject = "Trip inquiry: " + (route.value || "Argentina") + " · " + name.value.trim();
      location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    } else {
      window.open("https://" + "wa" + ".me/" + WA_NUMBER + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    }
    track("generate_lead", { method: via, route: r, travelers: people.value, currency: "USD" });
    doneBox.hidden = false;
  });
})();
