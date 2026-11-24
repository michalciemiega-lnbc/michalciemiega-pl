// Cloudflare Pages Function: przyjmuje zapytanie z formularza i wysyła je
// mailem do Michała przez Resend. Klucz API trzymamy w zmiennej środowiskowej
// RESEND_API_KEY ustawionej w Cloudflare Pages (nigdy w repozytorium).

const DO = "michal@michalciemiega.pl";
const OD = "Formularz michalciemiega.pl <formularz@michalciemiega.pl>";

function odpowiedz(status, komunikat) {
  return new Response(JSON.stringify({ komunikat }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function czysc(v, max = 2000) {
  return String(v || "").trim().slice(0, max);
}

function html(t) {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export async function onRequestPost({ request, env }) {
  let dane;
  try {
    dane = await request.formData();
  } catch {
    return odpowiedz(400, "Nie udało się odczytać formularza.");
  }

  // Pułapka na boty: prawdziwa osoba nie widzi tego pola.
  if (czysc(dane.get("strona"))) return odpowiedz(200, "Zapytanie wysłane.");

  const z = {
    imie: czysc(dane.get("imie"), 100),
    email: czysc(dane.get("email"), 200),
    telefon: czysc(dane.get("telefon"), 40),
    rodzaj: czysc(dane.get("rodzaj"), 40),
    terminy: czysc(dane.get("terminy")),
    cel: czysc(dane.get("cel")),
    doswiadczenie: czysc(dane.get("doswiadczenie"), 100),
    voucher: czysc(dane.get("voucher"), 40),
    polityka: czysc(dane.get("polityka"), 10),
  };

  if (!z.imie || (!z.email && !z.telefon) || !z.rodzaj || !z.terminy || !z.cel || z.polityka !== "tak") {
    return odpowiedz(400, "Uzupełnij wymagane pola formularza.");
  }
  if (z.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(z.email)) {
    return odpowiedz(400, "Sprawdź adres e-mail.");
  }

  if (!env.RESEND_API_KEY) {
    return odpowiedz(503, "Formularz jeszcze nie działa. Napisz na michal@michalciemiega.pl.");
  }

  const wiersze = [
    ["Imię", z.imie],
    ["E-mail", z.email || "–"],
    ["Telefon", z.telefon || "–"],
    ["Rodzaj sesji", z.rodzaj],
    ["Preferowane terminy", z.terminy],
    ["Cel zdjęć", z.cel],
    ["Doświadczenie", z.doswiadczenie || "–"],
    ["Kod vouchera", z.voucher || "–"],
  ];

  const tekst = wiersze.map(([k, v]) => `${k}: ${v}`).join("\n");
  const tresc = `<table cellpadding="6">${wiersze
    .map(([k, v]) => `<tr><td valign="top"><b>${html(k)}</b></td><td>${html(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;

  const wiadomosc = {
    from: OD,
    to: [DO],
    subject: `Zapytanie o sesję: ${z.imie} (${z.rodzaj})`,
    text: tekst,
    html: tresc,
  };
  if (z.email) wiadomosc.reply_to = z.email;

  const odp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(wiadomosc),
  });

  if (!odp.ok) {
    return odpowiedz(502, "Nie udało się wysłać zapytania. Napisz na michal@michalciemiega.pl.");
  }
  return odpowiedz(200, "Zapytanie wysłane.");
}

export function onRequest() {
  return odpowiedz(405, "Ten adres przyjmuje tylko formularz.");
}
