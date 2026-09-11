import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SuppressionForm } from './suppression.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SuppressionForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SuppressionForm', () => {
  it('requires an email address', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Email is required').should('be.visible');
  });

  it('rejects a malformed address', () => {
    mount();
    cy.get('input[name="email"]').type('not-an-email');
    cy.contains('button', 'Create').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('says what adding the address means', () => {
    mount();
    cy.contains('No campaign will ever be sent to this address again.').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
