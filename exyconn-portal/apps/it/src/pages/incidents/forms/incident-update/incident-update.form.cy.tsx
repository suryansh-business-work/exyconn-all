import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ItIncidentStatus } from '@exyconn/shell/graphql/generated';
import { IncidentUpdateForm } from './incident-update.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <IncidentUpdateForm
            incidentId="incident-1"
            status={ItIncidentStatus.Investigating}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('IncidentUpdateForm', () => {
  it('requires a note', () => {
    mount();
    cy.contains('button', 'Post update').click();
    cy.contains('Say what happened').should('be.visible');
  });

  it('starts at the incident’s current status', () => {
    mount();
    cy.contains(/investigating/i).should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
