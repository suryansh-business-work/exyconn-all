import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { AppSettingsForm } from './app-settings.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import type { AppSettingsRow } from './app-settings.types';

const INITIAL: AppSettingsRow = {
  id: 'global',
  dateFormat: 'dd MMM yyyy',
  timeFormat: 'hh:mm a',
  timezone: 'Asia/Kolkata',
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AppSettingsForm initial={INITIAL} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/** Opens the MUI select bound to `name` and picks `option` from its listbox. */
const pick = (name: string, option: string) => {
  cy.get(`input[name="${name}"]`).parent().find('[role="combobox"]').click();
  cy.get('ul[role="listbox"]').contains('li', option).click();
};

describe('AppSettingsForm', () => {
  it('shows the loaded values and previews now through them', () => {
    mount();
    cy.get('input[value="Asia/Kolkata"]').should('exist');
    cy.get('[data-testid="app-settings-preview"]')
      .invoke('text')
      .should('match', /^\d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2} [ap]m$/);
  });

  it('re-renders the preview when the time format changes', () => {
    mount();
    pick('timeFormat', 'HH:mm');
    cy.get('[data-testid="app-settings-preview"]')
      .invoke('text')
      .should('match', /\d{2}:\d{2}$/)
      .and('not.match', /[ap]m$/);
  });

  it('requires a timezone', () => {
    mount();
    cy.get('button[title="Clear"]').click({ force: true });
    cy.get('[data-testid="app-settings-preview"]').should('contain', 'Pick a date format');
    cy.contains('button', 'Save changes').click();
    cy.contains('Timezone is required').should('be.visible');
  });

  it('searches the timezone list and previews the pick', () => {
    mount();
    cy.get('input[value="Asia/Kolkata"]').clear().type('Europe/Lon');
    cy.get('ul[role="listbox"]').contains('li', 'Europe/London').click();
    cy.get('input[value="Europe/London"]').should('exist');
    cy.get('[data-testid="app-settings-preview"]').should('not.contain', 'Pick a date format');
  });

  it('restores the loaded values on cancel', () => {
    mount();
    cy.get('button[title="Clear"]').click({ force: true });
    cy.contains('button', 'Cancel').click();
    cy.get('input[value="Asia/Kolkata"]').should('exist');
  });
});
