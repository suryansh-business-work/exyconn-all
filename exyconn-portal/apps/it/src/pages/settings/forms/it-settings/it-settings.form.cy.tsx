import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ItSettingsForm } from './it-settings.form';

const settings = {
  __typename: 'ItSettings' as const,
  id: 'settings-1',
  applications: ['Email', 'Slack'],
  onboardingApplications: ['Email'],
  ticketTopics: ['VPN'],
  warrantyWarningDays: 60,
  renewalWarningDays: 30,
  certificateWarningDays: 30,
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ItSettingsForm settings={settings} onSaved={cy.stub()} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ItSettingsForm', () => {
  it('shows the saved applications and topics', () => {
    mount();
    cy.contains('Slack').should('be.visible');
    cy.contains('VPN').should('be.visible');
  });

  it('refuses a warning window of zero days', () => {
    mount();
    cy.get('input[name="warrantyWarningDays"]').clear().type('0');
    cy.contains('button', 'Save settings').click();
    cy.contains('At least one day').should('be.visible');
  });

  it('refuses a warning window beyond a year', () => {
    mount();
    cy.get('input[name="renewalWarningDays"]').clear().type('400');
    cy.contains('button', 'Save settings').click();
    cy.contains('At most 365 days').should('be.visible');
  });
});
