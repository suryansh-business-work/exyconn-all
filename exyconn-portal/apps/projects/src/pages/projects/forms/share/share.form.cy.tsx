import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ShareForm } from './share.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ShareForm
            projectId="project-1"
            onCreated={cy.stub().as('created')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ShareForm', () => {
  it('requires a name so one link can be told from another', () => {
    mount();
    cy.contains('button', 'Create link').click();
    cy.contains('Give the link a name so you can tell it apart later').should('be.visible');
  });

  it('keeps the name short enough to read in the list', () => {
    mount();
    cy.get('input[name="label"]').type('a'.repeat(61));
    cy.contains('button', 'Create link').click();
    cy.contains('Keep the name under 60 characters').should('be.visible');
  });

  it('defaults the link to 30 days', () => {
    mount();
    cy.get('input[name="expiresInDays"]').should('have.value', '30');
  });

  it('refuses a link that never expires in practice', () => {
    mount();
    cy.get('input[name="label"]').type('Acme weekly update');
    cy.get('input[name="expiresInDays"]').clear().type('366');
    cy.contains('button', 'Create link').click();
    cy.contains('A link cannot last more than 365 days').should('be.visible');
  });

  it('refuses a link that has already expired', () => {
    mount();
    cy.get('input[name="label"]').type('Acme weekly update');
    cy.get('input[name="expiresInDays"]').clear().type('0');
    cy.contains('button', 'Create link').click();
    cy.contains('A link must last at least a day').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
