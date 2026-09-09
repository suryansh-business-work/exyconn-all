import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { CompanyForm } from './company.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <CompanyForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('CompanyForm', () => {
  it('requires a name, a domain and an owner', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Domain is required').should('be.visible');
    cy.contains('Owner is required').should('be.visible');
  });

  it('rejects a domain pasted as a full URL', () => {
    mount();
    cy.get('input[name="name"]').type('Exyconn');
    cy.get('input[name="owner"]').type('Priya');
    cy.get('input[name="domain"]').type('https://exyconn.com/about');
    cy.contains('button', 'Create').click();
    cy.contains('Enter the domain on its own, e.g. exyconn.com').should('be.visible');
  });

  it('accepts a bare domain', () => {
    mount();
    cy.get('input[name="name"]').type('Exyconn');
    cy.get('input[name="owner"]').type('Priya');
    cy.get('input[name="domain"]').type('exyconn.com');
    cy.contains('button', 'Create').click();
    cy.contains('Enter the domain on its own, e.g. exyconn.com').should('not.exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
