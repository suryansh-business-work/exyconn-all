import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CloudResourceForm } from './cloud-resource.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <CloudResourceForm
              initial={null}
              onDone={cy.stub()}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('CloudResourceForm', () => {
  it('requires a name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Give it a name people will recognise').should('be.visible');
  });

  it('refuses a negative monthly cost', () => {
    mount();
    cy.get('input[name="monthlyCost"]').clear().type('-5');
    cy.contains('button', 'Create').click();
    cy.contains('Cost cannot be negative').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
