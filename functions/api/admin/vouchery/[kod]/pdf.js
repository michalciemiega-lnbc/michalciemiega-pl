import { voucherPdf } from "../../../../_lib/voucher-pdf.js";
import { json, dataSlownie } from "../../../../_lib/admin.js";

export async function pobierzFoto(env, request) {
  // Zdjęcie na voucherze: /assets/voucher-foto.jpg, gdy Michał je wybierze.
  const r = await env.ASSETS.fetch(new URL("/assets/voucher-foto.jpg", request.url));
  if (!r.ok || !(r.headers.get("content-type") || "").includes("jpeg")) return null;
  return new Uint8Array(await r.arrayBuffer());
}

export async function zrobPdf(env, request, v) {
  return voucherPdf({ pakiet: v.pakiet, kod: v.kod, waznyDo: dataSlownie(v.wazny_do), dla: v.dla || "" }, await pobierzFoto(env, request));
}

export async function onRequestGet({ request, env, params }) {
  const v = await env.DB.prepare("SELECT * FROM vouchery WHERE kod = ?").bind(params.kod).first();
  if (!v) return json(404, { komunikat: "Nie ma takiego kodu." });
  const pdf = await zrobPdf(env, request, v);
  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="voucher-${v.kod}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
