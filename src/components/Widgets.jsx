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

const widgetRegistry = {
  "place-value": PlaceValueWidget,
  "index-explorer": IndexWidget,
  "zero-index": ZeroIndexWidget,
  fractions: FractionsWidget,
};

export function InteractiveWidget({ widgetId }) {
  const Widget = widgetRegistry[widgetId];
  return Widget ? <Widget /> : null;
}
