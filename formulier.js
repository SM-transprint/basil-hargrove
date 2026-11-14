// Basil Hargrove: zet echte Nederlandse labels boven de velden van het MailerLite-formulier,
// zoals in 05_mailerlite/formulier/voorbeeld-formulier.png. MailerLite levert de velden zonder
// zichtbaar label (alleen een placeholder en een Engelse aria-label).
// Werkt pas als MailerLite het formulier geladen heeft, daarom een MutationObserver.
(function () {
  "use strict";
  var plek = document.querySelector("#inschrijven .ml-embedded");
  if (!plek) return;

  var VELDEN = [
    { naam: "fields[name]", label: "Voornaam", voorbeeld: "Bv. Elise" },
    { naam: "fields[email]", label: "E-mailadres", voorbeeld: "naam@voorbeeld.be" }
  ];

  function aanpassen() {
    var klaar = false;
    VELDEN.forEach(function (v, i) {
      var veld = plek.querySelector('input[name="' + v.naam + '"]');
      if (!veld) return;
      klaar = true;
      if (veld.dataset.bhLabel) return;
      veld.dataset.bhLabel = "1";
      if (!veld.id) veld.id = "bh-veld-" + i;
      var label = document.createElement("label");
      label.className = "ml-veldlabel";
      label.htmlFor = veld.id;
      label.textContent = v.label;
      veld.parentNode.insertBefore(label, veld);
      veld.removeAttribute("aria-label"); // het zichtbare label geeft nu de naam
      veld.placeholder = v.voorbeeld;
    });
    return klaar;
  }

  if (aanpassen()) return;
  var kijker = new MutationObserver(function () {
    if (aanpassen()) kijker.disconnect();
  });
  kijker.observe(plek, { childList: true, subtree: true });
})();
