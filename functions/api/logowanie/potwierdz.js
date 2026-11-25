import { podpisz, sprawdzPodpis } from "../../_lib/admin.js";

const DNI_SESJI = 30;

function strona(tekst, status = 400) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/assets/style.css"><main class="dokument"><h1>Panel voucherów</h1><p>${tekst}</p><p><a href="/admin/">Wróć do panelu</a></p></main>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function onRequestGet({ request, env }) {
  const t = new URL(request.url).searchParams.get("t");
  const dane = await sprawdzPodpis(env, t, "link");
  if (!dane) return strona("Ten link jest nieprawidłowy albo wygasł. Poproś o nowy w panelu.");
  const wynik = await env.DB.prepare("UPDATE logowania SET uzyty = 1 WHERE nonce = ? AND uzyty = 0").bind(dane.n).run();
  if (!wynik.meta || wynik.meta.changes !== 1) return strona("Ten link został już użyty. Poproś o nowy w panelu.");

  const sesja = await podpisz(env, { r: "sesja", exp: Date.now() + DNI_SESJI * 86400_000 });
  return new Response(null, {
    status: 303,
    headers: {
      location: "/admin/",
      "set-cookie": `sesja=${sesja}; Path=/; Max-Age=${DNI_SESJI * 86400}; HttpOnly; Secure; SameSite=Lax`,
      "cache-control": "no-store",
    },
  });
}
