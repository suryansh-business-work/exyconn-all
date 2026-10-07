/** The chat's MUI theme: the site's tokens resolved per mode, motion and component overrides. */
import type { CssVarsTheme } from "@mui/material/styles";
import { describe, expect, it } from "vitest";
import { chatRadius, createChatTheme, role } from "../../../../src/components/chat-embed/theme";
import { palette } from "../../../../src/styles/tokens/palette.tokens";

type ChatTheme = ReturnType<typeof createChatTheme>;

/** The per-mode colour systems a CSS-variables theme carries (absent from the plain Theme type). */
const schemes = (theme: ChatTheme) => (theme as unknown as CssVarsTheme).colorSchemes;
const lightPalette = (theme: ChatTheme) => schemes(theme).light?.palette;
const darkPalette = (theme: ChatTheme) => schemes(theme).dark?.palette;

describe("role", () => {
  it("answers a role with its literal ramp value in each mode", () => {
    expect(role("fg", "light")).toBe(palette.gray[900]);
    expect(role("fg", "dark")).toBe(palette.gray[50]);
    expect(role("on-solid", "dark")).toBe(palette.base.white);
  });

  it("resolves a role that points at another role, and every ramp inside a mix", () => {
    const subtle = `color-mix(in oklab, ${palette.gray[500]}, ${palette.gray[600]})`;
    expect(role("fg-subtle", "light")).toBe(subtle);
    expect(role("fg-faint", "light")).toBe(subtle);
    expect(role("fg-faint", "dark")).toBe(palette.gray[400]);
  });
});

describe("createChatTheme", () => {
  const theme = createChatTheme(false);
  const light = lightPalette(theme);
  const dark = darkPalette(theme);

  it("follows <html data-theme> and keeps the host page's colour scheme", () => {
    expect(theme.vars).toBeDefined();
    expect(Object.keys(schemes(theme)).sort((a, b) => a.localeCompare(b))).toEqual([
      "dark",
      "light",
    ]);
    expect(light?.mode).toBe("light");
    expect(dark?.mode).toBe("dark");
  });

  it("paints both modes from the site's roles", () => {
    expect(light?.text.primary).toBe(role("fg", "light"));
    expect(dark?.text.primary).toBe(role("fg", "dark"));
    expect(light?.background.paper).toBe(role("surface", "light"));
    expect(light?.divider).toBe(role("line", "light"));
    expect(light?.primary.main).toBe(role("primary", "light"));
  });

  it("puts white on status fills by day and dark ink by night", () => {
    expect(light?.error.contrastText).toBe(role("on-solid", "light"));
    expect(dark?.error.contrastText).toBe(role("on-bright", "dark"));
    expect(dark?.warning.contrastText).toBe(role("on-bright", "dark"));
    expect(light?.success.contrastText).toBe(role("on-solid", "light"));
  });

  it("gives the chat's own surfaces mode-specific edges, tracks and thumbs", () => {
    expect(light?.chat.edge).toBe(role("line", "light"));
    expect(dark?.chat.edge).toBe(role("line-subtle", "dark"));
    expect(light?.chat.track).toBe(role("surface-muted", "light"));
    expect(dark?.chat.track).toBe(role("surface-subtle", "dark"));
    expect(light?.chat.thumb).toBe(role("surface", "light"));
    expect(dark?.chat.thumb).toBe(role("surface-muted", "dark"));
  });

  it("builds the brand gradient and the night header band with no variable left over", () => {
    const chat = light?.chat;
    expect(chat?.accent).toBe(
      `linear-gradient(135deg, ${role("violet-strong", "light")} 0%, ${role("fuchsia-deep", "light")} 100%)`
    );
    expect(chat?.headerBg.match(/gradient\(/g)).toHaveLength(3);
    expect(chat?.headerBg).toContain(role("indigo-night", "light"));
    expect(chat?.headerChip).toBe(`color-mix(in srgb, ${palette.base.white} 12%, transparent)`);
    for (const value of Object.values(chat ?? {})) {
      expect(value).not.toContain("var(--");
    }
  });

  it("spreads the site's shadow steps over 25 elevations", () => {
    expect(theme.shadows).toHaveLength(25);
    expect(theme.shadows[0]).toBe("none");
    expect(theme.shadows[1]).toBe(
      `0 1px 3px color-mix(in srgb, ${palette.base.black} 6%, transparent)`
    );
    expect(theme.shadows[4]).toBe(theme.shadows[3]);
    expect(theme.shadows[24]).toBe(
      `0 12px 48px color-mix(in srgb, ${palette.base.black} 12%, transparent)`
    );
  });

  it("uses the site's type, radius and sentence-case buttons", () => {
    expect(theme.shape.borderRadius).toBe(8);
    expect(theme.typography.fontFamily).toMatch(/^"Inter Tight", sans-serif, system-ui/);
    expect(theme.typography.button.textTransform).toBe("none");
    expect(theme.typography.button.fontWeight).toBe(600);
  });

  it("keeps MUI's motion unless the visitor asks for less", () => {
    expect(theme.transitions.duration.standard).toBeGreaterThan(0);
    expect(theme.components?.MuiButtonBase?.defaultProps?.disableRipple).toBe(false);
    const still = createChatTheme(true);
    expect(still.transitions.duration.standard).toBe(0);
    expect(still.transitions.duration.enteringScreen).toBe(0);
    expect(still.transitions.duration.leavingScreen).toBe(0);
    expect(still.components?.MuiButtonBase?.defaultProps?.disableRipple).toBe(true);
  });
});

describe("chatRadius", () => {
  it("names the chat's corner steps from the site's scale", () => {
    expect(chatRadius).toEqual({ panel: "20px", bubble: "16px", tail: "4px", pill: "9999px" });
  });
});
