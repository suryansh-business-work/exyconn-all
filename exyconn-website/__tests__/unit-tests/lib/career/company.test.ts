/** A company's careers page: its facts, its social links, and whether a rich-text field holds text. */
import { describe, expect, it } from "vitest";
import { companyFacts, hasText, socialLinks } from "../../../../src/lib/career/company";
import { company } from "./fixtures";

const LABELS = { employees: "{n} employees", founded: "Founded {year}" };

describe("socialLinks", () => {
  it("lists the set, safe profiles in network order", () => {
    const links = socialLinks(
      company({
        socialLinks: {
          linkedin: "https://linkedin.com/company/acme",
          twitter: "",
          instagram: "https://instagram.com/acme",
          facebook: "javascript:alert(1)",
        },
      })
    );
    expect(links).toEqual([
      { network: "LinkedIn", href: "https://linkedin.com/company/acme" },
      { network: "Instagram", href: "https://instagram.com/acme" },
    ]);
  });

  it("is empty when the record has no social links", () => {
    expect(socialLinks(company())).toEqual([]);
    expect(socialLinks({ socialLinks: undefined as never })).toEqual([]);
  });
});

describe("companyFacts", () => {
  it("lists every fact the record has, with the labels filled in", () => {
    const facts = companyFacts(
      company({ industry: "Software", headquarters: "Pune", employees: "50-100", founded: "2019" }),
      LABELS
    );
    expect(facts).toEqual(["Software", "Pune", "50-100 employees", "Founded 2019"]);
  });

  it("leaves out the facts it lacks, blank text included", () => {
    expect(companyFacts(company({ industry: "  ", headquarters: "Pune" }), LABELS)).toEqual([
      "Pune",
    ]);
    expect(companyFacts(company(), LABELS)).toEqual([]);
  });
});

describe("hasText", () => {
  it("is false for an empty editor value", () => {
    expect(hasText("")).toBe(false);
    expect(hasText("<p></p>")).toBe(false);
    expect(hasText("<p>  <br/> </p>")).toBe(false);
  });

  it("is true once there is any text", () => {
    expect(hasText("<p>We build</p>")).toBe(true);
    expect(hasText("plain")).toBe(true);
  });
});
