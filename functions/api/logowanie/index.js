import { json, podpisz } from "../../_lib/admin.js";

// Prośba o link do logowania. Odpowiedź jest zawsze taka sama, żeby nie zdradzać,
// czy adres pasuje. Link dostaje tylko ADMIN_EMAIL, najwyżej 5 razy na godzinę.
export async function onRequestPost({ request, env }) {
  const { email } = await request.json().catch(() => ({}));
  const odp = json(200, { komunikat: "Jeśli adres jest właściwy, za chwilę dostaniesz link do logowania. Link działa 15 minut." });
  if (!env.ADMIN_EMAIL || String(email || "").trim().toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) return odp;

  await env.DB.prepare("CREATE TABLE IF NOT EXISTS logowania (nonce TEXT PRIMARY KEY, utworzony_at INTEGER NOT NULL, uzyty INTEGER NOT NULL DEFAULT 0)").run();
  const godzinaTemu = Date.now() - 3600_000;
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM logowania WHERE utworzony_at > ?").bind(godzinaTemu).first();
  if (n >= 5) return odp;

  const nonce = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO logowania (nonce, utworzony_at) VALUES (?, ?)").bind(nonce, Date.now()).run();
  const token = await podpisz(env, { r: "link", n: nonce, exp: Date.now() + 15 * 60_000 });
  const link = `${new URL(request.url).origin}/api/logowanie/potwierdz?t=${encodeURIComponent(token)}`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Panel michalciemiega.pl <panel@michalciemiega.pl>",
      to: [env.ADMIN_EMAIL],
      subject: "Link do panelu voucherów",
      text: `Link do logowania w panelu voucherów (działa 15 minut i tylko raz):\n\n${link}\n\nJeśli to nie Ty prosiłeś o link, zignoruj tę wiadomość.`,
    }),
  });
  return odp;
}
