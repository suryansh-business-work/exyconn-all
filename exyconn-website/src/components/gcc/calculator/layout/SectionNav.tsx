import LinearProgress from "@mui/material/LinearProgress";
import { useCalculator } from "../state/CalculatorContext";
import { SECTIONS } from "../strings/sections";
import { UI } from "../strings/ui";

/**
 * Progress and free navigation between the ten steps. Every step is reachable at any time —
 * values live in one form, so moving around never loses anything. The list scrolls sideways on
 * small screens instead of overflowing the page.
 */
export function SectionNav() {
  const { step, goTo } = useCalculator();
  const index = SECTIONS.findIndex((section) => section.id === step);
  const progress = ((index + 1) / SECTIONS.length) * 100;
  return (
    <nav className="gcc-nav" aria-label={UI.nav.sections}>
      <div className="gcc-nav__progress">
        <span>{UI.nav.progress(index + 1, SECTIONS.length)}</span>
        <LinearProgress
          variant="determinate"
          value={progress}
          aria-label={UI.nav.progress(index + 1, SECTIONS.length)}
        />
      </div>
      <ol className="gcc-nav__list">
        {SECTIONS.map((section, position) => (
          <li key={section.id}>
            <button
              type="button"
              className="gcc-nav__item"
              aria-current={section.id === step ? "step" : undefined}
              onClick={() => goTo(section.id)}
            >
              <span className="gcc-nav__index" aria-hidden="true">
                {String(position + 1).padStart(2, "0")}
              </span>
              <span>{section.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
