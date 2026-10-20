import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { MaLanguage, MaReleaseChannel, MaSummaryStyle } from '@exyconn/shell/graphql/generated';
import { MeetingSettingsForm } from './meeting-settings.form';
import type { MeetingSettingsRow } from './meeting-settings.types';

const SETTINGS: MeetingSettingsRow = {
  enabled: true,
  saveRecordings: true,
  audioRetentionDays: 90,
  allowedUserIds: [],
  remindersEnabled: true,
  reminderIntervalMinutes: 5,
  maxRemindersPerMeeting: 3,
  preferredLanguage: MaLanguage.Auto,
  summaryStyle: MaSummaryStyle.Detailed,
  transcriptRetentionDays: 365,
  autoGenerateSummary: true,
  autoEmail: false,
  emailRequiresApproval: true,
  defaultRecipients: [],
  emailParticipants: true,
  emailAllowedDomains: [],
  analysisModel: 'gpt-analysis',
  transcriptionModel: 'gpt-transcribe',
  diarization: true,
  monthlyBudgetUsd: 50,
  maxMeetingMinutes: 240,
  participantTracking: true,
  liveTranscript: false,
  releaseChannel: MaReleaseChannel.Stable,
  monthSpendUsd: 0,
  updatedByName: '',
  updatedAt: null,
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <MeetingSettingsForm settings={SETTINGS} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('MeetingSettingsForm', () => {
  it('holds the numbers to the server limits', () => {
    mount();
    cy.get('input[name="maxRemindersPerMeeting"]').clear().type('31');
    cy.get('input[name="transcriptRetentionDays"]').clear().type('4000');
    cy.get('input[name="audioRetentionDays"]').clear().type('-1');
    cy.get('input[name="maxMeetingMinutes"]').clear().type('4');
    cy.get('input[name="monthlyBudgetUsd"]').clear().type('-5');
    cy.contains('button', 'Save settings').click();
    cy.contains('Between 1 and 30').should('be.visible');
    cy.contains('Between 5 and 1,440 minutes').should('be.visible');
    cy.contains('The budget cannot be negative').should('be.visible');
    cy.contains('Between 0 and 3,650 days').should('be.visible');
  });

  it('only takes email addresses as recipients and bare domains as domains', () => {
    mount();
    cy.contains('label', 'Always send to').parent().find('input').type('not-an-email{enter}');
    cy.contains('label', 'Only send to these domains')
      .parent()
      .find('input')
      .type('https://example.com{enter}');
    cy.contains('button', 'Save settings').click();
    cy.contains('Every recipient must be an email address').should('be.visible');
    cy.contains('Enter domains like example.com').should('be.visible');
  });

  it('requires both model names', () => {
    mount();
    cy.get('input[name="analysisModel"]').clear();
    cy.get('input[name="transcriptionModel"]').clear();
    cy.contains('button', 'Save settings').click();
    cy.contains('The analysis model is required').should('be.visible');
    cy.contains('The transcription model is required').should('be.visible');
  });

  it('puts every value back on Cancel', () => {
    mount();
    cy.get('input[name="maxMeetingMinutes"]').clear().type('60');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="maxMeetingMinutes"]').should('have.value', '240');
  });
});
