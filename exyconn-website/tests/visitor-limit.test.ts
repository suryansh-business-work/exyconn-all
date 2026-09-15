import { beforeEach, describe, expect, it } from "vitest";
import {
  VISITOR_FORM_LIMIT,
  allowVisitorForm,
  resetVisitorForms,
  visitorAddress,
} from "../src/lib/visitor-limit";

describe("visitor form limit", () => {
  beforeEach(() => resetVisitorForms());

  it("reads the address nginx appended, not one the client put in front of it", () => {
    const request = new Request("https://exyconn.com/api/form-submit", {
      headers: { "x-forwarded-for": "6.6.6.6, 203.0.113.9" },
    });
    expect(visitorAddress(request)).toBe("203.0.113.9");
  });

  it("allows a visitor their allowance per window, then again once it has passed", () => {
    const start = 1_000_000;
    for (let i = 0; i < VISITOR_FORM_LIMIT.points; i += 1) {
      expect(allowVisitorForm("203.0.113.9", start + i)).toBe(true);
    }
    expect(allowVisitorForm("203.0.113.9", start + 10)).toBe(false);
    expect(allowVisitorForm("198.51.100.1", start + 10)).toBe(true);
    expect(allowVisitorForm("203.0.113.9", start + VISITOR_FORM_LIMIT.windowMs + 10)).toBe(true);
  });
});
