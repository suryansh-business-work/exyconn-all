import { LinkForm, LINK_MESSAGES } from './link.form';

const EMPTY = { href: '', openInNewTab: false };

const mount = (initial = EMPTY) =>
  cy.mount(
    <LinkForm
      initial={initial}
      onSubmit={cy.stub().as('submit')}
      onClose={cy.stub().as('close')}
    />,
  );

describe('LinkForm', () => {
  it('requires a URL', () => {
    mount();
    cy.contains('button', 'Add').click();
    cy.contains(LINK_MESSAGES.required).should('be.visible');
    cy.get('@submit').should('not.have.been.called');
  });

  it('rejects an address that is not a link', () => {
    mount();
    cy.get('input[name="href"]').type('javascript:alert(1)');
    cy.contains('button', 'Add').click();
    cy.contains(LINK_MESSAGES.invalid).should('be.visible');
    cy.get('@submit').should('not.have.been.called');
  });

  // One test per address: a loop would queue every mount's stub alias before the first
  // assertion runs, so `@submit` would point at the last stub.
  for (const href of [
    'https://exyconn.com/blog',
    '/contact',
    'mailto:hi@exyconn.com',
    'tel:+91 98765 43210',
  ]) {
    it(`accepts ${href}`, () => {
      mount();
      cy.get('input[name="href"]').type(href);
      cy.contains('button', 'Add').click();
      cy.get('@submit').should('have.been.calledWithMatch', { href, openInNewTab: false });
    });
  }

  it('edits an existing link and can open it in a new tab', () => {
    mount({ href: 'https://exyconn.com', openInNewTab: false });
    cy.contains('Edit link').should('be.visible');
    cy.get('input[name="href"]').should('have.value', 'https://exyconn.com');
    cy.contains('label', 'Open in a new tab').click();
    cy.contains('button', 'Update').click();
    cy.get('@submit').should('have.been.calledWithMatch', {
      href: 'https://exyconn.com',
      openInNewTab: true,
    });
  });

  it('closes on Cancel without submitting', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@close').should('have.been.called');
    cy.get('@submit').should('not.have.been.called');
  });
});
