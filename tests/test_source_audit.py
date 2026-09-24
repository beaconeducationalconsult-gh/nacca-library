"""Phase-0 checks of the *raw* sources; passing is NOT permission to publish."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from source_audit import audit, docx_lines, lesson_codes, pack_path, test_totals, workbook_sheets  # noqa: E402


class SourceAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = audit()
        cls.packs = cls.report["packs"]

    def test_checked_in_raw_source_baseline_is_reproducible(self):
        expected = json.loads((ROOT / "docs/source-audit.json").read_text(encoding="utf-8"))
        self.assertEqual(self.report, expected)
        self.assertEqual(self.report["releaseGate"], "BLOCKED")
        self.assertGreater(len(self.report["findings"]), 0)

    def test_all_four_packs_and_stepping_stones(self):
        expected = {
            "b7-mathematics-t1": (24, 24, 12, 140),
            "b7-science-t1": (24, 17, 12, 170),
            "b8-mathematics-t1": (24, 21, 12, 140),
            "b8-science-t1": (26, 22, 13, 140),
        }
        self.assertEqual(set(self.packs), set(expected))
        for name, (lessons, indicators, weeks, classwork) in expected.items():
            with self.subTest(pack=name):
                pack = self.packs[name]
                self.assertEqual((pack["lessons"], pack["lessonNotes"], pack["indicators"],
                                  pack["weeksTeaching"], pack["classworkMax"]),
                                 (lessons, lessons, indicators, weeks, classwork))
                self.assertEqual(pack["indicatorLessonLinks"], lessons)
                self.assertEqual(pack["phaseTotals"], {"60": lessons})

    def test_phase_timings_are_read_from_each_pack_not_hard_coded(self):
        self.assertEqual(self.packs["b7-science-t1"]["phaseSchedules"], {"8/18/12/12/10": 24})
        self.assertEqual(self.packs["b7-mathematics-t1"]["phaseSchedules"], {"8/16/14/12/10": 24})
        self.assertEqual(self.packs["b8-science-t1"]["phaseSchedules"], {"8/16/14/12/10": 26})

    def test_printed_unit_marks_and_tracker_maxima_are_distinguished(self):
        expected = {
            "b7-mathematics-t1": ([20, 29, 20, 37], [20, 30, 20, 30]),
            "b7-science-t1": ([24, 20, 30, 24], [20, 20, 30, 20]),
            "b8-mathematics-t1": ([20, 34, 22, 31], [20, 20, 30, 30]),
            "b8-science-t1": ([28, 29, 32, 43], [20, 20, 30, 30]),
        }
        for name, (printed, tracker) in expected.items():
            with self.subTest(pack=name):
                tests = self.packs[name]["tests"]
                self.assertEqual([tests[f"UT{i}"]["itemSum"] for i in range(1, 5)], printed)
                self.assertEqual([tests[f"UT{i}"]["trackerMax"] for i in range(1, 5)], tracker)
        self.assertEqual(sum(f["code"] == "UNIT_MARKS" for f in self.report["findings"]), 11)

    def test_exam_totals_are_not_confused_with_claimed_maxima(self):
        self.assertEqual({name: (p["exam"]["declared"], p["exam"]["itemSum"], p["exam"]["trackerMax"])
                          for name, p in self.packs.items()}, {
            "b7-mathematics-t1": (100, 50, 100),
            "b7-science-t1": (50, 70, 100),
            "b8-mathematics-t1": (100, 79, 100),
            "b8-science-t1": (100, 78, 100),
        })

    def test_intended_multi_lesson_indicator_coverage_is_not_an_error(self):
        science = self.packs["b8-science-t1"]
        self.assertEqual(science["repeatedIndicators"]["B8.1.1.1.1"], [1, 2])
        self.assertEqual(science["repeatedIndicators"]["B8.4.1.3.1"], [17, 18])
        self.assertEqual(len(science["repeatedIndicators"]), 4)
        self.assertFalse(any(f["code"] == "INDICATOR_MISMATCH" for f in self.report["findings"]))

    def test_cross_source_conflicts_are_still_blocking(self):
        conflicts = {(f["pack"], f["code"]) for f in self.report["findings"]}
        self.assertIn(("b7-mathematics-t1", "SCHEME_CALENDAR"), conflicts)
        self.assertIn(("b8-mathematics-t1", "SCHEME_INDICATORS"), conflicts)
        self.assertIn(("b8-science-t1", "NOTES_LABEL"), conflicts)
        self.assertIn(("b8-science-t1", "WEEKLY_RECORD_LEVEL"), conflicts)

    def test_worksheet_reader_can_read_corrected_rows_without_excel(self):
        workbook = workbook_sheets(ROOT / "Mathematics_Schemes_B4-B8_Full_Text_v3_CORRECTED.xlsx",
                                   {"B7 CORRECTED", "B8 CORRECTED"})
        self.assertEqual(workbook["B7 CORRECTED"]["C16"], "EXAMINATION")
        self.assertEqual(workbook["B8 CORRECTED"]["E13"], "B8.3.1.1")

    def test_lesson_reference_ranges(self):
        self.assertEqual(lesson_codes("L1–L3, L5, L8-L9"), [1, 2, 3, 5, 8, 9])
        self.assertEqual(lesson_codes("—"), [])
        with self.assertRaises(ValueError):
            lesson_codes("L10-L3")

    def test_unmarked_item_is_not_silently_skipped(self):
        lines = docx_lines(pack_path(7, "Science", "Lesson_Plan_and_Teaching_Guide.docx"))
        index = next(i for i, line in enumerate(lines) if line.startswith("1.  Which of the following is a gas?"))
        altered = lines.copy()
        altered[index] = altered[index].replace("[1]", "[marks missing]")
        with self.assertRaisesRegex(ValueError, "Unreadable question marks"):
            test_totals(altered)

    def test_strict_gate_fails_even_when_raw_baseline_is_current(self):
        process = subprocess.run([sys.executable, str(ROOT / "tools/source_audit.py"), "--strict"],
                                 cwd=ROOT, capture_output=True, text=True, check=False)
        self.assertEqual(process.returncode, 1)
        self.assertIn("release gate: BLOCKED", process.stdout)

    def test_unreviewed_baseline_change_fails_ci(self):
        with tempfile.TemporaryDirectory() as directory:
            stale = Path(directory) / "stale.json"
            stale.write_text("{}\n", encoding="utf-8")
            process = subprocess.run([sys.executable, str(ROOT / "tools/source_audit.py"),
                                      "--check", str(stale)], cwd=ROOT, capture_output=True,
                                     text=True, check=False)
        self.assertEqual(process.returncode, 1)
        self.assertIn("Raw-source findings changed", process.stderr)


if __name__ == "__main__":
    unittest.main()
