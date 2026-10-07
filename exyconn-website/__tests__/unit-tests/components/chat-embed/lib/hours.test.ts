/** Today's opening hours in the team's own timezone. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayHours } from "../../../../../src/components/chat-embed/lib/hours";
import type { OpeningDay } from "../../../../../src/components/chat-embed/types";

// A Wednesday evening in UTC, which is already Thursday morning in Tokyo.
const NOW = new Date("2026-10-07T20:00:00Z");

const WEEK: OpeningDay[] = [
  { day: 3, enabled: true, start: "09:00", end: "18:00" },
  { day: 4, enabled: false, start: "10:00", end: "16:00" },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("todayHours", () => {
  it("reads today's hours where the team works", () => {
    const hours = todayHours(WEEK, "UTC");
    expect(hours).toMatchObject({ open: true, start: "09:00", end: "18:00" });
    expect(hours?.zone).toMatch(/UTC|GMT/);
  });

  it("uses the team's weekday, not the visitor's", () => {
    const hours = todayHours(WEEK, "Asia/Tokyo");
    expect(hours).toMatchObject({ open: false, start: "10:00", end: "16:00" });
    expect(hours?.zone).toMatch(/GMT\+9|JST/);
  });

  it("is closed with no times when today is not in the week", () => {
    expect(todayHours([], "UTC")).toMatchObject({ open: false, start: "", end: "" });
  });

  it("labels the zone by its name when the runtime gives no short name", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockReturnValue([]);
    expect(todayHours(WEEK, "UTC")?.zone).toBe("UTC");
  });

  it("is null, with a warning, for a timezone the browser does not know", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(todayHours(WEEK, "Not/AZone")).toBeNull();
    expect(warn).toHaveBeenCalledWith("[chat] could not read the opening hours", expect.any(Error));
  });
});
