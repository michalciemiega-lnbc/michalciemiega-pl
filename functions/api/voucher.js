// Cloudflare Pages Function: przyjmuje zamówienie vouchera i wysyła je mailem
// do Michała przez Resend. Na razie płatność przelewem albo BLIK-iem i ręczne
// wysłanie vouchera; automatyzację (kod, PDF, operator płatności) dodamy później.

const DO = "michal@michalciemiega.pl";
const OD = "Formularz michalciemiega.pl <formularz@michalciemiega.pl>";
const PAKIETY = ["Kadr – 1290 zł", "Seria – 2290 zł", "Opowieść – 4490 zł"];

function odpowiedz(status, komunikat) {
  return new Response(JSON.stringify({ komunikat }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const czysc = (v, max = 1000) => String(v || "").trim().slice(0, max);
const html = (t) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function onRequestPost({ request, env }) {
  let dane;
  try {
    dane = await request.formData();
  } catch {
    return odpowiedz(400, "Nie udało się odczytać formularza.");
  }
  if (czysc(dane.get("strona"))) return odpowiedz(200, "Zamówienie wysłane.");

  const z = {
    pakiet: czysc(dane.get("pakiet"), 60),
    imie: czysc(dane.get("imie"), 150),
    email: czysc(dane.get("email"), 200),
    dla: czysc(dane.get("dla"), 100),
    faktura: czysc(dane.get("faktura"), 500),
    regulamin: czysc(dane.get("regulamin"), 10),
  };

  if (!PAKIETY.includes(z.pakiet) || !z.imie || !z.email || z.regulamin !== "tak") {
    return odpowiedz(400, "Uzupełnij wymagane pola formularza.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(z.email)) return odpowiedz(400, "Sprawdź adres e-mail.");
  if (!env.RESEND_API_KEY) {
    return odpowiedz(503, "Formularz chwilowo nie działa. Napisz na michal@michalciemiega.pl.");
  }

  const wiersze = [
    ["Pakiet", z.pakiet],
    ["Kupująca", z.imie],
    ["E-mail", z.email],
    ["Imię na voucherze", z.dla || "bez imienia"],
    ["Dane do faktury", z.faktura || "na imię i nazwisko"],
    ["Regulamin", "zaakceptowany"],
  ];

  const odp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: OD,
      to: [DO],
      reply_to: z.email,
      subject: `Zamówienie vouchera: ${z.pakiet.split(" ")[0]} (${z.imie})`,
      text: wiersze.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<table cellpadding="6">${wiersze
        .map(([k, v]) => `<tr><td valign="top"><b>${html(k)}</b></td><td>${html(v).replace(/\n/g, "<br>")}</td></tr>`)
        .join("")}</table>`,
    }),
  });

  if (!odp.ok) return odpowiedz(502, "Nie udało się wysłać zamówienia. Napisz na michal@michalciemiega.pl.");
  return odpowiedz(200, "Zamówienie wysłane.");
}

export function onRequest() {
  return odpowiedz(405, "Ten adres przyjmuje tylko formularz.");
}
