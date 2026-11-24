// Wspólne funkcje dla panelu voucherów (/admin/ i /api/admin/).
// Dostęp chroni Cloudflare Access; dodatkowo sprawdzamy podpisany token Access,
// żeby funkcje nie były otwarte, nawet gdyby reguła Access zniknęła.

export function json(status, dane) {
  return new Response(JSON.stringify(dane), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
let certy = null;

export async function sprawdzDostep(request, env) {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAIL) return false;
  const [h, p, sig] = token.split(".");
  if (!sig) return false;
  const naglowek = JSON.parse(new TextDecoder().decode(b64url(h)));
  const tresc = JSON.parse(new TextDecoder().decode(b64url(p)));
  if (!certy) {
    const r = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
    certy = (await r.json()).keys;
  }
  const jwk = certy.find((k) => k.kid === naglowek.kid);
  if (!jwk) { certy = null; return false; }
  const klucz = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", klucz, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return false;
  const aud = Array.isArray(tresc.aud) ? tresc.aud : [tresc.aud];
  if (!aud.includes(env.ACCESS_AUD)) return false;
  if (tresc.exp * 1000 < Date.now()) return false;
  return String(tresc.email || "").toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
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
