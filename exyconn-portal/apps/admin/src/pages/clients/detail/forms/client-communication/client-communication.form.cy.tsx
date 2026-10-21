import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/shell/components/ui';
import { theme } from '@exyconn/shell/config/theme';
import { ClientCommunicationForm } from './client-communication.form';

const mount = (notifiedAt: string | null = null) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ClientCommunicationForm
              clientId="client-1"
              initial={
                notifiedAt === null
                  ? null
                  : {
                      __typename: 'ClientCommunication',
                      id: 'comm-1',
                      clientId: 'client-1',
                      type: 'CALL' as never,
                      occurredAt: '2026-10-02T10:30:00.000Z',
                      subject: 'Kick-off',
                      summary: '',
                      details: '',
                      participants: '',
                      loggedByName: 'Arjun',
                      notifiedAt,
                    }
              }
              onDone={cy.stub()}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ClientCommunicationForm', () => {
  it('requires a subject and caps the summary', () => {
    mount();
    cy.get('textarea[name="summary"]').type('x'.repeat(2001), { delay: 0 });
    cy.contains('button', 'Create').click();
    cy.contains('Say what it was about').should('be.visible');
    cy.contains('Keep the summary under 2000 characters').should('be.visible');
  });

  it('offers to email the client only until they have been told', () => {
    mount();
    cy.contains("Email the client's hub contacts about it").should('be.visible');
    mount('2026-10-02T11:00:00.000Z');
    cy.contains("Email the client's hub contacts about it").should('not.exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
