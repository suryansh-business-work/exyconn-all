import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { BillingKeyConfigForm } from './billing-key-config.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <BillingKeyConfigForm
            initial={null}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BillingKeyConfigForm', () => {
  it('needs a label and a key for a new billing key', () => {
    mount();
    cy.contains('button', /^Create/).click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('The billing key is required').should('be.visible');
  });

  it('reads OpenAI bills by default', () => {
    mount();
    cy.get('input[name="provider"]').should('have.value', 'OPENAI');
  });

  it('hands control back on Cancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
