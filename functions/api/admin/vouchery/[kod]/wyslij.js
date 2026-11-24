import { json, dataSlownie } from "../../../../_lib/admin.js";
import { zrobPdf } from "./pdf.js";

const OD = "Michał Ciemięga <michal@michalciemiega.pl>";
const KOPIA = "michal@michalciemiega.pl";

export async function onRequestPost({ request, env, params }) {
  const v = await env.DB.prepare("SELECT * FROM vouchery WHERE kod = ?").bind(params.kod).first();
  if (!v) return json(404, { komunikat: "Nie ma takiego kodu." });
  const pdf = await zrobPdf(env, request, v);
  let bin = ""; for (const b of pdf) bin += String.fromCharCode(b);

  const tekst =
`Dzień dobry,

w załączniku przesyłam voucher na sesję w pakiecie ${v.pakiet}. Kod vouchera to ${v.kod}, a voucher jest ważny do ${dataSlownie(v.wazny_do)}. Fakturę wyślę osobną wiadomością.

Aby umówić sesję, wystarczy wypełnić formularz na michalciemiega.pl i wpisać w nim kod. Rodzaj sesji i termin osoba obdarowana wybiera sama. Voucher można przekazać innej osobie.

Dziękuję i pozdrawiam
Michał Ciemięga
michalciemiega.pl`;

  const odp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: OD,
      to: [v.email],
      bcc: [KOPIA],
      reply_to: KOPIA,
      subject: `Voucher na sesję – ${v.pakiet}`,
      text: tekst,
      attachments: [{ filename: `voucher-${v.kod}.pdf`, content: btoa(bin) }],
    }),
  });
  if (!odp.ok) return json(502, { komunikat: "Resend nie przyjął wiadomości.", szczegoly: (await odp.text()).slice(0, 300) });
  await env.DB.prepare("UPDATE vouchery SET wyslany_at = datetime('now') WHERE kod = ?").bind(v.kod).run();
  return json(200, { komunikat: `Voucher wysłany na ${v.email}.` });
}
