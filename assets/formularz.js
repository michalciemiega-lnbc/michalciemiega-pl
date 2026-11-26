// Wysyłka formularzy (zapytanie o sesję i zamówienie vouchera) bez przeładowania strony.
// Walidacja jest też po stronie serwera (functions/api/).
(function () {
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Podstrony rodzajów sesji linkują tu z ?rodzaj=..., więc zaznaczamy ten rodzaj.
  const wybrany = new URLSearchParams(location.search).get("rodzaj");
  const lista = document.getElementById("rodzaj");
  if (wybrany && lista) {
    for (const o of lista.options) if (o.text === wybrany) o.selected = true;
  }

  function etykieta(form, pole) {
    const l = form.querySelector(`label[for="${pole.id}"]`);
    return l ? l.textContent.replace(/\s*\(.*\)\s*$/, "").trim() : "";
  }

  function blad(form) {
    const email = form.querySelector('input[type="email"]');
    const telefon = form.querySelector('input[type="tel"]');

    // Formularz zapytania: wystarczy e-mail albo telefon.
    if (email && telefon && !email.value.trim() && !telefon.value.trim()) {
      return "Podaj e-mail albo telefon, żebym mógł odpowiedzieć.";
    }
    for (const pole of form.querySelectorAll("[required]")) {
      if (pole.type === "checkbox") {
        if (!pole.checked) return "Zaznacz zgodę pod formularzem.";
      } else if (!pole.value.trim()) {
        return "Uzupełnij pole: " + (etykieta(form, pole) || pole.name) + ".";
      }
    }
    if (email && email.value.trim() && !EMAIL.test(email.value.trim())) return "Sprawdź adres e-mail.";
    return "";
  }

  for (const form of document.querySelectorAll("form.formularz")) {
    const komunikat = form.querySelector(".komunikat");
    const przycisk = form.querySelector('button[type="submit"]');
    const napis = przycisk.textContent;

    const pokaz = (tekst) => { komunikat.textContent = tekst; komunikat.hidden = false; };

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
          pokaz(form.dataset.sukces || "Wysłane.");
          if (window.mcKonwersja) window.mcKonwersja(form.dataset.konwersja);
        } else {
          pokaz(json.komunikat || "Nie udało się wysłać formularza. Napisz na michal@michalciemiega.pl.");
        }
      } catch (err) {
        pokaz("Brak połączenia. Spróbuj jeszcze raz albo napisz na michal@michalciemiega.pl.");
      } finally {
        przycisk.disabled = false;
        przycisk.textContent = napis;
      }
    });
  }
})();
