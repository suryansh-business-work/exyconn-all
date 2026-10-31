import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { MeetingBotTripForm } from './meeting-bot-trip.form';

const TERMS = 'The recording is deleted after 7 days.';

/** Mounts the form; sending resolves to `sent` (whether the bot went), recorded as `@send`. */
const mount = (sent: boolean, disabled = false) =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <MeetingBotTripForm
        consentText={TERMS}
        busy={false}
        disabled={disabled}
        onSend={cy.stub().as('send').resolves(sent)}
      />
    </ThemeProvider>,
  );

describe('MeetingBotTripForm', () => {
  it('shows the recording terms and requires a Meet link and agreement', () => {
    mount(true);
    cy.contains(TERMS).should('be.visible');
    cy.contains('button', 'Send the bot to my call').click();
    cy.contains('Paste the Google Meet link').should('be.visible');
    cy.contains('Agree to the recording terms to send the bot').should('be.visible');
    cy.get('@send').should('not.have.been.called');
  });

  it('refuses a link that is not Google Meet', () => {
    mount(true);
    cy.get('input[name="meetUrl"]').type('https://zoom.us/j/123');
    cy.get('input[name="consent"]').check();
    cy.contains('button', 'Send the bot to my call').click();
    cy.contains('Use a Google Meet link').should('be.visible');
    cy.get('@send').should('not.have.been.called');
  });

  it('sends a valid link with agreement, then clears the form', () => {
    mount(true);
    cy.get('input[name="meetUrl"]').type('https://meet.google.com/abc-defg-hij');
    cy.get('input[name="consent"]').check();
    cy.contains('button', 'Send the bot to my call').click();
    cy.get('@send').should('have.been.calledWith', {
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      consent: true,
    });
    cy.get('input[name="meetUrl"]').should('have.value', '');
  });

  it('keeps the link when sending fails', () => {
    mount(false);
    cy.get('input[name="meetUrl"]').type('https://meet.google.com/abc-defg-hij');
    cy.get('input[name="consent"]').check();
    cy.contains('button', 'Send the bot to my call').click();
    cy.get('@send').should('have.been.calledOnce');
    cy.get('input[name="meetUrl"]').should('have.value', 'https://meet.google.com/abc-defg-hij');
  });

  it('cannot send while the demo is unavailable', () => {
    mount(true, true);
    cy.contains('button', 'Send the bot to my call').should('be.disabled');
  });
});
