import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { OrganizationForm } from './organization.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <OrganizationForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('OrganizationForm', () => {
  it('asks for the company name and the standards its portal runs in', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Company name is required').should('be.visible');
    cy.contains('Pick the country the company operates in').should('be.visible');
    cy.contains('Pick the currency it keeps books in').should('be.visible');
  });

  it('refuses a handle that is not URL-safe', () => {
    mount();
    cy.get('input[name="slug"]').type('Acme Ltd!');
    cy.contains('button', 'Create').click();
    cy.contains('Use lowercase letters, digits and dashes').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
