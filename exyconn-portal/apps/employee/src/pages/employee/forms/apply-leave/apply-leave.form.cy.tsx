import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ApplyLeaveForm } from './apply-leave.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ApplyLeaveForm onCancel={cy.stub().as('cancel')} onDone={cy.stub()} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ApplyLeaveForm', () => {
  it('requires dates and a reason', () => {
    mount();
    cy.contains('button', 'Apply').click();
    cy.contains('From date is required').should('be.visible');
    cy.contains('Reason is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
