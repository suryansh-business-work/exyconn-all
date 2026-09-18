import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ItAccessKind } from '@exyconn/shell/graphql/generated';
import { AccessRequestForm } from './access-request.form';

const mount = (kind: ItAccessKind, lockKind = false) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <AccessRequestForm
              initial={null}
              kind={kind}
              lockKind={lockKind}
              onDone={cy.stub()}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AccessRequestForm', () => {
  it('requires the employee, the application and a reason', () => {
    mount(ItAccessKind.Grant);
    cy.contains('button', 'Create').click();
    cy.contains('Pick the employee').should('be.visible');
    cy.contains('Pick the application').should('be.visible');
    cy.contains('Say why it is needed').should('be.visible');
  });

  it('points to settings when no applications are configured', () => {
    mount(ItAccessKind.Grant);
    cy.contains('Add applications in IT Admin Settings first').should('be.visible');
  });

  it('asks no role or expiry for a password reset', () => {
    mount(ItAccessKind.PasswordReset, true);
    cy.contains('Role or level').should('not.exist');
    cy.contains('Temporary until').should('not.exist');
  });

  it('calls onCancel', () => {
    mount(ItAccessKind.Grant);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
