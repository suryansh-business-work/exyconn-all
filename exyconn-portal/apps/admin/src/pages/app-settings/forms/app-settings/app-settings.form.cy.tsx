import { MockedProvider } from '@apollo/client/testing/react';
import { timezoneOptionLabel } from '@exyconn/i18n';
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
  defaultLocale: 'en',
  enabledLocales: ['en'],
  autoTranslate: false,
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
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

/**
 * A zone as the picker writes it — "Asia/Kolkata (GMT+05:30)". Read through the same helper
 * the form labels its options with, so the expectation does not drift with the offset when
 * daylight saving moves.
 */
const zoneLabel = (zone: string) => timezoneOptionLabel(zone);

/**
 * The timezone field's own Clear button — every Autocomplete on the form has one, so it is
 * scoped to this field. Forced because MUI keeps the clear indicator hidden until the field
 * is hovered or focused.
 */
const clearTimezone = () =>
  cy.get('input[name="timezone"]').parent().find('button[title="Clear"]').click({ force: true });

describe('AppSettingsForm', () => {
  it('shows the loaded values and previews now through them', () => {
    mount();
    cy.get('input[name="timezone"]').should('have.value', zoneLabel('Asia/Kolkata'));
    cy.get('[data-testid="app-settings-preview"]')
      .invoke('text')
      .should('match', /^\d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2} [AP]M$/);
  });

  it('re-renders the preview when the time format changes', () => {
    mount();
    pick('timeFormat', 'HH:mm');
    cy.get('[data-testid="app-settings-preview"]')
      .invoke('text')
      .should('match', /\d{2}:\d{2}$/)
      .and('not.match', /[ap]m$/i);
  });

  it('requires a timezone', () => {
    mount();
    clearTimezone();
    cy.get('[data-testid="app-settings-preview"]').should('contain', 'Pick a date format');
    cy.contains('button', 'Save changes').click();
    cy.contains('Timezone is required').should('be.visible');
  });

  it('searches the timezone list and previews the pick', () => {
    mount();
    cy.get('input[name="timezone"]').clear().type('Europe/Lon');
    cy.get('ul[role="listbox"]').contains('li', 'Europe/London').click();
    cy.get('input[name="timezone"]').should('have.value', zoneLabel('Europe/London'));
    cy.get('[data-testid="app-settings-preview"]').should('not.contain', 'Pick a date format');
  });

  it('restores the loaded values on cancel', () => {
    mount();
    clearTimezone();
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="timezone"]').should('have.value', zoneLabel('Asia/Kolkata'));
  });
});
