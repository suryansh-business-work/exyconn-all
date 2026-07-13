import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { TrackerSettingsForm } from './tracker-settings.form';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';
import type { TrackerSettingsRow } from './tracker-settings.types';

const initial: TrackerSettingsRow = {
  id: 'settings-1',
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  idleThresholdSeconds: 300,
  screenshotMaxWidth: 1280,
  screenshotQuality: 60,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  autoSyncEnabled: true,
  syncIntervalMinutes: 5,
  consentText: '<p>We track activity during work hours.</p>',
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <TrackerSettingsForm initial={initial} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TrackerSettingsForm', () => {
  it('prefills number fields from the initial settings', () => {
    mount();
    cy.get('input[name="intervalMinutes"]').should('have.value', '10');
    cy.get('input[name="screenshotQuality"]').should('have.value', '60');
  });

  it('rejects an out-of-range capture interval', () => {
    mount();
    cy.get('input[name="intervalMinutes"]').clear().type('99');
    cy.contains('button', 'Update').click();
    cy.get('input[name="intervalMinutes"]').should('have.attr', 'aria-invalid', 'true');
  });
});
