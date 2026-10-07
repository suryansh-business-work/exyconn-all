import { describe, expect, it } from "vitest";
import { readerDate } from "../../../../src/lib/legal/dates";

describe("reader dates", () => {
  it("writes the date the way the reader's market writes it", () => {
    expect(readerDate("2025-06-27", "en-GB")).toEqual({ iso: "2025-06-27", text: "27 June 2025" });
    expect(readerDate("2025-06-27", "en-US").text).toBe("June 27, 2025");
    expect(readerDate("2025-06-27", "de-DE").text).toBe("27. Juni 2025");
  });

  it("keeps the UTC calendar day whatever offset the value was written in", () => {
    expect(readerDate("2025-06-27T23:30:00-05:00", "en-GB")).toEqual({
      iso: "2025-06-28",
      text: "28 June 2025",
    });
  });

  it("throws on a value that is not a date", () => {
    expect(() => readerDate("not a date", "en-GB")).toThrow(RangeError);
  });
});
