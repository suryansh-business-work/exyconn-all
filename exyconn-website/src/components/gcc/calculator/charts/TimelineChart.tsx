import type { MonthTotals } from "@exyconn/gcc-cost";
import { RESULTS } from "../strings/results";

const WIDTH = 640;
const HEIGHT = 200;
const PAD = 8;

interface TimelineProps {
  months: readonly MonthTotals[];
  format: (minor: number) => string;
  locale: string;
}

/**
 * Monthly total cost as columns and headcount as a line, both scaled to their own maximum. The
 * SVG is a picture of the table below it (which carries the same figures for screen readers and
 * for anyone who prefers numbers).
 */
export function TimelineChart({ months, format, locale }: Readonly<TimelineProps>) {
  const maxCost = Math.max(1, ...months.map((month) => month.total));
  const maxPeople = Math.max(1, ...months.map((month) => month.headcount));
  const step = (WIDTH - PAD * 2) / months.length;
  const height = HEIGHT - PAD * 2;
  const line = months
    .map((month, index) => {
      const x = PAD + step * index + step / 2;
      const y = PAD + height - (month.headcount / maxPeople) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const people = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  return (
    <figure className="gcc-timeline">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={RESULTS.timelineCaption(months.length)}
      >
        {months.map((month, index) => {
          const barHeight = (month.total / maxCost) * height;
          return (
            <rect
              key={month.month}
              className="gcc-timeline__bar"
              x={PAD + step * index + step * 0.15}
              y={PAD + height - barHeight}
              width={step * 0.7}
              height={barHeight}
            />
          );
        })}
        <path className="gcc-timeline__line" d={line} />
      </svg>
      <figcaption>{RESULTS.timelineCaption(months.length)}</figcaption>
      <details className="gcc-timeline__table">
        <summary>{RESULTS.timelineTable}</summary>
        <section className="gcc-table-scroll" tabIndex={0} aria-label={RESULTS.timelineTable}>
          <table>
            <thead>
              <tr>
                <th scope="col">{RESULTS.month}</th>
                <th scope="col">{RESULTS.headcount}</th>
                <th scope="col">{RESULTS.hires}</th>
                <th scope="col">{RESULTS.total}</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.month}>
                  <th scope="row">{month.month}</th>
                  <td>{people.format(month.headcount)}</td>
                  <td>{people.format(month.hires)}</td>
                  <td>{format(month.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </details>
    </figure>
  );
}
