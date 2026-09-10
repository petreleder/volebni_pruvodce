# Volby 2026 — Praha, Brno, Pardubice

Databáze kandidátek ke **komunálním a senátním volbám 9.–10. října 2026** (2. kolo Senátu 16.–17. 10.).

Otevři `index.html` v prohlížeči (nebo GitHub Pages). Filtry: město, typ, obvod, fulltext. Klik na řádek otevře detail.

## Co v datech je

- **Zastupitelstvo Prahy** — 24 registrovaných listin, lídři, 2022, témata, stopy, kauzy, lustrace programu
- **Zastupitelstvo Brna** — 16 listin
- **Zastupitelstvo Pardubic** — 9 listin
- **Senát 2026** jen obvody, kde se volí a spadají sem: **21 Praha 5, 24 Praha 9, 27 Praha 1, 60 Brno-město**
- V **Pardubicích se senátor letos nevolí** (obvod 43 není v letošní třetině)
- **Městské části/obvody** — kandidátky a lídři z otevřených dat ČSÚ (KV 2026), výsledky 2022 tam, kde šla značka spárovat

## Lustrace programu

U každé listiny tři koše:

1. **Mohou ovlivnit** — kompetence města / MČ, u Senátu zákony
2. **Nerozhodují o tom** — stát, daně, armáda, ústava…
3. **Mohou prosazovat výš** — tlak na kraj, Sněmovnu, vládu, SŽ

## Soubory

| Soubor | Účel |
| --- | --- |
| `index.html` | Tabulka |
| `data.js` / `data/volby.json` | Data |
| `scripts/generate_data.py` | Magistrát + senát |
| `scripts/enrich_programs.py` | Rozbor programů + lustrace kompetencí |

## GitHub Pages

Settings → Pages → root. Nebo jen klon a otevřít HTML.
