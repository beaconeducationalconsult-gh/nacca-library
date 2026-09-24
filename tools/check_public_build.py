#!/usr/bin/env python3
"""Fail if the Vite production bundle contains raw sources or the HTML example."""

from pathlib import Path

from source_audit import ROOT

DIST = ROOT / "dist"
BLOCKED_NAMES = {
    "lesson2-binary-compounds-ph.html", "source-audit.json",
    "Basic_7_Science_Term1_Lesson_Plan_and_Teaching_Guide.docx",
}
BLOCKED_MARKERS = (
    "markQuiz", "runNeutralization", "NaCCA CCP STEM Virtual Laboratory",
    "Answers / marking scheme", "Teacher activity | Learner activity",
)


def check_build() -> int:
    if not (DIST / "index.html").is_file() or not (DIST / "sw.js").is_file():
        raise ValueError("Build first: npm run build must produce dist/index.html and dist/sw.js")
    files = [item for item in DIST.rglob("*") if item.is_file()]
    for path in files:
        if path.name in BLOCKED_NAMES or path.suffix.lower() in {".docx", ".xlsx", ".pdf", ".zip"}:
            raise ValueError(f"Raw source/example found in production build: {path.relative_to(DIST)}")
        if path.suffix == ".html" and path.name != "index.html":
            raise ValueError(f"Unexpected standalone HTML in build: {path.relative_to(DIST)}")
        if path.suffix in {".js", ".html", ".json"}:
            content = path.read_text(encoding="utf-8")
            for marker in BLOCKED_MARKERS:
                if marker in content:
                    raise ValueError(f"Source-only text {marker!r} leaked into {path.relative_to(DIST)}")
    if "Mathematics and Science" not in (DIST / "index.html").read_text(encoding="utf-8"):
        raise ValueError("Production index.html is not the four-course preview")
    print(f"Checked {len(files)} production files: no raw packs, example, scored quiz or keys")
    return len(files)


if __name__ == "__main__":
    check_build()
