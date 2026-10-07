/** Small text helpers for the careers pages. */
import { describe, expect, it } from "vitest";
import {
  chapterNumbers,
  countLabel,
  fill,
  liveStats,
  sceneCount,
} from "../../../../src/lib/career/format";

describe("fill", () => {
  it("fills every known placeholder", () => {
    expect(fill("{n} open roles at {company}", { n: 3, company: "Acme" })).toBe(
      "3 open roles at Acme"
    );
  });

  it("leaves unknown placeholders as they are", () => {
    expect(fill("{n} of {total}", { n: 1 })).toBe("1 of {total}");
  });

  it("returns text without placeholders unchanged", () => {
    expect(fill("No roles", { n: 0 })).toBe("No roles");
  });
});

describe("countLabel", () => {
  it("uses the singular for one and the plural otherwise", () => {
    expect(countLabel(1, "1 role", "{n} roles")).toBe("1 role");
    expect(countLabel(0, "1 role", "{n} roles")).toBe("0 roles");
    expect(countLabel(4, "1 role", "{n} roles")).toBe("4 roles");
  });
});

describe("sceneCount", () => {
  it("clamps a live count into the range", () => {
    expect(sceneCount(1, 3, 10)).toBe(3);
    expect(sceneCount(5, 3, 10)).toBe(5);
    expect(sceneCount(50, 3, 10)).toBe(10);
  });

  it("is undefined for no items, so the shape keeps its default", () => {
    expect(sceneCount(0, 3, 10)).toBeUndefined();
    expect(sceneCount(-2, 3, 10)).toBeUndefined();
  });
});

describe("liveStats", () => {
  it("turns counts into stats and leaves zeros out", () => {
    expect(
      liveStats([
        { count: 12, label: "Open roles" },
        { count: 0, label: "Gigs" },
        { count: 3, label: "Companies" },
      ])
    ).toEqual([
      { value: "12", label: "Open roles" },
      { value: "3", label: "Companies" },
    ]);
  });
});

describe("chapterNumbers", () => {
  it("numbers only the chapters shown, absent keys counting as shown", () => {
    expect(chapterNumbers(["about", "culture", "roles"], { culture: false })).toEqual({
      about: 1,
      roles: 2,
    });
  });

  it("numbers every chapter when all are shown", () => {
    expect(chapterNumbers(["a", "b"], { a: true })).toEqual({ a: 1, b: 2 });
  });

  it("numbers nothing when nothing is shown", () => {
    expect(chapterNumbers(["a"], { a: false })).toEqual({});
  });
});
