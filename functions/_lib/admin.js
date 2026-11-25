// Wspólne funkcje dla panelu voucherów (/admin/ i /api/admin/).

export function json(status, dane) {
  return new Response(JSON.stringify(dane), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// Logowanie do panelu: link wysyłany mailem, potem podpisane ciasteczko sesji.
// Podpis HMAC-SHA256 kluczem SESSION_SECRET (zaszyfrowana zmienna w Cloudflare Pages).

const enc = new TextEncoder();
const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const zB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function klucz(env) {
  return crypto.subtle.importKey("raw", enc.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function podpisz(env, dane) {
  const tresc = b64u(enc.encode(JSON.stringify(dane)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await klucz(env), enc.encode(tresc)));
  return `${tresc}.${b64u(sig)}`;
}

export async function sprawdzPodpis(env, token, rodzaj) {
  if (!token || !env.SESSION_SECRET) return null;
  const [tresc, sig] = String(token).split(".");
  if (!sig) return null;
  let ok = false;
  try { ok = await crypto.subtle.verify("HMAC", await klucz(env), zB64u(sig), enc.encode(tresc)); } catch { return null; }
  if (!ok) return null;
  const dane = JSON.parse(new TextDecoder().decode(zB64u(tresc)));
  if (dane.r !== rodzaj || !(dane.exp > Date.now())) return null;
  return dane;
}

export function ciasteczko(request, nazwa) {
  const c = request.headers.get("cookie") || "";
  const m = c.split(/;\s*/).find((x) => x.startsWith(nazwa + "="));
  return m ? m.slice(nazwa.length + 1) : null;
}

export async function sprawdzDostep(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return false;
  }
  return Boolean(await sprawdzPodpis(env, ciasteczko(request, "sesja"), "sesja"));
}

const ZNAKI = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function nowyKod() {
  const los = crypto.getRandomValues(new Uint8Array(8));
  const z = [...los].map((b) => ZNAKI[b % ZNAKI.length]).join("");
  return `MC-${z.slice(0, 4)}-${z.slice(4)}`;
}

const MIESIACE = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
export function dataSlownie(iso) {
  const [r, m, d] = iso.split("-").map(Number);
  return `${d} ${MIESIACE[m - 1]} ${r}`;
}

export function dodajMiesiace(iso, ile) {
  const [r, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(r, m - 1 + ile, d));
  if (dt.getUTCDate() !== d) dt.setUTCDate(0); // np. 31 stycznia + 1 mies. = ostatni dzień lutego
  return dt.toISOString().slice(0, 10);
}

export const PAKIETY = ["Kadr", "Seria", "Opowieść"];
