// Zgoda na pliki cookies Google Ads i piksela Meta, które mierzą, czy reklama doprowadziła do wysłania formularza.
// Tag Google i piksel Meta wczytujemy dopiero po zgodzie. Bez zgody strona nie łączy się ani z Google, ani z Metą.
// Zgoda zapisana przed dodaniem piksela Meta (bez pola wersja: 2) obejmowała tylko Google, więc pytamy ponownie.
(function () {
  const ID = "AW-18595307187";
  const KONWERSJE = {
    zapytanie: "AW-18595307187/zxwiCJXAjMAdELO996JF",
    voucher: "AW-18595307187/D319CKjAjMAdELO996JF",
  };
  const PIKSEL_META = "1007747879059636";
  const KLUCZ = "zgoda-reklamy";
  const WERSJA = 2;
  let wczytany = false;
  let wczytanaMeta = false;

  function odczytaj() {
    try { return JSON.parse(localStorage.getItem(KLUCZ) || "null"); } catch (e) { return null; }
  }
  function zapisz(zgoda) {
    try {
      localStorage.setItem(KLUCZ, JSON.stringify({ zgoda: zgoda, wersja: WERSJA, data: new Date().toISOString().slice(0, 10) }));
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

  // Standardowy kod piksela Meta, bez automatycznego dopasowania zaawansowanego.
  function wczytajMete() {
    if (wczytanaMeta) return;
    wczytanaMeta = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("set", "autoConfig", false, PIKSEL_META);
    window.fbq("init", PIKSEL_META);
    window.fbq("track", "PageView");
  }

  // Pełna zgoda w obecnej wersji: Google Ads i Meta.
  function wczytajWszystko() {
    wczytajTag();
    wczytajMete();
  }

  // Usuwa pliki cookies Google Ads i Meta zapisane w domenie strony (po wycofaniu zgody).
  function usunCiasteczka() {
    const domeny = ["", "; domain=" + location.hostname, "; domain=." + location.hostname.replace(/^www\./, "")];
    for (const c of document.cookie.split(";")) {
      const nazwa = c.split("=")[0].trim();
      if (/^_gcl_|^_gac_|^_fbp|^_fbc/.test(nazwa)) {
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
    if (z.wersja === WERSJA) {
      wczytajMete();
      window.fbq("track", "Lead", { content_name: nazwa });
    }
  };

  let pasek = null;
  function pokazPasek(zFokusem) {
    if (pasek) { pasek.hidden = false; pasek.querySelector("button").focus(); return; }
    pasek = document.createElement("div");
    pasek.setAttribute("role", "region");
    pasek.className = "pasek-cookies";
    pasek.setAttribute("aria-label", "Zgoda na pliki cookies");
    pasek.innerHTML =
      '<p>Za Twoją zgodą używam plików cookies Google Ads i Meta (Facebook, Instagram), żeby sprawdzać, czy reklamy prowadzą do zapytań o sesję. ' +
      'Meta może też wykorzystać te informacje do dopasowania reklam, które widzisz. Bez zgody strona działa tak samo. ' +
      '<a href="/polityka-prywatnosci/#cookies">Szczegóły w polityce prywatności</a>.</p>' +
      '<div class="pasek-cookies__przyciski">' +
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
      if (tak) wczytajWszystko();
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
    else if (z.zgoda === true && z.wersja !== WERSJA) {
      // Wcześniejsza zgoda dotyczyła tylko Google Ads: Google działa jak dotąd, a o Metę pytamy od nowa.
      // Wcześniejszą odmowę szanujemy bez ponownego pytania.
      wczytajTag();
      pokazPasek();
    } else if (z.zgoda === true) wczytajWszystko();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
