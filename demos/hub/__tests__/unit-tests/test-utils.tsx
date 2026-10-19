import type { ReactElement, ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { I18nProvider } from '@exyconn/i18n';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';

/** What the hub's `App` puts above its page: Apollo (mocked here), i18n and the colour mode. */
function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <MockedProvider mocks={[]} showWarnings={false}>
      <I18nProvider locale="en" messages={{}}>
        <ColorModeProvider>{children}</ColorModeProvider>
      </I18nProvider>
    </MockedProvider>
  );
}

/** `render` with the hub's providers around the element. */
export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: Providers });
}
