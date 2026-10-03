import { onceInView, reducedMotion } from "./motion";

/**
 * Stat counters: the final value is already in the DOM (and is what crawlers, screen readers
 * and reduced-motion visitors get). Once in view, the first number in it counts up from 0.
 */
const NUMBER = /\d[\d,]*(?:\.\d+)?/;
export const COUNT_MS = 1400;

export const easeOut = (t: number): number => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

/** `text` with its first number shown at `progress` (0–1) of its value, same formatting. */
export const countFrame = (text: string, progress: number): string => {
  const match = NUMBER.exec(text);
  if (!match) {
    return text;
  }
  const raw = match[0];
  const decimals = raw.split(".")[1]?.length ?? 0;
  const value = Number.parseFloat(raw.replaceAll(",", "")) * easeOut(progress);
  const shown = raw.includes(",")
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value.toFixed(decimals);
  return text.slice(0, match.index) + shown + text.slice(match.index + raw.length);
};

const run = (element: HTMLElement) => {
  const final = element.textContent ?? "";
  const start = performance.now();
  const frame = (now: number) => {
    const progress = (now - start) / COUNT_MS;
    element.textContent = countFrame(final, progress);
    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  };
  requestAnimationFrame(frame);
};

export const bootCounters = (): void => {
  if (reducedMotion()) {
    return;
  }
  onceInView(document.querySelectorAll<HTMLElement>("[data-count]"), (element) =>
    run(element as HTMLElement)
  );
};
