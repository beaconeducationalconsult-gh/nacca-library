// Independently curated, ungraded demonstrations. No responses are stored.
export const WATER_STAGES = [
  {
    name: "Evaporation",
    detail:
      "Sunlight warms surface water. Some liquid water becomes water vapour and rises.",
    question: "Where might water go when a wet path dries?",
  },
  {
    name: "Condensation",
    detail: "Water vapour cools and forms tiny liquid droplets in clouds.",
    question: "What changes as the rising air cools?",
  },
  {
    name: "Precipitation",
    detail: "Droplets grow and fall back to Earth as rain.",
    question: "How does water return to the ground?",
  },
  {
    name: "Collection",
    detail:
      "Water flows into rivers, lakes and soil, then can move through the cycle again.",
    question: "Where might rainwater travel next?",
  },
];

export const MIXTURE_SAMPLES = [
  {
    id: "salt",
    name: "A little salt and water",
    justMixed: "The salt seems to disappear into a clear, even-looking liquid.",
    afterWaiting:
      "The liquid still looks even: the dissolved salt has not settled out.",
    notice: "Can you see a separate solid layer?",
  },
  {
    id: "sand",
    name: "Sand and water",
    justMixed: "You can see particles suspended in the cloudy water.",
    afterWaiting: "Many sand particles have settled near the bottom.",
    notice: "Which part moved as time passed?",
  },
  {
    id: "oil",
    name: "Oil and water",
    justMixed: "Shaking briefly makes droplets visible throughout the water.",
    afterWaiting: "The liquids form layers, with oil floating above water.",
    notice: "How many liquid layers do you see?",
  },
];

export function linePoints(slope, intercept) {
  if (
    !Number.isInteger(slope) ||
    Math.abs(slope) > 3 ||
    !Number.isInteger(intercept) ||
    Math.abs(intercept) > 3
  ) {
    throw new RangeError("Choose integer slopes and intercepts from -3 to 3");
  }
  return Array.from({ length: 9 }, (_, index) => {
    const x = index - 4;
    return { x, y: slope * x + intercept };
  });
}
