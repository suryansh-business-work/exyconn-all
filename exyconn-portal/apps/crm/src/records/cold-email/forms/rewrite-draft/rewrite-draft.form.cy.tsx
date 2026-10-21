import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  FirecrawlReadyDocument,
  RewriteColdEmailDraftDocument,
} from '@exyconn/shell/graphql/generated';
import { RewriteDraftForm } from './rewrite-draft.form';

const firecrawl = (ready: boolean): MockLink.MockedResponse => ({
  request: { query: FirecrawlReadyDocument },
  result: { data: { firecrawlReady: ready } },
});

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

const rewritten = (readWebsite: boolean): MockLink.MockedResponse => ({
  request: { query: RewriteColdEmailDraftDocument, variables: { id: 'draft-1', readWebsite } },
  delay: 300,
  result: {
    data: {
      rewriteColdEmailDraft: {
        __typename: 'ColdEmailDraft',
        id: 'draft-1',
        object: 'COMPANY',
        recordId: 'co-1',
        recordName: 'Acme',
        toEmail: 'hello@acme.com',
        status: 'DRAFT',
        variantCount: 3,
        createdByName: 'Priya',
        updatedAt: '2026-10-20T10:00:00.000Z',
        goal: 'A free checkout audit',
        tone: 'FRIENDLY',
        createdAt: '2026-10-20T09:00:00.000Z',
        maxVariants: 10,
        variants: [version('v1'), version('v2'), version('v3')],
      },
    },
  },
});

const failed: MockLink.MockedResponse = {
  request: { query: RewriteColdEmailDraftDocument, variables: () => true },
  error: new Error('AI budget spent'),
};

const mount = (mocks: MockLink.MockedResponse[], count = 4) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RewriteDraftForm
            draftId="draft-1"
            count={count}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('RewriteDraftForm', () => {
  it('says how many versions it writes and offers no website read without Firecrawl', () => {
    mount([firecrawl(false)], 2);
    cy.contains('writes 2 new versions. The current versions stay.').should('be.visible');
    cy.contains('Rewriting runs the AI once and spends AI budget.').should('be.visible');
    cy.contains('Read their website again').should('not.exist');
  });

  it('rewrites from the latest data, showing progress, and hands back the draft', () => {
    mount([firecrawl(false), rewritten(false)]);
    cy.contains('button', 'Rewrite').click();
    cy.contains('The AI is writing 4 versions.').should('be.visible');
    cy.get('@done').should('have.been.calledOnce');
    cy.get('@done').its('firstCall.args.0.variants').should('have.length', 3);
    cy.contains('New versions written from the latest data').should('be.visible');
  });

  it('reads their website again when switched on', () => {
    mount([firecrawl(true), rewritten(true)]);
    cy.contains('Reads their website through Firecrawl').should('be.visible');
    cy.contains('label', 'Read their website again').click();
    cy.contains('button', 'Rewrite').click();
    cy.get('@done').should('have.been.calledOnce');
  });

  it('says why the AI could not rewrite and stays open', () => {
    mount([firecrawl(false), failed]);
    cy.contains('button', 'Rewrite').click();
    cy.contains('AI budget spent').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount([firecrawl(false)]);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
