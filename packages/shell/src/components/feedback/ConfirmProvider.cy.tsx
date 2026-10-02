import { Button } from '@/components/ui';
import { ConfirmProvider, useConfirm } from './ConfirmProvider';

function Harness({ destructive }: Readonly<{ destructive: boolean }>) {
  const confirm = useConfirm();
  return (
    <Button
      onClick={() => {
        confirm({ message: 'Delete "Acme"?', confirmText: 'Delete', destructive })
          .then((ok) => {
            document.title = ok ? 'confirmed' : 'declined';
          })
          .catch(() => undefined);
      }}
    >
      Open
    </Button>
  );
}

const mountWith = (destructive: boolean) =>
  cy.mount(
    <ConfirmProvider>
      <Harness destructive={destructive} />
    </ConfirmProvider>,
  );

describe('ConfirmProvider', () => {
  it('wears the error colour when what it confirms is destructive', () => {
    mountWith(true);
    cy.contains('button', 'Open').click();
    cy.contains('button', 'Delete').should('have.class', 'MuiButton-colorError').click();
    cy.title().should('eq', 'confirmed');
  });

  it('stays the primary colour otherwise, and cancelling answers no', () => {
    mountWith(false);
    cy.contains('button', 'Open').click();
    cy.contains('button', 'Delete').should('have.class', 'MuiButton-colorPrimary');
    cy.contains('button', 'Cancel').click();
    cy.title().should('eq', 'declined');
  });
});
