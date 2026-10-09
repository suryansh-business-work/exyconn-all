/** The per-visitor form allowance and how a visitor's address is read. */
import { afterEach, describe, expect, it } from "vitest";
import {
  VISITOR_FORM_LIMIT,
  allowVisitorForm,
  resetVisitorForms,
  visitorAddress,
} from "../../../src/lib/visitor-limit";

const request = (forwarded?: string) =>
  new Request("https://exyconn.com/api/form-submit", {
    headers: forwarded === undefined ? {} : { "x-forwarded-for": forwarded },
  });

afterEach(() => resetVisitorForms());

describe("visitorAddress", () => {
  it("takes the last hop, the one nginx appended", () => {
    expect(visitorAddress(request("192.0.2.1, 192.0.2.2 , 192.0.2.3"))).toBe("192.0.2.3");
    expect(visitorAddress(request("192.0.2.9"))).toBe("192.0.2.9");
  });

  it("ignores empty hops", () => {
    expect(visitorAddress(request("192.0.2.1, ,"))).toBe("192.0.2.1");
  });

  it("is unknown without the header", () => {
    expect(visitorAddress(request())).toBe("unknown");
    expect(visitorAddress(request(" , "))).toBe("unknown");
  });
});

describe("allowVisitorForm", () => {
  const start = 1_000_000_000;

  it("allows the allowance, then refuses inside the window", () => {
    for (let i = 0; i < VISITOR_FORM_LIMIT.points; i += 1) {
      expect(allowVisitorForm("a", start + i)).toBe(true);
    }
    expect(allowVisitorForm("a", start + 10)).toBe(false);
    expect(allowVisitorForm("a", start + 20)).toBe(false);
  });

  it("counts each visitor separately", () => {
    for (let i = 0; i < VISITOR_FORM_LIMIT.points; i += 1) {
      allowVisitorForm("a", start);
    }
    expect(allowVisitorForm("a", start)).toBe(false);
    expect(allowVisitorForm("b", start)).toBe(true);
  });

  it("allows again once the window has passed", () => {
    for (let i = 0; i < VISITOR_FORM_LIMIT.points; i += 1) {
      allowVisitorForm("a", start);
    }
    expect(allowVisitorForm("a", start + VISITOR_FORM_LIMIT.windowMs - 1)).toBe(false);
    expect(allowVisitorForm("a", start + VISITOR_FORM_LIMIT.windowMs)).toBe(true);
  });

  it("defaults to the current time", () => {
    expect(allowVisitorForm("now")).toBe(true);
  });

  it("forgets everyone on reset", () => {
    for (let i = 0; i < VISITOR_FORM_LIMIT.points; i += 1) {
      allowVisitorForm("a", start);
    }
    resetVisitorForms();
    expect(allowVisitorForm("a", start)).toBe(true);
  });

  it("drops the oldest visitor once too many are tracked", () => {
    for (let i = 0; i < VISITOR_FORM_LIMIT.points; i += 1) {
      allowVisitorForm("first", start);
    }
    expect(allowVisitorForm("first", start)).toBe(false);
    for (let i = 0; i < 10_000; i += 1) {
      allowVisitorForm(`v${i}`, start);
    }
    // "first" was the oldest entry, so it was dropped and starts afresh.
    expect(allowVisitorForm("first", start)).toBe(true);
  });
});
