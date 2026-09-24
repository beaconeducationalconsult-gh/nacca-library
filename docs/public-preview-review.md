# Four-course preview — review for release

**24 September 2026 · Branch `arena/01a0d0f8-nacca-library` · Review captured before Production deployment**

**Release decision (2026-09-24):** the user approved publication of this *provisional* learner-safe preview with the five affected lessons visibly flagged. The decision is not a curriculum correction or full-pack/gradebook approval.

The latest `main` (`ae90000`, including the new standalone HTML example) was incorporated before editing. No four-course patch was available; the user authorized an independent implementation from the supplied Term 1 source packs. This review covers only the learner-safe preview, **not** the full school release.

## What to look at in the Arena preview (port 4173)

| Course | Overviews | Weeks | Original, ungraded models |
|---|---:|---:|---|
| B7 Mathematics | 24 | 12 | Place value, powers, zero index, fractions (existing) |
| B7 Science | 24 | 12 | Water-cycle explorer |
| B8 Mathematics | 24 | 12 | Place value, line-graph explorer |
| B8 Science | 26 | 13 | Mixtures inquiry on L1–2: choose a model mixture, compare “just mixed” with “after waiting”, no score/response storage |
| **Total** | **98** | | Same-course concept maps and a general timer for every overview |

Start at the four course cards. Choose Week 5 in B7 Science to see the L10 flag, Week 10 for L20, Week 12 for L24; choose Week 12 in B8 Mathematics for the two schedule flags. Open an affected lesson's detail, map and teach display; the editorial warning should remain visible. B8 Science extends to Week 13, Lesson 26. An old link such as `?lesson=14` still opens B7 Mathematics.

### Editorial decisions still open — do not silently resolve

| Public preview item | Why it is flagged | Current safe presentation |
|---|---|---|
| B7 Science L10 | Day/night and year topic versus the plan's Mercury/Venus indicator | Assessment wording removed from title; ambiguous indicator code withheld; warning displayed |
| B7 Science L20 | Integrated cycle recap cites a composite set of standards/indicators | Assessment wording removed; precise codes withheld; overview goal is a safe topic summary; warning displayed |
| B7 Science L24 | Dispersion topic versus a straight-line light-travel indicator | Assessment wording removed; ambiguous indicator code withheld; warning displayed |
| B8 Mathematics Week 12 (L23–24) | Corrected scheme lists angles; lesson plan and tracker use linear graphs | Graph overview is labelled a **provisional plan sequence**; warning displayed on both lessons |

B8 Science's lesson plan has 26 lessons; some *notes* headings say “of 24”. No incorrect source note headings are exported. The 44 raw-source findings remain open; a green baseline check is not a curriculum sign-off.

### Content and reuse boundary

- The user gave narrow permission on 2026-09-24 for attributed, learner-safe B7 Science/B8 Mathematics/B8 Science excerpts, alongside the earlier B7 Mathematics preview permission. The app does **not** redistribute source documents, teacher activities, source assessments, answer keys, rubrics or learner data.
- `index.html` was the existing Vite shell, not a standalone design example. The newly added `lesson2-binary-compounds-ph.html` had no stated reuse licence, a teacher plan, a scored quiz/key, an unverified B7–B9 curriculum claim and unsafe chemical wording. At the user's request, the tracked reference is **sanitized** on this branch (quiz/key and teacher plan removed, on-screen safety warning added); its prior Git history still exists. It is **not** imported, copied into the app or included in the Vercel `dist/` build.
- New models use independently written copy and controls, have no authentication or personal data, and are illustrative rather than laboratory procedures.

### Verification run locally

- `npm run catalog`: **98 overviews**, deterministic regeneration.
- `python -m unittest discover -s tests -q`: **19 passed**, including catalogue freshness, review flags and sanitized-reference guard.
- `npm test`: **7 passed**, including all four courses, links, models and SSR routes.
- `python tools/source_audit.py --check docs/source-audit.json`: **baseline unchanged**, 4 packs and **44 known discrepancies**; full raw release gate **BLOCKED**.
- `npm run format:check` and `git diff --check`: **passed**.
- `npm run build` plus `python tools/check_public_build.py`: **passed**; 10 static output files, no source packs, standalone HTML, scored quiz or answer map. One non-blocking Vite warning notes the main bundle is over 500 kB before gzip (about 161 kB gzipped).

At the time of review, the Vercel Production site still served the earlier **24-lesson B7 Mathematics** preview. Release path: commit/push only this session's branch → PR to `main` → green checks and approved release decision → merge/promote to Vercel Production → verify the public domain shows four courses, flags and the safe bundle. A PR Preview deployment alone is not the production site.
