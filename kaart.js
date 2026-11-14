// Basil Hargrove — interactieve herkomstkaart (Plaat II).
// De rode punten op de kaart worden knoppen. Een klik opent een veldnotitie met de gegevens
// van dat dossier (gelezen uit de dossiermappen op deze pagina) en een link naar de map.
// Werkt met muis, toetsenbord en aanraking. Zonder JavaScript blijft de kaart een gewone afbeelding.
(function () {
  var img = document.querySelector(".plaat-klein img");
  if (!img) return;

  // positie van elk punt in % van de kaart (berekend uit de coördinaten in huisstijl.json,
  // zoals _scripts/maak-design.mjs de kaart tekent). dy schuift de knop een paar pixels,
  // omdat Ali Shan en Dong Ding op de kaart bijna op elkaar liggen.
  var PUNTEN = [
    { nr: "01", x: 71.43, y: 73.90, dy: 9 },
    { nr: "02", x: 34.14, y: 56.20, dy: 0 },
    { nr: "03", x: 70.71, y: 71.50, dy: -11 },
    { nr: "04", x: 26.86, y: 25.84, dy: 0 }
  ];

  // het vlak waarin de knoppen staan: de .kantel van beweging.js als die er is, anders een eigen omhulsel
  var vlak = img.parentElement;
  if (!vlak.classList.contains("kantel")) {
    vlak = document.createElement("div");
    img.parentNode.insertBefore(vlak, img);
    vlak.appendChild(img);
  }
  vlak.classList.add("kaart-vlak");

  // gegevens uit de dossiermappen halen (één bron: de pagina zelf)
  function gegevens(nr) {
    var titel = document.getElementById("d" + Number(nr));
    if (!titel) return null;
    var art = titel.closest("article");
    var rijen = [];
    art.querySelectorAll(".gegevens dt").forEach(function (dt) {
      rijen.push([dt.textContent, dt.nextElementSibling ? dt.nextElementSibling.textContent : ""]);
    });
    var bev = art.querySelector(".bevinding");
    return { naam: titel.textContent, id: titel.id, rijen: rijen, bevinding: bev ? bev.textContent : "" };
  }

  // de veldnotitie (één voor alle punten)
  var kaartje = document.createElement("div");
  kaartje.className = "kaartje";
  kaartje.id = "kaartje";
  kaartje.setAttribute("role", "dialog");
  kaartje.hidden = true;
  vlak.appendChild(kaartje);

  var open = null; // de knop van het geopende punt

  function sluit(focusTerug) {
    if (!open) return;
    kaartje.hidden = true;
    open.setAttribute("aria-expanded", "false");
    open.classList.remove("open");
    vlak.classList.remove("vast");
    if (focusTerug) open.focus();
    open = null;
  }

  function toon(knop, punt) {
    if (open === knop) { sluit(true); return; }
    sluit(false);
    var g = gegevens(punt.nr);
    if (!g) return;
    var dl = g.rijen.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    kaartje.setAttribute("aria-label", "Veldnotitie " + g.naam);
    kaartje.innerHTML =
      '<button type="button" class="kaartje-sluit" aria-label="Sluit de veldnotitie">×</button>' +
      '<p class="kaartje-kop">Dossier Nº ' + punt.nr + "</p>" +
      '<p class="kaartje-naam">' + g.naam + "</p>" +
      "<dl>" + dl + "</dl>" +
      '<p class="kaartje-bevinding">' + g.bevinding + "</p>" +
      '<a class="kaartje-link" href="#' + g.id + '">Open het dossier</a>';

    // kantelen pauzeren zolang de notitie open is, zodat ze rustig leesbaar blijft
    vlak.classList.add("vast");
    vlak.style.transform = "";

    kaartje.hidden = false;
    knop.setAttribute("aria-expanded", "true");
    knop.classList.add("open");
    open = knop;

    // plaatsen bij het punt, binnen de kaart: onder het punt in de bovenste helft, erboven in de onderste
    var W = vlak.clientWidth, H = vlak.clientHeight;
    var px = (punt.x / 100) * W, py = (punt.y / 100) * H + punt.dy;
    var w = kaartje.offsetWidth, h = kaartje.offsetHeight;
    var links = Math.max(8, Math.min(W - w - 8, px - w / 2));
    var boven = py < H * 0.5 ? py + 22 : py - h - 22;
    kaartje.style.left = links + "px";
    kaartje.style.top = Math.max(8, boven) + "px";

    kaartje.querySelector(".kaartje-sluit").addEventListener("click", function () { sluit(true); });
    kaartje.querySelector(".kaartje-link").addEventListener("click", function (e) {
      e.preventDefault();
      sluit(false);
      toonDossier(g.id);
    });
    kaartje.querySelector(".kaartje-link").focus({ preventScroll: true });
  }

  // naar de dossiermap scrollen (de hele map in het midden van het scherm) en ze even uitlichten
  function toonDossier(id) {
    var titel = document.getElementById(id);
    if (!titel) return;
    var map = titel.closest(".map");
    var rustig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.scrollIntoView({ block: "center", behavior: rustig ? "auto" : "smooth" });
    if (history.replaceState) history.replaceState(null, "", "#" + id);

    // de animatie opnieuw starten, ook als dezelfde map al eerder uitgelicht werd
    map.classList.remove("uitgelicht");
    void map.offsetWidth;
    map.classList.add("uitgelicht");
    map.addEventListener("animationend", function klaar(ev) {
      if (ev.animationName.indexOf("uitlichten") !== 0) return;
      map.classList.remove("uitgelicht");
      map.removeEventListener("animationend", klaar);
    });

    // focus naar de map, zodat ook toetsenbord- en schermlezergebruikers daar verder lezen
    var art = map.querySelector("article");
    art.setAttribute("tabindex", "-1");
    art.focus({ preventScroll: true });
  }

  PUNTEN.forEach(function (punt) {
    var g = gegevens(punt.nr);
    if (!g) return;
    var knop = document.createElement("button");
    knop.type = "button";
    knop.className = "pin";
    knop.style.left = punt.x + "%";
    knop.style.top = "calc(" + punt.y + "% + " + punt.dy + "px)";
    knop.setAttribute("aria-expanded", "false");
    knop.setAttribute("aria-controls", "kaartje");
    knop.innerHTML = '<span class="zichtbaar-voor-lezer">Nº ' + punt.nr + " " + g.naam + ": toon de veldnotitie</span>";
    knop.addEventListener("click", function (e) { e.stopPropagation(); toon(knop, punt); });
    vlak.insertBefore(knop, kaartje);
  });

  // sluiten met Escape of door ernaast te klikken
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") sluit(true); });
  document.addEventListener("click", function (e) {
    if (open && !kaartje.contains(e.target)) sluit(false);
  });
})();
