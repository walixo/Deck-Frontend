# Handbook generator

One source, three outputs. `content.js` holds the handbook as structured data;
the two scripts render it.

```
node scripts/handbook/pdf.cjs     # → Deck-Handbook.pdf
node scripts/handbook/docx.cjs    # → Deck-Handbook.docx
```

The previous handbook was hand-written HTML printed to PDF. That is why it had
drifted so far — it claimed 11 models and 26 pages against a repository holding
17 and 42 — and why adding a DOCX would have meant a third hand-kept copy.

`fonts/` holds Archivo Black, Geist and Geist Mono converted from the `@fontsource`
woff2 packages the site itself loads, so the PDF is set in Deck's real typefaces
rather than a substitute. Regenerate them with:

```
python3 -c "
from fontTools.ttLib import TTFont
f = TTFont('Frontend/node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2')
f.flavor = None
f.save('scripts/handbook/fonts/ArchivoBlack.ttf')"
```

Numbers in `content.js` are counted by hand from the repository. Check them
before a release:

```
ls Backend/src/models/*.ts | wc -l
grep -rhoE "router\.(get|post|patch|put|delete)\(" Backend/src/routes/*.ts | wc -l
find Frontend/src/pages -name '*.tsx' | wc -l
```

Both scripts need `pdfkit` and `docx`. They are not in either package's
dependencies on purpose — nothing at runtime uses them, and adding two
document libraries to the app's install for a script run a few times a year is
the kind of weight that never comes back off:

```
npm install --no-save pdfkit docx
```
