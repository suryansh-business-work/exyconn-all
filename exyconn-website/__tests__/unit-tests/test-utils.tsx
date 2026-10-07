/**
 * Render helpers for the React islands. Files using them start with
 * `// @vitest-environment jsdom`.
 *
 * The site's forms need no provider (MUI falls back to its default theme). The chat embed
 * paints from `palette.chat` and CSS variables, so `renderInChatTheme` wraps it in the theme
 * ChatApp itself mounts — reduced motion on by default, so no transition delays the assertions.
 */
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { createChatTheme } from "../../src/components/chat-embed/theme";
import type { ColorMode } from "../../src/components/chat-embed/types";

export interface ChatThemeOptions extends Omit<RenderOptions, "wrapper"> {
  mode?: ColorMode;
  reducedMotion?: boolean;
}

/** Renders `ui` with a user-event instance bound to it. */
export function renderWithUser(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return { user: userEvent.setup(), ...render(ui, options) };
}

/** Renders a chat-embed component inside the chat's MUI theme. */
export function renderInChatTheme(
  ui: ReactElement,
  { mode = "light", reducedMotion = true, ...options }: ChatThemeOptions = {}
) {
  const theme = createChatTheme(reducedMotion);
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <ThemeProvider theme={theme} defaultMode={mode} storageManager={null}>
        {children}
      </ThemeProvider>
    );
  }
  return { user: userEvent.setup(), ...render(ui, { ...options, wrapper: Wrapper }) };
}
