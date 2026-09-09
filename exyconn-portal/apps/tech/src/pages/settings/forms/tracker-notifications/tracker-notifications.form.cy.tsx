import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { TrackerNotificationsForm } from './tracker-notifications.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const OPTIONS = [
  { value: 'C1', label: '#builds' },
  { value: 'C2', label: '#status' },
];

const mount = (initial = { slackChannels: [], statusAlertChannels: [] }) =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <TrackerNotificationsForm
            options={OPTIONS}
            initial={initial}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TrackerNotificationsForm', () => {
  it('offers a channel list for builds and one for status alerts', () => {
    mount();
    cy.contains('Channels for tracker builds').should('be.visible');
    cy.contains('Status alerts').should('be.visible');
  });

  it('allows saving no channels at all — the build still publishes, just unannounced', () => {
    mount();
    cy.contains('button', 'Save channels').click();
    cy.contains('Could not save').should('not.exist');
  });

  it('shows the channels already chosen', () => {
    mount({ slackChannels: ['C1'], statusAlertChannels: ['C2'] });
    cy.contains('#builds').should('be.visible');
    cy.contains('#status').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
