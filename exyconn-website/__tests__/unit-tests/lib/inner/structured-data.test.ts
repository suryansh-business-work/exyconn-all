import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  serviceJsonLd,
  type ServiceLd,
} from "../../../../src/lib/inner/structured-data";

describe("FAQ JSON-LD", () => {
  it("publishes each question with its plain-text answer", () => {
    expect(faqJsonLd([{ question: "How long?", answer: "Six weeks." }])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How long?",
          acceptedAnswer: { "@type": "Answer", text: "Six weeks." },
        },
      ],
    });
  });
});

describe("breadcrumb JSON-LD", () => {
  it("numbers the crumbs and makes every link absolute", () => {
    const ld = breadcrumbJsonLd(
      [
        { label: "Home", href: "/" },
        { label: "Partner", href: "https://partner.example.com/x" },
        { label: "Services", href: "/services" },
        { label: "Here" },
      ],
      "https://exyconn.com/"
    );

    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://exyconn.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Partner",
        item: "https://partner.example.com/x",
      },
      { "@type": "ListItem", position: 3, name: "Services", item: "https://exyconn.com/services" },
      { "@type": "ListItem", position: 4, name: "Here" },
    ]);
  });
});

describe("service JSON-LD", () => {
  const base: ServiceLd = {
    name: "AI agents",
    description: "Agents that work.",
    url: "https://exyconn.com/ai/agentic",
    provider: { name: "Exyconn", url: "https://exyconn.com" },
  };

  it("publishes only the fields a service has", () => {
    expect(serviceJsonLd(base)).toEqual({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "AI agents",
      description: "Agents that work.",
      url: "https://exyconn.com/ai/agentic",
      provider: { "@type": "Organization", name: "Exyconn", url: "https://exyconn.com" },
    });
  });

  it("adds the type, the area and the offer catalogue when given", () => {
    const ld = serviceJsonLd({
      ...base,
      serviceType: "AI agents",
      areaServed: "Worldwide",
      offers: {
        title: "What is included",
        items: [{ name: "Discovery", description: "Two workshops" }, { name: "Build" }],
      },
    });

    expect(ld).toMatchObject({ serviceType: "AI agents", areaServed: "Worldwide" });
    expect(ld.hasOfferCatalog).toEqual({
      "@type": "OfferCatalog",
      name: "What is included",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Discovery", description: "Two workshops" },
        { "@type": "ListItem", position: 2, name: "Build" },
      ],
    });
  });

  it("leaves out an offer catalogue with no items", () => {
    const ld = serviceJsonLd({ ...base, offers: { title: "Nothing yet", items: [] } });
    expect(ld).not.toHaveProperty("hasOfferCatalog");
  });
});
