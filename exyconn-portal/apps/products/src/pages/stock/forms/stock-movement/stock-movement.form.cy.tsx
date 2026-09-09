import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { StockMovementForm } from './stock-movement.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <StockMovementForm onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('StockMovementForm', () => {
  it('requires a product to move stock against', () => {
    mount();
    cy.contains('button', 'Record').click();
    cy.contains('Choose a product').should('be.visible');
  });

  it('moves whole units only', () => {
    mount();
    cy.get('input[name="quantity"]').clear().type('1.5');
    cy.contains('button', 'Record').click();
    cy.contains('Whole units only').should('be.visible');
  });

  it('refuses a movement of nothing', () => {
    mount();
    cy.get('input[name="quantity"]').clear().type('0');
    cy.contains('button', 'Record').click();
    cy.contains('Quantity must be at least 1').should('be.visible');
  });

  it('asks for a product before it can say what the movement would do to the level', () => {
    mount();
    cy.contains('Choose a product to see the effect.').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
