import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@exyconn/ui';

/** Wraps a mount in the Exyconn MUI theme, the way the apps that consume this package do. */
function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

/** `render` from Testing Library with the Exyconn theme around the element. */
export const renderWithTheme = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: Providers, ...options });
