import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  BENCHMARK_FRACTIONS,
  descendingPowers,
  splitPeriods,
} from "../lib/math";
import { linePoints, MIXTURE_SAMPLES, WATER_STAGES } from "../lib/models";

function WidgetFrame({ eyebrow, title, intro, children }) {
  return (
    <section className="widget-frame" aria-label={title}>
      <div className="widget-heading">
        <div className="widget-mark">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
          <p>{intro}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PlaceValueWidget() {
  const [value, setValue] = useState("2486309175");
  const periods = splitPeriods(value);
  const names = ["ones", "thousands", "millions", "billions", "trillions"];
  return (
    <WidgetFrame
      eyebrow="Interactive model · 01"
      title="Build a big number"
      intro="Digits are grouped into periods of three, starting from the right. Try changing the number."
    >
      <label className="widget-label" htmlFor="place-value-input">
        Type a whole number (up to 15 digits)
      </label>
      <input
        id="place-value-input"
        className="widget-input"
        type="text"
        inputMode="numeric"
        value={value}
        maxLength={15}
        onChange={(event) =>
          setValue(event.target.value.replace(/\D/g, "").slice(0, 15))
        }
        aria-describedby="place-value-result"
      />
      <div className="periods" id="place-value-result" aria-live="polite">
        {periods.map((group, index) => (
          <div className="period" key={`${periods.length}-${index}`}>
            <span className="period-name">
              {names[periods.length - 1 - index]}
            </span>
            <strong>{group}</strong>
          </div>
        ))}
      </div>
      <p className="widget-insight">
        <Lightbulb size={17} aria-hidden="true" /> Read each group, then name
        its period. Zero groups still hold a place.
      </p>
    </WidgetFrame>
  );
}

function IndexWidget() {
  const [base, setBase] = useState(3);
  const [exponent, setExponent] = useState(3);
  const factors = Array.from({ length: exponent }, () => base);
  return (
    <WidgetFrame
      eyebrow="Interactive model · 02"
      title="See repeated factors"
      intro="An exponent counts how many times the base is used as a factor—not the result of base × exponent."
    >
      <div className="widget-controls">
        <label>
          Base{" "}
          <select
            value={base}
            onChange={(event) => setBase(Number(event.target.value))}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Factors{" "}
          <select
            value={exponent}
            onChange={(event) => setExponent(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="factor-model" aria-live="polite">
        <span className="factor-expression">{factors.join(" × ")}</span>
        <ArrowRight size={20} aria-hidden="true" />
        <span className="factor-power">
          {base}
          <sup>{exponent}</sup>
        </span>
        <span className="factor-equals">= {base ** exponent}</span>
      </div>
      <p className="widget-insight">
        <Lightbulb size={17} aria-hidden="true" /> {base}
        <sup>{exponent}</sup> means {exponent}{" "}
        {exponent === 1 ? "copy" : "copies"} of {base} multiplied together.
      </p>
    </WidgetFrame>
  );
}

function ZeroIndexWidget() {
  const [base, setBase] = useState(3);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState(false);
  const rows = descendingPowers(base, 4);
  return (
    <WidgetFrame
      eyebrow="Interactive model · 03"
      title="Why does the zero index equal one?"
      intro="Follow the pattern. Every step down divides by the base. What must come after the first power?"
    >
      <div className="widget-controls">
        <label htmlFor="zero-base">
          Choose a base{" "}
          <select
            id="zero-base"
            value={base}
            onChange={(event) => {
              setBase(Number(event.target.value));
              setChecked(false);
              setGuess("");
            }}
          >
            {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="small-note">Every row is exact arithmetic.</span>
      </div>
      <div
        className="power-sequence"
        aria-label={`Powers of ${base} from four to zero`}
      >
        {rows.map((row, index) => (
          <div
            className={`power-step ${row.exponent === 0 ? "power-step-final" : ""}`}
            key={row.exponent}
          >
            <div className="power-number">
              {base}
              <sup>{row.exponent}</sup>
            </div>
            <div className="power-divider">=</div>
            <strong>{row.value.toLocaleString("en-GH")}</strong>
            {index < rows.length - 1 && (
              <span className="divide-hint">
                ÷ {base} <ArrowDown size={12} aria-hidden="true" />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="quick-check">
        <div>
          <strong>Your turn</strong>
          <span>If 7¹ = 7, what is 7⁰?</span>
        </div>
        <div className="quick-check-controls">
          <input
            aria-label="Your answer for seven to the power zero"
            inputMode="numeric"
            type="text"
            value={guess}
            onChange={(event) => {
              setGuess(event.target.value.replace(/[^0-9]/g, "").slice(0, 3));
              setChecked(false);
            }}
          />
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={!guess}
          >
            Check
          </button>
        </div>
        {checked && (
          <p
            className={guess === "1" ? "correct-message" : "try-message"}
            role="status"
          >
            {guess === "1"
              ? "Exactly. Dividing 7¹ by 7 gives 7⁰ = 1."
              : "Look at the final step: 7¹ ÷ 7 = 7⁰. Try again."}
          </p>
        )}
      </div>
      <p className="widget-insight">
        <Lightbulb size={17} aria-hidden="true" /> This pattern applies to
        non-zero bases. Zero to the zero power is not covered by this rule.
      </p>
    </WidgetFrame>
  );
}

function FractionsWidget() {
  const [selected, setSelected] = useState(1);
  const fraction = BENCHMARK_FRACTIONS[selected];
  return (
    <WidgetFrame
      eyebrow="Interactive model · 04"
      title="Connect a fraction to a percent"
      intro="Choose a benchmark fraction. The shaded share stays the same when you change how you write it."
    >
      <div
        className="fraction-options"
        role="group"
        aria-label="Choose a fraction"
      >
        {BENCHMARK_FRACTIONS.map((option, index) => (
          <button
            className={selected === index ? "selected" : ""}
            onClick={() => setSelected(index)}
            type="button"
            key={option.label}
            aria-pressed={selected === index}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="fraction-display" aria-live="polite">
        <div className="fraction-bar" aria-hidden="true">
          {Array.from({ length: fraction.denominator }, (_, index) => (
            <span
              key={index}
              className={index < fraction.numerator ? "filled" : ""}
            />
          ))}
        </div>
        <div className="fraction-equation">
          <strong>{fraction.label}</strong>
          <span>=</span>
          <strong>{fraction.decimal}</strong>
          <span>=</span>
          <strong>{fraction.percentage}</strong>
        </div>
      </div>
      {fraction.denominator === 3 && (
        <p className="widget-insight">
          <Lightbulb size={17} aria-hidden="true" /> One third is 33⅓%, not
          exactly 33%. The decimal repeats forever.
        </p>
      )}
    </WidgetFrame>
  );
}

function WaterCycleWidget() {
  const [active, setActive] = useState(0);
  const stage = WATER_STAGES[active];
  return (
    <WidgetFrame
      eyebrow="Interactive model · Science"
      title="Follow a drop of water"
      intro="Select a stage to trace one possible journey through the water cycle. This is a model, not a lab procedure."
    >
      <div
        className="model-stage-list"
        role="group"
        aria-label="Water cycle stage"
      >
        {WATER_STAGES.map((step, index) => (
          <button
            key={step.name}
            type="button"
            className={active === index ? "selected" : ""}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {step.name}
          </button>
        ))}
      </div>
      <div className="model-result" aria-live="polite">
        <strong>{stage.name}</strong>
        <p>{stage.detail}</p>
        <small>Wonder: {stage.question}</small>
      </div>
    </WidgetFrame>
  );
}

function LineGraphWidget() {
  const [slope, setSlope] = useState(1);
  const [intercept, setIntercept] = useState(0);
  const points = linePoints(slope, intercept);
  const equation = `y = ${slope}x ${intercept < 0 ? "−" : "+"} ${Math.abs(intercept)}`;
  return (
    <WidgetFrame
      eyebrow="Interactive model · Mathematics"
      title="See a line change"
      intro="Change the gradient or starting value. What stays the same as x moves one step?"
    >
      <div className="model-selectors">
        <label>
          Gradient (m)
          <select
            value={slope}
            onChange={(event) => setSlope(Number(event.target.value))}
          >
            {[-2, -1, 0, 1, 2].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Starting value (c)
          <select
            value={intercept}
            onChange={(event) => setIntercept(Number(event.target.value))}
          >
            {[-2, -1, 0, 1, 2].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="line-model">
        <svg
          viewBox="0 0 360 240"
          role="img"
          aria-label={`Graph of ${equation}, from x negative four to four`}
        >
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`x-${i}`}
              x1={180 + (i - 4) * 34}
              x2={180 + (i - 4) * 34}
              y1="15"
              y2="225"
              className="line-model-grid"
            />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line
              key={`y-${i}`}
              x1="25"
              x2="335"
              y1={120 + (i - 3) * 32}
              y2={120 + (i - 3) * 32}
              className="line-model-grid"
            />
          ))}
          <line
            x1="180"
            y1="15"
            x2="180"
            y2="225"
            className="line-model-axis"
          />
          <line
            x1="25"
            y1="120"
            x2="335"
            y2="120"
            className="line-model-axis"
          />
          <polyline
            fill="none"
            className="line-model-path"
            points={points
              .map(({ x, y }) => `${180 + x * 34},${120 - y * 7}`)
              .join(" ")}
          />
          {points
            .filter(({ x }) => x % 2 === 0)
            .map(({ x, y }) => (
              <circle
                key={x}
                cx={180 + x * 34}
                cy={120 - y * 7}
                r="5"
                className="line-model-point"
              />
            ))}
          <text x="342" y="125">
            x
          </text>
          <text x="184" y="14">
            y
          </text>
          <text x="185" y="134">
            0
          </text>
        </svg>
        <div className="line-model-caption" aria-live="polite">
          <strong>{equation}</strong>
          <span>
            At x = 0, y = {intercept}. Each step right changes y by {slope}.
          </span>
          <small>
            Illustrative graph; choose another pair of values to compare the
            lines.
          </small>
        </div>
      </div>
    </WidgetFrame>
  );
}

function MixtureInquiryWidget() {
  const [sampleId, setSampleId] = useState("salt");
  const [afterWaiting, setAfterWaiting] = useState(false);
  const sample = MIXTURE_SAMPLES.find((item) => item.id === sampleId);
  return (
    <WidgetFrame
      eyebrow="Ungraded inquiry activity · Science"
      title="What happens to a mixture?"
      intro="Predict what you might see, choose a model mixture, then compare it now and after waiting. No score or response is saved."
    >
      <div
        className="model-stage-list mixture-choices"
        role="group"
        aria-label="Choose a model mixture"
      >
        {MIXTURE_SAMPLES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={sampleId === item.id ? "selected" : ""}
            aria-pressed={sampleId === item.id}
            onClick={() => {
              setSampleId(item.id);
              setAfterWaiting(false);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div
        className="model-stage-list time-choices"
        role="group"
        aria-label="Time in the model"
      >
        <button
          type="button"
          className={!afterWaiting ? "selected" : ""}
          aria-pressed={!afterWaiting}
          onClick={() => setAfterWaiting(false)}
        >
          Just mixed
        </button>
        <button
          type="button"
          className={afterWaiting ? "selected" : ""}
          aria-pressed={afterWaiting}
          onClick={() => setAfterWaiting(true)}
        >
          After waiting
        </button>
      </div>
      <div className="mixture-observation">
        <div
          className={`mixture-vessel mixture-${sample.id} ${afterWaiting ? "after" : ""}`}
          aria-hidden="true"
        >
          <div className="mixture-liquid" />
          <span className="mixture-grains" />
        </div>
        <div className="model-result" aria-live="polite">
          <strong>
            {sample.name} · {afterWaiting ? "After waiting" : "Just mixed"}
          </strong>
          <p>{afterWaiting ? sample.afterWaiting : sample.justMixed}</p>
          <small>Notice: {sample.notice}</small>
        </div>
      </div>
      <p className="widget-insight">
        <Lightbulb size={17} aria-hidden="true" /> What evidence would help you
        explain the difference? Think or write on paper; this site collects
        nothing.
      </p>
      <p className="model-safety">
        Illustration only. Never taste a mixture or handle unknown substances;
        real investigations need appropriate adult supervision.
      </p>
    </WidgetFrame>
  );
}

const widgetRegistry = {
  "place-value": PlaceValueWidget,
  "index-explorer": IndexWidget,
  "zero-index": ZeroIndexWidget,
  fractions: FractionsWidget,
  "water-cycle": WaterCycleWidget,
  "line-graph": LineGraphWidget,
  mixtures: MixtureInquiryWidget,
};

export function InteractiveWidget({ widgetId }) {
  const Widget = widgetRegistry[widgetId];
  return Widget ? <Widget /> : null;
}
