import { json, sprawdzDostep } from "../../_lib/admin.js";

export async function onRequest(ctx) {
  if (!(await sprawdzDostep(ctx.request, ctx.env))) return json(403, { komunikat: "Brak dostępu." });
  return ctx.next();
}
