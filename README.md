# MapLearn — Basic 7 Mathematics public preview

A learner-safe, **unauthenticated** teaching-and-learning explorer for Basic 7 Mathematics, Term 1. Browse all 24 lessons over 12 weeks, follow their indicator-linked concept maps, use four interactive number/fraction models, or put a 5E timer on a classroom screen. The built PWA can open its public catalogue offline after a successful first load.

> **Public preview, not a gradebook or an official NaCCA product.** No sign-in, student accounts, learner records, grades, tests, answer keys or teacher-only notes are shipped. Authentication was deliberately deferred by user request; see [TODO-Benched-For-Later.md](TODO-Benched-For-Later.md).

## Run it

Requires Node.js 20.19+ or 22.12+ (Vite 8) and Python 3.11+ for the catalogue/audit scripts.

```sh
npm ci
npm run dev          # bind to 0.0.0.0, default port 5173
npm run build        # static PWA in dist/
npm run preview      # inspect the production build
npm test             # public maths/UI utility tests
python -m unittest discover -s tests -q
python tools/source_audit.py --check docs/source-audit.json
```

The source documents remain unchanged. Regenerate the allowlisted public data with `npm run catalog`; review the resulting `src/data/public-catalog.json` diff before publishing. The extractor **only** exports B7 Maths lesson headings, strand/sub-strand, standards and indicators, learning goals, key vocabulary, prerequisite lesson numbers and phase *minutes*. Teacher activities, learner activities, tests, answers, rubrics and personal data are not included. Four ungraded models in `src/components/Widgets.jsx` are independently curated and tested. Attribution appears in the app and catalogue.

The raw-source audit tracks four Term 1 packs (B7/B8 Maths/Science) and **44 known findings**; its green `--check` means the baseline has not changed, **not** that the raw packs are publication-ready. `python tools/source_audit.py --strict` intentionally fails until discrepancies are resolved. See [docs/phase0-decisions.md](docs/phase0-decisions.md) and [the design document](PDD_NaCCA_Teaching_and_Learning_Portal.md).

## Preview and deployment

The UI is a static Vite app (`npm run build` → `dist/`). `vercel.json` supports the selected Vercel static host, `https://nacca-library.vercel.app/`. Vercel must deploy the build from a commit promoted to **Production** (or the Vercel project's configured production branch). A Vercel Preview deployment alone may be access-protected and does not make the public domain live. HTTPS is needed for PWA service workers. **Do not** publish the repository's raw DOCX/PDF/XLSX files as site assets. No server secrets or API are required for this restricted preview. Any real school features require authentication, author/editor approvals and privacy testing first.

This repository also contains the original NaCCA PDFs, school plans, assessment trackers and a draft PDD; those source materials are not copied into the app build. Rights approval covers only the learner-safe excerpts included in this preview, with attribution. No redistribution license is inferred for the source files or other packs.
