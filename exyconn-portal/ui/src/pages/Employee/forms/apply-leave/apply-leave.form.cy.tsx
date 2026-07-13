import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { ApplyLeaveForm } from './apply-leave.form';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

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
