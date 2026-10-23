import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AddColdEmailVariantDocument, ColdEmailTone } from '@exyconn/shell/graphql/generated';
import { AnotherVariantForm } from './another-variant.form';
import { MAX_INSTRUCTION_CHARS } from './another-variant.types';

const version = (id: string) => ({
  __typename: 'ColdEmailVariant',
  id,
  subject: `Subject ${id}`,
  body: `Body ${id}`,
  instruction: '',
  tone: 'FRIENDLY',
  costUsd: 0.001,
  createdAt: '2026-10-20T10:00:00.000Z',
  sentAt: null,
  sentMessageId: '',
});

const added: MockLink.MockedResponse = {
  request: {
    query: AddColdEmailVariantDocument,
    variables: { id: 'draft-1', instruction: 'shorter', tone: 'FRIENDLY' },
  },
  result: {
    data: {
      addColdEmailVariant: {
        __typename: 'ColdEmailDraft',
        id: 'draft-1',
        object: 'COMPANY',
        recordId: 'co-1',
        recordName: 'Acme',
        toEmail: 'hello@acme.com',
        status: 'DRAFT',
        variantCount: 2,
        createdByName: 'Priya',
        updatedAt: '2026-10-20T10:00:00.000Z',
        goal: 'A free checkout audit',
        tone: 'FRIENDLY',
        createdAt: '2026-10-20T09:00:00.000Z',
        maxVariants: 10,
        variants: [version('v1'), version('v2')],
      },
    },
  },
};

const failed: MockLink.MockedResponse = {
  request: { query: AddColdEmailVariantDocument, variables: () => true },
  error: new Error('AI budget spent'),
};

const mount = (mocks: MockLink.MockedResponse[]) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AnotherVariantForm
            draftId="draft-1"
            tone={ColdEmailTone.Friendly}
            onAdded={cy.stub().as('added')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AnotherVariantForm', () => {
  it('writes another version with the tweak typed and hands back its id', () => {
    mount([added]);
    cy.contains('label', 'What should change').parent().find('input').type('shorter');
    cy.contains('button', 'Generate another version').click();
    cy.get('@added').should('have.been.calledOnceWith', 'v2');
    cy.contains('New version written').should('be.visible');
  });

  it('will not send an instruction that is too long', () => {
    mount([]);
    cy.contains('label', 'What should change')
      .parent()
      .find('input')
      .type('x'.repeat(MAX_INSTRUCTION_CHARS + 1), { delay: 0 });
    cy.contains('button', 'Generate another version').click();
    cy.contains(`Keep the instruction under ${MAX_INSTRUCTION_CHARS} characters`).should(
      'be.visible',
    );
    cy.get('@added').should('not.have.been.called');
  });

  it('says why the AI could not write another version', () => {
    mount([failed]);
    cy.contains('button', 'Generate another version').click();
    cy.contains('AI budget spent').should('be.visible');
    cy.get('@added').should('not.have.been.called');
  });
});
