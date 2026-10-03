import { describe, expect, it } from "vitest";
import { aboutWork, fillTemplate, withSummaries } from "../../src/lib/company/about";
import { AGENTS, agentRequest, selectedAgentNames } from "../../src/lib/company/agents";
import { SERVICES_EMAIL, contactChannels } from "../../src/lib/company/contact";
import { COUNTRY_POINTS } from "../../src/lib/company/country-points";
import {
  MAX_GLOBE_ARCS,
  countriesByLanguage,
  marketArcs,
  marketFacts,
} from "../../src/lib/company/markets-globe";
import { visionHorizons } from "../../src/lib/company/vision";
import { MARKETS, type Market } from "../../src/lib/i18n/markets";

const market = (path: string, language: string, country: string | null): Market => ({
  path,
  label: path,
  language,
  country,
  locale: `${language}-${country ?? "XX"}`,
});

describe("about page data", () => {
  it("gives every 'what we do' item the summary its own page uses", () => {
    expect(aboutWork).toHaveLength(5);
    expect(aboutWork.every((item) => item.text.length > 0)).toBe(true);
  });

  it("refuses an item whose page lost its summary", () => {
    expect(() => withSummaries([{ title: "Gone", href: "/gone" }], [])).toThrow(
      "No summary for /gone"
    );
  });

  it("fills every placeholder in a sentence", () => {
    expect(fillTemplate("{a} of {b}, {a}", { a: 1, b: 2 })).toBe("1 of 2, 1");
  });
});

describe("markets globe", () => {
  it("places every country the market registry names", () => {
    const countries = new Set(MARKETS.flatMap((m) => (m.country ? [m.country] : [])));
    expect([...countries].filter((code) => !COUNTRY_POINTS[code])).toEqual([]);
  });

  it("groups distinct countries per language and skips markets without one", () => {
    const groups = countriesByLanguage([
      market("fr-fr", "fr", "FR"),
      market("fr-be", "fr", "BE"),
      market("fr-be2", "fr", "BE"),
      market("en-gulf", "en", null),
    ]);
    expect([...groups.entries()]).toEqual([["fr", ["FR", "BE"]]]);
  });

  it("chains each language's countries and interleaves the chains", () => {
    const arcs = marketArcs([
      market("es-es", "es", "ES"),
      market("es-mx", "es", "MX"),
      market("es-ar", "es", "AR"),
      market("de-de", "de", "DE"),
      market("de-at", "de", "AT"),
      market("is-is", "is", "IS"),
      market("xx-zz", "xx", "ZZ"),
      market("xx-de", "xx", "DE"),
    ]);
    expect(arcs).toEqual([
      { from: COUNTRY_POINTS.ES, to: COUNTRY_POINTS.MX },
      { from: COUNTRY_POINTS.DE, to: COUNTRY_POINTS.AT },
      { from: COUNTRY_POINTS.MX, to: COUNTRY_POINTS.AR },
    ]);
  });

  it("draws at most the phone-readable number of arcs, and none without markets", () => {
    expect(marketArcs(MARKETS)).toHaveLength(MAX_GLOBE_ARCS);
    expect(marketArcs(MARKETS, 3)).toHaveLength(3);
    expect(marketArcs([])).toEqual([]);
  });

  it("counts markets, countries and languages", () => {
    expect(
      marketFacts([
        market("en-gb", "en", "GB"),
        market("cy-gb", "cy", "GB"),
        market("en-gulf", "en", null),
      ])
    ).toEqual({ markets: 3, countries: 1, languages: 2 });
  });
});

describe("order agents", () => {
  it("names the chosen agents in catalogue order", () => {
    expect(selectedAgentNames(["hr-onboarding", "sales-automation", "nope"])).toEqual([
      "Sales Automation Agent",
      "HR Onboarding Agent",
    ]);
    expect(AGENTS).toHaveLength(5);
  });

  it("sends the contact fields with the agents in the message", () => {
    const contact = { firstName: "Ada", lastName: "L", email: "a@b.co", company: "X", notes: "" };
    expect(agentRequest(contact, ["A", "B"])).toEqual({
      firstName: "Ada",
      lastName: "L",
      email: "a@b.co",
      company: "X",
      subject: "project",
      page: "order-agents",
      agents: "A, B",
      message: "Requested agents: A, B",
    });
    expect(agentRequest({ ...contact, notes: " Soon " }, ["A"]).message).toBe(
      "Requested agents: A\n\nSoon"
    );
  });
});

describe("company copy", () => {
  it("keeps the HR and services addresses the contact page has always listed", () => {
    expect(contactChannels.map((channel) => channel.href)).toEqual([
      "mailto:hr@exyconn.com",
      `mailto:${SERVICES_EMAIL}`,
      "/legal",
    ]);
  });

  it("lays the vision's goals out as three horizons", () => {
    expect(visionHorizons.map((horizon) => horizon.when)).toEqual(["Now", "Next", "Later"]);
  });
});
