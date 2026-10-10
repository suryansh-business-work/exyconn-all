import { describe, expect, it } from "vitest";
import { stripTags } from "../../../src/lib/text-trim";

describe("stripTags", () => {
  it("removes every complete tag and keeps the text between them", () => {
    expect(stripTags("<p>Hello <b>there</b></p>")).toBe("Hello there");
  });

  it("keeps a trailing '<' that never closes, as the equivalent regex does", () => {
    const html = "<p>a</p> 1 < 2";
    expect(stripTags(html)).toBe(html.replaceAll(/<[^>]*>/g, ""));
    expect(stripTags(html)).toBe("a 1 < 2");
  });
});
