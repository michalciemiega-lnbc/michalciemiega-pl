// Wysyłka formularza zapytania bez przeładowania strony.
// Walidacja jest też po stronie serwera (functions/api/zapytanie.js).
(function () {
  const form = document.getElementById("formularz");
  if (!form) return;
  const komunikat = document.getElementById("komunikat");
  const przycisk = form.querySelector('button[type="submit"]');

  function pokaz(tekst) {
    komunikat.textContent = tekst;
    komunikat.hidden = false;
  }

  function blad(form) {
    const dane = new FormData(form);
    if (!String(dane.get("imie") || "").trim()) return "Wpisz imię.";
    const email = String(dane.get("email") || "").trim();
    const telefon = String(dane.get("telefon") || "").trim();
    if (!email && !telefon) return "Podaj e-mail albo telefon, żebym mógł odpowiedzieć.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Sprawdź adres e-mail.";
    if (!dane.get("rodzaj")) return "Wybierz rodzaj sesji.";
    if (!String(dane.get("terminy") || "").trim()) return "Napisz, jakie terminy Ci pasują.";
    if (!String(dane.get("cel") || "").trim()) return "Napisz, do czego potrzebujesz zdjęć.";
    if (!dane.get("polityka")) return "Zaznacz, że znasz politykę prywatności.";
    return "";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const problem = blad(form);
    if (problem) { pokaz(problem); return; }

    przycisk.disabled = true;
    przycisk.textContent = "Wysyłanie…";
    try {
      const odp = await fetch(form.action, { method: "POST", body: new FormData(form) });
      const json = await odp.json().catch(() => ({}));
      if (odp.ok) {
        form.reset();
        pokaz("Zapytanie wysłane. Odpowiem w ciągu doby.");
      } else {
        pokaz(json.komunikat || "Nie udało się wysłać zapytania. Napisz na michal@michalciemiega.pl.");
      }
    } catch (err) {
      pokaz("Brak połączenia. Spróbuj jeszcze raz albo napisz na michal@michalciemiega.pl.");
    } finally {
      przycisk.disabled = false;
      przycisk.textContent = "Wyślij zapytanie";
    }
  });
})();
