import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CostCenterForm } from './cost-center.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <CostCenterForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('CostCenterForm', () => {
  it('requires a code and a name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Code must be at least 2 characters').should('be.visible');
    cy.contains('Name is required').should('be.visible');
  });

  it('rejects a code with characters nobody can quote', () => {
    mount();
    cy.get('input[name="code"]').type('ENG/APAC');
    cy.get('input[name="name"]').type('Engineering');
    cy.contains('button', 'Create').click();
    cy.contains('Letters, digits and hyphens only').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
