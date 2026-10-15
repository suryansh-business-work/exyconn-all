import type { Minor } from "@exyconn/gcc-cost";

export interface Bar {
  key: string;
  label: string;
  value: Minor;
}

/**
 * Horizontal bars as a definition list: each label, its formatted amount and a bar sized to the
 * largest value. Screen readers read the label and amount; the bar itself is decorative.
 */
export function BarList({
  bars,
  format,
  empty,
  tone = "light",
}: Readonly<{
  bars: readonly Bar[];
  format: (minor: Minor) => string;
  empty: string;
  tone?: "light" | "night";
}>) {
  const visible = bars.filter((bar) => bar.value > 0);
  if (visible.length === 0) {
    return <p className="gcc-empty">{empty}</p>;
  }
  const max = Math.max(...visible.map((bar) => bar.value));
  return (
    <dl className={`gcc-bars gcc-bars--${tone}`}>
      {visible.map((bar) => (
        <div key={bar.key} className="gcc-bars__row">
          <dt>{bar.label}</dt>
          <dd>
            <span className="gcc-bars__value">{format(bar.value)}</span>
            <span className="gcc-bars__track" aria-hidden="true">
              <span
                className="gcc-bars__fill"
                style={{ inlineSize: `${(bar.value / max) * 100}%` }}
              />
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
