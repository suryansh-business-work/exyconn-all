import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';

/** Options for {@link renderWithProviders}. The providers mirror the shell's `PortalApp`. */
export interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Apollo mocks for MockedProvider. An unmatched operation resolves to an error result. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter opens. Defaults to `/`. */
  route?: string;
  /** Route pattern the UI is mounted under (e.g. `/ai/:tab?`), so `useParams` works. */
  path?: string;
  /** Translations (source string -> text). Empty means `t()` renders the English source. */
  messages?: Messages;
  /** Locale for the I18nProvider. Defaults to `en`. */
  locale?: string;
}

interface WrapperProps {
  children: ReactNode;
}

/**
 * Renders a page or form the way the AI portal mounts it: Apollo (mocked), i18n, the
 * colour-mode MUI theme, MUI X pickers, notifications, confirm dialogs and a memory router.
 */
export function renderWithProviders(
  ui: ReactElement,
  { mocks = [], route = '/', path, messages = {}, locale = 'en', ...options }: ProviderOptions = {},
): RenderResult {
  function Wrapper({ children }: Readonly<WrapperProps>) {
    const content = path ? (
      <Routes>
        <Route path={path} element={children} />
      </Routes>
    ) : (
      children
    );
    return (
      <MockedProvider mocks={mocks}>
        <I18nProvider locale={locale} messages={messages}>
          <ColorModeProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <NotificationProvider>
                <ConfirmProvider>
                  <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
                </ConfirmProvider>
              </NotificationProvider>
            </LocalizationProvider>
          </ColorModeProvider>
        </I18nProvider>
      </MockedProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
