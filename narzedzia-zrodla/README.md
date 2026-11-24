Źródło generatora PDF vouchera. Plik functions/_lib/voucher-pdf.js jest gotowym bundlem
(pdf-lib, @pdf-lib/fontkit i czcionki Bodoni Moda oraz Hanken Grotesk w statycznych
instancjach, na licencji SIL Open Font License), zbudowanym poleceniem:

npx esbuild voucher-pdf.src.js --bundle --format=esm --platform=neutral --main-fields=module,main --loader:.ttf=binary --target=es2022 --minify --outfile=functions/_lib/voucher-pdf.js
