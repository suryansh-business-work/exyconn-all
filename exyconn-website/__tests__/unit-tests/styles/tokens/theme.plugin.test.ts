/** The Tailwind plugin that writes the tokens out as CSS custom properties and colours. */
import type { PluginAPI } from "tailwindcss/plugin";
import { describe, expect, it, vi } from "vitest";
import themePlugin from "../../../../src/styles/tokens/theme.plugin";
import { darkRoles, highContrastRoles, roles } from "../../../../src/styles/tokens/semantic.tokens";

type Block = Record<string, unknown>;

const runPlugin = () => {
  const addBase = vi.fn();
  const addVariant = vi.fn();
  const api = { addBase, addVariant } as unknown as PluginAPI;
  themePlugin.handler(api);
  const base: Record<string, Block> = addBase.mock.calls[0][0];
  return { addBase, addVariant, base };
};

describe("theme plugin handler", () => {
  it("adds a dark variant scoped to the dark theme attribute", () => {
    const { addVariant } = runPlugin();
    expect(addVariant).toHaveBeenCalledWith(
      "dark",
      '&:where([data-theme="dark"], [data-theme="dark"] *)'
    );
  });

  it("writes palette ramps, scale steps and daylight roles on :root", () => {
    const { addBase, base } = runPlugin();
    expect(addBase).toHaveBeenCalledTimes(1);
    const root = base[":root"];
    expect(root["color-scheme"]).toBe("light");
    expect(root["--palette-brand-500"]).toBe("#0071e3");
    expect(root["--palette-base-white"]).toBe("#ffffff");
    expect(root["--space-4"]).toBe("1rem");
    expect(root["--radius-pill"]).toBe("9999px");
    expect(root["--color-page"]).toBe("var(--palette-base-white)");
    expect(root["--color-fg"]).toBe("var(--palette-gray-900)");
  });

  it("writes only the night overrides under the dark theme selector", () => {
    const { base } = runPlugin();
    const dark = base['[data-theme="dark"]'];
    expect(dark["color-scheme"]).toBe("dark");
    expect(dark["--color-fg"]).toBe(darkRoles.fg);
    expect(dark["--color-on-solid"]).toBeUndefined();
    expect(Object.keys(dark)).toHaveLength(Object.keys(darkRoles).length + 1);
  });

  it("paints the ring offset gap with the page colour", () => {
    const { base } = runPlugin();
    expect(base["*, ::before, ::after"]).toEqual({
      "--tw-ring-offset-color": "var(--color-page)",
    });
  });

  it("applies the high-contrast roles only outside dark mode", () => {
    const { base } = runPlugin();
    expect(base["@media (prefers-contrast: high)"]).toEqual({
      ':root:not([data-theme="dark"])': {
        "--color-primary": highContrastRoles.primary,
        "--color-fg-muted": highContrastRoles["fg-muted"],
      },
    });
  });
});

describe("theme plugin config", () => {
  const colors = themePlugin.config?.theme?.extend?.colors as Record<string, string>;

  it("keeps the keyword colours", () => {
    expect(colors.transparent).toBe("transparent");
    expect(colors.current).toBe("currentColor");
    expect(colors.inherit).toBe("inherit");
  });

  it("exposes one Tailwind colour per role, reading its custom property", () => {
    expect(colors.surface).toBe("var(--color-surface)");
    expect(colors["fg-muted"]).toBe("var(--color-fg-muted)");
    const missing = Object.keys(roles).filter((role) => colors[role] !== `var(--color-${role})`);
    expect(missing).toEqual([]);
  });
});
