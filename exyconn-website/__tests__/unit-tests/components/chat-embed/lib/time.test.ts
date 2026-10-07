/** Message times, day separators and m:ss durations, in the visitor's own locale. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dayKey,
  dayLabel,
  formatDuration,
  formatFullTime,
  formatTime,
} from "../../../../../src/components/chat-embed/lib/time";

const NOW = "2026-10-07T12:00:00.000Z";
const LABELS = { today: "Today", yesterday: "Yesterday" };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatTime / formatFullTime", () => {
  it("formats in the visitor's locale and timezone", () => {
    const date = new Date(NOW);
    expect(formatTime(NOW)).toBe(
      new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(date)
    );
    expect(formatFullTime(NOW)).toBe(
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)
    );
  });

  it("puts the date in the full form only", () => {
    expect(formatFullTime(NOW).length).toBeGreaterThan(formatTime(NOW).length);
    expect(formatFullTime(NOW)).toContain("2026");
  });
});

describe("dayKey", () => {
  it("is the same for two moments of one local day and differs a day later", () => {
    const later = new Date(new Date(NOW).getTime() + 60_000).toISOString();
    const tomorrow = new Date(new Date(NOW).getTime() + 86_400_000).toISOString();
    expect(dayKey(later)).toBe(dayKey(NOW));
    expect(dayKey(tomorrow)).not.toBe(dayKey(NOW));
  });
});

describe("dayLabel", () => {
  it("says today and yesterday", () => {
    expect(dayLabel(NOW, LABELS)).toBe("Today");
    expect(dayLabel("2026-10-06T12:00:00.000Z", LABELS)).toBe("Yesterday");
  });

  it("shows the date for anything older", () => {
    const older = "2026-09-01T12:00:00.000Z";
    expect(dayLabel(older, LABELS)).toBe(
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(older))
    );
  });
});

describe("formatDuration", () => {
  it("writes seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(120)).toBe("2:00");
    expect(formatDuration(600)).toBe("10:00");
  });
});
