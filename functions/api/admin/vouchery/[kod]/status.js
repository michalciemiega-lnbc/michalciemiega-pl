import { json, dodajMiesiace } from "../../../../_lib/admin.js";

export async function onRequestPost({ request, env, params }) {
  const { akcja } = await request.json().catch(() => ({}));
  const v = await env.DB.prepare("SELECT * FROM vouchery WHERE kod = ?").bind(params.kod).first();
  if (!v) return json(404, { komunikat: "Nie ma takiego kodu." });
  if (akcja === "zrealizuj") {
    await env.DB.prepare("UPDATE vouchery SET zrealizowany_at = datetime('now') WHERE kod = ?").bind(v.kod).run();
  } else if (akcja === "cofnij") {
    await env.DB.prepare("UPDATE vouchery SET zrealizowany_at = NULL WHERE kod = ?").bind(v.kod).run();
  } else if (akcja === "przedluz") {
    if (v.przedluzony) return json(400, { komunikat: "Ten voucher był już przedłużony." });
    await env.DB.prepare("UPDATE vouchery SET wazny_do = ?, przedluzony = 1 WHERE kod = ?").bind(dodajMiesiace(v.wazny_do, 3), v.kod).run();
  } else {
    return json(400, { komunikat: "Nieznana akcja." });
  }
  return json(200, { komunikat: "Zapisane." });
}
