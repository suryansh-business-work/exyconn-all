import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ProductForm } from './product.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ProductStatus } from '@exyconn/shell/graphql/generated';
import type { ProductRow } from './product.types';

const existing: ProductRow = {
  id: 'p1',
  name: 'Desk lamp',
  sku: 'LAMP-1',
  price: 1200,
  category: 'Office',
  stock: 4,
  reorderLevel: 5,
  status: ProductStatus.Active,
};

const mount = (initial: ProductRow | null = null) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ProductForm initial={initial} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
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

  it('asks for opening stock only on create', () => {
    mount();
    cy.contains('label', 'Opening stock').should('exist');
    cy.contains('label', 'Reorder level').should('exist');
  });

  it('hides stock on edit so the ledger stays the only way to move it', () => {
    mount(existing);
    cy.contains('label', 'Opening stock').should('not.exist');
    cy.contains('label', 'Reorder level').should('exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
