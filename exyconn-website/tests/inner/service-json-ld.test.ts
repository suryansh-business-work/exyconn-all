import { describe, expect, it } from "vitest";
import { serviceJsonLd } from "../../src/lib/inner/structured-data";

const provider = { name: "Exyconn", url: "https://exyconn.com" };

describe("serviceJsonLd", () => {
  it("publishes the service, its provider and its offer catalogue", () => {
    const ld = serviceJsonLd({
      name: "AI agents",
      description: "Agents that run real operations.",
      url: "https://exyconn.com/en-us/ai/agentic",
      serviceType: "Artificial intelligence",
      areaServed: "Worldwide",
      provider,
      offers: {
        title: "What we deliver",
        items: [
          { name: "Support agent", description: "Answers tickets." },
          { name: "Sales agent" },
        ],
      },
    });
    expect(ld).toMatchObject({
      "@type": "Service",
      serviceType: "Artificial intelligence",
      areaServed: "Worldwide",
      provider: { "@type": "Organization", name: "Exyconn" },
      hasOfferCatalog: {
        name: "What we deliver",
        itemListElement: [
          { position: 1, name: "Support agent", description: "Answers tickets." },
          { position: 2, name: "Sales agent" },
        ],
      },
    });
    expect(ld.hasOfferCatalog?.itemListElement[1]).not.toHaveProperty("description");
  });

  it("leaves out what was not given, including an empty catalogue", () => {
    const ld = serviceJsonLd({
      name: "Maintenance",
      description: "Keep software healthy.",
      url: "https://exyconn.com/en-us/services/maintenance",
      provider,
      offers: { title: "Included", items: [] },
    });
    expect(ld).not.toHaveProperty("serviceType");
    expect(ld).not.toHaveProperty("areaServed");
    expect(ld).not.toHaveProperty("hasOfferCatalog");
  });
});
