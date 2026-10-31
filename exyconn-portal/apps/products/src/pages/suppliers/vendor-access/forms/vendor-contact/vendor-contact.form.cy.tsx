import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AddVendorContactDocument } from '@exyconn/shell/graphql/generated';
import { VendorContactForm } from './vendor-contact.form';

const input = { supplierId: 'supplier-1', name: 'Sam Lee', email: 'sam@acme.test' };

const added: MockLink.MockedResponse = {
  request: { query: AddVendorContactDocument, variables: { input } },
  result: {
    data: { addVendorContact: { __typename: 'VendorContact', id: 'vc-1', email: input.email } },
  },
};

const taken: MockLink.MockedResponse = {
  request: { query: AddVendorContactDocument, variables: { input } },
  error: new Error('That email already has vendor portal access.'),
};

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <VendorContactForm supplierId="supplier-1" onAdded={cy.stub().as('added')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const fill = (name: string, email: string) => {
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(email);
};

describe('VendorContactForm', () => {
  it('requires a name and an email', () => {
    mount();
    cy.contains('button', 'Give access').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
  });

  it('rejects a malformed email', () => {
    mount();
    fill('Sam Lee', 'sam-at-acme');
    cy.contains('button', 'Give access').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('keeps the name under 120 characters', () => {
    mount();
    fill('x'.repeat(121), 'sam@acme.test');
    cy.contains('button', 'Give access').click();
    cy.contains('Keep the name under 120 characters').should('be.visible');
  });

  it('gives access, says who was emailed and clears the form', () => {
    mount([added]);
    fill('Sam Lee', 'sam@acme.test');
    cy.contains('button', 'Give access').click();
    cy.contains('Access given — sam@acme.test has been emailed').should('be.visible');
    cy.get('@added').should('have.been.calledOnce');
    cy.get('input[name="email"]').should('have.value', '');
  });

  it('shows the server refusal and keeps what was typed', () => {
    mount([taken]);
    fill('Sam Lee', 'sam@acme.test');
    cy.contains('button', 'Give access').click();
    cy.contains('That email already has vendor portal access.').should('be.visible');
    cy.get('@added').should('not.have.been.called');
    cy.get('input[name="email"]').should('have.value', 'sam@acme.test');
  });
});
