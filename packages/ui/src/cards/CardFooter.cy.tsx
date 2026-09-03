import Button from '@mui/material/Button';
import { CardFooter } from './CardFooter';

describe('CardFooter (branded)', () => {
  it('renders action children', () => {
    cy.mount(
      <CardFooter>
        <Button>Confirm</Button>
      </CardFooter>,
    );
    cy.contains('button', 'Confirm').should('be.visible');
  });

  it('handles clicks on an action inside the footer', () => {
    cy.mount(
      <CardFooter>
        <Button onClick={cy.stub().as('click')}>Confirm</Button>
      </CardFooter>,
    );
    cy.contains('button', 'Confirm').click();
    cy.get('@click').should('have.been.called');
  });
});
