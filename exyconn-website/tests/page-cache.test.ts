import { beforeEach, describe, expect, it } from "vitest";
import { cachePage, cachedPage, clearPageCache } from "../src/lib/i18n/page-cache";

describe("translated pages", () => {
  beforeEach(() => clearPageCache());

  it("are kept per market, so two markets sharing a language never swap pages", () => {
    // One French catalogue serves both — but France's page names France's canonical URL.
    const french = { Save: "Enregistrer" };
    cachePage("fr-fr", "/about-us", '<link rel="canonical" href="/fr-fr/about-us">', french);

    expect(cachedPage("fr-ca", "/about-us", french)).toBeUndefined();
    expect(cachedPage("fr-fr", "/about-us", french)).toContain("/fr-fr/about-us");
  });

  it("are dropped once the catalogue they were translated with has been replaced", () => {
    const before = { Save: "Enregistrer" };
    cachePage("fr-fr", "/", "<p>Enregistrer</p>", before);

    expect(cachedPage("fr-fr", "/", { ...before, Cancel: "Annuler" })).toBeUndefined();
  });
});
