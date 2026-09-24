#!/usr/bin/env python3
"""Build four *allowlisted*, learner-safe Term 1 lesson-overview catalogues.

Read only the lesson portion of the supplied plans (before Part C). Never
export teacher/learner activities, assessments, keys, rubrics, resources,
reflection notes, learner records or the standalone HTML design reference.
The raw packs are not approved for grading; unresolved alignments stay visible.
"""

from __future__ import annotations

import json
from pathlib import Path
import re

from source_audit import ROOT, docx_lines, pack_path

OUTPUT = ROOT / "src/data/public-catalog.json"
PHASES = ("ENGAGE", "EXPLORE", "EXPLAIN", "ELABORATE", "EVALUATE")
COLOURS = ("blue", "teal", "violet", "orange", "green")
MATH_UNITS = (
    {"id": "numeration", "name": "Numeration Systems", "range": (1, 5), "colour": "blue"},
    {"id": "operations", "name": "Number Operations", "range": (6, 11), "colour": "teal"},
    {"id": "powers", "name": "Powers", "range": (12, 16), "colour": "violet"},
    {"id": "fractions", "name": "Fractions", "range": (17, 24), "colour": "orange"},
)
COURSES = (
    {"id": "b7-math-t1", "level": 7, "subject": "Mathematics", "lessons": 24, "weeks": 12,
     "widgets": {1: "place-value", 12: "index-explorer", 14: "zero-index", 17: "fractions"}},
    {"id": "b7-science-t1", "level": 7, "subject": "Science", "lessons": 24, "weeks": 12,
     "widgets": {11: "water-cycle"}},
    {"id": "b8-math-t1", "level": 8, "subject": "Mathematics", "lessons": 24, "weeks": 12,
     "widgets": {1: "place-value", 20: "line-graph"}},
    {"id": "b8-science-t1", "level": 8, "subject": "Science", "lessons": 26, "weeks": 13,
     "widgets": {1: "mixtures", 2: "mixtures"}},
)

# These are editorial *warnings*, not corrections to the source documents.
# Suppress ambiguous source codes on B7 Science L10/20/24 instead of claiming
# that the supplied indicator accurately describes the lesson. Strip assessment
# language from their public headings; no assessment content is extracted.
REVIEW = {
    ("b7-science-t1", 10): {
        "title": "Day, Night and the Year — Consolidation",
        "indicator": {"code": None, "text": "The source indicator concerns Mercury and Venus; alignment to this topic needs review."},
        "message": "This recap covers Earth's rotation and revolution, but the source indicator addresses Mercury and Venus. Editorial alignment pending.",
    },
    ("b7-science-t1", 20): {
        "title": "Cycles in Review — Connections Across Systems",
        "learningGoal": "Compare patterns across the water cycle, housefly life cycle and crop production.",
        "contentStandard": {"code": None, "text": "Integrates several cycle standards; exact mapping needs editorial review."},
        "indicator": {"code": None, "text": "Cross-topic recap; exact indicator mapping needs editorial review."},
        "message": "This lesson combines several cycle topics and source indicators. Exact alignment needs editorial review.",
    },
    ("b7-science-t1", 24): {
        "title": "Dispersion — Splitting White Light",
        "indicator": {"code": None, "text": "The source indicator concerns straight-line light travel; alignment to dispersion needs review."},
        "message": "The lesson covers dispersion, while its source indicator names straight-line light travel. Editorial alignment pending.",
    },
    ("b8-math-t1", 23): {
        "message": "Provisional plan sequence: linear graphs here, but the corrected B8 scheme assigns angles to Week 12. Curriculum decision pending.",
    },
    ("b8-math-t1", 24): {
        "message": "Provisional plan sequence: linear graphs here, but the corrected B8 scheme assigns angles to Week 12. Curriculum decision pending.",
    },
}


def field(rows: list[str], label: str) -> str:
    values = [row.split(" | ", 1)[1].strip() for row in rows if row.startswith(label + " | ")]
    if len(values) != 1 or not values[0]:
        raise ValueError(f"Expected exactly one nonempty {label}, found {len(values)}")
    return values[0]


def prior_links(text: str, lesson_number: int, level: int) -> list[int]:
    """Link only earlier lessons in the *same* course; never mislink B7 to B8."""
    links = set()
    for match in re.finditer(r"\bLessons?\s+(\d+)(?:\s*(?:[–-]|to)\s*(\d+))?", text, re.I):
        before = text[max(0, match.start() - 32):match.start()]
        grades = list(re.finditer(r"\bBasic\s+([78])\b", before, re.I))
        if grades and int(grades[-1][1]) != level:
            continue
        start, end = int(match.group(1)), int(match.group(2) or match.group(1))
        if 1 <= start <= end < lesson_number:
            links.update(range(start, end + 1))
    return sorted(links)


def code_and_text(value: str, level: int, parts: int) -> dict[str, str]:
    match = re.fullmatch(rf"(B{level}(?:\.\d+){{{parts}}})\s+[—-]\s+(.+)", value)
    if not match:
        raise ValueError(f"Invalid B{level} code or text: {value[:90]}")
    return {"code": match[1], "text": match[2]}


def unit_name(lesson: dict) -> str:
    name = lesson["subStrand"]
    if ";" in name:
        # A cross-topic recap in B7 Science, not a new official sub-strand.
        return "Connected cycles"
    return re.sub(r"^(?:Number|Algebra):\s*", "", name)


def build_course(spec: dict) -> dict:
    source = pack_path(spec["level"], spec["subject"], "Lesson_Plan_and_Teaching_Guide.docx")
    lines = docx_lines(source)
    headings = [(i, m) for i, row in enumerate(lines) if (m := re.fullmatch(
        r"LESSON\s+(\d+)\s*/\s*Week\s+(\d+)\s*\|\s*(.*?)\s*/\s*(\d+) minutes \(double period\)", row
    ))]
    if len(headings) != spec["lessons"]:
        raise ValueError(f"Expected {spec['lessons']} headings in {source.name}, found {len(headings)}")
    # Never read Part C assessment content into any lesson slice.
    end_of_lessons = next(i for i in range(headings[-1][0] + 1, len(lines))
                          if lines[i].startswith("PART C / ANNEXES"))
    lessons = []
    for index, (start, heading) in enumerate(headings):
        end = headings[index + 1][0] if index + 1 < len(headings) else end_of_lessons
        rows = lines[start:end]
        number, week, title, duration = int(heading[1]), int(heading[2]), heading[3], int(heading[4])
        review = REVIEW.get((spec["id"], number))
        standard_raw, indicator_raw = field(rows, "Content standard"), field(rows, "Indicator(s)")
        if (spec["id"], number) == ("b7-science-t1", 20):
            if not (standard_raw.startswith("B7.2.1.1;") and indicator_raw.startswith("B7.2.1.1.1–.2;")):
                raise ValueError("B7 Science L20 composite mapping has changed; re-review before export")
            standard = review["contentStandard"]
            indicator = review["indicator"]
        else:
            standard = code_and_text(standard_raw, spec["level"], 3)
            source_indicator = code_and_text(indicator_raw, spec["level"], 4)
            if not source_indicator["code"].startswith(standard["code"] + "."):
                raise ValueError(f"Indicator/standard disagree in {source.name} L{number}")
            indicator = review.get("indicator", source_indicator) if review else source_indicator
        minutes = {}
        for row in rows:
            match = re.match(r"^(ENGAGE|EXPLORE|EXPLAIN|ELABORATE|EVALUATE)\s+(\d+) min\s*\|", row)
            if match:
                if match[1].lower() in minutes:
                    raise ValueError(f"Repeated phase in {source.name} L{number}")
                minutes[match[1].lower()] = int(match[2])
        if set(minutes) != {phase.lower() for phase in PHASES} or sum(minutes.values()) != duration:
            raise ValueError(f"Invalid 5E minutes in {source.name} L{number}")
        vocabulary = [word.strip() for word in field(rows, "Key vocabulary").split(",") if word.strip()]
        if not vocabulary:
            raise ValueError(f"No vocabulary in {source.name} L{number}")
        lesson = {
            "id": f"{spec['id']}-l{number:02}",
            "number": number,
            "week": week,
            "unitId": None,
            "title": review.get("title", title) if review else title,
            "durationMin": duration,
            "strand": field(rows, "Strand"),
            "subStrand": field(rows, "Sub-strand"),
            "contentStandard": standard,
            "indicator": indicator,
            "learningGoal": (review.get("learningGoal") if review else None)
                            or field(rows, "Performance indicator (what learners can do)"),
            "vocabulary": vocabulary,
            "priorLessons": prior_links(field(rows, "Prior knowledge"), number, spec["level"]),
            "phaseMinutes": minutes,
            "widgetId": spec["widgets"].get(number),
            "review": {"status": "editorial-review", "message": review["message"]} if review else None,
        }
        # Protect the output against accidental extraction of plan annexes or
        # source-only fields if the DOCX format changes later.
        public_text = " ".join([lesson["title"], lesson["learningGoal"], lesson["strand"],
                                lesson["subStrand"], standard["text"], indicator["text"], *vocabulary])
        if re.search(r"(?i)\b(?:unit test|end-of-term exam|answer key|marking scheme|exit ticket|rubric|teacher activity|learner activity|assessment)\b", public_text):
            raise ValueError(f"Restricted content in {source.name} L{number}; editorial review needed")
        lessons.append(lesson)
    if [lesson["number"] for lesson in lessons] != list(range(1, spec["lessons"] + 1)):
        raise ValueError(f"Lesson numbers are not sequential in {source.name}")
    if [lesson["week"] for lesson in lessons] != [w for w in range(1, spec["weeks"] + 1) for _ in range(2)]:
        raise ValueError(f"Expected two lessons in each of {spec['weeks']} weeks in {source.name}")
    if spec["id"] == "b7-math-t1":
        units = [{"id": unit["id"], "name": unit["name"], "colour": unit["colour"]} for unit in MATH_UNITS]
        for lesson in lessons:
            lesson["unitId"] = next(unit["id"] for unit in MATH_UNITS
                                    if unit["range"][0] <= lesson["number"] <= unit["range"][1])
    else:
        units = []
        previous = None
        for lesson in lessons:
            name = unit_name(lesson)
            if name != previous:
                units.append({"id": f"unit-{len(units) + 1:02}", "name": name,
                              "colour": COLOURS[len(units) % len(COLOURS)]})
                previous = name
            lesson["unitId"] = units[-1]["id"]
    return {
        "id": spec["id"],
        "level": f"Basic {spec['level']}",
        "subject": spec["subject"],
        "term": 1,
        "source": {
            "curriculum": f"NaCCA {spec['subject']} Common Core Programme (B7–B9), September 2020",
            "lessonPlan": source.name,
            "notice": "Learner-safe overview only; full lessons and assessments remain under review.",
        },
        "units": units,
        "lessons": lessons,
    }


def build_catalog() -> dict:
    courses = [build_course(spec) for spec in COURSES]
    if sum(len(course["lessons"]) for course in courses) != 98:
        raise ValueError("Expected 98 public lesson overviews")
    return {
        "catalogId": "b7-b8-math-science-t1-preview",
        "status": "public-preview-not-approved-for-grading",
        "courses": courses,
    }


def main() -> None:
    catalog = build_catalog()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}: "
          f"{sum(len(c['lessons']) for c in catalog['courses'])} learner-safe overviews "
          f"in {len(catalog['courses'])} courses")


if __name__ == "__main__":
    main()
