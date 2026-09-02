import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { MarkAttendanceForm } from './mark-attendance.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <MarkAttendanceForm onCancel={cy.stub().as('cancel')} onDone={cy.stub()} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('MarkAttendanceForm', () => {
  it('renders the status field with a default', () => {
    mount();
    cy.contains('label', 'Status').should('exist');
    cy.contains('button', 'Save').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
