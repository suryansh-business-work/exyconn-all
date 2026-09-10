import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { AssetForm } from './asset.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AssetForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AssetForm', () => {
  it('requires an asset tag and a name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Asset tag is required').should('be.visible');
    cy.contains('Name is required').should('be.visible');
  });

  it('keeps the asset tag short enough to fit on the label', () => {
    mount();
    cy.get('input[name="assetTag"]').type('A'.repeat(41));
    cy.contains('button', 'Create').click();
    cy.contains('Asset tag is too long').should('be.visible');
  });

  it('refuses a negative purchase cost', () => {
    mount();
    cy.get('input[name="assetTag"]').type('LAP-001');
    cy.get('input[name="name"]').type('ThinkPad X1');
    cy.get('input[name="purchaseCost"]').clear().type('-100');
    cy.contains('button', 'Create').click();
    cy.contains('Cost cannot be negative').should('be.visible');
  });

  it('does not crash when a purchase date is typed by hand', () => {
    mount();
    cy.get('input[name="purchaseDate"]').type('12/01/2026');
    cy.get('input[name="assetTag"]').should('exist');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
