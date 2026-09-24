"""Guard the exact content boundary of the unauthenticated public catalogue."""

import json
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from build_public_catalog import build_catalog, prior_links  # noqa: E402

LESSON_KEYS = {
    "id", "number", "week", "unitId", "title", "durationMin", "strand", "subStrand",
    "contentStandard", "indicator", "learningGoal", "vocabulary", "priorLessons",
    "phaseMinutes", "widgetId", "review",
}
COUNTS = {"b7-math-t1": (24, 12), "b7-science-t1": (24, 12),
          "b8-math-t1": (24, 12), "b8-science-t1": (26, 13)}
REVIEWED = {"b7-science-t1": {10, 20, 24}, "b8-math-t1": {23, 24}}


class PublicCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = build_catalog()
        cls.courses = {course["id"]: course for course in cls.catalog["courses"]}

    def test_committed_catalog_is_fresh(self):
        committed = json.loads((ROOT / "src/data/public-catalog.json").read_text(encoding="utf-8"))
        self.assertEqual(committed, self.catalog)

    def test_four_complete_independent_course_spines(self):
        self.assertEqual(set(self.catalog), {"catalogId", "status", "courses"})
        self.assertEqual(set(self.courses), set(COUNTS))
        self.assertEqual(sum(len(c["lessons"]) for c in self.courses.values()), 98)
        self.assertEqual(len({l["id"] for c in self.courses.values() for l in c["lessons"]}), 98)
        for course_id, (count, weeks) in COUNTS.items():
            with self.subTest(course=course_id):
                course = self.courses[course_id]
                self.assertEqual(set(course), {"id", "level", "subject", "term", "source", "units", "lessons"})
                self.assertEqual(set(course["source"]), {"curriculum", "lessonPlan", "notice"})
                self.assertEqual(course["term"], 1)
                self.assertEqual(len(course["lessons"]), count)
                self.assertEqual([l["number"] for l in course["lessons"]], list(range(1, count + 1)))
                self.assertEqual([l["week"] for l in course["lessons"]],
                                 [w for w in range(1, weeks + 1) for _ in range(2)])
                self.assertEqual(len(course["units"]), len({u["id"] for u in course["units"]}))
                self.assertTrue(all(set(u) == {"id", "name", "colour"} for u in course["units"]))

    def test_only_narrow_learner_safe_fields_are_exported(self):
        for course_id, course in self.courses.items():
            units = {unit["id"] for unit in course["units"]}
            for lesson in course["lessons"]:
                with self.subTest(course=course_id, lesson=lesson["number"]):
                    self.assertEqual(set(lesson), LESSON_KEYS)
                    self.assertIn(lesson["unitId"], units)
                    self.assertEqual(set(lesson["indicator"]), {"code", "text"})
                    self.assertEqual(set(lesson["contentStandard"]), {"code", "text"})
                    self.assertEqual(set(lesson["phaseMinutes"]),
                                     {"engage", "explore", "explain", "elaborate", "evaluate"})
                    rendered = json.dumps(lesson, ensure_ascii=False)
                    self.assertNotRegex(rendered,
                        r"(?i)\b(?:teacher activity|learner activity|exam question|unit test|marking scheme|answer key|exit ticket|rubric|quiz|markQuiz)\b")
                    self.assertTrue(lesson["title"] and lesson["learningGoal"] and lesson["vocabulary"])
                    self.assertEqual(sum(lesson["phaseMinutes"].values()), lesson["durationMin"])
                    self.assertEqual(lesson["durationMin"], 60)
                    self.assertEqual(lesson["priorLessons"], sorted(set(lesson["priorLessons"])))
                    self.assertTrue(all(1 <= n < lesson["number"] for n in lesson["priorLessons"]))
                    if lesson["indicator"]["code"]:
                        self.assertRegex(lesson["indicator"]["code"],
                                         rf"^B{course['level'][-1]}(?:\.\d+){{4}}$")
                        self.assertTrue(lesson["indicator"]["code"].startswith(
                            lesson["contentStandard"]["code"] + "."))
                    else:
                        self.assertEqual(course_id, "b7-science-t1")
                        self.assertIn(lesson["number"], {10, 20, 24})

    def test_required_editorial_review_is_visible_and_not_approved(self):
        for course_id, course in self.courses.items():
            flagged = {l["number"] for l in course["lessons"] if l["review"]}
            self.assertEqual(flagged, REVIEWED.get(course_id, set()))
            for lesson in course["lessons"]:
                if lesson["review"]:
                    self.assertEqual(lesson["review"]["status"], "editorial-review")
                    self.assertTrue(lesson["review"]["message"])
        science = self.courses["b7-science-t1"]["lessons"]
        self.assertIsNone(science[19]["contentStandard"]["code"])
        self.assertTrue(all(science[n - 1]["indicator"]["code"] is None for n in (10, 20, 24)))
        self.assertTrue(all("Assessment" not in science[n - 1]["title"] for n in (10, 20, 24)))
        maths = self.courses["b8-math-t1"]["lessons"]
        self.assertTrue(all("angles" in maths[n - 1]["review"]["message"] for n in (23, 24)))
        self.assertEqual(maths[22]["week"], 12)
        self.assertEqual(maths[23]["week"], 12)

    def test_b7_math_still_has_original_spine_and_safe_models(self):
        maths = self.courses["b7-math-t1"]["lessons"]
        self.assertEqual(len({l["indicator"]["code"] for l in maths}), 24)
        self.assertEqual(maths[0]["indicator"]["code"], "B7.1.1.1.1")
        self.assertEqual(maths[-1]["indicator"]["code"], "B7.1.3.3.4")
        self.assertEqual([l["number"] for l in maths if l["widgetId"]], [1, 12, 14, 17])
        rendered = json.dumps(maths, ensure_ascii=False)
        for false_example in ("⅔ = 75%", "⅔ = 0.75", "10 × 4/3 = 40/3", "0⁰ = 1"):
            self.assertNotIn(false_example, rendered)
        self.assertEqual(self.courses["b8-science-t1"]["lessons"][-1]["number"], 26)

    def test_prerequisites_never_cross_course_or_link_to_future(self):
        self.assertEqual(prior_links("Lessons 11 to 19 — review", 20, 7), list(range(11, 20)))
        self.assertEqual(prior_links("Basic 7 Lessons 1–2; Basic 8 Lessons 3–4", 8, 8), [3, 4])
        self.assertEqual(self.courses["b7-science-t1"]["lessons"][19]["priorLessons"], list(range(11, 20)))


if __name__ == "__main__":
    unittest.main()
