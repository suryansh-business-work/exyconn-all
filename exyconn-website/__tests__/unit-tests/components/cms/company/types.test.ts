/** The CMS keeps empty fields so editors can fill them; empty means "show nothing". */
import { describe, expect, it } from "vitest";
import { cmsAction, cmsText } from "../../../../../src/components/cms/company/types";

describe("cmsAction", () => {
  it("is the button when it has a label", () => {
    const action = { label: "Contact us", href: "/contact", external: false };
    expect(cmsAction(action)).toBe(action);
  });

  it("is no button when the label is empty or the field is missing", () => {
    expect(cmsAction({ label: "", href: "/contact" })).toBeUndefined();
    expect(cmsAction(undefined)).toBeUndefined();
  });
});

describe("cmsText", () => {
  it("keeps written copy and drops an empty string", () => {
    expect(cmsText("A short lede")).toBe("A short lede");
    expect(cmsText("")).toBeUndefined();
    expect(cmsText(undefined)).toBeUndefined();
  });
});
