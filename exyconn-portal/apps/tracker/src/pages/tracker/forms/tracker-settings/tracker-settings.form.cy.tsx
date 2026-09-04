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
  screenshotRetentionDays: 0,
  autoStartEnabled: false,
  autoStartHour: 9,
  autoStopHour: 18,
  dailyDigestEnabled: false,
  weeklyDigestEnabled: false,
  digestHour: 9,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  syncIntervalMinutes: 5,
  consentText: '<p>We track activity during work hours.</p>',
  consentPolicySlug: '',
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

  it('opens with retention off, so nothing is deleted until an admin chooses a window', () => {
    mount();
    cy.get('input[name="screenshotRetentionDays"]').should('have.value', '0');
  });

  it('rejects a retention window longer than the schema allows', () => {
    mount();
    cy.get('input[name="screenshotRetentionDays"]').clear().type('99999');
    cy.contains('button', 'Update').click();
    cy.get('input[name="screenshotRetentionDays"]').should('have.attr', 'aria-invalid', 'true');
  });

  it('hides the tracking window until the schedule is switched on', () => {
    mount();
    cy.contains('label', 'Start at (hour, 0–23)').should('not.exist');

    cy.contains('label', 'Start tracking automatically').find('input').check();
    cy.contains('label', 'Start at (hour, 0–23)').should('exist');
  });

  it('calls out a window that runs past midnight', () => {
    mount();
    cy.contains('label', 'Start tracking automatically').find('input').check();
    cy.get('input[name="autoStartHour"]').clear().type('22');
    cy.get('input[name="autoStopHour"]').clear().type('6');
    cy.contains('runs past midnight').should('exist');
  });

  it('hides the send hour until a digest is actually switched on', () => {
    mount();
    cy.contains('label', 'Send at (hour, 0–23)').should('not.exist');

    cy.contains('label', 'Email a daily summary').find('input').check();
    cy.contains('label', 'Send at (hour, 0–23)').should('exist');
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
