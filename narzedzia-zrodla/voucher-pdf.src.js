// Źródło generatora PDF vouchera. Bundlowane esbuildem do functions/_lib/voucher-pdf.js
// (npm run nie istnieje w Pages bez kroku budowania, więc trzymamy gotowy bundle).
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import bodoniDisplay from "./BodoniModa-Display.ttf";
import bodoniText from "./BodoniModa-Text.ttf";
import hankenReg from "./HankenGrotesk-Regular.ttf";
import hankenSemi from "./HankenGrotesk-SemiBold.ttf";

const MM = 72 / 25.4;
const W = 210 * MM, H = 148 * MM;
const PAPIER = rgb(0.969, 0.969, 0.961);
const GRAFIT = rgb(0.122, 0.122, 0.118);
const SREBRO = rgb(0.42, 0.412, 0.396);

export const ZAKRESY = {
  Kadr: ["1 godzina w studiu", "8 zdjęć po obróbce"],
  Seria: ["2,5 godziny w studiu", "15 zdjęć po obróbce"],
  "Opowieść": ["4 godziny w studiu", "25 zdjęć po obróbce", "makijaż i fryzura od wizażystki"],
};

function zawijaj(tekst, font, rozmiar, szer) {
  const slowa = tekst.split(" "); const linie = []; let l = "";
  for (const s of slowa) {
    const p = l ? l + " " + s : s;
    if (font.widthOfTextAtSize(p, rozmiar) > szer && l) { linie.push(l); l = s; } else l = p;
  }
  if (l) linie.push(l);
  return linie;
}

// dane: { pakiet, kod, waznyDo (tekst), dla (opcjonalnie) }, foto: Uint8Array JPEG albo null
export async function voucherPdf(dane, foto) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Voucher ${dane.pakiet} – ${dane.kod}`);
  doc.setAuthor("Michał Ciemięga");
  const fDisp = await doc.embedFont(bodoniDisplay, { subset: true });
  const fText = await doc.embedFont(bodoniText, { subset: true });
  const fReg = await doc.embedFont(hankenReg, { subset: true });
  const fSemi = await doc.embedFont(hankenSemi, { subset: true });
  const s = doc.addPage([W, H]);

  s.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPIER });

  // Lewa kolumna: zdjęcie albo szare tło w stylu strony
  const LW = 88 * MM;
  if (foto) {
    const img = await doc.embedJpg(foto);
    const skala = Math.max(LW / img.width, H / img.height);
    const w = img.width * skala, h = img.height * skala;
    s.pushOperators();
    s.drawRectangle({ x: 0, y: 0, width: LW, height: H, color: PAPIER });
    // przycinamy do kolumny: rysujemy wyśrodkowane i zasłaniamy nadmiar prawą kolumną poniżej
    s.drawImage(img, { x: (LW - w) / 2, y: (H - h) / 2, width: w, height: h });
    s.drawRectangle({ x: LW, y: 0, width: W - LW, height: H, color: PAPIER });
  } else {
    const kroki = 60;
    for (let i = 0; i < kroki; i++) {
      const t = i / (kroki - 1); // 0 dół, 1 góra
      const v = 0.62 + 0.23 * t;
      s.drawRectangle({ x: 0, y: (H / kroki) * i, width: LW, height: H / kroki + 0.5, color: rgb(v, v * 0.995, v * 0.98) });
    }
  }

  const x = LW + 12 * MM, szer = W - x - 12 * MM;
  let y = H - 12 * MM - 9;
  s.drawText("Michał Ciemięga", { x, y, size: 11, font: fText, color: GRAFIT });
  y -= 9 * MM + 10;
  s.drawText("Voucher na sesję w studiu", { x, y, size: 8.5, font: fReg, color: SREBRO });
  y -= 42;
  s.drawText(dane.pakiet, { x, y, size: 40, font: fDisp, color: GRAFIT });
  y -= 22;
  for (const linia of ZAKRESY[dane.pakiet] || []) {
    s.drawText(linia, { x, y, size: 9.5, font: fReg, color: GRAFIT });
    y -= 13.8;
  }
  if (dane.dla) {
    y -= 6 * MM + 4;
    s.drawText("Dla " + dane.dla, { x, y, size: 14, font: fText, color: GRAFIT });
  }

  // Dół: zasady, kod i ważność
  const jak = "Aby umówić sesję, wejdź na michalciemiega.pl, wypełnij formularz zapytania i wpisz kod. " +
    "Rodzaj sesji i termin wybierasz sama. Voucher można przekazać innej osobie, ale nie można wymienić go na gotówkę. " +
    "Pełne zasady są w regulaminie na stronie.";
  const linie = zawijaj(jak, fReg, 7.5, szer);
  let yb = 10 * MM;
  for (let i = linie.length - 1; i >= 0; i--) {
    s.drawText(linie[i], { x, y: yb, size: 7.5, font: fReg, color: SREBRO });
    yb += 10.9;
  }
  yb += 3.5 * MM;
  const kol = x + 22 * MM;
  s.drawText("Ważny do", { x, y: yb, size: 9, font: fReg, color: SREBRO });
  s.drawText(dane.waznyDo, { x: kol, y: yb, size: 9, font: fSemi, color: GRAFIT });
  yb += 14;
  s.drawText("Kod", { x, y: yb, size: 9, font: fReg, color: SREBRO });
  s.drawText(dane.kod, { x: kol, y: yb, size: 9, font: fSemi, color: GRAFIT });
  yb += 14;
  s.drawLine({ start: { x, y: yb }, end: { x: x + szer, y: yb }, thickness: 0.85, color: GRAFIT });

  return await doc.save();
}
