import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ProductForm } from './product.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ProductForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ProductForm', () => {
  it('validates required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('SKU is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
