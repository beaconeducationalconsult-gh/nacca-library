# MapLearn — four-course learner-safe public preview

An unauthenticated Term 1 explorer with **98 lesson overviews**: Basic 7 Mathematics (24), Basic 7 Science (24), Basic 8 Mathematics (24), and Basic 8 Science (26). Browse a course week by week, follow same-course concept maps, try independently curated interactive models, or use a general 5E presentation timer. The mixtures inquiry is **ungraded** and collects nothing. After a first successful load, the built PWA can open its public catalogue offline.

> **Public preview, not a gradebook or an official NaCCA product.** No sign-in, student accounts, learner records, grades, source assessments, answer keys or teacher-only notes are shipped. Authentication remains deferred; see [TODO-Benched-For-Later.md](TODO-Benched-For-Later.md).

## Run and verify

Requires Node.js 20.19+ or 22.12+ (Vite 8) and Python 3.11+ for catalogue/audit scripts.

```sh
npm ci
npm run catalog                    # regenerate 98 allowlisted overviews
python -m unittest discover -s tests -q  # includes catalogue freshness and boundary tests
npm test                           # JavaScript, routing, model and SSR render tests
python tools/source_audit.py --check docs/source-audit.json
npm run build                      # static PWA in dist/
python tools/check_public_build.py # confirms raw sources/example are not shipped
npm run dev                        # local preview; binds to 0.0.0.0
```

The extractor parses the four supplied Term 1 teaching guides but exports **only allowlisted fields from the lessons before Part C**: titles, weeks, strand/sub-strand, applicable standard and indicator text, learning goals, vocabulary, same-course prerequisite links and phase *minutes* — never source teacher/learner activities, tests, answers, rubrics, resources or personal data. Regeneration must leave `src/data/public-catalog.json` unchanged before publication. Public models live in `src/components/Widgets.jsx` and `src/lib/models.js` and are original ungraded illustrations, not copied assessment items. Attribution appears in the catalogue and app.

**Editorial flags are intentionally unresolved:** B7 Science Lessons 10, 20 and 24 need indicator alignment review (ambiguous codes are withheld); B8 Mathematics Week 12 (Lessons 23–24) follows the lesson plan’s graphs while the corrected scheme lists angles. Flags appear on lesson cards, detail pages, maps and presentation displays. B8 Science has 26 lessons in the plan; some source *notes* incorrectly say “of 24”. The raw-source audit tracks four packs and **44 known findings**; green `--check` means its baseline has not changed, **not** that the raw packs or editorial flags are approved. `python tools/source_audit.py --strict` intentionally fails until discrepancies are resolved. See [docs/phase0-decisions.md](docs/phase0-decisions.md).

## References, rights and deployment

The user authorized **only learner-safe excerpts with attribution** from the supplied B7 Mathematics plan on 2026-09-23 and from B7 Science, B8 Mathematics and B8 Science Term 1 plans on 2026-09-24. This does not license redistribution of the full source files, source assessments, images or other levels. The two referenced HTML files were inspected: `index.html` is the existing Vite shell; the newer `lesson2-binary-compounds-ph.html` was a **standalone source example** with no stated reuse license, a teacher plan, scored quiz/embedded answers and safety issues. At the user's request, this branch sanitizes the tracked example while retaining its visual model as an unvalidated, screen-only design reference. **It is not imported into the app or emitted to `dist/`**; only general layout/interactivity ideas were independently implemented. Its original contents remain reachable in prior Git history; sanitization does not erase history.

Vercel builds the static site (`npm run build` → `dist/`) for `https://nacca-library.vercel.app/`. A Preview deployment alone does not promote a build to the public production domain. Deploy only a reviewed commit through this session’s PR and confirm a Production deployment. Do not serve the repository root or publish raw DOCX/PDF/XLSX/standalone HTML files as site assets. No backend or server secrets are needed for this restricted preview. Future school features require authentication, privacy tests and approved content first.
