// Zgoda na pliki cookies Google Ads, które służą tylko do pomiaru, czy reklama doprowadziła do wysłania formularza.
// Tag Google wczytujemy dopiero po zgodzie. Bez zgody strona nie łączy się z Google.
(function () {
  const ID = "AW-18595307187";
  const KONWERSJE = {
    zapytanie: "AW-18595307187/zxwiCJXAjMAdELO996JF",
    voucher: "AW-18595307187/D319CKjAjMAdELO996JF",
  };
  const KLUCZ = "zgoda-reklamy";
  let wczytany = false;

  function odczytaj() {
    try { return JSON.parse(localStorage.getItem(KLUCZ) || "null"); } catch (e) { return null; }
  }
  function zapisz(zgoda) {
    try {
      localStorage.setItem(KLUCZ, JSON.stringify({ zgoda: zgoda, data: new Date().toISOString().slice(0, 10) }));
    } catch (e) { /* bez pamięci przeglądarki pytamy przy każdej wizycie */ }
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function wczytajTag() {
    if (wczytany) return;
    wczytany = true;
    gtag("consent", "default", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    gtag("js", new Date());
    gtag("config", ID);
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
    document.head.appendChild(s);
  }

  // Usuwa pliki cookies Google Ads zapisane w domenie strony (po wycofaniu zgody).
  function usunCiasteczka() {
    const domeny = ["", "; domain=" + location.hostname, "; domain=." + location.hostname.replace(/^www\./, "")];
    for (const c of document.cookie.split(";")) {
      const nazwa = c.split("=")[0].trim();
      if (/^_gcl_|^_gac_/.test(nazwa)) {
        for (const d of domeny) document.cookie = nazwa + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
      }
    }
  }

  // Wywoływane przez formularz.js po udanym wysłaniu formularza.
  window.mcKonwersja = function (nazwa) {
    const z = odczytaj();
    if (!z || z.zgoda !== true || !KONWERSJE[nazwa]) return;
    wczytajTag();
    gtag("event", "conversion", { send_to: KONWERSJE[nazwa] });
  };

  let pasek = null;
  function pokazPasek(zFokusem) {
    if (pasek) { pasek.hidden = false; pasek.querySelector("button").focus(); return; }
    pasek = document.createElement("div");
    pasek.setAttribute("role", "region");
    pasek.className = "zgoda";
    pasek.setAttribute("aria-label", "Zgoda na pliki cookies");
    pasek.innerHTML =
      '<p>Za Twoją zgodą używam plików cookies Google Ads, żeby sprawdzać, czy reklamy prowadzą do zapytań o sesję. ' +
      'Nie służą do pokazywania Ci reklam. Bez zgody strona działa tak samo. ' +
      '<a href="/polityka-prywatnosci/#cookies">Szczegóły w polityce prywatności</a>.</p>' +
      '<div class="zgoda__przyciski">' +
      '<button type="button" class="przycisk" data-zgoda="tak">Zgadzam się</button>' +
      '<button type="button" class="przycisk" data-zgoda="nie">Nie zgadzam się</button>' +
      "</div>";
    pasek.addEventListener("click", function (e) {
      const b = e.target.closest("button[data-zgoda]");
      if (!b) return;
      const tak = b.dataset.zgoda === "tak";
      const poprzednia = odczytaj();
      zapisz(tak);
      pasek.hidden = true;
      if (tak) wczytajTag();
      else if (poprzednia && poprzednia.zgoda === true) {
        // Tag mógł już działać: czyścimy pliki i przeładowujemy stronę, żeby go zatrzymać.
        usunCiasteczka();
        location.reload();
      }
    });
    document.body.appendChild(pasek);
    if (zFokusem === true) pasek.querySelector("button").focus();
  }

  function dodajLinkWStopce() {
    const kolumny = document.querySelectorAll(".stopka p");
    const ostatnia = kolumny[kolumny.length - 1];
    if (!ostatnia) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "stopka__link";
    b.textContent = "Ustawienia plików cookies";
    b.addEventListener("click", function () { pokazPasek(true); });
    ostatnia.appendChild(document.createElement("br"));
    ostatnia.appendChild(b);
  }

  function start() {
    dodajLinkWStopce();
    const z = odczytaj();
    if (!z) pokazPasek();
    else if (z.zgoda === true) wczytajTag();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
