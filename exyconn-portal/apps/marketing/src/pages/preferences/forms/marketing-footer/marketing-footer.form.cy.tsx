import { MockedProvider } from '@apollo/client/testing/react';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { SaveMarketingFooterDocument } from '@exyconn/shell/graphql/generated';
import { MarketingFooterForm } from './marketing-footer.form';
import type { MarketingFooterValues } from './marketing-footer.types';

const FOOTER: MarketingFooterValues = {
  companyName: 'Acme Corp',
  contactLine: 'hello@acme.io',
  postalAddress: '12 Park Street, Kolkata',
  privacyUrl: '',
  websiteUrl: '',
  textColor: '#6b7280',
  linkColor: '',
};

const SAVED = {
  request: {
    query: SaveMarketingFooterDocument,
    variables: { input: { ...FOOTER, websiteUrl: 'https://acme.io' } },
  },
  result: {
    data: { saveMarketingFooter: { __typename: 'MarketingFooter', companyName: 'Acme Corp' } },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[SAVED]}>
      <NotificationProvider>
        <main>
          <MarketingFooterForm initial={FOOTER} onSaved={cy.stub().as('saved')} />
        </main>
      </NotificationProvider>
    </MockedProvider>,
  );

describe('MarketingFooterForm', () => {
  it('needs a company name and a postal address', () => {
    mount();
    cy.get('input[name="companyName"]').clear();
    cy.get('textarea[name="postalAddress"]').clear();
    cy.contains('button', 'Save footer').click();
    cy.contains('Add the company name').should('be.visible');
    cy.contains('Marketing law requires a postal address').should('be.visible');
  });

  it('wants full web addresses and hex colours', () => {
    mount();
    cy.get('input[name="privacyUrl"]').type('acme.io/privacy');
    cy.get('input[name="linkColor"]').type('blue');
    cy.contains('button', 'Save footer').click();
    cy.contains('Enter a full web address, starting with https://').should('be.visible');
    cy.contains('Use a colour like #2563eb').should('be.visible');
    cy.get('@saved').should('not.have.been.called');
  });

  it('saves the footer', () => {
    mount();
    cy.get('input[name="websiteUrl"]').type('https://acme.io');
    cy.contains('button', 'Save footer').click();
    cy.contains('Footer saved').should('be.visible');
    cy.get('@saved').should('have.been.calledOnce');
  });

  it('puts the saved footer back on Cancel', () => {
    mount();
    cy.get('input[name="companyName"]').clear().type('Somebody else');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="companyName"]').should('have.value', 'Acme Corp');
  });
});
