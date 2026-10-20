import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
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
  it('asks only for the company name and its currency; the country is optional', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Company name is required').should('be.visible');
    cy.contains('Currency is required').should('be.visible');
    cy.contains('Pick a country from the list').should('not.exist');
  });

  it('refuses a website that is not a full link', () => {
    mount();
    cy.get('input[name="website"]').type('acme.example');
    cy.contains('button', 'Create').click();
    cy.contains('Enter a full link starting with https://').should('be.visible');
  });

  it('asks for the name of each person to invite', () => {
    mount();
    cy.contains('button', 'Add a person').click();
    cy.contains('button', 'Create').click();
    cy.contains('Enter their name').should('be.visible');
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
