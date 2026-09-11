import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AiModelPriceForm } from './ai-model-price.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AiModelPriceForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AiModelPriceForm', () => {
  it('requires a model name', () => {
    mount();
    cy.contains('button', 'Save price').click();
    cy.contains('Name the model this price is for').should('be.visible');
  });

  it('rejects a negative price', () => {
    mount();
    cy.get('input[name="model"]').type('gpt-4o-mini');
    cy.get('input[name="inputPer1kUsd"]').clear().type('-1');
    cy.contains('button', 'Save price').click();
    cy.contains('The input price cannot be negative').should('be.visible');
  });

  it('rejects a price that is obviously per million rather than per thousand', () => {
    mount();
    cy.get('input[name="model"]').type('gpt-4o-mini');
    cy.get('input[name="outputPer1kUsd"]').clear().type('600');
    cy.contains('button', 'Save price').click();
    cy.contains('per 1,000 tokens, not per million').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
