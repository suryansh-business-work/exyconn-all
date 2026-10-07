/** The chat's MUI component overrides: the site's control language applied to MUI. */
import { describe, expect, it } from "vitest";
import { chatComponents } from "../../../../src/components/chat-embed/theme.components";

describe("chatComponents", () => {
  const components = chatComponents(false);

  it("turns ripples off only when the visitor prefers reduced motion", () => {
    expect(components.MuiButtonBase?.defaultProps?.disableRipple).toBe(false);
    expect(chatComponents(true).MuiButtonBase?.defaultProps?.disableRipple).toBe(true);
  });

  it("draws the site's focus ring on keyboard focus", () => {
    expect(components.MuiButtonBase?.styleOverrides?.root).toEqual({
      "&.Mui-focusVisible": {
        outline: "3px solid var(--mui-palette-chat-focus)",
        outlineOffset: "2px",
      },
    });
  });

  it("paints primary buttons in ink on paper, contained and outlined", () => {
    const [contained, outlined] = components.MuiButton?.variants ?? [];
    expect(contained?.props).toEqual({ variant: "contained", color: "primary" });
    expect(contained?.style).toMatchObject({
      backgroundColor: "var(--mui-palette-text-primary)",
      color: "var(--mui-palette-background-paper)",
    });
    expect(outlined?.props).toEqual({ variant: "outlined", color: "primary" });
    expect(outlined?.style).toMatchObject({ borderColor: "var(--mui-palette-chat-edge)" });
    expect(components.MuiButton?.defaultProps?.disableElevation).toBe(true);
    expect(components.MuiButton?.styleOverrides?.root).toMatchObject({ borderRadius: "12px" });
  });

  it("uses the site's fast easing for icon buttons and fields", () => {
    const ease = "0.15s cubic-bezier(0.4, 0, 0.2, 1)";
    expect(components.MuiIconButton?.styleOverrides?.root).toEqual({
      transition: `background-color ${ease}, color ${ease}`,
    });
    expect(components.MuiOutlinedInput?.styleOverrides?.root).toMatchObject({
      transition: `box-shadow ${ease}`,
      "&.Mui-focused": { boxShadow: "0 0 0 4px var(--mui-palette-chat-tint)" },
    });
  });

  it("keeps placeholders at full muted ink and chips as medium-weight pills", () => {
    expect(components.MuiInputBase?.styleOverrides?.input).toEqual({
      "&::placeholder": { color: "var(--mui-palette-text-secondary)", opacity: 1 },
    });
    expect(components.MuiChip?.styleOverrides?.root).toEqual({
      borderRadius: "9999px",
      fontWeight: 500,
    });
  });

  it("rounds surfaces to the site's radii and gives tooltips an arrow", () => {
    expect(components.MuiPaper?.styleOverrides?.rounded).toEqual({ borderRadius: "12px" });
    expect(components.MuiDialog?.styleOverrides?.paper).toEqual({
      borderRadius: "16px",
      backgroundImage: "none",
    });
    expect(components.MuiMenu?.styleOverrides?.paper).toMatchObject({ minWidth: 220 });
    expect(components.MuiAlert?.styleOverrides?.root).toEqual({ borderRadius: "12px" });
    expect(components.MuiTooltip?.defaultProps?.arrow).toBe(true);
  });
});
