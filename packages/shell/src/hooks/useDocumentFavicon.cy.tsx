import { useDocumentFavicon } from './useDocumentFavicon';

function Harness({ href }: Readonly<{ href: string }>) {
  useDocumentFavicon(href);
  return null;
}

describe('useDocumentFavicon', () => {
  beforeEach(() => {
    cy.document().then((doc) => {
      doc.querySelector('link[rel="icon"]')?.remove();
      const link = doc.createElement('link');
      link.rel = 'icon';
      link.href = 'https://example.com/default.svg';
      doc.head.appendChild(link);
    });
  });

  it('points the tab icon at the branding favicon', () => {
    cy.mount(<Harness href="https://example.com/brand.png" />);
    cy.get('link[rel="icon"]').should('have.attr', 'href', 'https://example.com/brand.png');
  });

  it('keeps the default when there is none', () => {
    cy.mount(<Harness href="" />);
    cy.get('link[rel="icon"]').should('have.attr', 'href', 'https://example.com/default.svg');
  });
});
