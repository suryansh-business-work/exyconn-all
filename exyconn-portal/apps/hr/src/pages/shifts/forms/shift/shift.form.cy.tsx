import { MockedProvider } from '@apollo/client/testing';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ShiftForm } from './shift.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ShiftForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ShiftForm', () => {
  it('validates the required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Employee is required').should('be.visible');
    cy.contains('Name is required').should('be.visible');
    cy.contains('Code is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
