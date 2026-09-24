import assert from 'node:assert/strict';
import test from 'node:test';
import { BENCHMARK_FRACTIONS, descendingPowers, splitPeriods } from '../src/lib/math.js';
import catalog from '../src/data/public-catalog.json' with { type: 'json' };

test('place value groups from the right without floating point precision loss', () => {
  assert.deepEqual(splitPeriods('2486309175'), ['2', '486', '309', '175']);
  assert.deepEqual(splitPeriods('0001000000000'), ['1', '000', '000', '000']);
  assert.deepEqual(splitPeriods(''), ['0']);
  assert.deepEqual(splitPeriods('999999999999999'), ['999', '999', '999', '999', '999']);
  assert.deepEqual(splitPeriods('1a2?3'), ['123']);
});

test('descending powers divide exactly and stop at one for non-zero bases', () => {
  assert.deepEqual(descendingPowers(3, 4).map(({ value }) => value), [81, 27, 9, 3, 1]);
  assert.deepEqual(descendingPowers(2, 5).map(({ value }) => value), [32, 16, 8, 4, 2, 1]);
  for (const base of [2, 3, 4, 5, 6, 7, 8, 9]) {
    assert.equal(descendingPowers(base, 4).at(-1).value, 1);
  }
  assert.throws(() => descendingPowers(0, 4), RangeError);
  assert.throws(() => descendingPowers(10, 4), RangeError);
});

test('benchmark equivalents use the exact recurring third, not an incorrect rounding', () => {
  assert.equal(BENCHMARK_FRACTIONS.find((f) => f.label === '⅓').percentage, '33⅓%');
  assert.equal(BENCHMARK_FRACTIONS.find((f) => f.label === '⅓').decimal, '0.333…');
  for (const fraction of BENCHMARK_FRACTIONS) {
    assert.equal(fraction.numerator, 1);
    assert.ok(fraction.denominator >= 2);
  }
});

test('public catalogue has all 24 lessons with no assessment or teacher activity fields', () => {
  assert.equal(catalog.lessons.length, 24);
  assert.equal(new Set(catalog.lessons.map((lesson) => lesson.indicator.code)).size, 24);
  for (const lesson of catalog.lessons) {
    assert.equal(Object.keys(lesson.phaseMinutes).length, 5);
    assert.equal(Object.values(lesson.phaseMinutes).reduce((sum, n) => sum + n, 0), 60);
    assert.equal('teacherActivity' in lesson, false);
    assert.equal('testItems' in lesson, false);
    assert.equal('answers' in lesson, false);
  }
});
