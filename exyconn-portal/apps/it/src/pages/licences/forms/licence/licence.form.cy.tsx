import { MockedProvider } from '@apollo/client/testing';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { LicenceForm } from './licence.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <LicenceForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('LicenceForm', () => {
  it('validates the required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Vendor is required').should('be.visible');
  });

  it('will not take fewer than one seat', () => {
    mount();
    cy.get('input[name="seatsTotal"]').clear().type('0');
    cy.contains('button', 'Create').click();
    cy.contains('A licence needs at least one seat').should('be.visible');
  });

  it('shows how many of the bought seats are in use', () => {
    mount();
    cy.contains('0 of 1 seat(s) in use').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
