#!/usr/bin/env python3
"""Audit the *raw* DOCX/XLSX source packs without changing or publishing them.

Uses only Python's standard library. This is a discovery/triage tool, NOT the
validator for an approved, learner-safe content pack. Known source errors are
recorded in docs/source-audit.json; --check detects an unreviewed change to that
baseline, while --strict deliberately fails as long as blockers remain.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import posixpath
import re
import sys
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
WORD = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
SHEET = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
PKG_REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"
CODE = re.compile(r"^B[78](?:\.\d+){4}$")
PHASES = ("ENGAGE", "EXPLORE", "EXPLAIN", "ELABORATE", "EVALUATE")
PACKS = ((7, "Mathematics"), (7, "Science"), (8, "Mathematics"), (8, "Science"))


def pack_path(level: int, subject: str, suffix: str) -> Path:
    return ROOT / f"Basic_{level}_{subject}_Term1_{suffix}"


def word_text(element: ET.Element) -> str:
    """Join Word runs, including explicit line breaks, in document order."""
    parts = []
    for node in element.iter():
        if node.tag == WORD + "t":
            parts.append(node.text or "")
        elif node.tag in (WORD + "br", WORD + "tab"):
            parts.append(" ")
    return "".join(parts).strip()


def docx_lines(path: Path) -> list[str]:
    """Return body paragraphs and table rows in their actual document order."""
    with ZipFile(path) as archive:
        body = ET.fromstring(archive.read("word/document.xml")).find(WORD + "body")
    if body is None:
        raise ValueError(f"No Word document body: {path}")
    lines = []
    for block in body:
        if block.tag == WORD + "p":
            value = word_text(block)
            if value:
                lines.append(value)
        elif block.tag == WORD + "tbl":
            for row in block.findall(WORD + "tr"):
                cells = []
                for cell in row.findall(WORD + "tc"):
                    paragraphs = [word_text(p) for p in cell.findall(WORD + "p")]
                    cells.append(" / ".join(p for p in paragraphs if p))
                lines.append(" | ".join(cells))
    return lines


def workbook_sheets(path: Path, names: set[str]) -> dict[str, dict[str, str]]:
    """Read needed XLSX cell values, not formulas, via OOXML (no Excel needed)."""
    with ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {
            item.get("Id"): item.get("Target")
            for item in relationships.findall(PKG_REL + "Relationship")
        }
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = [
                "".join(t.text or "" for t in si.iter(SHEET + "t"))
                for si in root.findall(SHEET + "si")
            ]
        result = {}
        for sheet in workbook.findall(f"{SHEET}sheets/{SHEET}sheet"):
            name = sheet.get("name")
            if name not in names:
                continue
            target = targets.get(sheet.get(REL_ID))
            if not target:
                raise ValueError(f"Missing XLSX relationship for {name}: {path}")
            part = (target.lstrip("/") if target.startswith("/") else
                    posixpath.normpath(posixpath.join("xl", target)))
            root = ET.fromstring(archive.read(part))
            cells = {}
            for cell in root.iter(SHEET + "c"):
                address = cell.get("r")
                kind = cell.get("t")
                value = cell.find(SHEET + "v")
                if kind == "inlineStr":
                    inline = cell.find(SHEET + "is")
                    text = "".join(t.text or "" for t in inline.iter(SHEET + "t")) if inline is not None else ""
                elif kind == "s" and value is not None and value.text:
                    text = shared[int(value.text)]
                elif value is not None:
                    text = value.text or ""
                else:
                    text = ""
                if text:
                    cells[address] = text
            result[name] = cells
    missing = names - result.keys()
    if missing:
        raise ValueError(f"Missing XLSX sheets {sorted(missing)}: {path}")
    return result


def span(lines: list[str], start: str, end: str) -> list[str]:
    """Find an exact section heading (not its table-of-contents entry)."""
    beginning = next(i for i, line in enumerate(lines) if line.startswith(start))
    ending = next(i for i in range(beginning + 1, len(lines)) if lines[i].startswith(end))
    return lines[beginning:ending]


def test_totals(lines: list[str]) -> dict[str, dict[str, int]]:
    content = span(lines, "C1  Unit Tests", "C2  ")
    headings = [
        (i, int(m.group(1)), int(m.group(2)))
        for i, line in enumerate(content)
        if (m := re.match(r"^C1\.(\d+)\s+Unit Test\s+.*?\((\d+) marks", line))
    ]
    if len(headings) != 4:
        raise ValueError(f"Expected 4 tests, got {len(headings)}")
    tests = {}
    for index, (start, number, declared) in enumerate(headings):
        end = headings[index + 1][0] if index + 1 < len(headings) else len(content)
        section = content[start + 1:end]
        # The B7 Science pack prints questions as paragraphs with [marks];
        # the other three packs use Question | Answer rows with (marks).
        paragraph_style = any("Section A — choose the correct answer" in row for row in section)
        if paragraph_style:
            section = section[:next(i for i, row in enumerate(section) if row.startswith("Answers / marking scheme"))]
        item_marks = []
        for row in section:
            if not re.match(r"^\d+\.\s", row):
                continue
            if paragraph_style:
                match = re.search(r"\[(\d+)\]\s*$", row)
                if match:
                    item_marks.append(int(match.group(1)))
            elif " | " in row:
                prompt = row.split(" | ", 1)[0]
                match = re.search(r"\((\d+)\)\s*$", prompt)
                if match:
                    item_marks.append(int(match.group(1)))
        question_rows = [row for row in section if re.match(r"^\d+\.\s", row)
                         and (paragraph_style or " | " in row)]
        if not item_marks or len(item_marks) != len(question_rows):
            raise ValueError(f"Unreadable question marks for UT{number}: "
                             f"{len(item_marks)} marks for {len(question_rows)} questions")
        tests[f"UT{number}"] = {
            "declared": declared,
            "itemSum": sum(item_marks),
            "itemCount": len(item_marks),
        }
    return tests


def exam_totals(lines: list[str]) -> dict[str, int]:
    section = span(lines, "C2  End-of-Term Examination", "C3  ")
    introduction = " ".join(section[:4])
    match = re.search(r"Total\s+(\d+) marks", introduction)
    if match:
        declared = int(match.group(1))
    else:
        # The B7 Science paper states its total on its C2.2 heading.
        heading = next((line for line in section if line.startswith("C2.2  End-of-term examination")), "")
        match = re.search(r"\((\d+) marks,", heading)
        if not match:
            raise ValueError("Could not read exam's advertised total")
        declared = int(match.group(1))
    if any("Section B — answer ALL five questions" in line for line in section):
        # B7 Science: twenty one-mark MCQs; structured questions have explicit
        # TOTAL [marks] rows. Parse the paper, not its answers below.
        first = next(i for i, row in enumerate(section) if row.startswith("Section A — twenty"))
        second = next(i for i, row in enumerate(section) if row.startswith("Section B — answer ALL"))
        marking = next(i for i in range(second + 1, len(section)) if section[i].startswith("Answers / marking scheme"))
        mc_marks = [int(m.group(1)) for row in section[first:second]
                    if (m := re.match(r"^\d+\..*\[(\d+)\]\s*$", row))]
        structured = [int(m.group(1)) for row in section[second:marking]
                      if (m := re.search(r"\bTOTAL\s+\(\d+\)\s+\[(\d+)\]", row))]
    else:
        first = next(i for i, row in enumerate(section) if row.startswith("C2.1  Section A"))
        second = next(i for i, row in enumerate(section) if row.startswith("C2.2  Section B"))
        end = next(i for i in range(second + 1, len(section)) if section[i].startswith("Revision for Week 13"))
        mc_count = sum(bool(re.match(r"^\d+\.\s", row) and " | " in row) for row in section[first:second])
        each = re.search(r"ten multiple-choice questions,\s*(\d+) marks each", introduction)
        if not each:
            raise ValueError("Missing per-question multiple-choice mark allocation")
        mc_marks = [int(each.group(1))] * mc_count
        structured = []
        for row in section[second:end]:
            if re.match(r"^\d+\.\s", row) and " | " in row:
                prompt = row.split(" | ", 1)[0]
                marks = re.findall(r"\[(\d+)\]|\((\d+)\)", prompt)
                structured.append(sum(int(value) for pair in marks for value in pair if value))
    if len(mc_marks) not in (10, 20) or len(structured) != 5 or any(n == 0 for n in structured):
        raise ValueError(f"Incomplete exam extraction: {len(mc_marks)} MCQs, structured {structured}")
    return {
        "declared": declared,
        "itemSum": sum(mc_marks) + sum(structured),
        "multipleChoiceMarks": sum(mc_marks),
        "structuredMarks": sum(structured),
    }


def lesson_inventory(lines: list[str], prefix: str) -> list[tuple[int, int]]:
    return [(int(m.group(1)), int(m.group(2))) for line in lines
            if (m := re.match(prefix, line))]


def phase_inventory(lines: list[str]) -> dict[int, dict[str, int]]:
    """Read each lesson's 5E timings; do not impose Mathematics' phase split."""
    stages = re.compile(r"^(ENGAGE|EXPLORE|EXPLAIN|ELABORATE|EVALUATE)\s*(?:/\s*)?(\d+) min\b")
    lessons = {}
    current = None
    for line in lines:
        m = re.match(r"^LESSON\s+(\d+)\s*/\s*Week\s+\d+", line)
        if m:
            current = int(m.group(1))
            lessons[current] = {}
        elif line.startswith("PART C / ANNEXES"):
            current = None
        elif current is not None and (m := stages.match(line)):
            lessons[current][m.group(1)] = int(m.group(2))
    if not lessons or any(set(phases) != set(PHASES) for phases in lessons.values()):
        raise ValueError("At least one lesson has no complete set of 5E phases")
    return lessons


def lesson_codes(cell: str) -> list[int]:
    """Expand 'L1, L2' and 'L7–L8' in coverage-matrix cells."""
    result = []
    for match in re.finditer(r"\bL(\d+)(?:[–-]L?(\d+))?\b", cell):
        start, end = int(match.group(1)), int(match.group(2) or match.group(1))
        if end < start or end - start > 100:
            raise ValueError(f"Invalid lesson reference: {cell}")
        result.extend(range(start, end + 1))
    return result


def coverage_inventory(lines: list[str]) -> dict[str, list[int]]:
    content = span(lines, "D1  Curriculum Coverage Matrix", "D2  Weekly Record of Work")
    matches = defaultdict(list)
    for row in content:
        cols = row.split(" | ")
        if len(cols) >= 3 and CODE.fullmatch(cols[0]):
            matches[cols[0]].extend(lesson_codes(cols[2]))
    if not matches:
        raise ValueError("No lesson-to-indicator rows in D1")
    return {code: sorted(set(lessons)) for code, lessons in sorted(matches.items())}


def tracker_inventory(path: Path) -> tuple[dict[str, int], list[str]]:
    sheets = workbook_sheets(path, {"Class Record", "Indicator Analysis"})
    record, analysis = sheets["Class Record"], sheets["Indicator Analysis"]
    maxima = {}
    for column in "CDEFGHIJKL":
        key, value = record.get(f"{column}3"), record.get(f"{column}4")
        if key and value:
            maxima[key] = int(float(value))
    indicators = sorted(value for address, value in analysis.items()
                        if re.fullmatch(r"A\d+", address) and CODE.fullmatch(value))
    if "Exam" not in maxima or len(indicators) < 10:
        raise ValueError(f"Incomplete assessment tracker: {path}")
    return maxima, indicators


def issue(code: str, location: str, detail: str) -> dict[str, str]:
    return {"code": code, "location": location, "detail": detail}


def check_metadata(level: int, subject: str, plan: list[str], notes: list[str]) -> list[dict[str, str]]:
    found = []
    for kind, lines in (("plan", plan), ("notes", notes)):
        # The B7 Science plan has several cover paragraphs; the other plans
        # have a single composite title. Stop before the class metadata table
        # so a correct Subject row cannot mask a wrong cover.
        cover_lines = []
        for line in lines[:8]:
            if line.startswith("Class | "):
                break
            cover_lines.append(line)
        cover = " ".join(cover_lines).upper()
        if not re.search(rf"\bBASIC\s+{level}\b", cover) or subject.upper() not in cover:
            found.append(issue("COVER_IDENTITY", kind, f"Cover does not identify Basic {level} {subject}"))
        clas = next((line for line in lines[:12] if line.startswith("Class | ")), "")
        sub = next((line for line in lines[:12] if line.startswith("Subject | ")), "")
        if clas and not re.search(rf"\bBasic\s+{level}\b", clas, re.I):
            found.append(issue("CLASS_IDENTITY", kind, f"{clas}; expected Basic {level}"))
        if sub and sub.split(" | ")[-1].strip() != subject:
            found.append(issue("SUBJECT_IDENTITY", kind, f"{sub}; expected {subject}"))
        if level == 8 and "JHS 1" in clas:
            found.append(issue("CLASS_IDENTITY", kind, "Basic 8 is described as JHS 1"))
        if any("February 2020" in line and "curricul" in line.lower() for line in lines):
            found.append(issue("CURRICULUM_EDITION", kind, "Cites February 2020; supplied NaCCA curriculum PDFs say September 2020"))
    if level == 8:
        d2 = span(plan, "D2  Weekly Record of Work", "D3  ")
        if any(re.search(r"\bB7\.\d+\.\d+\.\d+\.\d+\b", row) for row in d2):
            found.append(issue("WEEKLY_RECORD_LEVEL", "plan D2", "Contains B7 indicators in a B8 weekly record"))
    return found


def audit_pack(level: int, subject: str) -> tuple[dict, list[dict[str, str]]]:
    slug = f"b{level}-{subject.lower()}-t1"
    plan = docx_lines(pack_path(level, subject, "Lesson_Plan_and_Teaching_Guide.docx"))
    notes = docx_lines(pack_path(level, subject, "Lesson_Notes_GES_Format.docx"))
    maxima, indicators = tracker_inventory(pack_path(level, subject, "Assessment_Tracker.xlsx"))
    tests = test_totals(plan)
    exam = exam_totals(plan)
    plans = lesson_inventory(plan, r"^LESSON\s+(\d+)\s*/\s*Week\s+(\d+)")
    note_numbers = lesson_inventory(notes, r"^.*?LESSON\s+(\d+)\s+of\s+(\d+)\b")
    coverage = coverage_inventory(plan)
    lesson_phases = phase_inventory(plan)
    phase_sums = {str(number): sum(phases.values()) for number, phases in lesson_phases.items()}
    problems = check_metadata(level, subject, plan, notes)
    a6 = span(plan, "A6  Assessment Plan for the Term", "A7  ")
    ut4_calendar = next((line for line in a6 if line.startswith("Unit Test 4 | ")), "")
    ut4_paper = next((line for line in plan if line.startswith("C1.4  Unit Test 4")), "")
    if "fractions" in ut4_calendar.lower() and "fraction" not in ut4_paper.lower():
        problems.append(issue("ASSESSMENT_CALENDAR", "plan A6 / C1.4",
                              "A6 schedules a Fractions test but the actual Unit Test 4 has another topic"))
    if sorted(n for n, _ in plans) != list(range(1, len(plans) + 1)):
        problems.append(issue("LESSON_SEQUENCE", "plan Part B", "Lesson numbers are not 1..N exactly once"))
    if sorted(n for n, _ in note_numbers) != list(range(1, len(note_numbers) + 1)) or len(plans) != len(note_numbers):
        problems.append(issue("NOTES_SEQUENCE", "notes", "Lesson numbers differ from the plan"))
    if any(total != len(note_numbers) for _, total in note_numbers):
        problems.append(issue("NOTES_LABEL", "notes", f"Some headings say 'of N' where N != {len(note_numbers)}"))
    if set(coverage) != set(indicators):
        problems.append(issue("INDICATOR_MISMATCH", "plan D1 / tracker Indicator Analysis",
                              f"Only in plan: {sorted(set(coverage)-set(indicators))}; only in tracker: {sorted(set(indicators)-set(coverage))}"))
    if set(phase_sums) != {str(number) for number, _ in plans} or any(total != 60 for total in phase_sums.values()):
        problems.append(issue("PHASE_DURATION", "plan Part B", "Missing phases or 5E minutes do not sum to 60"))
    for test, data in tests.items():
        location = f"plan C1.{test[-1]} / tracker Class Record"
        data["trackerMax"] = maxima.get(test)
        if data["itemSum"] != data["declared"]:
            problems.append(issue("UNIT_MARKS", location, f"{test}: items total {data['itemSum']}, paper says {data['declared']}"))
        if data["declared"] != data["trackerMax"]:
            problems.append(issue("UNIT_TRACKER_MAX", location, f"{test}: paper says {data['declared']}, tracker expects {data['trackerMax']}"))
    exam["trackerMax"] = maxima["Exam"]
    if exam["itemSum"] != exam["declared"]:
        problems.append(issue("EXAM_MARKS", "plan C2", f"Items total {exam['itemSum']}, paper says {exam['declared']}"))
    if exam["itemSum"] != exam["trackerMax"]:
        problems.append(issue("EXAM_TRACKER_MAX", "plan C2 / tracker Class Record",
                              f"Items total {exam['itemSum']}, tracker expects {exam['trackerMax']}"))
    if level == 7 and subject == "Science":
        d1 = span(plan, "D1  Curriculum Coverage Matrix", "D2  Weekly Record of Work")
        stated = next((int(m.group(1)) for line in d1
                       if (m := re.search(r"Total:\s*\d+ content standards,\s*(\d+) indicators", line))), None)
        if stated is not None and stated != len(coverage):
            problems.append(issue("COVERAGE_SUMMARY", "plan D1.1", f"Says {stated} indicators; D1 lists {len(coverage)}"))
    result = {
        "lessons": len(plans), "weeksTeaching": max(week for _, week in plans),
        "lessonNotes": len(note_numbers), "indicators": len(indicators),
        "indicatorLessonLinks": sum(len(lessons) for lessons in coverage.values()),
        "repeatedIndicators": {key: value for key, value in coverage.items() if len(value) > 1},
        "classworkMax": sum(value for key, value in maxima.items() if key != "Exam"),
        "phaseTotals": {str(total): count for total, count in sorted(Counter(phase_sums.values()).items())},
        "phaseSchedules": dict(sorted(Counter(
            "/".join(str(phases[phase]) for phase in PHASES)
            for phases in lesson_phases.values()
        ).items())),
        "tests": tests, "exam": exam,
    }
    return result, [dict(pack=slug, **problem) for problem in problems]


def scheme_conflicts() -> list[dict[str, str]]:
    schemes = workbook_sheets(ROOT / "Mathematics_Schemes_B4-B8_Full_Text_v3_CORRECTED.xlsx",
                              {"B7 CORRECTED", "B8 CORRECTED"})
    results = []
    b7 = schemes["B7 CORRECTED"]
    plan7 = docx_lines(pack_path(7, "Mathematics", "Lesson_Plan_and_Teaching_Guide.docx"))
    d2 = span(plan7, "D2  Weekly Record of Work", "D3  ")
    if b7.get("C16") == "EXAMINATION" and any(re.match(r"^15\s*\|.*\|\s*Vacation\s*\|", line) for line in d2):
        results.append(dict(pack="b7-mathematics-t1", **issue("SCHEME_CALENDAR", "B7 CORRECTED!C16 / plan D2 W15",
            "Week 15 is examination in the corrected scheme but vacation in the lesson plan")))
    b8 = schemes["B8 CORRECTED"]
    plan8 = docx_lines(pack_path(8, "Mathematics", "Lesson_Plan_and_Teaching_Guide.docx"))
    week12 = next((line for line in plan8 if re.match(r"^12\*?\s*\|", line)), "")
    if "B8.3.1.1" in b8.get("E13", "") and "B8.2.1.1" in week12:
        results.append(dict(pack="b8-mathematics-t1", **issue("SCHEME_INDICATORS", "B8 CORRECTED!E13/G13 / plan A1.1 W12",
            "Corrected scheme teaches angles in Week 12; plan and tracker teach gradient instead")))
    return results


def audit() -> dict:
    packs, problems = {}, []
    for level, subject in PACKS:
        name = f"b{level}-{subject.lower()}-t1"
        packs[name], findings = audit_pack(level, subject)
        problems.extend(findings)
    problems.extend(scheme_conflicts())
    return {
        "schemaVersion": 1,
        "purpose": "Raw-source discrepancy inventory; NOT approved content or a publishable pack",
        "releaseGate": "BLOCKED" if problems else "READY_FOR_AUTHOR_REVIEW",
        "packs": packs,
        "findings": sorted(problems, key=lambda p: (p["pack"], p["code"], p["location"], p["detail"])),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", metavar="PATH", type=Path, help="Write the current JSON audit")
    parser.add_argument("--check", metavar="PATH", type=Path, help="Fail if the checked-in baseline has changed")
    parser.add_argument("--strict", action="store_true", help="Fail while any source discrepancy remains")
    args = parser.parse_args()
    report = audit()
    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.write:
        args.write.parent.mkdir(parents=True, exist_ok=True)
        args.write.write_text(text, encoding="utf-8")
    if args.check:
        if args.check.read_text(encoding="utf-8") != text:
            print(f"Raw-source findings changed: regenerate and review {args.check}", file=sys.stderr)
            return 1
    print(f"{len(report['packs'])} packs; {len(report['findings'])} known discrepancies; "
          f"release gate: {report['releaseGate']}")
    for name, pack in report["packs"].items():
        print(f"  {name}: {pack['lessons']} lessons / {pack['indicators']} tracker indicators; "
              f"classwork {pack['classworkMax']}; exam items {pack['exam']['itemSum']} "
              f"(tracker {pack['exam']['trackerMax']})")
    return int(args.strict and bool(report["findings"]))


if __name__ == "__main__":
    raise SystemExit(main())
