/** The light/dark theme helpers and the separately deployed site domains. */
import { describe, expect, it } from "vitest";
import { TOOLS_SITE_URL } from "../../../src/lib/site";
import {
  DARK_MEDIA_QUERY,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  THEMES,
  isTheme,
  themeSelector,
} from "../../../src/lib/theme";

describe("theme", () => {
  it("offers light and dark", () => {
    expect(THEMES).toEqual(["light", "dark"]);
    expect(THEME_ATTRIBUTE).toBe("data-theme");
    expect(THEME_STORAGE_KEY).toBe("exyconn-theme");
    expect(DARK_MEDIA_QUERY).toBe("(prefers-color-scheme: dark)");
  });

  it("builds the attribute selector a theme's roles are declared under", () => {
    expect(themeSelector("dark")).toBe('[data-theme="dark"]');
    expect(themeSelector("light")).toBe('[data-theme="light"]');
  });

  it("recognises only the known themes", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("Dark")).toBe(false);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(1)).toBe(false);
  });
});

describe("site", () => {
  it("links out to the tools catalogue over https", () => {
    expect(new URL(TOOLS_SITE_URL).protocol).toBe("https:");
    expect(new URL(TOOLS_SITE_URL).hostname).toBe("tools.exyconn.com");
  });
});
