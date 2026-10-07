/** The Organization + WebSite JSON-LD every page carries, and the footer's newsletter copy. */
import { describe, expect, it } from "vitest";
import { NEWSLETTER_COPY } from "../../../../src/lib/chrome/newsletter";
import { baselineJsonLd, ORGANIZATION_PROFILE } from "../../../../src/lib/chrome/site-schema";

const identity = {
  businessName: "Acme",
  organizationUrl: "https://acme.test",
  siteUrl: "https://site.test",
  logo: "https://site.test/logo.svg",
  profiles: ["https://linkedin.com/company/acme", "https://x.com/acme"],
};

describe("baselineJsonLd", () => {
  it("describes the organisation with its profiles and a support contact on this site", () => {
    const [organization] = baselineJsonLd(identity);
    expect(organization).toMatchObject({
      "@type": "Organization",
      name: "Acme",
      url: "https://acme.test",
      logo: "https://site.test/logo.svg",
      description: ORGANIZATION_PROFILE.description,
      knowsAbout: [...ORGANIZATION_PROFILE.knowsAbout],
      sameAs: identity.profiles,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://site.test/contact",
        availableLanguage: ["English"],
      },
    });
  });

  it("names the website with a blog search action on this site", () => {
    const [, site] = baselineJsonLd(identity);
    expect(site).toMatchObject({
      "@type": "WebSite",
      name: "Acme",
      url: "https://acme.test",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://site.test/blog?q={search_term_string}",
      },
    });
  });

  it("copies the profiles instead of sharing the caller's array", () => {
    const profiles = ["https://clutch.co/profile/acme"];
    const [organization] = baselineJsonLd({ ...identity, profiles });
    expect(organization.sameAs).toEqual(profiles);
    expect(organization.sameAs).not.toBe(profiles);
  });
});

describe("newsletter copy", () => {
  it("offers a label for every state of the form", () => {
    expect(NEWSLETTER_COPY.submit).toBe("Subscribe");
    expect(NEWSLETTER_COPY.busy).toMatch(/Subscribing/);
    expect(NEWSLETTER_COPY.success).toMatch(/Thank you/);
    expect(NEWSLETTER_COPY.error).toMatch(/try again/);
    expect(NEWSLETTER_COPY.benefits).toHaveLength(4);
  });
});
