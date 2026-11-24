import { json, nowyKod, dodajMiesiace, PAKIETY } from "../../../_lib/admin.js";

const czysc = (v, max = 200) => String(v || "").trim().slice(0, max);

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM vouchery ORDER BY utworzony_at DESC").all();
  return json(200, { vouchery: results });
}

export async function onRequestPost({ request, env }) {
  const d = await request.json().catch(() => ({}));
  const pakiet = czysc(d.pakiet, 20);
  const kupujaca = czysc(d.kupujaca, 150);
  const email = czysc(d.email, 200);
  const dla = czysc(d.dla, 100);
  const dataZakupu = /^\d{4}-\d{2}-\d{2}$/.test(d.data_zakupu || "") ? d.data_zakupu : new Date().toISOString().slice(0, 10);
  if (!PAKIETY.includes(pakiet) || !kupujaca || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { komunikat: "Uzupełnij pakiet, kupującą i poprawny e-mail." });
  }
  const waznyDo = dodajMiesiace(dataZakupu, 12);
  for (let proba = 0; proba < 5; proba++) {
    const kod = nowyKod();
    try {
      await env.DB.prepare("INSERT INTO vouchery (kod, pakiet, kupujaca, email, dla, data_zakupu, wazny_do) VALUES (?,?,?,?,?,?,?)")
        .bind(kod, pakiet, kupujaca, email, dla || null, dataZakupu, waznyDo).run();
      return json(200, { kod });
    } catch (e) {
      if (!String(e).includes("UNIQUE")) throw e;
    }
  }
  return json(500, { komunikat: "Nie udało się nadać kodu." });
}
