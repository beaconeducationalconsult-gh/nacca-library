import assert from "node:assert/strict";
import test from "node:test";
import { BENCHMARK_FRACTIONS, descendingPowers, splitPeriods } from "../src/lib/math.js";
import { linePoints, MIXTURE_SAMPLES, WATER_STAGES } from "../src/lib/models.js";
import { allLessons, coursePath, findPublicLessons, getLesson, lessonPath, readRoute } from "../src/lib/catalog.js";
import catalog from "../src/data/public-catalog.json" with { type: "json" };

test("place value groups from the right without floating point precision loss", () => {
  assert.deepEqual(splitPeriods("2486309175"), ["2", "486", "309", "175"]);
  assert.deepEqual(splitPeriods("0001000000000"), ["1", "000", "000", "000"]);
  assert.deepEqual(splitPeriods(""), ["0"]);
  assert.deepEqual(splitPeriods("999999999999999"), ["999", "999", "999", "999", "999"]);
  assert.deepEqual(splitPeriods("1a2?3"), ["123"]);
});

test("descending powers divide exactly and stop at one for non-zero bases", () => {
  assert.deepEqual(descendingPowers(3, 4).map(({ value }) => value), [81, 27, 9, 3, 1]);
  assert.deepEqual(descendingPowers(2, 5).map(({ value }) => value), [32, 16, 8, 4, 2, 1]);
  for (const base of [2, 3, 4, 5, 6, 7, 8, 9]) {
    assert.equal(descendingPowers(base, 4).at(-1).value, 1);
  }
  assert.throws(() => descendingPowers(0, 4), RangeError);
  assert.throws(() => descendingPowers(10, 4), RangeError);
});

test("benchmark equivalents use the exact recurring third", () => {
  assert.equal(BENCHMARK_FRACTIONS.find((f) => f.label === "⅓").percentage, "33⅓%");
  assert.equal(BENCHMARK_FRACTIONS.find((f) => f.label === "⅓").decimal, "0.333…");
  for (const fraction of BENCHMARK_FRACTIONS) {
    assert.equal(fraction.numerator, 1);
    assert.ok(fraction.denominator >= 2);
  }
});

test("four public courses keep links and search within their own lesson spine", () => {
  assert.equal(catalog.courses.length, 4);
  assert.deepEqual(catalog.courses.map((c) => c.lessons.length), [24, 24, 24, 26]);
  assert.equal(allLessons.length, 98);
  assert.equal(getLesson("b8-science-t1", 26).title, "Water and Feed for Animal Growth");
  assert.notEqual(getLesson("b7-math-t1", 1).id, getLesson("b7-science-t1", 1).id);
  assert.equal(getLesson("b8-math-t1", 25), undefined);
  assert.equal(readRoute("?lesson=14").courseId, "b7-math-t1");
  assert.deepEqual(readRoute("?course=b8-science-t1&lesson=26&view=map"),
    { courseId: "b8-science-t1", lessonNumber: 26, view: "map" });
  assert.equal(readRoute("?course=wrong&lesson=14").lessonNumber, null);
  assert.equal(readRoute("?course=b8-math-t1&lesson=25").view, "home");
  assert.equal(coursePath("b8-science-t1", "/library/"), "/library/?course=b8-science-t1");
  assert.equal(lessonPath("b7-math-t1", 14, "map", "/library/"),
    "/library/?course=b7-math-t1&lesson=14&view=map");
  assert.deepEqual(findPublicLessons("dispersion").map(({ lesson }) => lesson.number), [23, 24]);
});

test("new models are illustrative and the inquiry does not score or store results", () => {
  assert.deepEqual(linePoints(2, -1).slice(4, 7), [
    { x: 0, y: -1 }, { x: 1, y: 1 }, { x: 2, y: 3 },
  ]);
  assert.throws(() => linePoints(5, 0), RangeError);
  assert.throws(() => linePoints(1.5, 0), RangeError);
  assert.equal(WATER_STAGES.length, 4);
  assert.deepEqual(MIXTURE_SAMPLES.map((s) => s.id), ["salt", "sand", "oil"]);
  assert.ok(MIXTURE_SAMPLES.find((s) => s.id === "sand").afterWaiting.includes("settled"));
  assert.ok(MIXTURE_SAMPLES.find((s) => s.id === "oil").afterWaiting.includes("layers"));
});

test("public catalogue has no teacher or assessment payload fields", () => {
  for (const { lesson } of allLessons) {
    assert.equal(Object.keys(lesson.phaseMinutes).length, 5);
    assert.equal(Object.values(lesson.phaseMinutes).reduce((sum, n) => sum + n, 0), 60);
    for (const key of ["teacherActivity", "learnerActivity", "testItems", "answers", "quiz", "marks", "rubric"]) {
      assert.equal(key in lesson, false, `${lesson.id} must not expose ${key}`);
    }
  }
  assert.deepEqual(catalog.courses.find((c) => c.id === "b7-science-t1").lessons
    .filter((l) => l.review).map((l) => l.number), [10, 20, 24]);
  assert.deepEqual(catalog.courses.find((c) => c.id === "b8-math-t1").lessons
    .filter((l) => l.review).map((l) => l.week), [12, 12]);
});
