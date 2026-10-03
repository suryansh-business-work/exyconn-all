import { describe, expect, it } from "vitest";
import { baselineJsonLd, ORGANIZATION_PROFILE } from "../../src/lib/chrome/site-schema";

describe("baseline JSON-LD", () => {
  it("publishes the organisation and the site search on every page", () => {
    const [organization, site] = baselineJsonLd({
      businessName: "Exyconn",
      organizationUrl: "https://exyconn.com",
      siteUrl: "https://exyconn.com",
      logo: "https://exyconn.com/favicon.svg",
    });
    const text = JSON.stringify([organization, site]);
    expect(text).toContain('"Organization"');
    expect(text).toContain('"WebSite"');
    expect(text).toContain("https://exyconn.com/contact");
    expect(text).toContain("https://exyconn.com/blog?q={search_term_string}");
    expect(text).toContain(ORGANIZATION_PROFILE.sameAs[0]);
  });
});
