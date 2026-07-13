import { mount } from 'cypress/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { theme } from '../../src/config/theme';
import './commands';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: (node: ReactNode) => ReturnType<typeof mount>;
    }
  }
}

/**
 * App-wide providers every component spec needs: the MUI theme and the MUIX
 * date adapter (so date pickers render). MockedProvider/NotificationProvider
 * stay per-spec where their mocks differ.
 */
Cypress.Commands.add('mount', (node: ReactNode) =>
  mount(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>{node}</LocalizationProvider>
    </ThemeProvider>,
  ),
);
