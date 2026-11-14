// Basil Hargrove — scrollbeweging (klein en rustig).
// 1. Inhoud verschijnt zacht zodra ze ongeveer half in beeld komt.
// 2. De windroos draait sneller terwijl je scrolt en komt daarna rustig tot haar gewone tempo.
// Niets hiervan gebeurt bij "minder beweging"; zonder JavaScript is alles gewoon zichtbaar.
(function () {
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  document.documentElement.classList.add("beweging");

  // --- 1. verschijnen ---
  var doelen = document.querySelectorAll(
    ".verhaal h2, .verhaal-tekst, .sectie-intro, .map, .plaat, .potten, .inschrijven-tekst, .formulierkaart"
  );
  var secties = document.querySelectorAll(".verhaal, .dossiers, .atlas, .inschrijven");

  // de vier dossiermappen komen kort na elkaar binnen
  document.querySelectorAll(".map").forEach(function (map, i) {
    map.style.setProperty("--vertraging", i * 0.12 + "s");
  });

  var kijker = new IntersectionObserver(function (items) {
    items.forEach(function (item) {
      if (item.isIntersecting) {
        item.target.classList.add("zichtbaar");
        kijker.unobserve(item.target);
      }
    });
  }, { rootMargin: "0px 0px -40% 0px" }); // bovenkant van het element voorbij 60 % van het scherm

  doelen.forEach(function (el) { kijker.observe(el); });
  secties.forEach(function (el) { kijker.observe(el); });

  // --- 3. platen in de atlas inspecteren: 3D-kanteling onder de cursor ---
  // De plek onder de cursor komt naar je toe, de overkant kantelt weg; een lichtglans volgt de cursor.
  // Alleen met een muis (op touchscreens is er geen hover).
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var MAX = 9; // maximale kanteling in graden
    document.querySelectorAll(".atlas .plaat").forEach(function (fig) {
      var img = fig.querySelector("img");
      if (!img) return;
      var kantel = document.createElement("div");
      kantel.className = "kantel";
      img.parentNode.insertBefore(kantel, img);
      kantel.appendChild(img);

      // luisteren op het beeld zelf; de maat komt van de figuur (die kantelt niet: stabiel)
      kantel.addEventListener("pointermove", function (e) {
        if (kantel.classList.contains("vast")) return; // stil zolang een veldnotitie op de kaart open is
        var r = fig.getBoundingClientRect();
        var px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        var py = Math.min(1, Math.max(0, (e.clientY - r.top) / kantel.offsetHeight));
        kantel.style.transform =
          "perspective(900px) rotateX(" + ((py - 0.5) * 2 * MAX).toFixed(2) + "deg) " +
          "rotateY(" + (-(px - 0.5) * 2 * MAX).toFixed(2) + "deg) scale(1.04)";
        kantel.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        kantel.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        kantel.classList.add("actief");
      });
      kantel.addEventListener("pointerleave", function () {
        kantel.style.transform = "";
        kantel.classList.remove("actief");
      });
    });
  }

  // --- 2. windroos draait mee met het scrollen ---
  var verhaal = document.querySelector(".verhaal");
  if (!verhaal) return;
  var vorigeY = window.scrollY, extra = 0, snelheid = 0, bezig = false;

  function stap() {
    snelheid *= 0.92;            // uitbollen
    extra += snelheid;
    verhaal.style.setProperty("--scroll-draai", extra.toFixed(2) + "deg");
    if (Math.abs(snelheid) > 0.01) requestAnimationFrame(stap);
    else bezig = false;
  }

  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    snelheid += (y - vorigeY) * 0.015; // naar beneden = met de klok mee, naar boven = terug
    snelheid = Math.max(-3, Math.min(3, snelheid));
    vorigeY = y;
    if (!bezig) { bezig = true; requestAnimationFrame(stap); }
  }, { passive: true });
})();
