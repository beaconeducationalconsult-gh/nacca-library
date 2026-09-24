"""The publicly tracked HTML design reference must not regain source assessments."""

from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class StandaloneExampleTests(unittest.TestCase):
    def test_reference_is_sanitized_and_labelled_unvalidated(self):
        html = (ROOT / "lesson2-binary-compounds-ph.html").read_text(encoding="utf-8")
        for forbidden in (
            "Exit Quiz", "markQuiz", "Mark My Answers", "Teacher activity",
            "Classroom Management", "Pedagogy —", "Taste-safe talk",
            'type="radio"', "Lesson 2: Binary Compounds, Reactions & pH",
        ):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)
        self.assertNotRegex(html, r"\bB[789](?:\.\d+){4}\b")
        self.assertIn("Never taste any substance", html)
        self.assertIn("no verified NaCCA level-specific indicator mapping", html)
        self.assertIn("not part of the public MapLearn app", html)
        self.assertEqual(len(re.findall(r"onclick=\"testSubstance\('[a-z_]+', this\)\"", html)), 9)


if __name__ == "__main__":
    unittest.main()
