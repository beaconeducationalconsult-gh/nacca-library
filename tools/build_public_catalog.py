#!/usr/bin/env python3
"""Extract a *minimal, learner-safe* B7 Maths catalogue for the public preview.

Never exports teacher activity, assessments, test/exam content, answers, marking
schemes, rubrics, checklists, notes, or learner records. This is a deliberately
restricted metadata catalogue, not an approved full lesson import.
"""

from __future__ import annotations

import json
from pathlib import Path
import re

from source_audit import ROOT, docx_lines, pack_path

OUTPUT = ROOT / "src/data/public-catalog.json"
SOURCE = pack_path(7, "Mathematics", "Lesson_Plan_and_Teaching_Guide.docx")
PHASES = ("ENGAGE", "EXPLORE", "EXPLAIN", "ELABORATE", "EVALUATE")
UNITS = [
    {"id": "numeration", "name": "Numeration Systems", "range": [1, 5], "colour": "blue"},
    {"id": "operations", "name": "Number Operations", "range": [6, 11], "colour": "teal"},
    {"id": "powers", "name": "Powers", "range": [12, 16], "colour": "violet"},
    {"id": "fractions", "name": "Fractions", "range": [17, 24], "colour": "orange"},
]
WIDGET_LESSONS = {1: "place-value", 12: "index-explorer", 14: "zero-index", 17: "fractions"}


def field(rows: list[str], label: str) -> str:
    values = [row.split(" | ", 1)[1].strip() for row in rows if row.startswith(label + " | ")]
    if len(values) != 1:
        raise ValueError(f"Expected exactly one {label}, found {len(values)}")
    return values[0]


def prior_links(text: str, lesson_number: int) -> list[int]:
    links = set()
    for match in re.finditer(r"\bLessons?\s+(\d+)(?:\s*[–-]\s*(\d+))?", text, re.I):
        start, end = int(match.group(1)), int(match.group(2) or match.group(1))
        links.update(range(start, end + 1))
    return sorted(n for n in links if 1 <= n < lesson_number)


def build_catalog() -> dict:
    lines = docx_lines(SOURCE)
    headings = [(i, m) for i, row in enumerate(lines)
                if (m := re.match(r"^LESSON\s+(\d+)\s*/\s*Week\s+(\d+)\s*\|\s*(.*?)\s*/\s*(\d+) minutes", row))]
    if len(headings) != 24:
        raise ValueError(f"Expected 24 B7 Maths lessons, got {len(headings)}")
    lessons = []
    for index, (start, heading) in enumerate(headings):
        end = headings[index + 1][0] if index + 1 < len(headings) else next(
            i for i in range(start + 1, len(lines)) if lines[i].startswith("PART C / ANNEXES"))
        rows = lines[start:end]
        number, week, title, duration = int(heading[1]), int(heading[2]), heading[3], int(heading[4])
        unit = next(u for u in UNITS if u["range"][0] <= number <= u["range"][1])
        standard = field(rows, "Content standard")
        indicator = field(rows, "Indicator(s)")
        scode = re.match(r"^(B7(?:\.\d+){3})\s+[—-]\s+(.+)$", standard)
        icode = re.match(r"^(B7(?:\.\d+){4})\s+[—-]\s+(.+)$", indicator)
        if not scode or not icode or not icode[1].startswith(scode[1] + "."):
            raise ValueError(f"Invalid standard/indicator in lesson {number}")
        minutes = {}
        for row in rows:
            match = re.match(r"^(ENGAGE|EXPLORE|EXPLAIN|ELABORATE|EVALUATE)\s+(\d+) min\s*\|", row)
            if match:
                minutes[match[1].lower()] = int(match[2])
        if set(minutes) != {phase.lower() for phase in PHASES} or sum(minutes.values()) != duration:
            raise ValueError(f"Invalid 5E minutes in lesson {number}")
        vocabulary = [part.strip() for part in field(rows, "Key vocabulary").split(",") if part.strip()]
        if not vocabulary:
            raise ValueError(f"No vocabulary in lesson {number}")
        lessons.append({
            "id": f"b7-math-t1-l{number:02}",
            "number": number,
            "week": week,
            "unitId": unit["id"],
            "title": title,
            "durationMin": duration,
            "strand": field(rows, "Strand"),
            "subStrand": field(rows, "Sub-strand"),
            "contentStandard": {"code": scode[1], "text": scode[2]},
            "indicator": {"code": icode[1], "text": icode[2]},
            "learningGoal": field(rows, "Performance indicator (what learners can do)"),
            "vocabulary": vocabulary,
            "priorLessons": prior_links(field(rows, "Prior knowledge"), number),
            "phaseMinutes": minutes,
            "widgetId": WIDGET_LESSONS.get(number),
        })
    if [lesson["number"] for lesson in lessons] != list(range(1, 25)):
        raise ValueError("Lesson numbers are not unique or sequential")
    if any(sum(lesson["week"] == week for lesson in lessons) != 2 for week in range(1, 13)):
        raise ValueError("Expected two B7 Maths lessons in each of 12 teaching weeks")
    return {
        "packId": "b7-math-t1-preview",
        "status": "public-preview-not-approved-for-grading",
        "level": "Basic 7",
        "subject": "Mathematics",
        "term": 1,
        "source": {
            "curriculum": "NaCCA Mathematics Common Core Programme (B7–B9), September 2020",
            "lessonPlan": SOURCE.name,
            "notice": "Learner-safe metadata excerpt only; full lessons and assessments remain under review.",
        },
        "units": [{"id": u["id"], "name": u["name"], "colour": u["colour"]} for u in UNITS],
        "lessons": lessons,
    }


def main() -> None:
    catalog = build_catalog()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}: {len(catalog['lessons'])} learner-safe lesson overviews")


if __name__ == "__main__":
    main()
