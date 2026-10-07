/** The company's social profiles, in display order, from Admin > Branding. */
import { describe, expect, it } from "vitest";
import { BRANDING_FALLBACK, type Branding } from "../../../src/lib/portal";
import { socialLinks } from "../../../src/lib/social-links";

const NO_PROFILES: Branding = {
  ...BRANDING_FALLBACK,
  linkedinUrl: "",
  twitterUrl: "",
  clutchUrl: "",
  crunchbaseUrl: "",
  ambitionboxUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  githubUrl: "",
};

describe("socialLinks", () => {
  it("falls back to the company's known profiles until an admin sets them", () => {
    const links = socialLinks(NO_PROFILES);
    const expected = [
      ["linkedin", BRANDING_FALLBACK.linkedinUrl],
      ["twitter", BRANDING_FALLBACK.twitterUrl],
      ["clutch", BRANDING_FALLBACK.clutchUrl],
      ["crunchbase", BRANDING_FALLBACK.crunchbaseUrl],
      ["ambitionbox", BRANDING_FALLBACK.ambitionboxUrl],
      ["github", BRANDING_FALLBACK.githubUrl],
    ].filter(([, url]) => url !== "");
    expect(links.map((link) => [link.id, link.url])).toEqual(expected);
  });

  it("lists every network an admin set, in display order", () => {
    const links = socialLinks({
      ...NO_PROFILES,
      linkedinUrl: "https://linkedin.com/company/x",
      twitterUrl: "https://x.com/x",
      clutchUrl: "https://clutch.co/x",
      crunchbaseUrl: "https://crunchbase.com/x",
      ambitionboxUrl: "https://ambitionbox.com/x",
      facebookUrl: "https://facebook.com/x",
      instagramUrl: "https://instagram.com/x",
      youtubeUrl: "https://youtube.com/@x",
      githubUrl: "https://github.com/x",
    });
    expect(links.map((link) => link.id)).toEqual([
      "linkedin",
      "twitter",
      "clutch",
      "crunchbase",
      "ambitionbox",
      "facebook",
      "instagram",
      "youtube",
      "github",
    ]);
    expect(links.find((link) => link.id === "youtube")?.url).toBe("https://youtube.com/@x");
  });

  it("draws Font Awesome glyphs where they exist and brand marks otherwise", () => {
    const links = socialLinks({ ...NO_PROFILES, facebookUrl: "https://facebook.com/x" });
    const byId = new Map(links.map((link) => [link.id, link]));
    expect(byId.get("facebook")?.glyph).toEqual({
      kind: "font",
      className: "fa-brands fa-facebook-f",
    });
    expect(byId.get("facebook")?.label).toBe("Follow us on Facebook (opens in new tab)");
    const clutch = socialLinks({ ...NO_PROFILES, clutchUrl: "https://clutch.co/x" }).find(
      (link) => link.id === "clutch"
    );
    expect(clutch?.glyph).toEqual({ kind: "mark", className: "brand-mark-clutch" });
  });

  it("leaves out networks without an account", () => {
    const ids = socialLinks(NO_PROFILES).map((link) => link.id);
    expect(ids).not.toContain("facebook");
    expect(ids).not.toContain("instagram");
    expect(ids).not.toContain("youtube");
  });

  it("drops a link that is not safe to print", () => {
    const links = socialLinks({
      ...NO_PROFILES,
      instagramUrl: "javascript:alert(1)",
      youtubeUrl: "  https://youtube.com/@x  ",
    });
    const ids = links.map((link) => link.id);
    expect(ids).not.toContain("instagram");
    expect(links.find((link) => link.id === "youtube")?.url).toBe("https://youtube.com/@x");
  });
});
