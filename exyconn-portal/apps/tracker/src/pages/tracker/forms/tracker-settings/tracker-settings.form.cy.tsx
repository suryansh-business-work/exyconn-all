import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { TrackerSettingsForm } from './tracker-settings.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
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
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  syncIntervalMinutes: 5,
  consentText: '<p>We track activity during work hours.</p>',
  defaultTimezone: 'Asia/Kolkata',
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

/** The Autocomplete input, reached through its label (MUI generates the input id). */
const timezoneInput = () => cy.contains('label', 'Default timezone').parent().find('input').first();

describe('TrackerSettingsForm', () => {
  it('prefills number fields from the initial settings', () => {
    mount();
    cy.get('input[name="intervalMinutes"]').should('have.value', '10');
    cy.get('input[name="screenshotQuality"]').should('have.value', '60');
  });

  it('hides the webcam corner until a photo is actually being taken', () => {
    mount();
    cy.contains('label', 'Webcam photo corner').should('not.exist');

    cy.contains('label', 'Webcam photo with each screenshot').find('input').check();
    cy.contains('label', 'Webcam photo corner').should('exist');
  });

  it('rejects an out-of-range capture interval', () => {
    mount();
    cy.get('input[name="intervalMinutes"]').clear().type('99');
    cy.contains('button', 'Update').click();
    cy.get('input[name="intervalMinutes"]').should('have.attr', 'aria-invalid', 'true');
  });

  it('prefills the saved default timezone with its UTC offset', () => {
    mount();
    timezoneInput().should('have.value', 'Asia/Kolkata (UTC+05:30)');
  });

  it("offers the device's own timezone as an explicit option", () => {
    mount();
    timezoneInput().clear();
    timezoneInput().type('own timezone');
    cy.contains('li', "Use each device's own timezone").click();
    timezoneInput().should('have.value', "Use each device's own timezone");
  });
});
