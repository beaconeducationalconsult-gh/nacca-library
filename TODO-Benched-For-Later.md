# TODO — Benched for Later

**Release context (2026-09-23):** The user explicitly chose to launch a public, **unauthenticated**, learner-safe Basic 7 Mathematics preview first. Authentication was intentionally left out to meet the launch window. This list is not a claim that the following features are safe to use now.

## Before school accounts, marks, or private content

- [ ] **Authentication and authorization (intentionally omitted today):** establish school tenancy, teacher/learner roles, trusted assignment records, learner isolation and tested access policies. Never gate staff-only assets merely by hiding a button in the public UI.
- [ ] **Privacy and data retention:** obtain the school privacy lead's sign-off for consent, minimal learner profiles, access/erasure, shared devices, server-only audit and offline cache clearing. No learner names, marks or accounts are collected in the preview.
- [ ] **Assessments and answer keys:** reconcile all raw tests/exam maxima and incorrect examples, obtain author-approved keys and mapping, separate teacher-only packs, run exact item/maxima validators and permission tests before exposing any assessed content.
- [ ] **Grading and reports:** implement only after assessment sign-off and access controls; no unreviewed grades, whole-class mark displays, or inferred score scaling.
- [ ] **Curriculum schedule decisions:** resolve disputed tests, examination/vacation weeks and B8 mismatches individually with the curriculum authority before assigning lessons to real classes.
- [ ] **Human content review:** approve any fuller lesson text, diagrams or generated maps beyond this allowlisted metadata and four curated models; fix known source mistakes. Keep provenance, corrections and versioned sign-offs.
- [ ] **Teacher-only workflow:** implement period splitting, editable notes, GES exports and secure teacher screens only after header/field corrections and user testing.
- [ ] **Pilot operations:** verify on real low-bandwidth/shared devices, offline update recovery, accessibility and teacher usability. Configure monitoring and a documented rollback for any school deployment.

The public preview is not an official NaCCA product or a secure school production system. See [docs/phase0-decisions.md](docs/phase0-decisions.md) for source discrepancies and unresolved decisions.
