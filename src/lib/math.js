// Small exact demonstrations for the public preview. No grade data is stored.
export function splitPeriods(input) {
  const clean =
    String(input)
      .replace(/\D/g, "")
      .replace(/^0+(?=\d)/, "")
      .slice(0, 15) || "0";
  const periods = [];
  for (let end = clean.length; end > 0; end -= 3) {
    periods.unshift(clean.slice(Math.max(0, end - 3), end));
  }
  return periods;
}

export function descendingPowers(base, highest = 4) {
  if (
    !Number.isInteger(base) ||
    base < 2 ||
    base > 9 ||
    !Number.isInteger(highest) ||
    highest < 0 ||
    highest > 6
  ) {
    throw new RangeError("Choose a base from 2 to 9 and a power from 0 to 6.");
  }
  return Array.from({ length: highest + 1 }, (_, index) => {
    const exponent = highest - index;
    return { exponent, value: base ** exponent };
  });
}

export const BENCHMARK_FRACTIONS = [
  {
    label: "½",
    numerator: 1,
    denominator: 2,
    decimal: "0.5",
    percentage: "50%",
  },
  {
    label: "⅓",
    numerator: 1,
    denominator: 3,
    decimal: "0.333…",
    percentage: "33⅓%",
  },
  {
    label: "¼",
    numerator: 1,
    denominator: 4,
    decimal: "0.25",
    percentage: "25%",
  },
  {
    label: "⅕",
    numerator: 1,
    denominator: 5,
    decimal: "0.2",
    percentage: "20%",
  },
  {
    label: "⅒",
    numerator: 1,
    denominator: 10,
    decimal: "0.1",
    percentage: "10%",
  },
];
