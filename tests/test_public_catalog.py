"""Guard the exact content boundary of the unauthenticated public catalogue."""

import json
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from build_public_catalog import build_catalog  # noqa: E402

LESSON_KEYS = {
    "id", "number", "week", "unitId", "title", "durationMin", "strand", "subStrand",
    "contentStandard", "indicator", "learningGoal", "vocabulary", "priorLessons", "phaseMinutes", "widgetId",
}


class PublicCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = build_catalog()

    def test_committed_catalog_is_fresh(self):
        committed = json.loads((ROOT / "src/data/public-catalog.json").read_text(encoding="utf-8"))
        self.assertEqual(committed, self.catalog)

    def test_only_narrow_learner_safe_fields_are_exported(self):
        self.assertEqual(set(self.catalog), {"packId", "status", "level", "subject", "term", "source", "units", "lessons"})
        for lesson in self.catalog["lessons"]:
            with self.subTest(lesson=lesson["number"]):
                self.assertEqual(set(lesson), LESSON_KEYS)
                self.assertEqual(set(lesson["indicator"]), {"code", "text"})
                self.assertEqual(set(lesson["contentStandard"]), {"code", "text"})
                self.assertEqual(set(lesson["phaseMinutes"]), {"engage", "explore", "explain", "elaborate", "evaluate"})
                self.assertNotRegex(json.dumps(lesson), r"(?i)\b(?:teacher activity|learner activity|exam question|unit test|marking scheme|answer key|exit ticket|rubric)\b")

    def test_exact_b7_maths_spine_with_12_weeks(self):
        lessons = self.catalog["lessons"]
        self.assertEqual(len(lessons), 24)
        self.assertEqual([lesson["number"] for lesson in lessons], list(range(1, 25)))
        self.assertEqual([lesson["week"] for lesson in lessons], [week for week in range(1, 13) for _ in range(2)])
        self.assertEqual(len({lesson["indicator"]["code"] for lesson in lessons}), 24)
        self.assertEqual(lessons[0]["indicator"]["code"], "B7.1.1.1.1")
        self.assertEqual(lessons[-1]["indicator"]["code"], "B7.1.3.3.4")
        self.assertEqual(self.catalog["subject"], "Mathematics")
        self.assertEqual(self.catalog["level"], "Basic 7")
        self.assertEqual(self.catalog["term"], 1)

    def test_every_phase_and_prior_link_is_bounded(self):
        for lesson in self.catalog["lessons"]:
            with self.subTest(lesson=lesson["number"]):
                self.assertEqual(sum(lesson["phaseMinutes"].values()), 60)
                self.assertEqual(lesson["durationMin"], 60)
                self.assertEqual(lesson["priorLessons"], sorted(set(lesson["priorLessons"])))
                self.assertTrue(all(1 <= n < lesson["number"] for n in lesson["priorLessons"]))
                self.assertTrue(re.fullmatch(r"B7(?:\.\d+){4}", lesson["indicator"]["code"]))

    def test_known_bad_numeric_examples_are_not_exported(self):
        rendered = json.dumps(self.catalog, ensure_ascii=False)
        for false_example in ("⅔ = 75%", "⅔ = 0.75", "10 × 4/3 = 40/3", "0⁰ = 1"):
            self.assertNotIn(false_example, rendered)
        self.assertEqual([l["number"] for l in self.catalog["lessons"] if l["widgetId"]], [1, 12, 14, 17])


if __name__ == "__main__":
    unittest.main()
