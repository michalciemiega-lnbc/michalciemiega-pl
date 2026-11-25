export function onRequestPost() {
  return new Response(null, {
    status: 204,
    headers: { "set-cookie": "sesja=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" },
  });
}
